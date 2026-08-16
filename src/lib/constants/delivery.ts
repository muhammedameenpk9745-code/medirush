// Central Configurable Delivery Fee Helper

export const DELIVERY_CONFIG = {
  BASE_DELIVERY_FEE: 40, // ₹40
  FREE_DELIVERY_THRESHOLD: 499, // ₹499
};

/**
 * Calculates delivery fee based on subtotal amount.
 * @param subtotal Gross subtotal amount in INR
 * @returns Delivery fee in INR (0 if subtotal >= FREE_DELIVERY_THRESHOLD)
 */
export function calculateDeliveryFee(subtotal: number): number {
  if (subtotal >= DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD || subtotal === 0) {
    return 0;
  }
  return DELIVERY_CONFIG.BASE_DELIVERY_FEE;
}
