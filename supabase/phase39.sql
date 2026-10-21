-- Phase 39: mentorship and member community. Apply after phase38.sql.
-- These tables deliberately require opt-in availability and authenticated, row-scoped participation.
begin;

create table if not exists public.mentor_profiles (
  mentor_id uuid primary key references public.profiles(id) on delete cascade,
  headline text not null default '' check (char_length(headline) <= 160),
  expertise text[] not null default '{}' check (cardinality(expertise) <= 12),
  availability_note text not null default '' check (char_length(availability_note) <= 500),
  monthly_capacity integer not null default 0 check (monthly_capacity between 0 and 20),
  accepting_requests boolean not null default false,
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mentor_profiles enable row level security;
create policy "Members read visible mentor profiles" on public.mentor_profiles for select
  using (visible or mentor_id = auth.uid() or public.is_platform_admin());
create policy "Mentors create own availability" on public.mentor_profiles for insert
  with check (mentor_id = auth.uid() and (public.has_institution_role(auth.uid(), 'mentor') or public.is_platform_admin()));
create policy "Mentors update own availability" on public.mentor_profiles for update
  using (mentor_id = auth.uid() or public.is_platform_admin())
  with check (mentor_id = auth.uid() or public.is_platform_admin());

create table if not exists public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles(mentor_id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null check (char_length(topic) between 3 and 120),
  goal text not null check (char_length(goal) between 40 and 2000),
  availability_note text not null check (char_length(availability_note) between 3 and 500),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'closed')),
  decision_note text check (decision_note is null or char_length(decision_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, requester_id, topic, status) deferrable initially immediate
);
alter table public.mentorship_requests enable row level security;
create policy "Participants read mentorship requests" on public.mentorship_requests for select
  using (requester_id = auth.uid() or mentor_id = auth.uid() or public.is_platform_admin());
create policy "Members request opted in mentors" on public.mentorship_requests for insert
  with check (requester_id = auth.uid() and requester_id <> mentor_id and status = 'pending'
    and exists (select 1 from public.mentor_profiles mp where mp.mentor_id = mentorship_requests.mentor_id and mp.visible and mp.accepting_requests and mp.monthly_capacity > 0));
create policy "Mentors decide own requests" on public.mentorship_requests for update
  using (mentor_id = auth.uid() or public.is_platform_admin())
  with check ((mentor_id = auth.uid() or public.is_platform_admin()) and status in ('accepted', 'declined', 'closed'));

create table if not exists public.mentorship_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mentorship_requests(id) on delete cascade,
  scheduled_for timestamptz,
  summary text not null check (char_length(summary) between 3 and 2000),
  follow_up text check (follow_up is null or char_length(follow_up) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.mentorship_sessions enable row level security;
create policy "Pairs read mentorship sessions" on public.mentorship_sessions for select using (
  exists (select 1 from public.mentorship_requests mr where mr.id = request_id and mr.status = 'accepted' and (mr.mentor_id = auth.uid() or mr.requester_id = auth.uid())) or public.is_platform_admin());
create policy "Pairs add mentorship sessions" on public.mentorship_sessions for insert with check (
  created_by = auth.uid() and exists (select 1 from public.mentorship_requests mr where mr.id = request_id and mr.status = 'accepted' and (mr.mentor_id = auth.uid() or mr.requester_id = auth.uid())));

create table if not exists public.mentorship_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentorship_sessions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  body text not null check (char_length(body) between 3 and 1500),
  created_at timestamptz not null default now(),
  unique (session_id, author_id)
);
alter table public.mentorship_feedback enable row level security;
create policy "Pairs read mentorship feedback" on public.mentorship_feedback for select using (
  exists (select 1 from public.mentorship_sessions ms join public.mentorship_requests mr on mr.id = ms.request_id where ms.id = session_id and (mr.mentor_id = auth.uid() or mr.requester_id = auth.uid())) or public.is_platform_admin());
create policy "Pairs give own mentorship feedback" on public.mentorship_feedback for insert with check (
  author_id = auth.uid() and exists (select 1 from public.mentorship_sessions ms join public.mentorship_requests mr on mr.id = ms.request_id where ms.id = session_id and (mr.mentor_id = auth.uid() or mr.requester_id = auth.uid())));

create table if not exists public.community_channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 500),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_channels enable row level security;
create policy "Members read published community channels" on public.community_channels for select using (published or public.is_platform_admin());
create policy "Admins manage community channels" on public.community_channels for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.community_channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 3 and 4000),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_posts enable row level security;
create policy "Members read published posts" on public.community_posts for select using (status = 'published' or author_id = auth.uid() or public.is_platform_admin());
create policy "Members create published posts" on public.community_posts for insert with check (author_id = auth.uid() and status = 'published' and exists (select 1 from public.community_channels cc where cc.id = channel_id and cc.published));
create policy "Authors edit own published posts" on public.community_posts for update using (author_id = auth.uid() or public.is_platform_admin()) with check (author_id = auth.uid() or public.is_platform_admin());

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 3 and 2000),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);
alter table public.community_comments enable row level security;
create policy "Members read published comments" on public.community_comments for select using (status = 'published' or author_id = auth.uid() or public.is_platform_admin());
create policy "Members create comments" on public.community_comments for insert with check (author_id = auth.uid() and status = 'published' and exists (select 1 from public.community_posts cp where cp.id = post_id and cp.status = 'published'));

create table if not exists public.community_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('useful', 'insightful', 'welcome')),
  created_at timestamptz not null default now(), primary key (post_id, user_id, reaction)
);
alter table public.community_reactions enable row level security;
create policy "Members read community reactions" on public.community_reactions for select using (true);
create policy "Members manage own reactions" on public.community_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.schema_migrations (phase) values ('phase39') on conflict (phase) do nothing;
commit;
