import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { AdminAuditTab } from "@/components/admin/AdminAuditTab";
import { AdminBulkPublishTab } from "@/components/admin/AdminBulkPublishTab";
import { AdminModerationTab } from "@/components/admin/AdminModerationTab";
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
import { AdminProjectsTab } from "@/components/admin/AdminProjectsTab";
import { AdminClaimsTab } from "@/components/admin/AdminClaimsTab";
import { AdminProgramsTab } from "@/components/admin/AdminProgramsTab";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import type { Announcement } from "@/data/seed/announcements";
import { fetchAllAnnouncementsAdmin } from "@/lib/announcements";
import { fetchAdminStats, fetchAllMembers, fetchInstitutionalRolesByMember } from "@/lib/admin";
import { fetchAdminAuditLog } from "@/lib/audit-log";
import { fetchAdminSecurityEvents } from "@/lib/account-security";
import type { AuditEntry } from "@/lib/audit-log";
import type { SecurityEvent } from "@/lib/account-security";
import { fetchAllEventsAdmin, fetchAllNewslettersAdmin, fetchAllPapersAdmin } from "@/lib/content";
import { fetchAllJobsAdmin, fetchAllProjectsAdmin, fetchPendingLeadRequests } from "@/lib/projects";
import { fetchAllProgramsAdmin, fetchProgramApplicationsAdmin } from "@/lib/programs";
import { fetchAllInstitutionalClaimsAdmin } from "@/lib/institutional-claims";
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
  Program,
  ProgramApplication,
  Project,
  InstitutionalClaim,
} from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin — The Bu1ld" }],
  }),
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

type AdminTab =
  | "overview"
  | "announcements"
  | "events"
  | "papers"
  | "programs"
  | "projects"
  | "claims"
  | "newsletter"
  | "jobs"
  | "guides"
  | "members"
  | "leads"
  | "bulk"
  | "moderation"
  | "audit"
  | "security";

function AdminContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [loadedTabs, setLoadedTabs] = useState<Set<AdminTab>>(new Set(["overview"]));
  const [events, setEvents] = useState<MlEvent[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programApplications, setProgramApplications] = useState<ProgramApplication[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [claims, setClaims] = useState<InstitutionalClaim[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterIssue[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [institutionalRoles, setInstitutionalRoles] = useState(
    new Map<string, import("@/lib/types").InstitutionalRole[]>(),
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leadRequests, setLeadRequests] = useState<LeadVerificationRequest[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  const markLoaded = useCallback((t: AdminTab) => {
    setLoadedTabs((prev) => new Set([...prev, t]));
  }, []);

  const reloadTab = useCallback(
    (t: AdminTab) => {
      switch (t) {
        case "overview":
          void fetchAdminStats().then(setStats);
          void fetchPendingLeadRequests().then(setLeadRequests);
          break;
        case "announcements":
          void fetchAllAnnouncementsAdmin().then(setAnnouncements);
          break;
        case "events":
          void fetchAllEventsAdmin().then(setEvents);
          break;
        case "papers":
          void fetchAllPapersAdmin().then(setPapers);
          break;
        case "programs":
          void fetchAllProgramsAdmin().then(setPrograms);
          void fetchProgramApplicationsAdmin().then(setProgramApplications);
          break;
        case "projects":
          void fetchAllProjectsAdmin().then(setProjects);
          break;
        case "claims":
          void fetchAllInstitutionalClaimsAdmin().then(setClaims);
          break;
        case "newsletter":
          void fetchAllNewslettersAdmin().then(setNewsletters);
          break;
        case "jobs":
          void fetchAllJobsAdmin().then(setJobs);
          break;
        case "members":
          void fetchAllMembers().then(setMembers);
          void fetchInstitutionalRolesByMember().then(setInstitutionalRoles);
          break;
        case "leads":
          void fetchPendingLeadRequests().then(setLeadRequests);
          break;
        case "bulk":
          void fetchAllEventsAdmin().then(setEvents);
          void fetchAllPapersAdmin().then(setPapers);
          void fetchAllNewslettersAdmin().then(setNewsletters);
          void fetchAllJobsAdmin().then(setJobs);
          break;
        case "audit":
          void fetchAdminAuditLog().then(setAuditLog);
          break;
        case "security":
          void fetchAdminSecurityEvents().then(setSecurityEvents);
          break;
        default:
          break;
      }
      markLoaded(t);
    },
    [markLoaded],
  );

  useEffect(() => {
    reloadTab("overview");
  }, [reloadTab]);

  useEffect(() => {
    if (loadedTabs.has(tab)) return;
    reloadTab(tab);
  }, [tab, loadedTabs, reloadTab]);

  const onSaved = () => reloadTab(tab);

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
            "programs",
            "projects",
            "claims",
            "newsletter",
            "jobs",
            "guides",
            "members",
            "leads",
            "bulk",
            "moderation",
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
        <AdminAnnouncementsTab items={announcements} onSaved={onSaved} />
      ) : tab === "events" ? (
        <AdminEventsTab events={events} onSaved={onSaved} />
      ) : tab === "papers" ? (
        <AdminPapersTab papers={papers} onSaved={onSaved} />
      ) : tab === "programs" ? (
        <AdminProgramsTab
          programs={programs}
          applications={programApplications}
          onSaved={onSaved}
        />
      ) : tab === "projects" ? (
        <AdminProjectsTab projects={projects} onSaved={onSaved} />
      ) : tab === "claims" ? (
        <AdminClaimsTab claims={claims} actorId={user?.id ?? ""} onSaved={onSaved} />
      ) : tab === "newsletter" ? (
        <AdminNewslettersTab issues={newsletters} onSaved={onSaved} />
      ) : tab === "jobs" ? (
        <AdminJobsTab jobs={jobs} onSaved={onSaved} />
      ) : tab === "guides" ? (
        <AdminGuidesTab />
      ) : tab === "members" ? (
        <AdminMembersTab
          members={members}
          actorId={user?.id ?? ""}
          institutionalRoles={institutionalRoles}
          onSaved={onSaved}
        />
      ) : tab === "audit" ? (
        <AdminAuditTab entries={auditLog} />
      ) : tab === "security" ? (
        <AdminSecurityTab events={securityEvents} />
      ) : tab === "bulk" ? (
        <AdminBulkPublishTab
          events={events}
          papers={papers}
          newsletters={newsletters}
          jobs={jobs}
          onSaved={onSaved}
        />
      ) : tab === "moderation" ? (
        <AdminModerationTab />
      ) : (
        <AdminLeadsTab requests={leadRequests} adminId={user?.id ?? ""} onSaved={onSaved} />
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
