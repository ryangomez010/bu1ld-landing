import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Announcement } from "@/data/seed/announcements";
import type {
  Job,
  LeadVerificationRequest,
  MlEvent,
  NewsletterIssue,
  Notification,
  Paper,
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
    };
  };
};

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const supabaseUrl = readEnv("VITE_SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");

/** Prefer JWT anon key; fall back to publishable key for newer Supabase projects. */
const supabaseAnonKey =
  readEnv("VITE_SUPABASE_ANON_KEY") ??
  readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

/** Runtime check — reads current env (used by demo-mode helpers and tests). */
export function checkSupabaseConfigured(): boolean {
  const url = readEnv("VITE_SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    readEnv("VITE_SUPABASE_ANON_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return Boolean(url && key);
}

export const supabaseProjectUrl = supabaseUrl;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return browserClient;
}
