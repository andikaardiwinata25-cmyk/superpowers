import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	OffthreadVideo,
	Sequence,
	continueRender,
	delayRender,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import wordsRaw from './words.json';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
export const FPS = 30;
const DURATION_S = 82.94;
export const TOTAL_FRAMES = Math.round(DURATION_S * FPS);
const f = (s: number) => Math.round(s * FPS);

const GREEN = '#9CF27A';
const RED = '#FF4B4B';
const GOLD = '#E8C27A';

// Safe zone 1080x1920 (TikTok / Reels / Shorts, gabungan paling ketat):
// atas 250px, bawah 400px (y <= 1520), kiri 60px, kanan 130px (x <= 950)
const SAFE = {top: 250, bottom: 1520, left: 60, right: 950};

// Kartu video (gaya "edittomm": kartu rounded, border putih glow)
const CARD = {x: 180, y: 540, w: 720, h: 940};
const SUB_Y = 1195; // pusat subtitle, ±62% tinggi frame

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */
const fontHandle = delayRender('fonts');
const fonts: [string, string, string, string?][] = [
	['Montserrat', 'Montserrat-500.ttf', '500'],
	['Montserrat', 'Montserrat-600.ttf', '600'],
	['Montserrat', 'Montserrat-700.ttf', '700'],
	['Montserrat', 'Montserrat-800.ttf', '800'],
	['Amiri', 'Amiri-0.ttf', '400'],
	['Amiri', 'Amiri-1.ttf', '700'],
	['Playfair', 'Playfair-it.ttf', '600', 'italic'],
];
Promise.all(
	fonts.map(([fam, file, weight, style]) => {
		const ff = new FontFace(fam, `url(${staticFile(file)})`, {
			weight,
			style: style ?? 'normal',
		});
		return ff.load().then((l) => document.fonts.add(l));
	}),
)
	.then(() => continueRender(fontHandle))
	.catch((e) => {
		console.error(e);
		continueRender(fontHandle);
	});

const MONT = 'Montserrat, sans-serif';
const AMIRI = 'Amiri, serif';
const PLAY = 'Playfair, serif';

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */
type Theme = 'dark' | 'light';
type Seg =
	| {from: number; to: number; kind: 'full'}
	| {from: number; to: number; kind: 'speaker'; zoom: 'wide' | 'mid' | 'tight'; enterFromFull?: boolean}
	| {from: number; to: number; kind: 'broll'; src: string; offset?: number; rate?: number}
	| {from: number; to: number; kind: 'hadith'};

const SEGS: Seg[] = [
	{from: 0, to: 4.5, kind: 'full'},
	{from: 4.5, to: 8.0, kind: 'speaker', zoom: 'mid', enterFromFull: true},
	{from: 8.0, to: 11.0, kind: 'broll', src: '8487', rate: 0.78},
	{from: 11.0, to: 15.4, kind: 'speaker', zoom: 'tight'},
	{from: 15.4, to: 18.4, kind: 'broll', src: 'kabah'},
	{from: 18.4, to: 23.4, kind: 'hadith'},
	{from: 23.4, to: 26.7, kind: 'speaker', zoom: 'mid'},
	{from: 26.7, to: 29.9, kind: 'broll', src: 'hujan'},
	{from: 29.9, to: 33.8, kind: 'speaker', zoom: 'wide'},
	{from: 33.8, to: 36.1, kind: 'broll', src: '8467', rate: 0.72},
	{from: 36.1, to: 38.4, kind: 'broll', src: 'kabah', offset: 6},
	{from: 38.4, to: 42.9, kind: 'speaker', zoom: 'tight'},
	{from: 42.9, to: 47.8, kind: 'broll', src: 'live_isya'},
	{from: 47.8, to: 51.8, kind: 'speaker', zoom: 'mid'},
	{from: 51.8, to: 55.0, kind: 'broll', src: '8389', rate: 0.94},
	{from: 55.0, to: 59.0, kind: 'speaker', zoom: 'tight'},
	{from: 59.0, to: 61.0, kind: 'broll', src: '3450'},
	{from: 61.0, to: 63.0, kind: 'broll', src: '8489', rate: 0.9},
	{from: 63.0, to: 67.2, kind: 'speaker', zoom: 'mid'},
	{from: 67.2, to: 69.6, kind: 'broll', src: '8320'},
	{from: 69.6, to: 72.5, kind: 'broll', src: '3438', rate: 0.9},
	{from: 72.5, to: 76.8, kind: 'speaker', zoom: 'tight'},
	{from: 76.8, to: 78.7, kind: 'speaker', zoom: 'wide'},
	{from: 78.7, to: DURATION_S, kind: 'broll', src: '8321', rate: 0.85},
];

