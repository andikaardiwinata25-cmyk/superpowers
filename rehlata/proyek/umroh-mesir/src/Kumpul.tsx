import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { C, keysS, pop, s, soft } from "./lib";
import { PhotoScene } from "./Scenes";
import { BigType, FONT, PhotoCard, QuestionBubble, TagRow } from "./ui";

/* "Kenapa harus kumpul dulu sebelum pulang?" — Rehlata Tour, airport arrival. 81.8 s */
export const KUMPUL_FRAMES = 2454;

const At: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => (
  <Sequence from={s(from)} durationInFrames={s(to) - s(from)} layout="none">
    {children}
  </Sequence>
);

/* ---------- talking footage with a smooth, never-empty camera ---------- */
const SCALE: [number, number][] = [
  [0, 1.04], [3.4, 1.12], [7.0, 1.18], [12.6, 1.06], [15.3, 1.14], [22.0, 1.2], [24.4, 1.05], [29.9, 1.16],
  [42.5, 1.06], [48.2, 1.14], [52.0, 1.06], [58.2, 1.15], [63.2, 1.06], [67.3, 1.16], [69.9, 1.05], [76.8, 1.16], [81.8, 1.22],
];
const TX: [number, number][] = [[0, 0], [7, 20], [15.3, -20], [24.4, 0], [42.5, 15], [58.2, -15], [69.9, 0], [81.8, 10]];
const TY: [number, number][] = [[0, 30], [24.4, 40], [42.5, 30], [81.8, 40]];

const Footage: React.FC = () => {
  const f = useCurrentFrame();
  const sc = keysS(f, SCALE);
  const tx = keysS(f, TX) + Math.sin(f / 70) * 10;
  const ty = keysS(f, TY) + Math.cos(f / 83) * 8;
  const cover = Math.max(1 + tx / (0.5 * 1080), 1 - tx / (0.5 * 1080), 1 + ty / (0.45 * 1920), 1 - ty / (0.55 * 1920)) + 0.015;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "50% 45%", transform: `translate(${tx}px, ${ty}px) rotate(${Math.sin(f / 110) * 0.3}deg) scale(${Math.max(sc, cover)})` }}>
        <Video src={staticFile("kumpul.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ---------- certificate (drawn, 3D) ---------- */
const Certificate: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 13, 0.8);
  const out = soft(f, dur - 10, 10);
  return (
    <AbsoluteFill style={{ perspective: 1300 }}>
      <div
        style={{
          position: "absolute",
          left: 505,
          top: 1080,
          width: 620,
          transform: `translate(-50%,-50%) rotateX(${interpolate(p, [0, 1], [75, 10]) + Math.sin(f / 30) * 2 + out * 60}deg) rotateY(${Math.sin(f / 40) * 7 - 6}deg) rotateZ(-3deg) scale(${interpolate(p, [0, 1], [0.5, 1]) * (1 - out * 0.3)})`,
          opacity: Math.min(1, p * 2) * (1 - out),
          background: "#FFFDF6",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 50px 90px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ border: "6px double #B8913A", borderRadius: 4, padding: "26px 30px", textAlign: "center", fontFamily: FONT, color: C.ink }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.3em", color: "#B8913A" }}>SERTIFIKAT</div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 6 }}>UMROH</div>
          <div style={{ height: 3, width: 120, background: "#B8913A", margin: "14px auto" }} />
          <div style={{ fontSize: 20, fontWeight: 600, color: "#555" }}>Diberikan kepada jamaah yang telah</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#555" }}>menunaikan ibadah umroh bersama</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#1F6B45", marginTop: 8 }}>Rehlata Tour</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
            <div style={{ width: 140, borderTop: "2px solid #999" }} />
            <div style={{ width: 66, height: 66, borderRadius: 33, background: "radial-gradient(circle at 35% 35%, #F2D27A, #B8913A)", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }} />
            <div style={{ width: 140, borderTop: "2px solid #999" }} />
          </div>
        </div>
        {/* glossy sweep */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: `linear-gradient(110deg, rgba(255,255,255,0) ${20 + (f % 90)}%, rgba(255,255,255,0.55) ${28 + (f % 90)}%, rgba(255,255,255,0) ${36 + (f % 90)}%)` }} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- checklist card (all include) ---------- */
const Checklist: React.FC<{ items: { t: string; at: number }[]; dur: number; title: string }> = ({ items, dur, title }) => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 13, 0.7);
  const out = soft(f, dur - 9, 9);
  return (
    <AbsoluteFill style={{ perspective: 1200 }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 640,
          width: 640,
          transformOrigin: "0% 50%",
          transform: `rotateY(${(1 - p) * -40 + Math.sin(f / 40) * 3}deg) scale(${(0.7 + p * 0.3) * (1 - out * 0.2)})`,
          opacity: Math.min(1, p * 2) * (1 - out),
          background: "#FBF8EF",
          borderRadius: 24,
          padding: "24px 30px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 19, letterSpacing: "0.08em", color: "#5B6B5F", marginBottom: 10 }}>{title}</div>
        {items.map((it, i) => {
          const q = soft(f, it.at, 10);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0", opacity: 0.25 + q * 0.75 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: q > 0.5 ? C.green : "#E3DFD3", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.8 + q * 0.2})` }}>
                <svg width={28} height={28} viewBox="0 0 24 24">
                  <path d="M4 12.5 L10 18 L20 6" fill="none" stroke="#0E1512" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - q)} />
                </svg>
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, letterSpacing: "-0.045em", color: "#121614" }}>{it.t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- phone mockup: blurry phone photo ---------- */
const PhoneMock: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = pop(f, 0, 12, 0.8);
  const out = soft(f, dur - 9, 9);
  const shake = Math.sin(f * 1.7) * 6 * (1 - out);
  return (
    <AbsoluteFill style={{ perspective: 1300 }}>
      <div
        style={{
          position: "absolute",
          left: 505,
          top: 1060,
          width: 300,
          height: 590,
          transform: `translate(-50%,-50%) translateY(${(1 - p) * 500}px) rotateY(${-18 + Math.sin(f / 30) * 5}deg) rotateZ(${6 + shake * 0.2}deg)`,
          opacity: 1 - out,
          background: "#111",
          borderRadius: 44,
          padding: 12,
          boxShadow: "0 50px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", background: "#000" }}>
          <Img src={staticFile("kaaba.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(7px) brightness(0.8) saturate(0.6)", transform: `translate(${shake}px, ${-shake}px) scale(1.15) rotate(-4deg)` }} />
          <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 22, color: "white" }}>● REC</div>
          <div style={{ position: "absolute", bottom: 24, left: "50%", width: 64, height: 64, marginLeft: -32, borderRadius: 32, border: "5px solid white" }} />
          <div style={{ position: "absolute", top: "42%", left: 0, right: 0, textAlign: "center" }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, background: C.red, color: "white", padding: "6px 14px", borderRadius: 8, opacity: soft(f, 12, 8) }}>BLUR</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};



