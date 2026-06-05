import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { GenesisIntro } from "@/components/GenesisIntro";
import { NeuralField } from "@/components/NeuralField";
import { Wordmark } from "@/components/Wordmark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Bu1ld, an ML research and builder community" },
      {
        name: "description",
        content:
          "An independent AI lab and builder community. Six research threads, six startup projects, and a small core team that ships.",
      },
      { property: "og:title", content: "The Bu1ld" },
      { property: "og:description", content: "Where machine learning research turns into real systems." },
    ],
  }),
  component: Index,
});

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

const RESEARCH = [
  {
    id: "T-01",
    name: "Counterfactual Defect Worlds",
    color: "red",
    tag: "world models",
    one: "What happens to a learned world model when the world quietly breaks?",
    desc: "We inject controlled defects into video and physics simulators, then watch how generative world models notice, ignore, or hallucinate around the change. The output is a benchmark that predicts where a model will silently fail before it does.",
  },
  {
    id: "T-02",
    name: "Sapir Whorf and the Latent Tongue",
    color: "blue",
    tag: "interpretability",
    one: "Does the language a model is trained on quietly choose the categories it can think with?",
    desc: "We probe monolingual and multilingual checkpoints to see which concepts collapse, which split, and which only exist inside one language. Joint working group with friends in the Stanford NLP lab.",
  },
  {
    id: "T-03",
    name: "Adaptive Theory Geometry",
    color: "green",
    tag: "representation",
    one: "What shape does a world model wear when it learns new physics?",
    desc: "Tracking curvature and intrinsic dimension of the latent manifold as a single network adapts across regimes, fluids to rigid bodies, low Reynolds to turbulent. Driven by the UC physics PhD on the team.",
  },
  {
    id: "T-04",
    name: "Residual Event Tokenization",
    color: "amber",
    tag: "compression",
    one: "Why tokenize every frame when only the surprise carries information?",
    desc: "A streaming tokenizer that emits tokens only for residual, prediction violating events. We are seeing roughly 4x compression on driving video at parity downstream loss, and a much cleaner causal trace for downstream agents.",
  },
  {
    id: "T-05",
    name: "Phase Transitions in Neural PDE Surrogates",
    color: "violet",
    tag: "scaling",
    one: "Where does a PDE surrogate stop being a model and start being a memorizer?",
    desc: "We scan width, depth, and data scale to find sharp transitions in representational behavior, and use those transitions as early warnings that a surrogate is about to silently degrade in deployment.",
  },
  {
    id: "T-06",
    name: "On Device Agent Loops",
    color: "bone",
    tag: "systems",
    one: "What happens when a 3B parameter agent has to actually fit on the laptop it is planning for?",
    desc: "Quantization, KV cache surgery, and learned planners co designed for edge inference. Working reference implementation runs on consumer Apple silicon and a single 4090.",
  },
] as const;

const PROGRAMS = [
  {
    tag: "P-01",
    name: "Builder Cohort",
    time: "12 weeks, rolling intake",
    body: "A project driven track for engineers who want to ship a real ML system end to end. You read the paper, you build the prototype, you put it behind an endpoint, you watch it survive a real user.",
    accent: "blue",
  },
  {
    tag: "P-02",
    name: "Research Fellowship",
    time: "6 months, selective",
    body: "Co advised research with collaborators from Stanford, MIT, and the UC physics group. Targets are top venues and open sourced reference code. Both, not either.",
    accent: "green",
  },
  {
    tag: "P-03",
    name: "Startup Incubation",
    time: "ongoing",
    body: "Translate a research thread into a venture. Technical due diligence, founder matching, infra credits, intros to design partners. We help with the first ten paying customers, not the press release.",
    accent: "red",
  },
];