// Segmen dengan latar terang (variasi seperti referensi)
const LIGHT_RANGES: [number, number][] = [
	[29.9, 38.4],
	[59.0, 67.2],
];
const themeAt = (t: number): Theme =>
	LIGHT_RANGES.some(([a, b]) => t >= a && t < b) ? 'light' : 'dark';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const usePop = (atS: number, damping = 13) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - f(atS), fps, config: {damping, mass: 0.6, stiffness: 180}});
};

const fadeOut = (frame: number, endS: number, dur = 6) =>
	interpolate(frame, [f(endS) - dur, f(endS)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/* ------------------------------------------------------------------ */
/* Background                                                          */
/* ------------------------------------------------------------------ */
const Background: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	// crossfade 6 frame antar tema
	let lightAmt = 0;
	for (const [a, b] of LIGHT_RANGES) {
		lightAmt = Math.max(
			lightAmt,
			interpolate(t, [a - 0.1, a + 0.1, b - 0.1, b + 0.1], [0, 1, 1, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			}),
		);
	}
	const drift = Math.sin(frame / 90) * 40;
	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% ${45 + drift / 20}%, #26262b 0%, #101012 45%, #050506 100%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					opacity: lightAmt,
					background: `radial-gradient(circle at 50% ${45 + drift / 20}%, #ffffff 0%, #e4e4e4 45%, #a9a9a9 100%)`,
				}}
			/>
			{/* grid halus */}
			<AbsoluteFill
				style={{
					opacity: 0.06 + lightAmt * 0.04,
					backgroundImage:
						'linear-gradient(rgba(128,128,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,1) 1px, transparent 1px)',
					backgroundSize: '90px 90px',
					backgroundPosition: `${drift}px ${drift * 0.5}px`,
					maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 75%)',
					WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 75%)',
				}}
			/>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* Card / Shots                                                        */
/* ------------------------------------------------------------------ */
const cardShadow = '0 0 0 3px rgba(255,255,255,0.92), 0 0 34px rgba(255,255,255,0.35), 0 40px 80px rgba(0,0,0,0.55)';

const Card: React.FC<{seg: Seg; children: React.ReactNode}> = ({seg, children}) => {
	const frame = useCurrentFrame(); // relatif terhadap Sequence
	const {fps} = useVideoConfig();
	const enter = spring({frame, fps, config: {damping: 15, mass: 0.7, stiffness: 160}});
	let x = CARD.x;
	let y = CARD.y;
	let w = CARD.w;
	let h = CARD.h;
	let r = 40;
	let scale = interpolate(enter, [0, 1], [0.9, 1]);
	let opacity = interpolate(enter, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'});
	if (seg.kind === 'speaker' && seg.enterFromFull) {
		const p = spring({frame, fps, config: {damping: 18, mass: 0.8, stiffness: 120}});
		x = interpolate(p, [0, 1], [0, CARD.x]);
		y = interpolate(p, [0, 1], [0, CARD.y]);
		w = interpolate(p, [0, 1], [1080, CARD.w]);
		h = interpolate(p, [0, 1], [1920, CARD.h]);
		r = interpolate(p, [0, 1], [0, 40]);
		scale = 1;
		opacity = 1;
	}
	// sedikit melayang supaya kamera tidak pernah diam
	const floatY = Math.sin(frame / 25) * 4;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y + floatY,
				width: w,
				height: h,
				borderRadius: r,
				overflow: 'hidden',
				boxShadow: cardShadow,
				transform: `scale(${scale})`,
				opacity,
				background: '#000',
			}}
		>
			{children}
		</div>
	);
};

