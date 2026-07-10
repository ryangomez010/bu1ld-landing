import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { FeedCard } from "@/components/member/FeedCard";
import { LoadingState } from "@/components/member/LoadingState";
import { MetricCard } from "@/components/member/MetricCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { RoleBadge } from "@/components/member/RoleBadge";
import { getAllGuides } from "@/content/guides";
import { fetchAnnouncements } from "@/lib/announcements";
import { buildActivityFeed } from "@/lib/activity";
import type { ActivityItem } from "@/lib/activity";
import { useAuth } from "@/lib/auth";
import { buildIcsEvent, downloadIcs } from "@/lib/calendar";
import { fetchEvents, fetchNewsletters, fetchPapers } from "@/lib/content";
import { daysUntil, formatDate, nearestDeadline } from "@/lib/date";
import { buildForYouFeed } from "@/lib/personalization";
import type { ForYouItem } from "@/lib/personalization";
import { profileCompleteness } from "@/lib/profile";
import { unreadCount } from "@/lib/notifications";
import { getAllGuideProgress } from "@/lib/reading-progress";
import { fetchJobs, fetchMyApplications, fetchProjects } from "@/lib/projects";
import { fetchSavedItems, savedItemHref } from "@/lib/saved";
import type { Announcement } from "@/data/seed/announcements";
import type {
  Job,
  MlEvent,
  NewsletterIssue,
  Paper,
  Project,
  ProjectApplication,
} from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardHome />
    </RequireAuth>
  );
}

