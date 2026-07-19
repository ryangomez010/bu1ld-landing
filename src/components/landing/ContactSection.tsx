import { Link } from "@tanstack/react-router";

import { Wordmark } from "@/components/Wordmark";
import { SectionLabel } from "@/components/landing/Section";
import { CONTACT_EMAIL, DISCORD_URL, LINKEDIN_URL } from "@/data/landing";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative py-32 md:py-40 border-t border-border/60 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-blue/[0.04] to-transparent" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="flex justify-center">
          <SectionLabel id="08">contact / apply</SectionLabel>
        </div>
        <h2 className="font-display text-5xl md:text-8xl mt-8 tracking-[-0.035em] leading-[0.95]">
          Build with <Wordmark />.
        </h2>
        <p className="mt-10 max-w-xl mx-auto text-muted-foreground text-lg leading-relaxed">
          Researchers, engineers, founders, and serious students are welcome. Browse a project brief
          first, then create an account to apply with a concrete pitch. Use email or Discord for
          partnerships and operational questions.
        </p>
        <div className="mt-14 flex flex-wrap justify-center gap-4">
          <Link
            to="/projects"
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-sm bg-bone text-background font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-accent-blue transition glow-bone"
          >
            Find a project <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            to="/signup"
            search={{ redirect: "/projects" }}
            className="inline-flex items-center gap-3 px-9 py-4 rounded-sm border border-bone/25 font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-bone/5 hover:border-bone/60 transition"
          >
            Create account to apply
          </Link>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 px-9 py-4 rounded-sm border border-bone/25 font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-bone/5 hover:border-bone/60 transition"
          >
            Join Discord
          </a>
        </div>

        <div className="mt-24 grid gap-px bg-border/40 border border-border/40 text-left backdrop-blur-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-background/80 p-7">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Discord
            </div>
            <a
              href={DISCORD_URL}
              className="mt-3 block font-display text-bone hover:text-accent-blue transition break-all"
            >
              discord.gg/NG4QYat4P
            </a>
          </div>
          <div className="bg-background/80 p-7">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Lead contact
            </div>
            <div className="mt-3 font-display text-bone">Ryan Gomez</div>
            <div className="text-xs text-muted-foreground mt-1">Founder, Research & Systems</div>
          </div>
          <div className="bg-background/80 p-7">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Email
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 block font-display text-bone hover:text-accent-blue transition"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="bg-background/80 p-7">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              LinkedIn
            </div>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block font-display text-bone hover:text-accent-blue transition break-all"
            >
              linkedin.com/in/ryan-gomez-03701b363
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