const ZOOMS = {wide: [1.0, 1.06], mid: [1.16, 1.24], tight: [1.42, 1.52]} as const;

const SpeakerShot: React.FC<{seg: Extract<Seg, {kind: 'speaker'}>}> = ({seg}) => {
	const frame = useCurrentFrame();
	const len = f(seg.to - seg.from);
	const [z0, z1] = ZOOMS[seg.zoom];
	const z = interpolate(frame, [0, len], [z0, z1], {easing: Easing.inOut(Easing.quad)});
	return (
		<Card seg={seg}>
			<OffthreadVideo
				src={staticFile('main.mp4')}
				startFrom={f(seg.from)}
				muted
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${z})`,
					transformOrigin: '50% 36%',
				}}
			/>
			<Vignette />
		</Card>
	);
};

const Vignette: React.FC = () => (
	<AbsoluteFill
		style={{
			background:
				'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%), radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
		}}
	/>
);

const BrollShot: React.FC<{seg: Extract<Seg, {kind: 'broll'}>; index: number}> = ({seg, index}) => {
	const frame = useCurrentFrame();
	const len = f(seg.to - seg.from);
	const dir = index % 2 === 0 ? 1 : -1;
	const z = interpolate(frame, [0, len], [1.08, 1.18]);
	const tx = interpolate(frame, [0, len], [-14 * dir, 14 * dir]);
	return (
		<Card seg={seg}>
			<OffthreadVideo
				src={staticFile(`broll/${seg.src}.mp4`)}
				startFrom={f(seg.offset ?? 0)}
				playbackRate={seg.rate ?? 1}
				muted
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${z}) translateX(${tx}px)`,
				}}
			/>
			<Vignette />
		</Card>
	);
};

const FullShot: React.FC<{seg: Seg}> = ({seg}) => {
	const frame = useCurrentFrame();
	const len = f(seg.to - seg.from);
	const z = interpolate(frame, [0, len], [1.12, 1.0], {easing: Easing.out(Easing.cubic)});
	return (
		<AbsoluteFill>
			<OffthreadVideo
				src={staticFile('main.mp4')}
				muted
				style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, transformOrigin: '50% 35%'}}
			/>
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 32%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* Hadith scene                                                        */
/* ------------------------------------------------------------------ */
// Teks: HR. al-Bukhari no. 1773 & Muslim no. 1349, dari Abu Hurairah r.a.
const HADITH: {w: string; at: number}[] = [
	{w: 'الْعُمْرَةُ', at: 18.6},
	{w: 'إِلَى', at: 19.72},
	{w: 'الْعُمْرَةِ', at: 19.98},
	{w: 'كَفَّارَةٌ', at: 20.38},
	{w: 'لِمَا', at: 21.38},
	{w: 'بَيْنَهُمَا', at: 21.8},
];

