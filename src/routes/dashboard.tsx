import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  CalendarPlus,
  ClipboardList,
  FolderKanban,
  GraduationCap,
} from "lucide-react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { DashboardHero } from "@/components/member/DashboardHero";
import { ProfileCompletenessMeter } from "@/components/member/ProfileCompletenessMeter";
import { WatchedProjectsPanel } from "@/components/member/WatchedProjectsPanel";
import { YourWeekSection } from "@/components/member/YourWeekSection";
import { ResearchContinueCard } from "@/components/member/ResearchContinueCard";
import { TodayFocus } from "@/components/member/TodayFocus";
import { AttentionPanel } from "@/components/member/AttentionPanel";
import { CollectionsStrip } from "@/components/member/CollectionsStrip";
import { ContinueReadingStrip } from "@/components/member/ContinueReadingStrip";
import { DigestPreviewCard } from "@/components/member/DigestPreviewCard";
import { EngagementSummaryPanel } from "@/components/member/EngagementSummary";
import { FeedCard } from "@/components/member/FeedCard";
import { LoadingState } from "@/components/member/LoadingState";
import { MetricCard } from "@/components/member/MetricCard";
import { OnboardingChecklist } from "@/components/member/OnboardingChecklist";
import { StaggerItem, StaggerList } from "@/components/member/PageTransition";
import { ReadingHeatmap } from "@/components/member/ReadingHeatmap";
import { ReadingStreakWidget } from "@/components/member/ReadingStreakWidget";
import { QuickActions } from "@/components/member/QuickActions";
import { MemberLayout } from "@/components/member/MemberLayout";
import { RoleBadge } from "@/components/member/RoleBadge";
import { SectionHeader } from "@/components/member/SectionHeader";
import { getAllGuides } from "@/content/guides";
import { useAuth } from "@/lib/auth";
import { eventLink, memberLink } from "@/lib/app-paths";
import {
  useDashboardCatalogQuery,
  useDashboardMemberQuery,
} from "@/lib/queries/use-dashboard-data";
import { buildIcsEvent, downloadIcs } from "@/lib/calendar";
import { daysUntil, formatDate, nearestDeadline } from "@/lib/date";
import { buildForYouFeed } from "@/lib/personalization";
import type { ForYouItem } from "@/lib/personalization";
import { profileCompleteness } from "@/lib/profile";
import { fetchSavedItems, savedItemHref } from "@/lib/saved";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — The Bu1ld" }],
  }),
});

const EMPTY_APPLICATIONS: import("@/lib/types").ProjectApplication[] = [];
const EMPTY_RSVPS: import("@/lib/types").MlEvent[] = [];

function DashboardPage() {
  return (
    <RequireMember>
      <DashboardHome />
    </RequireMember>
  );
}

