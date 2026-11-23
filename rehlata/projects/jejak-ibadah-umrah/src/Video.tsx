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

// Kartu video (gaya "edittomm") — hanya untuk bagian penjelasan
const CARD = {x: 180, y: 540, w: 720, h: 940};
const SUB_Y = 1195; // pusat subtitle, ±62% tinggi frame

// Baris teks atas (dirapatkan)
const Y1 = 300;
const Y2 = 354;
const Y3 = 402;

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
		const ff = new FontFace(fam, `url(${staticFile(file)})`, {weight, style: style ?? 'normal'});
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
type Zoom = 'hook' | 'wide' | 'mid' | 'tight';
type Seg =
	| {from: number; to: number; kind: 'speaker'; zoom: Zoom; card?: boolean; enterFromFull?: boolean}
	| {from: number; to: number; kind: 'broll'; src: string; offset?: number; rate?: number; card?: boolean; enterFromFull?: boolean}
	| {from: number; to: number; kind: 'hadith'; card?: undefined; enterFromFull?: undefined};

const SEGS: Seg[] = [
	{from: 0, to: 4.5, kind: 'speaker', zoom: 'hook'},
	{from: 4.5, to: 8.0, kind: 'speaker', zoom: 'mid'},
	{from: 8.0, to: 11.0, kind: 'broll', src: '8487', rate: 0.78},
	{from: 11.0, to: 15.4, kind: 'speaker', zoom: 'tight'},
	{from: 15.4, to: 18.4, kind: 'broll', src: 'kabah'},
	{from: 18.4, to: 23.4, kind: 'hadith'},
	// --- penjelasan hadits (kartu) ---
	{from: 23.4, to: 26.7, kind: 'speaker', zoom: 'mid', card: true, enterFromFull: true},
	{from: 26.7, to: 29.9, kind: 'broll', src: 'hujan', card: true},
	{from: 29.9, to: 33.8, kind: 'speaker', zoom: 'wide', card: true},
	{from: 33.8, to: 36.1, kind: 'broll', src: '8467', rate: 0.72, card: true},
	{from: 36.1, to: 38.4, kind: 'broll', src: 'kabah', offset: 6, card: true},
	// --- full ---
	{from: 38.4, to: 42.9, kind: 'speaker', zoom: 'tight'},
	{from: 42.9, to: 47.8, kind: 'broll', src: 'live_isya'},
	{from: 47.8, to: 51.8, kind: 'speaker', zoom: 'mid'},
	{from: 51.8, to: 55.0, kind: 'broll', src: '8389', rate: 0.94},
	{from: 55.0, to: 59.0, kind: 'speaker', zoom: 'tight'},
	// --- yang perlu diperhatikan (kartu) ---
	{from: 59.0, to: 61.0, kind: 'broll', src: '3450', card: true, enterFromFull: true},
	{from: 61.0, to: 63.0, kind: 'broll', src: '8489', rate: 0.9, card: true},
	{from: 63.0, to: 67.2, kind: 'speaker', zoom: 'mid', card: true},
	// --- full ---
	{from: 67.2, to: 69.6, kind: 'broll', src: '8320'},
	{from: 69.6, to: 72.5, kind: 'broll', src: '3438', rate: 0.9},
	{from: 72.5, to: 76.8, kind: 'speaker', zoom: 'tight'},
	{from: 76.8, to: 78.7, kind: 'speaker', zoom: 'wide'},
	{from: 78.7, to: DURATION_S, kind: 'broll', src: '8321', rate: 0.85},
];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CUTS = SEGS.slice(1).map((s) => s.from);

// latar di-blur supaya teks tengah terbaca
const BLUR_RANGES: [number, number][] = [
	[42.9, 59.0],
	[76.8, 99],
];
const blurAt = (t: number) =>
	Math.max(0, ...BLUR_RANGES.map(([a, b]) => interpolate(t, [a, a + 0.35, b - 0.2, b], [0, 1, 1, 0], clamp)));