const HadithScene: React.FC = () => {
	const frame = useCurrentFrame(); // relatif (mulai 18.4)
	const {fps} = useVideoConfig();
	const t = frame / fps + 18.4;
	const enter = spring({frame, fps, config: {damping: 14, mass: 0.8, stiffness: 140}});
	const len = f(23.4 - 18.4);
	const z = interpolate(frame, [0, len], [1, 1.05]);
	const srcIn = interpolate(t, [22.4, 22.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const imgW = 1040;
	const imgTop = 300;
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: (1080 - imgW) / 2 - 10,
					top: imgTop,
					width: imgW,
					height: imgW,
					transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px) rotate(${interpolate(enter, [0, 1], [-6, -1.5])}deg) scale(${z * interpolate(enter, [0, 1], [0.85, 1])})`,
					opacity: interpolate(enter, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
					filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.6))',
				}}
			>
				<Img src={staticFile('img/parchment.png')} style={{width: '100%', height: '100%'}} />
				{/* area kertas: x 11%–86%, y 22%–78% */}
				<div
					style={{
						position: 'absolute',
						left: '15%',
						right: '16%',
						top: '27%',
						bottom: '26%',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 18,
					}}
				>
					<div style={{fontFamily: MONT, fontWeight: 700, fontSize: 22, letterSpacing: 6, color: '#7a4b22'}}>
						RASULULLAH <span style={{fontFamily: AMIRI, fontSize: 30, letterSpacing: 0}}>ﷺ</span> BERSABDA
					</div>
					<div
						dir="rtl"
						style={{
							fontFamily: AMIRI,
							fontWeight: 700,
							fontSize: 62,
							lineHeight: 1.5,
							color: '#3b2210',
							textAlign: 'center',
							display: 'flex',
							flexWrap: 'wrap',
							justifyContent: 'center',
							columnGap: 16,
						}}
					>
						{HADITH.map(({w, at}) => {
							const p = spring({frame: frame - f(at - 18.4), fps, config: {damping: 16, mass: 0.5}});
							return (
								<span
									key={w + at}
									style={{
										opacity: interpolate(p, [0, 1], [0.12, 1]),
										transform: `translateY(${interpolate(p, [0, 1], [10, 0])}px)`,
										color: w === 'كَفَّارَةٌ' && t > 20.38 ? '#1f6b1a' : undefined,
									}}
								>
									{w}
								</span>
							);
						})}
					</div>
					<div
						style={{
							opacity: srcIn,
							fontFamily: MONT,
							fontWeight: 600,
							fontSize: 22,
							color: '#6b4220',
							textAlign: 'center',
							lineHeight: 1.4,
						}}
					>
						“Umrah ke umrah berikutnya adalah penghapus dosa di antara keduanya.”
						<br />
						<span style={{fontWeight: 800, fontSize: 19, letterSpacing: 2}}>HR. AL-BUKHARI NO. 1773 & MUSLIM NO. 1349</span>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* Top-zone graphics                                                   */
/* ------------------------------------------------------------------ */
const Badge: React.FC<{text: string; color: string; at: number; until: number; y: number; dark?: boolean}> = ({
	text,
	color,
	at,
	until,
	y,
	dark,
}) => {
	const frame = useCurrentFrame();
	const p = usePop(at);
	if (frame < f(at) || frame > f(until)) return null;
	return (
		<div
			style={{
				position: 'absolute',
				top: y,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity: fadeOut(frame, until) * interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
				transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
			}}
		>
			<div
				style={{
					fontFamily: MONT,
					fontWeight: 800,
					fontSize: 26,
					letterSpacing: 2,
					padding: '8px 20px',
					borderRadius: 8,
					background: color,
					color: dark ? '#0b0b0b' : '#fff',
					boxShadow: `0 0 22px ${color}88`,
				}}
			>
				{text}
			</div>
		</div>
	);
};

type Run = {t: string; c?: string; font?: 'play' | 'arab'};
const Line: React.FC<{
	runs: Run[];
	at: number;
	until: number;
	y: number;
	size?: number;
	theme?: Theme;
	weight?: number;
}> = ({runs, at, until, y, size = 50, theme = 'dark', weight = 800}) => {
	const frame = useCurrentFrame();
	const p = usePop(at, 15);
	if (frame < f(at) || frame > f(until)) return null;
	const base = theme === 'dark' ? '#ffffff' : '#141414';
	return (
		<div
			style={{
				position: 'absolute',
				top: y,
				left: SAFE.left + 60,
				right: 1080 - SAFE.right + 0,
				textAlign: 'center',
				fontFamily: MONT,
				fontWeight: weight,
				fontSize: size,
				lineHeight: 1.15,
				color: base,
				opacity: fadeOut(frame, until) * interpolate(p, [0, 0.35], [0, 1], {extrapolateRight: 'clamp'}),
				transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)`,
				textShadow: theme === 'dark' ? '0 4px 18px rgba(0,0,0,0.6)' : 'none',
			}}
		>
			{runs.map((r, i) => (
				<span
					key={i}
					style={{
						color: r.c ?? base,
						fontFamily: r.font === 'play' ? PLAY : r.font === 'arab' ? AMIRI : MONT,
						fontStyle: r.font === 'play' ? 'italic' : 'normal',
						fontWeight: r.font === 'play' ? 600 : r.font === 'arab' ? 700 : weight,
					}}
				>
					{r.t}
				</span>
			))}
		</div>
	);
};

