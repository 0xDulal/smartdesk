-- ==============================================================================
-- SMARTDESK DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Create custom enum types for status, priority, and category
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM ('technical', 'billing', 'account', 'general', 'feature');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL DEFAULT 'general',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_summary TEXT,
  ai_confidence NUMERIC(3, 2),
  ai_suggested_reply TEXT,
  sla_due_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index frequently filtered fields
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- 3. Ticket Messages (Conversation thread)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user has the 'staff' role
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'staff',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tickets Policies
-- Customers can see only their own tickets; staff can see all tickets
DROP POLICY IF EXISTS "Users can view accessible tickets" ON public.tickets;
CREATE POLICY "Users can view accessible tickets"
  ON public.tickets
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff());

-- Authenticated users can create tickets assigned to themselves
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;
CREATE POLICY "Users can insert their own tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff can update any ticket; customers can update their own tickets
DROP POLICY IF EXISTS "Users can update authorized tickets" ON public.tickets;
CREATE POLICY "Users can update authorized tickets"
  ON public.tickets
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_staff())
  WITH CHECK (auth.uid() = user_id OR public.is_staff());

-- Users can delete their own tickets; staff can delete any ticket
DROP POLICY IF EXISTS "Users can delete authorized tickets" ON public.tickets;
CREATE POLICY "Users can delete authorized tickets"
  ON public.tickets
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_staff());

-- 6. Ticket Messages Policies
-- Users can view messages for tickets they have access to
DROP POLICY IF EXISTS "Users can view messages for accessible tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for accessible tickets"
  ON public.ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE public.tickets.id = ticket_messages.ticket_id
      AND (public.tickets.user_id = auth.uid() OR public.is_staff())
    )
  );

-- Users can post messages to tickets they have access to
DROP POLICY IF EXISTS "Users can insert messages to accessible tickets" ON public.ticket_messages;
CREATE POLICY "Users can insert messages to accessible tickets"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE public.tickets.id = ticket_messages.ticket_id
      AND (public.tickets.user_id = auth.uid() OR public.is_staff())
    )
  );
