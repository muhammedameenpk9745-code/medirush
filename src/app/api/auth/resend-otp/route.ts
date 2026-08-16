import { NextRequest, NextResponse } from 'next/server';
import { resendEmailOtp } from '@/lib/email/otp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Resend OTP with 3 resend per 15 min rate limit
    const result = await resendEmailOtp(normalizedEmail);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        code: result.code,
      }, { status: result.code === 'RATE_LIMIT' ? 429 : 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
    });
  } catch (error: any) {
    console.error('[MediRush Resend OTP API Error]', error);
    return NextResponse.json({
      error: error?.message || 'An unexpected error occurred while resending verification code.',
    }, { status: 500 });
  }
}