const Chip: React.FC<{text: string; at: number; until: number; x: number; y: number; color?: string; theme?: Theme}> = ({
	text,
	at,
	until,
	x,
	y,
	color = GREEN,
	theme = 'dark',
}) => {
	const frame = useCurrentFrame();
	const p = usePop(at, 11);
	if (frame < f(at) || frame > f(until)) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translateX(-50%) scale(${interpolate(p, [0, 1], [0.4, 1])})`,
				opacity: fadeOut(frame, until) * interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
				fontFamily: MONT,
				fontWeight: 700,
				fontSize: 28,
				padding: '10px 20px',
				borderRadius: 14,
				border: `2px solid ${color}`,
				color: theme === 'dark' ? '#fff' : '#111',
				background: theme === 'dark' ? 'rgba(20,20,22,0.85)' : 'rgba(255,255,255,0.9)',
				boxShadow: `0 0 18px ${color}55`,
				whiteSpace: 'nowrap',
			}}
		>
			{text}
		</div>
	);
};

const CheckRow: React.FC<{text: string; tag?: string; at: number; until: number; y: number; ok: boolean}> = ({
	text,
	tag,
	at,
	until,
	y,
	ok,
}) => {
	const frame = useCurrentFrame();
	const p = usePop(at, 14);
	if (frame < f(at) || frame > f(until)) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: 250,
				top: y,
				display: 'flex',
				alignItems: 'center',
				gap: 16,
				opacity: fadeOut(frame, until) * interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
				transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`,
				fontFamily: MONT,
				fontWeight: 700,
				fontSize: 32,
				color: '#fff',
				textShadow: '0 3px 12px rgba(0,0,0,0.6)',
			}}
		>
			<div
				style={{
					width: 38,
					height: 38,
					borderRadius: 10,
					background: ok ? GREEN : 'transparent',
					border: ok ? 'none' : '2px solid rgba(255,255,255,0.6)',
					color: '#0b0b0b',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 26,
					fontWeight: 800,
				}}
			>
				{ok ? '✓' : ''}
			</div>
			<span style={{opacity: ok ? 1 : 0.75}}>{text}</span>
			{tag ? (
				<span
					style={{
						fontSize: 20,
						fontWeight: 800,
						letterSpacing: 1.5,
						padding: '4px 10px',
						borderRadius: 6,
						background: 'rgba(255,255,255,0.15)',
						color: '#d7d7d7',
					}}
				>
					{tag}
				</span>
			) : null}
		</div>
	);
};

