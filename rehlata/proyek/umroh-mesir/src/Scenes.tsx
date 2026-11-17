import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, KEY_GRADIENT, keys, pop, s, soft } from "./lib";
import { BigType, FONT, GradText, GridPaper, PhotoCard, TagRow } from "./ui";

/* ---------- 1. "Madinah dulu atau Mekkah dulu?" (footage card on the left) ---------- */
export const VSScene: React.FC = () => {
  // local frame 0 = 6.4s
  const f = useCurrentFrame();
  const vs = pop(f, s(0.45), 8, 0.5);
  const { durationInFrames } = useVideoConfig();
  const out = soft(f, durationInFrames - 10, 10);
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={durationInFrames} layout="none">
        <PhotoCard src="madinah.jpg" x={735} y={445} w={370} h={270} dur={durationInFrames} caption="LANDING MADINAH" rz={4} ry={-14} from="right" />
      </Sequence>
      <Sequence from={s(0.25)} durationInFrames={durationInFrames - s(0.25)} layout="none">
        <PhotoCard src="kaaba.jpg" x={735} y={870} w={370} h={270} dur={durationInFrames - s(0.25)} caption="LANDING MEKKAH" rz={-4} ry={-14} from="right" />
      </Sequence>
      <div
        style={{
          position: "absolute",
          left: 735,
          top: 662,
          transform: `translate(-50%,-50%) scale(${vs * (1 - out)}) rotate(${(1 - vs) * 90 - 8}deg)`,
          width: 120,
          height: 120,
          borderRadius: 60,
          background: C.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 16px 40px rgba(0,0,0,0.5), inset 0 0 0 5px " + C.green,
        }}
      >
        <GradText size={56} depth={3}>
          VS
        </GradText>
      </div>
      <Sequence from={s(0.5)} layout="none">
        <BigType dark align="center" y={1110} yellow="SEBENARNYA..." size={96} dur={durationInFrames - s(0.5)} lines={[{ t: "BEDANYA", at: s(0.3) }, { t: "APA?", at: s(0.9), hl: true }]} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* ---------- 2. Step tracker (Opsi 1 tahapan) under the footage card ---------- */
const STEPS = [
  { n: "1", t: "ZIARAH AULIYA", src: "mesir-masjid.jpg", at: 3.1 },
  { n: "2", t: "ZIARAH RASULULLAH", src: "makam.jpg", at: 5.9 },
  { n: "3", t: "UMROH", src: "kaaba.jpg", at: 7.9 },
];
export const StepTracker: React.FC = () => {
  // local 0 = 31.6s
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = soft(f, durationInFrames - 10, 10);
  const crown = pop(f, s(9.1), 9, 0.5);
  return (
    <AbsoluteFill style={{ perspective: 1200, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 90, top: 1060 }}>
        <TagRow yellow text="TAHAPAN OPSI PERTAMA" at={s(1.0)} />
      </div>
      {/* connecting progress line */}
      <div style={{ position: "absolute", left: 255, top: 1500, width: 510, height: 8, borderRadius: 4, background: "rgba(0,0,0,0.15)" }} />
      <div
        style={{
          position: "absolute",
          left: 255,
          top: 1500,
          height: 8,
          borderRadius: 4,
          background: KEY_GRADIENT,
          width: keys(f, [
            [s(3.1), 0],
            [s(5.9), 0],
            [s(6.5), 255],
            [s(7.9), 255],
            [s(8.5), 510],
          ]),
        }}
      />
      {STEPS.map((st, i) => {
        const p = pop(f, s(st.at), 11, 0.7);
        const active = f >= s(st.at);
        const x = 255 + i * 255;
        const hi = i === 2 ? crown : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: 1488,
              width: 230,
              transformStyle: "preserve-3d",
              transform: `translate(-50%,-100%) rotateY(${interpolate(p, [0, 1], [-100, 0]) + Math.sin(f / 26 + i) * 5}deg) rotateX(${8 + Math.cos(f / 30 + i) * 3}deg) translateZ(${hi * 60}px) translateY(${-hi * 30}px)`,
              transformOrigin: "50% 100%",
              opacity: active ? 1 : 0.35,
            }}
          >
            <div style={{ background: "white", padding: 10, paddingBottom: 56, borderRadius: 10, boxShadow: `0 30px 50px rgba(0,0,0,0.35)${hi ? `, 0 0 ${70 * hi}px rgba(255,211,107,${hi})` : ""}`, position: "relative" }}>
              <div style={{ height: 150, overflow: "hidden", borderRadius: 4 }}>
                <Img src={staticFile(st.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: active ? undefined : "grayscale(1)" }} />
              </div>
              <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 19, letterSpacing: "-0.04em", color: C.ink }}>{st.t}</div>
              <div style={{ position: "absolute", top: -22, left: -18, width: 54, height: 54, borderRadius: 27, background: active ? C.green : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.ink, boxShadow: "0 6px 14px rgba(0,0,0,0.3)" }}>
                {st.n}
              </div>
            </div>
          </div>
        );
      })}
      <Sequence from={s(9.1)} layout="none">
        <div style={{ position: "absolute", left: 560, top: 1150, transform: "rotate(-4deg)" }}>
          <TagRow yellow text="PUNCAKNYA!" at={0} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

