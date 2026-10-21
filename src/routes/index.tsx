import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ContactSection } from "@/components/landing/ContactSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeaturedProjectsSection } from "@/components/landing/FeaturedProjectsSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { InstitutionOverviewSection } from "@/components/landing/InstitutionOverviewSection";
import { LandingSectionNav } from "@/components/landing/LandingSectionNav";
import { LibraryEntrySection } from "@/components/landing/LibraryEntrySection";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { MembershipSection } from "@/components/landing/MembershipSection";
import { ProgramsSection } from "@/components/landing/ProgramsSection";
import { ResearchSection } from "@/components/landing/ResearchSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { StartupsSection } from "@/components/landing/StartupsSection";
import { TeamSection } from "@/components/landing/TeamSection";
import { WhatWeDoSection } from "@/components/landing/WhatWeDoSection";
import { PageBackground } from "@/components/layout/PageBackground";
import { STATS } from "@/data/landing";
import { pageHead } from "@/lib/seo";
import { publicEvents, publicPapers } from "@/lib/public-library";
import { homeEventCatalog, homePaperCatalog } from "@/lib/home-library";
import { fetchProjects } from "@/lib/projects";

export const Route = createFileRoute("/")({
  loader: async () => {
    // Independent reads share a short deadline so unavailable catalogs cannot stall the homepage.
    const [papers, events, projects] = await Promise.all([
      publicPapers(1500),
      publicEvents(1500),
      fetchProjects(undefined, { throwOnUnavailable: true, timeoutMs: 1500 })
        .then((records) => ({ state: "ready" as const, projects: records }))
        .catch(() => ({ state: "unavailable" as const, projects: null })),
    ]);
    return { papers: homePaperCatalog(papers), events: homeEventCatalog(events), projects };
  },
  component: HomePage,
  head: () =>
    pageHead({
      title: "The Bu1ld — Join machine-learning projects",
      description:
        "Explore The Bu1LD's global AI research and engineering community, active project portfolio, open-source work, and evidence-backed contribution paths.",
      path: "/",
    }),
});

function HomePage() {
  const library = Route.useLoaderData();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-accent-blue/30">
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-bone focus:px-3 focus:py-2 focus:font-mono focus:text-[10px] focus:tracking-[0.2em] focus:uppercase focus:text-background"
      >
        Skip to content
      </a>
      <PageBackground density={72} />

      {!reduce ? (
        <motion.div
          style={{ scaleX: progress }}
          className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60] bg-gradient-to-r from-accent-red via-accent-green to-accent-blue"
        />
      ) : null}

      <SiteHeader />

      <main id="top" tabIndex={-1} className="relative z-10">
        <HeroSection />
        <LandingSectionNav />
        <InstitutionOverviewSection />
        <LibraryEntrySection papers={library.papers} events={library.events} />
        <MembershipSection />
        <FeaturedProjectsSection initial={library.projects} />
        <MarqueeStrip />
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 border border-border/40 backdrop-blur-md rounded-sm overflow-hidden">
            {STATS.map(([n, l], idx) => (
              <div key={l} className="stat-cell glass-subtle relative z-[1]">
                <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-bone/40">
                  0{idx + 1}
                </div>
                <div className="font-display text-2xl md:text-3xl text-bone mt-3 tracking-tight">
                  {n}
                </div>
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-2">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </section>
        <WhatWeDoSection />
        <ResearchSection />
        <ProgramsSection />
        <StartupsSection />
        <TeamSection />
        <FaqSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
