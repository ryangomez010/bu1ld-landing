export type MemberRole = "member" | "project_lead" | "admin";

export type MemberBackground = "researcher" | "engineer" | "founder" | "student" | "other";

export type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  background: MemberBackground | null;
  interests: string[];
  github_url: string | null;
  linkedin_url: string | null;
  timezone: string | null;
  onboarding_completed: boolean;
  directory_visible?: boolean;
  profile_slug?: string | null;
  weekly_paper_goal?: number;
  role: MemberRole;
  created_at: string;
  updated_at: string;
};

export type OnboardingData = {
  full_name: string;
  bio: string;
  background: MemberBackground;
  interests: string[];
  github_url: string;
  linkedin_url: string;
  timezone: string;
};

export type EventResource = {
  label: string;
  url: string;
  kind?: "latex" | "cfp" | "template" | "other";
};

export type EventDeadline = {
  label: string;
  date: string;
};

export type MlEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  topics: string[];
  prep_notes: string | null;
  resources: EventResource[];
  deadlines: EventDeadline[];
  url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type Paper = {
  id: string;
  slug: string;
  title: string;
  authors: string | null;
  year: number | null;
  arxiv_url: string | null;
  tags: string[];
  is_classic: boolean;
  summary: string | null;
  review_body: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type NewsletterIssue = {
  id: string;
  slug: string;
  title: string;
  issue_number: number | null;
  summary: string | null;
  body: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type GuideSection =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "diagram"; title: string; lines: string[] }
  | { type: "callout"; text: string };

export type Guide = {
  slug: string;
  title: string;
  description: string;
  readMinutes: number;
  tags: string[];
  sections: GuideSection[];
};

export type ReadingProgress = {
  guide_slug: string;
  progress_percent: number;
  updated_at: string;
};

export type ProjectType = "research" | "startup" | "program";
export type ProjectStatus = "open" | "active" | "closed";
export type ApplicationStatus = "pending" | "accepted" | "declined" | "waitlist";
export type JobSource = "internal" | "external";
export type LeadRequestStatus = "pending" | "approved" | "rejected";

export type Project = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  skills_needed: string[];
  tags: string[];
  lead_id: string | null;
  lead_name: string | null;
  capacity: number;
  team_count: number;
  published: boolean;
  discord_url?: string | null;
  workspace_links?: { label: string; url: string; kind?: string }[];
  created_at: string;
  updated_at: string;
};

export type ProjectUpdate = {
  id: string;
  project_id: string;
  author_id: string;
  author_name?: string;
  body: string;
  created_at: string;
};

export type ProjectApplication = {
  id: string;
  project_id: string;
  user_id: string;
  pitch: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  // joined fields for display
  project_title?: string;
  project_slug?: string;
  applicant_name?: string;
  applicant_bio?: string;
  applicant_background?: MemberBackground | null;
  applicant_linkedin?: string | null;
  applicant_github?: string | null;
  applicant_interests?: string[];
};

export type Job = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string | null;
  source: JobSource;
  employment_type: string | null;
  description: string;
  url: string | null;
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadVerificationRequest = {
  id: string;
  user_id: string;
  message: string;
  status: LeadRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  applicant_name?: string;
  applicant_email?: string;
};

export type SavedItemType = "event" | "paper" | "project" | "job" | "guide" | "newsletter";

export type SavedItem = {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_slug: string;
  item_title: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  created_at: string;
};

export type SearchResult = {
  type: SavedItemType;
  slug: string;
  title: string;
  summary: string;
  href: string;
  tags: string[];
};

export type AdminStats = {
  members: number;
  projects: number;
  applications: number;
  pendingLeads: number;
  events: number;
  papers: number;
  jobs: number;
};
