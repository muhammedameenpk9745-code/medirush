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
    const result = await resendEmailOtp(normalizedEmail);

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        code: result.code,
      }, { status: result.code === 'RATE_LIMIT' ? 429 : 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to send OTP.' }, { status: 500 });
  }
}