/* ---------- sound design (Winata UI tones) ---------- */
const LEAD: Record<string, number> = { whoosh: 0.2, whoosh_big: 0.1, whoosh_low: 0.1, swish_down: 0.15, click: 0.1, chime_up: 0.15, ding: 0.1, rise_soft: 0.08, sparkle: 0.3, riser: 0.9, swell_hit: 1.1, shimmer_down: 0.3 };
const SFX_GAIN = 0.5;
type S = [number, string, number];
const TXT = (tag: number, lines: number[], hl: number): S[] => [[tag, "pop", 0.3], ...lines.map((l) => [l, "click", 0.32] as S), [hl, "pop_up", 0.38]];
const SFX: S[] = [
  [0.2, "chime_up", 0.32], [2.8, "tick", 0.3], [4.1, "tick", 0.3],
  [7.9, "whoosh_big", 0.36], ...TXT(7.9, [8.0], 8.9), [10.7, "swish_down", 0.28],
  [11.5, "whoosh", 0.38], ...TXT(12.7, [12.85], 13.3),
  [15.3, "whoosh_low", 0.3], ...TXT(15.4, [17.0], 17.7), [18.3, "whoosh", 0.36], [18.4, "sparkle", 0.16], [21.9, "swish_down", 0.24],
  ...TXT(22.4, [], 23.3),
  [24.4, "swell_hit", 0.28], ...TXT(24.6, [28.2], 29.0),
  [28.3, "whoosh", 0.36], [28.45, "pop", 0.28], [34.4, "whoosh", 0.36], [34.6, "pop", 0.3], [35.2, "whoosh", 0.34], [40.4, "whoosh", 0.36], [40.6, "pop", 0.3], [41.2, "whoosh", 0.34],
  ...TXT(42.6, [43.5], 44.2), [49.4, "whoosh_low", 0.32], ...TXT(49.6, [], 51.2),
  [52.0, "whoosh", 0.34], [55.4, "tick", 0.3], [56.6, "blip", 0.34], [57.4, "blip", 0.34], [57.5, "whoosh", 0.32],
  ...TXT(58.4, [58.5], 60.3), [59.5, "whoosh", 0.36], [60.1, "bubble_down", 0.26],
  ...TXT(63.2, [64.9], 65.5),
  ...TXT(72.6, [72.9], 73.6), [74.8, "ding", 0.28],
];

