import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile} from 'remotion';
import {Camera, Caption, FPS, Grain, INK, Label, Paper, SANS, SERIF, Tape, Torn, Vignette, pop, ramp, useT} from './kit';
import {WorldMap} from './WorldMap';

export const DURATION = 10.75;
const GREEN = '#9CF27A';
const ME = ['818', '682', '400', '368', '760', '422', '275', '887', '512', '784', '634', '414', '048', '364', '376'];

// Instagram Reels safe zone (1080x1920): 220 top, 450 bottom, 35 right,
// plus a 100px column for the like/comment/share buttons from y≈1172 down.
export const SAFE = {top: 220, bottom: 1470, left: 25, right: 1045, btnY: 1172, btnRight: 945};
// Bottom labels sit left of the button column and above the caption area.
const LOW = {x: (SAFE.left + SAFE.btnRight) / 2, y: 1380};

type SP = {s: number; e: number};

const ARoll: React.FC<{s: number; style?: React.CSSProperties}> = ({s, style}) => (
	<OffthreadVideo
		src={staticFile('aroll.mp4')}
		muted
		startFrom={Math.round(s * FPS)}
		style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(0.9) sepia(0.1)', ...style}}
	/>
);

const Logo: React.FC<{src: string; size: number; zoom?: number}> = ({src, size, zoom = 1.08}) => (
	<div style={{width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: `${size * 0.04}px solid #f4ecdb`, boxShadow: '0 8px 14px rgba(0,0,0,0.35)', flexShrink: 0}}>
		<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
	</div>
);

