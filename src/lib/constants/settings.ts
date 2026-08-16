import { createClient } from '../supabase/client';

export interface PlatformSettings {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  platformCommissionPercent: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  marketplaceName: string;
  supportEmail: string;
  supportPhone: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  deliveryFee: 40,
  freeDeliveryThreshold: 499,
  platformCommissionPercent: 10,
  minOrderAmount: 50,
  maxOrderAmount: 50000,
  codEnabled: true,
  onlinePaymentEnabled: true,
  marketplaceName: 'MediRush',
  supportEmail: 'support@kochunddappi.shop',
  supportPhone: '+91 1800-123-4567',
};

/**
 * Fetch dynamic platform settings from Supabase
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = createClient();
  try {
    const { data } = await supabase.from('platform_settings').select('*');
    if (!data || data.length === 0) return DEFAULT_PLATFORM_SETTINGS;

    const settingsMap = data.reduce<Record<string, any>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return {
      deliveryFee: Number(settingsMap.delivery_fee ?? DEFAULT_PLATFORM_SETTINGS.deliveryFee),
      freeDeliveryThreshold: Number(settingsMap.free_delivery_threshold ?? DEFAULT_PLATFORM_SETTINGS.freeDeliveryThreshold),
      platformCommissionPercent: Number(settingsMap.platform_commission_percent ?? DEFAULT_PLATFORM_SETTINGS.platformCommissionPercent),
      minOrderAmount: Number(settingsMap.min_order_amount ?? DEFAULT_PLATFORM_SETTINGS.minOrderAmount),
      maxOrderAmount: Number(settingsMap.max_order_amount ?? DEFAULT_PLATFORM_SETTINGS.maxOrderAmount),
      codEnabled: Boolean(settingsMap.cod_enabled ?? DEFAULT_PLATFORM_SETTINGS.codEnabled),
      onlinePaymentEnabled: Boolean(settingsMap.online_payment_enabled ?? DEFAULT_PLATFORM_SETTINGS.onlinePaymentEnabled),
      marketplaceName: String(settingsMap.marketplace_name ?? DEFAULT_PLATFORM_SETTINGS.marketplaceName),
      supportEmail: String(settingsMap.support_email ?? DEFAULT_PLATFORM_SETTINGS.supportEmail),
      supportPhone: String(settingsMap.support_phone ?? DEFAULT_PLATFORM_SETTINGS.supportPhone),
    };
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}
