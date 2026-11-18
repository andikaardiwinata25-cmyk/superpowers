import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, GOLD_GRADIENT, KEY_GRADIENT, pop, soft } from "./lib";

export const FONT = "Montserrat";

/** Gradient text with tight tracking and a stacked 3D extrusion. */
export const GradText: React.FC<{
  children: React.ReactNode;
  size: number;
  gradient?: string;
  weight?: number;
  depth?: number;
  depthColor?: string;
  tracking?: string;
  style?: React.CSSProperties;
}> = ({ children, size, gradient = KEY_GRADIENT, weight = 800, depth = 6, depthColor = "#0E3B2A", tracking = "-0.045em", style }) => {
  const layers = [];
  for (let i = depth; i >= 1; i--) {
    layers.push(
      <span
        key={i}
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${i * 0.6}px, ${i * 0.9}px)`,
          color: depthColor,
          opacity: 0.9,
        }}
      >
        {children}
      </span>,
    );
  }
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: tracking,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {layers}
      <span
        style={{
          position: "relative",
          backgroundImage: gradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {children}
      </span>
    </span>
  );
};

/** Vox-style pop-up title: flips in on X axis with a bounce, holds, then flies out. */
export const Sticker: React.FC<{
  text: string;
  sub?: string;
  x?: number;
  y: number;
  size?: number;
  dur: number;
  gradient?: string;
  depthColor?: string;
  tilt?: number;
  box?: boolean;
}> = ({ text, sub, x = 505, y, size = 92, dur, gradient = KEY_GRADIENT, depthColor = "#0E3B2A", tilt = -3, box = true }) => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 10, 0.6);
  const out = soft(f, dur - 9, 9);
  const scale = interpolate(p, [0, 1], [0.3, 1]) * interpolate(out, [0, 1], [1, 0.6]);
  const rx = interpolate(p, [0, 1], [-85, 0]) + interpolate(out, [0, 1], [0, 70]);
  const float = Math.sin(f / 14) * 1.4;
  return (
    <AbsoluteFill style={{ perspective: 1200, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%,-50%) rotateX(${rx}deg) rotateZ(${tilt + float * 0.4}deg) rotateY(${float * 2}deg) scale(${scale})`,
          opacity: Math.min(1, p * 2) * (1 - out),
          transformStyle: "preserve-3d",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            padding: box ? "18px 30px 22px" : 0,
            background: box ? "rgba(14,20,18,0.86)" : "transparent",
            borderRadius: 18,
            boxShadow: box ? "0 30px 60px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(156,242,122,0.35)" : undefined,
          }}
        >
          <GradText size={size} gradient={gradient} depthColor={depthColor}>
            {text}
          </GradText>
        </div>
        {sub ? (
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: size * 0.34,
              letterSpacing: "-0.02em",
              color: "white",
              background: "rgba(14,20,18,0.86)",
              padding: "8px 18px",
              borderRadius: 10,
              textShadow: "0 2px 6px rgba(0,0,0,0.5)",
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Polaroid-style photo card that flies in through 3D space, floats with parallax, then flies out. */
export const PhotoCard: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dur: number;
  caption?: string;
  rz?: number;
  ry?: number;
  from?: "left" | "right" | "bottom" | "top";
  blend?: boolean;
  highlight?: number; // 0..1
  page?: boolean; // show the whole image (album page), no parallax crop
}> = ({ src, x, y, w, h, dur, caption, rz = -4, ry = 10, from = "right", blend = false, highlight = 0, page = false }) => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 13, 0.9);
  const out = soft(f, dur - 10, 10);
  const dir = { left: [-900, 0], right: [900, 0], bottom: [0, 1200], top: [0, -1200] }[from];
  const tx = interpolate(p, [0, 1], [dir[0], 0]) + interpolate(out, [0, 1], [0, -dir[0] * 0.4]);
  const ty = interpolate(p, [0, 1], [dir[1], 0]) + interpolate(out, [0, 1], [0, -150]);
  const tz = interpolate(p, [0, 1], [-900, 0]) + interpolate(out, [0, 1], [0, 500]);
  const wobY = Math.sin(f / 24) * 5;
  const wobX = Math.cos(f / 31) * 3;
  const rotY = interpolate(p, [0, 1], [from === "left" ? -70 : 70, ry]) + wobY;
  const rotX = interpolate(p, [0, 1], [35, 4]) + wobX;
  const rotZ = interpolate(p, [0, 1], [rz * 4, rz]) - highlight * rz;
  const lift = highlight * 70;
  const scale = 1 + highlight * 0.08;
  // shadow follows the card rotation -> sells the depth
  const shX = -rotY * 2.2;
  const shY = 40 + rotX * 2;
  return (
    <AbsoluteFill style={{ perspective: 1400, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          transformStyle: "preserve-3d",
          transform: `translate(-50%,-50%) translate3d(${tx}px,${ty - lift}px,${tz + lift * 2}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
          opacity: interpolate(p, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }) * (1 - out),
          filter: `blur(${(1 - Math.min(1, p * 1.4)) * 8 + out * 8}px)`,
        }}
      >
        <div
          style={{
            background: blend ? "#FBF8F1" : "white",
            padding: 14,
            paddingBottom: caption ? 70 : 14,
            borderRadius: 10,
            boxShadow: `${shX}px ${shY}px 60px rgba(0,0,0,0.45), ${shX * 0.3}px ${shY * 0.3}px 14px rgba(0,0,0,0.25)${highlight > 0 ? `, 0 0 ${80 * highlight}px rgba(156,242,122,${0.8 * highlight})` : ""}`,
            position: "relative",
          }}
        >
          <div style={{ width: w - 28, height: h, overflow: "hidden", borderRadius: 4, position: "relative" }}>
            <Img
              src={staticFile(src)}
              style={{
                position: "absolute",
                width: page ? "100%" : "118%",
                height: page ? "100%" : "118%",
                left: page ? 0 : "-9%",
                top: page ? 0 : "-9%",
                objectFit: "cover",
                // inner parallax: image moves opposite to the card rotation
                transform: page ? undefined : `translate(${-wobY * 3}px, ${wobX * 3}px) scale(${1 + f * 0.0006})`,
                mixBlendMode: blend ? "multiply" : undefined,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(${110 + wobY * 6}deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%)`,
              }}
            />
          </div>
          {caption ? (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 0,
                right: 0,
                textAlign: "center",
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 32,
                letterSpacing: "-0.04em",
                color: C.ink,
              }}
            >
              {caption}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Chip: React.FC<{ text: string; x: number; y: number; dur: number; color?: string; strike?: number; size?: number }> = ({
  text,
  x,
  y,
  dur,
  color = C.green,
  strike = 0,
  size = 44,
}) => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 9, 0.5);
  const out = soft(f, dur - 8, 8);
  return (
    <AbsoluteFill style={{ perspective: 900 }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%,-50%) rotateY(${interpolate(p, [0, 1], [90, 0]) - out * 90}deg) scale(${interpolate(p, [0, 1], [0.5, 1])})`,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: "-0.04em",
          color: "#0E1512",
          background: color,
          padding: "10px 24px",
          borderRadius: 999,
          boxShadow: "0 18px 40px rgba(0,0,0,0.4), 0 5px 0 rgba(0,0,0,0.25)",
          opacity: Math.min(1, p * 2) * (1 - out),
          whiteSpace: "nowrap",
        }}
      >
        {text}
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: "52%",
            height: 6,
            background: C.red,
            borderRadius: 3,
            transformOrigin: "left center",
            transform: `scaleX(${strike})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/** Paper grid background (Vox notebook look) with slow drift. */
export const GridPaper: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, background: C.paper, overflow: "hidden" }}>
      <Img
        src={staticFile("grid.jpg")}
        style={{
          position: "absolute",
          width: "112%",
          height: "112%",
          left: "-6%",
          top: "-6%",
          objectFit: "cover",
          transform: `translate(${Math.sin(f / 80) * 20}px, ${Math.cos(f / 95) * 20}px) scale(${1 + f * 0.0002})`,
          filter: "sepia(0.35) brightness(1.02)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(60,40,10,0.28) 100%)" }} />
    </AbsoluteFill>
  );
};

