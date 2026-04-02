import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from "remotion";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

function useLato() {
  const [handle] = useState(() => delayRender("Loading Lato font"));
  useEffect(() => {
    const url = "https://fonts.googleapis.com/css2?family=Lato:ital,wght@1,300;1,400&display=swap";
    let link = document.querySelector<HTMLLinkElement>(`link[href="${url}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel  = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
    const onLoad = () => {
      // Explicitly wait for the specific face — fonts.ready resolves too early
      // when the stylesheet is injected dynamically.
      document.fonts.load('italic 300 1em Lato')
        .then(() => continueRender(handle))
        .catch(() => continueRender(handle));
    };
    // Stylesheet may already be cached and parsed
    if (link.sheet) {
      onLoad();
    } else {
      link.addEventListener('load',  onLoad,                           { once: true });
      link.addEventListener('error', () => continueRender(handle),    { once: true });
    }
  }, [handle]);
}

const LOOP_FRAMES = 36000; // 1200 s × 30 fps — all osc freqs are integers → seamless
const TAU = Math.PI * 2;

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function osc(t: number, freq: number, phase = 0): number {
  return Math.sin(t * TAU * freq + phase);
}
function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

// ── Ink blob definitions — slow, warm, drifting ───────────────────────────────
const INK_DEFS = Array.from({ length: 12 }, (_, i) => {
  const h = (n: number) => hash(i * 13 + n + 100);
  return {
    bx:       0.05 + h(0) * 0.90,
    by:       0.05 + h(1) * 0.90,
    fx:       1 + Math.floor(h(2) * 3),   // 1–3: deliberately slow
    fy:       1 + Math.floor(h(3) * 3),
    px:       h(4) * TAU,
    py:       h(5) * TAU,
    ax:       0.03 + h(6) * 0.07,         // small amplitude → gentle drift
    ay:       0.02 + h(7) * 0.06,
    rx:       0.10 + h(8) * 0.22,         // blob radius fraction of MIN
    ry:       0.07 + h(9) * 0.16,
    frx:      1 + Math.floor(h(10) * 3),  // shape-morph freq
    pRx:      h(11) * TAU,
    fry:      1 + Math.floor(h(12) * 3),
    pRy:      h(13) * TAU,
    warmth:   h(14),                       // 0 = dark purple-grey, 1 = dark amber
    opacity:  0.30 + h(15) * 0.36,
    blur:     22 + h(16) * 34,
    rotFreq:  1 + Math.floor(h(17) * 3),
    rotPhase: h(18) * TAU,
    rotAmp:   0.12 + h(19) * 0.40,
    gcx:      30 + h(20) * 40,
    gcy:      28 + h(21) * 34,
  };
});

// ── Lissajous organic curve definitions ───────────────────────────────────────
// Each pair [fx, fy] defines a Lissajous figure family.
// The phase difference drifts slowly → the figure morphs continuously.
const CURVE_PAIRS: Array<[number, number]> = [
  [1, 2], [2, 3], [3, 4], [3, 5], [4, 5], [2, 5], [5, 6],
];

const CURVE_DEFS = CURVE_PAIRS.map(([fx, fy], i) => {
  const h       = (n: number) => hash(i * 17 + n + 500);
  const periods = lcm(fx, fy);
  return {
    fx, fy, periods,
    nSamples:   Math.min(periods * 42, 380),
    driftFreq:  1 + Math.floor(h(0) * 4),  // integer → seamless loop
    driftPhase: h(1) * TAU,
    driftAmp:   0.7 + h(2) * 1.5,          // phase swing in radians
    phX:        h(3) * TAU,
    phY:        h(4) * TAU,
    cx:         0.28 + h(5) * 0.44,        // centre (canvas fraction)
    cy:         0.22 + h(6) * 0.56,
    ax:         0.24 + h(7) * 0.30,        // amplitude (canvas fraction)
    ay:         0.18 + h(8) * 0.26,
    hue:        16 + h(9) * 32,            // warm amber–orange 16–48°
    sat:        22 + h(10) * 48,
    light:      28 + h(11) * 38,
    baseAlpha:  0.07 + h(12) * 0.16,
    width:      0.4  + h(13) * 1.8,
    pulseFreq:  2 + Math.floor(h(14) * 5),
    pulsePhase: h(15) * TAU,
  };
});

// ── Red accent thread definitions ─────────────────────────────────────────────
// Higher-ratio Lissajous figures → denser, more chaotic paths
const THREAD_PAIRS: Array<[number, number]> = [
  [3, 7], [5, 8], [4, 7], [7, 9],
];

const THREAD_DEFS = THREAD_PAIRS.map(([fx, fy], i) => {
  const h       = (n: number) => hash(i * 23 + n + 700);
  const periods = lcm(fx, fy);
  return {
    fx, fy, periods,
    nSamples:   Math.min(periods * 18, 220),
    driftFreq:  2 + Math.floor(h(0) * 5),
    driftPhase: h(1) * TAU,
    driftAmp:   0.5 + h(2) * 1.3,
    phX:        h(3) * TAU,
    phY:        h(4) * TAU,
    cx:         0.18 + h(5) * 0.64,
    cy:         0.18 + h(6) * 0.64,
    ax:         0.16 + h(7) * 0.34,
    ay:         0.13 + h(8) * 0.28,
    baseAlpha:  0.055 + h(9) * 0.095,
    width:      0.25 + h(10) * 0.60,
    pulseFreq:  3 + Math.floor(h(11) * 6),
    pulsePhase: h(12) * TAU,
  };
});

// ── Purple accent threads — 3 subtle Lissajous curves ────────────────────────
const PURPLE_THREADS = (
  [[2,5],[3,8],[5,7]] as Array<[number,number]>
).map(([fx, fy], i) => {
  const h = (n: number) => hash(i * 29 + n + 900);
  return {
    fx, fy, periods: lcm(fx, fy),
    nSamples:   Math.min(lcm(fx, fy) * 14, 200),
    driftFreq:  1 + Math.floor(h(0) * 4), driftPhase: h(1) * TAU, driftAmp: 0.8 + h(2) * 1.0,
    phX:        h(3) * TAU, phY: h(4) * TAU,
    cx:         0.25 + h(5) * 0.50, cy: 0.20 + h(6) * 0.60,
    ax:         0.28 + h(7) * 0.18, ay: 0.22 + h(8) * 0.14,
    pulseFreq:  2 + Math.floor(h(9) * 4), pulsePhase: h(10) * TAU,
  };
});

// ── Glowing orbs — large soft fog-light blobs ─────────────────────────────────
const ORB_DEFS = Array.from({ length: 4 }, (_, i) => {
  const h = (n: number) => hash(i * 37 + n + 1200);
  // warm amber (0) → deep crimson (1)
  const warmth = h(0);
  return {
    bcx:    0.12 + h(1) * 0.76,
    bcy:    0.10 + h(2) * 0.80,
    fx:     1 + Math.floor(h(3) * 3),
    fy:     1 + Math.floor(h(4) * 3),
    px:     h(5) * TAU,
    py:     h(6) * TAU,
    ax:     0.04 + h(7) * 0.08,
    ay:     0.03 + h(8) * 0.07,
    rx:     0.22 + h(9)  * 0.28,   // large — fraction of MIN
    ry:     0.18 + h(10) * 0.22,
    frx:    1 + Math.floor(h(11) * 2),
    pRx:    h(12) * TAU,
    fry:    1 + Math.floor(h(13) * 2),
    pRy:    h(14) * TAU,
    rotFreq:  1 + Math.floor(h(15) * 2),
    rotPhase: h(16) * TAU,
    rotAmp:   0.20 + h(17) * 0.35,
    pulseFreq:  1 + Math.floor(h(18) * 3),
    pulsePhase: h(19) * TAU,
    // color: amber vs deep red
    r: Math.round(warmth > 0.5 ? lerp(110, 180, (warmth - 0.5) * 2) : lerp(60, 110, warmth * 2)),
    g: Math.round(warmth > 0.5 ? lerp(18,  30,  (warmth - 0.5) * 2) : lerp(8,  18,  warmth * 2)),
    b: Math.round(warmth > 0.5 ? lerp(4,   10,  (warmth - 0.5) * 2) : lerp(14, 4,   warmth * 2)),
    opacity: 0.06 + h(20) * 0.07,  // very faint — fog-light effect
    blur:    55  + h(21) * 55,      // huge blur radius
  };
});

// ── Lissajous path builder ────────────────────────────────────────────────────
function buildLissajousPath(
  fx: number, fy: number, periods: number, nSamples: number,
  cx: number, cy: number, ax: number, ay: number,
  phX: number, phY: number, phaseShift: number,
  W: number, H: number,
): string {
  const pts: Array<[number, number]> = [];
  for (let j = 0; j < nSamples; j++) {
    const s  = (j / (nSamples - 1)) * periods * TAU;
    const px = (cx + Math.sin(fx * s + phX + phaseShift) * ax) * W;
    const py = (cy + Math.sin(fy * s + phY)              * ay) * H;
    pts.push([px, py]);
  }
  // Smooth quadratic bezier polyline through midpoints
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let j = 1; j < pts.length - 1; j++) {
    const mx = ((pts[j][0] + pts[j + 1][0]) / 2).toFixed(1);
    const my = ((pts[j][1] + pts[j + 1][1]) / 2).toFixed(1);
    d += ` Q ${pts[j][0].toFixed(1)} ${pts[j][1].toFixed(1)} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`;
  return d;
}

// ── Quote geometry helpers ────────────────────────────────────────────────────
const Q_FONT          = '"Lato", sans-serif';
const Q_SIZE          = 52;
const Q_LSPACE        = 1;
const Q_CHAR_W        = Q_SIZE * 0.52 + Q_LSPACE;  // avg glyph width for Lato italic
const Q_LINE_H        = Q_SIZE * 1.60;
const Q_CENTER_Y_FRAC = 0.50;
const Q_MAX_W_FRAC    = 0.80;                       // max text block = 80% of frame width

// Word-wrap a single paragraph to a maximum character-width budget.
// Works on the same Q_CHAR_W grid used by charToXY so pen tracking stays accurate.
function wrapText(text: string, maxLineChars: number): string[] {
  const words  = text.split(" ");
  const lines: string[] = [];
  let   cur    = "";
  for (const word of words) {
    const candidate = cur ? `${cur} ${word}` : word;
    if (candidate.length <= maxLineChars) {
      cur = candidate;
    } else {
      if (cur) lines.push(cur);
      // Long single word — force it onto its own line anyway
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function charToXY(
  charProg: number,
  lines: string[],
  W: number,
  H: number,
): { x: number; y: number; li: number } {
  const centerY = H * Q_CENTER_Y_FRAC;
  let cum = 0;
  for (let li = 0; li < lines.length; li++) {
    const len = lines[li].length;
    if (charProg <= cum + len) {
      const inLine = charProg - cum;
      const lineW  = lines[li].length * Q_CHAR_W;
      return { x: W / 2 - lineW / 2 + inLine * Q_CHAR_W, y: centerY + (li - (lines.length - 1) / 2) * Q_LINE_H, li };
    }
    cum += len;
  }
  const li    = lines.length - 1;
  const lineW = lines[li].length * Q_CHAR_W;
  return { x: W / 2 - lineW / 2 + lines[li].length * Q_CHAR_W, y: centerY + (li - (lines.length - 1) / 2) * Q_LINE_H, li };
}

function getPenPos(
  localFrame: number,
  writeDur: number,
  lines: string[],
  W: number,
  H: number,
): { x: number; y: number; li: number } | null {
  if (localFrame < 0) return null;
  const totalChars    = lines.reduce((s, l) => s + l.length, 0);
  const writeProgress = Math.min(localFrame / writeDur, 1.0);
  const charProg      = writeProgress * totalChars;
  const { x, y, li } = charToXY(charProg, lines, W, H);
  const wrigglesTotal = Math.max(3, Math.floor(totalChars / 7));
  const amp           = Q_SIZE * 0.44 * Math.max(0, 1 - writeProgress * 1.35);
  const wy            = Math.sin(writeProgress * wrigglesTotal * TAU) * amp;
  return { x, y: y - Q_SIZE * 0.28 + wy, li };
}

// ── Quote system ──────────────────────────────────────────────────────────────
const DEFAULT_FRAMES_PER_CHAR = 14;
const HOLD_FRAMES             = 210;
const FADE_FRAMES             = 120;
const GAP_FRAMES              = 90;
const QUOTES_START            = 3600;  // frame 3600 = 2 min
const SLOT_FRAMES             = 960;   // 32 s per quote at 30 fps

interface QuoteEntry {
  text: string; startFrame: number; writeDur: number; cycleDur: number;
}

function buildQuoteSchedule(quotes: string[], framesPerChar: number): QuoteEntry[] {
  const maxWriteDur = SLOT_FRAMES - HOLD_FRAMES - FADE_FRAMES - GAP_FRAMES; // 540 frames
  return quotes.map((text, qi) => {
    const charCount = text.replace(/\n/g, "").length;
    const writeDur  = Math.min(charCount * framesPerChar, maxWriteDur);
    return {
      text,
      startFrame: QUOTES_START + qi * SLOT_FRAMES,
      writeDur,
      cycleDur:   SLOT_FRAMES,
    };
  });
}

// ── Snake trail constants ─────────────────────────────────────────────────────
const TRAIL_SAMPLES      = 28;
const TRAIL_STEP         = 3;
const TRAIL_DRAIN_FRAMES = 30;

// ── QuoteLayer ────────────────────────────────────────────────────────────────
function QuoteLayer({ frame, W, H, quotes, animationSpeed, textColor }: {
  frame: number; W: number; H: number;
  quotes: string[]; animationSpeed: number; textColor: string;
}) {
  const framesPerChar = Math.max(1, Math.round(DEFAULT_FRAMES_PER_CHAR / animationSpeed));
  const schedule = useMemo(
    () => buildQuoteSchedule(quotes, framesPerChar),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quotes.join("|||"), framesPerChar],
  );
  let entry: QuoteEntry | null = null;
  for (const e of schedule) {
    if (frame >= e.startFrame && frame < e.startFrame + e.cycleDur) { entry = e; break; }
  }
  if (!entry) return null;

  const localFrame    = frame - entry.startFrame;
  const maxLineChars  = Math.floor((W * Q_MAX_W_FRAC) / Q_CHAR_W);
  const lines         = entry.text.split("\n").flatMap(p => wrapText(p, maxLineChars));
  const totalChars    = lines.reduce((s, l) => s + l.length, 0);
  const writeProgress = Math.min(localFrame / entry.writeDur, 1.0);
  const isWriting     = writeProgress < 0.9999;
  const penCharProg   = writeProgress * totalChars;
  const fadeStart     = entry.writeDur + HOLD_FRAMES;
  if (localFrame >= fadeStart + FADE_FRAMES) return null;
  const textAlpha = localFrame < fadeStart ? 1.0 : Math.max(0, 1 - (localFrame - fadeStart) / FADE_FRAMES);
  const centerY   = H * Q_CENTER_Y_FRAC;
  const penPos    = getPenPos(localFrame, entry.writeDur, lines, W, H)!;

  type TrailPt = { x: number; y: number; li: number };
  const rawPts: Array<TrailPt | null> = [];
  for (let i = 0; i < TRAIL_SAMPLES; i++) {
    rawPts.push(getPenPos(localFrame - i * TRAIL_STEP, entry.writeDur, lines, W, H));
  }
  const framesAfterWrite  = isWriting ? 0 : (localFrame - entry.writeDur);
  const trailMasterAlpha  = Math.max(0, isWriting ? 1.0 : 1 - framesAfterWrite / TRAIL_DRAIN_FRAMES);
  type Seg = { x1: number; y1: number; x2: number; y2: number; idx: number };
  const segments: Seg[] = [];
  for (let i = 0; i < rawPts.length - 1; i++) {
    const a = rawPts[i], b = rawPts[i + 1];
    if (!a || !b || a.li !== b.li) continue;
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, idx: i });
  }

  return (
    <svg style={{ position: "absolute", inset: 0 }} width={W} height={H}>
      <defs>
        <filter id="q-pen-glow" x="-140%" y="-140%" width="380%" height="380%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="q-trail-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        <filter id="q-text-shadow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="q-text-glow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {lines.map((line, li) => {
          const lineW       = line.length * Q_CHAR_W;
          const lineLeft    = W / 2 - lineW / 2;
          const lineY       = centerY + (li - (lines.length - 1) / 2) * Q_LINE_H;
          const cumBefore   = lines.slice(0, li).reduce((s, l) => s + l.length, 0);
          const charsReveal = Math.min(Math.max(0, penCharProg - cumBefore), line.length);
          return (
            <clipPath key={li} id={`qcp-${li}`}>
              <rect
                x={lineLeft - 8}
                y={lineY - Q_SIZE * 1.5}
                width={Math.max(0, charsReveal * Q_CHAR_W + 16)}
                height={Q_SIZE * 3.0}
              />
            </clipPath>
          );
        })}
      </defs>

      {/* Snake trail */}
      {trailMasterAlpha > 0 && segments.length > 0 && (
        <g opacity={trailMasterAlpha}>
          <g filter="url(#q-trail-blur)">
            {segments.map(({ x1, y1, x2, y2, idx }) => {
              const r = idx / (TRAIL_SAMPLES - 2);
              return <line key={`tg-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(200,200,220,${((1 - r) * 0.55).toFixed(3)})`} strokeWidth={lerp(9, 1.5, r)} strokeLinecap="round" />;
            })}
          </g>
          {segments.map(({ x1, y1, x2, y2, idx }) => {
            const r = idx / (TRAIL_SAMPLES - 2);
            return <line key={`tc-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(210,210,225,${((1 - r) * 0.88).toFixed(3)})`} strokeWidth={lerp(4.2, 0.35, r)} strokeLinecap="round" />;
          })}
          {segments.map(({ x1, y1, x2, y2, idx }) => {
            const r = idx / (TRAIL_SAMPLES - 2);
            if (r > 0.50) return null;
            return <line key={`th-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(230,230,240,${((1 - r / 0.50) * 0.52).toFixed(3)})`} strokeWidth={lerp(1.8, 0.2, r / 0.50)} strokeLinecap="round" />;
          })}
        </g>
      )}

      {/* Text */}
      <g opacity={textAlpha}>
        {lines.map((line, li) => {
          const lineY = centerY + (li - (lines.length - 1) / 2) * Q_LINE_H;
          return (
            <g key={li} clipPath={`url(#qcp-${li})`}>
              <text x={W / 2} y={lineY + 6} textAnchor="middle" fontFamily={Q_FONT} fontStyle="italic" fontWeight="300" fontSize={Q_SIZE} letterSpacing={Q_LSPACE} fill="rgba(0,0,0,0.60)" filter="url(#q-text-shadow)">{line}</text>
              <text x={W / 2} y={lineY} textAnchor="middle" fontFamily={Q_FONT} fontStyle="italic" fontWeight="300" fontSize={Q_SIZE} letterSpacing={Q_LSPACE} fill={textColor} opacity={0.30} filter="url(#q-text-glow)">{line}</text>
              <text x={W / 2} y={lineY} textAnchor="middle" fontFamily={Q_FONT} fontStyle="italic" fontWeight="300" fontSize={Q_SIZE} letterSpacing={Q_LSPACE} fill={textColor}>{line}</text>
            </g>
          );
        })}
      </g>

      {/* Pen tip */}
      {isWriting && trailMasterAlpha > 0 && (() => {
        const li         = penPos.li;
        const cumBefore  = lines.slice(0, li).reduce((s, l) => s + l.length, 0);
        const distToEnd  = (cumBefore + lines[li].length) - penCharProg;
        const fadeWindow = 15 / framesPerChar;
        const pta        = Math.min(1, distToEnd / fadeWindow);
        const rs         = lerp(0.25, 1.0, pta);
        return (
          <g opacity={pta}>
            <circle cx={penPos.x} cy={penPos.y} r={28  * rs} fill="rgba(210,210,230,0.06)" />
            <circle cx={penPos.x} cy={penPos.y} r={14  * rs} fill="rgba(215,215,235,0.18)" />
            <circle cx={penPos.x} cy={penPos.y} r={6   * rs} fill="rgba(220,220,230,0.85)" filter="url(#q-pen-glow)" />
            <circle cx={penPos.x} cy={penPos.y} r={2.6 * rs} fill="rgba(240,240,255,0.98)" />
          </g>
        );
      })()}
    </svg>
  );
}

