-- ==============================================================================
-- Migration: Customer Support Messages & Concierge Inquiries
-- Date: 2026-11-03
-- Description: Stores /contact submissions with honeypot, status, and staff reply.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  order_ref TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
  staff_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast status and query lookups
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages (status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_order_ref ON public.support_messages (order_ref) WHERE order_ref IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 1. Anonymous / Public users can INSERT contact messages (honeypot + rate limits verified in Server Action)
CREATE POLICY "Public insert support_messages"
  ON public.support_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Staff, Managers, and Admins can view and update support messages
CREATE POLICY "Staff view support_messages"
  ON public.support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('staff', 'manager', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff update support_messages"
  ON public.support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('staff', 'manager', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('staff', 'manager', 'admin', 'super_admin')
    )
  );

