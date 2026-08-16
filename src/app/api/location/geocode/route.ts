import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParam = searchParams.get('query');
    const pincode = searchParams.get('pincode');
    const postOffice = searchParams.get('postOffice');
    const district = searchParams.get('district');
    const state = searchParams.get('state');

    // Build candidate search strings in order of specificity
    const candidateQueries: string[] = [];

    if (queryParam && queryParam.trim()) {
      candidateQueries.push(queryParam.trim());
    }

    if (postOffice && district && state && pincode) {
      candidateQueries.push(`${postOffice}, ${district}, ${state}, ${pincode}, India`);
    }

    if (postOffice && district && state) {
      candidateQueries.push(`${postOffice}, ${district}, ${state}, India`);
    }

    if (district && state && pincode) {
      candidateQueries.push(`${district}, ${state}, ${pincode}, India`);
    }

    if (district && state) {
      candidateQueries.push(`${district}, ${state}, India`);
    }

    if (pincode) {
      candidateQueries.push(`${pincode}, India`);
    }

    if (candidateQueries.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Query, PIN code, or district parameters are required.' },
        { status: 400 }
      );
    }

    for (const q of candidateQueries) {
      const result = await fetchNominatimSearch(q);
      if (result) {
        return NextResponse.json({
          valid: true,
          lat: result.lat,
          lng: result.lng,
          displayName: result.displayName,
          matchedQuery: q,
        });
      }
    }

    return NextResponse.json(
      {
        valid: false,
        message: 'Unable to locate this PIN on the map. Please select another location or try again.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err?.message || 'Internal server error during geocoding.' },
      { status: 500 }
    );
  }
}

async function fetchNominatimSearch(queryStr: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&countrycodes=in&limit=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MediRush-Health/1.0 (contact@kochunddappi.shop)',
        'Accept-Language': 'en',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
  } catch {
    clearTimeout(timeoutId);
  }

  return null;
}
