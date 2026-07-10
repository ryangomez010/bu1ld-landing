import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AdminAuditTab } from "@/components/admin/AdminAuditTab";
import { AdminSecurityTab } from "@/components/admin/AdminSecurityTab";
import { AdminAnnouncementsTab } from "@/components/admin/AdminAnnouncementsTab";
import { AdminEventsTab } from "@/components/admin/AdminEventsTab";
import { AdminGuidesTab } from "@/components/admin/AdminGuidesTab";
import { AdminJobsTab } from "@/components/admin/AdminJobsTab";
import { AdminLeadsTab } from "@/components/admin/AdminLeadsTab";
import { AdminMembersTab } from "@/components/admin/AdminMembersTab";
import { AdminNewslettersTab } from "@/components/admin/AdminNewslettersTab";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminPapersTab } from "@/components/admin/AdminPapersTab";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import type { Announcement } from "@/data/seed/announcements";
import { fetchAllAnnouncementsAdmin } from "@/lib/announcements";
import { fetchAdminStats, fetchAllMembers } from "@/lib/admin";
import { fetchAdminAuditLog } from "@/lib/audit-log";
import { fetchAdminSecurityEvents } from "@/lib/account-security";
import type { AuditEntry } from "@/lib/audit-log";
import type { SecurityEvent } from "@/lib/account-security";
import { fetchAllEventsAdmin, fetchAllNewslettersAdmin, fetchAllPapersAdmin } from "@/lib/content";
import { fetchAllJobsAdmin, fetchPendingLeadRequests } from "@/lib/projects";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
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
    | "overview"
    | "announcements"
    | "events"
    | "papers"
    | "newsletter"
    | "jobs"
    | "guides"
    | "members"
    | "leads"
    | "audit"
    | "security"
  >("overview");
  const [events, setEvents] = useState<MlEvent[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterIssue[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leadRequests, setLeadRequests] = useState<LeadVerificationRequest[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  const reload = () => {
    void fetchAllEventsAdmin().then(setEvents);
    void fetchAllPapersAdmin().then(setPapers);
    void fetchAllNewslettersAdmin().then(setNewsletters);
    void fetchAllJobsAdmin().then(setJobs);
    void fetchAllMembers().then(setMembers);
    void fetchAllAnnouncementsAdmin().then(setAnnouncements);
    void fetchAdminStats().then(setStats);
    void fetchPendingLeadRequests().then(setLeadRequests);
    void fetchAdminAuditLog().then(setAuditLog);
    void fetchAdminSecurityEvents().then(setSecurityEvents);
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

      <div className="flex flex-wrap gap-1.5 mb-8 -mt-2 overflow-x-auto pb-1 border-b border-border/50">
        {(
          [
            "overview",
            "announcements",
            "events",
            "papers",
            "newsletter",
            "jobs",
            "guides",
            "members",
            "leads",
            "audit",
            "security",
          ] as const
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`admin-tab ${tab === t ? "admin-tab-active" : "text-muted-foreground"}`}
          >
            {t}
            {t === "leads" && leadRequests.length > 0 ? ` (${leadRequests.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <AdminOverviewTab stats={stats} pendingLeads={leadRequests.length} />
      ) : tab === "announcements" ? (
        <AdminAnnouncementsTab items={announcements} onSaved={reload} />
      ) : tab === "events" ? (
        <AdminEventsTab events={events} onSaved={reload} />
      ) : tab === "papers" ? (
        <AdminPapersTab papers={papers} onSaved={reload} />
      ) : tab === "newsletter" ? (
        <AdminNewslettersTab issues={newsletters} onSaved={reload} />
      ) : tab === "jobs" ? (
        <AdminJobsTab jobs={jobs} onSaved={reload} />
      ) : tab === "guides" ? (
        <AdminGuidesTab />
      ) : tab === "members" ? (
        <AdminMembersTab members={members} actorId={user?.id ?? ""} onSaved={reload} />
      ) : tab === "audit" ? (
        <AdminAuditTab entries={auditLog} />
      ) : tab === "security" ? (
        <AdminSecurityTab events={securityEvents} />
      ) : (
        <AdminLeadsTab requests={leadRequests} adminId={user?.id ?? ""} onSaved={reload} />
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
