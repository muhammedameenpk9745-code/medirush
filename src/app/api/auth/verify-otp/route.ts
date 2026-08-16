import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyEmailOtp } from '@/lib/email/otp-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify 6-digit numeric OTP against SHA-256 hash
    const result = await verifyEmailOtp(normalizedEmail, otp);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        code: result.code,
      }, { status: 400 });
    }

    const userId = result.userId;

    // 2. Fetch Profile role & info
    let role = 'CUSTOMER';
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .single();
      if (profile?.role) role = profile.role;
    }

    // 3. Determine Redirect Route
    let redirectTo = '/';
    if (role === 'SELLER') {
      redirectTo = '/seller/pending';
    } else if (role === 'DELIVERY_PARTNER') {
      redirectTo = '/delivery/pending';
    } else if (role === 'ADMIN') {
      redirectTo = '/admin';
    }

    return NextResponse.json({
      success: true,
      role,
      redirectTo,
      message: 'Email successfully verified.',
    });
  } catch (error: any) {
    console.error('[MediRush Verify OTP API Error]', error);
    return NextResponse.json({
      error: error?.message || 'An unexpected error occurred during OTP verification.',
    }, { status: 500 });
  }
}
