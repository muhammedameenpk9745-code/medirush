import { createClient } from './client';

/**
 * Toggle Rider Online / Offline Availability
 */
export async function toggleRiderAvailability(profileId: string, status: 'ONLINE' | 'OFFLINE') {
  const supabase = createClient();
  const { error } = await supabase
    .from('delivery_partners')
    .update({ availability_status: status })
    .eq('profile_id', profileId);

  return { success: !error, error: error?.message };
}

/**
 * Fetch Available Jobs for Online & Verified Riders
 */
export async function fetchAvailableDeliveryJobs(profileId: string) {
  const supabase = createClient();

  // 1. Verify Rider Status & Availability
  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (!partner || partner.verification_status !== 'APPROVED' || partner.availability_status !== 'ONLINE') {
    return { jobs: [], partner };
  }

  // 2. Fetch Orders ready for pickup where delivery_partner_id is NULL
  const { data: orders } = await supabase
    .from('orders')
    .select('*, medical_stores(store_name, address, city, pincode), addresses(*), order_items(count)')
    .eq('order_status', 'READY_FOR_PICKUP')
    .is('delivery_partner_id', null)
    .order('created_at', { ascending: true });

  return { jobs: orders || [], partner };
}

/**
 * Atomically Accept a Delivery Job (Race-Condition Protection)
 */
export async function acceptDeliveryJob(orderId: string, profileId: string) {
  const supabase = createClient();

  // 1. Fetch Rider record
  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (!partner) return { success: false, error: 'Delivery partner record not found.' };

  // 2. Atomic Lock: Update order ONLY if delivery_partner_id IS NULL
  const { data: updatedOrder, error: updateErr } = await supabase
    .from('orders')
    .update({
      delivery_partner_id: partner.id,
      order_status: 'ASSIGNED',
    })
    .eq('id', orderId)
    .is('delivery_partner_id', null)
    .select('*, customer_id, customers(profile_id)')
    .single();

  if (updateErr || !updatedOrder) {
    return { success: false, error: 'Job is no longer available or was accepted by another rider.' };
  }

  // 3. Update rider status to BUSY
  await supabase
    .from('delivery_partners')
    .update({ availability_status: 'BUSY' })
    .eq('id', partner.id);

  // 4. Create record in delivery_assignments
  await supabase.from('delivery_assignments').insert({
    order_id: orderId,
    delivery_partner_id: partner.id,
    accepted_at: new Date().toISOString(),
    status: 'ACCEPTED',
  });

  // 5. Notify Customer
  if (updatedOrder.customers?.profile_id) {
    await supabase.from('notifications').insert({
      profile_id: updatedOrder.customers.profile_id,
      type: 'RIDER_ASSIGNED',
      title: 'Delivery Rider Assigned',
      message: 'A MediRush delivery partner has accepted your order and is heading to the pharmacy.',
      order_id: orderId,
    });
  }

  return { success: true, order: updatedOrder };
}

/**
 * Update Delivery Progress Status
 */
export async function updateDeliveryProgress(orderId: string, nextStatus: string) {
  const supabase = createClient();

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({ order_status: nextStatus })
    .eq('id', orderId)
    .select('*, customers(profile_id)')
    .single();

  if (error || !updatedOrder) return { success: false, error: error?.message };

  // Emit Customer Notification
  if (updatedOrder.customers?.profile_id) {
    let title = 'Delivery Progress Update';
    let msg = `Your order status is now ${nextStatus}.`;

    if (nextStatus === 'PICKED_UP') {
      title = 'Order Picked Up from Pharmacy';
      msg = 'Your delivery partner has picked up your medicines from the pharmacy.';
    } else if (nextStatus === 'OUT_FOR_DELIVERY') {
      title = 'Out for Delivery';
      msg = 'Your delivery partner is on the way with your medicines.';
    }

    await supabase.from('notifications').insert({
      profile_id: updatedOrder.customers.profile_id,
      type: 'DELIVERY_UPDATE',
      title,
      message: msg,
      order_id: orderId,
    });
  }

  return { success: true };
}

/**
 * Verify Customer Delivery OTP and Complete Delivery
 */
