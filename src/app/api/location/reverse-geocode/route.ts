import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { valid: false, message: 'Latitude and longitude parameters are required.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'MediRush-Health/1.0 (contact@kochunddappi.shop)',
            'Accept-Language': 'en',
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Reverse geocoding service error');
      }

      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.quarter ||
          addr.residential ||
          addr.road ||
          addr.city_district ||
          'Local Area';

        const city = addr.city || fontTown(addr) || 'District';
        const district = addr.state_district || addr.county || city;
        const state = addr.state || 'State';
        const country = addr.country || 'India';
        const pincode = addr.postcode || '';

        const locationTag = `${locality}, ${city}${pincode ? ` — ${pincode}` : ''}`;

        return NextResponse.json({
          valid: true,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          locality,
          city,
          district,
          state,
          country,
          pincode,
          locationTag,
          displayName: data.display_name,
        });
      }
    } catch {
      clearTimeout(timeoutId);
    }

    return NextResponse.json(
      {
        valid: false,
        message: 'Unable to resolve address for detected coordinates.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err?.message || 'Internal server error during reverse geocoding.' },
      { status: 500 }
    );
  }
}

function fontTown(addr: any): string {
  return addr.town || addr.village || addr.municipality || addr.hamlet || '';
}
