export interface PostOfficeInfo {
  name: string;
  branchType: string;
  deliveryStatus: string;
}

export interface PincodeDetails {
  valid: boolean;
  pincode?: string;
  district?: string;
  state?: string;
  country?: string;
  region?: string;
  circle?: string;
  postOffices?: PostOfficeInfo[];
  primaryPostOffice?: string;
  message?: string;
}

const clientPincodeCache = new Map<string, PincodeDetails>();

/**
 * Validates and fetches real location details for a 6-digit Indian PIN Code.
 */
export async function lookupPincode(pincode: string): Promise<PincodeDetails> {
  const cleanPin = pincode.trim();

  if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return {
      valid: false,
      message: 'PIN code must be exactly 6 numeric digits.',
    };
  }

  if (clientPincodeCache.has(cleanPin)) {
    return clientPincodeCache.get(cleanPin)!;
  }

  try {
    const res = await fetch(`/api/location/pincode?pincode=${cleanPin}`);
    const data: PincodeDetails = await res.json();

    if (data.valid) {
      clientPincodeCache.set(cleanPin, data);
    }

    return data;
  } catch {
    return {
      valid: false,
      message: 'Network error or postal server unavailable.',
    };
  }
}
