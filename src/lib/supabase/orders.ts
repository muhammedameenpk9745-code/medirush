import { createClient } from './client';
import { CartItem } from '@/context/CartContext';
import { calculateDeliveryFee } from '../constants/delivery';
import { evaluateSellerDeliveryCoverage } from '../delivery/coverage';

export interface CreateOrderParams {
  addressId: string;
  paymentMethod: 'COD' | 'ONLINE';
  prescriptionId?: string | null;
  items: CartItem[];
}

export async function createCustomerOrders({
  addressId,
  paymentMethod,
  prescriptionId,
  items,
}: CreateOrderParams): Promise<{ success: boolean; orderIds?: string[]; error?: string }> {
  const supabase = createClient();

  // 1. Check Authenticated Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { success: false, error: 'User must be logged in to place orders.' };
  }

  // 2. Fetch Customer ID
  const { data: cust } = await supabase
    .from('customers')
    .select('id')
    .eq('profile_id', session.user.id)
    .single();

  if (!cust) {
    return { success: false, error: 'Customer account record not found.' };
  }

  // 3. Fetch Address Record for Immutable Snapshotting & Server-Side Delivery Validation
  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .single();

  if (!address) {
    return { success: false, error: 'Selected delivery address record not found.' };
  }

  const customerAddress = {
    address_line_1: address.address_line_1 || '',
    address_line_2: address.address_line_2 || address.street_area || '',
    locality: address.locality || address.city || '',
    post_office: address.post_office || '',
    district: address.district || address.city || '',
    city: address.city || '',
    state: address.state || '',
    country: address.country || 'India',
    pincode: address.pincode || '',
    latitude: address.latitude || null,
    longitude: address.longitude || null,
  };

  const deliverySnapshot = {
    delivery_name: address.full_name || '',
    delivery_phone: address.phone || '',
    delivery_address_line1: address.address_line_1 || '',
    delivery_address_line2: address.address_line_2 || address.street_area || '',
    delivery_landmark: address.landmark || null,
    delivery_locality: address.locality || address.city || '',
    delivery_post_office: address.post_office || null,
    delivery_district: address.district || address.city || '',
    delivery_state: address.state || '',
    delivery_pincode: address.pincode || '',
    delivery_latitude: address.latitude || null,
    delivery_longitude: address.longitude || null,
    delivery_instructions: address.instructions || null,
  };

  // 4. Group Cart Items by Store ID
  const storeGroupMap: Record<string, CartItem[]> = {};
  items.forEach((item) => {
    const sId = item.storeId || 'default-store';
    if (!storeGroupMap[sId]) storeGroupMap[sId] = [];
    storeGroupMap[sId].push(item);
  });

  const createdOrderIds: string[] = [];

  try {
    // Process order per pharmacy store with server-side coverage verification
    for (const [storeId, storeItems] of Object.entries(storeGroupMap)) {
      
      // A. SERVER-SIDE DELIVERY COVERAGE VALIDATION
      const { data: storeRecord } = await supabase
        .from('medical_stores')
        .select('id, store_name, address, city, state, pincode, latitude, longitude')
        .eq('id', storeId)
        .single();

      if (!storeRecord) {
        throw new Error(`Pharmacy store record #${storeId} not found.`);
      }

      const { data: storeSettings } = await supabase
        .from('seller_delivery_settings')
        .select('*, seller_delivery_areas(*)')
        .eq('store_id', storeId)
        .maybeSingle();

      const evalSettings = storeSettings
        ? { ...storeSettings, areas: storeSettings.seller_delivery_areas || [] }
        : null;

      const evalResult = evaluateSellerDeliveryCoverage(storeRecord, evalSettings, customerAddress);

      if (!evalResult.isAvailable) {
        throw new Error(`Delivery unavailable from ${storeRecord.store_name}: ${evalResult.reasonMessage}`);
      }

      // B. Calculate Store Subtotal
      const storeSubtotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const storeDeliveryFee = calculateDeliveryFee(storeSubtotal);
      const storeTotal = storeSubtotal + storeDeliveryFee;

      const hasRx = storeItems.some((i) => i.prescriptionRequired);
      const orderNumber = `ORD-${Date.now().toString().substring(5)}-${Math.floor(100 + Math.random() * 900)}`;

      // C. Create Order Record with Address & Delivery Coverage Snapshots
      const { data: orderRecord, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: cust.id,
          store_id: storeId,
          address_id: addressId,
          subtotal: storeSubtotal,
          delivery_fee: storeDeliveryFee,
          discount: 0,
          total_amount: storeTotal,
          payment_status: 'PENDING',
          order_status: 'PLACED',
          prescription_required: hasRx,
          prescription_status: hasRx ? (prescriptionId ? 'UNDER_REVIEW' : 'PENDING') : 'NOT_REQUIRED',
          delivery_coverage_rule: evalResult.coverageType,
          delivery_distance: evalResult.distanceKm || null,
          delivery_availability_status: 'AVAILABLE',
          ...deliverySnapshot,
        })
        .select()
        .single();

      if (orderErr || !orderRecord) {
        throw new Error(orderErr?.message || 'Failed to generate order record.');
      }

      createdOrderIds.push(orderRecord.id);

      // D. Insert Order Items
      for (const item of storeItems) {
        await supabase.from('order_items').insert({
          order_id: orderRecord.id,
          product_id: item.id,
          product_name_snapshot: item.name,
          manufacturer_snapshot: item.brand,
          quantity: item.quantity,
          unit_price: item.price,
          mrp_snapshot: item.mrp || item.price,
          discount: 0,
          total_price: item.price * item.quantity,
        });
      }

      // E. Attach Prescription Record if applicable
      if (prescriptionId) {
        await supabase
          .from('prescriptions')
          .update({ order_id: orderRecord.id })
          .eq('id', prescriptionId);
      }

      // F. Emit Customer Notification
      await supabase.from('notifications').insert({
        profile_id: session.user.id,
        type: 'ORDER_PLACED',
        title: `Order #${orderNumber} Confirmed`,
        message: `Your medicine order for ₹${storeTotal} has been placed successfully.`,
        order_id: orderRecord.id,
      });
    }

    return { success: true, orderIds: createdOrderIds };
  } catch (err: any) {
    return { success: false, error: err.message || 'Order creation failed.' };
  }
}
