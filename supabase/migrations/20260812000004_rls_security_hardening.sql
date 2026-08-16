-- Migration: RLS Security Hardening for Chat Messages, Prescriptions, and Delivery Partner Job Discovery

-- 1. Chat Messages RLS Policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order chat participants can view chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_messages.chat_id
      AND (
        EXISTS (
          SELECT 1 FROM public.customers
          WHERE customers.id = chats.customer_id
          AND customers.profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.delivery_partners
          WHERE delivery_partners.id = chats.delivery_partner_id
          AND delivery_partners.profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Order chat participants can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_messages.chat_id
      AND (
        EXISTS (
          SELECT 1 FROM public.customers
          WHERE customers.id = chats.customer_id
          AND customers.profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.delivery_partners
          WHERE delivery_partners.id = chats.delivery_partner_id
          AND delivery_partners.profile_id = auth.uid()
        )
      )
    )
  );

-- 2. Prescriptions Seller Access Policy
CREATE POLICY "Sellers can view and update prescriptions for their store orders"
  ON public.prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.medical_stores ON medical_stores.id = orders.store_id
      WHERE orders.id = prescriptions.order_id
      AND medical_stores.owner_profile_id = auth.uid()
    )
  );

-- 3. Delivery Partner Unassigned Job Discovery Policy
CREATE POLICY "Verified delivery partners can view unassigned ready orders"
  ON public.orders FOR SELECT
  USING (
    orders.order_status = 'READY_FOR_PICKUP'
    AND orders.delivery_partner_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.delivery_partners
      WHERE delivery_partners.profile_id = auth.uid()
      AND delivery_partners.verification_status = 'APPROVED'
    )
  );
