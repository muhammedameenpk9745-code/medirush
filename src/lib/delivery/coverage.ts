export interface StoreLocation {
  id: string;
  store_name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CustomerAddress {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  post_office?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type CoverageType =
  | 'RADIUS'
  | 'LOCAL_AREA'
  | 'PIN_CODE'
  | 'DISTRICT'
  | 'STATE'
  | 'COUNTRY'
  | 'INDIA_WIDE'
  | 'WORLDWIDE';

export interface SellerDeliverySettings {
  id?: string;
  store_id: string;
  seller_id?: string;
  coverage_type: CoverageType;
  match_mode: 'ANY_MATCH' | 'ALL_MATCH';
  radius_km: number;
  country?: string;
  is_active: boolean;
  areas?: Array<{ area_type: string; area_value: string }>;
}

export interface DeliveryCheckResult {
  storeId: string;
  storeName: string;
  isAvailable: boolean;
  coverageType: CoverageType;
  distanceKm?: number | null;
  ruleSummary: string;
  reasonMessage: string;
}

// 1. Haversine Distance Calculation (Exact KM between coordinates)
export function calculateHaversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Helper for case-insensitive normalized string matching
function cleanMatch(str1?: string, str2?: string): boolean {
  if (!str1 || !str2) return false;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  return s1 === s2 || s1.includes(s2) || s2.includes(s1);
}

// 2. Evaluate single seller delivery coverage against customer address
export function evaluateSellerDeliveryCoverage(
  store: StoreLocation,
  settings: SellerDeliverySettings | null,
  customerAddr: CustomerAddress
): DeliveryCheckResult {
  const storeName = store.store_name || 'Partner Pharmacy';

  // Default fallback if seller has no delivery settings configured yet
  if (!settings || !settings.is_active) {
    return {
      storeId: store.id,
      storeName,
      isAvailable: true,
      coverageType: 'INDIA_WIDE',
      ruleSummary: 'Standard Delivery',
      reasonMessage: `✓ ${storeName} delivers to your location`,
    };
  }

  const coverageType = settings.coverage_type || 'INDIA_WIDE';
  const areas = settings.areas || [];
  let distanceKm: number | null = null;

  // Calculate coordinates distance if lat/lng present for both store and customer
  if (
    typeof store.latitude === 'number' &&
    typeof store.longitude === 'number' &&
    typeof customerAddr.latitude === 'number' &&
    typeof customerAddr.longitude === 'number'
  ) {
    distanceKm = calculateHaversineDistanceKm(
      store.latitude,
      store.longitude,
      customerAddr.latitude,
      customerAddr.longitude
    );
  }

  switch (coverageType) {
    case 'WORLDWIDE':
      return {
        storeId: store.id,
        storeName,
        isAvailable: true,
        coverageType: 'WORLDWIDE',
        distanceKm,
        ruleSummary: 'Worldwide Delivery',
        reasonMessage: `✓ ${storeName} offers worldwide delivery`,
      };

    case 'INDIA_WIDE': {
      const isIndia =
        !customerAddr.country ||
        customerAddr.country.toLowerCase().includes('india') ||
        customerAddr.country.toLowerCase() === 'in';

      return {
        storeId: store.id,
        storeName,
        isAvailable: isIndia,
        coverageType: 'INDIA_WIDE',
        distanceKm,
        ruleSummary: 'India-Wide Delivery',
        reasonMessage: isIndia
          ? `✓ ${storeName} delivers anywhere in India`
          : `✕ ${storeName} currently delivers only within India`,
      };
    }

    case 'RADIUS': {
      const radiusLimit = settings.radius_km || 5.0;

      if (distanceKm !== null) {
        const isWithin = distanceKm <= radiusLimit;
        return {
          storeId: store.id,
          storeName,
          isAvailable: isWithin,
          coverageType: 'RADIUS',
          distanceKm,
          ruleSummary: `Within ${radiusLimit} km radius`,
          reasonMessage: isWithin
            ? `✓ Delivery available (${distanceKm} km from store)`
            : `✕ ${storeName} currently delivers only within ${radiusLimit} km of their store (You are ${distanceKm} km away)`,
        };
      }

      // If lat/lng unavailable, fallback to district/city matching for radius mode
      const isSameDistrict =
        cleanMatch(customerAddr.district, store.city || store.state) ||
        cleanMatch(customerAddr.pincode, store.pincode);

      return {
        storeId: store.id,
        storeName,
        isAvailable: isSameDistrict,
        coverageType: 'RADIUS',
        distanceKm: null,
        ruleSummary: `Within ${radiusLimit} km radius`,
        reasonMessage: isSameDistrict
          ? `✓ ${storeName} delivers to your city area`
          : `✕ ${storeName} currently delivers only within ${radiusLimit} km of their store`,
      };
    }

    case 'LOCAL_AREA': {
      const localAreas = areas
        .filter((a) => a.area_type === 'LOCAL_AREA')
        .map((a) => a.area_value);

      const customerLocality =
        customerAddr.locality || customerAddr.post_office || customerAddr.address_line_2 || '';

      const isMatched = localAreas.some(
        (area) =>
          cleanMatch(customerLocality, area) ||
          cleanMatch(customerAddr.district, area) ||
          cleanMatch(customerAddr.pincode, area)
      );

      return {
        storeId: store.id,
        storeName,
        isAvailable: isMatched,
        coverageType: 'LOCAL_AREA',
        distanceKm,
        ruleSummary: 'Selected Local Areas',
        reasonMessage: isMatched
          ? `✓ ${storeName} delivers to your local area`
          : `✕ ${storeName} currently delivers only to selected local areas (${localAreas.slice(0, 3).join(', ')})`,
      };
    }

    case 'PIN_CODE': {
      const pinCodes = areas
        .filter((a) => a.area_type === 'PIN_CODE')
        .map((a) => a.area_value.trim());

      const custPin = (customerAddr.pincode || '').trim();
      const isMatched = pinCodes.includes(custPin);

      return {
        storeId: store.id,
        storeName,
        isAvailable: isMatched,
        coverageType: 'PIN_CODE',
        distanceKm,
        ruleSummary: 'Selected PIN Codes',
        reasonMessage: isMatched
          ? `✓ ${storeName} delivers to PIN code ${custPin}`
          : `✕ ${storeName} currently delivers only to selected PIN codes (${pinCodes.slice(0, 4).join(', ')})`,
      };
    }

    case 'DISTRICT': {
      const districts = areas
        .filter((a) => a.area_type === 'DISTRICT')
        .map((a) => a.area_value);

      const custDistrict = customerAddr.district || customerAddr.city || '';
      const isMatched = districts.some((dist) => cleanMatch(custDistrict, dist));

      return {
        storeId: store.id,
        storeName,
        isAvailable: isMatched,
        coverageType: 'DISTRICT',
        distanceKm,
        ruleSummary: 'Selected Districts',
        reasonMessage: isMatched
          ? `✓ ${storeName} delivers to ${custDistrict} district`
          : `✕ ${storeName} currently delivers only within selected districts (${districts.join(', ')})`,
      };
    }

    case 'STATE': {
      const states = areas
        .filter((a) => a.area_type === 'STATE')
        .map((a) => a.area_value);

      const custState = customerAddr.state || '';
      const isMatched = states.some((st) => cleanMatch(custState, st));

      return {
        storeId: store.id,
        storeName,
        isAvailable: isMatched,
        coverageType: 'STATE',
        distanceKm,
        ruleSummary: 'Selected States',
        reasonMessage: isMatched
          ? `✓ ${storeName} delivers to ${custState}`
          : `✕ ${storeName} currently delivers only within ${states.join(', ')}`,
      };
    }

    case 'COUNTRY': {
      const countries = areas
        .filter((a) => a.area_type === 'COUNTRY')
        .map((a) => a.area_value);

      const custCountry = customerAddr.country || 'India';
      const isMatched = countries.some((c) => cleanMatch(custCountry, c));

      return {
        storeId: store.id,
        storeName,
        isAvailable: isMatched,
        coverageType: 'COUNTRY',
        distanceKm,
        ruleSummary: 'Selected Countries',
        reasonMessage: isMatched
          ? `✓ ${storeName} delivers to ${custCountry}`
          : `✕ ${storeName} currently delivers only to selected countries (${countries.join(', ')})`,
      };
    }

    default:
      return {
        storeId: store.id,
        storeName,
        isAvailable: true,
        coverageType: 'INDIA_WIDE',
        distanceKm,
        ruleSummary: 'Standard Delivery',
        reasonMessage: `✓ ${storeName} delivers to your location`,
      };
  }
}
