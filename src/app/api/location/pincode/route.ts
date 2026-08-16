import { NextResponse } from 'next/server';

export interface PostOfficeInfo {
  name: string;
  branchType: string;
  deliveryStatus: string;
}

export interface PincodeLookupResponse {
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

// In-Memory Server Cache for Fast Lookup
const pincodeCache = new Map<string, PincodeLookupResponse>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode')?.trim();

    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { valid: false, message: 'PIN code must be exactly 6 numeric digits.' },
        { status: 400 }
      );
    }

    // Check In-Memory Server Cache
    if (pincodeCache.has(pincode)) {
      return NextResponse.json(pincodeCache.get(pincode));
    }

    // AbortController 5-Second Timeout for External Postal API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'MediRush-Health/1.0' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Postal service error');
      }

      const data = await response.json();

      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].Status === 'Success' &&
        Array.isArray(data[0].PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const poList = data[0].PostOffice;
        const firstPo = poList[0];

        const postOffices: PostOfficeInfo[] = poList.map((po: any) => ({
          name: po.Name || 'Post Office',
          branchType: po.BranchType || 'Sub Office',
          deliveryStatus: po.DeliveryStatus || 'Delivery',
        }));

        const result: PincodeLookupResponse = {
          valid: true,
          pincode,
          district: firstPo.District || firstPo.Division || 'District',
          state: firstPo.State || 'State',
          country: firstPo.Country || 'India',
          region: firstPo.Region || undefined,
          circle: firstPo.Circle || undefined,
          postOffices,
          primaryPostOffice: postOffices[0]?.name,
        };

        // Store in Server Cache
        pincodeCache.set(pincode, result);

        return NextResponse.json(result);
      }
    } catch {
      clearTimeout(timeoutId);
    }

    const invalidResult: PincodeLookupResponse = {
      valid: false,
      message: 'Invalid or unavailable PIN code',
    };

    return NextResponse.json(invalidResult, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err.message || 'Internal server error during PIN lookup.' },
      { status: 500 }
    );
  }
}
