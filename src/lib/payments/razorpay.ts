import crypto from 'crypto';

export interface RazorpayOrderParams {
  amountInINR: number; // e.g. 500 for ₹500
  orderId: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  success: boolean;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  error?: string;
  isMockProvider?: boolean;
}

/**
 * Server-Side Razorpay Order Creator Abstraction
 */
export async function createRazorpayOrder({
  amountInINR,
  orderId,
  notes,
}: RazorpayOrderParams): Promise<RazorpayOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const amountInPaise = Math.round(amountInINR * 100);

  if (!keyId || !keySecret) {
    // Development Safe Provider Fallback
    return {
      success: true,
      razorpayOrderId: `rzp_mock_${Date.now()}_${orderId.substring(0, 6)}`,
      amount: amountInPaise,
      currency: 'INR',
      keyId: keyId || 'rzp_test_mock_key',
      isMockProvider: true,
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: notes || {},
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.description || 'Razorpay order creation failed.' };
    }

    return {
      success: true,
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Razorpay service communication error.' };
  }
}

/**
 * Server-Side Razorpay HMAC SHA256 Signature Verification
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    // If mock provider is used in development
    return razorpaySignature.startsWith('sig_mock_') || razorpaySignature.length > 5;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
}