function DashboardHome() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MlEvent[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterIssue[]>([]);
  const [guideProgress, setGuideProgress] = useState<Record<string, number>>({});
  const [openProjects, setOpenProjects] = useState<Project[]>([]);
  const [myApplications, setMyApplications] = useState<ProjectApplication[]>([]);
  const [internalJobs, setInternalJobs] = useState<Job[]>([]);
  const [forYou, setForYou] = useState<ForYouItem[]>([]);
  const [forYouKey, setForYouKey] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [savedItems, setSavedItems] = useState<Awaited<ReturnType<typeof fetchSavedItems>>>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    void Promise.all([
      fetchEvents(),
      fetchPapers(),
      fetchNewsletters(),
      fetchProjects("open"),
      fetchJobs("internal"),
      fetchAnnouncements(),
    ]).then(([e, p, n, proj, jobs, anns]) => {
      setEvents(e);
      setPapers(p);
      setNewsletters(n);
      setOpenProjects(proj);
      setInternalJobs(jobs);
      setAnnouncements(anns);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void getAllGuideProgress(user.id).then(setGuideProgress);
    void fetchMyApplications(user.id).then(setMyApplications);
    void buildActivityFeed(user.id).then(setActivity);
    void fetchSavedItems(user.id).then(setSavedItems);
    void unreadCount(user.id).then(setUnreadNotifications);
  }, [user]);

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

  return (
    <MemberLayout>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-green">
            member hub
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-bone mt-3 tracking-tight flex flex-wrap items-center gap-3">
            {displayName}
            {profile?.role ? <RoleBadge role={profile.role} /> : null}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
            {profile?.bio || "Your BUILD hub — events, guides, papers, and digests in one place."}
          </p>
        </div>
        <Link
          to="/profile"
          className="panel panel-interactive rounded-sm px-4 py-3 min-w-[150px] hover:-translate-y-px transition-transform"
        >
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Profile
          </p>
          <p className="mt-1 font-display text-xl text-bone">{completeness.percent}%</p>
          <div className="mt-2 h-1 rounded-full bg-border/60 overflow-hidden">
            <div className="h-full bg-accent-green" style={{ width: `${completeness.percent}%` }} />
          </div>
        </Link>
      </div>

      {loading ? (
        <LoadingState label="Loading hub…" />
      ) : (
        <>
          <section className="mb-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label="Open projects"
              value={String(openProjects.length)}
              to="/projects"
              accent="blue"
            />
            <MetricCard
              label="Applications"
              value={String(myApplications.length)}
              to="/applications"
              accent="green"
            />
            <MetricCard label="Saved" value={String(savedItems.length)} to="/saved" />
            <MetricCard
              label="Notifications"
              value={String(unreadNotifications)}
              to="/notifications"
              accent="red"
            />
            <MetricCard
              label="Guides unread"
              value={String(unreadGuides)}
              to="/guides"
              accent="violet"
            />
          </section>

          {savedItems.length > 0 ? (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  Recently saved
                </h2>
                <Link
                  to="/saved"
                  className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
                >
                  View all →
                </Link>
              </div>
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

          {!profile?.onboarding_completed ? (
            <div className="mb-8 rounded-sm border border-accent-blue/30 bg-accent-blue/5 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-foreground/90">
                Complete your profile so project leads see your background and LinkedIn when you
                apply.
              </p>
              <Link
                to="/onboarding"
                className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-blue hover:text-bone"
              >
                Complete profile →
              </Link>
            </div>
          ) : completeness.percent < 100 ? (
            <div className="mb-8 rounded-sm border border-border/60 bg-background/60 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Profile {completeness.percent}% — missing {completeness.missing.join(", ")}.
              </p>
              <Link
                to="/profile"
                className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-blue hover:text-bone"
              >
                Finish profile →
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
            <section className="mb-8">
              <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                Recent updates
              </h2>
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
            <section className="mb-8 rounded-sm border border-accent-blue/20 bg-accent-blue/5 px-5 py-5">
              <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue mb-3">
                This week — deadlines
              </h2>
              <ul className="space-y-2 text-sm">
                {weeklyDeadlines.map((d) => (
                  <li
                    key={`${d.event.slug}-${d.date}`}
                    className="flex justify-between gap-4 items-center"
                  >
                    <Link
                      to={`/events/${d.event.slug}`}
                      className="text-bone hover:text-accent-blue transition"
                    >
                      {d.event.title} — {d.label}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
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

          {forYou.length > 0 ? (
            <section className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-green">
                  For you
                </h2>
                <button
                  type="button"
                  onClick={() => setForYouKey((k) => k + 1)}
                  className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone"
                >
                  Refresh feed
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4 -mt-2">
                Based on your interests: {profile?.interests?.slice(0, 4).join(", ")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {forYou.map((item) => (
                  <Link
                    key={`${item.type}-${item.href}`}
                    to={item.href}
                    className="panel panel-interactive p-5 rounded-sm block hover:-translate-y-px"
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
                  </Link>
                ))}
              </div>
            </section>
          ) : profile?.interests?.length ? (
            <section className="mb-8 rounded-sm border border-border/60 bg-background/60 px-5 py-4">
              <p className="text-sm text-muted-foreground">
                No personalized matches yet — try adding more interests or explore new content.
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
                Set your interests to get a personalized For You feed across projects, papers, and
                events.
              </p>
              <Link
                to="/profile"
                className="mt-3 inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-accent-green hover:text-bone"
              >
                Add interests →
              </Link>
            </section>
          )}

          {activity.length > 0 ? (
            <section className="mb-8">
              <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Activity
              </h2>
              <div className="grid gap-px border border-border/40 bg-border/40">
                {activity.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="bg-background/75 p-4 hover:bg-bone/5 transition block"
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

          <div className="grid gap-2 sm:grid-cols-2">
            <FeedCard
              tag="continue reading"
              title={continueGuide ? continueGuide.title : "Explore guides"}
              body={
                continueGuide
                  ? `${Math.round(continueGuide.progress)}% through — pick up where you left off.`
                  : "Reference essays on LLMs, attention, JEPA, PINNs, and how BUILD ships."
              }
              to={continueGuide ? `/guides/${continueGuide.slug}` : "/guides"}
              cta={continueGuide ? "Resume →" : "Browse guides →"}
            />
            <FeedCard
              tag="events radar"
              title={nextEvent ? nextEvent.event.title : "No upcoming deadlines"}
              body={
                nextEvent?.deadline
                  ? `${nextEvent.deadline.label} in ${nextEvent.deadline.days} days — ${formatDate(nextEvent.deadline.date)}`
                  : "Conference calendar, prep notes, and LaTeX resources."
              }
              to={nextEvent ? `/events/${nextEvent.event.slug}` : "/events"}
              cta="View events →"
            />
            <FeedCard
              tag="latest paper"
              title={latestPaper?.title ?? "Paper reviews"}
              body={
                latestPaper?.summary ??
                "Curated BUILD reviews on classics and active research threads."
              }
              to={latestPaper ? `/papers/${latestPaper.slug}` : "/papers"}
              cta="Read review →"
            />
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
                  : "Join a research thread or startup build."
              }
              to="/applications"
              cta={myApplications.length ? "Track applications →" : "Browse projects →"}
            />
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <FeedCard
              tag="newsletter"
              title={latestNewsletter?.title ?? "BUILD digest"}
              body={
                latestNewsletter?.summary ??
                "Community updates, paper picks, and startup spotlights."
              }
              to={latestNewsletter ? `/newsletter/${latestNewsletter.slug}` : "/newsletter"}
              cta="Read issue →"
            />
            <FeedCard
              tag="jobs"
              title={internalJobs[0]?.title ?? "Job board"}
              body={
                internalJobs.length
                  ? `${internalJobs.length} BUILD role${internalJobs.length !== 1 ? "s" : ""} + curated external listings.`
                  : "BUILD opportunities and curated external ML roles."
              }
              to={internalJobs[0] ? `/jobs/${internalJobs[0].slug}` : "/jobs"}
              cta="View jobs →"
            />
            <FeedCard
              tag="project lead"
              title="Want to run a thread?"
              body="Verified leads create projects and review applications. Request access if you are ready to ship."
              to="/lead/apply"
              cta="Request lead status →"
            />
          </div>

          <section className="mt-10">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Quick links
            </h2>
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
