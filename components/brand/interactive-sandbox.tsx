"use client";

import { useEffect, useRef, useState } from "react";
import { GraphIcon, NoteIcon, ShieldIcon } from "@/components/icons";

interface TopologyNode {
  id: string;
  label: string;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  tier: "root" | "primary" | "secondary" | "ambient";
  floatSpeedX: number;
  floatSpeedY: number;
  floatPhase: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
  glowColor: string;
}

interface TopologyLink {
  sourceIdx: number;
  targetIdx: number;
  beamPos: number; // 0 to 1
  beamSpeed: number;
  beamLength: number;
  width: number;
  style: "solid" | "dashed" | "glow";
}

const PRESETS = [
  {
    id: "p1",
    tag: "阅读方法",
    title: "把读过的内容，整理成自己的笔记",
    excerpt: "先留下重要摘录，再用标签和双向链接补上上下文。回看时，相关想法会更容易被找到。",
    concepts: ["阅读方法", "卡片笔记", "双向链接", "原子化", "上下文", "持续回看"],
  },
  {
    id: "p2",
    tag: "长期思考",
    title: "让零散想法慢慢形成结构",
    excerpt: "一个想法不必一次写完。先把它放进收件箱，之后补充、修改，再和已有笔记建立联系。",
    concepts: ["长期思考", "收件箱", "回看", "补充", "关联", "持续整理"],
  },
  {
    id: "p3",
    tag: "专注阅读",
    title: "把注意力留给真正重要的内容",
    excerpt: "阅读时先专注于眼前的内容，把稍后要处理的片段记下来。整理和连接，留到合适的时候继续。",
    concepts: ["专注阅读", "摘录", "速记", "回看", "整理", "笔记"],
  },
];

