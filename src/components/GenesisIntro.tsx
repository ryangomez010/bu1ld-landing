import { useEffect, useRef, useState } from "react";

/**
 * Cinematic intro: a swarm of digital dots converges from chaos and resolves
 * into the BU1LD wordmark, then fades out and unlocks the page.
 */
export function GenesisIntro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"running" | "fading" | "done">("running");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth,
      h = window.innerHeight;
    const fit = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    // Sample target points from the text "BU1LD"
    const sample = () => {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d")!;
      o.fillStyle = "#fff";
      const fs = Math.min(w * 0.22, 320);
      o.font = `800 ${fs}px "Familjen Grotesk", system-ui, sans-serif`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillText("BU1LD", w / 2, h / 2);
      const data = o.getImageData(0, 0, w, h).data;
      const pts: { x: number; y: number }[] = [];
      const step = Math.max(4, Math.floor(fs / 60));
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4 + 3;
          if (data[i] > 128) pts.push({ x, y });
        }
      }
      return pts;
    };

    const targets = sample();
    const colors = ["#F2EBDD", "#E2473D", "#3FAE5E", "#3DB1E2"];
    // Color assignment by letter band: B U 1 L D
    const letterColor = (x: number) => {
      const t = (x - w / 2) / (w * 0.22);
      // approximate band index 0..4
      const idx = Math.floor((t + 0.5) * 5);
      const map = ["#F2EBDD", "#E2473D", "#3FAE5E", "#3DB1E2", "#F2EBDD"];
      return map[Math.max(0, Math.min(4, idx))];
    };

    type P = {
      x: number;
      y: number;
      tx: number;
      ty: number;
      vx: number;
      vy: number;
      c: string;
      r: number;
      born: number;
    };
    const N = Math.min(targets.length, 1400);
    const particles: P[] = [];
    for (let i = 0; i < N; i++) {
      const t = targets[Math.floor(Math.random() * targets.length)];
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: t.x,
        ty: t.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        c:
          Math.random() < 0.4
            ? letterColor(t.x)
            : colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * 1.4 + 0.6,
        born: Math.random() * 400,
      });
    }

    const start = performance.now();
    let raf = 0;
    const DURATION = reduce ? 600 : 3200;

    const tick = (now: number) => {
      const t = now - start;
      const k = Math.min(1, t / DURATION);
      // ease
      const e = 1 - Math.pow(1 - k, 3);

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const alive = t > p.born;
        if (!alive) continue;
        const ax = (p.tx - p.x) * (0.02 + e * 0.18);
        const ay = (p.ty - p.y) * (0.02 + e * 0.18);
        p.vx = (p.vx + ax) * 0.86;
        p.vy = (p.vy + ay) * 0.86;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + (1 - e) * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // glow once close
        const d = Math.hypot(p.x - p.tx, p.y - p.ty);
        if (d < 30) {
          ctx.globalAlpha = 0.18;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (t < DURATION + 600) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("fading");
        setTimeout(() => {
          setPhase("done");
          onDone();
        }, 900);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [onDone]);

  if (phase === "done") return null;
  return (
    <div
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-700 ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <canvas ref={ref} className="absolute inset-0" aria-hidden />
      <button
        type="button"
        onClick={() => {
          setPhase("fading");
          setTimeout(() => {
            setPhase("done");
            onDone();
          }, 400);
        }}
        className="absolute top-6 right-6 z-10 font-mono text-[10px] tracking-[0.28em] uppercase text-bone/50 hover:text-bone transition px-3 py-2 border border-bone/20 rounded-sm"
      >
        Skip intro
      </button>
      <div className="absolute bottom-8 left-0 right-0 text-center font-mono text-[10px] tracking-[0.3em] text-bone/40 uppercase">
        initializing — the bu1ld
      </div>
    </div>
  );
}
