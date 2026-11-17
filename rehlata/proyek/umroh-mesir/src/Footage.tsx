import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { FPS, keysS, lerp } from "./lib";
import { GridPaper } from "./ui";

// Smooth "camera" over the talking-head footage. [sec, value]
const SCALE: [number, number][] = [
  [0, 1.06], [3.44, 1.17], [3.47, 1.06], [4.18, 1.1], [4.21, 1.0], [8.2, 1.13], [10.44, 1.15], [10.48, 1.04],
  [14.0, 1.12], [15.2, 1.18], [22.9, 1.06], [26.3, 1.18], [31.6, 1.08], [41.6, 1.12], [45.9, 1.04], [49.9, 1.2],
  [72.9, 1.03], [76.0, 1.1], [79.0, 1.17], [86.2, 1.04], [88.0, 1.16], [92.24, 1.2], [92.28, 1.03], [99.3, 1.16],
];
const TX: [number, number][] = [
  [0, 0], [22.9, 0], [23.6, 150], [26.0, 170], [26.3, 0], [72.9, 0], [76, -30], [79, 0], [92.2, 0], [99.3, 0],
];
const TY: [number, number][] = [
  [0, 0], [10.4, 0], [10.5, 10], [15.2, 30], [22.9, 0], [26.3, 30], [92.2, 0], [92.3, 120], [94, 150], [99.3, 170],
];

// Footage shrinks into a floating 3D card on grid paper during these windows.
const CARD: [number, number][] = [
  [5.5, 0], [6.1, 1], [10.0, 1], [10.42, 0],
  [31.5, 0], [32.1, 1], [41.2, 1], [41.7, 0],
];

export const Footage: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const sc = keysS(f, SCALE);
  const tx = keysS(f, TX) + Math.sin(f / 70) * 10;
  const ty = keysS(f, TY) + Math.cos(f / 83) * 8;
  const rz = Math.sin(f / 110) * 0.35;
  const cm = keysS(f, CARD);
  const layoutB = t > 20; // second card window: top centre; first: left side
  const cardScale = layoutB ? 0.5 : 0.42;
  const cardX = layoutB ? 0 : -260;
  const cardY = layoutB ? -440 : -440;
  const cardRY = layoutB ? -8 + Math.sin(f / 40) * 4 : 18 + Math.sin(f / 40) * 4;
  const cardRX = 6 + Math.cos(f / 50) * 2;

  return (
    <AbsoluteFill>
      {cm > 0 ? <GridPaper /> : null}
      <AbsoluteFill style={{ perspective: 1600 }}>
        <AbsoluteFill
          style={{
            transform: `translate(${lerp(0, cardX, cm)}px, ${lerp(0, cardY, cm)}px) rotateY(${cardRY * cm}deg) rotateX(${cardRX * cm}deg) rotateZ(${lerp(0, layoutB ? 1.5 : -2.5, cm)}deg) scale(${lerp(1, cardScale, cm)})`,
            borderRadius: 40 * cm,
            overflow: "hidden",
            boxShadow: cm > 0 ? `${-cardRY * 3}px 60px 120px rgba(0,0,0,${0.5 * cm}), 0 0 0 ${18 * cm}px white` : undefined,
          }}
        >
          <AbsoluteFill
            style={{
              transformOrigin: "58% 40%",
              transform: `translate(${tx}px, ${ty}px) rotate(${rz}deg) scale(${sc})`,
            }}
          >
            <Video src={staticFile("main.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
          {/* gentle cinematic grade */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 55% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
