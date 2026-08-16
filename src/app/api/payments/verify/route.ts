import { NextResponse } from 'next/server';
import { verifyRazorpayPaymentSignature } from '@/lib/payments/razorpay';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
      customerId,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required verification params.' },
        { status: 400 }
      );
    }

    // 1. Server-Side HMAC SHA256 Signature Verification
    const isValidSignature = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    // Use administrative client to guarantee DB update permissions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch target Order record
    const { data: orderRecord } = await supabase
      .from('orders')
      .select('id, payment_status, total_amount, customer_id, customers(profile_id)')
      .eq('id', orderId)
      .single();

    if (!orderRecord) {
      return NextResponse.json(
        { success: false, error: 'Order record not found in system database.' },
        { status: 404 }
      );
    }

    // 3. Idempotent Check: If already paid, return clean success directly
    if (orderRecord.payment_status === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified and updated.',
        orderId: orderRecord.id,
      });
    }

    if (!isValidSignature) {
      // Record payment failure in DB
      await supabase
        .from('orders')
        .update({ payment_status: 'FAILED' })
        .eq('id', orderId);

      await supabase.from('payments').insert({
        order_id: orderId,
        customer_id: orderRecord.customer_id || customerId,
        payment_provider: 'RAZORPAY',
        provider_payment_id: razorpayPaymentId,
        amount: orderRecord.total_amount || 0,
        currency: 'INR',
        status: 'FAILED',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid Razorpay payment signature verification failed.' },
        { status: 400 }
      );
    }

    // 4. Signature Verified: Update Order to PAID & Insert Payment Record
    await supabase
      .from('orders')
      .update({ payment_status: 'PAID' })
      .eq('id', orderId);

    await supabase.from('payments').insert({
      order_id: orderId,
      customer_id: orderRecord.customer_id || customerId,
      payment_provider: 'RAZORPAY',
      provider_payment_id: razorpayPaymentId,
      amount: orderRecord.total_amount || 0,
      currency: 'INR',
      status: 'PAID',
    });

    // 5. Emit Customer Notification
    const profileId = (orderRecord.customers as any)?.profile_id;
    if (profileId) {
      await supabase.from('notifications').insert({
        profile_id: profileId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: `Online payment of ₹${orderRecord.total_amount} verified successfully via Razorpay.`,
        order_id: orderId,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: orderRecord.id,
      message: 'Razorpay payment verified and order updated to PAID.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during verification.' },
      { status: 500 }
    );
  }
}
