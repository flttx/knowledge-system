"use client";

import { useEffect, useRef } from "react";

interface DustNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const MONOLITH_DUST_PALETTE = ["#ffffff", "#cbd5e1", "#94a3b8", "#fef08a", "#e2e8f0"];

export function InkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000, isDown: false };
    const dusts: DustNode[] = [];
    const pulses: PulseWave[] = [];

    const DUST_COUNT = Math.min(48, Math.floor((width * height) / 32000));

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", handleResize);

    // Initialize atmospheric dust particles floating in the megastructure void
    for (let i = 0; i < DUST_COUNT; i += 1) {
      const color = MONOLITH_DUST_PALETTE[Math.floor(Math.random() * MONOLITH_DUST_PALETTE.length)];
      const baseRadius = Math.random() * 1.2 + 0.6;
      dusts.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15 - 0.05, // Slow upward atmospheric drift
        radius: baseRadius,
        baseRadius,
        color,
        alpha: Math.random() * 0.35 + 0.1,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    function addPulse(x: number, y: number) {
      pulses.push({
        x,
        y,
        radius: 2,
        maxRadius: Math.random() * 60 + 40,
        alpha: 0.45,
      });
    }

    function handlePointerMove(e: PointerEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function handlePointerDown(e: PointerEvent) {
      mouse.isDown = true;
      addPulse(e.clientX, e.clientY);
    }

    function handlePointerUp() {
      mouse.isDown = false;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Render & Update expanding resonance pulses
      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pulse = pulses[i];
        pulse.radius += 1.2;
        pulse.alpha -= 0.012;

        if (pulse.alpha <= 0 || pulse.radius >= pulse.maxRadius) {
          pulses.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(254, 240, 138, ${pulse.alpha * 0.4})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
        ctx.restore();
      }

      // Update & Draw Dust Particles
      for (let i = 0; i < dusts.length; i += 1) {
        const p = dusts[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle mouse proximity drift
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          p.x -= (dx / dist) * force * 0.4;
          p.y -= (dy / dist) * force * 0.4;
        }

        p.twinklePhase += p.twinkleSpeed;
        const dynamicAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.twinklePhase));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, dynamicAlpha);
        ctx.fill();
        ctx.restore();

        // Very faint relation line between nearby dust nodes
        for (let j = i + 1; j < dusts.length; j += 1) {
          const p2 = dusts[j];
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 70) {
            const lineAlpha = (1 - d / 70) * 0.06;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 0.4;
            ctx.globalAlpha = lineAlpha;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[3] h-full w-full opacity-60"
      aria-hidden="true"
    />
  );
}