// ── Schema + Types ────────────────────────────────────────────────────────────
export const organicPaperSchema = z.object({
  grainIntensity: z.number().min(0.5).max(2.0),
  inkDensity:     z.number().min(0.5).max(2.0),
  quotes:         z.array(z.string()),
  textColor:      z.string(),
  animationSpeed: z.number().min(0.25).max(4.0),
  orbOpacity:     z.number().min(0).max(1),
});

type Props = z.infer<typeof organicPaperSchema>;

// ── Component ─────────────────────────────────────────────────────────────────
export const OrganicPaper: React.FC<Props> = ({ grainIntensity, inkDensity, quotes, textColor, animationSpeed, orbOpacity }) => {
  useLato();
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  const t   = frame / LOOP_FRAMES;
  const MIN = Math.min(W, H);

  const grainSeed    = frame % 512;
  const breathe1     = osc(t, 9,   0.50) * 0.5 + 0.5;
  const breathe2     = osc(t, 21,  1.20) * 0.5 + 0.5;
  const flicker      = osc(t, 159, 0.0)  * 0.5 + 0.5;
  const flickerAlpha = (0.048 + flicker * 0.072 * grainIntensity).toFixed(4);
  const fiberAngle1  = (1.8  + osc(t, 6, 0.0) * 1.1).toFixed(2);
  const fiberAngle2  = (89.4 + osc(t, 9, 1.8) * 0.8).toFixed(2);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#1c0d05", overflow: "hidden" }}>

      {/* ── Subtle paper fiber — very faint, just adds texture ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `repeating-linear-gradient(${fiberAngle1}deg, transparent 0px, rgba(55,28,8,0.28) 1px, transparent 2px, rgba(38,18,5,0.14) 5px, transparent 6px)`,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `repeating-linear-gradient(${fiberAngle2}deg, transparent 0px, rgba(44,22,6,0.16) 1px, transparent 4px)`,
        opacity: 0.7,
      }} />

      {/* ── Glowing orbs — large soft fog-light, deepest layer ── */}
      {ORB_DEFS.map((b, i) => {
        const x   = (b.bcx + osc(t, b.fx, b.px) * b.ax) * W;
        const y   = (b.bcy + osc(t, b.fy, b.py) * b.ay) * H;
        const rx  = 300 + osc(t, b.frx, b.pRx) * 20;
        const ry  = 300 + osc(t, b.fry, b.pRy) * 15;
        const rot = (osc(t, b.rotFreq, b.rotPhase) * b.rotAmp).toFixed(4);
        const pulse = osc(t, b.pulseFreq, b.pulsePhase) * 0.5 + 0.5;
        const op  = (orbOpacity * (0.65 + pulse * 0.35)).toFixed(3);
        const op2 = (orbOpacity * 0.45 * (0.65 + pulse * 0.35)).toFixed(3);
        return (
          <div key={`orb-${i}`} style={{
            position: "absolute",
            width: rx * 2, height: ry * 2,
            left: x - rx, top: y - ry,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at center, rgba(${b.r},${b.g},${b.b},${op}) 0%, rgba(${b.r},${b.g},${b.b},${op2}) 45%, transparent 100%)`,
            filter: `blur(${b.blur}px)`,
            transform: `rotate(${rot}rad)`,
          }} />
        );
      })}

      {/* ── Warm ink blobs — slow organic dark masses ── */}
      {INK_DEFS.map((b, i) => {
        const x   = (b.bx + osc(t, b.fx, b.px) * b.ax) * W;
        const y   = (b.by + osc(t, b.fy, b.py) * b.ay) * H;
        const rx  = (b.rx + osc(t, b.frx, b.pRx) * 0.018) * MIN;
        const ry  = (b.ry + osc(t, b.fry, b.pRy) * 0.014) * MIN;
        const rot = (osc(t, b.rotFreq, b.rotPhase) * b.rotAmp).toFixed(4);
        const w   = b.warmth;
        // warm blobs: dark amber; cold blobs: dark purple-grey
        const r1  = Math.round(lerp(22, 72, w));
        const g1  = Math.round(lerp(8,  26, w));
        const bv  = Math.round(lerp(20, 6,  w));
        const op  = (b.opacity * inkDensity * (0.55 + breathe2 * 0.45)).toFixed(3);
        const op2 = (b.opacity * inkDensity * 0.30).toFixed(3);
        return (
          <div key={`ink-${i}`} style={{
            position: "absolute",
            width: rx * 2, height: ry * 2,
            left: x - rx, top: y - ry,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at ${b.gcx}% ${b.gcy}%, rgba(${r1},${g1},${bv},${op}) 0%, rgba(${Math.round(r1 * 0.3)},${Math.round(g1 * 0.3)},${Math.round(bv * 0.3)},${op2}) 55%, transparent 100%)`,
            filter: `blur(${b.blur}px)`,
            transform: `rotate(${rot}rad)`,
          }} />
        );
      })}

      {/* ── SVG layer: grain + Lissajous curves + red threads ── */}
      <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={W} height={H}>
        <defs>
          <filter id="op-grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72 0.68" numOctaves="4" seed={grainSeed} result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
            <feComponentTransfer in="grey" result="punched">
              <feFuncR type="linear" slope="2.6" intercept="-0.55" />
              <feFuncG type="linear" slope="2.6" intercept="-0.55" />
              <feFuncB type="linear" slope="2.6" intercept="-0.55" />
            </feComponentTransfer>
          </filter>
          {/* Soft glow behind the organic curves */}
          <filter id="curve-glow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="5" />
          </filter>

        </defs>

        {/* Film grain */}
        <rect x={0} y={0} width={W} height={H}
          fill={`rgba(28,14,4,${(0.88 + breathe1 * 0.06).toFixed(3)})`}
          filter="url(#op-grain)"
          opacity={(0.38 + breathe2 * 0.16) * grainIntensity}
          style={{ mixBlendMode: "overlay" }}
        />

        {/* Organic Lissajous curves — blurred glow pass */}
        <g filter="url(#curve-glow)">
          {CURVE_DEFS.map((c, i) => {
            const phaseShift = osc(t, c.driftFreq, c.driftPhase) * c.driftAmp;
            const pulse      = osc(t, c.pulseFreq, c.pulsePhase) * 0.5 + 0.5;
            const alpha      = (c.baseAlpha * (0.35 + pulse * 0.65) * 0.6).toFixed(3);
            const d          = buildLissajousPath(c.fx, c.fy, c.periods, c.nSamples, c.cx, c.cy, c.ax, c.ay, c.phX, c.phY, phaseShift, W, H);
            return <path key={`cg-${i}`} d={d} stroke={`hsla(${c.hue},${c.sat}%,${c.light}%,${alpha})`} strokeWidth={c.width + 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
          })}
        </g>

        {/* Organic Lissajous curves — crisp pass */}
        {CURVE_DEFS.map((c, i) => {
          const phaseShift = osc(t, c.driftFreq, c.driftPhase) * c.driftAmp;
          const pulse      = osc(t, c.pulseFreq, c.pulsePhase) * 0.5 + 0.5;
          const alpha      = (c.baseAlpha * (0.40 + pulse * 0.60)).toFixed(3);
          const d          = buildLissajousPath(c.fx, c.fy, c.periods, c.nSamples, c.cx, c.cy, c.ax, c.ay, c.phX, c.phY, phaseShift, W, H);
          return <path key={`cc-${i}`} d={d} stroke={`hsla(${c.hue},${c.sat}%,${c.light}%,${alpha})`} strokeWidth={c.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
        })}

        {/* Purple accent threads */}
        {PURPLE_THREADS.map((c, i) => {
          const phaseShift = osc(t, c.driftFreq, c.driftPhase) * c.driftAmp;
          const pulse      = osc(t, c.pulseFreq, c.pulsePhase) * 0.5 + 0.5;
          const alpha      = (0.25 * (0.55 + pulse * 0.45)).toFixed(3);
          const d          = buildLissajousPath(c.fx, c.fy, c.periods, c.nSamples, c.cx, c.cy, c.ax, c.ay, c.phX, c.phY, phaseShift, W, H);
          return <path key={`pt-${i}`} d={d} stroke={`rgba(120,40,160,${alpha})`} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
        })}

        {/* Red accent threads */}
        {THREAD_DEFS.map((c, i) => {
          const phaseShift = osc(t, c.driftFreq, c.driftPhase) * c.driftAmp;
          const pulse      = osc(t, c.pulseFreq, c.pulsePhase) * 0.5 + 0.5;
          const alpha      = (c.baseAlpha * (0.30 + pulse * 0.70)).toFixed(3);
          const d          = buildLissajousPath(c.fx, c.fy, c.periods, c.nSamples, c.cx, c.cy, c.ax, c.ay, c.phX, c.phY, phaseShift, W, H);
          return <path key={`th-${i}`} d={d} stroke={`rgba(185,22,18,${alpha})`} strokeWidth={c.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
        })}
      </svg>

      {/* ── Burnt vignette — main radial crush ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 72% 74% at 50% 50%, transparent 0%, rgba(5,2,1,0.18) 50%, rgba(3,1,0,0.66) 75%, rgba(1,0,0,0.95) 100%)`,
      }} />
      {/* Corner burns */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 38% 38% at   0%   0%, rgba(2,1,0,0.92) 0%, transparent 100%),
          radial-gradient(ellipse 38% 38% at 100%   0%, rgba(2,1,0,0.92) 0%, transparent 100%),
          radial-gradient(ellipse 38% 38% at   0% 100%, rgba(2,1,0,0.92) 0%, transparent 100%),
          radial-gradient(ellipse 38% 38% at 100% 100%, rgba(2,1,0,0.92) 0%, transparent 100%)
        `,
      }} />
      {/* Warm brown edge tint */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 58% 60% at 50% 50%, transparent 0%, rgba(12,4,1,0.50) 100%)`,
        mixBlendMode: "multiply",
      }} />

      {/* ── Exposure-gate flicker ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(${Math.round(20 + breathe1 * 10)},${Math.round(10 + breathe1 * 5)},${Math.round(3 + breathe1 * 2)},${flickerAlpha})`,
        mixBlendMode: "screen",
      }} />

      {/* ── Snake writing animation ── */}
      <QuoteLayer frame={frame} W={W} H={H} quotes={quotes} animationSpeed={animationSpeed} textColor={textColor} />

    </div>
  );
};