const LIGHT_RANGES: [number, number][] = [
	[29.9, 38.4],
	[59.0, 67.2],
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const usePop = (atS: number, damping = 13) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - f(atS), fps, config: {damping, mass: 0.6, stiffness: 180}});
};
const fadeOut = (frame: number, endS: number, dur = 6) => interpolate(frame, [f(endS) - dur, f(endS)], [1, 0], clamp);
// zoom-punch singkat di awal setiap shot
const punch = (frame: number) => interpolate(frame, [0, 8], [1.09, 1], {...clamp, easing: Easing.out(Easing.cubic)});

/* ------------------------------------------------------------------ */
/* Background (hanya terlihat saat mode kartu / hadits)                */
/* ------------------------------------------------------------------ */
const Background: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	let lightAmt = 0;
	for (const [a, b] of LIGHT_RANGES) {
		lightAmt = Math.max(lightAmt, interpolate(t, [a - 0.1, a + 0.1, b - 0.1, b + 0.1], [0, 1, 1, 0], clamp));
	}
	const drift = Math.sin(frame / 90) * 40;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, #26262b 0%, #101012 45%, #050506 100%)`}} />
			<AbsoluteFill
				style={{opacity: lightAmt, background: `radial-gradient(circle at 50% 45%, #ffffff 0%, #e4e4e4 45%, #a9a9a9 100%)`}}
			/>
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
/* Shots                                                               */
/* ------------------------------------------------------------------ */
const cardShadow = '0 0 0 3px rgba(255,255,255,0.92), 0 0 34px rgba(255,255,255,0.35), 0 40px 80px rgba(0,0,0,0.55)';

const Frame: React.FC<{seg: Seg; children: React.ReactNode}> = ({seg, children}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (!seg.card) {
		// full screen + gradien atas/bawah supaya teks terbaca
		const b = blurAt(seg.from + frame / fps);
		return (
			<AbsoluteFill style={{transform: `scale(${punch(frame)})`}}>
				<AbsoluteFill style={{filter: b > 0.01 ? `blur(${b * 22}px) brightness(${1 - b * 0.35})` : undefined, transform: `scale(${1 + b * 0.06})`}}>
					{children}
				</AbsoluteFill>
				<AbsoluteFill
					style={{
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 18%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.25) 72%, rgba(0,0,0,0.5) 100%)',
					}}
				/>
			</AbsoluteFill>
		);
	}
	const enter = spring({frame, fps, config: {damping: 15, mass: 0.7, stiffness: 160}});
	let x = CARD.x;
	let y = CARD.y;
	let w = CARD.w;
	let h = CARD.h;
	let r = 40;
	let scale = interpolate(enter, [0, 1], [0.95, 1]);
	let opacity = 1;
	if (seg.enterFromFull) {
		const p = spring({frame, fps, config: {damping: 18, mass: 0.8, stiffness: 120}});
		x = interpolate(p, [0, 1], [0, CARD.x]);
		y = interpolate(p, [0, 1], [0, CARD.y]);
		w = interpolate(p, [0, 1], [1080, CARD.w]);
		h = interpolate(p, [0, 1], [1920, CARD.h]);
		r = interpolate(p, [0, 1], [0, 40]);
		scale = 1;
		opacity = 1;
	}
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
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%), radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
				}}
			/>
		</div>
	);
};

const ZOOMS: Record<Zoom, [number, number]> = {
	hook: [1.14, 1.0],
	wide: [1.0, 1.05],
	mid: [1.18, 1.25],
	tight: [1.36, 1.44],
};

