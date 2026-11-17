import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, KEY_GRADIENT, keys, pop, soft } from "./lib";
import { BigType, FONT, GradText } from "./ui";

// Coordinates in the original 1200x800 map image. The plane uses a 4x upscale.
export const P = {
  CAIRO: [664, 297] as [number, number],
  MADINAH: [694, 313] as [number, number],
  MEKKAH: [696.5, 324.5] as [number, number],
  JEDDAH: [691.5, 323.5] as [number, number],
};
const K = 4;

type Pt = [number, number];
type Cam = { f: number; x: number; y: number; zoom: number; tilt: number; rot?: number };

const quad = (a: Pt, b: Pt, bend: number) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const c: Pt = [mx - dy * bend, my + dx * bend];
  return { a, b, c };
};
const at = (q: ReturnType<typeof quad>, t: number): Pt => {
  const u = 1 - t;
  return [u * u * q.a[0] + 2 * u * t * q.c[0] + t * t * q.b[0], u * u * q.a[1] + 2 * u * t * q.c[1] + t * t * q.b[1]];
};
const qlen = (q: ReturnType<typeof quad>) => {
  let L = 0;
  let prev = at(q, 0);
  for (let i = 1; i <= 30; i++) {
    const p = at(q, i / 30);
    L += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return L;
};

export type Route = { from: Pt; to: Pt; start: number; dur: number; bend?: number; color?: string; dashed?: boolean };
export type Pin = { pos: Pt; label: string; at: number; color?: string; side?: "left" | "right"; big?: boolean };
export type Popup = { pos: Pt; src: string; caption: string; at: number; until: number; w?: number; h?: number; dx?: number };
export type Flat = { pos: Pt; text: string; size: number; at: number; rot?: number };

export const MapScene: React.FC<{
  cams: Cam[];
  routes?: Route[];
  pins?: Pin[];
  popups?: Popup[];
  flats?: Flat[];
  header?: { num: string; over: string; title: string; hl: string; at?: number };
}> = ({ cams, routes = [], pins = [], popups = [], flats = [], header }) => {
  const f = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const ck = (k: keyof Cam) => keys(f, cams.map((c) => [c.f, (c[k] as number) ?? 0]));
  const cx = ck("x");
  const cy = ck("y");
  const zoom = ck("zoom") * 1.15;
  const tilt = ck("tilt");
  const rot = ck("rot");
  const z = zoom / K;
  const sc = 1 / z; // counter-scale for screen-constant sizes inside the plane

  // scene transition: iris-ish scale-in, page-tilt-away out
  const enter = soft(f, 0, 16);
  const exit = soft(f, durationInFrames - 10, 10);

  return (
    <AbsoluteFill
      style={{
        background: "#0b1a2e",
        overflow: "hidden",
        clipPath: `circle(${interpolate(enter, [0, 1], [0, 120])}% at 50% 45%)`,
        opacity: 1 - exit,
      }}
    >
      <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: "50% 40%" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200 * K,
            height: 800 * K,
            transformOrigin: "0 0",
            transformStyle: "preserve-3d",
            transform: `translate(${width / 2}px, ${height * 0.56}px) rotateX(${tilt + exit * 25}deg) rotateZ(${rot}deg) scale(${z * (1 + exit * 0.3)}) translate(${-cx * K}px, ${-cy * K}px)`,
          }}
        >
          <Img src={staticFile("sat4x.jpg")} style={{ position: "absolute", width: 1200 * K, height: 800 * K }} />

          {flats.map((fl, i) => {
            const p = soft(f, fl.at, 20);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: fl.pos[0] * K,
                  top: fl.pos[1] * K,
                  transform: `translate(-50%,-50%) rotate(${fl.rot ?? 0}deg)`,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: fl.size * K,
                  letterSpacing: "0.25em",
                  color: "rgba(255,255,255,0.55)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  opacity: p,
                  whiteSpace: "nowrap",
                }}
              >
                {fl.text}
              </div>
            );
          })}

          {/* Routes: shadow on the ground + line lifted in Z for real parallax */}
          {routes.map((r, i) => {
            const q = quad(r.from, r.to, r.bend ?? 0.25);
            const L = qlen(q) * K;
            const p = interpolate(f, [r.start, r.start + r.dur], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
            });
            if (p <= 0) return null;
            const d = `M ${q.a[0] * K} ${q.a[1] * K} Q ${q.c[0] * K} ${q.c[1] * K} ${q.b[0] * K} ${q.b[1] * K}`;
            const head = at(q, p);
            const head2 = at(q, Math.max(0, p - 0.02));
            const ang = (Math.atan2(head[1] - head2[1], head[0] - head2[0]) * 180) / Math.PI;
            const col = r.color ?? C.red;
            const sw = 5 * sc;
            const alt = Math.sin(Math.PI * p); // altitude: take-off -> cruise -> landing
            const planeS = 1.3 + alt * 0.5;
            return (
              <React.Fragment key={i}>
                <svg width={1200 * K} height={800 * K} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  <path d={d} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={sw * 1.4} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} transform={`translate(${5 * sc}, ${8 * sc})`} style={{ filter: `blur(${3 * sc}px)` }} />
                  {p < 1 ? (
                    <image href={staticFile("plane.png")} width={64} height={64} opacity={0.35} style={{ filter: "brightness(0) blur(3px)" }} transform={`translate(${head[0] * K + alt * 40 * sc}, ${head[1] * K + alt * 60 * sc}) rotate(${ang + 45}) scale(${sc * planeS}) translate(-32,-32)`} />
                  ) : null}
                </svg>
                <svg width={1200 * K} height={800 * K} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", transform: `translateZ(${18 * sc}px)` }}>
                  <path d={d} fill="none" stroke="white" strokeWidth={sw * 1.9} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
                  <path d={d} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
                  {p < 1 ? (
                    <image href={staticFile("plane.png")} width={64} height={64} style={{ filter: "drop-shadow(0 0 3px rgba(0,0,0,0.6))" }} transform={`translate(${head[0] * K}, ${head[1] * K - alt * 30 * sc}) rotate(${ang + 45}) scale(${sc * planeS}) translate(-32,-32)`} />
                  ) : null}
                </svg>
              </React.Fragment>
            );
          })}

          {/* Pins: billboarded so they stand up out of the tilted map */}
          {pins.map((pn, i) => {
            const p = pop(f, pn.at, 9, 0.6);
            if (f < pn.at) return null;
            const side = pn.side ?? "right";
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: pn.pos[0] * K,
                  top: pn.pos[1] * K,
                  transformStyle: "preserve-3d",
                  transformOrigin: "0 0",
                  transform: `rotateX(${-tilt}deg) scale(${sc})`,
                }}
              >
                {/* ground ring */}
                <div style={{ position: "absolute", left: -26, top: -10, width: 52, height: 20, borderRadius: "50%", background: "rgba(40,20,0,0.35)", transform: `scale(${p})` }} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transformOrigin: "50% 100%",
                    transform: `translate(-50%,-100%) translateY(${(1 - p) * -60}px) scale(${p})`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <svg width={pn.big ? 64 : 48} height={pn.big ? 84 : 64} viewBox="0 0 48 64" style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.4))" }}>
                    <path d="M24 62 C 24 62 4 36 4 22 A 20 20 0 1 1 44 22 C 44 36 24 62 24 62 Z" fill={pn.color ?? C.red} stroke="white" strokeWidth={3.5} />
                    <circle cx={24} cy={22} r={8} fill="white" />
                  </svg>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: pn.big ? -110 : -92,
                    [side === "right" ? "left" : "right"]: 34,
                    transform: `scale(${p})`,
                    transformOrigin: side === "right" ? "0 50%" : "100% 50%",
                    background: "rgba(14,20,18,0.88)",
                    padding: "8px 16px 10px",
                    borderRadius: 10,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <GradText size={pn.big ? 46 : 38} gradient={KEY_GRADIENT} depth={3}>
                    {pn.label}
                  </GradText>
                </div>
              </div>
            );
          })}

          {/* Pop-up book cards: fold up from lying flat on the map to standing */}
          {popups.map((pu, i) => {
            if (f < pu.at || f > pu.until + 12) return null;
            const p = pop(f, pu.at, 12, 0.9);
            const o = soft(f, pu.until, 12);
            const w = pu.w ?? 340;
            const h = Math.min(pu.h ?? 260, 270);
            const stand = interpolate(p, [0, 1], [0, -tilt - 4]) * (1 - o);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (pu.pos[0] + (pu.dx ?? 0)) * K,
                  top: pu.pos[1] * K,
                  transformStyle: "preserve-3d",
                  transformOrigin: "0 0",
                  transform: `scale(${sc})`,
                }}
              >
                <div style={{ position: "absolute", left: -w / 2, top: -18, width: w, height: 36, borderRadius: "50%", background: "rgba(30,15,0,0.35)", filter: "blur(8px)", opacity: p * (1 - o) }} />
                <div
                  style={{
                    position: "absolute",
                    left: -w / 2,
                    top: -(h + 80),
                    width: w,
                    height: h + 80,
                    transformOrigin: "50% 100%",
                    transform: `rotateX(${stand}deg) rotateY(${Math.sin(f / 20) * 4}deg)`,
                    background: "white",
                    padding: 12,
                    borderRadius: 8,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                    opacity: Math.min(1, p * 3) * (1 - o),
                  }}
                >
                  <div style={{ width: w - 24, height: h - 12, overflow: "hidden", borderRadius: 4 }}>
                    <Img src={staticFile(pu.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.1 + (f - pu.at) * 0.0012})` }} />
                  </div>
                  <div style={{ textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: "-0.04em", color: C.ink, marginTop: 14 }}>{pu.caption}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* paper vignette + warm grade */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,8,20,0.5) 100%)" }} />

      {header ? (
        <BigType
          num={header.num}
          over={header.over}
          tagAt={header.at ?? 6}
          size={92}
          dur={durationInFrames + 60}
          lines={[
            { t: header.title, at: (header.at ?? 6) + 4 },
            { t: header.hl, at: (header.at ?? 6) + 9, hl: true },
          ]}
        />
      ) : null}
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 18, color: "rgba(255,255,255,0.65)" }}>
        Ilustrasi rute · peta tidak berskala
      </div>
    </AbsoluteFill>
  );
};

