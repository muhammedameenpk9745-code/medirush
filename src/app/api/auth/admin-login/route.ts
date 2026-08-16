import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const envAdminEmail = process.env.ADMIN_EMAIL || 'muhammedameenpk085@gmail.com';
    const envAdminPassword = process.env.ADMIN_PASSWORD || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const isMatch =
      email.trim().toLowerCase() === envAdminEmail.trim().toLowerCase() &&
      password === envAdminPassword;

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid login credentials' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcxsubomvlldjabbodzy.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_barkazn_jP7nBwnHbVDEOQ_zLnnA7uj';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let response = NextResponse.json({
      success: true,
      role: 'ADMIN',
      targetPath: '/admin',
    });

    const cookieStore: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          const cookie = request.headers.get('cookie');
          if (!cookie) return undefined;
          const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
          return match ? decodeURIComponent(match[1]) : undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.push({ name, value, options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.push({ name, value: '', options });
        },
      },
    });

    // Try standard sign in with password
    let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If sign in fails due to pending confirmation or password mismatch on Supabase Auth server, use Service Role or admin session initialization
    if (signInErr || !signInData.user) {
      if (serviceRoleKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          let adminUser: any = userList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

          if (adminUser) {
            await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
              password,
              email_confirm: true,
              user_metadata: { full_name: 'Platform Administrator', role: 'ADMIN' },
            });
          } else {
            const { data: created } = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { full_name: 'Platform Administrator', role: 'ADMIN' },
            });
            adminUser = created?.user;
          }

          if (adminUser) {
            await supabaseAdmin.from('profiles').upsert({
              id: adminUser.id,
              email,
              full_name: 'Platform Administrator',
              role: 'ADMIN',
              status: 'ACTIVE',
            }, { onConflict: 'id' });

            // Re-attempt sign in
            const retry = await supabase.auth.signInWithPassword({ email, password });
            signInData = retry.data;
          }
        } catch {
          // Silent catch
        }
      }
    }

    // Ensure profiles table record has role = ADMIN and status = ACTIVE
    if (signInData?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: signInData.user.id,
          email,
          full_name: 'Platform Administrator',
          role: 'ADMIN',
          status: 'ACTIVE',
        }, { onConflict: 'id' });
      } catch {}
    }

    // Apply set-cookie headers to response
    cookieStore.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Admin authentication failed' }, { status: 500 });
  }
}
