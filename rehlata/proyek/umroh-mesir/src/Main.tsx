import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { s } from "./lib";
import { Footage } from "./Footage";
import { MapScene, P } from "./MapScene";
import { CompareScene, PollCard, StepTracker, VideoScene, VSScene } from "./Scenes";
import { BigType, PhotoCard, QuestionBubble, TagRow } from "./ui";

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

// Winata UI tones (processed: trimmed, -3 dBFS peak, soft fades). [visual moment (s), sound, volume]
// LEAD shifts a sound earlier so its loudest point lands exactly on the visual moment.
const LEAD: Record<string, number> = { whoosh: 0.2, whoosh_big: 0.1, whoosh_low: 0.1, swish_down: 0.15, click: 0.1, chime_up: 0.15, ding: 0.1, rise_soft: 0.08, sparkle: 0.3, riser: 0.9, swell_hit: 1.1, shimmer_down: 0.3 };
const TXT = (tag: number, lines: number[], hl: number, v = 1): [number, string, number][] => [
  [tag, "pop", 0.3 * v],
  ...lines.map((l) => [l, "click", 0.32 * v] as [number, string, number]),
  [hl, "pop_up", 0.38 * v],
];
const MAPIN = (t: number): [number, string, number][] => [[t, "thump", 0.4], [t, "whoosh_low", 0.32]];
const FLIGHT = (start: number, land: number): [number, string, number][] => [[start, "swish", 0.3], [land, "bubble_down", 0.28]];
// overall level of the effects under the voice (processed clips are hot)
const SFX_GAIN = 0.5;
const SFX: [number, string, number][] = [
  // HOOK: question bubble + keyword highlights
  [0.3, "chime_up", 0.32], [2.6, "tick", 0.3], [3.0, "tick", 0.3], [6.6, "tick", 0.3], [7.5, "tick", 0.3],
  // footage shrinks -> Madinah vs Mekkah cards
  [8.0, "whoosh_big", 0.38], [8.3, "whoosh", 0.42], [8.55, "whoosh", 0.38], [8.75, "thump", 0.45], [8.75, "pop", 0.3],
  ...TXT(8.8, [9.1], 9.7), [10.05, "swish_down", 0.32],
  ...TXT(13.0, [13.3], 14.4),
  // OPSI 1 map
  [15.2, "riser", 0.22], ...MAPIN(15.2), ...TXT(15.4, [15.53], 15.7),
  [16.8, "pop_low", 0.4], ...FLIGHT(17.4, 18.6), [18.5, "pop", 0.38],
  [20.2, "whoosh_low", 0.32], [20.25, "blip", 0.3], [22.6, "swish_down", 0.2],
  [22.9, "whoosh", 0.35], [23.5, "whoosh", 0.42], [23.65, "blip2", 0.22], [26.0, "swish_down", 0.24],
  ...MAPIN(26.3), ...TXT(26.43, [26.57], 26.73), ...FLIGHT(26.9, 28.3), [28.1, "rise_soft", 0.38],
  [28.7, "whoosh_low", 0.3], [28.75, "blip", 0.3], [31.3, "swish_down", 0.2],
  // tahapan
  [31.55, "whoosh_big", 0.36], [32.6, "pop", 0.3], [34.7, "blip", 0.36], [37.5, "blip", 0.36], [39.5, "blip", 0.36],
  [40.7, "ding", 0.32], [40.7, "sparkle", 0.18], [41.3, "swish_down", 0.28],
  ...MAPIN(41.75), ...TXT(44.35, [44.48], 44.65), ...FLIGHT(44.65, 45.25), [45.25, "pop", 0.35],
  // OPSI 2
  [45.9, "swish_down", 0.28], [46.9, "swell_hit", 0.3], ...TXT(46.9, [47.1], 47.7),
  ...MAPIN(50.0), ...TXT(50.2, [50.33], 50.5), [50.8, "pop_low", 0.4], ...FLIGHT(51.1, 52.6), [52.6, "pop", 0.38],
  [55.6, "whoosh_low", 0.32], [55.65, "blip", 0.3], [58.0, "swish_down", 0.2],
  // Mekkah video
  [58.3, "swell_hit", 0.28], ...TXT(58.3, [58.4, 58.9], 59.5), [59.5, "sub", 0.18], [61.1, "pop", 0.35],
  ...MAPIN(63.8), ...TXT(63.93, [64.07], 64.23), ...FLIGHT(64.8, 66.1), [66.1, "rise_soft", 0.38],
  // Madinah video
  [67.0, "shimmer_down", 0.28], [68.0, "pop", 0.28], [69.2, "click", 0.3], [69.7, "click", 0.3], [70.6, "pop_up", 0.36], [70.6, "sparkle", 0.16],
  ...TXT(71.6, [71.7], 71.9),
  // kesimpulan
  [72.9, "whoosh", 0.34], ...TXT(75.6, [76.1, 76.3], 78.0), [78.0, "swipe", 0.38], [78.05, "chime_up", 0.3],
  [79.0, "whoosh_big", 0.36], [79.2, "whoosh", 0.38], [79.4, "whoosh", 0.38], [79.1, "pop", 0.28],
  [81.0, "rise_soft", 0.34], [84.4, "rise_soft", 0.34], [86.0, "swish_down", 0.28],
  ...TXT(86.5, [86.8, 88.2], 88.3), ...TXT(89.4, [89.5], 90.2),
  // poll + CTA
  [92.6, "whoosh", 0.38], [92.65, "chime_up", 0.28], [92.87, "tick2", 0.3], [93.03, "tick2", 0.3],
  [95.1, "blip", 0.34], [96.0, "blip", 0.34], [96.9, "ding", 0.34],
];

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
      <At from={0.3} to={8.0}>
        <QuestionBubble
          over="PERTANYAAN JAMAAH"
          dur={s(7.7)}
          words={[
            ["Pak, ada jamaah yang tanya nih...", 0.0, 0, 0, 1],
            ["Program", 2.0, 0, 1], ["Umroh", 2.6, 1], ["plus", 2.8], ["Mesir,", 3.0, 1],
            ["setelah", 3.8, 0, 1], ["dari", 4.2], ["Mesir,", 4.4],
            ["landing", 6.1, 0, 1], ["Madinah", 6.6, 1], ["atau", 7.2], ["Mekkah", 7.5, 1], ["dulu?", 7.9],
          ].map(([w, at, hl, br, dim]) => ({ t: w as string, at: s((at as number) - 0.3), hl: !!hl, br: !!br, dim: !!dim }))}
        />
      </At>
      <At from={8.3} to={10.4}>
        <VSScene />
      </At>
      <At from={13.0} to={15.15}>
        <BigType yellow="JAWABANNYA..." dur={s(2.15)} lines={[{ t: "MASING-MASING", at: s(0.3) }, { t: "ADA KELEBIHANNYA", at: s(1.4), hl: true }]} size={86} />
      </At>

      {/* ---- OPSI 1 ---- */}
      <At from={15.2} to={22.9}>
        <Box>
          <MapScene
            header={{ num: "01", over: "OPSI PERTAMA", title: "LANDING", hl: "MADINAH" }}
            cams={[
              { f: 0, x: 672, y: 290, zoom: 3, tilt: 14, rot: -3 },
              { f: s(1.5), x: 677, y: 304, zoom: 9, tilt: 30, rot: 0 },
              { f: s(4.0), x: 680, y: 307, zoom: 10, tilt: 32, rot: 1 },
              { f: s(5.2), x: 668, y: 300, zoom: 11, tilt: 32, rot: 2 },
              { f: s(7.7), x: 669, y: 299, zoom: 11.5, tilt: 33, rot: 1 },
            ]}
            flats={[
              { pos: [648, 312], text: "MESIR", size: 4, at: 10 },
              { pos: [708, 322], text: "ARAB SAUDI", size: 3.4, at: 20 },
              { pos: [681, 311], text: "LAUT MERAH", size: 1.3, at: 25, rot: 62 },
            ]}
            pins={[
              { pos: P.CAIRO, label: "MESIR", at: s(1.6), side: "left" },
              { pos: P.MADINAH, label: "MADINAH", at: s(3.3), color: "#2E9E5B" },
            ]}
            routes={[{ from: P.CAIRO, to: P.MADINAH, start: s(2.2), dur: s(1.3), bend: -0.18 }]}
            popups={[{ pos: P.CAIRO, src: "mesir-makam-emas.jpg", caption: "ZIARAH DI MESIR", at: s(5.0), until: s(7.4), dx: -7, h: 330 }]}
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
              { f: 0, x: 688, y: 310, zoom: 11, tilt: 30, rot: -2 },
              { f: s(2.0), x: 691, y: 317, zoom: 12.5, tilt: 32, rot: 0 },
              { f: s(5.3), x: 692, y: 320, zoom: 13, tilt: 33, rot: 1.5 },
            ]}
            header={{ num: "01", over: "OPSI PERTAMA", title: "LALU KE", hl: "MEKKAH", at: 4 }}
            pins={[
              { pos: P.MADINAH, label: "MADINAH", at: 0, color: "#2E9E5B" },
              { pos: P.MEKKAH, label: "MEKKAH", at: s(1.8), big: true },
            ]}
            routes={[
              { from: P.CAIRO, to: P.MADINAH, start: -100, dur: 1, bend: -0.18 },
              { from: P.MADINAH, to: P.MEKKAH, start: s(0.6), dur: s(1.4), bend: -0.18 },
            ]}
            popups={[{ pos: P.MEKKAH, src: "kaaba.jpg", caption: "PUNCAK: UMROH", at: s(2.4), until: s(5.0), dx: 2 }]}
          />
        </Box>
      </At>
      <At from={31.6} to={41.7}>
        <StepTracker />
      </At>
      <At from={41.75} to={45.9}>
        <Box>
          <MapScene
            header={{ num: "01", over: "OPSI PERTAMA", title: "PULANG DARI", hl: "JEDDAH", at: s(2.6) }}
            cams={[
              { f: 0, x: 678, y: 302, zoom: 7.5, tilt: 26, rot: -2 },
              { f: s(2.5), x: 684, y: 310, zoom: 10, tilt: 30, rot: 0 },
              { f: s(4.15), x: 689, y: 317, zoom: 12.5, tilt: 32, rot: 1.5 },
            ]}
            pins={[
              { pos: P.CAIRO, label: "MESIR", at: 0, side: "left" },
              { pos: P.MADINAH, label: "MADINAH", at: 0, color: "#2E9E5B" },
              { pos: P.MEKKAH, label: "MEKKAH", at: 0 },
              { pos: P.JEDDAH, label: "JEDDAH", at: s(3.5), side: "left", color: "#2F6FDB" },
            ]}
            routes={[
              { from: P.CAIRO, to: P.MADINAH, start: -100, dur: 1, bend: -0.18 },
              { from: P.MADINAH, to: P.MEKKAH, start: -100, dur: 1, bend: -0.18 },
              { from: P.MEKKAH, to: P.JEDDAH, start: s(2.9), dur: s(0.6), bend: 0.5, color: "#2F6FDB" },

            ]}
          />
        </Box>
      </At>

      {/* ---- OPSI 2 ---- */}
      <At from={46.9} to={50.0}>
        <BigType num="02" over="OPSI KEDUA" dur={s(3.1)} lines={[{ t: "LANDING DI", at: s(0.2) }, { t: "JEDDAH DULU", at: s(0.8), hl: true }]} />
      </At>
      <At from={50.0} to={58.3}>
        <Box>
          <MapScene
            header={{ num: "02", over: "OPSI KEDUA", title: "MESIR →", hl: "JEDDAH" }}
            cams={[
              { f: 0, x: 672, y: 290, zoom: 3, tilt: 14, rot: 3 },
              { f: s(1.6), x: 677, y: 306, zoom: 9, tilt: 30, rot: 0 },
              { f: s(3.6), x: 681, y: 312, zoom: 10.5, tilt: 32, rot: -1 },
              { f: s(5.4), x: 667, y: 299, zoom: 11, tilt: 32, rot: 2 },
              { f: s(8.3), x: 668, y: 298, zoom: 11.5, tilt: 33, rot: 0 },
            ]}
            flats={[
              { pos: [648, 312], text: "MESIR", size: 4, at: 10 },
              { pos: [708, 322], text: "ARAB SAUDI", size: 3.4, at: 20 },
              { pos: [681, 311], text: "LAUT MERAH", size: 1.3, at: 25, rot: 62 },
            ]}
            pins={[
              { pos: P.CAIRO, label: "MESIR", at: s(0.8), side: "left" },
              { pos: P.JEDDAH, label: "JEDDAH", at: s(2.6), color: "#2F6FDB" },
            ]}
            routes={[{ from: P.CAIRO, to: P.JEDDAH, start: s(1.1), dur: s(1.5), bend: -0.15, color: "#2F6FDB" }]}
            popups={[{ pos: P.CAIRO, src: "mesir-makam-kayu.jpg", caption: "ZIARAH DI MESIR", at: s(5.6), until: s(8.0), dx: -7, h: 330 }]}
          />
        </Box>
      </At>
      <At from={58.3} to={63.8}>
        <VideoScene clips={[{ src: "mekkah.mp4", at: 0, dur: s(5.5), trim: 15 }]}>
          <BigType over="SETELAH ZIARAH DI MESIR" dur={s(5.5)} lines={[{ t: "LANGSUNG", at: s(0.1) }, { t: "IBADAH", at: s(0.6) }, { t: "UMROH", at: s(1.2), hl: true }]} />
          <div style={{ position: "absolute", left: 90, top: 760 }}>
            <TagRow yellow text="LANGSUNG KE INTI" at={s(2.8)} />
          </div>
        </VideoScene>
      </At>
      <At from={63.8} to={67.0}>
        <Box>
          <MapScene
            header={{ num: "02", over: "OPSI KEDUA", title: "LALU KE", hl: "MADINAH", at: 4 }}
            cams={[
              { f: 0, x: 690, y: 322, zoom: 13, tilt: 32, rot: 2 },
              { f: s(3.2), x: 690, y: 316, zoom: 12, tilt: 30, rot: -1.5 },
            ]}
            pins={[
              { pos: P.JEDDAH, label: "JEDDAH", at: 0, side: "left", color: "#2F6FDB" },
              { pos: P.MEKKAH, label: "MEKKAH", at: 3 },
              { pos: P.MADINAH, label: "MADINAH", at: s(2.3), color: "#2E9E5B", big: true },
            ]}
            routes={[
              { from: P.CAIRO, to: P.JEDDAH, start: -100, dur: 1, bend: -0.15, color: "#2F6FDB" },
              { from: P.JEDDAH, to: P.MEKKAH, start: -100, dur: 1, bend: 0.5, color: "#2F6FDB" },
              { from: P.MEKKAH, to: P.MADINAH, start: s(1.0), dur: s(1.3), bend: -0.18, color: "#2F6FDB" },
            ]}
          />
        </Box>
      </At>
      <At from={67.0} to={72.9}>
        <VideoScene clips={[{ src: "madinah-1.mp4", at: 0, dur: 107, rate: 0.8 }, { src: "madinah-2.mp4", at: 104, dur: s(5.9) - 104, rate: 0.85 }]}>
          <Sequence from={0} durationInFrames={s(4.6)} layout="none">
            <BigType over="MADINAH IDENTIK DENGAN" tagAt={s(1.0)} dur={s(4.6)} lines={[{ t: "SUASANA", at: s(2.2) }, { t: "TENANG", at: s(2.7) }, { t: "& DAMAI", at: s(3.6), hl: true }]} />
          </Sequence>
          <Sequence from={s(4.6)} layout="none">
            <BigType over="LALU" dur={s(1.4)} lines={[{ t: "PULANG DARI", at: 3 }, { t: "MADINAH", at: 9, hl: true }]} />
          </Sequence>
        </VideoScene>
      </At>

      {/* ---- KESIMPULAN ---- */}
      <At from={75.6} to={79.0}>
        <BigType yellow="TENTU ADA..." dur={s(3.4)} lines={[{ t: "PLUS", at: s(0.5) }, { t: "MINUS", at: s(0.7), strikeAt: s(2.4) }, { t: "PLUS SEMUA!", at: s(2.4), hl: true }]} />
      </At>
      <At from={79.0} to={86.2}>
        <CompareScene />
      </At>
      <At from={86.5} to={89.4}>
        <BigType yellow="JADI..." dur={s(2.9)} lines={[{ t: "NGGAK ADA YANG", at: s(0.3) }, { t: "PALING", at: s(1.7) }, { t: "IDEAL", at: s(1.8), hl: true }]} size={90} />
      </At>
      <At from={89.4} to={92.2}>
        <BigType yellow="KARENA..." dur={s(2.8)} lines={[{ t: "MASING-MASING", at: s(0.1) }, { t: "ADA KELEBIHANNYA", at: s(0.8), hl: true }]} size={86} />
      </At>
      <At from={92.6} to={99.3}>
        <PollCard />
      </At>

      <Grain />

      {SFX.map(([t, name, vol], i) => (
        <Sequence key={i} from={Math.max(0, s(t - (LEAD[name] ?? 0)))} durationInFrames={s(3.6)} layout="none">
          <Audio src={staticFile(`sfx2/${name}.wav`)} volume={vol * SFX_GAIN} />
        </Sequence>
      ))}

    </AbsoluteFill>
  );
};
