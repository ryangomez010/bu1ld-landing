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
  ReadingProgress,
  SavedItem,
} from "@/lib/types";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      events: {
        Row: MlEvent;
        Insert: Partial<MlEvent> & { slug: string; title: string };
        Update: Partial<MlEvent>;
      };
      papers: {
        Row: Paper;
        Insert: Partial<Paper> & { slug: string; title: string; review_body: string };
        Update: Partial<Paper>;
      };
      newsletter_issues: {
        Row: NewsletterIssue;
        Insert: Partial<NewsletterIssue> & { slug: string; title: string; body: string };
        Update: Partial<NewsletterIssue>;
      };
      reading_progress: {
        Row: ReadingProgress & { user_id: string };
        Insert: {
          user_id: string;
          guide_slug: string;
          progress_percent: number;
          updated_at?: string;
        };
        Update: Partial<ReadingProgress>;
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & {
          slug: string;
          title: string;
          description: string;
          type: string;
        };
        Update: Partial<Project>;
      };
      project_applications: {
        Row: ProjectApplication;
        Insert: { project_id: string; user_id: string; pitch: string; status?: string };
        Update: Partial<ProjectApplication>;
      };
      lead_verification_requests: {
        Row: LeadVerificationRequest;
        Insert: { user_id: string; message: string };
        Update: Partial<LeadVerificationRequest>;
      };
      jobs: {
        Row: Job;
        Insert: Partial<Job> & {
          slug: string;
          title: string;
          company: string;
          description: string;
        };
        Update: Partial<Job>;
      };
      notifications: {
        Row: Notification;
        Insert: {
          user_id: string;
          title: string;
          body: string;
          href?: string | null;
          read?: boolean;
        };
        Update: Partial<Notification>;
      };
      saved_items: {
        Row: SavedItem;
        Insert: {
          user_id: string;
          item_type: SavedItem["item_type"];
          item_slug: string;
          item_title: string;
        };
        Update: Partial<SavedItem>;
      };
      announcements: {
        Row: Announcement;
        Insert: {
          title: string;
          body: string;
          href?: string | null;
          pinned?: boolean;
          published?: boolean;
        };
        Update: Partial<Announcement>;
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
