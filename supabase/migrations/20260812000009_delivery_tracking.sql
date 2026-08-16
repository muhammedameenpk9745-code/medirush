-- Migration: Real-Time Live Delivery Tracking Schema

-- 1. Create delivery_tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  tracking_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, DELIVERED
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_order_delivery_tracking UNIQUE (order_id)
);

-- Index for fast lookup during customer tracking & Supabase Realtime
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON public.delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_rider ON public.delivery_tracking(rider_id);

-- 2. Enable Row Level Security
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for delivery_tracking
CREATE POLICY "Assigned Rider can insert/update tracking location"
  ON public.delivery_tracking FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.delivery_partners
      WHERE id = delivery_tracking.rider_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Order Customer, Seller, and Admin can view delivery tracking"
  ON public.delivery_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.customers ON customers.id = orders.customer_id
      WHERE orders.id = delivery_tracking.order_id
      AND (customers.profile_id = auth.uid() OR auth.uid() IN (
        SELECT owner_profile_id FROM public.medical_stores WHERE id = orders.store_id
      ))
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Enable Supabase Realtime for delivery_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
