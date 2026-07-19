import { Link } from "@tanstack/react-router";

import { Wordmark } from "@/components/Wordmark";
import { CONTACT_EMAIL, LINKEDIN_URL } from "@/data/landing";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 bg-background/90 py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark className="text-lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Independent machine-learning projects, reviewed contributions, and evidence-backed
            technical work.
          </p>
          <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">
            © 2026 The Bu1ld
          </p>
        </div>

        <nav
          aria-label="Explore"
          className="grid content-start gap-3 text-sm text-muted-foreground"
        >
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.24em] text-bone/40">
            Explore
          </p>
          <Link to="/projects" className="hover:text-bone">
            Projects
          </Link>
          <Link to="/labs" className="hover:text-bone">
            Research labs
          </Link>
          <Link to="/programs-public" className="hover:text-bone">
            Programs
          </Link>
          <Link to="/publications" className="hover:text-bone">
            Publications
          </Link>
          <Link to="/evidence" className="hover:text-bone">
            Evidence register
          </Link>
        </nav>

        <nav
          aria-label="Institution"
          className="grid content-start gap-3 text-sm text-muted-foreground"
        >
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.24em] text-bone/40">
            Institution
          </p>
          <Link to="/people" className="hover:text-bone">
            People
          </Link>
          <Link to="/partnerships" className="hover:text-bone">
            Partnerships
          </Link>
          <Link to="/apply" className="hover:text-bone">
            Application paths
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-bone">
            Contact
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="hover:text-bone">
            LinkedIn
          </a>
          <div className="mt-2 flex gap-4 font-mono text-[9px] uppercase tracking-[0.16em]">
            <Link to="/privacy" className="hover:text-bone">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-bone">
              Terms
            </Link>
          </div>
        </nav>
      </div>
    </footer>
  );
}