export { GOLD_GRADIENT };

/* =================== Typography style (Rehlata "Date Confirmed" ref) =================== */
const GREEN_BAR = "linear-gradient(90deg, #B4F890 0%, #9CF27A 55%, #86E86A 100%)";
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export type TLine = { t: string; at: number; hl?: boolean; strikeAt?: number };

/** Small header: green number box + overline, or a yellow tag. */
export const TagRow: React.FC<{ num?: string; text: string; at: number; yellow?: boolean; red?: string }> = ({ num, text, at, yellow, red }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, 12, 0.5);
  if (f < at) return <div style={{ height: yellow ? 46 : 40 }} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, transform: `translateX(${(1 - p) * -40}px)`, opacity: Math.min(1, p * 2) }}>
      {red ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17, letterSpacing: "0.06em", color: "#FF6A3D" }}>{red}</div> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {num ? (
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: "-0.03em", color: "#0E1512", background: GREEN_BAR, borderRadius: 8, padding: "2px 12px", transform: `scale(${p})` }}>{num}</div>
        ) : null}
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: yellow ? 28 : 24,
            letterSpacing: yellow ? "0.01em" : "0.05em",
            color: yellow ? "#111" : "white",
            background: yellow ? "#F9D949" : "transparent",
            padding: yellow ? "8px 16px" : 0,
            borderRadius: 8,
            boxShadow: yellow ? "0 8px 20px rgba(0,0,0,0.3)" : undefined,
            textShadow: yellow ? undefined : "0 2px 10px rgba(0,0,0,0.6)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