const NumRow: React.FC<{n: string; text: Run[]; at: number; until: number; y: number}> = ({n, text, at, until, y}) => {
	const frame = useCurrentFrame();
	const p = usePop(at, 14);
	if (frame < f(at) || frame > f(until)) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: y,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				gap: 16,
				opacity: fadeOut(frame, until) * interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
				transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`,
			}}
		>
			<span style={{fontFamily: MONT, fontWeight: 800, fontSize: 46, color: '#1a1a1a'}}>{n}</span>
			<span
				style={{
					fontFamily: MONT,
					fontWeight: 700,
					fontSize: 30,
					color: '#fff',
					background: '#2a2a2d',
					padding: '10px 22px',
					borderRadius: 10,
					boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
				}}
			>
				{text.map((r, i) => (
					<span key={i} style={{color: r.c ?? '#fff'}}>
						{r.t}
					</span>
				))}
			</span>
		</div>
	);
};

const SeriesTag: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const theme = themeAt(t);
	const o = interpolate(frame, [f(4.3), f(4.9)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div
			style={{
				position: 'absolute',
				top: SAFE.top + 4,
				left: 0,
				right: 0,
				textAlign: 'center',
				fontFamily: MONT,
				fontWeight: 700,
				fontSize: 20,
				letterSpacing: 7,
				color: theme === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
				opacity: o,
			}}
		>
			JEJAK IBADAH · UMRAH
		</div>
	);
};

const TopGraphics: React.FC = () => {
	const Y1 = 310; // baris judul 1
	const Y2 = 380;
	const Y3 = 448;
	return (
		<>
			<SeriesTag />
			{/* HOOK (full-screen) */}
			<Line at={0.15} until={4.45} y={300} size={30} weight={700} runs={[{t: 'JEJAK IBADAH', c: 'rgba(255,255,255,0.75)'}]} />
			<Line at={0.35} until={4.45} y={360} size={76} runs={[{t: 'Umrah '}, {t: 'berkali-kali', c: GREEN}, {t: ','}]} />
			<Line at={1.0} until={4.45} y={450} size={70} runs={[{t: 'boleh ', font: 'play', c: GOLD}, {t: 'nggak?'}]} />

			{/* PERTANYAAN */}
			<Badge text="PERTANYAAN" color={RED} at={4.6} until={11.0} y={Y1} />
			<Chip text="Umrah ke-1" at={4.7} until={11.0} x={300} y={Y2 + 20} />
			<Chip text="ke-2" at={8.0} until={11.0} x={490} y={Y2 + 20} />
			<Chip text="ke-3" at={9.14} until={11.0} x={630} y={Y2 + 20} />
			<Chip text="dst…" at={10.08} until={11.0} x={775} y={Y2 + 20} color="#ffffff" />

			<Line at={11.1} until={15.4} y={Y1} size={40} runs={[{t: 'Apakah '}, {t: 'dianjurkan', c: GREEN}, {t: '?'}]} />
			<Line at={13.3} until={15.4} y={Y2 + 4} size={40} runs={[{t: 'atau '}, {t: 'cukup sekali', c: RED}, {t: ' saja?'}]} />

			{/* Nabi bersabda */}
			<Line
				at={15.5}
				until={18.4}
				y={Y1 - 4}
				size={56}
				runs={[{t: 'Nabi ', font: 'play', c: GOLD}, {t: 'ﷺ ', font: 'arab', c: GOLD}, {t: 'bersabda', font: 'play', c: GOLD}]}
			/>
			<Line at={16.2} until={18.4} y={Y3 - 10} size={26} weight={600} runs={[{t: 'Hadits riwayat Abu Hurairah r.a.', c: 'rgba(255,255,255,0.75)'}]} />

			{/* Penjelasan hadits */}
			<Badge text="ARTINYA" color={GREEN} dark at={23.5} until={29.9} y={Y1} />
			<Line at={23.5} until={29.9} y={Y2} size={40} runs={[{t: 'Umrah ➝ umrah berikutnya'}]} />
			<Line at={26.76} until={29.9} y={Y3} size={40} runs={[{t: '= '}, {t: 'penghapus dosa', c: GREEN}, {t: ' di antaranya'}]} />

			{/* HUKUM (light) */}
			<Badge text="HUKUMNYA" color="#141414" at={29.95} until={38.4} y={Y1} />
			<Chip text="Dibolehkan ✓" at={31.72} until={38.4} x={390} y={Y2 + 14} color="#3aa55a" theme="light" />
			<Chip text="Dianjurkan ✓" at={33.1} until={38.4} x={690} y={Y2 + 14} color="#3aa55a" theme="light" />
			<Line
				at={35.58}
				until={38.4}
				y={Y3 + 20}
				size={28}
				weight={700}
				theme="light"
				runs={[{t: 'bagi yang punya '}, {t: 'kesempatan & waktu', c: '#2f8f4a'}]}
			/>

			{/* TAPI INGAT */}
			<Badge text="TAPI INGAT!" color={RED} at={38.5} until={42.9} y={Y1} />
			<Line at={39.0} until={42.9} y={Y2} size={40} runs={[{t: 'Jangan sampai '}, {t: 'mengganggu', c: RED}]} />
			<Line at={42.94} until={59.0} y={Y1 - 10} size={34} runs={[{t: 'KEWAJIBAN ', c: GREEN}, {t: 'LAINNYA'}]} />
			<CheckRow text="Sholat fardhu" at={46.88} until={59.0} y={Y2 - 8} ok />
			<CheckRow text="Kewajiban dunia" at={50.14} until={59.0} y={Y2 + 42} ok />
			<CheckRow text="Umrah" tag="SUNNAH" at={58.02} until={59.0} y={Y2 + 92} ok={false} />

			{/* YANG PERLU DIPERHATIKAN (light) */}
			<Badge text="YANG PERLU DIPERHATIKAN" color="#141414" at={59.1} until={67.2} y={Y1} />
			<NumRow n="#1" text={[{t: 'Umrah dengan '}, {t: 'ilmu', c: GREEN}]} at={63.34} until={67.2} y={Y2 - 4} />
			<NumRow n="#2" text={[{t: 'Dikerjakan '}, {t: 'sebaik mungkin', c: GREEN}]} at={66.04} until={67.2} y={Y3 + 2} />

			<Line at={67.3} until={72.5} y={Y1} size={40} runs={[{t: 'Tanpa '}, {t: 'mengorbankan', c: RED}]} />
			<Line at={71.76} until={72.5} y={Y2 + 4} size={40} runs={[{t: 'yang lebih '}, {t: 'utama', c: GREEN}]} />

			<Line at={73.14} until={76.8} y={Y1} size={42} runs={[{t: 'Mana yang lebih '}, {t: 'utama', c: GREEN}, {t: '?'}]} />
			<Line at={74.6} until={76.8} y={Y2 + 6} size={44} runs={[{t: 'Kita', font: 'play', c: GOLD}, {t: ' yang paling tahu.'}]} />

			{/* Penutup Arab */}
			<Line at={76.85} until={78.7} y={Y1 + 2} size={70} runs={[{t: 'وَاللّٰهُ تَعَالَى أَعْلَمُ', font: 'arab', c: GOLD}]} />
			<Line at={77.2} until={78.7} y={Y3 + 22} size={26} weight={600} runs={[{t: "Wallāhu ta'ālā a'lam", c: 'rgba(255,255,255,0.8)'}]} />
			<Line
				at={78.75}
				until={DURATION_S}
				y={Y1 + 10}
				size={54}
				runs={[{t: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ', font: 'arab', c: GOLD}]}
			/>
		</>
	);
};

/* ------------------------------------------------------------------ */
/* Subtitles (Rehlata style)                                           */
/* ------------------------------------------------------------------ */
type W = {text: string; start: number; end: number; key: boolean};
const WORDS = wordsRaw as W[];

const chunks: W[][] = (() => {
	const out: W[][] = [];
	let cur: W[] = [];
	for (const w of WORDS) {
		if (cur.length) {
			const gap = w.start - cur[cur.length - 1].end;
			const chars = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
			const endsSentence = /[.?!,:]$/.test(cur[cur.length - 1].text);
			if (cur.length >= 4 || chars > 22 || gap > 0.35 || (endsSentence && cur.length >= 2)) {
				out.push(cur);
				cur = [];
			}
		}
		cur.push(w);
	}
	if (cur.length) out.push(cur);
	return out;
})();

// Saat hadits/lafaz Arab tampil besar, subtitle latin tetap muncul (transliterasi)
const Subtitles: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const idx = chunks.findIndex((c, i) => {
		const start = c[0].start;
		const next = chunks[i + 1];
		const end = Math.min(c[c.length - 1].end + 0.25, next ? next[0].start : 999);
		return t >= start && t < end;
	});
	if (idx < 0) return null;
	const c = chunks[idx];
	const p = spring({frame: frame - f(c[0].start), fps: FPS, config: {damping: 18, mass: 0.4}});
	return (
		<div
			style={{
				position: 'absolute',
				top: SUB_Y - 30,
				left: 160,
				right: 1080 - 920,
				textAlign: 'center',
				fontFamily: MONT,
				fontWeight: 700,
				fontSize: 45,
				lineHeight: 1.2,
				transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})`,
			}}
		>
			{c.map((w, i) => {
				const spoken = t >= w.start - 0.03;
				const color = !spoken ? 'rgba(200,200,200,0.55)' : w.key ? GREEN : '#ffffff';
				return (
					<span
						key={i}
						style={{
							color,
							textShadow: '0 2px 3px rgba(0,0,0,0.9), 0 0 14px rgba(0,0,0,0.65)',
							WebkitTextStroke: '1px rgba(0,0,0,0.35)',
							fontFamily: w.text.includes('ﷺ') ? `${MONT}, ${AMIRI}` : MONT,
						}}
					>
						{w.text}
						{i < c.length - 1 ? ' ' : ''}
					</span>
				);
			})}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* SFX & overlays                                                      */