// Torn-paper profile card with a Follow button that flips to "Following".
const ProfileCard: React.FC<{t: number; at: number; followAt: number; logo: string; zoom?: number; name: string; x: number; y: number; w?: number; rot?: number; from?: 1 | -1}> = ({
	t,
	at,
	followAt,
	logo,
	zoom,
	name,
	x,
	y,
	w = 620,
	rot = -2,
	from = 1,
}) => {
	const p = pop(t, at, 12);
	if (t < at) return null;
	const followed = t >= followAt;
	const press = followed ? 1 - 0.12 * Math.max(0, 1 - (t - followAt) * 6) : 1;
	const h = 170;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translateX(${(1 - p) * 1100 * from}px)`}}>
			<Torn x={0} y={0} w={w} h={h} seed={`card-${name}`} color="#fbf8f1" rot={rot}>
				<div style={{position: 'absolute', left: 26, top: 22, display: 'flex', alignItems: 'center', gap: 24}}>
					<Logo src={logo} size={112} zoom={zoom} />
					<div>
						<div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, color: INK, lineHeight: 1.1}}>{name}</div>
						<div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#7a6d5c', marginTop: 4}}>Instagram</div>
					</div>
				</div>
				<div
					style={{
						position: 'absolute',
						right: 26,
						top: 58,
						transform: `scale(${press})`,
						background: followed ? '#e7e2d6' : '#1f7a43',
						color: followed ? INK : '#fff',
						fontFamily: SANS,
						fontWeight: 800,
						fontSize: 26,
						padding: '12px 20px',
						borderRadius: 12,
					}}
				>
					{followed ? 'Following ✓' : 'Follow'}
				</div>
			</Torn>
			<Tape x={w / 2} y={4} rot={rot * 2} w={130} />
		</div>
	);
};

// Arrow cursor that glides to a point and taps.
const Cursor: React.FC<{t: number; path: {t: number; x: number; y: number}[]}> = ({t, path}) => {
	if (t < path[0].t - 0.2) return null;
	const ts = path.map((p) => p.t);
	const x = interpolate(t, ts, path.map((p) => p.x), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const y = interpolate(t, ts, path.map((p) => p.y), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const o = ramp(t, path[0].t - 0.2, path[0].t);
	return (
		<svg width={60} height={70} style={{position: 'absolute', left: x, top: y, opacity: o, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.4))'}}>
			<path d="M4,4 L4,56 L18,44 L28,66 L38,61 L28,40 L46,40 Z" fill="#fff" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
		</svg>
	);
};

// ---------- A. "Boleh banget pantengin informasi" ----------
const A: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	return (
		<AbsoluteFill>
			<Camera t={t} start={s} end={e} from={1.0} to={1.12} drift={0}>
				<ARoll s={s} />
			</Camera>
			<Label t={t} at={0.05} x={540} y={330} size={58} rot={-3} bg="#fff">
				Boleh banget
			</Label>
			<Label t={t} at={0.84} x={540} y={440} size={84} rot={2}>
				pantengin!
			</Label>
			<Caption t={t} at={1.44} x={540} y={540} size={40} font={SERIF} color="#fff" weight={400}>
				<i>info seputar...</i>
			</Caption>
		</AbsoluteFill>
	);
};

// ---------- B. Map: kuliah di Timur Tengah ----------
const B: React.FC<SP> = ({s}) => {
	const t = useT(s);
	return (
		<AbsoluteFill>
			<WorldMap
				t={t}
				keys={[
					{t: 2.4, lon: 75, lat: 10, scale: 520},
					{t: 3.3, lon: 44, lat: 27, scale: 1050},
					{t: 4.0, lon: 42, lat: 27, scale: 1150},
				]}
				highlight={[
					{ids: ['360'], at: 2.4, color: GREEN},
					{ids: ME, at: 3.22, color: '#f2c94c'},
				]}
				labels={[{ll: [45, 24], at: 3.25, text: 'Timur Tengah', dy: 0, size: 64}]}
			/>
			<Label t={t} at={2.52} x={LOW.x} y={LOW.y} size={84} rot={-3} bg="#fff">
				kuliah
			</Label>
		</AbsoluteFill>
	);
};

// ---------- C. Instagram Rehlata Academy / Rehlata Mesir ----------
const C: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.0} to={1.06}>
				<Torn x={60} y={250} w={470} h={640} seed="frameC" color="#fbf8f1" rot={-3}>
					<div style={{position: 'absolute', inset: 14}}>
						<ARoll s={s} />
					</div>
				</Torn>
				<Tape x={295} y={255} rot={-6} w={170} />
				<Label t={t} at={4.0} x={770} y={420} size={56} rot={4}>
					Instagram
				</Label>
				<ProfileCard t={t} at={4.42} followAt={99} logo="logo-academy.jpg" name="Rehlata Academy" x={215} y={760} w={720} />
				<Caption t={t} at={5.32} x={150} y={955} size={40} font={SERIF} color="#7b2a2a" weight={400}>
					<i>atau</i>
				</Caption>
				<ProfileCard t={t} at={5.6} followAt={99} logo="logo-mesir.jpg" zoom={1.2} name="Rehlata Mesir" x={215} y={980} w={720} rot={2} from={-1} />
			</Camera>
		</AbsoluteFill>
	);
};

// ---------- D. Jangan lupa follow (+ E. waving outro) ----------
const D: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	const end = pop(t, 9.3, 10);
	return (
		<AbsoluteFill>
			<Camera t={t} start={s} end={e} from={1.1} to={1.0} drift={0}>
				<ARoll s={s} />
			</Camera>
			<AbsoluteFill style={{background: 'linear-gradient(rgba(20,12,4,0.45), rgba(20,12,4,0) 40%)'}} />
			<ProfileCard t={t} at={6.5} followAt={7.95} logo="logo-academy.jpg" name="Rehlata Academy" x={175} y={250} w={720} />
			<ProfileCard t={t} at={6.75} followAt={8.9} logo="logo-mesir.jpg" zoom={1.2} name="Rehlata Mesir" x={175} y={450} w={720} rot={2} from={-1} />
			<Cursor
				t={t}
				path={[
					{t: 7.2, x: 900, y: 900},
					{t: 7.85, x: 790, y: 330},
					{t: 8.4, x: 790, y: 330},
					{t: 8.8, x: 790, y: 535},
					{t: 10.75, x: 790, y: 535},
				]}
			/>
			<Label t={t} at={6.44} x={LOW.x} y={LOW.y - 110} size={56} rot={-2} bg="#fff">
				Jangan lupa
			</Label>
			<Label t={t} at={6.8} x={LOW.x} y={LOW.y} size={104} rot={2}>
				FOLLOW!
			</Label>
			{t > 9.3 ? (
				<div style={{position: 'absolute', left: LOW.x, top: 760, transform: `translate(-50%,-50%) scale(${end}) rotate(-3deg)`}}>
					<div style={{background: GREEN, color: INK, fontFamily: SANS, fontWeight: 800, fontSize: 46, padding: '12px 26px', boxShadow: '0 6px 0 rgba(0,0,0,0.25)', whiteSpace: 'nowrap'}}>
						follow sekarang!
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

const PaperWipe: React.FC<{at: number; dir?: 1 | -1}> = ({at, dir = 1}) => {
	const t = useT(0);
	const p = ramp(t, at - 0.2, at + 0.22, Easing.inOut(Easing.cubic));
	if (p <= 0 || p >= 1) return null;
	return (
		<AbsoluteFill style={{transform: `translateX(${(1 - 2 * p) * 1300 * dir}px) rotate(${dir * 4}deg) scale(1.2)`}}>
			<Torn x={-60} y={-80} w={1200} h={2080} seed={`wipe${at}`} color="#e9dcc2" amp={40} />
		</AbsoluteFill>
	);
};

// Debug overlay: shaded no-go areas of the Reels safe zone.
export const SafeGuide: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		{[
			{left: 0, top: 0, width: 1080, height: SAFE.top},
			{left: 0, top: SAFE.bottom, width: 1080, height: 1920 - SAFE.bottom},
			{left: SAFE.right, top: 0, width: 1080 - SAFE.right, height: 1920},
			{left: 0, top: 0, width: SAFE.left, height: 1920},
			{left: SAFE.btnRight, top: SAFE.btnY, width: 1080 - SAFE.btnRight, height: 1920},
		].map((r, i) => (
			<div key={i} style={{position: 'absolute', ...r, background: 'rgba(255,0,80,0.35)'}} />
		))}
	</AbsoluteFill>
);

const SCENES: [React.FC<SP>, number, number][] = [
	[A, 0, 2.4],
	[B, 2.4, 4.0],
	[C, 4.0, 6.44],
	[D, 6.44, DURATION],
];

const SFX: [string, number, number][] = [
	['whip', 0.0, 0.45],
	['mouse-click', 0.84, 0.5],
	['whoosh', 2.25, 0.7],
	['mouse-click', 2.52, 0.4],
	['mouse-click', 3.25, 0.45],
	['whoosh', 3.85, 0.7],
	['page-turn', 4.42, 0.55],
	['page-turn', 5.6, 0.55],
	['whoosh', 6.3, 0.7],
	['switch', 6.8, 0.5],
	['mouse-click', 7.95, 0.7],
	['mouse-click', 8.9, 0.7],
	['ding', 9.3, 0.22],
];

export const MesirVox: React.FC<{guide?: boolean}> = ({guide = false}) => (
	<AbsoluteFill style={{background: '#000'}}>
		{SCENES.map(([C2, s, e]) => (
			<Sequence key={s} from={Math.round(s * FPS)} durationInFrames={Math.round((e - s) * FPS)}>
				<C2 s={s} e={e} />
			</Sequence>
		))}
		<PaperWipe at={2.4} />
		<PaperWipe at={4.0} dir={-1} />
		<PaperWipe at={6.44} />
		<Vignette strength={0.45} />
		<Grain />
		{guide ? <SafeGuide /> : null}
		<Audio src={staticFile('aroll.mp4')} />
		{SFX.map(([name, at, vol], i) => (
			<Sequence key={i} from={Math.round(at * FPS)}>
				<Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
			</Sequence>
		))}
	</AbsoluteFill>
);
