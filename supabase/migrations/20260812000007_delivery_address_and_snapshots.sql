-- Migration: Delivery Address Extensions and Order Address Snapshots

-- 1. Extend public.addresses table with additional location details
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS post_office VARCHAR(100),
  ADD COLUMN IF NOT EXISTS locality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS instructions TEXT;

-- 2. Extend public.orders table with immutable delivery address snapshot columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS delivery_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_landmark TEXT,
  ADD COLUMN IF NOT EXISTS delivery_locality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_post_office VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(10),
  ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;