/* ---------- 3. Full-screen photo with 3D camera (dolly + orbit) ---------- */
export const PhotoScene: React.FC<{
  src: string;
  from: { s: number; x: number; y: number; ry: number; rx: number };
  to: { s: number; x: number; y: number; ry: number; rx: number };
  overlay?: string; // foreground layer for parallax
  children?: React.ReactNode;
}> = ({ src, from, to, overlay, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = keys(f, [
    [0, 0],
    [durationInFrames, 1],
  ], (x) => x);
  const L = (a: number, b: number) => a + (b - a) * (1 - Math.pow(1 - t, 1.6));
  const enter = soft(f, 0, 14);
  const exit = soft(f, durationInFrames - 10, 10);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden", opacity: enter * (1 - exit) }}>
      <AbsoluteFill style={{ perspective: 1200 }}>
        <AbsoluteFill
          style={{
            transform: `translate(${L(from.x, to.x)}px, ${L(from.y, to.y)}px) rotateY(${L(from.ry, to.ry)}deg) rotateX(${L(from.rx, to.rx)}deg) scale(${L(from.s, to.s) * (1 + (1 - enter) * 0.25)})`,
            filter: `blur(${(1 - enter) * 10}px)`,
          }}
        >
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
        {overlay ? (
          <AbsoluteFill style={{ transform: `translate(${L(from.x, to.x) * 2.2}px, ${L(from.y, to.y) * 2.2}px) scale(${L(from.s, to.s) * 1.12})`, mixBlendMode: "multiply" }}>
            <Img src={staticFile(overlay)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)" }} />
      {children}
    </AbsoluteFill>
  );
};

/* ---------- 4. Comparison: Umroh dulu vs Madinah dulu ---------- */
export const CompareScene: React.FC = () => {
  // local 0 = 79.0s
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = soft(f, 0, 16);
  const exit = soft(f, durationInFrames - 10, 10);
  const hiL = Math.min(soft(f, s(2.0), 12), 1 - soft(f, s(4.6), 12));
  const hiR = soft(f, s(5.4), 12);
  const camRY = Math.sin(f / 60) * 4;
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit), transform: `scale(${1.15 - enter * 0.15})` }}>
      <GridPaper />
      <AbsoluteFill style={{ transform: `rotateY(${camRY}deg)`, transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", top: 300, left: 90, right: 160, textAlign: "center", zIndex: 5, transform: `scale(${pop(f, 4, 11, 0.6)})` }}>
          <div style={{ display: "inline-flex" }}>
            <TagRow yellow text="ADA JAMAAH YANG LEBIH NYAMAN..." at={0} />
          </div>
        </div>
        <Sequence from={6} layout="none">
          <PhotoCard src="kaaba-sketch-c.jpg" x={305} y={760} w={360} h={420} dur={durationInFrames - 6} caption="UMROH DULU" rz={-5} ry={16} from="left" blend highlight={hiL} />
        </Sequence>
        <Sequence from={12} layout="none">
          <PhotoCard src="madinah-sketch.jpg" x={720} y={790} w={370} h={420} dur={durationInFrames - 12} caption="MADINAH DULU" rz={5} ry={-16} from="right" blend highlight={hiR} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- 5. Poll / CTA card ---------- */
export const PollCard: React.FC = () => {
  // local 0 = 92.6s
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = pop(f, 0, 13, 0.8);
  const out = soft(f, durationInFrames - 8, 8);
  const hA = Math.min(soft(f, s(2.5), 8), 1 - soft(f, s(3.3), 8));
  const hB = Math.min(soft(f, s(3.4), 8), 1 - soft(f, s(4.2), 8));
  const opt = (label: string, sub: string, hi: number, i: number) => {
    const op = pop(f, 8 + i * 5, 11, 0.6);
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: hi > 0.5 ? C.green : "#EFEBDF",
          borderRadius: 16,
          padding: "16px 22px",
          transform: `translateX(${(1 - op) * 200}px) scale(${1 + hi * 0.06})`,
          opacity: op,
          boxShadow: hi > 0.5 ? "0 0 40px rgba(156,242,122,0.6)" : undefined,
        }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 23, border: `4px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 26, color: C.ink }}>
          {i === 0 ? "A" : "B"}
        </div>
        <div style={{ fontFamily: FONT, letterSpacing: "-0.04em", color: C.ink }}>
          <div style={{ fontWeight: 800, fontSize: 38 }}>{label}</div>
          <div style={{ fontWeight: 600, fontSize: 22, opacity: 0.8 }}>{sub}</div>
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ perspective: 1400 }}>
      <div
        style={{
          position: "absolute",
          left: 505,
          top: 520,
          width: 740,
          transform: `translate(-50%,-50%) rotateX(${interpolate(p, [0, 1], [70, 6]) + Math.sin(f / 30) * 2 + out * 60}deg) rotateY(${Math.sin(f / 40) * 6}deg) scale(${interpolate(p, [0, 1], [0.6, 1]) * (1 - out * 0.4)})`,
          opacity: Math.min(1, p * 2) * (1 - out),
          background: "#FBF8EF",
          borderRadius: 28,
          padding: 30,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 50px 90px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 19, letterSpacing: "0.08em", color: "#5B6B5F" }}>PERTANYAAN BUAT KAMU</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: "-0.045em", color: "#121614", lineHeight: 1.1 }}>
            Kamu lebih prefer <span style={{ background: C.green, padding: "0 8px", borderRadius: 5 }}>mana?</span>
          </div>
        </div>
        {opt("UMROH DULU", "Mesir → Jeddah → Mekkah → Madinah", hA, 0)}
        {opt("MADINAH DULU", "Mesir → Madinah → Mekkah → Jeddah", hB, 1)}
      </div>
      <Sequence from={s(4.3)} layout="none">
        <div style={{ position: "absolute", left: 90, top: 860 }}>
          <TagRow yellow text="TULIS DI KOLOM KOMENTAR ↓" at={0} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
