// Vox-style building blocks: paper texture, grain, vignette, torn paper,
// tape, yellow highlight labels, stamps, animated routes and counters.
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	random,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const SANS = 'Montserrat, sans-serif';
export const SERIF = '"Liberation Serif", "DejaVu Serif", serif';
export const YELLOW = '#FFE21A';
export const RED = '#C8283A';
export const INK = '#1b1712';
export const PAPER = '#E8DCC2';

// Absolute time in seconds (scenes are placed with <Sequence from=...>,
// so we pass the scene start and add it back).
export const useT = (start: number) => {
	const f = useCurrentFrame();
	return start + f / FPS;
};

export const ramp = (t: number, a: number, b: number, ease = Easing.out(Easing.cubic)) =>
	interpolate(t, [a, b], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: ease,
	});

export const pop = (t: number, at: number, damping = 11) =>
	t < at ? 0 : spring({frame: (t - at) * FPS, fps: FPS, config: {damping, mass: 0.55, stiffness: 170}});

// ---------- textures ----------
export const Paper: React.FC<{tone?: string; dark?: number}> = ({tone = PAPER, dark = 0.18}) => (
	<AbsoluteFill style={{background: tone}}>
		<svg width={W} height={H} style={{position: 'absolute'}}>
			<filter id="paperN">
				<feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={4} seed={3} />
				<feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.16  0 0 0 1.4 -0.55" />
			</filter>
			<filter id="paperF">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={8} />
				<feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.9 -0.35" />
			</filter>
			<rect width={W} height={H} filter="url(#paperN)" opacity={dark} />
			<rect width={W} height={H} filter="url(#paperF)" opacity={0.35} />
		</svg>
	</AbsoluteFill>
);

export const Grain: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.32, pointerEvents: 'none'}}>
			<svg width={W} height={H}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={f % 12} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width={W} height={H} filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 75% 60% at 50% 42%, rgba(0,0,0,0) 55%, rgba(25,15,5,${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

// Slow, always-moving camera (push-in + drift), like the reference edits.
export const Camera: React.FC<{t: number; start: number; end: number; from?: number; to?: number; drift?: number; children: React.ReactNode}> = ({
	t,
	start,
	end,
	from = 1,
	to = 1.08,
	drift = 20,
	children,
}) => {
	const p = ramp(t, start, end, Easing.inOut(Easing.quad));
	const s = from + (to - from) * p;
	return (
		<AbsoluteFill style={{transform: `scale(${s}) translateY(${-drift * p}px) rotate(${(p - 0.5) * 0.8}deg)`}}>
			{children}
		</AbsoluteFill>
	);
};

// ---------- cut-out paper ----------
export const tornPath = (w: number, h: number, seed: string, amp = 10, step = 22) => {
	const pts: string[] = [];
	const j = (i: number) => (random(`${seed}-${i}`) - 0.5) * amp;
	let i = 0;
	for (let x = 0; x <= w; x += step) pts.push(`${x},${j(i++)}`);
	for (let y = 0; y <= h; y += step) pts.push(`${w + j(i++)},${y}`);
	for (let x = w; x >= 0; x -= step) pts.push(`${x},${h + j(i++)}`);
	for (let y = h; y >= 0; y -= step) pts.push(`${j(i++)},${y}`);
	return pts.join(' ');
};

export const Torn: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	color?: string;
	seed: string;
	rot?: number;
	amp?: number;
	children?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({x, y, w, h, color = '#f4ecdb', seed, rot = 0, amp = 12, children, style}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: w,
			height: h,
			transform: `rotate(${rot}deg)`,
			filter: 'drop-shadow(0 10px 14px rgba(40,25,10,0.35))',
			...style,
		}}
	>
		<svg width={w + 20} height={h + 20} style={{position: 'absolute', left: -10, top: -10, overflow: 'visible'}}>
			<g transform="translate(10,10)">
				<polygon points={tornPath(w, h, seed, amp)} fill={color} />
			</g>
		</svg>
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{children}</div>
	</div>
);

export const Tape: React.FC<{x: number; y: number; rot?: number; w?: number}> = ({x, y, rot = -8, w = 150}) => (
	<div
		style={{
			position: 'absolute',
			left: x - w / 2,
			top: y - 22,
			width: w,
			height: 44,
			background: 'rgba(238,226,190,0.78)',
			transform: `rotate(${rot}deg)`,
			boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
			clipPath: 'polygon(2% 0, 98% 4%, 100% 50%, 97% 100%, 1% 96%, 3% 50%)',
		}}
	/>
);

