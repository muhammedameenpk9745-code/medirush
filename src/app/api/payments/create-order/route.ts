import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/payments/razorpay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amountInINR, orderId, notes } = body;

    if (!amountInINR || amountInINR <= 0 || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment parameters: amountInINR and orderId are required.' },
        { status: 400 }
      );
    }

    const orderResult = await createRazorpayOrder({
      amountInINR: Number(amountInINR),
      orderId,
      notes: notes || {},
    });

    if (!orderResult.success) {
      return NextResponse.json(
        { success: false, error: orderResult.error || 'Failed to generate payment order.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      razorpayOrderId: orderResult.razorpayOrderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      keyId: orderResult.keyId,
      isMockProvider: orderResult.isMockProvider || false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while creating payment order.' },
      { status: 500 }
    );
  }
}
