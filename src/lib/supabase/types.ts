export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'CUSTOMER' | 'SELLER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'SUPER_ADMIN';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type AvailabilityStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ASSIGNED' | 'GOING_TO_STORE' | 'AT_STORE' | 'PICKED_UP' | 'ON_THE_WAY' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PrescriptionStatus = 'NOT_REQUIRED' | 'PENDING' | 'UPLOADED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          profile_id: string
          date_of_birth: string | null
          default_address_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          date_of_birth?: string | null
          default_address_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          date_of_birth?: string | null
          default_address_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medical_stores: {
        Row: {
          id: string
          owner_profile_id: string
          store_name: string
          owner_name: string
          phone: string
          email: string
          address: string
          city: string
          state: string
          pincode: string
          latitude: number | null
          longitude: number | null
          medical_license_number: string
          gst_number: string | null
          opening_time: string
          closing_time: string
          verification_status: VerificationStatus
          store_status: StoreStatus
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_profile_id: string
          store_name: string
          owner_name: string
          phone: string
          email: string
          address: string
          city: string
          state: string
          pincode: string
          latitude?: number | null
          longitude?: number | null
          medical_license_number: string
          gst_number?: string | null
          opening_time?: string
          closing_time?: string
          verification_status?: VerificationStatus
          store_status?: StoreStatus
          rating?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_profile_id?: string
          store_name?: string
          owner_name?: string
          phone?: string
          email?: string
          address?: string
          city?: string
          state?: string
          pincode?: string
          latitude?: number | null
          longitude?: number | null
          medical_license_number?: string
          gst_number?: string | null
          opening_time?: string
          closing_time?: string
          verification_status?: VerificationStatus
          store_status?: StoreStatus
          rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string
          seller_store_id: string
          product_name: string
          slug: string
          generic_name: string | null
          brand: string
          manufacturer: string | null
          description: string | null
          strength: string | null
          dosage_form: string | null
          pack_size: string
          mrp: number
          selling_price: number
          prescription_required: boolean
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          seller_store_id: string
          product_name: string
          slug: string
          generic_name?: string | null
          brand: string
          manufacturer?: string | null
          description?: string | null
          strength?: string | null
          dosage_form?: string | null
          pack_size: string
          mrp: number
          selling_price: number
          prescription_required?: boolean
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          seller_store_id?: string
          product_name?: string
          slug?: string
          generic_name?: string | null
          brand?: string
          manufacturer?: string | null
          description?: string | null
          strength?: string | null
          dosage_form?: string | null
          pack_size?: string
          mrp?: number
          selling_price?: number
          prescription_required?: boolean
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          store_id: string
          delivery_partner_id: string | null
          address_id: string
          subtotal: number
          delivery_fee: number
          discount: number
          tax: number
          total_amount: number
          payment_status: PaymentStatus
          order_status: OrderStatus
          prescription_required: boolean
          prescription_status: PrescriptionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_id: string
          store_id: string
          delivery_partner_id?: string | null
          address_id: string
          subtotal: number
          delivery_fee?: number
          discount?: number
          tax?: number
          total_amount: number
          payment_status?: PaymentStatus
          order_status?: OrderStatus
          prescription_required?: boolean
          prescription_status?: PrescriptionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          store_id?: string
          delivery_partner_id?: string | null
          address_id?: string
          subtotal?: number
          delivery_fee?: number
          discount?: number
          tax?: number
          total_amount?: number
          payment_status?: PaymentStatus
          order_status?: OrderStatus
          prescription_required?: boolean
          prescription_status?: PrescriptionStatus
          created_at?: string
          updated_at?: string
        }
      }
      product_batches: {
        Row: {
          id: string
          product_id: string
          batch_number: string
          manufacturing_date: string
          expiry_date: string
          quantity: number
          selling_price: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          batch_number: string
          manufacturing_date: string
          expiry_date: string
          quantity?: number
          selling_price: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          batch_number?: string
          manufacturing_date?: string
          expiry_date?: string
          quantity?: number
          selling_price?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