export const Kumpul: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Footage />

      {/* HOOK: question */}
      <At from={0.15} to={7.0}>
        <QuestionBubble
          over="PERTANYAAN JAMAAH"
          dur={s(6.85)}
          words={(
            [
              ["Kenapa", 0.2], ["pas", 1.1], ["kepulangan", 1.9], ["harus", 2.7], ["KUMPUL", 2.8, 1], ["dulu?", 3.1],
              ["Kenapa", 3.5, 0, 1], ["nggak", 3.8], ["langsung", 3.9], ["PULANG", 4.1, 1], ["aja?", 4.4],
            ] as [string, number, number?, number?][]
          ).map(([t, at, hl, br]) => ({ t, at: s(at - 0.15), hl: !!hl, br: !!br }))}
        />
      </At>

      {/* koper b-roll */}
      <At from={7.8} to={10.8}>
        <PhotoScene src="broll/carousel.jpg" from={{ s: 1.35, x: 60, y: 0, ry: -8, rx: 4 }} to={{ s: 1.15, x: -40, y: 0, ry: 6, rx: 0 }}>
          <BigType over="KARENA SAMBIL" tagAt={3} dur={s(3)} lines={[{ t: "NUNGGU", at: s(0.2) }, { t: "KOPER", at: s(1.1), hl: true }]} />
          <Sequence from={s(0.9)} layout="none">
            <PhotoCard src="broll/suitcases.jpg" x={640} y={1180} w={420} h={300} dur={s(2.1)} rz={5} ry={-14} from="right" />
          </Sequence>
        </PhotoScene>
      </At>

      {/* 01 makan malam */}
      <At from={11.5} to={15.3}>
        <PhotoCard src="broll/nasi-kotak.jpg" x={600} y={1080} w={460} h={340} dur={s(3.8)} caption="MAKAN MALAM DULU" rz={4} ry={-14} from="right" />
      </At>
      <At from={12.7} to={15.3}>
        <BigType num="01" over="ALASAN PERTAMA" dur={s(2.6)} lines={[{ t: "MAKAN", at: s(0.15) }, { t: "MALAM", at: s(0.6), hl: true }]} />
      </At>

      {/* 02 sertifikat */}
      <At from={15.4} to={22.0}>
        <BigType num="02" over="ALASAN KEDUA" dur={s(6.6)} lines={[{ t: "PEMBAGIAN", at: s(1.6) }, { t: "SERTIFIKAT", at: s(2.3), hl: true }]} />
      </At>
      <At from={18.3} to={22.0}>
        <Certificate dur={s(3.7)} />
      </At>
      <At from={22.4} to={24.4}>
        <BigType yellow="ADA LAGI?" dur={s(2)} lines={[{ t: "SABAR,", at: s(0.9) }, { t: "TENANG DULU", at: s(1.2), hl: true }]} />
      </At>

      {/* 03 album */}
      <At from={24.6} to={30.0}>
        <BigType num="03" over="ALASAN KETIGA" dur={s(5.4)} lines={[{ t: "PEMBAGIAN", at: s(3.6) }, { t: "ALBUM FOTO", at: s(4.4), hl: true }]} />
      </At>
      <At from={28.3} to={34.2}>
        <PhotoCard page src="album/hal-1.jpg" x={505} y={1040} w={400} h={540} dur={s(5.9)} rz={4} ry={-16} from="bottom" />
      </At>
      <At from={31.0} to={34.3}>
        <BigType over="ISINYA SELAMA PERJALANAN" dur={s(3.3)} size={84} lines={[{ t: "DOKUMENTASI", at: s(0.3) }, { t: "UMROH KAMU", at: s(0.9), hl: true }]} />
      </At>
      <At from={34.3} to={38.8}>
        <div style={{ position: "absolute", left: 90, top: 290 }}>
          <TagRow yellow text="ISI ALBUM: MESIR" at={s(0.3)} />
        </div>
        <Sequence from={0} layout="none">
          <PhotoCard page src="album/hal-3.jpg" x={300} y={760} w={380} h={500} dur={s(4.5)} rz={-6} ry={14} from="left" />
        </Sequence>
        <Sequence from={s(0.9)} layout="none">
          <PhotoCard page src="album/hal-7.jpg" x={710} y={840} w={380} h={500} dur={s(3.6)} rz={5} ry={-14} from="right" />
        </Sequence>
      </At>
      <At from={40.3} to={42.5}>
        <div style={{ position: "absolute", left: 90, top: 290 }}>
          <TagRow yellow text="ISI ALBUM: SAUDI" at={s(0.2)} />
        </div>
        <Sequence from={0} layout="none">
          <PhotoCard page src="album/hal-27.jpg" x={300} y={760} w={380} h={500} dur={s(2.2)} rz={-5} ry={14} from="left" />
        </Sequence>
        <Sequence from={s(0.6)} layout="none">
          <PhotoCard page src="album/hal-35.jpg" x={710} y={840} w={380} h={500} dur={s(1.6)} rz={6} ry={-14} from="right" />
        </Sequence>
      </At>
      <At from={42.6} to={48.2}>
        <BigType yellow="EKSKLUSIF" dur={s(5.6)} lines={[{ t: "HANYA UNTUK", at: s(0.9) }, { t: "JAMAAH REHLATA", at: s(1.6), hl: true }]} size={86} />
      </At>

      {/* fotografer b-roll */}
      <At from={49.4} to={52.0}>
        <PhotoScene src="broll/camera.jpg" from={{ s: 1.3, x: -40, y: 0, ry: 8, rx: 3 }} to={{ s: 1.1, x: 30, y: 0, ry: -6, rx: 0 }}>
          <BigType over="FOTONYA" dur={s(2.6)} lines={[{ t: "PAKAI", at: s(0.2) }, { t: "FOTOGRAFER", at: s(1.8), hl: true }]} />
        </PhotoScene>
      </At>
      <At from={52.0} to={58.3}>
        <BigType yellow="PAKETNYA SUDAH" dur={s(6.3)} lines={[{ t: "ALL", at: s(3.4) }, { t: "INCLUDE", at: s(3.7), hl: true }]} />
        <Sequence from={s(4.2)} layout="none">
          <Checklist title="TERMASUK" dur={s(2.1)} items={[{ t: "Fotografer", at: s(0.4) }, { t: "Videografer", at: s(1.2) }]} />
        </Sequence>
        <Sequence from={s(5.5)} layout="none">
          <PhotoCard src="broll/camcorder.jpg" x={760} y={1250} w={340} h={250} dur={s(0.8)} rz={6} ry={-14} from="right" />
        </Sequence>
      </At>

      {/* HP belum proper */}
      <At from={58.4} to={63.2}>
        <BigType over="NGGAK PERLU TAKUT" dur={s(4.8)} size={86} lines={[{ t: "HP KAMU", at: s(1.9) }, { t: "KURANG PROPER", at: s(3.2), hl: true }]} />
        <Sequence from={s(1.1)} durationInFrames={s(2.2)} layout="none">
          <PhoneMock dur={s(2.2)} />
        </Sequence>
      </At>
      <At from={63.2} to={67.3}>
        <BigType yellow="TENANG AJA" dur={s(4.1)} lines={[{ t: "TIM KAMI", at: s(1.7) }, { t: "SUDAH INCLUDE", at: s(2.3), hl: true }]} />
      </At>

      {/* bukti: rapid montage */}

      {/* ending */}
      <At from={72.6} to={76.6}>
        <BigType yellow="OKE DEH," dur={s(4)} lines={[{ t: "AKU MAU", at: s(0.3) }, { t: "KUMPUL DULU!", at: s(1.0), hl: true }]} />
      </At>

      {SFX.map(([t, name, vol], i) => (
        <Sequence key={i} from={Math.max(0, s(t - (LEAD[name] ?? 0)))} durationInFrames={s(3.6)} layout="none">
          <Audio src={staticFile(`sfx2/${name}.wav`)} volume={vol * SFX_GAIN} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};


