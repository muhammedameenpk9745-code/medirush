export type PrescriptionRequirement = 'REQUIRED' | 'OPTIONAL' | 'NOT_REQUIRED';

export type ProductCategory = 
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Suspension'
  | 'Injection'
  | 'Cream'
  | 'Ointment'
  | 'Gel'
  | 'Lotion'
  | 'Drops'
  | 'Spray'
  | 'Inhaler'
  | 'Powder'
  | 'Sachet'
  | 'Solution'
  | 'Suppository'
  | 'Medical Device'
  | 'Surgical Supply'
  | 'Personal Care'
  | 'Other'
  | string;

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  genericName?: string;
  brand: string;
  category: ProductCategory;
  category_id?: string;
  product_categories?: { id: string; name: string; slug: string };
  price: number;
  mrp: number;
  discountPercentage: number;
  prescriptionRequirement: PrescriptionRequirement;
  imageUrl: string;
  description: string;
  dosage?: string;
  packSize: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
}
