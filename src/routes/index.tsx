import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { useState } from "react";

import { GenesisIntro } from "@/components/GenesisIntro";
import { ContactSection } from "@/components/landing/ContactSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { HeroSection } from "@/components/landing/HeroSection";
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

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [intro, setIntro] = useState(true);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-accent-blue/30">
      <AnimatePresence>
        {intro ? <GenesisIntro onDone={() => setIntro(false)} /> : null}
      </AnimatePresence>

      <PageBackground density={140} />

      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60] bg-gradient-to-r from-accent-red via-accent-green to-accent-blue"
      />

      <SiteHeader />

      <div className="relative z-10">
        <HeroSection />
        <MarqueeStrip />
        <WhatWeDoSection />
        <MembershipSection />
        <ResearchSection />
        <ProgramsSection />
        <StartupsSection />
        <TeamSection />
        <FaqSection />
        <ContactSection />
        <SiteFooter />
      </div>
    </div>
  );
}