// ---------- text graphics ----------
// The signature Vox element: black bold text on a yellow box, wiped in.
export const Label: React.FC<{
	t: number;
	at: number;
	x: number;
	y: number;
	size?: number;
	rot?: number;
	bg?: string;
	color?: string;
	out?: number;
	children: React.ReactNode;
}> = ({t, at, x, y, size = 64, rot = -2, bg = YELLOW, color = INK, out, children}) => {
	const p = ramp(t, at, at + 0.28, Easing.out(Easing.exp));
	const s = pop(t, at, 9);
	const o = out ? 1 - ramp(t, out, out + 0.15) : 1;
	if (t < at) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${0.85 + 0.15 * s})`,
				opacity: o,
				clipPath: `inset(-20% ${100 - p * 100}% -20% -5%)`,
				whiteSpace: 'nowrap',
			}}
		>
			<div
				style={{
					background: bg,
					color,
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: size,
					lineHeight: 1,
					padding: `${size * 0.16}px ${size * 0.28}px ${size * 0.2}px`,
					letterSpacing: -1,
					boxShadow: '0 6px 0 rgba(0,0,0,0.25)',
				}}
			>
				{children}
			</div>
		</div>
	);
};

export const Stamp: React.FC<{t: number; at: number; x: number; y: number; text: string; size?: number; rot?: number; color?: string}> = ({
	t,
	at,
	x,
	y,
	text,
	size = 150,
	rot = -10,
	color = RED,
}) => {
	if (t < at) return null;
	const p = ramp(t, at, at + 0.18, Easing.in(Easing.quad));
	const sc = 2.2 - 1.2 * p;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`,
				opacity: 0.15 + 0.75 * p,
				border: `${size * 0.07}px solid ${color}`,
				color,
				fontFamily: SANS,
				fontWeight: 800,
				fontSize: size,
				lineHeight: 1,
				padding: `${size * 0.08}px ${size * 0.2}px`,
				borderRadius: 14,
				letterSpacing: 4,
				mixBlendMode: 'multiply',
				maskImage: 'radial-gradient(circle at 30% 40%, #000 55%, rgba(0,0,0,0.7) 100%)',
			}}
		>
			{text}
		</div>
	);
};

export const Caption: React.FC<{t: number; at: number; x: number; y: number; size?: number; color?: string; font?: string; rot?: number; children: React.ReactNode; weight?: number}> = ({
	t,
	at,
	x,
	y,
	size = 34,
	color = INK,
	font = SANS,
	rot = 0,
	weight = 700,
	children,
}) => {
	const p = ramp(t, at, at + 0.4);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%,-50%) rotate(${rot}deg) translateY(${(1 - p) * 14}px)`,
				opacity: p,
				fontFamily: font,
				fontWeight: weight,
				fontSize: size,
				color,
				whiteSpace: 'nowrap',
				letterSpacing: 1,
			}}
		>
			{children}
		</div>
	);
};

// Number that counts up, monospaced digits (scale/HUD look).
export const fmtID = (n: number, dec = 0) =>
	n.toLocaleString('id-ID', {minimumFractionDigits: dec, maximumFractionDigits: dec});

// ---------- routes ----------
export type Pt = [number, number];
export const bezier = (a: Pt, c: Pt, b: Pt, n = 60): Pt[] =>
	Array.from({length: n + 1}, (_, i) => {
		const u = i / n;
		return [
			(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u ** 2 * b[0],
			(1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u ** 2 * b[1],
		];
	});
const lenOf = (p: Pt[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
export const pointAt = (p: Pt[], prog: number): Pt => {
	const L = lenOf(p) * prog;
	let acc = 0;
	for (let i = 1; i < p.length; i++) {
		const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
		if (acc + d >= L) {
			const u = d ? (L - acc) / d : 0;
			return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * u, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * u];
		}
		acc += d;
	}
	return p[p.length - 1];
};

export const Route: React.FC<{pts: Pt[]; prog: number; color?: string; width?: number; dash?: string; id: string}> = ({
	pts,
	prog,
	color = '#fff',
	width = 8,
	dash = '18 14',
	id,
}) => {
	const L = lenOf(pts);
	const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
	return (
		<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			<mask id={id} maskUnits="userSpaceOnUse">
				<path d={d} stroke="#fff" strokeWidth={width * 3} fill="none" strokeDasharray={L} strokeDashoffset={L * (1 - prog)} />
			</mask>
			<path d={d} stroke="rgba(0,0,0,0.35)" strokeWidth={width} fill="none" strokeDasharray={dash} mask={`url(#${id})`} transform="translate(3,4)" />
			<path d={d} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dash} strokeLinecap="round" mask={`url(#${id})`} />
		</svg>
	);
};

export const Dot: React.FC<{t: number; at: number; x: number; y: number; color?: string; r?: number}> = ({t, at, x, y, color = YELLOW, r = 16}) => {
	const s = pop(t, at);
	const ring = ramp(t, at, at + 1.2, Easing.out(Easing.quad));
	return (
		<div style={{position: 'absolute', left: x, top: y}}>
			<div
				style={{
					position: 'absolute',
					width: r * 6,
					height: r * 6,
					left: -r * 3,
					top: -r * 3,
					borderRadius: '50%',
					border: `4px solid ${color}`,
					transform: `scale(${ring})`,
					opacity: t < at ? 0 : 1 - ring,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					width: r * 2,
					height: r * 2,
					left: -r,
					top: -r,
					borderRadius: '50%',
					background: color,
					border: '4px solid #fff',
					boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
					transform: `scale(${s})`,
				}}
			/>
		</div>
	);
};

export const Disclaimer: React.FC<{text: string}> = ({text}) => (
	<div
		style={{
			position: 'absolute',
			top: 70,
			width: '100%',
			textAlign: 'center',
			fontFamily: SANS,
			fontWeight: 500,
			fontSize: 22,
			color: 'rgba(30,20,10,0.55)',
			letterSpacing: 1,
		}}
	>
		{text}
	</div>
);

export const useFrameInfo = () => useVideoConfig();
