import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type Props = {
  coreColor: string;
  midColor: string;
  rimColor: string;
  particleCount: number;
};

// Seeded deterministic pseudo-random
const rand = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

export const ChironBackground: React.FC<Props> = ({
  coreColor,
  midColor,
  rimColor,
  particleCount,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // ── Time references ─────────────────────────────────────────────────────────
  // All periods in seconds; multiply by fps=30 to get frames.
  const sec = frame / 30;

  // Primary breathe: ~4-minute inhale/exhale cycle
  const breathePrimary = Math.sin((sec / 240) * Math.PI * 2) * 0.5 + 0.5;

  // Secondary, slightly detuned breathe for organic interference
  const breatheSecondary = Math.sin((sec / 317) * Math.PI * 2) * 0.5 + 0.5;

  // Very slow colour drift — one full rotation every ~11 minutes
  const colorDrift = (sec / 660) * Math.PI * 2;

  // ── Core glow ───────────────────────────────────────────────────────────────
  const coreScale = interpolate(breathePrimary, [0, 1], [0.78, 1.0]);
  const coreOpacity = interpolate(breathePrimary, [0, 1], [0.62, 0.88]);

  // Mid halo breathes slightly out of phase
  const midScale = interpolate(breatheSecondary, [0, 1], [0.9, 1.3]);
  const midOpacity = interpolate(breatheSecondary, [0, 1], [0.32, 0.52]);

  // ── Drifting nebula clouds (GradientFlow-style Lissajous blobs) ─────────────
  // Extremely slow — one pass every ~7–9 minutes per blob
  const blobDefs = [
    { period: 420, phase: 0,               rx: 0.22, ry: 0.18, color: midColor,  opacity: 0.28, size: 820 },
    { period: 540, phase: Math.PI * 0.7,   rx: 0.18, ry: 0.24, color: coreColor, opacity: 0.22, size: 700 },
    { period: 380, phase: Math.PI * 1.4,   rx: 0.26, ry: 0.15, color: rimColor,  opacity: 0.18, size: 600 },
  ];

  const blobs = blobDefs.map(({ period, phase, rx, ry, color, opacity, size }) => {
    const bx = (Math.sin((sec / period) * Math.PI * 2 + phase) * rx + 0.5) * width;
    const by = (Math.cos((sec / period) * Math.PI * 2 * 0.61803 + phase) * ry + 0.5) * height;
    return { bx, by, color, opacity, size };
  });

  // ── Orbiting diamond particles ───────────────────────────────────────────────
  const cx = width / 2;
  const cy = height / 2;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    // Stable orbital parameters
    const orbitRadius = interpolate(rand(i * 7),     [0, 1], [120, 520]);
    const orbitPeriod = interpolate(rand(i * 7 + 1), [0, 1], [180, 900]);
    const orbitTilt   = rand(i * 7 + 2) * Math.PI * 2;
    const startAngle  = rand(i * 7 + 3) * Math.PI * 2;
    const twinkleFreq = interpolate(rand(i * 7 + 5), [0, 1], [0.2, 1.2]);

    // Size: skewed heavily small — most are tiny, a handful are larger
    const sizeSeed = rand(i * 7 + 4);
    const coreRadius = sizeSeed < 0.75
      ? interpolate(sizeSeed / 0.75, [0, 1], [0.4, 0.9])   // 75% tiny
      : interpolate((sizeSeed - 0.75) / 0.25, [0, 1], [1.0, 1.8]); // 25% medium

    const baseOpacity = interpolate(rand(i * 7 + 6), [0, 1], [0.5, 1.0]);

    // Orbital position
    const angle = startAngle + (sec / orbitPeriod) * Math.PI * 2;
    const px = cx + Math.cos(angle + orbitTilt) * orbitRadius;
    const py = cy + Math.sin(angle + orbitTilt) * orbitRadius * 0.38;

    // Depth — particles behind the centre plane are dimmer
    const depthFactor = interpolate(Math.sin(angle + orbitTilt), [-1, 1], [0.2, 1.0]);

    // Gentle twinkle — slow, smooth, no sharp spikes
    const twinkle = Math.sin(sec * twinkleFreq + i * 2.399) * 0.5 + 0.5;
    const opacity = baseOpacity * interpolate(twinkle, [0, 1], [0.3, 1.0]) * depthFactor;

    return { px, py, coreRadius, opacity };
  });

  // ── Colour shift on the core over time ──────────────────────────────────────
  // Hue rotates from coreColor toward midColor imperceptibly slowly
  const colorShiftOpacity = interpolate(
    Math.sin(colorDrift) * 0.5 + 0.5,
    [0, 1],
    [0, 0.38]
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#04020a",
        overflow: "hidden",
      }}
    >
      {/* ── Nebula blobs (screen-blended, very blurred) ── */}
      {blobs.map(({ bx, by, color, opacity, size }, i) => (
        <div
          key={`blob-${i}`}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
            left: bx - size / 2,
            top: by - size / 2,
            opacity,
            filter: "blur(90px)",
            mixBlendMode: "screen",
          }}
        />
      ))}

      {/* ── Mid halo — wide, faint, slow breathe ── */}
      <div
        style={{
          position: "absolute",
          width: 1100 * midScale,
          height: 660 * midScale,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${midColor}55, transparent 65%)`,
          left: cx - (1100 * midScale) / 2,
          top: cy - (660 * midScale) / 2,
          opacity: midOpacity,
          filter: "blur(100px)",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Core glow — tight, bright, primary breathe ── */}
      <div
        style={{
          position: "absolute",
          width: 560 * coreScale,
          height: 340 * coreScale,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${coreColor}dd 0%, ${coreColor}66 35%, transparent 70%)`,
          left: cx - (560 * coreScale) / 2,
          top: cy - (340 * coreScale) / 2,
          opacity: coreOpacity,
          filter: "blur(55px)",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Colour shift overlay on core ── */}
      <div
        style={{
          position: "absolute",
          width: 460,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${rimColor}, transparent 70%)`,
          left: cx - 230,
          top: cy - 140,
          opacity: colorShiftOpacity,
          filter: "blur(70px)",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Star particles (SVG) ── */}
      <svg
        style={{ position: "absolute", inset: 0 }}
        width={width}
        height={height}
      >
        <defs>
          {/* Shared soft-glow gradient: white centre → transparent edge */}
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="white" stopOpacity="1" />
            <stop offset="40%"  stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {particles.map(({ px, py, coreRadius, opacity }, i) => (
          <g key={`p-${i}`} opacity={opacity}>
            {/* Diffuse glow — same gradient, larger radius, very faint */}
            <circle
              cx={px} cy={py}
              r={coreRadius * 5}
              fill="url(#starGlow)"
              opacity={0.18}
            />
            {/* Crisp bright core */}
            <circle
              cx={px} cy={py}
              r={coreRadius}
              fill="white"
            />
          </g>
        ))}
      </svg>

      {/* ── Deep cinematic vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(2,1,6,0.55) 65%, rgba(2,1,6,0.92) 100%)",
        }}
      />

      {/* ── Subtle film grain ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.035,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
};
