import { useCurrentFrame, useVideoConfig, interpolate, delayRender, continueRender } from "remotion";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

function useFonts() {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    const urls = [
      "https://fonts.googleapis.com/css2?family=Lato:ital,wght@1,300;1,400&display=swap",
      "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@100;200;300&display=swap",
    ];
    let loaded = 0;
    urls.forEach(url => {
    let link = document.querySelector<HTMLLinkElement>(`link[href="${url}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel  = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
    const onLoad = () => {
      loaded++;
      if (loaded === urls.length) {
        Promise.all([
          document.fonts.load('italic 300 1em Lato'),
          document.fonts.load('200 1em "Josefin Sans"'),
        ])
          .then(() => continueRender(handle))
          .catch(() => continueRender(handle));
      }
    };
    if (link.sheet) { onLoad(); }
    else {
      link.addEventListener('load',  onLoad,                        { once: true });
      link.addEventListener('error', () => continueRender(handle), { once: true });
    }
    });
  }, [handle]);
}

const LOOP_FRAMES = 36000;
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
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Diamond meteor showers ────────────────────────────────────────────────────
const METEOR_DURATION = 180; // 6 seconds per shower
const METEOR_COUNT    = 900;

// 3 events, evenly spaced, away from V12_MOMENTS
const METEOR_EVENTS = [
  { frame: 9500,  angle: -42  }, // top-right to bottom-left
  { frame: 18000, angle: 128  }, // bottom-right to top-left
  { frame: 22500, angle: -135 }, // top-left to bottom-right
];

function DiamondShowers({ frame, W, H }: { frame: number; W: number; H: number }) {
  const elements: React.ReactElement[] = [];

  for (const evt of METEOR_EVENTS) {
    const local = frame - evt.frame;
    if (local < 0 || local >= METEOR_DURATION) continue;

    const progress = local / METEOR_DURATION;
    const masterAlpha = progress < 0.20
      ? progress / 0.20
      : progress > 0.80
        ? (1 - progress) / 0.20
        : 1.0;

    const rad    = evt.angle * Math.PI / 180;
    const dx     = Math.cos(rad);
    const dy     = Math.sin(rad);
    const travel = Math.sqrt(W * W + H * H) * 1.1;
    const px     = -dy;
    const py     = dx;

    const meteors: React.ReactElement[] = [];
    for (let i = 0; i < METEOR_COUNT; i++) {
      const h1 = hash(i * 7  + evt.frame * 0.01 + 1);
      const h2 = hash(i * 13 + evt.frame * 0.01 + 2);
      const h3 = hash(i * 17 + evt.frame * 0.01 + 3);
      const h4 = hash(i * 23 + evt.frame * 0.01 + 4);
      const h5 = hash(i * 31 + evt.frame * 0.01 + 5);
      const h6 = hash(i * 37 + evt.frame * 0.01 + 6);

      const speed      = 0.4 + h3 * 0.6;
      const t          = ((progress * speed) + h4) % 1.0;
      const perpOffset = (h1 - 0.5) * Math.sqrt(W * W + H * H) * 1.2;
      const startX     = W / 2 + px * perpOffset - dx * travel * 0.5;
      const startY     = H / 2 + py * perpOffset - dy * travel * 0.5;
      const x          = startX + dx * t * travel;
      const y          = startY + dy * t * travel;
      const r          = 0.8 + h2 * 2.2;

      const sparkleFreq  = 4 + h5 * 8;
      const sparklePhase = h6 * TAU;
      const sparkle      = Math.sin(progress * sparkleFreq * TAU + sparklePhase) * 0.5 + 0.5;
      const baseOpacity  = 0.55 + sparkle * 0.45;

      const cr      = Math.round(210 + h1 * 45);
      const cg      = Math.round(220 + h2 * 35);
      const opacity = (baseOpacity * masterAlpha).toFixed(3);
      const tailLen = r * (3 + h3 * 6);
      const x2      = x - dx * tailLen;
      const y2      = y - dy * tailLen;

      meteors.push(
        <g key={i}>
          <line
            x1={x} y1={y} x2={x2} y2={y2}
            stroke={`rgba(${cr},${cg},255,${(parseFloat(opacity) * 0.4).toFixed(3)})`}
            strokeWidth={r * 0.6}
            strokeLinecap="round"
          />
          <circle cx={x} cy={y} r={r}
            fill={`rgba(${cr},${cg},255,${opacity})`}
          />
          {sparkle > 0.7 && (
            <circle cx={x} cy={y} r={r * 3}
              fill={`rgba(${cr},${cg},255,${(sparkle * 0.18 * masterAlpha).toFixed(3)})`}
            />
          )}
        </g>
      );
    }

    elements.push(
      <svg key={evt.frame}
        style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}
        width={W} height={H}
      >
        {meteors}
      </svg>
    );
  }

  return <>{elements}</>;
}


// ── Name overlays — appear 3s before spoken, visible 5s, then fade ───────────
// Positions avoid center (quotes) and subtitle zone (bottom)
const NAME_EVENTS = [
  { name: "Camille Claudel", showFrame: 7682, x: 0.60, y: 0.10 },
  { name: "Rodin",           showFrame: 7960, x: 0.05, y: 0.30 },
  { name: "David Buss",      showFrame: 9560, x: 0.70, y: 0.72 },
  { name: "Orpheus",         showFrame: 11977, x: 0.06, y: 0.09 },
  { name: "Hades",           showFrame: 12365, x: 0.74, y: 0.26 },
  { name: "Eurydice",        showFrame: 12522, x: 0.05, y: 0.68 },
  { name: "Marcel Proust",   showFrame: 17965, x: 0.62, y: 0.12 },
  { name: "Pablo Picasso",   showFrame: 22057, x: 0.04, y: 0.28 },
  { name: "Dora Maar",       showFrame: 22247, x: 0.72, y: 0.65 },
  { name: "John Gottman",    showFrame: 23369, x: 0.06, y: 0.75 },
];
const NAME_VISIBLE  = 150; // 5 seconds
const NAME_FADE_IN  = 30;  // 1 second fade in
const NAME_FADE_OUT = 40;  // ~1.3 second fade out

function NameOverlays({ frame, W, H }: { frame: number; W: number; H: number }) {
  const fontSize = W * 0.028;
  const elements: React.ReactElement[] = [];

  for (const evt of NAME_EVENTS) {
    const local = frame - evt.showFrame;
    if (local < 0 || local >= NAME_VISIBLE + NAME_FADE_OUT) continue;

    let alpha: number;
    if (local < NAME_FADE_IN) {
      alpha = local / NAME_FADE_IN;
    } else if (local < NAME_VISIBLE) {
      alpha = 1.0;
    } else {
      alpha = Math.max(0, 1 - (local - NAME_VISIBLE) / NAME_FADE_OUT);
    }
    if (alpha <= 0) continue;

    elements.push(
      <div key={evt.name} style={{
        position: "absolute",
        left: evt.x * W,
        top:  evt.y * H,
        opacity: alpha,
        fontFamily: '"Josefin Sans", sans-serif',
        fontWeight: 200,
        fontSize,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(220, 210, 210, 0.88)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        textShadow: "0 0 32px rgba(180,140,160,0.45)",
      }}>
        {evt.name}
      </div>
    );
  }

  return <>{elements}</>;
}

// ── Opening phases ────────────────────────────────────────────────────────────
const OPEN_BLACK_END   = 300;  // 10s pure black (music intro)
const OPEN_BLOOM_START = 300;  // ink starts blooming at 10s
const OPEN_BLOOM_PEAK  = 750;  // 25s — ink has spread
const OPEN_ATMO_START  = 600;  // 20s — blue atmosphere starts creeping in
const OPEN_FULL        = 1200; // 40s — full atmosphere established

// ── Moment pulse ──────────────────────────────────────────────────────────────
const PULSE_DECAY = 120;
function momentPulse(frame: number, moments: number[]): number {
  if (!moments || moments.length === 0) return 0;
  let closest = Infinity;
  for (const m of moments) {
    const d = Math.abs(frame - m);
    if (d < closest) closest = d;
  }
  return Math.max(0, 1 - closest / PULSE_DECAY);
}

// ── V12 Color palette — crimson + deep indigo + black + dark green ────────────
// 4 color families, each blob has a base color + moment color
const BLOB_COLORS = [
  { base: [80, 4, 10],   moment: [160, 8, 18]  },  // crimson
  { base: [2, 2, 16],    moment: [5, 4, 35]    },  // deep indigo
  { base: [4, 28, 12],   moment: [8, 60, 22]   },  // dark green
  { base: [10, 4, 14],   moment: [30, 8, 40]   },  // deep purple-black
];

const INK_DEFS = Array.from({ length: 14 }, (_, i) => {
  const h = (n: number) => hash(i * 13 + n + 200);
  const colorIdx = i % 4;  // distribute across 4 color families
  return {
    bx:       0.05 + h(0) * 0.90,
    by:       0.05 + h(1) * 0.90,
    fx:       1 + Math.floor(h(2) * 3),
    fy:       1 + Math.floor(h(3) * 3),
    px:       h(4) * TAU,
    py:       h(5) * TAU,
    ax:       0.03 + h(6) * 0.08,
    ay:       0.02 + h(7) * 0.06,
    rx:       0.08 + h(8) * 0.20,
    ry:       0.06 + h(9) * 0.15,
    frx:      1 + Math.floor(h(10) * 3),
    pRx:      h(11) * TAU,
    fry:      1 + Math.floor(h(12) * 3),
    pRy:      h(13) * TAU,
    opacity:  0.10 + h(15) * 0.14,
    blur:     28 + h(16) * 40,
    rotFreq:  1 + Math.floor(h(17) * 3),
    rotPhase: h(18) * TAU,
    rotAmp:   0.10 + h(19) * 0.35,
    gcx:      30 + h(20) * 40,
    gcy:      28 + h(21) * 34,
    colorIdx,
    // Each blob reacts to a different moment (distributed)
    momentOffset: Math.floor(h(23) * 3),  // slight delay variation per blob
  };
});

// ── Lissajous curves — sharper, high-contrast ────────────────────────────────
const CURVE_PAIRS: Array<[number, number]> = [
  [1, 2], [2, 3], [3, 5], [4, 7], [3, 4], [5, 8], [2, 5],
];

const CURVE_DEFS = CURVE_PAIRS.map(([fx, fy], i) => {
  const h       = (n: number) => hash(i * 17 + n + 600);
  const periods = lcm(fx, fy);
  const isCrimson = i % 2 === 0;
  return {
    fx, fy, periods,
    nSamples:   isCrimson ? Math.min(periods * 48, 420) : Math.min(periods * 8, 72),
    driftFreq:  1 + Math.floor(h(0) * 4),
    driftPhase: h(1) * TAU,
    driftAmp:   0.6 + h(2) * 1.4,
    phX:        h(3) * TAU,
    phY:        h(4) * TAU,
    cx:         0.28 + h(5) * 0.44,
    cy:         0.22 + h(6) * 0.56,
    ax:         0.22 + h(7) * 0.32,
    ay:         0.16 + h(8) * 0.28,
    baseAlpha:  0.55 + h(12) * 0.35,
    width:      2.5  + h(13) * 4.0,   // boosted for 4K visibility
    depth:      0.5  + h(18) * 0.5,   // 0=far/thin/dark, 1=near/thick/bright
    pulseFreq:  2 + Math.floor(h(14) * 5),
    pulsePhase: h(15) * TAU,
    isCrimson,
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
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let j = 1; j < pts.length - 1; j++) {
    const mx = ((pts[j][0] + pts[j + 1][0]) / 2).toFixed(1);
    const my = ((pts[j][1] + pts[j + 1][1]) / 2).toFixed(1);
    d += ` Q ${pts[j][0].toFixed(1)} ${pts[j][1].toFixed(1)} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`;
  return d;
}

// ── Quote system ──────────────────────────────────────────────────────────────
const Q_FONT          = '"Lato", sans-serif';
const Q_SIZE          = 104;
const Q_LSPACE        = 1;
const Q_CHAR_W        = Q_SIZE * 0.52 + Q_LSPACE;
const Q_LINE_H        = Q_SIZE * 1.60;
const Q_CENTER_Y_FRAC = 0.50;
const Q_MAX_W_FRAC    = 0.80;
const DEFAULT_FRAMES_PER_CHAR = 14;
const HOLD_FRAMES             = 210;
const HOLD_FRAMES_FROZEN      = 600;
const FADE_FRAMES             = 120;
const GAP_FRAMES              = 90;
const QUOTES_START            = 1800;  // quotes start at 60s
const TRAIL_SAMPLES           = 28;
const TRAIL_STEP              = 3;
const TRAIL_DRAIN_FRAMES      = 30;

function wrapText(text: string, maxLineChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const candidate = cur ? `${cur} ${word}` : word;
    if (candidate.length <= maxLineChars) { cur = candidate; }
    else { if (cur) lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function charToXY(charProg: number, lines: string[], W: number, H: number) {
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
  const li = lines.length - 1;
  const lineW = lines[li].length * Q_CHAR_W;
  return { x: W / 2 - lineW / 2 + lines[li].length * Q_CHAR_W, y: centerY + (li - (lines.length - 1) / 2) * Q_LINE_H, li };
}

function getPenPos(localFrame: number, writeDur: number, lines: string[], W: number, H: number) {
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

interface QuoteEntry { text: string; startFrame: number; writeDur: number; cycleDur: number; }

function buildQuoteSchedule(quotes: string[], framesPerChar: number, frozenQuoteIndex?: number, durationInFrames?: number): QuoteEntry[] {
  const maxWriteDur = 540;

  // First pass: natural durations
  const naturals = quotes.map((text, qi) => {
    const charCount  = text.replace(/\n/g, "").length;
    const writeDur   = Math.min(charCount * framesPerChar, maxWriteDur);
    const isFrozen   = qi === frozenQuoteIndex;
    const holdFrames = isFrozen ? HOLD_FRAMES_FROZEN : HOLD_FRAMES;
    const cycleDur   = writeDur + holdFrames + FADE_FRAMES + GAP_FRAMES;
    return { text, writeDur, cycleDur };
  });

  // Distribute evenly across available video time
  const naturalTotal  = naturals.reduce((s, n) => s + n.cycleDur, 0);
  const available     = (durationInFrames ?? 0) - QUOTES_START;
  const extraPerQuote = available > naturalTotal && quotes.length > 0
    ? Math.floor((available - naturalTotal) / quotes.length)
    : 0;

  let offset = 0;
  return naturals.map((n, qi) => {
    const isFrozen   = qi === frozenQuoteIndex;
    const holdFrames = isFrozen ? HOLD_FRAMES_FROZEN : HOLD_FRAMES;
    const cycleDur   = n.writeDur + holdFrames + FADE_FRAMES + GAP_FRAMES + extraPerQuote;
    const entry = { text: n.text, startFrame: QUOTES_START + offset, writeDur: n.writeDur, cycleDur };
    offset += cycleDur;
    return entry;
  });
}

function QuoteLayer({ frame, W, H, quotes, animationSpeed, textColor, frozenQuoteIndex }: {
  frame: number; W: number; H: number;
  quotes: string[]; animationSpeed: number; textColor: string;
  frozenQuoteIndex?: number;
}) {
  const { durationInFrames } = useVideoConfig();
  const framesPerChar = Math.max(1, Math.round(DEFAULT_FRAMES_PER_CHAR / animationSpeed));
  const schedule = useMemo(
    () => buildQuoteSchedule(quotes, framesPerChar, frozenQuoteIndex, durationInFrames),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quotes.join("|||"), framesPerChar, frozenQuoteIndex, durationInFrames],
  );
  let entry: QuoteEntry | null = null;
  for (const e of schedule) {
    if (frame >= e.startFrame && frame < e.startFrame + e.cycleDur) { entry = e; break; }
  }
  if (!entry) return null;

  const localFrame    = frame - entry.startFrame;

  // Split quote text from author (separated by " — ")
  const rawText     = entry.text;
  const sepIdx      = rawText.lastIndexOf(" — ");
  const quoteText   = sepIdx > -1 ? rawText.slice(0, sepIdx) : rawText;
  const authorText  = sepIdx > -1 ? rawText.slice(sepIdx + 3) : "";

  const maxLineChars  = Math.floor((W * Q_MAX_W_FRAC) / Q_CHAR_W);
  const lines         = quoteText.split("\n").flatMap(p => wrapText(p, maxLineChars));
  const totalChars    = lines.reduce((s, l) => s + l.length, 0);
  const writeProgress = Math.min(localFrame / entry.writeDur, 1.0);
  const isWriting     = writeProgress < 0.9999;
  const penCharProg   = writeProgress * totalChars;
  const isFrozen      = quotes.indexOf(entry.text) === frozenQuoteIndex;
  const holdDur       = isFrozen ? HOLD_FRAMES_FROZEN : HOLD_FRAMES;
  const fadeStart     = entry.writeDur + holdDur;
  if (localFrame >= fadeStart + FADE_FRAMES) return null;

  let textAlpha: number;
  if (localFrame < entry.writeDur) {
    textAlpha = 1.0;
  } else if (localFrame < fadeStart) {
    if (isFrozen) {
      const holdProgress = (localFrame - entry.writeDur) / holdDur;
      textAlpha = 0.85 + 0.15 * Math.cos(holdProgress * TAU);
    } else { textAlpha = 1.0; }
  } else {
    textAlpha = Math.max(0, 1 - (localFrame - fadeStart) / FADE_FRAMES);
  }

  const centerY = H * Q_CENTER_Y_FRAC;
  const penPos  = getPenPos(localFrame, entry.writeDur, lines, W, H)!;

  type TrailPt = { x: number; y: number; li: number };
  const rawPts: Array<TrailPt | null> = [];
  for (let i = 0; i < TRAIL_SAMPLES; i++) {
    rawPts.push(getPenPos(localFrame - i * TRAIL_STEP, entry.writeDur, lines, W, H));
  }
  const framesAfterWrite = isWriting ? 0 : (localFrame - entry.writeDur);
  const trailMasterAlpha = Math.max(0, isWriting ? 1.0 : 1 - framesAfterWrite / TRAIL_DRAIN_FRAMES);
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
              <rect x={W / 2 - line.length * Q_CHAR_W / 2 - 8} y={lineY - Q_SIZE * 1.5}
                width={Math.max(0, charsReveal * Q_CHAR_W + 16)} height={Q_SIZE * 3.0} />
            </clipPath>
          );
        })}
      </defs>

      {trailMasterAlpha > 0 && segments.length > 0 && (
        <g opacity={trailMasterAlpha}>
          <g filter="url(#q-trail-blur)">
            {segments.map(({ x1, y1, x2, y2, idx }) => {
              const r = idx / (TRAIL_SAMPLES - 2);
              return <line key={`tg-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={`rgba(220,180,200,${((1 - r) * 0.55).toFixed(3)})`}
                strokeWidth={lerp(9, 1.5, r)} strokeLinecap="round" />;
            })}
          </g>
          {segments.map(({ x1, y1, x2, y2, idx }) => {
            const r = idx / (TRAIL_SAMPLES - 2);
            return <line key={`tc-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`rgba(225,190,210,${((1 - r) * 0.88).toFixed(3)})`}
              strokeWidth={lerp(4.2, 0.35, r)} strokeLinecap="round" />;
          })}
          {segments.map(({ x1, y1, x2, y2, idx }) => {
            const r = idx / (TRAIL_SAMPLES - 2);
            if (r > 0.50) return null;
            return <line key={`th-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`rgba(235,200,220,${((1 - r / 0.50) * 0.52).toFixed(3)})`}
              strokeWidth={lerp(1.8, 0.2, r / 0.50)} strokeLinecap="round" />;
          })}
        </g>
      )}

      <g opacity={textAlpha}>
        {lines.map((line, li) => {
          const lineY = centerY + (li - (lines.length - 1) / 2) * Q_LINE_H;
          return (
            <g key={li} clipPath={`url(#qcp-${li})`}>
              <text x={W / 2} y={lineY + 6} textAnchor="middle" fontFamily={Q_FONT}
                fontStyle="italic" fontWeight="300" fontSize={Q_SIZE} letterSpacing={Q_LSPACE}
                fill="rgba(0,0,0,0.70)" filter="url(#q-text-shadow)">{line}</text>
              <text x={W / 2} y={lineY} textAnchor="middle" fontFamily={Q_FONT}
                fontStyle="italic" fontWeight="300" fontSize={Q_SIZE} letterSpacing={Q_LSPACE}
                fill={textColor} opacity={0.30} filter="url(#q-text-glow)">{line}</text>
              <text x={W / 2} y={lineY} textAnchor="middle" fontFamily={Q_FONT}
                fontStyle="italic" fontWeight="300" fontSize={Q_SIZE} letterSpacing={Q_LSPACE}
                fill={textColor}>{line}</text>
            </g>
          );
        })}
        {/* Author — appears after writing completes, same style as quote */}
        {authorText && !isWriting && (() => {
          const lastLineY = centerY + ((lines.length - 1) / 2) * Q_LINE_H;
          const authorY   = lastLineY + Q_LINE_H * 1.1;
          const authorSize = Q_SIZE * 0.72;
          const authorAlpha = Math.min(1, (localFrame - entry.writeDur) / 20);
          return (
            <text
              x={W / 2} y={authorY}
              textAnchor="middle"
              fontFamily={Q_FONT}
              fontStyle="italic"
              fontWeight="300"
              fontSize={authorSize}
              letterSpacing={Q_LSPACE}
              fill={textColor}
              opacity={0.75 * authorAlpha}
            >
              — {authorText}
            </text>
          );
        })()}
      </g>

      {isWriting && trailMasterAlpha > 0 && (() => {
        const li         = penPos.li;
        const cumBefore  = lines.slice(0, li).reduce((s, l) => s + l.length, 0);
        const distToEnd  = (cumBefore + lines[li].length) - penCharProg;
        const fadeWindow = 15 / framesPerChar;
        const pta        = Math.min(1, distToEnd / fadeWindow);
        const rs         = lerp(0.25, 1.0, pta);
        return (
          <g opacity={pta}>
            <circle cx={penPos.x} cy={penPos.y} r={28  * rs} fill="rgba(220,180,200,0.06)" />
            <circle cx={penPos.x} cy={penPos.y} r={14  * rs} fill="rgba(225,185,205,0.18)" />
            <circle cx={penPos.x} cy={penPos.y} r={6   * rs} fill="rgba(230,190,210,0.85)" filter="url(#q-pen-glow)" />
            <circle cx={penPos.x} cy={penPos.y} r={2.6 * rs} fill="rgba(245,210,225,0.98)" />
          </g>
        );
      })()}
    </svg>
  );
}

