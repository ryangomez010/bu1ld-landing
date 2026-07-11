-- Phase 17 — digest send tracking
-- Run after phase16.sql

alter table public.member_preferences
  add column if not exists last_digest_sent_at timestamptz;

-- Service role reads all preferences for scheduled digest sends (no client policy needed).
