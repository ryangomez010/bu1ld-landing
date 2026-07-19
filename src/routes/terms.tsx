import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { PageBackground } from "@/components/layout/PageBackground";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () =>
    pageHead({
      title: "Terms of Use — The Bu1ld",
      description:
        "Terms for membership, project applications, contributions, evidence, acceptable use, and account termination.",
      path: "/terms",
    }),
});

function TermsPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground density={60} />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-24">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-green">legal</p>
        <h1 className="font-display text-4xl text-bone mt-4 tracking-tight">Terms of Use</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-10 space-y-6 text-muted-foreground leading-relaxed text-sm">
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Membership</h2>
            <p>
              The Bu1ld is an independent machine-learning research and building platform. Member
              accounts are free at launch. You are responsible for accurate profile information —
              project leads rely on it during application review.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Projects & applications</h2>
            <p>
              Project leads accept or decline applications at their discretion. Acceptance grants
              access to the project workspace — not employment, compensation, or IP assignment
              unless agreed separately in writing with the lead.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Content</h2>
            <p>
              Guides, paper reviews, and newsletter content are for educational reference. Do not
              redistribute The Bu1ld editorial content without permission. Research and code
              contributed to projects may be subject to separate licenses set by project leads.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Conduct</h2>
            <p>
              No harassment, spam, or misrepresentation. Admins may suspend accounts that violate
              community standards.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Contact</h2>
            <p>
              Questions:{" "}
              <a href="mailto:ryan@thebu1ld.com" className="text-accent-blue hover:text-bone">
                ryan@thebu1ld.com
              </a>
            </p>
          </section>
        </div>

        <Link
          to="/"
          className="mt-12 inline-block font-mono text-[10px] tracking-[0.25em] uppercase text-accent-blue hover:text-bone"
        >
          ← Back home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
