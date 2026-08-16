import { createClient } from '@supabase/supabase-js';

export async function ensureAdminAccountExists() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcxsubomvlldjabbodzy.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_barkazn_jP7nBwnHbVDEOQ_zLnnA7uj';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'muhammedameenpk085@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { success: false, message: 'ADMIN_PASSWORD is not configured' };
  }

  // 1. Try Service Role Client first if present
  if (serviceRoleKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: userList, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!listErr && userList?.users) {
        let adminUser = userList.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());

        if (adminUser) {
          // Update password and metadata for existing Admin user
          await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
            password: adminPassword,
            email_confirm: true,
            user_metadata: { full_name: 'Platform Administrator', role: 'ADMIN' },
          });
        } else {
          // Create Admin user if not present
          const { data: newUserData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { full_name: 'Platform Administrator', role: 'ADMIN' },
          });
          if (!createErr && newUserData.user) {
            adminUser = newUserData.user;
          }
        }

        if (adminUser) {
          await supabaseAdmin.from('profiles').upsert({
            id: adminUser.id,
            email: adminEmail,
            full_name: 'Platform Administrator',
            role: 'ADMIN',
            status: 'ACTIVE',
          }, { onConflict: 'id' });

          return {
            success: true,
            message: 'Admin account password & profile updated via Service Role API',
            userId: adminUser.id,
            email: adminEmail,
          };
        }
      }
    } catch (err: any) {
      // Fallback if Service Role fails or is invalid
    }
  }

  // 2. Standard Client Fallback
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Check if admin can sign in with current configured password
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (!signInErr && signInData.user) {
    await supabase.from('profiles').upsert({
      id: signInData.user.id,
      email: adminEmail,
      full_name: 'Platform Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    }, { onConflict: 'id' });

    return {
      success: true,
      message: 'Admin account verified & authenticated successfully',
      userId: signInData.user.id,
      email: adminEmail,
    };
  }

  return {
    success: false,
    message: signInErr?.message || 'Failed to authenticate or update Admin account',
  };
}
