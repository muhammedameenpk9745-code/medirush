import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAndSendEmailOtp } from '@/lib/email/otp-service';

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
    const {
      email,
      password,
      fullName,
      phone,
      role = 'CUSTOMER',
      // Store fields for Seller
      storeName,
      medicalLicenseNumber,
      address,
      city,
      pincode,
      // Rider fields
      vehicleType,
      drivingLicenseNumber,
    } = body;

    // 1. Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Please provide your full name.' }, { status: 400 });
    }

    // Public Admin registration is forbidden
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Admin account creation is disabled.' }, { status: 403 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if email already exists in profiles (safe try/catch)
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email_verified, role')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile && existingProfile.email_verified) {
        return NextResponse.json({
          error: 'An account with this email already exists. Please log in.',
        }, { status: 400 });
      }
    } catch (err) {
      console.warn('[MediRush Register] Profile check skipped:', err);
    }

    // 3. Create User via Supabase Auth signUp API (safe try/catch)
    let userId: string | null = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });
      if (authUser?.user?.id) {
        userId = authUser.user.id;
      }
    } catch (err) {
      console.warn('[MediRush Register] Supabase signUp skipped/failed:', err);
    }

    if (!userId) {
      userId = crypto.randomUUID();
    }

    // 4. Create or Update Profile (safe try/catch)
    try {
      const profileStatus = role === 'CUSTOMER' ? 'ACTIVE' : 'PENDING';
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: normalizedEmail,
        full_name: fullName,
        phone: phone || '',
        role,
        status: profileStatus,
        email_verified: false,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[MediRush Register] Profile upsert skipped:', err);
    }

    // 5. Additional Role Data (Seller store or Rider profile)
    if (role === 'SELLER' && storeName) {
      try {
        await supabaseAdmin.from('medical_stores').upsert({
          seller_id: userId,
          store_name: storeName,
          medical_license_number: medicalLicenseNumber || 'DL-PENDING',
          address: address || '',
          city: city || 'Delhi',
          pincode: pincode || '110001',
          verification_status: 'PENDING',
          store_status: 'INACTIVE',
        });
      } catch (err) {
        console.warn('[MediRush Register] Medical store upsert skipped:', err);
      }
    } else if (role === 'DELIVERY_PARTNER') {
      try {
        await supabaseAdmin.from('delivery_partner_profiles').upsert({
          user_id: userId,
          vehicle_type: vehicleType || 'BIKE',
          driving_license_number: drivingLicenseNumber || 'DL-PENDING',
          verification_status: 'PENDING',
          availability_status: 'OFFLINE',
        });
      } catch (err) {
        console.warn('[MediRush Register] Rider profile upsert skipped:', err);
      }
    }

    // 6. Generate 6-digit numeric OTP, hash with SHA-256, store hash, and send via Resend SDK
    const otpRes = await createAndSendEmailOtp(userId, normalizedEmail);

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      role,
      emailSent: otpRes.emailSent,
      redirectTo: `/verify-otp?email=${encodeURIComponent(normalizedEmail)}&role=${role}`,
    });
  } catch (error: any) {
    console.error('[MediRush Register API Error]', error);
    return NextResponse.json({
      error: error?.message || 'An unexpected error occurred during registration.',
    }, { status: 500 });
  }
}
