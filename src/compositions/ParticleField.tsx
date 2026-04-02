import { useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  particleCount: number;
  baseColor: string;
};

// Deterministic pseudo-random seeded by index
const seededRandom = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

export const ParticleField: React.FC<Props> = ({ particleCount, baseColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const t = frame / durationInFrames;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const seedX = seededRandom(i * 3);
    const seedY = seededRandom(i * 3 + 1);
    const seedSpeed = seededRandom(i * 3 + 2);
    const seedSize = seededRandom(i * 3 + 3);
    const seedOpacity = seededRandom(i * 3 + 4);
    const seedDrift = seededRandom(i * 3 + 5);

    const speed = 0.2 + seedSpeed * 0.8;
    const y = ((seedY + t * speed) % 1) * height;
    const drift = Math.sin(t * Math.PI * 2 * (0.5 + seedDrift * 0.5) + i) * 40;
    const x = seedX * width + drift;
    const size = 1 + seedSize * 3;
    const opacity = (0.2 + seedOpacity * 0.6) * (1 - Math.abs(y / height - 0.5) * 0.5);

    return { x, y, size, opacity };
  });

  // Background nebula
  const nebulaX = (Math.sin(t * Math.PI * 2) * 0.15 + 0.5) * width;
  const nebulaY = (Math.cos(t * Math.PI * 1.7) * 0.1 + 0.5) * height;

  return (
    <svg
      style={{ position: "absolute", inset: 0, background: "#020408" }}
      width={width}
      height={height}
    >
      <defs>
        <radialGradient id="nebula" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={baseColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="particle" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={baseColor} stopOpacity="1" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Nebula background glow */}
      <ellipse
        cx={nebulaX}
        cy={nebulaY}
        rx={width * 0.5}
        ry={height * 0.4}
        fill="url(#nebula)"
      />

      {/* Particles */}
      {particles.map(({ x, y, size, opacity }, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={size}
          fill={baseColor}
          opacity={opacity}
        />
      ))}

      {/* Vignette */}
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
      </radialGradient>
      <rect width={width} height={height} fill="url(#vignette)" />
    </svg>
  );
};
