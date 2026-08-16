import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // Verify webhook signature if secret is configured
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { status: 'error', message: 'Invalid webhook signature.' },
          { status: 400 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayPaymentId = paymentEntity?.id;
      const orderNotes = paymentEntity?.notes || {};
      const orderId = orderNotes.order_id || paymentEntity?.receipt;

      if (orderId) {
        const { data: orderRecord } = await supabase
          .from('orders')
          .select('id, payment_status, total_amount, customer_id')
          .eq('id', orderId)
          .maybeSingle();

        if (orderRecord && orderRecord.payment_status !== 'PAID') {
          await supabase
            .from('orders')
            .update({ payment_status: 'PAID' })
            .eq('id', orderId);

          await supabase.from('payments').insert({
            order_id: orderId,
            customer_id: orderRecord.customer_id,
            payment_provider: 'RAZORPAY',
            provider_payment_id: razorpayPaymentId || `wh_${Date.now()}`,
            amount: orderRecord.total_amount || 0,
            currency: 'INR',
            status: 'PAID',
          });
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderNotes = paymentEntity?.notes || {};
      const orderId = orderNotes.order_id || paymentEntity?.receipt;

      if (orderId) {
        await supabase
          .from('orders')
          .update({ payment_status: 'FAILED' })
          .eq('id', orderId);
      }
    }

    return NextResponse.json({ status: 'ok', eventProcessed: event });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