// ── Schema ────────────────────────────────────────────────────────────────────
export const organicPaperV12Schema = z.object({
  grainIntensity:   z.number().min(0.5).max(2.0),
  inkDensity:       z.number().min(0.5).max(2.0),
  quotes:           z.array(z.string()),
  textColor:        z.string(),
  animationSpeed:   z.number().min(0.25).max(4.0),
  orbOpacity:       z.number().min(0).max(1),
  momentFrames:     z.array(z.number()).optional(),
  frozenQuoteIndex: z.number().optional(),
});

type Props = z.infer<typeof organicPaperV12Schema>;

// ── Component ─────────────────────────────────────────────────────────────────
export const OrganicPaperV12: React.FC<Props> = ({
  grainIntensity, inkDensity, quotes, textColor, animationSpeed, orbOpacity,
  momentFrames = [],
  frozenQuoteIndex,
}) => {
  useFonts();
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const MIN = Math.min(W, H);
  const t   = frame / LOOP_FRAMES;

  // ── Opening animation values ──────────────────────────────────────────────
  // Ink bloom radius: 0 → full diagonal
  const maxRadius = Math.sqrt(W * W + H * H) / 2;

  const inkBloomRadius = interpolate(
    frame,
    [OPEN_BLOOM_START, OPEN_BLOOM_PEAK],
    [0, maxRadius * 1.1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 2.8) }  // ease-out heavy
  );

  const inkBloomOpacity = interpolate(
    frame,
    [OPEN_BLOOM_START, OPEN_BLOOM_START + 30, OPEN_BLOOM_PEAK, OPEN_FULL],
    [0, 0.85, 0.65, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Atmosphere fade-in (blobs, curves)
  const atmoAlpha = interpolate(
    frame,
    [OPEN_ATMO_START, OPEN_FULL],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp",
      easing: easeInOut }
  );

  // Overall grain/flicker (fades in with atmosphere)
  const grainAlpha = interpolate(
    frame,
    [OPEN_ATMO_START, OPEN_FULL],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Background: pure black → deep indigo-black
  const bgB = Math.round(interpolate(frame, [0, OPEN_FULL], [0, 10],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  // ── Per-frame values ──────────────────────────────────────────────────────
  const mPulse       = momentPulse(frame, momentFrames);
  const grainSeed    = frame % 512;
  const breathe1     = osc(t, 9,   0.50) * 0.5 + 0.5;
  const breathe2     = osc(t, 21,  1.20) * 0.5 + 0.5;
  const flicker      = osc(t, 159, 0.0)  * 0.5 + 0.5;
  const flickerAlpha = ((0.048 + flicker * 0.072 * grainIntensity) * grainAlpha).toFixed(4);
  const fiberAngle1  = (1.8  + osc(t, 6, 0.0) * 1.1).toFixed(2);
  const fiberAngle2  = (89.4 + osc(t, 9, 1.8) * 0.8).toFixed(2);
  const inkDensityLive = inkDensity * (1 + mPulse * 0.50) * atmoAlpha;

  return (
    <div style={{ position: "absolute", inset: 0, background: `rgb(2,1,${bgB})`, overflow: "hidden" }}>

      {/* ── Opening text: "You think you love." ── */}
      {frame < OPEN_BLOOM_PEAK && (() => {
        // Appear: frames 20–90, Hold: 90–240, Fade: 240–300
        const textAlpha = interpolate(frame,
          [20, 90, 240, 300],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (textAlpha <= 0) return null;
        return (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: textAlpha,
          }}>
            <div style={{
              fontFamily: '"Josefin Sans", sans-serif',
              fontWeight: 200,
              fontSize: W * 0.028,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(220, 210, 210, 0.92)",
              textAlign: "center",
            }}>
              You think you love.
            </div>
          </div>
        );
      })()}

      {/* ── Opening: red ink bloom from center ── */}
      {inkBloomRadius > 0 && (
        <svg style={{ position: "absolute", inset: 0 }} width={W} height={H}>
          <defs>
            <filter id="ink-bloom-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feTurbulence type="turbulence" baseFrequency="0.008 0.012"
                numOctaves="3" seed={42} result="noise" />
              <feDisplacementMap in="blur" in2="noise" scale="80"
                xChannelSelector="R" yChannelSelector="G" result="displaced" />
              <feComposite in="displaced" in2="blur" operator="over" />
            </filter>
            <radialGradient id="ink-bloom-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(160,6,12,1)" />
              <stop offset="35%"  stopColor="rgba(110,4,10,0.85)" />
              <stop offset="70%"  stopColor="rgba(60,2,8,0.5)" />
              <stop offset="100%" stopColor="rgba(20,0,4,0)" />
            </radialGradient>
          </defs>
          <ellipse
            cx={W / 2} cy={H / 2}
            rx={inkBloomRadius} ry={inkBloomRadius * 0.88}
            fill="url(#ink-bloom-grad)"
            opacity={inkBloomOpacity}
            filter="url(#ink-bloom-blur)"
          />
          {/* Secondary tendrils */}
          {[0, 72, 144, 216, 288].map((angleDeg, i) => {
            const rad = angleDeg * Math.PI / 180;
            const tendrilR = inkBloomRadius * (0.55 + hash(i * 7) * 0.35);
            const ex = W / 2 + Math.cos(rad) * tendrilR * 0.6;
            const ey = H / 2 + Math.sin(rad) * tendrilR * 0.45;
            return (
              <ellipse key={i}
                cx={ex} cy={ey}
                rx={tendrilR * (0.15 + hash(i * 3) * 0.12)}
                ry={tendrilR * (0.10 + hash(i * 5) * 0.09)}
                fill={`rgba(${120 + Math.round(hash(i) * 40)}, 4, 8, ${(inkBloomOpacity * (0.4 + hash(i * 11) * 0.3)).toFixed(3)})`}
                filter="url(#ink-bloom-blur)"
                transform={`rotate(${angleDeg + 30}, ${ex}, ${ey})`}
              />
            );
          })}
        </svg>
      )}

      {/* ── Paper fiber texture (fades in with atmosphere) ── */}
      <div style={{
        position: "absolute", inset: 0, opacity: atmoAlpha * 0.7,
        background: `repeating-linear-gradient(${fiberAngle1}deg, transparent 0px, rgba(40,10,20,0.22) 1px, transparent 2px, rgba(15,5,25,0.12) 5px, transparent 6px)`,
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: atmoAlpha * 0.5,
        background: `repeating-linear-gradient(${fiberAngle2}deg, transparent 0px, rgba(10,8,30,0.14) 1px, transparent 4px)`,
      }} />
      {/* ── Atmospheric background — no blur, no filter ── */}
      <div style={{
        position: "absolute", inset: 0, opacity: atmoAlpha,
        background: `radial-gradient(ellipse 80% 60% at 30% 40%, rgba(8,4,45,${(0.55 + breathe1 * 0.15).toFixed(3)}) 0%, transparent 70%),
                     radial-gradient(ellipse 60% 70% at 75% 65%, rgba(45,4,8,${(0.45 + breathe2 * 0.15).toFixed(3)}) 0%, transparent 65%),
                     radial-gradient(ellipse 50% 40% at 15% 75%, rgba(4,20,8,${(0.30 + breathe1 * 0.10).toFixed(3)}) 0%, transparent 60%)`,
      }} />

      {/* ── SVG: Lissajous curves only — renders AFTER blobs ── */}
      <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={W} height={H}>
        <defs>
          <filter id="curve-glow-sharp" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* Lissajous curves — glow pass */}
        <g filter="url(#curve-glow-sharp)" opacity={atmoAlpha}>
          {CURVE_DEFS.map((c, i) => {
            const phaseShift = osc(t, c.driftFreq, c.driftPhase) * c.driftAmp;
            const pulse      = osc(t, c.pulseFreq, c.pulsePhase) * 0.5 + 0.5;
            const alpha      = (c.baseAlpha * (0.35 + pulse * 0.65) * (0.3 + c.depth * 0.7)).toFixed(3);
            const d          = buildLissajousPath(c.fx, c.fy, c.periods, c.nSamples, c.cx, c.cy, c.ax, c.ay, c.phX, c.phY, phaseShift, W, H);
            const w          = (c.width + 2.5) * (0.3 + c.depth * 0.7);
            const color      = c.isCrimson
              ? `rgba(240,22,30,${alpha})`
              : `rgba(80,120,255,${(c.baseAlpha * (0.35 + pulse * 0.65) * (0.5 + c.depth * 0.5) * 0.8).toFixed(3)})`;
            return <path key={`cg-${i}`} d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
          })}
        </g>

        {/* Lissajous curves — crisp pass */}
        <g opacity={atmoAlpha}>
          {CURVE_DEFS.map((c, i) => {
            const phaseShift = osc(t, c.driftFreq, c.driftPhase) * c.driftAmp;
            const pulse      = osc(t, c.pulseFreq, c.pulsePhase) * 0.5 + 0.5;
            const alpha      = (c.baseAlpha * (0.55 + pulse * 0.45) * (0.3 + c.depth * 0.7)).toFixed(3);
            const d          = buildLissajousPath(c.fx, c.fy, c.periods, c.nSamples, c.cx, c.cy, c.ax, c.ay, c.phX, c.phY, phaseShift, W, H);
            const w          = c.width * (0.3 + c.depth * 0.7);
            const color      = c.isCrimson
              ? `rgba(250,25,35,${alpha})`
              : `rgba(100,150,255,${(c.baseAlpha * (0.55 + pulse * 0.45) * (0.5 + c.depth * 0.5) * 0.8).toFixed(3)})`;
            return <path key={`cc-${i}`} d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
          })}
        </g>
      </svg>

      {/* ── Deep vignette ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 82% 84% at 50% 50%, transparent 0%, rgba(1,0,4,0.12) 60%, rgba(0,0,2,0.55) 82%, rgba(0,0,1,0.88) 100%)`,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 28% 28% at   0%   0%, rgba(0,0,2,0.80) 0%, transparent 100%),
          radial-gradient(ellipse 28% 28% at 100%   0%, rgba(0,0,2,0.80) 0%, transparent 100%),
          radial-gradient(ellipse 28% 28% at   0% 100%, rgba(0,0,2,0.80) 0%, transparent 100%),
          radial-gradient(ellipse 28% 28% at 100% 100%, rgba(0,0,2,0.80) 0%, transparent 100%)
        `,
      }} />

      {/* ── Exposure flicker ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(${Math.round(8 + breathe1 * 6)},${Math.round(4 + breathe1 * 3)},${Math.round(12 + breathe1 * 8)},${flickerAlpha})`,
        mixBlendMode: "screen",
      }} />

      {/* ── Moment pulse — organic colored blooms ── */}
      {mPulse > 0.01 && (
        <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" } as React.CSSProperties} width={W} height={H}>
          <defs>
            {[
              { r: 255, g: 40, b: 60  },
              { r: 40,  g: 60, b: 255 },
              { r: 40,  g: 200, b: 60  },
              { r: 180, g: 40, b: 255 },
            ].map((c, i) => {
              const op = Math.min(0.80, mPulse * (0.85 + hash(i * 7 + 99) * 0.15)).toFixed(3);
              return (
                <radialGradient key={i} id={`mp-rg-${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={`rgb(${c.r},${c.g},${c.b})`} stopOpacity={op} />
                  <stop offset="100%" stopColor={`rgb(${c.r},${c.g},${c.b})`} stopOpacity="0" />
                </radialGradient>
              );
            })}
          </defs>
          {[
            { cx: 0.28, cy: 0.42, rx: 0.55, ry: 0.55 },
            { cx: 0.75, cy: 0.55, rx: 0.50, ry: 0.50 },
            { cx: 0.12, cy: 0.72, rx: 0.45, ry: 0.45 },
            { cx: 0.60, cy: 0.22, rx: 0.50, ry: 0.50 },
          ].map((blob, i) => (
            <ellipse key={i}
              cx={blob.cx * W} cy={blob.cy * H}
              rx={blob.rx * W} ry={blob.ry * H}
              fill={`url(#mp-rg-${i})`}
            />
          ))}
        </svg>
      )}

      {/* ── Name overlays ── */}
      <NameOverlays frame={frame} W={W} H={H} />

      {/* ── Diamond meteor showers ── */}
      <DiamondShowers frame={frame} W={W} H={H} />

      {/* ── Quote snake trail ── */}
      <QuoteLayer
        frame={frame} W={W} H={H}
        quotes={quotes} animationSpeed={animationSpeed} textColor={textColor}
        frozenQuoteIndex={frozenQuoteIndex}
      />

    </div>
  );
};
