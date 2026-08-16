import { createClient } from './client';

/**
 * Fetch Aggregated SaaS KPI Metrics for Admin Dashboard
 */
export async function fetchAdminDashboardMetrics() {
  const supabase = createClient();

  // 1. Customers Count
  const { count: customersCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'CUSTOMER');

  // 2. Pharmacies Count
  const { count: pharmaciesCount } = await supabase
    .from('medical_stores')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'APPROVED');

  // 3. Pending Pharmacies Count
  const { count: pendingPharmaciesCount } = await supabase
    .from('medical_stores')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'PENDING');

  // 4. Delivery Partners Count
  const { count: partnersCount } = await supabase
    .from('delivery_partners')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'APPROVED');

  // 5. Pending Delivery Partners Count
  const { count: pendingPartnersCount } = await supabase
    .from('delivery_partners')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'PENDING');

  // 6. Active Products Count
  const { count: productsCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // 7. Active Deliveries Count
  const { count: activeDeliveriesCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('order_status', ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY']);

  // 8. Dynamic Commission & Orders Today / Total GMV calculation
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

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: allOrders } = await supabase
    .from('orders')
    .select('id, total_amount, subtotal, delivery_fee, created_at, order_status');

  let ordersToday = 0;
  let gmvTotal = 0;
  let revenueTotal = 0;

  if (allOrders) {
    allOrders.forEach((ord: any) => {
      if (ord.created_at?.startsWith(todayStr)) {
        ordersToday += 1;
      }
      if (ord.order_status !== 'CANCELLED') {
        const amt = Number(ord.total_amount || 0);
        gmvTotal += amt;
        // Platform dynamic commission + delivery fee
        revenueTotal += Number(ord.subtotal || 0) * (commRate / 100) + Number(ord.delivery_fee || 0);
      }
    });
  }

  return {
    customersCount: customersCount || 0,
    pharmaciesCount: pharmaciesCount || 0,
    pendingPharmaciesCount: pendingPharmaciesCount || 0,
    partnersCount: partnersCount || 0,
    pendingPartnersCount: pendingPartnersCount || 0,
    productsCount: productsCount || 0,
    activeDeliveriesCount: activeDeliveriesCount || 0,
    ordersToday,
    gmvTotal,
    revenueTotal,
  };
}

/**
 * Append-Only Audit Logger
 */
export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  await supabase.from('audit_logs').insert({
    admin_profile_id: session?.user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || {},
  });
}
