import { z } from "zod";

import { LIMITS } from "@/lib/security";
import { isSafeUrl } from "@/lib/urls";
import type { ProjectType } from "@/lib/types";

export const projectTypeSchema = z.enum(["research", "startup", "program"]);

export const createProjectInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters.")
    .max(LIMITS.applicationPitch, "Description is too long."),
  type: projectTypeSchema,
  skills_needed: z.array(z.string().trim().max(40)).max(20),
  tags: z.array(z.string().trim().max(40)).max(20),
  capacity: z.number().int().min(1).max(50),
  discord_url: z
    .string()
    .trim()
    .max(LIMITS.profileUrl)
    .optional()
    .nullable()
    .refine((v) => !v || isSafeUrl(v), "Discord URL must be a valid https link."),
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const leadRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(40, "Tell us a bit more about your experience (at least 40 characters).")
    .max(2000, "Message is too long."),
});

export type LeadRequestInput = z.infer<typeof leadRequestSchema>;

export function parseCreateProjectInput(input: {
  title: string;
  description: string;
  type: ProjectType;
  skills_needed: string[];
  tags: string[];
  capacity: number;
  discord_url?: string | null;
}): { data: CreateProjectInput | null; error: string | null } {
  const result = createProjectInputSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: result.error.errors[0]?.message ?? "Invalid project input." };
  }
  return { data: result.data, error: null };
}

export function parseLeadRequestInput(message: string): {
  data: LeadRequestInput | null;
  error: string | null;
} {
  const result = leadRequestSchema.safeParse({ message });
  if (!result.success) {
    return { data: null, error: result.error.errors[0]?.message ?? "Invalid request." };
  }
  return { data: result.data, error: null };
}

export const emailRequestSchema = z.object({
  to: z.string().trim().email().max(254).optional(),
  userId: z.string().uuid().optional(),
  subject: z.string().trim().min(1).max(LIMITS.emailSubject),
  html: z.string().trim().min(1).max(LIMITS.emailHtml),
});

export type EmailRequestInput = z.infer<typeof emailRequestSchema>;

export function parseEmailRequestInput(raw: unknown): {
  data: EmailRequestInput | null;
  error: string | null;
} {
  const result = emailRequestSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: result.error.errors[0]?.message ?? "Invalid email payload." };
  }
  if (!result.data.to && !result.data.userId) {
    return { data: null, error: "Missing recipient (to or userId)." };
  }
  return { data: result.data, error: null };
}

export const digestRequestSchema = z.object({
  frequency: z.enum(["daily", "weekly"]).optional(),
  force: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

export type DigestRequestInput = z.infer<typeof digestRequestSchema>;

export function parseDigestRequestInput(raw: unknown): {
  data: DigestRequestInput;
  error: string | null;
} {
  const result = digestRequestSchema.safeParse(raw ?? {});
  if (!result.success) {
    return { data: {}, error: result.error.errors[0]?.message ?? "Invalid digest payload." };
  }
  return { data: result.data, error: null };
}