function DashboardHome() {
  const { user, profile, emailVerified } = useAuth();
  const catalogQuery = useDashboardCatalogQuery();
  const loading = catalogQuery.isLoading;
  const events = catalogQuery.data?.events ?? [];
  const papers = catalogQuery.data?.papers ?? [];
  const newsletters = catalogQuery.data?.newsletters ?? [];
  const openProjects = catalogQuery.data?.openProjects ?? [];
  const internalJobs = catalogQuery.data?.internalJobs ?? [];
  const announcements = catalogQuery.data?.announcements ?? [];
  const memberQuery = useDashboardMemberQuery(user?.id, profile, events);
  const guideProgress = memberQuery.data?.guideProgress ?? {};
  const myApplications = memberQuery.data?.myApplications ?? EMPTY_APPLICATIONS;
  const activity = memberQuery.data?.activity ?? [];
  const savedItems = memberQuery.data?.savedItems ?? [];
  const unreadNotifications = memberQuery.data?.unreadNotifications ?? 0;
  const recentViews = memberQuery.data?.recentViews ?? [];
  const similarMembers = memberQuery.data?.similarMembers ?? [];
  const myRsvps = memberQuery.data?.myRsvps ?? EMPTY_RSVPS;
  const engagement = memberQuery.data?.engagement ?? null;
  const attention = memberQuery.data?.attention ?? [];
  const papersThisWeek = memberQuery.data?.papersThisWeek ?? 0;
  const [forYou, setForYou] = useState<ForYouItem[]>([]);
  const [forYouKey, setForYouKey] = useState(0);

  useEffect(() => {
    if (!user || !profile?.interests?.length) return;
    void (async () => {
      const saved = await fetchSavedItems(user.id);
      const exclude = new Set(saved.map((s) => `${s.item_type}:${s.item_slug}`));
      for (const app of myApplications) {
        if (app.project_slug) exclude.add(`project:${app.project_slug}`);
      }
      const feed = await buildForYouFeed(profile.interests, { excludeSlugs: exclude });
      setForYou(feed);
    })();
  }, [user, profile?.interests, myApplications, forYouKey]);

  const displayName = profile?.full_name || user?.email || "Member";
  const hubBio = profile?.bio?.trim()
    ? profile.bio
    : profile?.interests?.length
      ? `Interests set to ${profile.interests.slice(0, 3).join(", ")}${profile.interests.length > 3 ? ` +${profile.interests.length - 3} more` : ""}. Your For You feed, digest, and directory matches are ranked from these tags.`
      : "Your dashboard — open projects, paper reviews, reading paths, event deadlines, and saved collections. Add interests in your profile to rank the For You feed.";
  const guides = getAllGuides();
  const completeness = profileCompleteness(profile);

  const continueGuide = guides
    .map((g) => ({ ...g, progress: guideProgress[g.slug] ?? 0 }))
    .filter((g) => g.progress > 0 && g.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];

  const nextEvent = events
    .map((e) => ({ event: e, deadline: nearestDeadline(e.deadlines) }))
    .filter((x) => x.deadline)
    .sort((a, b) => (a.deadline!.days ?? 999) - (b.deadline!.days ?? 999))[0];

  const latestPaper = papers[0];
  const latestNewsletter = newsletters[0];
  const unreadGuides = guides.filter((g) => (guideProgress[g.slug] ?? 0) < 1).length;
  const pinned = announcements.find((a) => a.pinned) ?? announcements[0] ?? null;

  const weeklyDeadlines = events
    .flatMap((e) =>
      e.deadlines.map((d) => ({
        event: e,
        label: d.label,
        date: d.date,
        days: daysUntil(d.date) ?? 999,
      })),
    )
    .filter((d) => d.days >= 0 && d.days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const rsvpEventIds = useMemo(() => new Set(myRsvps.map((e) => e.id)), [myRsvps]);

  return (
    <MemberLayout>
      <DashboardHero
        displayName={displayName}
        bio={hubBio}
        completenessPercent={completeness.percent}
        roleBadge={profile?.role ? <RoleBadge role={profile.role} /> : null}
      />

      {!emailVerified && user?.email ? (
        <div className="mb-6 rounded-sm border border-accent-red/25 bg-accent-red/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Verify <strong className="text-bone">{user.email}</strong> to secure your account.
          </p>
          <Link
            to="/account/security"
            className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
          >
            Resend verification →
          </Link>
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Loading dashboard…" />
      ) : (
        <>
          <section className="section-gap grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label="Open projects"
              value={String(openProjects.length)}
              to="/projects"
              accent="blue"
              icon={FolderKanban}
            />
            <MetricCard
              label="Applications"
              value={String(myApplications.length)}
              to="/applications"
              accent="green"
              icon={ClipboardList}
            />
            <MetricCard
              label="Saved"
              value={String(savedItems.length)}
              to="/saved"
              icon={Bookmark}
            />
            <MetricCard
              label="Notifications"
              value={String(unreadNotifications)}
              to="/notifications"
              accent="red"
              icon={Bell}
            />
            <MetricCard
              label="Guides unread"
              value={String(unreadGuides)}
              to="/guides"
              accent="violet"
              icon={GraduationCap}
            />
          </section>

          {user ? (
            <div className="section-gap grid gap-4 lg:grid-cols-2">
              <ReadingStreakWidget userId={user.id} className="h-full" />
              <ReadingHeatmap userId={user.id} />
            </div>
          ) : null}

          <YourWeekSection
            events={events}
            papers={papers}
            projects={openProjects}
            guideUnread={unreadGuides}
            weeklyPaperGoal={profile?.weekly_paper_goal ?? 2}
            papersReadThisWeek={papersThisWeek}
          />

          {completeness.percent < 100 ? (
            <section className="section-gap">
              <ProfileCompletenessMeter
                percent={completeness.percent}
                steps={completeness.steps}
                compact
              />
            </section>
          ) : null}

          {user ? <WatchedProjectsPanel userId={user.id} /> : null}

          {user ? <CollectionsStrip userId={user.id} /> : null}

          <DigestPreviewCard />

          <TodayFocus items={attention} />

          {user ? <ResearchContinueCard userId={user.id} /> : null}

          <AttentionPanel items={attention} />

          <QuickActions />

          {engagement ? <EngagementSummaryPanel stats={engagement} /> : null}

          <ContinueReadingStrip views={recentViews} />

          {savedItems.length > 0 ? (
            <section className="section-gap">
              <SectionHeader
                title="Recently saved"
                action={
                  <Link
                    to="/saved"
                    className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone transition-colors"
                  >
                    View all →
                  </Link>
                }
              />
              <div className="flex flex-wrap gap-2">
                {savedItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    to={savedItemHref(item.item_type, item.item_slug)}
                    className="rounded-sm border border-border/60 px-3 py-2 text-sm text-bone hover:border-bone/30 transition"
                  >
                    {item.item_title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {user && profile ? (
            <OnboardingChecklist
              userId={user.id}
              progress={{
                profileComplete: !!profile.onboarding_completed && completeness.percent >= 80,
                hasApplicationOrSave: myApplications.length > 0 || savedItems.length > 0,
                hasReadGuide: Object.values(guideProgress).some((p) => p >= 95),
                hasVerifiedEmail: emailVerified,
                hasSetInterests: (profile.interests?.length ?? 0) > 0,
                continueGuideHref: continueGuide ? `/guides/${continueGuide.slug}` : undefined,
              }}
            />
          ) : null}

          {!profile?.onboarding_completed || completeness.percent < 100 ? (
            <div className="mb-8 rounded-xl border border-border/50 panel glass px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue">
                  {!profile?.onboarding_completed ? "Onboarding" : "Profile depth"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
                  {!profile?.onboarding_completed
                    ? "Complete onboarding so project leads see your background, interests, and links when you apply."
                    : `Profile is ${completeness.percent}% complete — still missing ${completeness.missing.slice(0, 3).join(", ")}${completeness.missing.length > 3 ? "…" : ""}. Project leads and the member directory weight complete profiles higher in search and application review.`}
                </p>
              </div>
              <Link
                to={!profile?.onboarding_completed ? "/onboarding" : "/profile"}
                className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-blue hover:text-bone shrink-0"
              >
                {!profile?.onboarding_completed ? "Complete onboarding →" : "Finish profile →"}
              </Link>
            </div>
          ) : null}

          {pinned ? (
            <div className="mb-8 rounded-sm border border-accent-green/30 bg-accent-green/5 px-5 py-5">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-accent-green">
                {pinned.title}
              </p>
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{pinned.body}</p>
              {pinned.href ? (
                <Link
                  to={pinned.href}
                  className="mt-4 inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
                >
                  Read more →
                </Link>
              ) : null}
            </div>
          ) : null}

          {announcements.length > 1 ? (
            <section className="section-gap">
              <SectionHeader title="Recent updates" />
              <div className="grid gap-px border border-border/40 bg-border/40">
                {announcements
                  .filter((a) => a.id !== pinned?.id)
                  .slice(0, 3)
                  .map((a) => (
                    <div key={a.id} className="bg-background/70 p-4">
                      <p className="font-display text-base text-bone">{a.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}

          {weeklyDeadlines.length > 0 ? (
            <section className="section-gap">
              <SectionHeader title="This week — deadlines" accent="blue" />
              <ul className="rounded-sm border border-accent-blue/20 bg-accent-blue/5 px-5 py-5 space-y-2 text-sm">
                {weeklyDeadlines.map((d) => (
                  <li
                    key={`${d.event.slug}-${d.date}`}
                    className="flex justify-between gap-4 items-center"
                  >
                    <Link
                      {...eventLink(d.event.slug)}
                      className="text-bone hover:text-accent-blue transition flex items-center gap-2"
                    >
                      {d.event.title} — {d.label}
                      {rsvpEventIds.has(d.event.id) ? (
                        <span className="font-mono text-[8px] tracking-[0.15em] uppercase text-accent-green border border-accent-green/30 px-1.5 py-0.5 rounded-sm">
                          Going
                        </span>
                      ) : null}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        aria-label={`Add ${d.event.title} — ${d.label} to calendar`}
                        title="Add to calendar"
                        onClick={() => {
                          const ics = buildIcsEvent({
                            title: `${d.event.title} — ${d.label}`,
                            startDate: d.date,
                            description: d.event.summary ?? undefined,
                            location: d.event.location,
                          });
                          downloadIcs(`${d.event.slug}-${d.label}.ics`, ics);
                        }}
                        className="text-muted-foreground hover:text-bone"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-[9px] uppercase text-muted-foreground">
                        {d.days === 0 ? "Today" : `${d.days}d`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {myRsvps.length > 0 ? (
            <section className="section-gap">
              <SectionHeader title="Events you're attending" accent="green" />
              <ul className="rounded-sm border border-border/40 divide-y divide-border/40">
                {myRsvps.map((e) => (
                  <li key={e.id}>
                    <Link
                      {...eventLink(e.slug)}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-bone/5 transition block"
                    >
                      <span className="text-bone">{e.title}</span>
                      {e.start_date ? (
                        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                          {formatDate(e.start_date)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {forYou.length > 0 ? (
            <section className="section-gap">
              <SectionHeader
                title="For you"
                accent="green"
                description="Open projects, paper reviews, events, and guides ranked by interest-tag overlap — items you have already saved or applied to are excluded."
                action={
                  <button
                    type="button"
                    onClick={() => setForYouKey((k) => k + 1)}
                    className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone transition-colors"
                  >
                    Refresh feed
                  </button>
                }
              />
              <p className="text-sm text-muted-foreground mb-4 -mt-2">
                Based on your interests: {profile?.interests?.slice(0, 4).join(", ")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {forYou.map((item) => (
                  <Link
                    key={`${item.type}-${item.href}`}
                    to={item.href}
                    className="panel panel-interactive p-5 rounded-sm block"
                  >
                    <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-blue">
                      {item.type}
                    </span>
                    <h3 className="font-display text-lg text-bone mt-2">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                    {item.matchTags.length > 0 ? (
                      <p className="mt-2 font-mono text-[8px] tracking-[0.12em] uppercase text-accent-green">
                        Matches: {item.matchTags.slice(0, 3).join(", ")}
                      </p>
                    ) : null}
                    {item.reason ? (
                      <p className="mt-1 font-mono text-[8px] tracking-[0.1em] uppercase text-muted-foreground">
                        {item.reason}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : profile?.interests?.length ? (
            <section className="mb-8 rounded-sm border border-border/60 bg-background/60 px-5 py-4">
              <p className="text-sm text-muted-foreground">
                No matches for your current interests — add tags in your profile or browse the
                research library to seed new ones.
              </p>
              <Link
                to="/profile"
                className="mt-3 inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
              >
                Update interests →
              </Link>
            </section>
          ) : (
            <section className="mb-8 rounded-sm border border-accent-green/20 bg-accent-green/5 px-5 py-4">
              <p className="text-sm text-foreground/90">
                Add research interests in your profile to populate the For You feed — it ranks open
                projects, paper reviews, events, and guides by tag overlap and upcoming deadlines.
              </p>
              <Link
                to="/profile"
                className="mt-3 inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-accent-green hover:text-bone"
              >
                Add interests →
              </Link>
            </section>
          )}

          {similarMembers.length > 0 ? (
            <section className="section-gap">
              <SectionHeader
                title="People like you"
                description="Directory members who share at least one interest tag with you — useful for finding co-authors, reviewers, or project teammates."
                action={
                  <Link
                    to="/members"
                    className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
                  >
                    Directory →
                  </Link>
                }
              />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {similarMembers.map(({ member, overlap }) => (
                  <Link
                    key={member.id}
                    {...memberLink(member.id)}
                    className="panel panel-interactive p-4 rounded-sm block"
                  >
                    <h3 className="font-display text-base text-bone">
                      {member.full_name ?? "Member"}
                    </h3>
                    {overlap.length ? (
                      <p className="mt-2 font-mono text-[8px] tracking-[0.1em] uppercase text-accent-green">
                        Shared: {overlap.slice(0, 3).join(", ")}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {activity.length > 0 ? (
            <section className="section-gap">
              <SectionHeader
                title="Activity"
                description="Chronological log of your applications, saves, paper reads, guide progress, and event RSVPs — each entry links back to the source."
              />
              <div className="grid gap-px border border-border/40 bg-border/40">
                {activity.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="bg-background/75 p-4 list-row-hover transition block"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue">
                        {item.kind}
                      </span>
                    </div>
                    <p className="mt-1 font-display text-base text-bone">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{item.body}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <SectionHeader
            title="Explore"
            description="Resume in-progress guides, check the nearest conference deadline, read the latest paper review, and jump to your most recent application — sourced from your account activity, not a generic feed."
          />
          <StaggerList className="grid gap-2 sm:grid-cols-2">
            <StaggerItem>
              <FeedCard
                tag="continue reading"
                title={continueGuide ? continueGuide.title : "Explore guides"}
                body={
                  continueGuide
                    ? `${Math.round(continueGuide.progress)}% through — pick up where you left off.`
                    : "Reference essays on attention, JEPA, PINNs, LLM internals, and the paper-to-prototype method — scroll progress saves per guide."
                }
                to={continueGuide ? `/guides/${continueGuide.slug}` : "/guides"}
                cta={continueGuide ? "Resume →" : "Browse guides →"}
              />
            </StaggerItem>
            <StaggerItem>
              <FeedCard
                tag="events radar"
                title={nextEvent ? nextEvent.event.title : "No upcoming deadlines"}
                body={
                  nextEvent?.deadline
                    ? `${nextEvent.deadline.label} in ${nextEvent.deadline.days} days — ${formatDate(nextEvent.deadline.date)}`
                    : "Conference calendar with CFP dates, prep notes, RSVP tracking, and .ics export."
                }
                to={nextEvent ? `/events/${nextEvent.event.slug}` : "/events"}
                cta="View events →"
              />
            </StaggerItem>
            <StaggerItem>
              <FeedCard
                tag="latest paper"
                title={latestPaper?.title ?? "Paper reviews"}
                body={
                  latestPaper?.summary ??
                  "Member reviews on transformer classics and active research threads — methods, failure modes, and prototype ideas."
                }
                to={latestPaper ? `/papers/${latestPaper.slug}` : "/papers"}
                cta="Read review →"
              />
            </StaggerItem>
            <StaggerItem>
              <FeedCard
                tag="open projects"
                title={openProjects[0]?.title ?? "Browse projects"}
                body={
                  openProjects.length
                    ? `${openProjects.length} project${openProjects.length !== 1 ? "s" : ""} accepting applications.`
                    : "Research threads, startups, and program tracks."
                }
                to={openProjects[0] ? `/projects/${openProjects[0].slug}` : "/projects"}
                cta="View projects →"
              />
            </StaggerItem>
            <StaggerItem>
              <FeedCard
                tag="your applications"
                title={
                  myApplications[0]
                    ? (myApplications[0].project_title ?? "Application")
                    : "Apply to a project"
                }
                body={
                  myApplications.length
                    ? `${myApplications.length} application${myApplications.length !== 1 ? "s" : ""} — latest: ${myApplications[0].status}.`
                    : "Join a research thread, startup build, or program cohort — pitch required."
                }
                to="/applications"
                cta={myApplications.length ? "Track applications →" : "Browse projects →"}
              />
            </StaggerItem>
          </StaggerList>

          <StaggerList className="mt-6 grid gap-2 sm:grid-cols-2" stagger={0.05}>
            <StaggerItem>
              <FeedCard
                tag="newsletter"
                title={latestNewsletter?.title ?? "The Bu1ld digest"}
                body={
                  latestNewsletter?.summary ??
                  "Community updates, paper picks, and startup spotlights."
                }
                to={latestNewsletter ? `/newsletter/${latestNewsletter.slug}` : "/newsletter"}
                cta="Read issue →"
              />
            </StaggerItem>
            <StaggerItem>
              <FeedCard
                tag="jobs"
                title={internalJobs[0]?.title ?? "Job board"}
                body={
                  internalJobs.length
                    ? `${internalJobs.length} internal role${internalJobs.length !== 1 ? "s" : ""} posted by The Bu1ld + vetted external listings from partner labs.`
                    : "Internal research-engineering roles and vetted external ML positions — track status in the job tracker."
                }
                to={internalJobs[0] ? `/jobs/${internalJobs[0].slug}` : "/jobs"}
                cta="View jobs →"
              />
            </StaggerItem>
            <StaggerItem>
              <FeedCard
                tag="project lead"
                title="Want to run a thread?"
                body="Verified leads create project listings, review application queues, and post updates. Submit a lead request with shipped work and the thread you want to run."
                to="/lead/apply"
                cta="Request lead status →"
              />
            </StaggerItem>
          </StaggerList>

          <section className="mt-10 section-gap">
            <SectionHeader
              title="Quick links"
              description="Direct links to search, saved items, applications, reading paths, and account settings — every member route in one row."
            />
            <div className="flex flex-wrap gap-3">
              {[
                ["/search", "Search"],
                ["/saved", "Saved"],
                ["/projects", "Projects"],
                ["/jobs", "Jobs"],
                ["/events", "Events"],
                ["/guides", "Guides"],
                ["/papers", "Papers"],
                ["/newsletter", "Newsletter"],
                ["/members", "Members"],
                ["/applications", "Applications"],
                ["/notifications", "Notifications"],
                ["/profile", "Profile"],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="rounded-sm border border-border/60 px-4 py-2 font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone hover:border-bone/30 transition"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </MemberLayout>
  );
}
