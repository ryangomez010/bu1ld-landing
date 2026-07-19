import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { PageBackground } from "@/components/layout/PageBackground";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () =>
    pageHead({
      title: "Privacy Policy — The Bu1ld",
      description:
        "How The Bu1ld collects, uses, protects, exports, and deletes member and application data.",
      path: "/privacy",
    }),
});

function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground density={60} />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-24">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-green">legal</p>
        <h1 className="font-display text-4xl text-bone mt-4 tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
          How The Bu1ld handles member data: what we store, who can see it, and how to request
          deletion or export.
        </p>

        <div className="mt-10 space-y-6 text-muted-foreground leading-relaxed text-sm">
          <section>
            <h2 className="font-display text-xl text-bone mb-2">What we collect</h2>
            <p>
              When you create an account, we store your email, profile information (name, bio,
              background, interests, links), and activity within the member area: project
              applications, saved papers and jobs, reading progress, highlights, collections, job
              tracker status, and notification preferences.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">How we use it</h2>
            <p>
              Profile data is shared with project leads when you apply to a project — they see your
              application answers and public profile fields. We use your email for sign-in, password
              reset, and optional notifications (applications, digests, event reminders). Reading
              progress and highlights stay private unless you share a collection. We do not sell
              your data or run third-party ad tracking.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Who can access it</h2>
            <p>
              You can view and edit your profile anytime. Project leads see applicants on their
              threads only. Admins can moderate content reports and manage published listings.
              Access controls limit each member to their own private data unless a feature
              explicitly requires broader read access (for example, public project listings).
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Storage & retention</h2>
            <p>
              Data is stored on our managed database with access controls enforced on every request.
              Security events and sign-in sessions are retained for account safety. You can delete
              your account from Account security — that removes profile, saves, and applications
              from the member area. Contact{" "}
              <a href="mailto:ryan@thebu1ld.com" className="text-accent-blue hover:text-bone">
                ryan@thebu1ld.com
              </a>{" "}
              for full auth credential purge or data export.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-bone mb-2">Cookies</h2>
            <p>
              We use session cookies for authentication only. No third-party advertising trackers at
              launch. If we add analytics later, this page will be updated before they go live.
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
