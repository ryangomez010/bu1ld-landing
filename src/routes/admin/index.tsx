import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { slugify } from "@/data/seed/content";
import type { Announcement } from "@/data/seed/announcements";
import { createAnnouncement, fetchAllAnnouncementsAdmin } from "@/lib/announcements";
import { fetchAllEventsAdmin, fetchAllNewslettersAdmin, fetchAllPapersAdmin } from "@/lib/content";
import {
  fetchAdminStats,
  fetchAllMembers,
  generateEventPrep,
  generatePaperDraft,
} from "@/lib/admin";
import {
  approveLeadRequest,
  createJob,
  fetchAllJobsAdmin,
  fetchPendingLeadRequests,
  rejectLeadRequest,
} from "@/lib/projects";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AdminStats,
  Job,
  LeadVerificationRequest,
  MlEvent,
  NewsletterIssue,
  Paper,
  Profile,
} from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <RequireAuth>
      <RequireAdmin>
        <AdminContent />
      </RequireAdmin>
    </RequireAuth>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<
    "overview" | "announcements" | "events" | "papers" | "newsletter" | "jobs" | "members" | "leads"
  >("overview");
  const [events, setEvents] = useState<MlEvent[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterIssue[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leadRequests, setLeadRequests] = useState<LeadVerificationRequest[]>([]);

  const reload = () => {
    void fetchAllEventsAdmin().then(setEvents);
    void fetchAllPapersAdmin().then(setPapers);
    void fetchAllNewslettersAdmin().then(setNewsletters);
    void fetchAllJobsAdmin().then(setJobs);
    void fetchAllMembers().then(setMembers);
    void fetchAllAnnouncementsAdmin().then(setAnnouncements);
    void fetchAdminStats().then(setStats);
    void fetchPendingLeadRequests().then(setLeadRequests);
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <MemberLayout title="Admin" eyebrow="content management">
      {!isSupabaseConfigured ? (
        <div className="rounded-sm border border-accent-red/30 bg-accent-red/5 p-5 mb-8 text-sm text-accent-red -mt-4">
          Connect Supabase to publish new content. Seed data is shown read-only until{" "}
          <code className="font-mono text-xs">supabase/phase2.sql</code> is applied and env vars are
          set.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-8 border-b border-border/60 pb-4">
        {(
          [
            "overview",
            "announcements",
            "events",
            "papers",
            "newsletter",
            "jobs",
            "members",
            "leads",
          ] as const
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`font-mono text-[10px] tracking-[0.22em] uppercase px-4 py-2 rounded-sm transition ${
              tab === t
                ? "bg-accent-blue/10 text-bone border border-accent-blue/30"
                : "text-muted-foreground hover:text-bone"
            }`}
          >
            {t}
            {t === "leads" && leadRequests.length > 0 ? ` (${leadRequests.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <AdminOverview stats={stats} pendingLeads={leadRequests.length} />
      ) : tab === "announcements" ? (
        <AdminAnnouncements items={announcements} onSaved={reload} />
      ) : tab === "events" ? (
        <AdminEvents events={events} onSaved={reload} />
      ) : tab === "papers" ? (
        <AdminPapers papers={papers} onSaved={reload} />
      ) : tab === "newsletter" ? (
        <AdminNewsletters issues={newsletters} onSaved={reload} />
      ) : tab === "jobs" ? (
        <AdminJobs jobs={jobs} onSaved={reload} />
      ) : tab === "members" ? (
        <AdminMembers members={members} />
      ) : (
        <AdminLeads requests={leadRequests} adminId={user?.id ?? ""} onSaved={reload} />
      )}

      <Link
        to="/dashboard"
        className="mt-10 inline-block text-sm text-muted-foreground hover:text-bone"
      >
        ← Back to hub
      </Link>
    </MemberLayout>
  );
}

function AdminEvents({ events, onSaved }: { events: MlEvent[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topics, setTopics] = useState("");
  const [prepNotes, setPrepNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const onDraft = () => {
    setPrepNotes(generateEventPrep(title, topics, prepNotes));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Supabase required to publish.");
      return;
    }
    setSaving(true);
    const slug = slugify(title);
    const { error } = await supabase.from("events").insert({
      slug,
      title,
      summary,
      topics: [],
      resources: [],
      deadlines: [],
      published: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event created.");
    setTitle("");
    setSummary("");
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New event</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Topics (comma-separated)</Label>
          <Input value={topics} onChange={(e) => setTopics(e.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Prep notes (markdown)</Label>
            <button
              type="button"
              onClick={onDraft}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
            >
              Generate draft
            </button>
          </div>
          <Textarea value={prepNotes} onChange={(e) => setPrepNotes(e.target.value)} rows={6} />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish event"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Edit deadlines and resources in Supabase table editor for now.
        </p>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({events.length})
        </h2>
        <ul className="space-y-2 text-sm">
          {events.map((ev) => (
            <li key={ev.id} className="text-bone">
              {ev.title}{" "}
              <Link to={`/events/${ev.slug}`} className="text-accent-blue text-xs">
                view
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdminPapers({ papers, onSaved }: { papers: Paper[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [review, setReview] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const onDraft = () => {
    setReview(generatePaperDraft(title, authors, draftNotes));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Supabase required to publish.");
      return;
    }
    setSaving(true);
    const slug = slugify(title);
    const { error } = await supabase.from("papers").insert({
      slug,
      title,
      authors,
      review_body: review,
      tags: [],
      published: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paper review published.");
    setTitle("");
    setAuthors("");
    setReview("");
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New paper review</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Authors</Label>
          <Input value={authors} onChange={(e) => setAuthors(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Your notes (for draft assist)</Label>
          <Textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Review (markdown)</Label>
            <button
              type="button"
              onClick={onDraft}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
            >
              Generate draft
            </button>
          </div>
          <Textarea value={review} onChange={(e) => setReview(e.target.value)} rows={8} required />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish review"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({papers.length})
        </h2>
        <ul className="space-y-2 text-sm">
          {papers.map((p) => (
            <li key={p.id} className="text-bone">
              {p.title}{" "}
              <Link to={`/papers/${p.slug}`} className="text-accent-blue text-xs">
                view
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdminNewsletters({ issues, onSaved }: { issues: NewsletterIssue[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Supabase required to publish.");
      return;
    }
    setSaving(true);
    const slug = slugify(title);
    const { error } = await supabase.from("newsletter_issues").insert({
      slug,
      title,
      body,
      issue_number: issueNumber ? Number(issueNumber) : null,
      published: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Newsletter issue published.");
    setTitle("");
    setBody("");
    setIssueNumber("");
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New newsletter issue</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Issue number</Label>
          <Input
            type="number"
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Body (markdown)</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} required />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish issue"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({issues.length})
        </h2>
        <ul className="space-y-2 text-sm">
          {issues.map((n) => (
            <li key={n.id} className="text-bone">
              {n.title}{" "}
              <Link to={`/newsletter/${n.slug}`} className="text-accent-blue text-xs">
                view
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdminAnnouncements({ items, onSaved }: { items: Announcement[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await createAnnouncement({
      title,
      body,
      href: href || undefined,
      pinned,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Announcement published.");
    setTitle("");
    setBody("");
    setHref("");
    setPinned(false);
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New announcement</h2>
        <p className="text-xs text-muted-foreground">
          Pinned announcements appear as &ldquo;This week in ML&rdquo; on the dashboard.
        </p>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
        </div>
        <div className="space-y-2">
          <Label>Link (optional)</Label>
          <Input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/guides/how-llms-work"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to dashboard
        </label>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({items.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {items.map((a) => (
            <li key={a.id} className="text-bone border-b border-border/40 pb-3">
              {a.pinned ? (
                <span className="font-mono text-[9px] uppercase text-accent-green mr-2">
                  pinned
                </span>
              ) : null}
              {a.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdminOverview({
  stats,
  pendingLeads,
}: {
  stats: AdminStats | null;
  pendingLeads: number;
}) {
  const cards = stats
    ? [
        { label: "Members", value: stats.members },
        { label: "Projects", value: stats.projects },
        { label: "Applications", value: stats.applications },
        { label: "Pending leads", value: pendingLeads || stats.pendingLeads },
        { label: "Events", value: stats.events },
        { label: "Papers", value: stats.papers },
        { label: "Jobs", value: stats.jobs },
      ]
    : [];

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Platform snapshot. Connect Supabase and run phase4.sql for live member counts,
        notifications, and saved items.
      </p>
      <div className="grid gap-px bg-border/40 border border-border/40 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-background/75 p-5">
            <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
              {c.label}
            </p>
            <p className="font-display text-3xl text-bone mt-2">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminMembers({ members }: { members: Profile[] }) {
  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Member list requires Supabase with admin profile read policy (phase4.sql).
      </p>
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members loaded.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">Role</th>
            <th className="p-3">Interests</th>
            <th className="p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-border/40 last:border-0">
              <td className="p-3 text-bone">{m.full_name || "—"}</td>
              <td className="p-3 font-mono text-[10px] uppercase">{m.role}</td>
              <td className="p-3 text-muted-foreground">
                {m.interests?.slice(0, 3).join(", ") || "—"}
              </td>
              <td className="p-3 text-muted-foreground">
                {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminJobs({ jobs, onSaved }: { jobs: Job[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("The Bu1ld");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<Job["source"]>("internal");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await createJob({ title, company, description, source });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Job published.");
    setTitle("");
    setDescription("");
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New job listing</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Company</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as Job["source"])}
            className="w-full rounded-sm border border-border/60 bg-background px-3 py-2 text-sm"
          >
            <option value="internal">Internal (BUILD)</option>
            <option value="external">External (curated)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish job"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({jobs.length})
        </h2>
        <ul className="space-y-2 text-sm">
          {jobs.map((j) => (
            <li key={j.id} className="text-bone">
              {j.title}{" "}
              <span className="font-mono text-[9px] uppercase text-muted-foreground">
                ({j.source})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdminLeads({
  requests,
  adminId,
  onSaved,
}: {
  requests: LeadVerificationRequest[];
  adminId: string;
  onSaved: () => void;
}) {
  const onApprove = async (req: LeadVerificationRequest) => {
    const { error } = await approveLeadRequest(req.id, req.user_id, adminId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Lead approved.");
    onSaved();
  };

  const onReject = async (req: LeadVerificationRequest) => {
    const { error } = await rejectLeadRequest(req.id, adminId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Request rejected.");
    onSaved();
  };

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Lead verification requires Supabase. Requests submitted in local-only mode are not listed
        here.
      </p>
    );
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending lead requests.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="rounded-sm border border-border/60 bg-background/70 p-6">
          <h3 className="font-display text-lg text-bone">{req.applicant_name ?? "Member"}</h3>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{req.message}</p>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => void onApprove(req)}
              className="font-mono text-[9px] tracking-[0.15em] uppercase"
            >
              Approve as project lead
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void onReject(req)}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-red"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
