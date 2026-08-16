import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateSellerDeliveryCoverage, CustomerAddress, DeliveryCheckResult } from '@/lib/delivery/coverage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeIds, customerAddress } = body as {
      storeIds: string[];
      customerAddress: CustomerAddress;
    };

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'storeIds array is required.' },
        { status: 400 }
      );
    }

    if (!customerAddress) {
      return NextResponse.json(
        { success: false, error: 'customerAddress is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch Store Details
    const { data: stores, error: storeErr } = await supabase
      .from('medical_stores')
      .select('id, store_name, address, city, state, pincode, latitude, longitude')
      .in('id', storeIds);

    if (storeErr || !stores) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch medical store records.' },
        { status: 500 }
      );
    }

    // 2. Fetch Seller Delivery Settings & Areas
    const { data: settings } = await supabase
      .from('seller_delivery_settings')
      .select('*, seller_delivery_areas(*)')
      .in('store_id', storeIds);

    const settingsMap: Record<string, any> = {};
    if (settings) {
      settings.forEach((s: any) => {
        settingsMap[s.store_id] = {
          ...s,
          areas: s.seller_delivery_areas || [],
        };
      });
    }

    // 3. Evaluate each store independently
    const results: DeliveryCheckResult[] = [];
    let allAvailable = true;

    for (const store of stores) {
      const storeSettings = settingsMap[store.id] || null;
      const res = evaluateSellerDeliveryCoverage(store, storeSettings, customerAddress);
      results.push(res);
      if (!res.isAvailable) {
        allAvailable = false;
      }
    }

    return NextResponse.json({
      success: true,
      allAvailable,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error evaluating delivery coverage.' },
      { status: 500 }
    );
  }
}
