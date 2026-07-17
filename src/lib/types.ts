export type MemberRole = "member" | "project_lead" | "admin";
export type InstitutionalRole =
  | "researcher"
  | "project_lead"
  | "reviewer"
  | "mentor"
  | "administrator"
  | "lab_lead"
  | "startup_founder"
  | "applicant";

export type Lab = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  tagline: string;
  summary: string;
  focus: string[];
  methods: string[];
  open_roles: string[];
  color: string;
  published: boolean;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Competition = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: "upcoming" | "open" | "judging" | "closed";
  prize: string;
  deadline: string | null;
  lab_id: string | null;
  evaluation_protocol: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type Partnership = {
  id: string;
  name: string;
  kind: "academic" | "industry" | "community" | "infrastructure";
  summary: string;
  status: "active" | "exploring" | "ended";
  published: boolean;
  evidence_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Invitation = {
  id: string;
  invite_token: string;
  invitation_type: "project" | "lab" | "program";
  target_id: string;
  email: string | null;
  invitee_id: string | null;
  invited_by: string;
  role_offered: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type MemberBackground = "researcher" | "engineer" | "founder" | "student" | "other";

export type ContentDensity = "compact" | "comfortable" | "spacious";
export type EmailDigestFrequency = "daily" | "weekly" | "never";

export type MemberPreferences = {
  user_id: string;
  content_density: ContentDensity;
  email_digest_frequency: EmailDigestFrequency;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  background: MemberBackground | null;
  interests: string[];
  goals?: string[];
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  avatar_url?: string | null;
  timezone: string | null;
  onboarding_completed: boolean;
  directory_visible?: boolean;
  profile_slug?: string | null;
  weekly_paper_goal?: number;
  role: MemberRole;
  institutional_roles?: InstitutionalRole[];
  created_at: string;
  updated_at: string;
};

export type OnboardingData = {
  full_name: string;
  bio: string;
  background: MemberBackground;
  interests: string[];
  goals?: string[];
  github_url: string;
  linkedin_url: string;
  twitter_url?: string;
  website_url?: string;
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
  content_kind?: "review" | "explainer" | "research_note";
  field?: string | null;
  difficulty?: "introductory" | "intermediate" | "advanced" | null;
  source_url?: string | null;
  reviewer_id?: string | null;
  review_status?: "draft" | "in_review" | "published";
};

export type PaperAnalysisResult = {
  abstract?: string;
  problem: string[];
  contribution: string[];
  method: string[];
  datasets: string[];
  experiments: string[];
  findings: string[];
  limitations: string[];
  reproducibility: string[];
  weaknesses: string[];
  questions: string[];
  safety_note: string;
};

export type PaperAnalysis = {
  id: string;
  user_id: string;
  title: string;
  source_url: string | null;
  input_kind: "text";
  input_excerpt: string;
  input_sha256: string;
  status: "completed" | "failed";
  provider: "local_structured_v1";
  prompt_version: "paper-analysis-v1";
  structured_result: PaperAnalysisResult;
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
  publication_status?: "draft" | "submitted" | "changes_requested" | "published" | "archived";
  publication_note?: string | null;
  published_by?: string | null;
  published_at?: string | null;
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
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

export type ProjectMembership = {
  project_id: string;
  user_id: string;
  member_role: "lead" | "contributor" | "mentor" | "reviewer";
  status: "active" | "paused" | "alumni" | "removed";
  joined_at: string;
  left_at: string | null;
  member_name?: string | null;
  member_background?: MemberBackground | null;
};

export type MilestoneStatus = "planned" | "in_progress" | "blocked" | "completed";
export type CollaborationVisibility = "team" | "public";

export type ProjectMilestone = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  visibility: CollaborationVisibility;
  due_date: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ContributionType =
  | "research"
  | "experiment"
  | "code"
  | "review"
  | "design"
  | "product"
  | "operations";

export type ProjectContribution = {
  id: string;
  project_id: string;
  milestone_id: string | null;
  contributor_id: string;
  contribution_type: ContributionType;
  title: string;
  summary: string;
  evidence_url: string | null;
  visibility: CollaborationVisibility;
  verification_status: "submitted" | "verified" | "needs_changes";
  verification_note?: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramType = "cohort" | "fellowship" | "workshop" | "incubation" | "competition";
export type Program = {
  id: string;
  slug: string;
  title: string;
  program_type: ProgramType;
  summary: string;
  application_instructions: string | null;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  applications_open_at?: string | null;
  applications_close_at?: string | null;
  outcomes?: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type InstitutionalClaimType =
  | "affiliation"
  | "publication"
  | "project_outcome"
  | "member_stat"
  | "program_outcome"
  | "other";

export type InstitutionalClaim = {
  id: string;
  claim_type: InstitutionalClaimType;
  statement: string;
  context: string | null;
  evidence_url: string;
  evidence_label: string;
  status: "draft" | "verified" | "retired";
  valid_until: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramApplication = {
  id: string;
  program_id: string;
  user_id: string;
  statement: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  applicant_name?: string | null;
  applicant_background?: MemberBackground | null;
  program_title?: string | null;
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
  reviewed_by?: string | null;
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
  programs: number;
  contributions: number;
  verifiedContributions: number;
  evidenceClaims: number;
  pendingProjectReviews: number;
  pendingProgramApplications: number;
};
