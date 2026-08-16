-- Migration: Admin Finance, Settings, Settlements, Coupons, and Audit Logs

-- 1. Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Platform Settings
INSERT INTO public.platform_settings (key, value)
VALUES 
  ('delivery_fee', '40'::jsonb),
  ('free_delivery_threshold', '499'::jsonb),
  ('platform_commission_percent', '10'::jsonb),
  ('min_order_amount', '50'::jsonb),
  ('max_order_amount', '50000'::jsonb),
  ('cod_enabled', 'true'::jsonb),
  ('online_payment_enabled', 'true'::jsonb),
  ('marketplace_name', '"MediRush"'::jsonb),
  ('support_email', '"support@kochunddappi.shop"'::jsonb),
  ('support_phone', '"+91 1800-123-4567"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Seller Payout Settlements Table
CREATE TABLE IF NOT EXISTS public.seller_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.medical_stores(id) ON DELETE CASCADE,
  order_count INT DEFAULT 0,
  gross_sales DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  platform_commission DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  net_payable DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, PROCESSING, PAID, FAILED
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coupons & Promotion Rules Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE', -- PERCENTAGE, FIXED
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  max_discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  expiry_date TIMESTAMPTZ,
  usage_limit INT DEFAULT 1000,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Append-Only Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read of active settings & coupons
CREATE POLICY "Public read platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Admin Full Access Policies
CREATE POLICY "Admin full access settings" ON public.platform_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admin full access settlements" ON public.seller_settlements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admin full access coupons" ON public.coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admin full access audit_logs" ON public.audit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);