const STARTUPS = [
  {
    name: "NeuroCad",
    stage: "scaling",
    domain: "Text to CAD",
    thesis:
      "Natural language to manufacturable mechanical assemblies, with a learned prior that knows what a real machinist would actually build.",
  },
  {
    name: "Colorworld",
    stage: "seed",
    domain: "Generative palettes",
    thesis:
      "Brand coherent color systems and full design tokens generated from a one line intent. Ships JSON, not just JPEGs.",
  },
  {
    name: "Exovian",
    stage: "prototype",
    domain: "AI native games",
    thesis:
      "Game worlds where the simulator, NPCs, and narrative are run by on device learned models. Currently a single playable demo and a lot of conviction.",
  },
  {
    name: "Eigen Delta",
    stage: "research",
    domain: "Foundation models",
    thesis:
      "Compact delta trained foundation models that specialize in hours, not weeks. One backbone, swappable behavior.",
  },
  {
    name: "Fieldwire",
    stage: "prototype",
    domain: "Robotic perception",
    thesis:
      "Vision language models for industrial inspection on hardware that does not have a GPU and never will.",
  },
  {
    name: "Lattice Notes",
    stage: "seed",
    domain: "Knowledge tools",
    thesis:
      "A research notebook that learns the way you cite, then drafts the literature review you would have written next week.",
  },
];

const TEAM = [
  { name: "Ryan Gomez", role: "Founder, Research on World Models", initials: "RG", color: "blue" },
  { name: "Anirudh Menon", role: "PHD graduate UC Davis, Physics ML", initials: "AM", color: "green" },
  { name: "Moses Lua", role: "Hedge Fund Analyst", initials: "ML", color: "red" },
  { name: "Andrew Shin", role: "Researcher, Stanford", initials: "AS", color: "violet" },
  { name: "Arush", role: "Data Analyst, Startup founder", initials: "A", color: "amber" },
  { name: "Frank Niu", role: "Researcher, VideoGame Developer", initials: "FN", color: "bone" },
];

const STATS: Array<[string, string]> = [
  ["112", "active builders"],
  ["12", "research threads"],
  ["24", "startup projects"],
  ["15", "papers in flight"],
];

const MANIFESTO = [
  {
    n: "01",
    title: "Ship beats publish.",
    body: "A paper is evidence. A working artifact is the point. Every thread closes with a model, a demo, a deployed system, or a company.",
  },
  {
    n: "02",
    title: "Rigor without ritual.",
    body: "We measure twice, ablate honestly, and reject benchmarks that do not predict downstream behavior. Theatre is the enemy of progress.",
  },
  {
    n: "03",
    title: "Builders of any age.",
    body: "Sixteen or sixty, what matters is taste, throughput, and a willingness to be wrong in public. Output beats credentials.",
  },
  {
    n: "04",
    title: "Open by default.",
    body: "Reference code is public. Threads are documented. Closed work exists only when a venture requires it, and only for as long as it must.",
  },
];

const UPDATES = [
  { date: "2026 Q2", tag: "release", text: "Residual Event Tokenizer v0.3 open sourced. 4.1x compression on driving video at parity downstream loss." },
  { date: "2026 Q2", tag: "spinout", text: "NeuroCad achieves generation of 2M face Klein Bottle in under 0.2 seconds, raises funds." },
  { date: "2026 Q1", tag: "paper", text: "Phase Transitions in Neural PDE Surrogates under review in workshops" },
  { date: "2026 Q1", tag: "cohort", text: "Just crossed 200 builders across 11 cities and 6 universities." },
  { date: "2025 Q4", tag: "lab", text: "Latent Tongue thread launches under review at Stanford NLP lab." },
  { date: "2025 Q3", tag: "infra", text: "Internal training stack moved to a shared scheduler. Median experiment turnaround down from 9h to 47m." },
];

