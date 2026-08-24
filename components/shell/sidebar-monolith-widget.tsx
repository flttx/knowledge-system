"use client";

import { useEffect, useRef, useState } from "react";
import { GraphIcon, ShieldIcon } from "@/components/icons";

export function SidebarMonolithWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angleX = 0;
    let angleY = 0;
    let angleZ = 0;

    const scale = 2;
    const width = 160;
    const height = 100;
    canvas.width = width * scale;
    canvas.height = height * scale;

    // 3D Octahedron vertices
    const vertices = [
      { x: 0, y: -26, z: 0 },
      { x: 22, y: 0, z: 0 },
      { x: 0, y: 0, z: 22 },
      { x: -22, y: 0, z: 0 },
      { x: 0, y: 0, z: -22 },
      { x: 0, y: 26, z: 0 },
    ];

    // Edges
    const edges = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [5, 1], [5, 2], [5, 3], [5, 4],
      [1, 2], [2, 3], [3, 4], [4, 1],
    ];

    let time = 0;

    function render() {
      if (!ctx || !canvas) return;

      time += 1;
      angleX += 0.008;
      angleY += 0.012;
      angleZ += 0.005;

      ctx.save();
      ctx.scale(scale, scale);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 2;

      // Project and rotate vertices
      const radX = angleX;
      const radY = angleY;
      const radZ = angleZ;

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

        const fov = 120;
        const pScale = fov / (fov + z3 + 40);

        return {
          x: cx + x3 * pScale,
          y: cy + y3 * pScale,
          z: z3,
          pScale,
        };
      });

      // Draw subtle orbital halo
      const breath = Math.sin(time * 0.03) * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 28 + breath, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(184, 142, 62, 0.12)";
      ctx.lineWidth = 0.75;
      ctx.stroke();

      // Draw 3D wireframe edges
      edges.forEach(([i1, i2]) => {
        const p1 = projected[i1];
        const p2 = projected[i2];
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.15, Math.min(0.85, (avgZ + 30) / 60));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(184, 142, 62, ${alpha * 0.7})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Draw node apexes (Golden Sparkles)
      projected.forEach((p) => {
        const glow = Math.max(0.2, (p.z + 30) / 60);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8 * p.pScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 93, ${glow})`;
        ctx.shadowColor = "#c9a85d";
        ctx.shadowBlur = 3;
        ctx.fill();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      onClick={() => setPulseCount((prev) => prev + 1)}
      className="group relative my-auto mt-4 overflow-hidden rounded-xl border border-[var(--sidebar-border)] bg-[var(--surface)]/70 p-3 shadow-2xs transition-all hover:border-[var(--accent)] hover:shadow-xs cursor-pointer select-none font-sans"
    >
      {/* Background Micro Glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-[var(--accent)]/10 blur-xl group-hover:bg-[var(--accent)]/20 transition-all" />

      {/* Top Header Label */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-wider text-[var(--ink-muted)]">
          <GraphIcon size={11} className="text-[var(--accent)]" />
          <span>知识拓扑晶格</span>
        </span>
        <span className="flex size-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
      </div>

      {/* 3D Geometry Canvas */}
      <div className="relative my-1 flex h-20 items-center justify-center">
        <canvas ref={canvasRef} className="size-full" />
      </div>

      {/* Footer Status Indicators */}
      <div className="border-t border-[var(--line)] pt-2 flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)]">
        <span className="flex items-center gap-1">
          <ShieldIcon size={10} className="text-[var(--accent-strong)]" />
          <span>私有沉淀</span>
        </span>
        <span className="text-[9px] text-[var(--accent-strong)] font-semibold">
          {pulseCount > 0 ? `✦ 脉动 ×${pulseCount}` : "● 稳态运行"}
        </span>
      </div>
    </div>
  );
}
