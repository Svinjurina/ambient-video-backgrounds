import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// 20-min loop: every oscillator uses an integer frequency so f(t=0) === f(t=1)
const LOOP_FRAMES = 36000; // 1200 s × 30 fps
const TAU = Math.PI * 2;

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Integer-freq oscillator — seamless across the loop boundary
function osc(t: number, freq: number, phase = 0): number {
  return Math.sin(t * TAU * freq + phase);
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

// ── Static definitions (computed once at module load) ────────────────────────

const SMOKE_DEFS = Array.from({ length: 9 }, (_, i) => {
  const h = (n: number) => hash(i * 11 + n);
  return {
    bx: 0.05 + h(0) * 0.90,  by: 0.05 + h(1) * 0.90,
    fx: 2 + Math.floor(h(2) * 5),  fy: 2 + Math.floor(h(3) * 5),
    px: h(4) * TAU,  py: h(5) * TAU,
    ax: 0.15 + h(6) * 0.16,  ay: 0.11 + h(7) * 0.13,
    r:  0.19 + h(8) * 0.16,
    fr: 1 + Math.floor(h(9) * 2),  pr: h(10) * TAU,
    op: 0.13 + h(11) * 0.10,
    warm: h(12) > 0.45,
    frot: 1 + Math.floor(h(13) * 2),  prot: h(14) * TAU,
  };
});

const VEIN_DEFS = Array.from({ length: 16 }, (_, i) => {
  const h = (n: number) => hash(i * 19 + n);
  const np = 5 + Math.floor(h(0) * 3); // 5–7 control points per vein
  const pts = Array.from({ length: np }, (_, j) => {
    const edge = j === 0 || j === np - 1;
    return {
      // Edge points emerge from off-screen for a more organic feel
      bx:  edge ? h(j*8+1)*1.2-0.1 : 0.05 + h(j*8+1)*0.90,
      by:  edge ? h(j*8+2)*1.2-0.1 : 0.05 + h(j*8+2)*0.90,
      fx:  2 + Math.floor(h(j*8+3)*6),
      fy:  2 + Math.floor(h(j*8+4)*6),
      phX: h(j*8+5)*TAU,  phY: h(j*8+6)*TAU,
      aX:  0.030 + h(j*8+7)*0.075,
      aY:  0.030 + h(j*8+8)*0.075,
    };
  });
  return {
    pts,
    hue:   34 + h(70)*20,       // 34–54°: amber → warm gold
    light: 46 + h(71)*24,       // 46–70% lightness
    alpha: 0.09 + h(72)*0.23,
    width: 0.45 + h(73)*1.3,
    glow:  4 + h(74)*11,
    pF:    3 + Math.floor(h(75)*8),
    pPh:   h(76)*TAU,
  };
});

// Dust motes — microscopic iridescent points of light, deterministic
const DUST_DEFS = Array.from({ length: 220 }, (_, i) => {
  const h = (n: number) => hash(i * 17 + n);
  const cycleFrames = Math.round((4.0 + h(0) * 9.0) * 30); // 120–390 frames
  return {
    cycleFrames,
    offsetFrames:  Math.round(h(1) * cycleFrames),
    // Scattered broadly across the canvas
    spawnX:        0.04 + h(2) * 0.92,
    spawnY:        0.06 + h(3) * 0.88,
    // Near-imperceptible drift — slow upward, faint lateral wander
    vx:            (h(4) - 0.5) * 0.09,
    vy:            -(0.018 + h(5) * 0.055),
    swayAmp:       h(6) * 3.5,
    swayFreq:      0.008 + h(7) * 0.018,
    // Size: 1.2–3.5px — tiny but survives preview scaling
    size:          1.2 + h(8) * 2.3,
    // Soft bloom radius (faint aura, not a decorative halo)
    bloom:         2.5 + h(14) * 4.5,
    // Colour shimmer params
    baseHue:       28 + h(9) * 22,       // 28–50°: amber → gold
    hueSwing:      8  + h(10) * 14,      // how far hue drifts at shimmer peak
    shimmerFreq:   0.018 + h(11) * 0.055,
    shimmerPhase:  h(12) * TAU,
    // Opacity: clearly present at peak, recedes at rest
    baseOpacity:   0.28 + h(13) * 0.42,
  };
});

type Props = {
  glowIntensity: number; // 0.5–2.0, studio-adjustable brightness
};

export const BlackGoldAmbient: React.FC<Props> = ({ glowIntensity }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  const t   = frame / LOOP_FRAMES;
  const CX  = W / 2;
  const CY  = H / 2;
  const MIN = Math.min(W, H);

  // ── Core glow ──────────────────────────────────────────────────────────────
  // Two detuned oscillators produce organic interference breathing
  const b1 = osc(t, 9,  0.00) * 0.5 + 0.5;
  const b2 = osc(t, 13, 1.10) * 0.5 + 0.5;
  const br = lerp(b1, b2, 0.38) * glowIntensity;
  // Slow positional drift within a few percent of centre
  const gx = CX + osc(t, 4, 0.30) * W * 0.065;
  const gy = CY + osc(t, 5, 1.80) * H * 0.048;
  const outerR = MIN * (0.27 + br * 0.08);
  const innerR = MIN * (0.074 + br * 0.030);

  // ── Per-frame dust data ────────────────────────────────────────────────────
  const dustData = DUST_DEFS.map((s) => {
    const localFrame = (frame + s.offsetFrames) % s.cycleFrames;
    const u  = localFrame / s.cycleFrames;
    // Gentle sigmoid-style fade: slow in, long hold, slow out
    const fa = u < 0.15 ? u / 0.15 : u > 0.78 ? (1 - u) / 0.22 : 1;

    // Shimmer: smooth sine oscillation shifts hue and lightness
    const shimmer   = Math.sin(frame * s.shimmerFreq + s.shimmerPhase) * 0.5 + 0.5;
    const hue       = s.baseHue + (shimmer - 0.5) * s.hueSwing * 2;
    // Lightness: 50% (deep amber) → 92% (near-white) at shimmer peak
    const lightness = 50 + shimmer * 42;
    // Saturation: high at trough (rich gold), fades toward white at peak
    const sat       = 88 - shimmer * 55;
    // Opacity: visible baseline, peaks at shimmer
    const op        = fa * s.baseOpacity * (0.40 + shimmer * 0.60);

    const x = s.spawnX * W
              + s.vx * localFrame
              + Math.sin(localFrame * s.swayFreq) * s.swayAmp;
    const y = s.spawnY * H + s.vy * localFrame;

    return { x, y, size: s.size, bloom: s.bloom, hue, sat, lightness, op };
  });

  return (
    <div style={{ position: "absolute", inset: 0, background: "#030106", overflow: "hidden" }}>

      {/* ── Smoke blobs — blurred dark masses ── */}
      {SMOKE_DEFS.map((b, i) => {
        const x  = (b.bx + osc(t, b.fx, b.px) * b.ax) * W;
        const y  = (b.by + osc(t, b.fy, b.py) * b.ay) * H;
        const r  = (b.r  + osc(t, b.fr, b.pr) * 0.03) * MIN;
        const rx = r * (1.22 + osc(t, b.fx, b.px + 1.0) * 0.13);
        const ry = r * (0.80 + osc(t, b.fy, b.py + 1.0) * 0.10);
        const c1 = b.warm
          ? `rgba(26,12,3,${b.op})`
          : `rgba(10,6,22,${b.op})`;
        const c2 = b.warm
          ? `rgba(13,5,1,${b.op * 0.45})`
          : `rgba(5,3,10,${b.op * 0.45})`;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: rx * 2,
              height: ry * 2,
              left: x - rx,
              top: y - ry,
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${c1} 0%, ${c2} 50%, transparent 100%)`,
              filter: "blur(28px)",
            }}
          />
        );
      })}

      {/* ── SVG layer: veins + dust ── */}
      <svg
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        width={W}
        height={H}
      >
        {/* Golden veins */}
        {VEIN_DEFS.map((v, i) => {
          const pts = v.pts.map((p) => ({
            x: (p.bx + osc(t, p.fx, p.phX) * p.aX) * W,
            y: (p.by + osc(t, p.fy, p.phY) * p.aY) * H,
          }));

          const pulse = osc(t, v.pF, v.pPh) * 0.5 + 0.5;
          const a     = v.alpha * (0.28 + pulse * 0.72);

          let d = `M ${pts[0].x} ${pts[0].y}`;
          for (let j = 1; j < pts.length - 1; j++) {
            const mx = (pts[j].x + pts[j + 1].x) * 0.5;
            const my = (pts[j].y + pts[j + 1].y) * 0.5;
            d += ` Q ${pts[j].x} ${pts[j].y} ${mx} ${my}`;
          }
          d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;

          const glowStroke = `hsla(${v.hue},76%,${v.light}%,${a})`;
          const glowShadow = `hsla(${v.hue},80%,52%,${a * 0.8})`;
          const highlight  = `hsla(${v.hue+10},65%,${Math.min(v.light+20,88)}%,${a*0.58})`;

          return (
            <g key={i}>
              <path
                d={d}
                stroke={glowStroke}
                strokeWidth={v.width + 2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 ${(v.glow * 0.5).toFixed(1)}px ${glowShadow})` }}
              />
              <path
                d={d}
                stroke={highlight}
                strokeWidth={Math.max(v.width * 0.32, 0.3)}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* Dust motes — iridescent shimmering points */}
        {dustData.map((d, i) => {
          if (d.op < 0.008) return null;
          const color = `hsl(${d.hue},${d.sat}%,${d.lightness}%)`;
          return (
            <g key={i} opacity={d.op}>
              {/* Faint soft bloom — very low opacity, makes dot perceivable at scale */}
              <circle cx={d.x} cy={d.y} r={d.bloom} fill={color} opacity={0.08} />
              {/* Crisp core dot */}
              <circle cx={d.x} cy={d.y} r={d.size} fill={color} />
            </g>
          );
        })}
      </svg>

      {/* ── Core glow — outer diffuse haze ── */}
      <div
        style={{
          position: "absolute",
          width: outerR * 1.55 * 2,
          height: outerR * 0.80 * 2,
          left: gx - outerR * 1.55,
          top:  gy - outerR * 0.80,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center,
            rgba(158,90,14,${(0.23 + br * 0.12).toFixed(3)}) 0%,
            rgba(82,42,5,${(0.09 + br * 0.05).toFixed(3)}) 40%,
            transparent 100%)`,
          filter: "blur(30px)",
        }}
      />

      {/* ── Core glow — inner tight core ── */}
      <div
        style={{
          position: "absolute",
          width: innerR * 1.28 * 2,
          height: innerR * 2,
          left: gx - innerR * 1.28,
          top:  gy - innerR,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center,
            rgba(238,168,34,${(0.72 + br * 0.22).toFixed(3)}) 0%,
            rgba(168,94,16,${(0.34 + br * 0.10).toFixed(3)}) 28%,
            rgba(72,36,5,0.12) 62%,
            transparent 100%)`,
        }}
      />

      {/* ── Vignette — heavy cinematic edge crush ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 55% 65% at 50% 50%, transparent 0%, rgba(0,0,0,0.30) 52%, rgba(0,0,0,0.92) 100%)",
        }}
      />
    </div>
  );
};