const FAQ = [
  {
    q: "Who is this actually for?",
    a: "Engineers and researchers who want their work to compound. We bias toward people who already ship: open source maintainers, paper authors, indie founders, students who already built something real.",
  },
  {
    q: "Do I need to be in a specific city?",
    a: "No. The Bu1ld is distributed. We meet weekly online, run quarterly in person intensives, and host pop up residencies near our university partners.",
  },
  {
    q: "Is there a fee?",
    a: "No. Programs are free for accepted members. We are funded by spin out equity, research grants, and infra partners.",
  },
  {
    q: "What does an application look like?",
    a: "Send work, not a resume. A repo, a paper, a demo video, a deployed product. We read everything that comes in.",
  },
  {
    q: "Can I join just for research, not the startup track?",
    a: "Yes. Most members never start a company. The fellowship and the cohort (short term 0are independent paths and a lot of people stay in research permanently.",
  },
];

const TICKER = [
  "Fabric Induced Memory model under review at fortune 500 companies",
  "REToken v0.3 shipped",
  "NeuroCad seed closed",
  "PDE phase transition paper at ICLR",
  "Saphir Whoff x Stanford NLP",
  "open source by default",
  "Stanford, MIT, UC",
  "builders of any age",
];

const NAV = [
  { id: "what", label: "What" },
  { id: "research", label: "Research" },
  { id: "programs", label: "Programs" },
  { id: "startups", label: "Startups" },
  { id: "founder", label: "Founder" },
  { id: "manifesto", label: "Manifesto" },
  { id: "updates", label: "Updates" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

const VOICES = [
  {
    quote:
      "I joined to read papers. I left with a co founder, a deployed model, and a research thread I will spend the next decade on.",
    who: "Builder, Cohort 02",
  },
  {
    quote:
      "It is the only place I have seen where a 19 year old and a tenured professor argue about loss curves as peers and both come away sharper.",
    who: "Masters Graduate, MIT",
  },
  {
    quote:
      "We went from a Discord thread to a funded company in eleven weeks. The pressure testing was brutal in the best way possible.",
    who: "Founder",
  },
];

/* Founder section, base copy. The founder will edit and expand this. */
const FOUNDER = {
  name: "Ryan Gomez",
  role: "Founder, Research and Systems",
  short: "I started The Bu1ld because the gap between a paper and a product kept eating the people I respected most.",
  paras: [
    `Ryan Gomez is a Sophomore at the Oakridge International School of Bangalore with a passion for being a maximalist especially outside the classroom.
Whilst receiving awards at various International Model UN conferences, under Princeton's Math Progra, being a champion scholar at the Worlds Scholars CUP,
international olympiads and having his research published internationally
whilst being an author of a quantum mechanics book, he has founded initiatives like obscured records, expanded upon a UNICEF recognised non profit and has ran Oakridge Junior codefest for 5 years running now.
He has also played international football and works at various projects like he’s the next Soham Parekh.
In his “free time”, he loves to explore his hobbies like the guitar or work on his assortment of projects. He also loves learning at an astronomical rate per se.`,
  ],
  facts: [
    ["Based", "Distributed, mostly Bangalore"],
    ["Writing on", "world models, scaling, agents on the edge"],
    ["Currently building", "NeuroCad, Vertex.ED, Finance Meta"],
    ["Reachable at", "ryangomez.hs@gmail.com"],
  ] as const,
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

const stageColor: Record<string, string> = {
  research: "text-bone border-bone/40",
  prototype: "text-accent-green border-accent-green/40",
  seed: "text-accent-blue border-accent-blue/40",
  scaling: "text-accent-red border-accent-red/40",
};

const hoverGlow: Record<string, string> = {
  blue: "hover:glow-blue",
  red: "hover:glow-red",
  green: "hover:glow-green",
  amber: "hover:glow-amber",
  violet: "hover:glow-violet",
  bone: "hover:glow-bone",
};

const textAccent: Record<string, string> = {
  blue: "text-accent-blue",
  red: "text-accent-red",
  green: "text-accent-green",
  amber: "text-accent-amber",
  violet: "text-accent-violet",
  bone: "text-bone",
};

const dotAccent: Record<string, string> = {
  blue: "bg-accent-blue",
  red: "bg-accent-red",
  green: "bg-accent-green",
  amber: "bg-accent-amber",
  violet: "bg-accent-violet",
  bone: "bg-bone",
};

function SectionLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
      <span className="text-bone/60">// {id}</span> &nbsp; {children}
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

function Index() {
  // Gate the intro to the client to avoid SSR/hydration mismatch that was
  // making the canvas overlay disappear in production.
  const [intro, setIntro] = useState(false);
  const [active, setActive] = useState<string>("top");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const seen = sessionStorage.getItem("bu1ld:intro");
    if (!seen) {
      setIntro(true);
      sessionStorage.setItem("bu1ld:intro", "1");
    }
  }, []);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 22, mass: 0.3 });
  const watermarkX = useTransform(scrollYProgress, [0, 1], [0, -120]);

  useEffect(() => {
    const ids = ["top", ...NAV.map((n) => n.id)];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-accent-blue/30">
      <AnimatePresence>
        {intro && <GenesisIntro key="intro" onDone={() => setIntro(false)} />}
      </AnimatePresence>

      {/* SCROLL PROGRESS */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-accent-red via-accent-blue to-accent-green"
      />

      {/* GLOBAL FLOW FIELD */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <NeuralField density={170} fixed />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background/85" />
        <div className="absolute inset-0 noise opacity-[0.06] mix-blend-overlay" />
      </div>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/40 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <a href="#top" className="text-xl tracking-tight">
            <Wordmark />
          </a>
          <nav className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={`relative transition ${active === n.id ? "text-bone" : "hover:text-bone"}`}
              >
                {n.label}
                {active === n.id && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-accent-blue"
                  />
                )}
              </a>
            ))}
          </nav>
          <a
            href="https://discord.gg/NG4QYat4P"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] tracking-[0.2em] uppercase px-3 py-2 border border-accent-blue/40 text-bone hover:bg-accent-blue/10 transition rounded-sm"
          >
            Join →
          </a>
        </div>
      </header>

      <div className="relative z-10">
        {/* HERO */}
        <section id="top" className="relative min-h-screen flex items-center overflow-hidden pt-24">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <motion.div
            style={{ x: watermarkX }}
            className="pointer-events-none absolute -bottom-10 left-0 right-0 whitespace-nowrap font-display font-bold text-[18vw] leading-none text-stroke opacity-30"
          >
            BU1LD · BU1LD · BU1LD
          </motion.div>

          <div className="relative mx-auto max-w-7xl px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.15 }}
              className="max-w-5xl"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <SectionLabel id="00">a research and startup hub</SectionLabel>
                <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse-soft" />
                  cohort 04 live
                </span>
              </div>

              <h1 className="font-display font-bold mt-6 text-[clamp(2.5rem,7.5vw,7rem)] leading-[0.95] tracking-tight">
                <Wordmark />
                <span className="block text-foreground/90 mt-4">
                  Where machine learning <br className="hidden md:block" />
                  research becomes <span className="italic text-bone">real systems<span className="caret" /></span>
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
                An independent AI lab and builder community. About 110 researchers, engineers,
                and founders, advised by collaborators across <span className="text-bone">Stanford</span>,
                <span className="text-bone"> MIT</span>, and a <span className="text-bone">UC</span> physics
                group. Six research threads, six startup projects, one operating principle:
                <span className="text-bone italic"> ship beats publish</span>.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a href="#contact" className="group inline-flex items-center gap-3 px-6 py-3 rounded-sm bg-bone text-background font-mono text-xs tracking-[0.25em] uppercase hover:bg-accent-blue transition glow-bone">
                  Apply <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
                <a href="#research" className="inline-flex items-center gap-3 px-6 py-3 rounded-sm border border-bone/30 font-mono text-xs tracking-[0.25em] uppercase hover:border-bone hover:bg-bone/5 transition">
                  Explore research
                </a>
              </div>
            </motion.div>

            {/* status strip */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
              }}
              className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 border border-border/40 backdrop-blur-sm"
            >
              {STATS.map(([n, l]) => (
                <motion.div
                  key={l}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-background/70 p-5"
                >
                  <div className="font-display text-2xl md:text-3xl text-bone">{n}</div>
                  <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-2">
                    {l}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* scroll cue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
            >
              scroll
              <motion.span
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="h-6 w-px bg-bone/40"
              />
            </motion.div>
          </div>
        </section>

        {/* TICKER */}
        <div className="relative border-y border-border bg-background/70 backdrop-blur-sm overflow-hidden">
          <div className="flex animate-ticker whitespace-nowrap py-3 font-mono text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="px-8 flex items-center gap-8">
                <span className="h-1 w-1 rounded-full bg-accent-blue" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* WHAT */}
        <section id="what" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal><SectionLabel id="01">what we do</SectionLabel></Reveal>
            <div className="mt-8 grid md:grid-cols-12 gap-12">
              <Reveal delay={0.05} className="md:col-span-5">
                <h2 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
                  A living research environment <span className="text-accent-blue">that ships.</span>
                </h2>
              </Reveal>
              <div className="md:col-span-7 space-y-6 text-muted-foreground text-lg leading-relaxed">
                <Reveal delay={0.1}>
                  <p>
                    Most labs publish. Most startups iterate on shipped tech. The Bu1ld sits in
                    the seam between them. One community where frontier research and production
                    systems are built by the same people, in the same week, on the same call.
                  </p>
                </Reveal>
                <Reveal delay={0.15}>
                  <p>
                    We organize around <span className="text-bone">research threads</span>, not job
                    titles. A thread can begin as a paper read on Monday, a working prototype by
                    Friday, and a startup pitch within the quarter. Every project is held to two
                    standards at once: scientific honesty and engineering rigor.
                  </p>
                </Reveal>
                <Reveal delay={0.2}>
                  <p>
                    The goal is simple. A community of ML driven people of every age who can find,
                    build, and scale ML products together. Collaborators include researchers from
                    Stanford NLP, the MIT CSAIL groups we work with, and a UC physics PhD on the
                    core team.
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* RESEARCH */}
        <section id="research" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between flex-wrap gap-6">
              <Reveal>
                <SectionLabel id="02">research areas</SectionLabel>
                <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">
                  Threads we are pulling on.
                </h2>
              </Reveal>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                {RESEARCH.length} active
              </p>
            </div>

            <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {RESEARCH.map((r, idx) => (
                <motion.article
                  key={r.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: (idx % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className={`group relative p-7 bg-card/60 backdrop-blur-md rounded-sm border border-border ${hoverGlow[r.color]} transition-all duration-500`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`font-mono text-[11px] tracking-[0.25em] uppercase ${textAccent[r.color]}`}>
                      {r.id} · {r.tag}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${dotAccent[r.color]} animate-pulse-soft`} />
                  </div>
                  <h3 className="font-display text-2xl mt-6 text-bone leading-tight">{r.name}</h3>
                  <p className="mt-3 text-sm text-foreground/80 italic leading-relaxed">{r.one}</p>
                  <p className="mt-4 text-muted-foreground leading-relaxed text-[15px]">{r.desc}</p>
                  <div className="mt-6 h-px shimmer" />
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRAMS */}
        <section id="programs" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal>
              <SectionLabel id="03">programs</SectionLabel>
              <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">Three ways in.</h2>
            </Reveal>
            <div className="mt-14 grid md:grid-cols-3 gap-px bg-border/40 border border-border/40">
              {PROGRAMS.map((p, i) => (
                <motion.div
                  key={p.tag}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="bg-background/80 p-8 group hover:bg-card/60 transition relative overflow-hidden"
                >
                  <div className="flex items-baseline justify-between">
                    <span className={`font-mono text-[11px] tracking-[0.25em] uppercase ${textAccent[p.accent]}`}>{p.tag}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{p.time}</span>
                  </div>
                  <h3 className="font-display text-2xl mt-6 text-bone">{p.name}</h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed text-sm">{p.body}</p>
                  <div className="mt-8 h-px bg-gradient-to-r from-accent-blue/40 via-accent-violet/40 to-transparent" />
                  <a href="#contact" className="mt-6 inline-block font-mono text-[10px] tracking-[0.25em] uppercase text-bone hover:text-accent-blue transition">
                    Apply to track →
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* STARTUPS */}
        <section id="startups" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between flex-wrap gap-6">
              <Reveal>
                <SectionLabel id="04">startup projects</SectionLabel>
                <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">
                  Research becomes company.
                </h2>
              </Reveal>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                {STARTUPS.length} in flight
              </p>
            </div>

            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STARTUPS.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="p-6 border border-border bg-card/50 backdrop-blur-md rounded-sm hover:border-bone/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-block font-mono text-[10px] tracking-[0.25em] uppercase px-2 py-1 border rounded-sm ${stageColor[s.stage]}`}>
                      {s.stage}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">S-0{i + 1}</span>
                  </div>
                  <h3 className="font-display text-xl mt-5 text-bone">{s.name}</h3>
                  <p className="mt-2 text-xs font-mono text-muted-foreground uppercase tracking-[0.15em]">{s.domain}</p>
                  <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{s.thesis}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section id="team" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal>
              <SectionLabel id="05">team</SectionLabel>
              <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">
                Builders and researchers.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                A core of six on the inside, a community of about a hundred around it. New names rotate in every cohort.
              </p>
            </Reveal>
            <div className="mt-14 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {TEAM.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className={`p-5 border border-border bg-card/50 backdrop-blur-md rounded-sm ${hoverGlow[m.color]} transition`}
                >
                  <div className={`h-14 w-14 rounded-full grid place-items-center bg-gradient-to-br from-accent-blue/30 to-accent-violet/20 border border-accent-blue/40 font-display text-lg ${textAccent[m.color]}`}>
                    {m.initials}
                  </div>
                  <h3 className="mt-4 font-display text-base text-bone">{m.name}</h3>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground leading-relaxed">{m.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FOUNDER */}
        <section id="founder" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-6">
            <Reveal>
              <SectionLabel id="06">founder</SectionLabel>
            </Reveal>

            <div className="mt-10 grid md:grid-cols-12 gap-10 items-start">
              <Reveal delay={0.05} className="md:col-span-4">
                <div className="relative aspect-[4/5] w-full max-w-sm border border-border rounded-sm overflow-hidden bg-gradient-to-br from-accent-blue/15 via-accent-violet/10 to-accent-red/15">
                  <div className="absolute inset-0 grid-bg opacity-50" />
                  <div className="absolute inset-0 noise opacity-[0.08] mix-blend-overlay" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="font-display font-bold text-[8rem] leading-none text-bone/80 text-glow-bone">
                      RG
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                    <span>signal · live</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse-soft" />
                  </div>
                </div>
              </Reveal>

              <div className="md:col-span-8 space-y-6">
                <Reveal>
                  <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.02]">
                    Hi, I am <span className="text-accent-blue">{FOUNDER.name}</span>.
                  </h2>
                  <p className="mt-3 font-mono text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
                    {FOUNDER.role}
                  </p>
                </Reveal>

                <Reveal delay={0.05}>
                  <p className="text-xl md:text-2xl text-bone leading-snug max-w-2xl">
                    {FOUNDER.short}
                  </p>
                </Reveal>

                <div className="space-y-5 text-muted-foreground text-[17px] leading-relaxed max-w-2xl">
                  {FOUNDER.paras.map((p, i) => (
                    <Reveal key={i} delay={0.1 + i * 0.05}>
                      <p>{p}</p>
                    </Reveal>
                  ))}
                </div>

                <Reveal delay={0.3}>
                  <div className="mt-8 grid sm:grid-cols-2 gap-px bg-border/40 border border-border/40 max-w-2xl">
                    {FOUNDER.facts.map(([k, v]) => (
                      <div key={k} className="bg-background/80 p-5">
                        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                          {k}
                        </div>
                        <div className="mt-2 font-display text-bone">{v}</div>
                      </div>
                    ))}
                  </div>
                </Reveal>

                <Reveal delay={0.35}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href="mailto:ryan@thebu1ld.com"
                      className="inline-flex items-center gap-3 px-5 py-3 rounded-sm bg-bone text-background font-mono text-[11px] tracking-[0.25em] uppercase hover:bg-accent-blue transition glow-bone"
                    >
                      Email Ryan →
                    </a>
                    <a
                      href="https://discord.gg/NG4QYat4P"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 px-5 py-3 rounded-sm border border-bone/30 font-mono text-[11px] tracking-[0.25em] uppercase hover:bg-bone/5 transition"
                    >
                      Find me in Discord
                    </a>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* MANIFESTO */}
        <section id="manifesto" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal>
              <SectionLabel id="07">manifesto</SectionLabel>
              <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight max-w-3xl">
                Four lines we will not cross.
              </h2>
            </Reveal>
            <div className="mt-14 grid md:grid-cols-2 gap-px bg-border/40 border border-border/40">
              {MANIFESTO.map((m, i) => (
                <motion.div
                  key={m.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.07 }}
                  className="bg-background/80 p-8 hover:bg-card/60 transition"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-accent-blue">{m.n}</span>
                    <h3 className="font-display text-2xl md:text-3xl text-bone">{m.title}</h3>
                  </div>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{m.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* UPDATES */}
        <section id="updates" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between flex-wrap gap-6">
              <Reveal>
                <SectionLabel id="08">signal log</SectionLabel>
                <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">
                  Recent telemetry.
                </h2>
              </Reveal>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">live feed</p>
            </div>
            <div className="mt-14 relative">
              <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent-blue/40 to-transparent" />
              <ul className="space-y-10">
                {UPDATES.map((u, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.55, delay: i * 0.05 }}
                    className={`relative pl-10 md:pl-0 md:grid md:grid-cols-2 md:gap-12 ${i % 2 === 0 ? "" : "md:[&>div:first-child]:order-2"}`}
                  >
                    <span className="absolute left-2 md:left-1/2 top-2 -translate-x-1/2 h-3 w-3 rounded-full bg-accent-blue glow-blue" />
                    <div className="md:text-right md:pr-12">
                      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{u.date}</div>
                      <div className={`font-mono text-[10px] tracking-[0.25em] uppercase mt-1 ${
                        u.tag === "release" ? "text-accent-green" :
                        u.tag === "spinout" ? "text-accent-red" :
                        u.tag === "paper" ? "text-accent-blue" :
                        u.tag === "infra" ? "text-accent-amber" : "text-bone"
                      }`}>{u.tag}</div>
                    </div>
                    <div className="md:pl-12 mt-2 md:mt-0">
                      <p className="text-foreground/90 leading-relaxed">{u.text}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* VOICES */}
        <section id="voices" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal>
              <SectionLabel id="09">voices</SectionLabel>
              <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">From inside the lab.</h2>
            </Reveal>
            <div className="mt-14 grid md:grid-cols-3 gap-4">
              {VOICES.map((v, i) => (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="p-8 border border-border bg-card/50 backdrop-blur-md rounded-sm hover:border-bone/40 transition"
                >
                  <div className="font-display text-3xl text-accent-blue leading-none">&ldquo;</div>
                  <blockquote className="mt-3 text-foreground/90 leading-relaxed text-[15px]">
                    {v.quote}
                  </blockquote>
                  <figcaption className="mt-6 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                    {v.who}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative py-32 border-t border-border bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <SectionLabel id="10">faq</SectionLabel>
              <h2 className="font-display text-4xl md:text-5xl mt-4 tracking-tight">Frequently considered.</h2>
            </Reveal>
            <ul className="mt-14 divide-y divide-border border-y border-border">
              {FAQ.map((f, i) => {
                const open = openFaq === i;
                return (
                  <li key={i}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full py-7 flex items-center justify-between gap-6 text-left group"
                      aria-expanded={open}
                    >
                      <span className="flex items-baseline gap-5">
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-blue">
                          0{i + 1}
                        </span>
                        <span className="font-display text-xl md:text-2xl text-bone">{f.q}</span>
                      </span>
                      <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl text-bone/70 group-hover:text-bone"
                      >
                        +
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pb-8 pl-14 pr-10 max-w-3xl text-muted-foreground leading-relaxed">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="relative py-32 border-t border-border overflow-hidden">
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <Reveal>
              <SectionLabel id="11">contact</SectionLabel>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display text-5xl md:text-7xl mt-6 tracking-tight leading-[1]">
                Build with <Wordmark />.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl mx-auto text-muted-foreground">
                Researchers, engineers, founders of any age. If you want your work to compound, come in.
              </p>
            </Reveal>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <a
                href="https://discord.gg/NG4QYat4P"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-sm bg-bone text-background font-mono text-xs tracking-[0.3em] uppercase hover:bg-accent-blue transition glow-bone"
              >
                Join the discord <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href="mailto:ryan@thebu1ld.com"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-sm border border-bone/30 font-mono text-xs tracking-[0.3em] uppercase hover:bg-bone/5 transition"
              >
                Email Ryan
              </a>
            </div>

            <div className="mt-20 grid sm:grid-cols-3 gap-px bg-border/40 border border-border/40 text-left backdrop-blur-sm">
              <div className="bg-background/80 p-6">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Discord</div>
                <a href="https://discord.gg/NG4QYat4P" className="mt-2 block font-display text-bone hover:text-accent-blue transition break-all">
                  discord.gg/NG4QYat4P
                </a>
              </div>
              <div className="bg-background/80 p-6">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Lead contact</div>
                <div className="mt-2 font-display text-bone">Ryan Gomez</div>
                <div className="text-xs text-muted-foreground mt-1">Founder, Research and Systems</div>
              </div>
              <div className="bg-background/80 p-6">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Located</div>
                <div className="mt-2 font-display text-bone">Distributed</div>
                <div className="text-xs text-muted-foreground mt-1">Stanford, MIT, UC, Online</div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative border-t border-border py-12 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 grid gap-8 md:grid-cols-3 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            <div className="space-y-3">
              <div className="text-bone"><Wordmark /></div>
              <div>© 2026 the bu1ld, all systems nominal</div>
            </div>
            <div className="space-y-2">
              <div className="text-bone/70">navigate</div>
              <div className="grid grid-cols-2 gap-y-1 gap-x-6">
                <a href="#research" className="hover:text-bone transition">Research</a>
                <a href="#programs" className="hover:text-bone transition">Programs</a>
                <a href="#startups" className="hover:text-bone transition">Startups</a>
                <a href="#founder" className="hover:text-bone transition">Founder</a>
                <a href="#manifesto" className="hover:text-bone transition">Manifesto</a>
                <a href="#updates" className="hover:text-bone transition">Updates</a>
                <a href="#faq" className="hover:text-bone transition">FAQ</a>
              </div>
            </div>
            <div className="space-y-2 md:text-right">
              <div className="text-bone/70">signal</div>
              <div className="flex md:justify-end items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse-soft" />
                live, cohort 04 in flight
              </div>
              <div>
                <a href="https://discord.gg/NG4QYat4P" className="hover:text-bone transition">discord</a>
                {" · "}
                <a href="mailto:ryan@thebu1ld.com" className="hover:text-bone transition">email</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
