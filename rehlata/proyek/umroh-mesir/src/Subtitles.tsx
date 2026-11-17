import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import words from "./words.json";
import { FPS, KEY_GRADIENT, WHITE_GRADIENT } from "./lib";
import { FONT } from "./ui";

type W = { text: string; start: number; end: number; key: boolean };
const WS = words as W[];

// Group words into short phrases (1-4 words), Rehlata style.
const groups: W[][] = [];
{
  let cur: W[] = [];
  WS.forEach((w, i) => {
    cur.push(w);
    const next = WS[i + 1];
    const gap = next ? next.start - w.end : 99;
    const chars = cur.map((c) => c.text).join(" ").length;
    if (/[,.?!]$/.test(w.text) || gap > 0.45 || cur.length >= 4 || chars > 20) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
}

export const Subtitles: React.FC<{ y?: number }> = ({ y = 1180 }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const g = groups.find((gr, i) => {
    const end = Math.min(gr[gr.length - 1].end + 0.35, groups[i + 1]?.[0].start ?? 999);
    return t >= gr[0].start - 0.05 && t < end;
  });
  if (!g) return null;
  const gStart = Math.round(g[0].start * FPS);
  const enter = spring({ frame: f - gStart + 2, fps: FPS, config: { damping: 14, mass: 0.5 } });
  return (
    <AbsoluteFill style={{ perspective: 800, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: y,
          left: 110,
          right: 170,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 12px",
          transform: `translateY(-50%) rotateX(${(1 - enter) * 40}deg) scale(${0.9 + enter * 0.1})`,
          filter: "drop-shadow(0 3px 0 rgba(0,0,0,0.55)) drop-shadow(0 6px 14px rgba(0,0,0,0.45))",
        }}
      >
        {g.map((w, i) => {
          const wf = Math.round(w.start * FPS);
          const p = spring({ frame: f - wf + 1, fps: FPS, config: { damping: 12, mass: 0.45, stiffness: 180 } });
          const spoken = f >= wf - 1;
          const clean = w.text.replace(/[,]$/, "");
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 50,
                letterSpacing: "-0.05em",
                lineHeight: 1.15,
                transform: `translateY(${(1 - p) * 16}px) rotateX(${(1 - p) * 70}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
                opacity: spoken ? 1 : 0.38,
                backgroundImage: spoken ? (w.key ? KEY_GRADIENT : WHITE_GRADIENT) : "linear-gradient(#fff,#fff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textTransform: w.key ? "uppercase" : undefined,
              }}
            >
              {clean}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
