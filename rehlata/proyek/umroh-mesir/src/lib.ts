import { Easing, interpolate, spring } from "remotion";

export const FPS = 30;
export const s = (sec: number) => Math.round(sec * FPS);

export const C = {
  green: "#9CF27A",
  teal: "#3EE6C1",
  gold: "#FFD36B",
  ink: "#1B1A17",
  paper: "#F3EEE3",
  cream: "#FFF8EA",
  red: "#FF5A4E",
};

export const KEY_GRADIENT = `linear-gradient(100deg, ${C.green} 0%, ${C.teal} 100%)`;
export const WHITE_GRADIENT = "linear-gradient(180deg, #FFFFFF 30%, #DDF7D2 100%)";
export const GOLD_GRADIENT = `linear-gradient(100deg, ${C.gold} 0%, #FF9F5A 100%)`;

const smooth = Easing.bezier(0.65, 0, 0.35, 1);

/** Piecewise-eased keyframes. keys: [frame, value][] sorted by frame. */
export const keys = (frame: number, k: [number, number][], ease = smooth) => {
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, v0] = k[i];
    const [f1, v1] = k[i + 1];
    if (frame <= f1) {
      return interpolate(frame, [f0, f1], [v0, v1], {
        easing: ease,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
  }
  return k[k.length - 1][1];
};

/** Same as keys() but input given in seconds. */
export const keysS = (frame: number, k: [number, number][]) =>
  keys(
    frame,
    k.map(([t, v]) => [t * FPS, v]),
  );

export const pop = (frame: number, delay = 0, damping = 11, mass = 0.7) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping, mass, stiffness: 140 } });

export const soft = (frame: number, delay = 0, dur = 18) =>
  spring({
    frame: frame - delay,
    fps: FPS,
    durationInFrames: dur,
    config: { damping: 200 },
  });

/** 0 -> 1 in, then 1 -> 0 at the end of a window of `len` frames. */
export const inOut = (frame: number, len: number, fadeIn = 12, fadeOut = 10) =>
  Math.min(
    interpolate(frame, [0, fadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smooth }),
    interpolate(frame, [len - fadeOut, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smooth }),
  );

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