export async function verifyDeliveryOTPAndComplete(orderId: string, enteredOtp: string, profileId: string) {
  const supabase = createClient();

  // 1. Fetch Order OTP & Partner
  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(profile_id)')
    .eq('id', orderId)
    .single();

  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (!order || !partner) return { success: false, error: 'Order or rider record missing.' };

  // 2. Check OTP
  const expectedOtp = order.delivery_otp || '1234';
  if (enteredOtp.trim() !== expectedOtp.trim()) {
    return { success: false, error: 'Invalid 4-digit Delivery OTP code. Please ask customer for correct OTP.' };
  }

  // 3. Update Order Status to DELIVERED & Payment to PAID
  const now = new Date().toISOString();
  await supabase
    .from('orders')
    .update({
      order_status: 'DELIVERED',
      payment_status: 'PAID',
    })
    .eq('id', orderId);

  // 4. Update delivery_assignments
  await supabase
    .from('delivery_assignments')
    .update({
      status: 'DELIVERED',
      delivered_at: now,
    })
    .eq('order_id', orderId)
    .eq('delivery_partner_id', partner.id);

  // 5. Create Rider Earnings Record
  const earnedFee = Number(order.delivery_fee || 40);
  await supabase.from('delivery_earnings').insert({
    delivery_partner_id: partner.id,
    order_id: orderId,
    delivery_fee: earnedFee,
    tip_amount: 0,
  });

  // 6. Calculate & Record Platform Commission upon Order Completion
  try {
    const { data: settingData } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'platform_commission_percent')
      .maybeSingle();

    let commRate = 10;
    if (settingData?.value) {
      try {
        commRate = typeof settingData.value === 'number' ? settingData.value : JSON.parse(settingData.value as any);
      } catch {
        commRate = 10;
      }
    }

    const subtotal = Number(order.subtotal || 0);
    const platformFee = subtotal * (commRate / 100);
    const sellerAmount = subtotal - platformFee;

    await supabase.from('commissions').insert({
      order_id: orderId,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      delivery_partner_amount: earnedFee,
    });
  } catch {
    // Commission fallback logging
  }

  // 7. Set Rider status back to ONLINE
  await supabase
    .from('delivery_partners')
    .update({ availability_status: 'ONLINE' })
    .eq('id', partner.id);

  // 8. Close Chat
  await supabase
    .from('chats')
    .update({ status: 'CLOSED', closed_at: now })
    .eq('order_id', orderId);

  // 9. Notify Customer & Seller
  if (order.customers?.profile_id) {
    await supabase.from('notifications').insert({
      profile_id: order.customers.profile_id,
      type: 'DELIVERY_COMPLETED',
      title: 'Order Delivered Successfully',
      message: 'Your medicines have been delivered. Thank you for choosing MediRush!',
      order_id: orderId,
    });
  }

  return { success: true };
}

/**
 * Fetch Rider Earnings Summary
 */
export async function fetchRiderEarnings(profileId: string) {
  const supabase = createClient();

  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (!partner) return { today: 0, week: 0, month: 0, total: 0, count: 0, earningsList: [] };

  const { data: earnings } = await supabase
    .from('delivery_earnings')
    .select('*, orders(order_number, created_at, medical_stores(store_name))')
    .eq('delivery_partner_id', partner.id)
    .order('created_at', { ascending: false });

  let todaySum = 0;
  let weekSum = 0;
  let monthSum = 0;
  let totalSum = 0;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStr = now.toISOString().substring(0, 7);
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  if (earnings) {
    earnings.forEach((e: any) => {
      const amt = Number(e.total_earned || e.delivery_fee || 40);
      totalSum += amt;

      const eDateStr = e.created_at?.split('T')[0];
      const eMonthStr = e.created_at?.substring(0, 7);
      const eTimeMs = new Date(e.created_at).getTime();

      if (eDateStr === todayStr) todaySum += amt;
      if (eMonthStr === monthStr) monthSum += amt;
      if (eTimeMs >= sevenDaysAgoMs) weekSum += amt;
    });
  }

  return {
    today: todaySum,
    week: weekSum,
    month: monthSum,
    total: totalSum,
    count: earnings?.length || 0,
    earningsList: earnings || [],
  };
}

/**
 * Upsert Rider Real-Time Live Location Telemetry into delivery_tracking
 */
export async function updateRiderLiveLocation({
  orderId,
  profileId,
  latitude,
  longitude,
  accuracy,
  heading,
  speed,
}: {
  orderId: string;
  profileId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}) {
  const supabase = createClient();

  // 1. Fetch Rider Partner ID
  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (!partner) return { success: false, error: 'Delivery partner record not found.' };

  const now = new Date().toISOString();

  // 2. Upsert telemetry into delivery_tracking table
  const { error: trackErr } = await supabase
    .from('delivery_tracking')
    .upsert(
      {
        order_id: orderId,
        rider_id: partner.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        heading: heading || null,
        speed: speed || null,
        tracking_status: 'ACTIVE',
        updated_at: now,
      },
      { onConflict: 'order_id' }
    );

  if (trackErr) {
    return { success: false, error: trackErr.message };
  }

  // 3. Update delivery_partners current location
  await supabase
    .from('delivery_partners')
    .update({
      current_latitude: latitude,
      current_longitude: longitude,
      updated_at: now,
    })
    .eq('id', partner.id);

  return { success: true };
}

/**
 * Fetch Current Active Live Location Telemetry for an Order
 */
export async function fetchDeliveryTracking(orderId: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from('delivery_tracking')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  return data;
}
