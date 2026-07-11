import { Link, type LinkProps } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { safeHref } from "@/lib/urls";
import { cn } from "@/lib/utils";

export function CtaLink({
  to,
  children,
  accent = "blue",
  className,
  ...props
}: {
  to: LinkProps["to"];
  children: ReactNode;
  accent?: "blue" | "green";
  className?: string;
} & Omit<LinkProps, "to" | "children" | "className">) {
  return (
    <Link
      to={to}
      className={cn("cta-link", accent === "green" && "cta-link-green", className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function TagList({
  tags,
  className,
  linkToSearch,
}: {
  tags: string[];
  className?: string;
  linkToSearch?: boolean;
}) {
  if (!tags.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) =>
        linkToSearch ? (
          <Link key={tag} to="/search" search={{ q: tag }} className="tag">
            {tag}
          </Link>
        ) : (
          <span key={tag} className="tag pointer-events-none">
            {tag}
          </span>
        ),
      )}
    </div>
  );
}

export function ContentCard({
  to,
  params,
  search,
  tag,
  title,
  summary,
  meta,
  children,
}: {
  to: LinkProps["to"];
  params?: LinkProps["params"];
  search?: LinkProps["search"];
  tag?: string;
  title: string;
  summary?: string | null;
  meta?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      params={params}
      search={search}
      className="panel panel-interactive group block p-6 rounded-xl"
    >
      {tag ? <span className="label-xs text-accent-blue/80">{tag}</span> : null}
      <h3 className="font-display text-xl text-bone mt-2 tracking-tight group-hover:text-accent-blue transition-colors">
        {title}
      </h3>
      {summary ? (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{summary}</p>
      ) : null}
      {meta ? <p className="mt-4 label-xs text-muted-foreground/80">{meta}</p> : null}
      {children}
    </Link>
  );
}

export function InlineEmpty({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={cn("panel glass-subtle surface-card p-5 text-center", className)}>
      <p className="font-display text-sm text-bone relative z-[1]">{title}</p>
      {body ? (
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed relative z-[1]">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-3 relative z-[1]">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div
      role="status"
      className="panel glass rounded-2xl border border-dashed border-border/40 p-12 text-center max-w-lg mx-auto"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-bone/3 relative z-[1]">
        <Icon className="h-5 w-5 text-muted-foreground/70" aria-hidden />
      </div>
      <h3 className="font-display text-xl text-bone relative z-[1]">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed relative z-[1]">
        {body}
      </p>
      {action ? <div className="mt-5 flex justify-center relative z-[1]">{action}</div> : null}
    </div>
  );
}

export function MarkdownBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/);
  return (
    <div className="prose-build space-y-4 text-foreground/90 leading-relaxed">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("```")) {
          const code = trimmed.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-sm border border-border/60 bg-card/40 p-4 font-mono text-xs text-bone/85"
            >
              <code>{code}</code>
            </pre>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="font-display text-2xl text-bone mt-8 tracking-tight">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={i} className="font-display text-3xl text-bone tracking-tight">
              {trimmed.slice(2)}
            </h1>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").map((l) => l.replace(/^[-*] /, ""));
          return (
            <ul key={i} className="list-disc pl-5 space-y-1 text-muted-foreground">
              {items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (/^\d+\. /.test(trimmed)) {
          const items = trimmed.split("\n").map((l) => l.replace(/^\d+\. /, ""));
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1 text-muted-foreground">
              {items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        if (trimmed.startsWith("*") && trimmed.endsWith("*") && !trimmed.includes("\n")) {
          return (
            <p
              key={i}
              className="text-sm italic text-muted-foreground border-l-2 border-bone/20 pl-4"
            >
              {trimmed.slice(1, -1)}
            </p>
          );
        }
        return (
          <p key={i} className="text-muted-foreground">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g).filter(Boolean);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="text-bone font-medium">
          {bold[1]}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <span key={i}>{link[1]}</span>;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent-blue hover:text-bone underline-offset-2 hover:underline"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
