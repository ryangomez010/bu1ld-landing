-- Phase 6 — admin member role updates + content moderation policies
-- Run after phase5.sql

-- Admins can update any profile (role changes, etc.)
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
