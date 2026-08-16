-- Migration: Add Delivery OTP Column to Orders Table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(6);

-- Function to auto-generate 4-digit delivery OTP when order is created or updated
CREATE OR REPLACE FUNCTION public.generate_delivery_otp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delivery_otp IS NULL THEN
    NEW.delivery_otp := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign delivery_otp
DROP TRIGGER IF EXISTS trg_assign_delivery_otp ON public.orders;
CREATE TRIGGER trg_assign_delivery_otp
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_delivery_otp();
