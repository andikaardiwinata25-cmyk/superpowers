import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { C, GOLD_GRADIENT, s, soft } from "./lib";
import { Footage } from "./Footage";
import { MapScene, P } from "./MapScene";
import { CompareScene, PhotoScene, PollCard, StepTracker, VSScene } from "./Scenes";
import { Subtitles } from "./Subtitles";
import { Chip, PhotoCard, Sticker } from "./ui";

for (const w of [500, 600, 700, 800]) {
  loadFont({ family: "Montserrat", url: staticFile(`Montserrat-${w}.ttf`), weight: String(w) });
}

/** Sequence by global seconds. */
const At: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => (
  <Sequence from={s(from)} durationInFrames={s(to) - s(from)} layout="none">
    {children}
  </Sequence>
);
const Box: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill>{children}</AbsoluteFill>;

const SFX: [number, string, number][] = [
  [2.6, "pop", 0.5], [5.55, "switch", 0.5], [6.4, "whoosh", 0.6], [6.55, "shutter-modern", 0.25], [7.4, "whoosh", 0.6], [7.55, "pop", 0.5],
  [9.3, "ding", 0.22], [10.0, "swoosh", 0.35], [13.3, "mouse-click", 0.5],
  [15.2, "swoosh", 0.45], [15.25, "page-turn", 0.5], [16.8, "pop", 0.4], [17.4, "whip", 0.3], [18.5, "pop", 0.4], [20.2, "shutter-modern", 0.3],
  [22.9, "swoosh", 0.4], [23.6, "whoosh", 0.6], [26.3, "page-turn", 0.5], [26.9, "whip", 0.3], [28.1, "pop", 0.4], [28.7, "shutter-modern", 0.3],
  [31.5, "switch", 0.5], [32.6, "tick", 0.5], [34.7, "mouse-click", 0.5], [37.5, "mouse-click", 0.5], [39.5, "mouse-click", 0.5], [40.7, "ding", 0.25],
  [41.75, "swoosh", 0.45], [44.65, "whip", 0.3], [45.25, "pop", 0.4], [45.9, "swoosh", 0.4], [47.1, "pop", 0.6],
  [50.0, "page-turn", 0.5], [50.0, "swoosh", 0.4], [50.8, "pop", 0.4], [51.1, "whip", 0.3], [52.6, "pop", 0.4], [55.6, "shutter-modern", 0.3],
  [58.3, "swoosh", 0.45], [58.5, "pop", 0.5], [61.1, "mouse-click", 0.5], [63.8, "page-turn", 0.45], [64.8, "whip", 0.3], [66.1, "pop", 0.4],
  [67.0, "swoosh", 0.45], [69.7, "tick", 0.6], [70.6, "tick", 0.6], [71.7, "pop", 0.5],
  [72.9, "swoosh", 0.4], [76.1, "mouse-click", 0.5], [76.3, "mouse-click", 0.5], [78.0, "ding", 0.22],
  [79.0, "switch", 0.5], [79.2, "whoosh", 0.5], [79.4, "whoosh", 0.5], [81.0, "tick", 0.5], [84.4, "tick", 0.5],
  [86.2, "swoosh", 0.4], [87.7, "pop", 0.5], [90.0, "pop", 0.5],
  [92.6, "swoosh", 0.45], [92.9, "mouse-click", 0.4], [95.1, "tick", 0.5], [96.0, "tick", 0.5], [96.9, "snapchat-notification", 0.5],
];

