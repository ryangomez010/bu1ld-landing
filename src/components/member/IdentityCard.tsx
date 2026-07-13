import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Github, Globe, Linkedin } from "lucide-react";

import { TagList } from "@/components/member/ContentCard";
import { CtaLink } from "@/components/member/ContentCard";
import { RoleBadge } from "@/components/member/RoleBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function IdentityCard({
  profile,
  displayName,
  shareUrl,
  className,
}: {
  profile: Profile | null;
  displayName: string;
  shareUrl?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Wrapper = reduce ? "div" : motion.div;

  return (
    <Wrapper
      {...(!reduce
        ? {
            initial: { opacity: 0, scale: 0.98 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          }
        : {})}
      className={cn("panel glass rounded-2xl p-6 md:p-8 relative overflow-hidden", className)}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent-violet/10 blur-3xl" />
      <div className="relative z-[1] flex flex-wrap items-start gap-5">
        <Avatar className="h-16 w-16 border border-border/50 shadow-lg">
          {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
          <AvatarFallback className="bg-accent-blue/15 font-display text-xl text-bone">
            {initials(displayName || "M")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl text-bone tracking-tight">{displayName}</h3>
            {profile?.role ? <RoleBadge role={profile.role} /> : null}
          </div>
          {profile?.background ? (
            <p className="mt-1 label-xs text-muted-foreground capitalize">{profile.background}</p>
          ) : null}
          {profile?.bio ? (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground italic">
              Add a bio to stand out in the member directory.
            </p>
          )}
        </div>
      </div>

      {profile?.interests?.length ? (
        <TagList tags={profile.interests.slice(0, 8)} className="mt-5 relative z-[1]" />
      ) : null}

      {profile?.goals?.length ? (
        <div className="mt-5 relative z-[1]">
          <p className="label-xs text-accent-green mb-2">Goals this quarter</p>
          <ul className="space-y-1">
            {profile.goals.slice(0, 4).map((goal) => (
              <li key={goal} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-accent-green mt-0.5">→</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2 relative z-[1]">
        {profile?.github_url ? (
          <a
            href={profile.github_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 surface-card border border-border/40 px-3 py-1.5 label-xs text-muted-foreground hover:text-bone transition-colors"
          >
            <Github className="h-3.5 w-3.5" /> GitHub
          </a>
        ) : null}
        {profile?.linkedin_url ? (
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 surface-card border border-border/40 px-3 py-1.5 label-xs text-muted-foreground hover:text-bone transition-colors"
          >
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </a>
        ) : null}
        {profile?.website_url ? (
          <a
            href={profile.website_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 surface-card border border-border/40 px-3 py-1.5 label-xs text-muted-foreground hover:text-bone transition-colors"
          >
            <Globe className="h-3.5 w-3.5" /> Site
          </a>
        ) : null}
      </div>

      {shareUrl ? (
        <p className="mt-5 label-xs text-muted-foreground break-all relative z-[1] flex items-center gap-2">
          <ExternalLink className="h-3 w-3 shrink-0" />
          {shareUrl}
        </p>
      ) : null}

      {profile?.id ? (
        <CtaLink
          to="/members/$id"
          params={{ id: profile.id }}
          className="mt-4 inline-block relative z-[1]"
        >
          View public profile →
        </CtaLink>
      ) : null}
    </Wrapper>
  );
}
