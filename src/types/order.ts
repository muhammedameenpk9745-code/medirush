export type OrderStatus = 
  | 'PENDING'
  | 'PRESCRIPTION_VERIFICATION'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescriptionRequired: boolean;
  packSize: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  prescriptionUrl?: string;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  createdAt: string;
  estimatedDeliveryTime: string;
}
