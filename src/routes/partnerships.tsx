import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PARTNERSHIPS } from "@/data/institution";
import { CONTACT_EMAIL } from "@/data/landing";
import { clampText, checkFormRateLimit } from "@/lib/security";

export const Route = createFileRoute("/partnerships")({
  component: PartnershipsPage,
  head: () => ({
    meta: [
      { title: "Partnerships — The Bu1ld" },
      {
        name: "description",
        content:
          "Academic, infrastructure, and community partnerships. We disclose relationships when they are active and material.",
      },
    ],
  }),
});

function PartnershipsPage() {
  const [org, setOrg] = useState("");
  const [kind, setKind] = useState("academic");
  const [scope, setScope] = useState("");
  const [timeline, setTimeline] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const limited = checkFormRateLimit(email || "anon", "partnership-inquiry", 60_000, 5);
    if (!limited.allowed) {
      toast.error("Please wait a moment before sending another inquiry.");
      return;
    }
    const safeOrg = clampText(org, 120);
    const safeScope = clampText(scope, 2000);
    const safeTimeline = clampText(timeline, 500);
    const safeSuccess = clampText(success, 1000);
    if (safeOrg.length < 2 || safeScope.length < 40 || safeSuccess.length < 20) {
      toast.error("Add organization, a concrete scope (≥40 chars), and 90-day success criteria.");
      return;
    }
    const subject = encodeURIComponent(`Partnership inquiry — ${safeOrg}`);
    const body = encodeURIComponent(
      [
        `Organization: ${safeOrg}`,
        `Kind: ${kind}`,
        `Reply-to: ${email || "(not provided)"}`,
        "",
        "Scope:",
        safeScope,
        "",
        "Timeline:",
        safeTimeline || "(not provided)",
        "",
        "Success in 90 days:",
        safeSuccess,
      ].join("\n"),
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success("Opening your email client with the inquiry draft.");
  };

  return (
    <InstitutionLayout
      eyebrow="Partnerships"
      title="Collaborations we can stand behind."
      description="We do not invent logos. Partnerships appear here when the relationship is real, scoped, and useful to members."
    >
      <div className="space-y-4">
        {PARTNERSHIPS.map((partner) => (
          <article
            key={partner.name}
            className="rounded-sm border border-border/50 bg-bone/[0.02] p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                {partner.kind}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                {partner.status}
              </span>
            </div>
            <h2 className="mt-3 font-display text-xl text-bone">{partner.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{partner.summary}</p>
          </article>
        ))}
      </div>

      <section className="mt-12 rounded-sm border border-border/50 p-6">
        <h2 className="font-display text-xl text-bone">Propose a partnership</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Academic co-advising, compute grants, and community collaborations are welcome when they
          come with clear mutual obligations. This form drafts an email to {CONTACT_EMAIL} — nothing
          is stored until you send it.
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid max-w-xl gap-4">
          <div className="space-y-2">
            <Label htmlFor="org">Organization</Label>
            <Input
              id="org"
              required
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kind">Kind</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id="kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Your email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Textarea
              id="scope"
              required
              rows={4}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="bg-background/50"
              placeholder="What we would do together, and what each side owns."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="bg-background/50"
              placeholder="e.g. 90-day pilot starting Q3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="success">What success looks like in 90 days</Label>
            <Textarea
              id="success"
              required
              rows={3}
              value={success}
              onChange={(e) => setSuccess(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <Button type="submit" className="w-fit font-mono text-[10px] uppercase tracking-[0.2em]">
            Draft email inquiry
          </Button>
        </form>
        <Link
          to="/evidence"
          className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-bone"
        >
          See the evidence register →
        </Link>
      </section>
    </InstitutionLayout>
  );
}
