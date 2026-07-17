import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Announcement } from "@/data/seed/announcements";
import type {
  Job,
  LeadVerificationRequest,
  MlEvent,
  NewsletterIssue,
  Notification,
  Paper,
  PaperAnalysis,
  Profile,
  Project,
  ProjectApplication,
  ProjectUpdate,
  ReadingProgress,
  SavedItem,
} from "@/lib/types";

type DbRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type DbTable<Row, Insert, Update, Rels extends readonly DbRelationship[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Rels;
};

export type Database = {
  public: {
    Tables: {
      profiles: DbTable<Profile, Partial<Profile> & { id: string }, Partial<Profile>>;
      events: DbTable<
        MlEvent,
        Partial<MlEvent> & { slug: string; title: string },
        Partial<MlEvent>
      >;
      papers: DbTable<
        Paper,
        Partial<Paper> & { slug: string; title: string; review_body: string },
        Partial<Paper>
      >;
      paper_analyses: DbTable<
        PaperAnalysis,
        {
          user_id: string;
          title: string;
          source_url?: string | null;
          input_kind?: "text";
          input_excerpt: string;
          input_sha256: string;
          status?: "completed" | "failed";
          provider?: "local_structured_v1";
          prompt_version?: "paper-analysis-v1";
          structured_result: PaperAnalysis["structured_result"];
        },
        Partial<
          Pick<
            PaperAnalysis,
            "title" | "source_url" | "input_excerpt" | "status" | "structured_result" | "updated_at"
          >
        >
      >;
      newsletter_issues: DbTable<
        NewsletterIssue,
        Partial<NewsletterIssue> & { slug: string; title: string; body: string },
        Partial<NewsletterIssue>
      >;
      reading_progress: DbTable<
        ReadingProgress & { user_id: string },
        {
          user_id: string;
          guide_slug: string;
          progress_percent: number;
          updated_at?: string;
        },
        Partial<ReadingProgress>
      >;
      projects: DbTable<
        Project,
        Partial<Project> & {
          slug: string;
          title: string;
          description: string;
          type: string;
        },
        Partial<Project>
      >;
      project_applications: DbTable<
        ProjectApplication,
        { project_id: string; user_id: string; pitch: string; status?: string },
        Partial<ProjectApplication>
      >;
      project_updates: DbTable<
        ProjectUpdate,
        {
          project_id: string;
          author_id: string;
          body: string;
        },
        Partial<ProjectUpdate>
      >;
      lead_verification_requests: DbTable<
        LeadVerificationRequest,
        { user_id: string; message: string },
        Partial<LeadVerificationRequest>
      >;
      jobs: DbTable<
        Job,
        Partial<Job> & {
          slug: string;
          title: string;
          company: string;
          description: string;
        },
        Partial<Job>
      >;
      notifications: DbTable<
        Notification,
        {
          user_id: string;
          title: string;
          body: string;
          href?: string | null;
          read?: boolean;
        },
        Partial<Notification>
      >;
      saved_items: DbTable<
        SavedItem,
        {
          user_id: string;
          item_type: SavedItem["item_type"];
          item_slug: string;
          item_title: string;
        },
        Partial<SavedItem>
      >;
      announcements: DbTable<
        Announcement,
        {
          title: string;
          body: string;
          href?: string | null;
          pinned?: boolean;
          published?: boolean;
        },
        Partial<Announcement>
      >;
      member_preferences: DbTable<
        {
          user_id: string;
          content_density: string;
          email_digest_frequency: string;
          last_digest_sent_at: string | null;
          updated_at: string;
        },
        {
          user_id: string;
          content_density?: string;
          email_digest_frequency?: string;
          last_digest_sent_at?: string | null;
          updated_at?: string;
        },
        {
          content_density?: string;
          email_digest_frequency?: string;
          last_digest_sent_at?: string | null;
          updated_at?: string;
        }
      >;
      notification_preferences: DbTable<
        {
          user_id: string;
          pref_key: string;
          email_enabled: boolean;
          in_app_enabled: boolean;
          updated_at: string;
        },
        {
          user_id: string;
          pref_key: string;
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          updated_at?: string;
        },
        {
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          updated_at?: string;
        }
      >;
      paper_highlights: DbTable<
        {
          id: string;
          user_id: string;
          paper_slug: string;
          highlighted_text: string;
          created_at: string;
        },
        {
          user_id: string;
          paper_slug: string;
          highlighted_text: string;
        },
        { highlighted_text?: string }
      >;
      project_follows: DbTable<
        {
          id: string;
          user_id: string;
          project_id: string;
          notify_updates: boolean;
          created_at: string;
        },
        {
          user_id: string;
          project_id: string;
          notify_updates?: boolean;
        },
        { notify_updates?: boolean }
      >;
      job_applications: DbTable<
        {
          id: string;
          user_id: string;
          job_slug: string;
          job_title: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          user_id: string;
          job_slug: string;
          job_title: string;
          status?: string;
          notes?: string | null;
          updated_at?: string;
        },
        {
          status?: string;
          notes?: string | null;
          updated_at?: string;
        }
      >;
      newsletter_subscriptions: DbTable<
        {
          user_id: string;
          subscribed: boolean;
          updated_at: string;
        },
        {
          user_id: string;
          subscribed?: boolean;
          updated_at?: string;
        },
        {
          subscribed?: boolean;
          updated_at?: string;
        }
      >;
      saved_collections: DbTable<
        {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          user_id: string;
          name: string;
          description?: string | null;
          updated_at?: string;
        },
        {
          name?: string;
          description?: string | null;
          updated_at?: string;
        },
        [
          {
            foreignKeyName: "saved_collection_items_collection_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "saved_collection_items";
            referencedColumns: ["collection_id"];
          },
        ]
      >;
      saved_collection_items: DbTable<
        {
          id: string;
          collection_id: string;
          item_type: string;
          item_slug: string;
          item_title: string;
          created_at: string;
        },
        {
          collection_id: string;
          item_type: string;
          item_slug: string;
          item_title: string;
        },
        Partial<{
          item_type: string;
          item_slug: string;
          item_title: string;
        }>,
        [
          {
            foreignKeyName: "saved_collection_items_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "saved_collections";
            referencedColumns: ["id"];
          },
        ]
      >;
      security_events: DbTable<
        {
          id: string;
          user_id: string | null;
          event_type: string;
          detail: Record<string, unknown> | null;
          created_at: string;
        },
        {
          user_id?: string | null;
          event_type: string;
          detail?: Record<string, unknown> | null;
        },
        Partial<{
          event_type: string;
          detail: Record<string, unknown> | null;
        }>
      >;
      reading_activity: DbTable<
        {
          user_id: string;
          activity_date: string;
          papers_read: number;
        },
        {
          user_id: string;
          activity_date: string;
          papers_read?: number;
        },
        {
          papers_read?: number;
        }
      >;
      paper_reads: DbTable<
        {
          user_id: string;
          paper_slug: string;
          read_at: string;
          scroll_percent: number | null;
          notes: string | null;
        },
        {
          user_id: string;
          paper_slug: string;
          read_at?: string;
          scroll_percent?: number | null;
          notes?: string | null;
        },
        {
          read_at?: string;
          scroll_percent?: number | null;
          notes?: string | null;
        }
      >;
      skill_endorsements: DbTable<
        {
          id: string;
          endorser_id: string;
          profile_id: string;
          skill: string;
          created_at: string;
        },
        {
          endorser_id: string;
          profile_id: string;
          skill: string;
        },
        Partial<{ skill: string }>
      >;
      member_feedback: DbTable<
        {
          id: string;
          user_id: string;
          category: string;
          body: string;
          created_at: string;
        },
        {
          user_id: string;
          category?: string;
          body: string;
        },
        Partial<{ category: string; body: string }>
      >;
      content_reports: DbTable<
        {
          id: string;
          reporter_id: string;
          content_type: string;
          content_slug: string;
          reason: string;
          status: string;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        },
        {
          reporter_id: string;
          content_type: string;
          content_slug: string;
          reason: string;
          status?: string;
          admin_notes?: string | null;
        },
        Partial<{
          status: string;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        }>
      >;
      admin_audit_log: DbTable<
        {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          detail: Record<string, unknown> | null;
          created_at: string;
        },
        {
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          detail?: Record<string, unknown> | null;
        },
        Partial<{
          action: string;
          target_type: string | null;
          target_id: string | null;
          detail: Record<string, unknown> | null;
        }>
      >;
      event_rsvps: DbTable<
        {
          user_id: string;
          event_id: string;
          created_at: string;
        },
        {
          user_id: string;
          event_id: string;
          created_at?: string;
        },
        Record<string, never>
      >;
      project_memberships: DbTable<
        import("@/lib/types").ProjectMembership,
        { project_id: string; user_id: string; member_role?: string; status?: string },
        Partial<import("@/lib/types").ProjectMembership>
      >;
      project_milestones: DbTable<
        import("@/lib/types").ProjectMilestone,
        {
          project_id: string;
          title: string;
          description?: string;
          status?: string;
          visibility?: string;
          due_date?: string | null;
          created_by: string;
        },
        Partial<import("@/lib/types").ProjectMilestone>
      >;
      project_contributions: DbTable<
        import("@/lib/types").ProjectContribution,
        {
          project_id: string;
          contributor_id: string;
          contribution_type: string;
          title: string;
          summary: string;
          milestone_id?: string | null;
          evidence_url?: string | null;
          visibility?: string;
        },
        Partial<import("@/lib/types").ProjectContribution>
      >;
      programs: DbTable<
        import("@/lib/types").Program,
        {
          slug: string;
          title: string;
          program_type: string;
          summary: string;
          application_instructions?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          applications_open_at?: string | null;
          applications_close_at?: string | null;
          outcomes?: string | null;
          capacity?: number | null;
          published?: boolean;
        },
        Partial<import("@/lib/types").Program>
      >;
      program_applications: DbTable<
        {
          id: string;
          program_id: string;
          user_id: string;
          statement: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        { program_id: string; user_id: string; statement: string; status?: string },
        Partial<{ statement: string; status: string; updated_at: string }>
      >;
      member_roles: DbTable<
        {
          user_id: string;
          role: import("@/lib/types").InstitutionalRole;
          granted_by: string | null;
          granted_at: string;
        },
        { user_id: string; role: string; granted_by?: string | null },
        Partial<{ role: string; granted_by: string | null }>
      >;
      institutional_claims: DbTable<
        import("@/lib/types").InstitutionalClaim,
        {
          claim_type: string;
          statement: string;
          evidence_url: string;
          evidence_label: string;
          context?: string | null;
          valid_until?: string | null;
          created_by?: string | null;
          status?: string;
        },
        Partial<import("@/lib/types").InstitutionalClaim>
      >;
      labs: DbTable<
        import("@/lib/types").Lab,
        {
          slug: string;
          name: string;
          short_name: string;
          summary: string;
          tagline?: string;
          focus?: string[];
          methods?: string[];
          open_roles?: string[];
          color?: string;
          published?: boolean;
          lead_id?: string | null;
        },
        Partial<import("@/lib/types").Lab>
      >;
      lab_memberships: DbTable<
        {
          lab_id: string;
          user_id: string;
          member_role: string;
          status: string;
          joined_at: string;
        },
        { lab_id: string; user_id: string; member_role?: string; status?: string },
        Partial<{ member_role: string; status: string }>
      >;
      competitions: DbTable<
        import("@/lib/types").Competition,
        {
          slug: string;
          title: string;
          summary: string;
          status?: string;
          prize?: string;
          deadline?: string | null;
          lab_id?: string | null;
          evaluation_protocol?: string;
          published?: boolean;
        },
        Partial<import("@/lib/types").Competition>
      >;
      competition_submissions: DbTable<
        {
          id: string;
          competition_id: string;
          submitter_id: string;
          title: string;
          summary: string;
          evidence_url: string | null;
          status: string;
          score: number | null;
          review_note: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          competition_id: string;
          submitter_id: string;
          title: string;
          summary: string;
          evidence_url?: string | null;
          status?: string;
        },
        Partial<{
          title: string;
          summary: string;
          status: string;
          score: number | null;
          review_note: string | null;
        }>
      >;
      partnerships: DbTable<
        import("@/lib/types").Partnership,
        {
          name: string;
          kind: string;
          summary: string;
          status?: string;
          published?: boolean;
          evidence_url?: string | null;
        },
        Partial<import("@/lib/types").Partnership>
      >;
      invitations: DbTable<
        import("@/lib/types").Invitation,
        {
          invitation_type: string;
          target_id: string;
          invited_by: string;
          email?: string | null;
          invitee_id?: string | null;
          role_offered?: string;
          message?: string | null;
          status?: string;
        },
        Partial<import("@/lib/types").Invitation>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      search_portal_content: {
        Args: { search_query: string };
        Returns: Array<{
          content_type: string;
          slug: string;
          title: string;
          summary: string;
          rank: number;
        }>;
      };
      get_project_update_subscribers: {
        Args: { p_project_id: string };
        Returns: string[];
      };
      request_account_deletion: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      increment_reading_activity: {
        Args: { p_user_id: string; p_date: string };
        Returns: undefined;
      };
      notify_users: {
        Args: {
          target_user_ids: string[];
          p_title: string;
          p_body: string;
          p_href?: string | null;
          p_project_id?: string | null;
        };
        Returns: number;
      };
      review_project_application: {
        Args: { p_application_id: string; p_status: string; p_note?: string | null };
        Returns: ProjectApplication;
      };
      accept_invitation: {
        Args: { p_invitation_id: string };
        Returns: import("@/lib/types").Invitation;
      };
      submit_project_for_review: {
        Args: { p_project_id: string };
        Returns: Project;
      };
      review_project_publication: {
        Args: { p_project_id: string; p_decision: string; p_note?: string | null };
        Returns: Project;
      };
      review_program_application: {
        Args: { p_application_id: string; p_status: string; p_note?: string | null };
        Returns: import("@/lib/types").ProgramApplication;
      };
      review_project_contribution: {
        Args: { p_contribution_id: string; p_status: string; p_note?: string | null };
        Returns: import("@/lib/types").ProjectContribution;
      };
      resubmit_project_contribution: {
        Args: { p_contribution_id: string };
        Returns: import("@/lib/types").ProjectContribution;
      };
      set_project_membership_status: {
        Args: { p_project_id: string; p_user_id: string; p_status: string };
        Returns: import("@/lib/types").ProjectMembership;
      };
      review_institutional_claim: {
        Args: { p_claim_id: string; p_status: string };
        Returns: import("@/lib/types").InstitutionalClaim;
      };
    };
  };
};

import { readPublicRuntimeEnv } from "@/lib/public-env";

function readEnv(key: string): string | undefined {
  const runtime = readPublicRuntimeEnv(key as Parameters<typeof readPublicRuntimeEnv>[0]);
  if (runtime) return runtime;
  const value = import.meta.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function resolveSupabaseConfig(): { url?: string; anonKey?: string } {
  const url = readEnv("VITE_SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey =
    readEnv("VITE_SUPABASE_ANON_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return { url, anonKey };
}

const initialConfig = resolveSupabaseConfig();
const supabaseUrl = initialConfig.url;
const supabaseAnonKey = initialConfig.anonKey;

/** Runtime check — reads build-time and /runtime-env.js injection. */
export function checkSupabaseConfigured(): boolean {
  const { url, anonKey } = resolveSupabaseConfig();
  return Boolean(url && anonKey);
}

export const supabaseProjectUrl = supabaseUrl;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: SupabaseClient<Database> | null = null;
let browserClientKey: string | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  const { url, anonKey } = resolveSupabaseConfig();
  if (!url || !anonKey) return null;
  if (typeof window === "undefined") return null;
  if (!browserClient || browserClientKey !== `${url}|${anonKey}`) {
    browserClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
    browserClientKey = `${url}|${anonKey}`;
  }
  return browserClient;
}