const SpeakerShot: React.FC<{seg: Extract<Seg, {kind: 'speaker'}>}> = ({seg}) => {
	const frame = useCurrentFrame();
	const len = f(seg.to - seg.from);
	const [z0, z1] = ZOOMS[seg.zoom];
	const z = interpolate(frame, [0, len], [z0, z1], {easing: seg.zoom === 'hook' ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad)});
	return (
		<Frame seg={seg}>
			<OffthreadVideo
				src={staticFile('main.mp4')}
				startFrom={f(seg.from)}
				muted
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${z})`,
					// full: wajah turun sedikit supaya tidak tertutup teks atas
					transformOrigin: seg.card ? '50% 36%' : '50% 18%',
				}}
			/>
		</Frame>
	);
};

const BrollShot: React.FC<{seg: Extract<Seg, {kind: 'broll'}>; index: number}> = ({seg, index}) => {
	const frame = useCurrentFrame();
	const len = f(seg.to - seg.from);
	const dir = index % 2 === 0 ? 1 : -1;
	const z = interpolate(frame, [0, len], [1.06, 1.16]);
	const tx = interpolate(frame, [0, len], [-16 * dir, 16 * dir]);
	return (
		<Frame seg={seg}>
			<OffthreadVideo
				src={staticFile(`broll/${seg.src}.mp4`)}
				startFrom={f(seg.offset ?? 0)}
				playbackRate={seg.rate ?? 1}
				muted
				style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) translateX(${tx}px)`}}
			/>
		</Frame>
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
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps + 18.4;
	const enter = spring({frame, fps, config: {damping: 14, mass: 0.8, stiffness: 140}});
	const len = f(23.4 - 18.4);
	const z = interpolate(frame, [0, len], [1, 1.05]);
	const srcIn = interpolate(t, [22.4, 22.8], [0, 1], clamp);
	const imgW = 1040;
	// partikel cahaya melayang
	const dots = Array.from({length: 18}, (_, i) => {
		const sx = (i * 137) % 1080;
		const sy = 1900 - ((frame * (1.2 + (i % 5) * 0.4) + i * 211) % 2100);
		return {x: sx + Math.sin((frame + i * 20) / 30) * 20, y: sy, s: 3 + (i % 4) * 2, o: 0.15 + (i % 3) * 0.12};
	});
	return (
		<AbsoluteFill>
			{/* latar: footage Ka'bah blur & gelap */}
			<AbsoluteFill style={{transform: `scale(${1.15 + frame / 1500})`, filter: 'blur(18px) brightness(0.35) saturate(0.8)'}}>
				<OffthreadVideo src={staticFile('broll/kabah.mp4')} startFrom={f(3)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			</AbsoluteFill>
			{dots.map((d, i) => (
				<div
					key={i}
					style={{position: 'absolute', left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: '50%', background: GOLD, opacity: d.o, boxShadow: `0 0 10px ${GOLD}`}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					left: (1080 - imgW) / 2 - 10,
					top: 300,
					width: imgW,
					height: imgW,
					transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px) rotate(${interpolate(enter, [0, 1], [-6, -1.5])}deg) scale(${z * interpolate(enter, [0, 1], [0.85, 1])})`,
					opacity: interpolate(enter, [0, 0.3], [0, 1], clamp),
					filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.6))',
				}}
			>
				<Img src={staticFile('img/parchment.png')} style={{width: '100%', height: '100%'}} />
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
						gap: 14,
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
										filter: `blur(${interpolate(p, [0, 1], [4, 0])}px)`,
										color: w === 'كَفَّارَةٌ' && t > 20.38 ? '#1f6b1a' : undefined,
									}}
								>
									{w}
								</span>
							);
						})}
					</div>
					<div style={{opacity: srcIn, fontFamily: MONT, fontWeight: 600, fontSize: 22, color: '#6b4220', textAlign: 'center', lineHeight: 1.35}}>
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
/* Motion-graphic text components                                      */
/* ------------------------------------------------------------------ */
const Badge: React.FC<{text: string; color: string; at: number; until: number; y: number; dark?: boolean}> = ({text, color, at, until, y, dark}) => {
	const frame = useCurrentFrame();
	const p = usePop(at);
	if (frame < f(at) || frame > f(until)) return null;
	const wipe = interpolate(frame - f(at), [0, 9], [100, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const shine = interpolate(frame - f(at), [6, 22], [-40, 140], clamp);
	return (
		<div
			style={{
				position: 'absolute',
				top: y,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity: fadeOut(frame, until),
				transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`,
			}}
		>
			<div
				style={{
					position: 'relative',
					overflow: 'hidden',
					fontFamily: MONT,
					fontWeight: 800,
					fontSize: 24,
					letterSpacing: 2,
					padding: '7px 18px',
					borderRadius: 8,
					background: color,
					color: dark ? '#0b0b0b' : '#fff',
					boxShadow: `0 0 22px ${color}88`,
					clipPath: `inset(0 ${wipe}% 0 0 round 8px)`,
				}}
			>
				{text}
				<div
					style={{
						position: 'absolute',
						top: 0,
						bottom: 0,
						left: `${shine}%`,
						width: 40,
						background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
						transform: 'skewX(-20deg)',
					}}
				/>
			</div>
		</div>
	);
};

type Run = {t: string; c?: string; font?: 'play' | 'arab'};
// Judul: muncul kata per kata (naik + blur), kata berwarna dapat garis bawah yang "digambar"
const Line: React.FC<{runs: Run[]; at: number; until: number; y: number; size?: number; theme?: Theme; weight?: number; stagger?: number}> = ({
	runs,
	at,
	until,
	y,
	size = 44,
	theme = 'dark',
	weight = 800,
	stagger = 2.5,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame < f(at) || frame > f(until)) return null;
	const base = theme === 'dark' ? '#ffffff' : '#141414';
	const isArab = runs.every((r) => r.font === 'arab');
	let wi = 0;
	return (
		<div
			dir={isArab ? 'rtl' : undefined}
			style={{
				position: 'absolute',
				top: y,
				left: SAFE.left + 60,
				right: 1080 - SAFE.right,
				textAlign: 'center',
				fontFamily: MONT,
				fontWeight: weight,
				fontSize: size,
				lineHeight: 1.08,
				letterSpacing: -0.5,
				color: base,
				opacity: fadeOut(frame, until),
				textShadow: theme === 'dark' ? '0 3px 14px rgba(0,0,0,0.65)' : 'none',
			}}
		>
			{runs.map((r, ri) => {
				const parts = isArab ? [r.t] : r.t.split(/(\s+)/).filter((x) => x.length);
				return (
					<span key={ri} style={{position: 'relative', display: 'inline-block', whiteSpace: 'pre'}}>
						{parts.map((p, pi) => {
							if (/^\s+$/.test(p)) return <span key={pi}>{p}</span>;
							const d = wi++ * stagger;
							const s = spring({frame: frame - f(at) - d, fps, config: {damping: 14, mass: 0.5, stiffness: 200}});
							return (
								<span
									key={pi}
									style={{
										display: 'inline-block',
										color: r.c ?? base,
										fontFamily: r.font === 'play' ? PLAY : r.font === 'arab' ? AMIRI : MONT,
										fontStyle: r.font === 'play' ? 'italic' : 'normal',
										fontWeight: r.font === 'play' ? 600 : r.font === 'arab' ? 700 : weight,
										letterSpacing: r.font ? 0 : undefined,
										opacity: interpolate(s, [0, 0.5], [0, 1], clamp),
										transform: `translateY(${interpolate(s, [0, 1], [size * 0.55, 0])}px)`,
										filter: `blur(${interpolate(s, [0, 1], [8, 0])}px)`,
									}}
								>
									{p}
								</span>
							);
						})}
						{r.c === GREEN || r.c === RED || r.c === '#2f8f4a' ? (
							<span
								style={{
									position: 'absolute',
									left: 2,
									right: 2,
									bottom: -4,
									height: 4,
									borderRadius: 2,
									background: r.c,
									transformOrigin: 'left',
									transform: `scaleX(${interpolate(frame - f(at), [8, 20], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)})})`,
									boxShadow: `0 0 10px ${r.c}`,
								}}
							/>
						) : null}
					</span>
				);
			})}
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
	const p = usePop(at, 10);
	if (frame < f(at) || frame > f(until)) return null;
	const ring = interpolate(frame - f(at), [0, 12], [0, 1], clamp);
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', opacity: fadeOut(frame, until)}}>
			{/* ring "klik" */}
			<div
				style={{
					position: 'absolute',
					inset: -6,
					borderRadius: 18,
					border: `2px solid ${color}`,
					opacity: 1 - ring,
					transform: `scale(${1 + ring * 0.35})`,
				}}
			/>
			<div
				style={{
					transform: `scale(${interpolate(p, [0, 1], [0.4, 1])})`,
					opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
					fontFamily: MONT,
					fontWeight: 700,
					fontSize: 26,
					padding: '8px 18px',
					borderRadius: 12,
					border: `2px solid ${color}`,
					color: theme === 'dark' ? '#fff' : '#111',
					background: theme === 'dark' ? 'rgba(20,20,22,0.85)' : 'rgba(255,255,255,0.92)',
					boxShadow: `0 0 18px ${color}55`,
					whiteSpace: 'nowrap',
				}}
			>
				{text}
			</div>
		</div>
	);
};

const CheckRow: React.FC<{text: string; tag?: string; at: number; until: number; y: number; ok: boolean}> = ({text, tag, at, until, y, ok}) => {
	const frame = useCurrentFrame();
	const p = usePop(at, 14);
	if (frame < f(at) || frame > f(until)) return null;
	const tick = interpolate(frame - f(at), [4, 12], [0, 1], clamp);
	return (
		<div
			style={{
				position: 'absolute',
				left: 250,
				top: y,
				display: 'flex',
				alignItems: 'center',
				gap: 20,
				opacity: fadeOut(frame, until) * interpolate(p, [0, 0.3], [0, 1], clamp),
				transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`,
				fontFamily: MONT,
				fontWeight: 800,
				fontSize: 48,
				color: '#fff',
				textShadow: '0 3px 12px rgba(0,0,0,0.7)',
			}}
		>
			<div
				style={{
					width: 54,
					height: 54,
					borderRadius: 13,
					background: ok ? GREEN : 'rgba(0,0,0,0.3)',
					border: ok ? 'none' : '2px solid rgba(255,255,255,0.7)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{ok ? (
					<svg width="34" height="34" viewBox="0 0 24 24">
						<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#0b0b0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - tick)} />
					</svg>
				) : null}
			</div>
			<span style={{opacity: ok ? 1 : 0.8}}>{text}</span>
			{tag ? (
				<span style={{fontSize: 24, fontWeight: 800, letterSpacing: 1.5, padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.18)', color: '#e6e6e6'}}>
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
				gap: 14,
				opacity: fadeOut(frame, until) * interpolate(p, [0, 0.3], [0, 1], clamp),
				transform: `translateX(${interpolate(p, [0, 1], [60, 0])}px)`,
			}}
		>
			<span style={{fontFamily: MONT, fontWeight: 800, fontSize: 42, color: '#1a1a1a'}}>{n}</span>
			<span
				style={{
					fontFamily: MONT,
					fontWeight: 700,
					fontSize: 28,
					color: '#fff',
					background: '#2a2a2d',
					padding: '9px 20px',
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

/* ------------------------------------------------------------------ */
/* Global motion graphics                                              */
/* ------------------------------------------------------------------ */
const segAt = (t: number) => SEGS.find((s) => t >= s.from && t < s.to) ?? SEGS[SEGS.length - 1];
const themeAt = (t: number): Theme => (LIGHT_RANGES.some(([a, b]) => t >= a && t < b) ? 'light' : 'dark');

// label seri + progress bar tipis
const SeriesTag: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const theme = themeAt(t);
	const o = interpolate(frame, [f(4.3), f(4.9)], [0, 1], clamp);
	const col = theme === 'dark' ? 'rgba(255,255,255,' : 'rgba(0,0,0,';
	return (
		<div style={{position: 'absolute', top: SAFE.top + 2, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, opacity: o}}>
			<div style={{fontFamily: MONT, fontWeight: 700, fontSize: 19, letterSpacing: 7, color: col + '0.6)'}}>JEJAK IBADAH · UMRAH</div>
			<div style={{width: 200, height: 3, borderRadius: 2, background: col + '0.18)', overflow: 'hidden'}}>
				<div style={{width: `${(frame / TOTAL_FRAMES) * 100}%`, height: '100%', background: GREEN, boxShadow: `0 0 8px ${GREEN}`}} />
			</div>
		</div>
	);
};

// bingkai sudut (viewfinder) yang "snap" di setiap potongan full-screen
const Corners: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const seg = segAt(t);
	if (seg.card || seg.kind === 'hadith' || t < 4.5) return null;
	const local = frame - f(seg.from);
	const p = spring({frame: local, fps: FPS, config: {damping: 14, mass: 0.5}});
	const inset = interpolate(p, [0, 1], [-30, 0]);
	const o = interpolate(p, [0, 1], [0, 0.55]) * fadeOut(frame, seg.to, 3);
	const L = 46;
	const st = (x: number, y: number, rot: number): React.CSSProperties => ({
		position: 'absolute',
		left: x,
		top: y,
		width: L,
		height: L,
		borderTop: '3px solid #fff',
		borderLeft: '3px solid #fff',
		transform: `rotate(${rot}deg)`,
		opacity: o,
	});
	const x0 = 110 + inset;
	const x1 = SAFE.right - 30 - L - inset;
	const y0 = 520 + inset;
	const y1 = 1440 - L - inset;
	return (
		<>
			<div style={st(x0, y0, 0)} />
			<div style={st(x1, y0, 90)} />
			<div style={st(x1, y1, 180)} />
			<div style={st(x0, y1, 270)} />
		</>
	);
};

// kilatan putih + garis cahaya di setiap potongan
const CutFlash: React.FC = () => {
	const frame = useCurrentFrame();
	const cut = CUTS.find((c) => frame >= f(c) && frame < f(c) + 6);
	if (cut === undefined) return null;
	const k = frame - f(cut);
	const o = interpolate(k, [0, 5], [0.28, 0], clamp);
	const sweep = interpolate(k, [0, 5], [-300, 1300], clamp);
	return (
		<>
			<AbsoluteFill style={{background: '#fff', opacity: o}} />
			<div
				style={{
					position: 'absolute',
					top: -200,
					bottom: -200,
					left: sweep,
					width: 160,
					background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
					transform: 'skewX(-18deg)',
				}}
			/>
		</>
	);
};

const TopGraphics: React.FC = () => (
	<>
		{/* HOOK */}
		<Line at={0.15} until={4.45} y={300} size={26} weight={700} runs={[{t: 'JEJAK IBADAH', c: 'rgba(255,255,255,0.75)'}]} />
		<Line at={0.35} until={4.45} y={338} size={74} runs={[{t: 'Umrah '}, {t: 'berkali-kali', c: GREEN}, {t: ','}]} />
		<Line at={1.0} until={4.45} y={414} size={68} runs={[{t: 'boleh ', font: 'play', c: GOLD}, {t: 'nggak?'}]} />

		{/* PERTANYAAN */}
		<Badge text="PERTANYAAN" color={RED} at={4.6} until={11.0} y={Y1} />
		<Chip text="Umrah ke-1" at={4.7} until={11.0} x={300} y={Y2 + 6} />
		<Chip text="ke-2" at={8.0} until={11.0} x={485} y={Y2 + 6} />
		<Chip text="ke-3" at={9.14} until={11.0} x={620} y={Y2 + 6} />
		<Chip text="dst…" at={10.08} until={11.0} x={760} y={Y2 + 6} color="#ffffff" />

		<Line at={11.1} until={15.4} y={Y1} size={42} runs={[{t: 'Apakah '}, {t: 'dianjurkan', c: GREEN}, {t: '?'}]} />
		<Line at={13.3} until={15.4} y={Y1 + 50} size={42} runs={[{t: 'atau '}, {t: 'cukup sekali', c: RED}, {t: ' saja?'}]} />

		{/* Nabi bersabda */}
		<Line at={15.5} until={18.4} y={Y1} size={56} runs={[{t: 'Nabi ', font: 'play', c: GOLD}, {t: 'ﷺ', font: 'arab', c: GOLD}, {t: ' bersabda', font: 'play', c: GOLD}]} />
		<Line at={16.2} until={18.4} y={Y1 + 66} size={24} weight={600} runs={[{t: 'Hadits riwayat Abu Hurairah r.a.', c: 'rgba(255,255,255,0.8)'}]} />

		<Badge text="HADITS" color={GOLD} dark at={18.5} until={23.4} y={Y1} />

		{/* Penjelasan hadits (kartu) */}
		<Badge text="ARTINYA" color={GREEN} dark at={23.5} until={29.9} y={Y1} />
		<Line at={23.5} until={29.9} y={Y2} size={40} runs={[{t: 'Umrah ➝ umrah berikutnya'}]} />
		<Line at={26.76} until={29.9} y={Y3} size={40} runs={[{t: '= '}, {t: 'penghapus dosa', c: GREEN}, {t: ' di antaranya'}]} />

		{/* HUKUM (kartu, terang) */}
		<Badge text="HUKUMNYA" color="#141414" at={29.95} until={38.4} y={Y1} />
		<Chip text="Dibolehkan ✓" at={31.72} until={38.4} x={395} y={Y2 + 4} color="#3aa55a" theme="light" />
		<Chip text="Dianjurkan ✓" at={33.1} until={38.4} x={685} y={Y2 + 4} color="#3aa55a" theme="light" />
		<Line at={35.58} until={38.4} y={Y3 + 20} size={28} weight={700} theme="light" runs={[{t: 'bagi yang punya '}, {t: 'kesempatan & waktu', c: '#2f8f4a'}]} />

		{/* TAPI INGAT */}
		<Badge text="TAPI INGAT!" color={RED} at={38.5} until={42.9} y={Y1} />
		<Line at={39.0} until={42.9} y={Y2} size={42} runs={[{t: 'Jangan sampai '}, {t: 'mengganggu', c: RED}]} />

		<Line at={43.1} until={59.0} y={640} size={58} runs={[{t: 'KEWAJIBAN ', c: GREEN}, {t: 'LAINNYA'}]} />
		<CheckRow text="Sholat fardhu" at={46.88} until={59.0} y={740} ok />
		<CheckRow text="Kewajiban dunia" at={50.14} until={59.0} y={818} ok />
		<CheckRow text="Umrah" tag="SUNNAH" at={58.02} until={59.0} y={896} ok={false} />

		{/* YANG PERLU DIPERHATIKAN (kartu, terang) */}
		<Badge text="YANG PERLU DIPERHATIKAN" color="#141414" at={59.1} until={67.2} y={Y1} />
		<NumRow n="#1" text={[{t: 'Umrah dengan '}, {t: 'ilmu', c: GREEN}]} at={63.34} until={67.2} y={Y2} />
		<NumRow n="#2" text={[{t: 'Dikerjakan '}, {t: 'sebaik mungkin', c: GREEN}]} at={66.04} until={67.2} y={Y2 + 58} />

		<Line at={67.3} until={72.5} y={Y1} size={42} runs={[{t: 'Tanpa '}, {t: 'mengorbankan', c: RED}]} />
		<Line at={71.76} until={72.5} y={Y1 + 50} size={42} runs={[{t: 'yang lebih '}, {t: 'utama', c: GREEN}]} />

		<Line at={73.14} until={76.8} y={Y1} size={44} runs={[{t: 'Mana yang lebih '}, {t: 'utama', c: GREEN}, {t: '?'}]} />
		<Line at={74.6} until={76.8} y={Y1 + 52} size={44} runs={[{t: 'Kita', font: 'play', c: GOLD}, {t: ' yang paling tahu.'}]} />

		{/* Penutup Arab */}
		<Line at={76.85} until={78.7} y={770} size={96} runs={[{t: 'وَاللّٰهُ تَعَالَى أَعْلَمُ', font: 'arab', c: GOLD}]} />
		<Line at={77.2} until={78.7} y={905} size={30} weight={600} runs={[{t: "Wallāhu ta'ālā a'lam", c: 'rgba(255,255,255,0.9)'}]} />
		<Line at={78.75} until={DURATION_S} y={790} size={68} runs={[{t: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ', font: 'arab', c: GOLD}]} />
		<Line at={79.3} until={DURATION_S} y={900} size={28} weight={600} runs={[{t: "Wassalāmu'alaikum warahmatullāhi wabarakātuh", c: 'rgba(255,255,255,0.9)'}]} />
	</>
);

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

const Subtitles: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const idx = chunks.findIndex((c, i) => {
		const next = chunks[i + 1];
		const end = Math.min(c[c.length - 1].end + 0.25, next ? next[0].start : 999);
		return t >= c[0].start && t < end;
	});
	if (idx < 0 || t >= 76.8) return null;
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
				lineHeight: 1.12,
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
	{at: 4.7, file: 'click', vol: 0.3},
	{at: 9.14, file: 'click', vol: 0.3},
	{at: 10.08, file: 'click', vol: 0.3},
	{at: 11.1, file: 'shutter', vol: 0.18},
	{at: 13.3, file: 'deng', vol: 0.22},
	{at: 16.4, file: 'riser', vol: 0.22, len: 2.0},
	{at: 18.35, file: 'paperflip', vol: 0.55},
	{at: 18.4, file: 'aurora', vol: 0.22},
	{at: 23.4, file: 'zoom', vol: 0.18, len: 1.0},
	{at: 26.76, file: 'uitone2', vol: 0.25, len: 0.8},
	{at: 31.72, file: 'click', vol: 0.32},
	{at: 33.1, file: 'click', vol: 0.32},
	{at: 38.45, file: 'deng', vol: 0.28},
	{at: 42.94, file: 'shutter', vol: 0.2},
	{at: 46.88, file: 'click', vol: 0.32},
	{at: 50.14, file: 'click', vol: 0.32},
	{at: 58.02, file: 'click', vol: 0.3},
	{at: 59.0, file: 'zoom', vol: 0.18, len: 1.0},
	{at: 63.34, file: 'shutter', vol: 0.28},
	{at: 66.04, file: 'shutter', vol: 0.28},
	{at: 73.14, file: 'shutter', vol: 0.18},
	{at: 76.8, file: 'aurora', vol: 0.18},
];

// SETIAP transisi: klik + whoosh halus
const CUT_SFX: Sfx[] = CUTS.flatMap((c) => [
	{at: c, file: 'click', vol: 0.42, len: 0.5},
	{at: c - 0.12, file: 'whoosh', vol: 0.16},
]);

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
	{at: 23.25, file: 'mlt3', opacity: 0.45},
	{at: 38.25, file: 'flare2', opacity: 0.5},
	{at: 58.9, file: 'mlt3', opacity: 0.45},
	{at: 67.05, file: 'flare2', opacity: 0.5},
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
	const endFade = interpolate(frame, [TOTAL_FRAMES - 18, TOTAL_FRAMES - 1], [0, 1], clamp);
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<Background />
			{SEGS.map((s, i) => (
				<Sequence key={i} from={f(s.from)} durationInFrames={f(s.to) - f(s.from)}>
					{s.kind === 'speaker' ? <SpeakerShot seg={s} /> : null}
					{s.kind === 'broll' ? <BrollShot seg={s} index={i} /> : null}
					{s.kind === 'hadith' ? <HadithScene /> : null}
				</Sequence>
			))}
			<Corners />
			<CutFlash />
			<TopGraphics />
			<Subtitles />
			<Flashes />
			<Audio src={staticFile('voice.wav')} />
			<SfxTrack />
			<AbsoluteFill style={{backgroundColor: '#000', opacity: endFade}} />
		</AbsoluteFill>
	);
};
