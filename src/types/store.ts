export interface OperatingHours {
  open: string; // e.g. "08:00 AM"
  close: string; // e.g. "10:00 PM"
  isOpen24Hours?: boolean;
}

export interface MedicalStore {
  id: string;
  name: string;
  drugLicenseNumber: string;
  rating: number;
  totalRatings: number;
  distanceKm: number;
  estimatedDeliveryMinutes: number;
  isOpen: boolean;
  operatingHours: OperatingHours;
  address: string;
  city: string;
  imageUrl: string;
  isVerified: boolean;
  featuredCategories: string[];
}