const StrikeChip: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  return <Chip text="MINUS" x={700} y={400} dur={s(2.7)} color="#FFFFFF" strike={soft(f, at, 8)} />;
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Footage />

      {/* ---- HOOK ---- */}
      <At from={2.6} to={5.5}>
        <Sticker text="UMROH + MESIR" sub="Landing mana dulu?" y={400} size={84} dur={s(2.9)} />
      </At>
      <At from={6.4} to={10.4}>
        <VSScene />
      </At>
      <At from={13.3} to={15.15}>
        <Chip text="MASING-MASING PUNYA KELEBIHAN" x={505} y={400} dur={s(1.85)} size={38} />
      </At>

      {/* ---- OPSI 1 ---- */}
      <At from={15.2} to={22.9}>
        <Box>
          <MapScene
            header={{ tag: "OPSI 1", title: "LANDING MADINAH" }}
            cams={[
              { f: 0, x: 670, y: 330, zoom: 2.6, tilt: 10, rot: -4 },
              { f: s(1.5), x: 668, y: 356, zoom: 5.5, tilt: 32, rot: 0 },
              { f: s(4.0), x: 675, y: 364, zoom: 6.4, tilt: 36, rot: 1 },
              { f: s(5.2), x: 659, y: 356, zoom: 7.2, tilt: 38, rot: 3 },
              { f: s(7.7), x: 661, y: 353, zoom: 7.8, tilt: 40, rot: 1 },
            ]}
            flats={[
              { pos: [636, 372], text: "MESIR", size: 7, at: 10 },
              { pos: [712, 398], text: "ARAB SAUDI", size: 6, at: 20 },
              { pos: [679, 380], text: "LAUT MERAH", size: 2.2, at: 25, rot: 66 },
            ]}
            pins={[
              { pos: P.CAIRO, label: "MESIR", at: s(1.6), side: "left" },
              { pos: P.MADINAH, label: "MADINAH", at: s(3.3), color: "#2E9E5B" },
            ]}
            routes={[{ from: P.CAIRO, to: P.MADINAH, start: s(2.2), dur: s(1.3), bend: -0.3 }]}
            popups={[{ pos: P.CAIRO, src: "pyramids.jpg", caption: "ZIARAH DI MESIR", at: s(5.0), until: s(7.4), dx: -22 }]}
          />
        </Box>
      </At>
      <At from={23.5} to={26.3}>
        <PhotoCard src="makam.jpg" x={320} y={560} w={460} h={520} dur={s(2.8)} caption="MAKAM RASULULLAH" rz={-5} ry={18} from="left" />
      </At>
      <At from={26.3} to={31.6}>
        <Box>
          <MapScene
            cams={[
              { f: 0, x: 686, y: 370, zoom: 8.6, tilt: 36, rot: -3 },
              { f: s(2.0), x: 690, y: 381, zoom: 10, tilt: 40, rot: 0 },
              { f: s(5.3), x: 693, y: 385, zoom: 10.8, tilt: 42, rot: 2 },
            ]}
            header={{ tag: "OPSI 1", title: "LALU KE MEKKAH", at: 4 }}
            pins={[
              { pos: P.MADINAH, label: "MADINAH", at: 0, color: "#2E9E5B" },
              { pos: P.MEKKAH, label: "MEKKAH", at: s(1.8), big: true },
            ]}
            routes={[
              { from: P.CAIRO, to: P.MADINAH, start: -100, dur: 1, bend: -0.3 },
              { from: P.MADINAH, to: P.MEKKAH, start: s(0.6), dur: s(1.4), bend: -0.35 },
            ]}
            popups={[{ pos: P.MEKKAH, src: "kaaba.jpg", caption: "PUNCAK: UMROH", at: s(2.4), until: s(5.0), dx: 4 }]}
          />
        </Box>
      </At>
      <At from={31.6} to={41.7}>
        <StepTracker />
      </At>
      <At from={41.75} to={45.9}>
        <Box>
          <MapScene
            header={{ tag: "OPSI 1", title: "PULANG DARI JEDDAH", at: s(2.6) }}
            cams={[
              { f: 0, x: 672, y: 366, zoom: 4.6, tilt: 30, rot: -2 },
              { f: s(2.5), x: 681, y: 373, zoom: 6.2, tilt: 35, rot: 0 },
              { f: s(4.15), x: 688, y: 382, zoom: 8, tilt: 40, rot: 2 },
            ]}
            pins={[
              { pos: P.CAIRO, label: "MESIR", at: 0, side: "left" },
              { pos: P.MADINAH, label: "MADINAH", at: 0, color: "#2E9E5B" },
              { pos: P.MEKKAH, label: "MEKKAH", at: 0 },
              { pos: P.JEDDAH, label: "JEDDAH", at: s(3.5), side: "left", color: "#2F6FDB" },
            ]}
            routes={[
              { from: P.CAIRO, to: P.MADINAH, start: -100, dur: 1, bend: -0.3 },
              { from: P.MADINAH, to: P.MEKKAH, start: -100, dur: 1, bend: -0.35 },
              { from: P.MEKKAH, to: P.JEDDAH, start: s(2.9), dur: s(0.6), bend: 0.6, color: "#2F6FDB" },
              { from: P.JEDDAH, to: P.HOME, start: s(3.4), dur: s(0.75), bend: 0.25, color: "#2F6FDB" },
            ]}
          />
        </Box>
      </At>

      {/* ---- OPSI 2 ---- */}
      <At from={47.1} to={50.0}>
        <Sticker text="OPSI 2" sub="Landing di Jeddah" y={400} size={120} dur={s(2.9)} gradient={GOLD_GRADIENT} depthColor="#5a2a00" />
      </At>
      <At from={50.0} to={58.3}>
        <Box>
          <MapScene
            header={{ tag: "OPSI 2", title: "LANDING JEDDAH" }}
            cams={[
              { f: 0, x: 668, y: 340, zoom: 3, tilt: 12, rot: 4 },
              { f: s(1.6), x: 672, y: 368, zoom: 6, tilt: 34, rot: 0 },
              { f: s(3.6), x: 680, y: 378, zoom: 7, tilt: 38, rot: -1 },
              { f: s(5.4), x: 658, y: 355, zoom: 7.6, tilt: 38, rot: 2 },
              { f: s(8.3), x: 660, y: 353, zoom: 8.2, tilt: 40, rot: 0 },
            ]}
            flats={[
              { pos: [636, 372], text: "MESIR", size: 7, at: 10 },
              { pos: [712, 398], text: "ARAB SAUDI", size: 6, at: 20 },
              { pos: [679, 380], text: "LAUT MERAH", size: 2.2, at: 25, rot: 66 },
            ]}
            pins={[
              { pos: P.CAIRO, label: "MESIR", at: s(0.8), side: "left" },
              { pos: P.JEDDAH, label: "JEDDAH", at: s(2.6), color: "#2F6FDB" },
            ]}
            routes={[{ from: P.CAIRO, to: P.JEDDAH, start: s(1.1), dur: s(1.5), bend: -0.25, color: "#2F6FDB" }]}
            popups={[{ pos: P.CAIRO, src: "pyramids.jpg", caption: "ZIARAH DI MESIR", at: s(5.6), until: s(8.0), dx: -22 }]}
          />
        </Box>
      </At>
      <At from={58.3} to={63.8}>
        <PhotoScene src="kaaba.jpg" from={{ s: 1.28, x: 0, y: 50, ry: -8, rx: 4 }} to={{ s: 1.06, x: -20, y: 0, ry: 6, rx: 0 }}>
          <Sequence from={6} layout="none">
            <Sticker text="LANGSUNG UMROH" y={400} size={72} dur={s(5.3)} />
          </Sequence>
          <Sequence from={s(2.8)} layout="none">
            <Chip text="LANGSUNG KE INTI" x={505} y={1380} dur={s(2.6)} color={C.gold} size={46} />
          </Sequence>
        </PhotoScene>
      </At>
      <At from={63.8} to={67.0}>
        <Box>
          <MapScene
            header={{ tag: "OPSI 2", title: "LALU KE MADINAH", at: 4 }}
            cams={[
              { f: 0, x: 690, y: 386, zoom: 10, tilt: 40, rot: 3 },
              { f: s(3.2), x: 689, y: 376, zoom: 9, tilt: 36, rot: -2 },
            ]}
            pins={[
              { pos: P.JEDDAH, label: "JEDDAH", at: 0, side: "left", color: "#2F6FDB" },
              { pos: P.MEKKAH, label: "MEKKAH", at: 3 },
              { pos: P.MADINAH, label: "MADINAH", at: s(2.3), color: "#2E9E5B", big: true },
            ]}
            routes={[
              { from: P.CAIRO, to: P.JEDDAH, start: -100, dur: 1, bend: -0.25, color: "#2F6FDB" },
              { from: P.MEKKAH, to: P.MADINAH, start: s(1.0), dur: s(1.3), bend: -0.35, color: "#2F6FDB" },
            ]}
          />
        </Box>
      </At>
      <At from={67.0} to={72.9}>
        <PhotoScene src="madinah.jpg" from={{ s: 1.32, x: 0, y: -260, ry: 6, rx: 10 }} to={{ s: 1.1, x: 0, y: 110, ry: -4, rx: -2 }}>
          <Sequence from={s(2.7)} layout="none">
            <Chip text="TENANG" x={330} y={1380} dur={s(3.2)} size={48} />
          </Sequence>
          <Sequence from={s(3.6)} layout="none">
            <Chip text="DAMAI" x={750} y={1380} dur={s(2.3)} size={48} />
          </Sequence>
          <Sequence from={s(4.7)} layout="none">
            <Sticker text="PULANG DARI MADINAH" y={400} size={54} dur={s(1.2)} />
          </Sequence>
        </PhotoScene>
      </At>

      {/* ---- KESIMPULAN ---- */}
      <At from={76.1} to={78.8}>
        <Chip text="PLUS" x={390} y={400} dur={s(2.7)} />
      </At>
      <At from={76.3} to={79.0}>
        <StrikeChip at={s(1.7)} />
      </At>
      <At from={78.0} to={79.0}>
        <Sticker text="PLUS SEMUA ✓" y={530} size={76} dur={s(1.0)} />
      </At>
      <At from={79.0} to={86.2}>
        <CompareScene />
      </At>
      <At from={87.6} to={89.4}>
        <Sticker text="PALING IDEAL?" y={400} size={80} dur={s(1.8)} gradient={GOLD_GRADIENT} depthColor="#5a2a00" />
      </At>
      <At from={89.9} to={92.2}>
        <Sticker text="DUA-DUANYA" sub="punya kelebihan masing-masing" y={400} size={84} dur={s(2.3)} />
      </At>
      <At from={92.6} to={99.3}>
        <PollCard />
      </At>

      <Subtitles />
      <Grain />

      {SFX.map(([t, name, vol], i) => (
        <Sequence key={i} from={s(t)} durationInFrames={s(1.6)} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
        </Sequence>
      ))}

      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center", fontFamily: "Montserrat", fontWeight: 700, fontSize: 20, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)" }}>
        REHLATA
      </div>
    </AbsoluteFill>
  );
};
