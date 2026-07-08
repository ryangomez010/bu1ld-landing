import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  Job,
  LeadVerificationRequest,
  MlEvent,
  NewsletterIssue,
  Paper,
  Profile,
  Project,
  ProjectApplication,
  ReadingProgress,
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
    };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
  }
  return browserClient;
}
