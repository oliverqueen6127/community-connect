-- ============================================================
-- RLS fix: allow public read of active listings + admin access
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- Helper: drop a policy if it already exists (idempotent re-run)
-- We recreate all policies so existing misconfigured ones are fixed.

-- ── BUSINESSES ──────────────────────────────────────────────

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active businesses"  ON public.businesses;
DROP POLICY IF EXISTS "Owners read own businesses"     ON public.businesses;
DROP POLICY IF EXISTS "Admins read all businesses"     ON public.businesses;
DROP POLICY IF EXISTS "Authenticated insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners update businesses"       ON public.businesses;
DROP POLICY IF EXISTS "Owners delete businesses"       ON public.businesses;

-- Anyone (including unauthenticated) can read active listings
CREATE POLICY "Public read active businesses" ON public.businesses
  FOR SELECT USING (status = 'active');

-- Owners can read their own listings regardless of status
CREATE POLICY "Owners read own businesses" ON public.businesses
  FOR SELECT USING (auth.uid() = owner_id);

-- Admins can read everything
CREATE POLICY "Admins read all businesses" ON public.businesses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can insert their own listings
CREATE POLICY "Authenticated insert businesses" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own listings
CREATE POLICY "Owners update businesses" ON public.businesses
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their own listings; admins can delete any
CREATE POLICY "Owners delete businesses" ON public.businesses
  FOR DELETE USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── EVENTS ──────────────────────────────────────────────────

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active events"   ON public.events;
DROP POLICY IF EXISTS "Owners read own events"      ON public.events;
DROP POLICY IF EXISTS "Admins read all events"      ON public.events;
DROP POLICY IF EXISTS "Authenticated insert events" ON public.events;
DROP POLICY IF EXISTS "Owners update events"        ON public.events;
DROP POLICY IF EXISTS "Owners delete events"        ON public.events;

CREATE POLICY "Public read active events" ON public.events
  FOR SELECT USING (status = 'active');

CREATE POLICY "Owners read own events" ON public.events
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Admins read all events" ON public.events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated insert events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update events" ON public.events
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete events" ON public.events
  FOR DELETE USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── HOUSING ─────────────────────────────────────────────────

ALTER TABLE public.housing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active housing"   ON public.housing;
DROP POLICY IF EXISTS "Owners read own housing"      ON public.housing;
DROP POLICY IF EXISTS "Admins read all housing"      ON public.housing;
DROP POLICY IF EXISTS "Authenticated insert housing" ON public.housing;
DROP POLICY IF EXISTS "Owners update housing"        ON public.housing;
DROP POLICY IF EXISTS "Owners delete housing"        ON public.housing;

CREATE POLICY "Public read active housing" ON public.housing
  FOR SELECT USING (status = 'active');

CREATE POLICY "Owners read own housing" ON public.housing
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Admins read all housing" ON public.housing
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated insert housing" ON public.housing
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update housing" ON public.housing
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete housing" ON public.housing
  FOR DELETE USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── JOBS ────────────────────────────────────────────────────

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active jobs"   ON public.jobs;
DROP POLICY IF EXISTS "Owners read own jobs"      ON public.jobs;
DROP POLICY IF EXISTS "Admins read all jobs"      ON public.jobs;
DROP POLICY IF EXISTS "Authenticated insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Owners update jobs"        ON public.jobs;
DROP POLICY IF EXISTS "Owners delete jobs"        ON public.jobs;

CREATE POLICY "Public read active jobs" ON public.jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Owners read own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Admins read all jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated insert jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete jobs" ON public.jobs
  FOR DELETE USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── REALTIME: add all 4 tables to the publication ───────────
-- Required for postgres_changes subscriptions to fire.
-- Run once; safe to run again (IF NOT EXISTS-like semantics).

ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- ── SUPPORT REPLIES: user INSERT policy ─────────────────────
-- Required for users to send follow-up messages in a support thread.
-- Assumes support_replies and support_messages tables already exist.

ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own replies" ON public.support_replies;

CREATE POLICY "Users can insert their own replies"
ON public.support_replies
FOR INSERT
TO authenticated
WITH CHECK (
  sender_role = 'user' AND
  sender_id = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM public.support_messages
    WHERE id = support_message_id
      AND user_id = auth.uid()::text
  )
);

-- Users can also read replies on their own support messages
DROP POLICY IF EXISTS "Users can read replies on own messages" ON public.support_replies;

CREATE POLICY "Users can read replies on own messages"
ON public.support_replies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_messages
    WHERE id = support_message_id
      AND user_id = auth.uid()::text
  )
);

-- ── REALTIME: enable for support tables ──────────────────────
-- Required for postgres_changes subscriptions (Messenger feature).

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_replies;

-- ── SUPPORT: allow users to update read status of their own replies ──────────
-- Required so markReplyRead() works for regular users.
DROP POLICY IF EXISTS "Users can update read status of own replies" ON public.support_replies;

CREATE POLICY "Users can update read status of own replies"
ON public.support_replies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_messages
    WHERE id = support_message_id
      AND user_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_messages
    WHERE id = support_message_id
      AND user_id = auth.uid()::text
  )
);

-- ── SUPPORT: allow users to update their own thread status ───────────────────
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own threads
DROP POLICY IF EXISTS "Users can read own support threads" ON public.support_messages;
CREATE POLICY "Users can read own support threads"
ON public.support_messages
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Users can update status on their own threads (e.g., re-mark as unread after follow-up)
DROP POLICY IF EXISTS "Users can update own support thread status" ON public.support_messages;
CREATE POLICY "Users can update own support thread status"
ON public.support_messages
FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ── CLEANUP: merge duplicate support threads per user ────────────────────────
-- Run this ONCE to clean up existing duplicates.
-- Keeps the OLDEST thread per user; moves all replies to it; deletes extras.
-- Safe to run multiple times (idempotent after first run).

DO $$
DECLARE
  dup RECORD;
  keep_id uuid;
BEGIN
  FOR dup IN
    SELECT user_id
    FROM public.support_messages
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Identify the thread to keep (oldest by created_at)
    SELECT id INTO keep_id
    FROM public.support_messages
    WHERE user_id = dup.user_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Move all replies from newer threads into the kept thread
    UPDATE public.support_replies
    SET support_message_id = keep_id
    WHERE support_message_id IN (
      SELECT id FROM public.support_messages
      WHERE user_id = dup.user_id AND id != keep_id
    );

    -- Delete the now-empty duplicate threads
    DELETE FROM public.support_messages
    WHERE user_id = dup.user_id AND id != keep_id;
  END LOOP;
END;
$$;

-- ── VERIFY ──────────────────────────────────────────────────
-- After running, confirm with:
--   SELECT schemaname, tablename, policyname, cmd, qual
--   FROM pg_policies
--   WHERE tablename IN ('businesses', 'events', 'housing', 'jobs', 'support_replies', 'support_messages')
--   ORDER BY tablename, policyname;
--
-- Verify one thread per user:
--   SELECT user_id, COUNT(*) FROM public.support_messages GROUP BY user_id HAVING COUNT(*) > 1;