/* ------------------------------------------------------------------ */
type Sfx = {at: number; file: string; vol: number; len?: number};
const SFX: Sfx[] = [
	{at: 0.3, file: 'whoosh', vol: 0.35},
	{at: 1.0, file: 'click', vol: 0.35},
	{at: 4.45, file: 'zoom', vol: 0.22, len: 1.0},
	{at: 4.7, file: 'click', vol: 0.35},
	{at: 8.0, file: 'click', vol: 0.35},
	{at: 9.14, file: 'click', vol: 0.35},
	{at: 10.08, file: 'click', vol: 0.3},
	{at: 13.3, file: 'deng', vol: 0.25},
	{at: 16.4, file: 'riser', vol: 0.22, len: 2.0},
	{at: 18.35, file: 'paperflip', vol: 0.55},
	{at: 18.4, file: 'aurora', vol: 0.22},
	{at: 26.76, file: 'uitone2', vol: 0.25, len: 0.8},
	{at: 29.9, file: 'whoosh', vol: 0.3},
	{at: 31.72, file: 'click', vol: 0.35},
	{at: 33.1, file: 'click', vol: 0.35},
	{at: 38.45, file: 'deng', vol: 0.3},
	{at: 46.88, file: 'click', vol: 0.35},
	{at: 50.14, file: 'click', vol: 0.35},
	{at: 58.02, file: 'click', vol: 0.3},
	{at: 59.0, file: 'whoosh', vol: 0.3},
	{at: 63.34, file: 'shutter', vol: 0.3},
	{at: 66.04, file: 'shutter', vol: 0.3},
	{at: 76.8, file: 'aurora', vol: 0.18},
	{at: 78.7, file: 'whoosh', vol: 0.25},
];

