import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type Props = {
  speed: number;
  colors: string[];
};

export const GradientFlow: React.FC<Props> = ({ speed, colors }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const t = (frame * speed) / durationInFrames;

  // Lissajous-style blob positions
  const blobs = colors.map((color, i) => {
    const phase = (i / colors.length) * Math.PI * 2;
    const x = (Math.sin(t * Math.PI * 2 + phase) * 0.3 + 0.5) * width;
    const y = (Math.cos(t * Math.PI * 2 * 0.7 + phase) * 0.3 + 0.5) * height;
    const scale = interpolate(
      Math.sin(t * Math.PI * 4 + phase),
      [-1, 1],
      [0.6, 1.2]
    );
    return { color, x, y, scale };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#0a0a0f",
        overflow: "hidden",
      }}
    >
      {blobs.map(({ color, x, y, scale }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 700 * scale,
            height: 700 * scale,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${color}99, transparent 70%)`,
            left: x - (700 * scale) / 2,
            top: y - (700 * scale) / 2,
            filter: "blur(80px)",
            mixBlendMode: "screen",
          }}
        />
      ))}
      {/* Grain overlay for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
    </div>
  );
};
