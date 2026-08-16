-- Migration: Seller Delivery Coverage & Service Area Management Schema

-- 1. Create seller_delivery_settings table
CREATE TABLE IF NOT EXISTS public.seller_delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.medical_stores(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coverage_type VARCHAR(50) NOT NULL DEFAULT 'INDIA_WIDE',
  match_mode VARCHAR(20) NOT NULL DEFAULT 'ANY_MATCH',
  radius_km DOUBLE PRECISION DEFAULT 5.0,
  country VARCHAR(100) DEFAULT 'India',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_store_delivery_settings UNIQUE (store_id)
);

-- 2. Create seller_delivery_areas table for granular area/PIN/district/state rules
CREATE TABLE IF NOT EXISTS public.seller_delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.medical_stores(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  area_type VARCHAR(50) NOT NULL, -- LOCAL_AREA, PIN_CODE, DISTRICT, STATE, COUNTRY
  area_value VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup during customer checkout
CREATE INDEX IF NOT EXISTS idx_seller_delivery_settings_store ON public.seller_delivery_settings(store_id);
CREATE INDEX IF NOT EXISTS idx_seller_delivery_areas_store_type ON public.seller_delivery_areas(store_id, area_type);

-- 3. Extend orders table with delivery coverage decision snapshot columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_coverage_rule VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_distance DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_availability_status VARCHAR(50) DEFAULT 'AVAILABLE';

-- 4. Enable Row Level Security
ALTER TABLE public.seller_delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_delivery_areas ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for seller_delivery_settings
CREATE POLICY "Public and Customers can view active seller delivery settings"
  ON public.seller_delivery_settings FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage own store delivery settings"
  ON public.seller_delivery_settings FOR ALL
  USING (
    seller_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.medical_stores
      WHERE id = seller_delivery_settings.store_id AND owner_profile_id = auth.uid()
    )
  );

-- 6. RLS Policies for seller_delivery_areas
CREATE POLICY "Public and Customers can view active seller delivery areas"
  ON public.seller_delivery_areas FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage own store delivery areas"
  ON public.seller_delivery_areas FOR ALL
  USING (
    seller_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.medical_stores
      WHERE id = seller_delivery_areas.store_id AND owner_profile_id = auth.uid()
    )
  );