// whoosh halus di setiap pergantian shot (kecuali yang sudah punya sfx)
const CUT_SFX: Sfx[] = SEGS.slice(1)
	.filter((s) => !SFX.some((x) => Math.abs(x.at - s.from) < 0.3))
	.map((s) => ({at: s.from - 0.08, file: 'swipes', vol: 0.12, len: 0.45}));

const SfxTrack: React.FC = () => (
	<>
		{[...SFX, ...CUT_SFX].map((s, i) => (
			<Sequence key={i} from={Math.max(0, f(s.at))} durationInFrames={s.len ? f(s.len) : undefined} layout="none">
				<Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.vol} />
			</Sequence>
		))}
	</>
);

const FLASHES: {at: number; file: string; opacity: number}[] = [
	{at: 18.2, file: 'flare2', opacity: 0.75},
	{at: 29.75, file: 'mlt3', opacity: 0.55},
	{at: 59.85 - 0.95, file: 'mlt3', opacity: 0.5},
	{at: 78.5, file: 'flare2', opacity: 0.7},
];

const Flashes: React.FC = () => (
	<>
		{FLASHES.map((fl, i) => (
			<Sequence key={i} from={f(fl.at)} durationInFrames={f(0.72)}>
				<AbsoluteFill style={{mixBlendMode: 'screen', opacity: fl.opacity}}>
					<OffthreadVideo src={staticFile(`trans/${fl.file}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</AbsoluteFill>
			</Sequence>
		))}
	</>
);

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export const JejakIbadah: React.FC = () => {
	const frame = useCurrentFrame();
	const endFade = interpolate(frame, [TOTAL_FRAMES - 18, TOTAL_FRAMES - 1], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<Background />
			{SEGS.map((s, i) => (
				<Sequence key={i} from={f(s.from)} durationInFrames={f(s.to) - f(s.from)}>
					{s.kind === 'full' ? <FullShot seg={s} /> : null}
					{s.kind === 'speaker' ? <SpeakerShot seg={s} /> : null}
					{s.kind === 'broll' ? <BrollShot seg={s} index={i} /> : null}
					{s.kind === 'hadith' ? <HadithScene /> : null}
				</Sequence>
			))}
			<TopGraphics />
			<Subtitles />
			<Flashes />
			<Audio src={staticFile('voice.wav')} />
			<SfxTrack />
			<AbsoluteFill style={{backgroundColor: '#000', opacity: endFade}} />
		</AbsoluteFill>
	);
};