/** Big stacked kinetic type: white lines with a mask-reveal, key line black on a green bar. */
export const BigType: React.FC<{
  x?: number;
  y?: number;
  num?: string;
  over?: string;
  yellow?: string;
  tagAt?: number;
  lines: TLine[];
  dur: number;
  size?: number;
  align?: "left" | "center";
  dark?: boolean;
}> = ({ x = 90, y = 290, num, over, yellow, tagAt = 0, lines, dur, size = 100, align = "left", dark = false }) => {
  const f = useCurrentFrame();
  const out = soft(f, dur - 9, 9);
  return (
    <AbsoluteFill style={{ perspective: 1000, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: align === "left" ? x : 90,
          right: align === "left" ? undefined : 160,
          top: y,
          display: "flex",
          flexDirection: "column",
          alignItems: align === "left" ? "flex-start" : "center",
          gap: 10,
          transform: `translateY(${-out * 40}px)`,
          opacity: 1 - out,
        }}
      >
        {over || yellow ? <TagRow num={num} text={(over ?? yellow) as string} at={tagAt} yellow={!!yellow} /> : null}
        <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "center" }}>
          {lines.map((ln, i) => {
            const p = easeOut((f - ln.at) / 9);
            const bar = easeOut((f - ln.at - 2) / 8);
            const st = ln.strikeAt !== undefined ? easeOut((f - ln.strikeAt) / 7) : 0;
            if (f < ln.at - 1) return null;
            return (
              <div key={i} style={{ position: "relative", overflow: "hidden", padding: ln.hl ? "0 14px 4px" : "0 4px 6px", marginTop: i ? -size * 0.06 : 0 }}>
                {ln.hl ? (
                  <div style={{ position: "absolute", left: 0, right: 0, top: size * 0.06, bottom: size * 0.02, background: GREEN_BAR, borderRadius: 6, transformOrigin: "left center", transform: `scaleX(${bar})` }} />
                ) : null}
                <div
                  style={{
                    position: "relative",
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: size,
                    lineHeight: 1,
                    letterSpacing: "-0.05em",
                    color: ln.hl || dark ? "#0E1512" : "white",
                    textShadow: ln.hl || dark ? undefined : "0 4px 22px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.35)",
                    whiteSpace: "nowrap",
                    transformOrigin: "50% 100%",
                    transform: `translateY(${(1 - p) * 105}%) rotateX(${(1 - p) * -55}deg)`,
                    opacity: ln.strikeAt !== undefined ? 1 - st * 0.45 : 1,
                  }}
                >
                  {ln.t}
                </div>
                {ln.strikeAt !== undefined ? (
                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: size * 0.09, background: "#FF5A4E", borderRadius: 4, transformOrigin: "left", transform: `scaleX(${st})` }} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Cream chat-bubble question card with word-by-word ink-in and green marker highlights. */
export const QuestionBubble: React.FC<{
  over: string;
  words: { t: string; at: number; hl?: boolean; br?: boolean; dim?: boolean }[];
  dur: number;
  x?: number;
  y?: number;
  width?: number;
  size?: number;
}> = ({ over, words, dur, x = 90, y = 290, width = 760, size = 50 }) => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 13, 0.7);
  const out = soft(f, dur - 9, 9);
  return (
    <AbsoluteFill style={{ perspective: 1200, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          transformOrigin: "10% 100%",
          transform: `rotateY(${(1 - p) * -30 + Math.sin(f / 40) * 2}deg) rotateX(${Math.cos(f / 50) * 2}deg) scale(${(0.6 + p * 0.4) * (1 - out * 0.15)})`,
          opacity: Math.min(1, p * 2) * (1 - out),
        }}
      >
        <div style={{ background: "#FBF8EF", borderRadius: 26, padding: "24px 30px 28px", boxShadow: "0 30px 60px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: "#2E9E5B", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: FONT, fontWeight: 800, fontSize: 15 }}>?</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 19, letterSpacing: "0.08em", color: "#5B6B5F" }}>{over}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: size * 0.22, rowGap: 2 }}>
            {words.map((w, i) => {
              const on = easeOut((f - w.at) / 6);
              const bar = easeOut((f - w.at - 1) / 7);
              return (
                <React.Fragment key={i}>
                  {w.br ? <div style={{ flexBasis: "100%", height: 0 }} /> : null}
                  <span style={{ position: "relative", padding: w.hl ? "0 8px" : 0, display: "inline-block" }}>
                    {w.hl ? <span style={{ position: "absolute", inset: "8% 0 4% 0", background: GREEN_BAR, borderRadius: 5, transformOrigin: "left", transform: `scaleX(${bar})` }} /> : null}
                    <span
                      style={{
                        position: "relative",
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: w.dim ? size * 0.82 : size,
                        letterSpacing: "-0.045em",
                        lineHeight: 1.12,
                        color: on > 0.5 ? (w.dim ? "#9AA39C" : "#121614") : "#D6D2C6",
                        display: "inline-block",
                        transform: `translateY(${(1 - on) * 6}px)`,
                      }}
                    >
                      {w.t}
                    </span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <svg width={44} height={30} style={{ position: "absolute", left: 60, bottom: -26 }}>
          <path d="M0 0 L44 0 L8 30 Z" fill="#FBF8EF" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
