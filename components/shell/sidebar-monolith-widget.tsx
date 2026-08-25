"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GraphIcon, ShieldIcon } from "@/components/icons";

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
}

export function SidebarMonolithWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulseCount, setPulseCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Rotation, interaction, and momentum state
  const rotStateRef = useRef({
    angleX: 0.3,
    angleY: 0.5,
    angleZ: 0.1,
    velX: 0.005,
    velY: 0.01,
    isDragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
    burstStars: [] as StarParticle[],
    time: 0,
    pulseEnergy: 0,
    hoverScale: 1,
    targetHoverScale: 1,
  });

  // Spawn starburst particles on interaction
  const triggerBurst = (cx: number, cy: number, count = 6) => {
    const stars: StarParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = 0.9 + Math.random() * 1.8;
      stars.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3.5,
        alpha: 1,
        decay: 0.018 + Math.random() * 0.015,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
      });
    }
    rotStateRef.current.burstStars.push(...stars);
    rotStateRef.current.pulseEnergy = 1.0;
    setPulseCount((prev) => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      if (width === 0 || height === 0) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // 3D Polyhedron vertices (Icosahedron Geometry)
    const baseRadius = 25;
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const a = baseRadius / Math.sqrt(1 + phi * phi);
    const b = a * phi;

    const vertices = [
      { x: -a, y: b, z: 0 },
      { x: a, y: b, z: 0 },
      { x: -a, y: -b, z: 0 },
      { x: a, y: -b, z: 0 },
      { x: 0, y: -a, z: b },
      { x: 0, y: a, z: b },
      { x: 0, y: -a, z: -b },
      { x: 0, y: a, z: -b },
      { x: b, y: 0, z: -a },
      { x: b, y: 0, z: a },
      { x: -b, y: 0, z: -a },
      { x: -b, y: 0, z: a },
    ];

    const edges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [1, 9], [1, 8], [1, 7],
      [2, 11], [2, 10], [2, 6], [2, 3], [2, 4],
      [3, 9], [3, 4], [3, 8], [3, 6],
      [4, 5], [4, 9], [4, 11],
      [5, 9], [5, 11],
      [6, 7], [6, 8], [6, 10],
      [7, 8], [7, 10],
      [8, 9],
      [10, 11],
    ];

    // Helper: Draw 4-pointed Star Glyph
    function drawFourPointStar(
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      outerR: number,
      innerR: number,
      angle = 0
    ) {
      context.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const currAngle = angle + (i * Math.PI) / 4;
        const x = cx + Math.cos(currAngle) * r;
        const y = cy + Math.sin(currAngle) * r;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
    }

    function render() {
      if (!ctx || width === 0 || height === 0) return;

      const state = rotStateRef.current;
      state.time += 1;

      // Smooth hover scale interpolation
      state.hoverScale += (state.targetHoverScale - state.hoverScale) * 0.1;

      // Apply inertia & auto-rotation
      if (!state.isDragging) {
        state.angleX += state.velX;
        state.angleY += state.velY;
        state.angleZ += 0.002;
        // Natural rotational damping back to orbital baseline
        state.velX += (0.004 - state.velX) * 0.04;
        state.velY += (0.008 - state.velY) * 0.04;
      }

      // Decay pulse energy
      state.pulseEnergy *= 0.94;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Draw Perfect Concentric Celestial Circles (精准正圆)
      const baseBreath = Math.sin(state.time * 0.04) * 2.5;
      const pulseExpand = state.pulseEnergy * 7;
      const outerRadius = (38 + baseBreath + pulseExpand) * state.hoverScale;
      const innerRadius = (28 + baseBreath * 0.5) * state.hoverScale;

      // Outer Halo Ring
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(184, 142, 62, ${0.15 + state.pulseEnergy * 0.25})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Middle Orbit Dash Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
      ctx.setLineDash([3, 4]);
      ctx.lineDashOffset = -state.time * 0.35;
      ctx.strokeStyle = `rgba(184, 142, 62, ${0.22 + state.pulseEnergy * 0.2})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();

      // 2. Project and rotate 3D vertices
      const radX = state.angleX;
      const radY = state.angleY;
      const radZ = state.angleZ;

      const projected = vertices.map((v) => {
        // Rotate Y
        const x1 = v.x * Math.cos(radY) + v.z * Math.sin(radY);
        const y1 = v.y;
        const z1 = -v.x * Math.sin(radY) + v.z * Math.cos(radY);

        // Rotate X
        const x2 = x1;
        const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
        const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

        // Rotate Z
        const x3 = x2 * Math.cos(radZ) - y2 * Math.sin(radZ);
        const y3 = x2 * Math.sin(radZ) + y2 * Math.cos(radZ);
        const z3 = z2;

        const fov = 130;
        const pScale = (fov / (fov + z3 + 35)) * state.hoverScale;

        return {
          x: cx + x3 * pScale,
          y: cy + y3 * pScale,
          z: z3,
          pScale,
        };
      });

      // 3. Draw 3D Edges
      edges.forEach(([i1, i2]) => {
        const p1 = projected[i1];
        const p2 = projected[i2];
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.12, Math.min(0.88, (avgZ + 28) / 56));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(184, 142, 62, ${alpha * (0.65 + state.pulseEnergy * 0.35)})`;
        ctx.lineWidth = state.isDragging ? 1.0 : 0.75;
        ctx.stroke();
      });

      // 4. Draw Core Pulsing Star in Center of Polyhedron
      const starScale = (1 + Math.sin(state.time * 0.08) * 0.25 + state.pulseEnergy * 0.9) * state.hoverScale;
      const coreStarOuter = 8.5 * starScale;
      const coreStarInner = 2.4 * starScale;

      ctx.save();
      // Outer Star Glow Aura
      const glowGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, coreStarOuter * 2.4);
      glowGrad.addColorStop(0, "rgba(245, 215, 138, 0.55)");
      glowGrad.addColorStop(0.5, "rgba(201, 168, 93, 0.2)");
      glowGrad.addColorStop(1, "rgba(201, 168, 93, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreStarOuter * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Primary 4-pointed Star
      drawFourPointStar(ctx, cx, cy, coreStarOuter, coreStarInner, state.time * 0.025 + state.angleY * 0.5);
      ctx.fillStyle = "#fef08a";
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 10;
      ctx.fill();

      // Secondary Cross Star Sparkle
      drawFourPointStar(ctx, cx, cy, coreStarOuter * 0.65, coreStarInner * 0.5, -state.time * 0.035 + Math.PI / 4);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();

      // 5. Draw Vertex Sparkles
      projected.forEach((p) => {
        const glow = Math.max(0.2, (p.z + 28) / 56);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.0 * p.pScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(217, 185, 108, ${glow * 0.95})`;
        ctx.shadowColor = "#c9a85d";
        ctx.shadowBlur = 4;
        ctx.fill();
      });

      // 6. Draw Interactive Starburst Particles (拖拽/点击发散星芒)
      for (let i = state.burstStars.length - 1; i >= 0; i--) {
        const star = state.burstStars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.alpha -= star.decay;
        star.rotation += star.rotationSpeed;

        if (star.alpha <= 0) {
          state.burstStars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = star.alpha;
        drawFourPointStar(ctx, star.x, star.y, star.size, star.size * 0.3, star.rotation);
        ctx.fillStyle = "#fef08a";
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Pointer Event handlers with pointer capture for flawless dragging
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Prevent default touch scrolling / text selection
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    const state = rotStateRef.current;
    state.isDragging = true;
    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;
    state.targetHoverScale = 1.08;
    setIsDragging(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      triggerBurst(e.clientX - rect.left, e.clientY - rect.top, 6);
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = rotStateRef.current;
    if (!state.isDragging) return;

    e.preventDefault();

    const dx = e.clientX - state.lastPointerX;
    const dy = e.clientY - state.lastPointerY;

    // Apply rotation based on movement
    state.angleY += dx * 0.016;
    state.angleX -= dy * 0.016;
    state.velY = dx * 0.009;
    state.velX = -dy * 0.009;

    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;

    // Spawn trail particles while moving
    if (Math.hypot(dx, dy) > 2 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      triggerBurst(e.clientX - rect.left, e.clientY - rect.top, 1);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    const state = rotStateRef.current;
    state.isDragging = false;
    state.targetHoverScale = 1.0;
    setIsDragging(false);
  };

  const handlePointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    handlePointerUp(e);
  };

  const handleMouseEnter = () => {
    rotStateRef.current.targetHoverScale = 1.05;
  };

  const handleMouseLeave = () => {
    if (!rotStateRef.current.isDragging) {
      rotStateRef.current.targetHoverScale = 1.0;
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative my-auto mt-4 overflow-hidden rounded-xl border bg-[var(--surface)]/70 p-3 shadow-2xs transition-all select-none font-sans touch-none ${
        isDragging
          ? "cursor-grabbing border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/30 scale-[1.01]"
          : "cursor-grab border-[var(--sidebar-border)] hover:border-[var(--accent)] hover:shadow-xs"
      }`}
      title="按住鼠标左键即可拖动旋转 3D 拓扑星晶"
    >
      {/* Background Micro Glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[var(--accent)]/10 blur-xl group-hover:bg-[var(--accent)]/20 transition-all" />

      {/* Top Header Label */}
      <div className="flex items-center justify-between pointer-events-none">
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-[var(--ink-muted)]">
          <GraphIcon size={11} className="text-[var(--accent)]" />
          <span>知识拓扑晶格</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[var(--accent-strong)]">
          <span className={`size-1.5 rounded-full bg-[var(--accent)] ${isDragging ? "scale-125" : "animate-pulse"}`} />
          <span>{isDragging ? "正在旋转" : "按住拖拽"}</span>
        </span>
      </div>

      {/* 3D Geometry Canvas Container */}
      <div
        ref={containerRef}
        className="relative my-1.5 flex h-24 w-full items-center justify-center overflow-hidden pointer-events-none"
      >
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Footer Status Indicators */}
      <div className="border-t border-[var(--line)] pt-2 flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)] pointer-events-none">
        <span className="flex items-center gap-1">
          <ShieldIcon size={10} className="text-[var(--accent-strong)]" />
          <span>私有沉淀</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] text-[var(--accent-strong)] font-medium">
          <span className={`text-[#c9a85d] text-[10px] ${isDragging ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }}>✦</span>
          <span>{pulseCount > 0 ? `星轨脉动 ×${pulseCount}` : "恒星共鸣"}</span>
        </span>
      </div>
    </div>
  );
}
