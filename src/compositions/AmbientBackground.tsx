import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type Props = {
  colorA: string;
  colorB: string;
  colorC: string;
};

export const AmbientBackground: React.FC<Props> = ({ colorA, colorB, colorC }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;

  // Slow, breathing oscillation
  const breathe = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
  const drift = Math.cos(progress * Math.PI * 1.3) * 0.5 + 0.5;

  const gradientAngle = interpolate(frame, [0, durationInFrames], [0, 360]);

  const opacity1 = interpolate(breathe, [0, 1], [0.4, 0.9]);
  const opacity2 = interpolate(drift, [0, 1], [0.3, 0.8]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: colorA,
        overflow: "hidden",
      }}
    >
      {/* Primary gradient layer */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `conic-gradient(from ${gradientAngle}deg at 50% 50%, ${colorA}, ${colorB}, ${colorC}, ${colorA})`,
          opacity: opacity1,
          filter: "blur(60px)",
        }}
      />
      {/* Secondary floating orb */}
      <div
        style={{
          position: "absolute",
          width: "80%",
          height: "80%",
          top: `${10 + drift * 15}%`,
          left: `${10 + breathe * 15}%`,
          background: `radial-gradient(ellipse at center, ${colorB}cc, transparent 70%)`,
          opacity: opacity2,
          filter: "blur(80px)",
        }}
      />
      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
};