export function InteractiveSandbox() {
  const [activeTab, setActiveTab] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPreset = PRESETS[activeTab];

  // 60FPS Ambient Floating & Luminescent Light Stream Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 340;
    const scale = 2; // HiDPI Retina
    canvas.width = width * scale;
    canvas.height = height * scale;

    const cx = width / 2;
    const cy = height / 2;

    // Build floating nodes
    const nodes: TopologyNode[] = [];

    // 1. Central Core Node (Root Note)
    nodes.push({
      id: "root",
      label: currentPreset.tag,
      baseX: cx,
      baseY: cy,
      x: cx,
      y: cy,
      radius: 17,
      tier: "root",
      floatSpeedX: 0.008,
      floatSpeedY: 0.012,
      floatPhase: 0,
      pulsePhase: 0,
      pulseSpeed: 0.02,
      color: "#ffffff",
      glowColor: "rgba(255, 255, 255, 0.4)",
    });

    // 2. Primary Wikilink Nodes (Warm Amber Glow)
    const primaryConcepts = currentPreset.concepts.slice(0, 3);
    primaryConcepts.forEach((label, i) => {
      const angle = (i / primaryConcepts.length) * Math.PI * 2 + 0.3;
      const dist = 85;
      const bx = cx + Math.cos(angle) * dist;
      const by = cy + Math.sin(angle) * dist;

      nodes.push({
        id: `pri_${i}`,
        label,
        baseX: bx,
        baseY: by,
        x: bx,
        y: by,
        radius: 11,
        tier: "primary",
        floatSpeedX: 0.015 + i * 0.004,
        floatSpeedY: 0.012 + i * 0.003,
        floatPhase: i * 1.8,
        pulsePhase: i * 2.1,
        pulseSpeed: 0.025,
        color: "#fef08a",
        glowColor: "rgba(254, 240, 138, 0.5)",
      });
    });

    // 3. Secondary Derived Nodes (Sub-cluster)
    const secondaryConcepts = currentPreset.concepts.slice(3);
    secondaryConcepts.forEach((label, i) => {
      const angle = (i / secondaryConcepts.length) * Math.PI * 2 + 0.9;
      const dist = 145;
      const bx = cx + Math.cos(angle) * dist;
      const by = cy + Math.sin(angle) * dist;

      nodes.push({
        id: `sec_${i}`,
        label,
        baseX: bx,
        baseY: by,
        x: bx,
        y: by,
        radius: 7,
        tier: "secondary",
        floatSpeedX: 0.01 + i * 0.005,
        floatSpeedY: 0.015 + i * 0.004,
        floatPhase: i * 2.5,
        pulsePhase: i * 1.5,
        pulseSpeed: 0.03,
        color: "#cbd5e1",
        glowColor: "rgba(203, 213, 225, 0.3)",
      });
    });

    // 4. Ambient Background Lattice Nodes
    const ambientCount = 8;
    for (let i = 0; i < ambientCount; i++) {
      const angle = (i / ambientCount) * Math.PI * 2 + 0.4;
      const dist = 185 + (i % 2) * 20;
      const bx = cx + Math.cos(angle) * dist;
      const by = cy + Math.sin(angle) * dist;

      nodes.push({
        id: `amb_${i}`,
        label: "",
        baseX: bx,
        baseY: by,
        x: bx,
        y: by,
        radius: 3.5,
        tier: "ambient",
        floatSpeedX: 0.006,
        floatSpeedY: 0.008,
        floatPhase: i * 0.9,
        pulsePhase: i * 0.7,
        pulseSpeed: 0.015,
        color: "#475569",
        glowColor: "rgba(71, 85, 105, 0.2)",
      });
    }

    // Build Interconnected Topological Link Beams
    const links: TopologyLink[] = [];

    // Root to primary
    for (let i = 1; i <= primaryConcepts.length; i++) {
      links.push({
        sourceIdx: 0,
        targetIdx: i,
        beamPos: Math.random(),
        beamSpeed: 0.007 + Math.random() * 0.004,
        beamLength: 0.22,
        width: 1,
        style: "glow",
      });
    }

    // Primary to secondary
    secondaryConcepts.forEach((_, sIdx) => {
      const secGlobalIdx = 1 + primaryConcepts.length + sIdx;
      const priGlobalIdx = 1 + (sIdx % primaryConcepts.length);

      links.push({
        sourceIdx: priGlobalIdx,
        targetIdx: secGlobalIdx,
        beamPos: Math.random(),
        beamSpeed: 0.006 + Math.random() * 0.003,
        beamLength: 0.18,
        width: 0.75,
        style: "solid",
      });
    });

    // Secondary to secondary cross links
    for (let i = 0; i < secondaryConcepts.length; i++) {
      const cur = 1 + primaryConcepts.length + i;
      const next = 1 + primaryConcepts.length + ((i + 1) % secondaryConcepts.length);
      links.push({
        sourceIdx: cur,
        targetIdx: next,
        beamPos: Math.random(),
        beamSpeed: 0.005,
        beamLength: 0.15,
        width: 0.5,
        style: "dashed",
      });
    }

    // Ambient background mesh links
    const firstAmbIdx = 1 + primaryConcepts.length + secondaryConcepts.length;
    for (let i = 0; i < ambientCount; i++) {
      const ambIdx = firstAmbIdx + i;
      const nearestSecIdx = 1 + primaryConcepts.length + (i % secondaryConcepts.length);
      links.push({
        sourceIdx: nearestSecIdx,
        targetIdx: ambIdx,
        beamPos: Math.random(),
        beamSpeed: 0.003,
        beamLength: 0.1,
        width: 0.4,
        style: "dashed",
      });
    }

    let time = 0;

    function renderFrame() {
      if (!ctx || !canvas) return;

      time += 1;

      ctx.save();
      ctx.scale(scale, scale);
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Radar & Archival Matrix Coordinate Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
      ctx.lineWidth = 0.5;
      const step = 36;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Concentric Radar Distance Wave (Slow breathing scale)
      const radarBreath = Math.sin(time * 0.015) * 4;
      ctx.strokeStyle = "rgba(254, 240, 138, 0.035)";
      ctx.beginPath();
      ctx.arc(cx, cy, 85 + radarBreath, 0, Math.PI * 2);
      ctx.arc(cx, cy, 145 - radarBreath, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Update Node Micro-Floating Coordinates
      nodes.forEach((n) => {
        n.floatPhase += 0.015;
        n.pulsePhase += n.pulseSpeed;

        // Multi-frequency Lissajous gentle drift
        const offsetX = Math.sin(n.floatPhase * n.floatSpeedX * 50) * 6 + Math.cos(n.floatPhase * 0.5) * 2;
        const offsetY = Math.cos(n.floatPhase * n.floatSpeedY * 50) * 6 + Math.sin(n.floatPhase * 0.4) * 2;

        n.x = n.baseX + offsetX;
        n.y = n.baseY + offsetY;
      });

      // 4. Render Topological Laser Link Filaments & Particle Light Streams
      links.forEach((l) => {
        const s = nodes[l.sourceIdx];
        const t = nodes[l.targetIdx];
        if (!s || !t) return;

        // Base Link Line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (l.style === "glow") {
          ctx.strokeStyle = "rgba(254, 240, 138, 0.18)";
          ctx.lineWidth = 1.2;
        } else if (l.style === "solid") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
          ctx.lineWidth = 0.75;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 3]);
        }
        ctx.stroke();
        ctx.restore();

        // Animated Luminescent Beam Segment (Flowing Light Wave)
        l.beamPos = (l.beamPos + l.beamSpeed) % 1;
        const p1 = l.beamPos;
        const p0 = Math.max(0, l.beamPos - l.beamLength);

        const x0 = s.x + (t.x - s.x) * p0;
        const y0 = s.y + (t.y - s.y) * p0;
        const x1 = s.x + (t.x - s.x) * p1;
        const y1 = s.y + (t.y - s.y) * p1;

        ctx.save();
        const beamGrad = ctx.createLinearGradient(x0, y0, x1, y1);
        beamGrad.addColorStop(0, "transparent");
        beamGrad.addColorStop(1, l.style === "glow" ? "#fef08a" : "#ffffff");

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = l.style === "glow" ? 2 : 1.2;
        ctx.stroke();
        ctx.restore();

        // Flowing Head Particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(x1, y1, l.style === "glow" ? 1.8 : 1.2, 0, Math.PI * 2);
        ctx.fillStyle = l.style === "glow" ? "#fef08a" : "#ffffff";
        ctx.shadowColor = l.style === "glow" ? "#f59e0b" : "#ffffff";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      });

      // 5. Render Floating Nodes & Breathing Halos
      nodes.forEach((n) => {
        const pulse = (Math.sin(n.pulsePhase) + 1) / 2; // 0 to 1

        // Atmospheric Breathing Radial Glow
        if (n.tier === "root" || n.tier === "primary" || n.tier === "secondary") {
          ctx.save();
          const haloR = n.radius * (1.8 + pulse * 0.8);
          const haloGrad = ctx.createRadialGradient(n.x, n.y, n.radius * 0.4, n.x, n.y, haloR);
          haloGrad.addColorStop(0, n.glowColor);
          haloGrad.addColorStop(1, "transparent");
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Node Body Core
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

        if (n.tier === "root") {
          ctx.fillStyle = "#18181b";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.stroke();
        } else if (n.tier === "primary") {
          ctx.fillStyle = "#27272a";
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = "#fef08a";
          ctx.stroke();

          // Center micro spark
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#fef08a";
          ctx.fill();
        } else if (n.tier === "secondary") {
          ctx.fillStyle = "#0f172a";
          ctx.fill();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = "#94a3b8";
          ctx.stroke();
        } else {
          ctx.fillStyle = "#334155";
          ctx.fill();
        }
        ctx.restore();

        // Node Typography
        if (n.label) {
          ctx.save();
          ctx.font = `${n.tier === "root" || n.tier === "primary" ? "bold " : ""}9.5px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (n.tier === "root") {
            ctx.fillStyle = "#ffffff";
            ctx.fillText(n.label, n.x, n.y);
          } else if (n.tier === "primary") {
            ctx.fillStyle = "#fef08a";
            ctx.fillText(n.label, n.x, n.y + n.radius + 12);
          } else {
            ctx.fillStyle = "#94a3b8";
            ctx.fillText(n.label, n.x, n.y + n.radius + 10);
          }
          ctx.restore();
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(renderFrame);
    }

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentPreset]);

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.09] bg-[#05070d]/90 p-2 sm:p-4 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] transition-all font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 bg-white/[0.015] rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded bg-zinc-800 text-[10px] font-serif font-bold text-white border border-white/10">
            K
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-200">知识工作流 · 从阅读到笔记</span>
            <span className="inline-block rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-mono text-zinc-400 tracking-wider">
              阅读工作流
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 font-sans">
          {PRESETS.map((preset, idx) => (
            <button
              key={preset.id}
              type="button"
              className={`rounded-lg px-3 py-1 text-xs transition-all font-mono ${
                activeTab === idx
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
              onClick={() => setActiveTab(idx)}
            >
              {preset.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Showcase Body (Pure Visual & Cinematic Presentation) */}
      <div className="grid min-h-[440px] grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] bg-transparent">
        {/* Left Side: Rich Markdown Note Card */}
        <div className="flex flex-col p-6 sm:p-8 bg-white/[0.01] font-sans border-b lg:border-b-0 lg:border-r border-white/[0.06] justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs text-zinc-500 font-mono">
              <span className="flex items-center gap-2">
                <NoteIcon size={13} className="text-zinc-400" />
                <span>笔记 &middot; 相关概念</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400 font-light">
                <span className="size-1.5 rounded-full bg-amber-300 animate-pulse" />
                已保存
              </span>
            </div>

            <h3 className="mt-5 text-xl sm:text-2xl font-serif font-normal tracking-tight text-white leading-snug">
              {currentPreset.title}
            </h3>

            {/* Markdown Tag Badges */}
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {currentPreset.concepts.map((concept, i) => (
                <span
                  key={concept}
                  className={`rounded border px-2.5 py-0.5 text-[11px] font-mono transition-colors ${
                    i < 2
                      ? "border-amber-300/30 bg-amber-400/10 text-amber-200"
                      : "border-white/10 bg-white/[0.03] text-zinc-400"
                  }`}
                >
                  {concept}
                </span>
              ))}
            </div>

            <p className="mt-5 text-xs sm:text-sm leading-relaxed text-zinc-300/90 font-light">
              {currentPreset.excerpt}
            </p>
          </div>

          {/* Bottom Metas & Security Footprint */}
          <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <GraphIcon size={13} className="text-amber-200" />
              <span>已整理 {currentPreset.concepts.length} 个相关概念</span>
            </span>
            <span className="flex items-center gap-1 text-zinc-500">
              <ShieldIcon size={12} />
              <span>私人空间</span>
            </span>
          </div>
        </div>

        {/* Right Side: 60FPS Ambient Floating Topology Canvas */}
        <div className="relative flex flex-col p-5 bg-black/60 font-sans justify-between overflow-hidden">
          {/* Canvas HUD Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] z-10">
            <div>
              <p className="text-xs font-semibold text-white">笔记之间的连接</p>
              <p className="text-[10px] font-mono text-zinc-500">
                从当前笔记出发，查看相关想法
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-200 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
              ● 连接已更新
            </span>
          </div>

          {/* Floating Canvas */}
          <div className="relative mt-2 h-72 sm:h-80 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#020306] shadow-inner">
            <canvas ref={canvasRef} className="size-full" />

            <div className="pointer-events-none absolute bottom-2.5 left-3 flex items-center gap-2 font-mono text-[9px] text-zinc-500">
              <span>关系视图</span>
              <span>&middot;</span>
              <span>{currentPreset.concepts.length} 个相关概念</span>
            </div>

            <div className="pointer-events-none absolute bottom-2.5 right-3 font-mono text-[9px] text-zinc-500">
              可交互
            </div>
          </div>

          {/* Bottom Footnote Badge */}
          <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5 shadow-xs font-sans">
            <p className="text-[11px] text-zinc-400 font-light flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-amber-300/80 animate-pulse" />
              <span>
                笔记之间的 <strong className="text-zinc-200 font-medium">双向链接</strong>，会帮助你回到相关想法。
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
