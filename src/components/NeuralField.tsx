import { useEffect, useRef } from "react";

/**
 * Cinematic flow-field neural background.
 * Particles drift along a slowly evolving curl-noise field, leaving faint
 * trails. Nearby particles link with color-mixed arcs. A few bright "spark"
 * nodes pulse and bloom. Mouse acts as a soft repulsor.
 */
export function NeuralField({
  density = 140,
  className = "",
  fixed = false,
}: {
  density?: number;
  className?: string;
  fixed?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let mounted = true;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;

    const resize = () => {
      if (!mounted || !canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();

      // Prevent invalid canvas dimensions
      if (rect.width === 0 || rect.height === 0) return;

      w = rect.width;
      h = rect.height;

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const ro = new ResizeObserver(() => {
      try {
        resize();
      } catch (err) {
        console.error("ResizeObserver error:", err);
      }
    });

    ro.observe(canvas);

    // Pseudo curl-noise via layered sin fields. Cheap and smooth.
    const flow = (x: number, y: number, t: number) => {
      const s = 0.0024;

      const a =
        Math.sin(x * s + t * 0.0003) +
        Math.cos(y * s * 1.3 - t * 0.00022) +
        Math.sin((x + y) * s * 0.7 + t * 0.00041);

      return a * Math.PI;
    };

    const palette = [
      { c: "#F2EBDD", w: 0.45 },
      { c: "#3DB1E2", w: 0.25 },
      { c: "#3FAE5E", w: 0.18 },
      { c: "#E2473D", w: 0.12 },
    ];

    const pickColor = () => {
      const r = Math.random();

      let acc = 0;

      for (const p of palette) {
        acc += p.w;
        if (r < acc) return p.c;
      }

      return palette[0].c;
    };

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      c: string;
      r: number;
      spark: boolean;
      phase: number;
    };

    const N = Math.max(10, density);

    const particles: P[] = Array.from({ length: N }, () => ({
      x: Math.random() * Math.max(w, 1),
      y: Math.random() * Math.max(h, 1),
      vx: 0,
      vy: 0,
      c: pickColor(),
      r: Math.random() * 1.2 + 0.5,
      spark: Math.random() < 0.06,
      phase: Math.random() * Math.PI * 2,
    }));

    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
    };

    const onMove = (e: MouseEvent) => {
      if (!mounted || !canvas) return;

      const rect = canvas.getBoundingClientRect();

      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("mousemove", onMove, {
      passive: true,
    });

    window.addEventListener("mouseleave", onLeave, {
      passive: true,
    });

    let raf = 0;
    const t0 = performance.now();

    const tick = (now: number) => {
      if (!mounted || !ctx || !canvas) return;

      const t = now - t0;

      try {
        // Trail fade
        ctx.fillStyle = "rgba(0,0,0,0.14)";
        ctx.fillRect(0, 0, w, h);

        // Vignette
        const g = ctx.createRadialGradient(
          w / 2,
          h / 2,
          0,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.75
        );

        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,0.55)");

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // Update + draw particles
        ctx.globalCompositeOperation = "lighter";

        for (const p of particles) {
          const ang = flow(p.x, p.y, t);

          const speed = p.spark ? 1.4 : 0.85;

          p.vx = p.vx * 0.92 + Math.cos(ang) * speed * 0.35;
          p.vy = p.vy * 0.92 + Math.sin(ang) * speed * 0.35;

          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;

            const dm = Math.hypot(dx, dy);

            if (dm < 180 && dm > 0.01) {
              const f = (1 - dm / 180) * 1.6;

              p.vx += (dx / dm) * f;
              p.vy += (dy / dm) * f;
            }
          }

          p.x += p.vx;
          p.y += p.vy;

          // Wrap
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;

          const pulse = 0.6 + 0.4 * Math.sin(t * 0.002 + p.phase);

          const r = p.r * (p.spark ? 1.6 : 1);

          // Core dot
          ctx.fillStyle = p.c;
          ctx.globalAlpha = 0.9 * pulse;

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Glow halo
          ctx.globalAlpha = (p.spark ? 0.35 : 0.18) * pulse;

          ctx.beginPath();
          ctx.arc(
            p.x,
            p.y,
            r * (p.spark ? 10 : 6),
            0,
            Math.PI * 2
          );

          ctx.fill();
        }

        // Links
        ctx.lineWidth = 0.6;

        const STEP = N > 120 ? 2 : 1;

        for (let i = 0; i < N; i += STEP) {
          const a = particles[i];

          for (let j = i + 1; j < N; j += STEP) {
            const b = particles[j];

            const dx = a.x - b.x;
            const dy = a.y - b.y;

            const d2 = dx * dx + dy * dy;

            if (d2 < 130 * 130) {
              const d = Math.sqrt(d2);

              const alpha = (1 - d / 130) * 0.22;

              ctx.strokeStyle =
                a.c === b.c
                  ? `${a.c}${Math.floor(alpha * 255)
                      .toString(16)
                      .padStart(2, "0")}`
                  : `rgba(242,235,221,${alpha * 0.7})`;

              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      } catch (err) {
        console.error("NeuralField render error:", err);
      }

      if (!reduce && mounted) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      mounted = false;

      cancelAnimationFrame(raf);

      ro.disconnect();

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      className={`${
        fixed ? "fixed" : "absolute"
      } inset-0 h-full w-full pointer-events-none ${className}`}
      aria-hidden
    />
  );
}
