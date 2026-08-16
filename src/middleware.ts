import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 1. PUBLIC EXEMPTIONS
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/stores') ||
    pathname === '/seller/register' ||
    pathname === '/seller/pending' ||
    pathname === '/delivery/register' ||
    pathname === '/delivery/pending';

  if (isPublicRoute && !user) {
    return response;
  }

  // 2. UNAUTHENTICATED USER ROUTE SECURITY
  const isProtectedPath =
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/profile') ||
    (pathname.startsWith('/seller') && pathname !== '/seller/register' && pathname !== '/seller/pending') ||
    (pathname.startsWith('/delivery') && pathname !== '/delivery/register' && pathname !== '/delivery/pending') ||
    pathname.startsWith('/admin');

  if (!user && isProtectedPath) {
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);

      if (pathname.startsWith('/seller')) {
        loginUrl.searchParams.set('role', 'SELLER');
      } else if (pathname.startsWith('/delivery')) {
        loginUrl.searchParams.set('role', 'DELIVERY_PARTNER');
      } else if (pathname.startsWith('/admin')) {
        loginUrl.searchParams.set('role', 'ADMIN');
      }

      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. ROLE-BASED AUTHORIZATION CHECKS FOR AUTHENTICATED USERS
  if (user) {
    let role = (user.user_metadata?.role || user.app_metadata?.role || 'CUSTOMER') as string;

    try {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profErr && prof?.role) {
        role = prof.role;
      }
    } catch {
      // Fallback to user_metadata role
    }

    // 3A. SELLER ROUTES (/seller/*)
    if (pathname.startsWith('/seller') && pathname !== '/seller/register' && pathname !== '/seller/pending') {
      if (role !== 'SELLER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      if (role === 'SELLER') {
        const { data: store } = await supabase
          .from('medical_stores')
          .select('verification_status')
          .eq('owner_profile_id', user.id)
          .maybeSingle();

        if (store && store.verification_status === 'PENDING') {
          return NextResponse.redirect(new URL('/seller/pending', request.url));
        }
      }
    }

    // 3B. DELIVERY ROUTES (/delivery/*)
    if (pathname.startsWith('/delivery') && pathname !== '/delivery/register' && pathname !== '/delivery/pending') {
      if (role !== 'DELIVERY_PARTNER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      if (role === 'DELIVERY_PARTNER') {
        const { data: partner } = await supabase
          .from('delivery_partners')
          .select('verification_status')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (partner && partner.verification_status === 'PENDING') {
          return NextResponse.redirect(new URL('/delivery/pending', request.url));
        }
      }
    }

    // 3C. ADMIN ROUTES (/admin/*)
    if (pathname.startsWith('/admin')) {
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/cart/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/seller/:path*',
    '/delivery/:path*',
    '/admin/:path*',
  ],
};
