import { useEffect, useRef, useState } from "react";

/**
 * Cinematic intro: particles converge into the BU1LD wordmark, then fade out
 * and unlock the page. This version is smoother, safer to clean up, and more
 * responsive on high-DPI screens.
 */
export function GenesisIntro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);

  const [phase, setPhase] = useState<"running" | "fading" | "done">("running");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    let raf = 0;
    let timeoutId: number | undefined;
    let alive = true;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const palette = ["#F2EBDD", "#E2473D", "#3FAE5E", "#3DB1E2"];

    type Particle = {
      x: number;
      y: number;
      tx: number;
      ty: number;
      vx: number;
      vy: number;
      r: number;
      c: string;
      born: number;
      swirl: number;
      drift: number;
    };

    let particles: Particle[] = [];

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, n));
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const fit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.min(window.innerWidth, 2560);
      h = Math.min(window.innerHeight, 1440);

      const nextW = Math.floor(w * dpr);
      const nextH = Math.floor(h * dpr);

      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }

      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };

    const sampleTargets = () => {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;

      const o = off.getContext("2d");
      if (!o) return [] as { x: number; y: number }[];

      o.clearRect(0, 0, w, h);
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";

      const fontSize = Math.min(w * 0.22, 320);
      o.font = `800 ${fontSize}px "Familjen Grotesk", system-ui, sans-serif`;
      o.fillText("BU1LD", w / 2, h / 2);

      const data = o.getImageData(0, 0, w, h).data;
      const points: { x: number; y: number }[] = [];

      const step = Math.max(4, Math.floor(fontSize / 58));
      const xPad = Math.floor(w * 0.16);
      const yPad = Math.floor(h * 0.18);

      for (let y = yPad; y < h - yPad; y += step) {
        for (let x = xPad; x < w - xPad; x += step) {
          const alpha = data[(y * w + x) * 4 + 3];
          if (alpha > 128) points.push({ x, y });
        }
      }

      return points;
    };

    const letterColor = (x: number) => {
      const band = clamp(Math.floor(((x / w) * 5) % 5), 0, 4);
      return ["#F2EBDD", "#E2473D", "#3FAE5E", "#3DB1E2", "#F2EBDD"][band];
    };

    const buildParticles = () => {
      const targets = sampleTargets();
      if (!targets.length) return [];

      const count = Math.min(targets.length, reduceMotion ? 500 : 1400);
      const out: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const t = targets[Math.floor(Math.random() * targets.length)];

        out.push({
          x: Math.random() * w,
          y: Math.random() * h,
          tx: t.x,
          ty: t.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          r: Math.random() * 1.35 + 0.55,
          c: Math.random() < 0.45 ? letterColor(t.x) : palette[Math.floor(Math.random() * palette.length)],
          born: Math.random() * (reduceMotion ? 120 : 420),
          swirl: (Math.random() - 0.5) * 0.18,
          drift: 0.96 + Math.random() * 0.04,
        });
      }

      return out;
    };

    const drawBackground = (t: number, k: number) => {
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      grad.addColorStop(0, `rgba(20, 20, 24, ${0.8 - k * 0.25})`);
      grad.addColorStop(0.45, `rgba(7, 7, 9, ${0.86 - k * 0.18})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0.98)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // subtle scan glow
      ctx.save();
      ctx.globalAlpha = 0.12 + k * 0.08;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(61, 177, 226, 0.06)";
      const pulse = 0.5 + 0.5 * Math.sin(t / 800);
      ctx.fillRect(0, h * (0.4 + pulse * 0.02), w, 1);
      ctx.restore();
    };

    const drawParticles = (t: number, k: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const p of particles) {
        if (t < p.born) continue;

        const age = t - p.born;
        const pull = 0.015 + k * 0.16;
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy) || 1;

        // spring towards target + slight swirl for the "swarm" feeling
        const ax = dx * pull + (-dy / dist) * p.swirl * (1 + k * 2.5);
        const ay = dy * pull + (dx / dist) * p.swirl * (1 + k * 2.5);

        p.vx = (p.vx + ax) * p.drift;
        p.vy = (p.vy + ay) * p.drift;

        // gentle chaos early, precision late
        const chaos = (1 - k) * 0.8;
        p.vx += Math.sin(age * 0.01 + p.tx * 0.002) * chaos * 0.02;
        p.vy += Math.cos(age * 0.01 + p.ty * 0.002) * chaos * 0.02;

        p.x += p.vx;
        p.y += p.vy;

        const settle = clamp(1 - dist / 120, 0, 1);
        const alpha = 0.2 + settle * 0.72;
        const radius = p.r + (1 - k) * 0.55 + settle * 0.3;

        // main dot
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // glow when close
        if (dist < 48) {
          ctx.globalAlpha = 0.08 + settle * 0.14;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const drawWordmarkGlow = (k: number) => {
      const a = clamp((k - 0.45) / 0.5, 0, 1);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = a * 0.22;

      const x = w * 0.5;
      const y = h * 0.5;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * 0.24);
      grad.addColorStop(0, "rgba(242, 235, 221, 0.8)");
      grad.addColorStop(0.35, "rgba(61, 177, 226, 0.35)");
      grad.addColorStop(0.65, "rgba(63, 174, 94, 0.18)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    fit();
    particles = buildParticles();

    if (!particles.length) {
      onDone();
      return;
    }

    const DURATION = reduceMotion ? 700 : 3200;
    const FADE_DELAY = reduceMotion ? 120 : 520;
    const FADE_TIME = reduceMotion ? 300 : 900;

    const tick = (now: number) => {
      if (!alive) return;

      const elapsed = now - start;
      const k = easeOutCubic(clamp(elapsed / DURATION, 0, 1));

      drawBackground(elapsed, k);
      drawWordmarkGlow(k);
      drawParticles(elapsed, k);

      if (elapsed < DURATION + FADE_DELAY) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (phase !== "fading") setPhase("fading");

      timeoutId = window.setTimeout(() => {
        if (!alive || doneRef.current) return;
        doneRef.current = true;
        setPhase("done");
        onDone();
      }, FADE_TIME);
    };

    const onResize = () => {
      fit();
      particles = buildParticles();
    };

    const start = performance.now();

    window.addEventListener("resize", onResize, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted, onDone, phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-700 ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <canvas ref={ref} className="absolute inset-0 block" />

      <div className="absolute inset-x-0 bottom-8 text-center font-mono text-[10px] tracking-[0.35em] text-bone/40 uppercase">
        initializing — the bu1ld
      </div>
    </div>
  );
}
