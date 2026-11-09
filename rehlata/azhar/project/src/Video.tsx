import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Camera, Caption, Disclaimer, FPS, Grain, INK, Label, Paper, SANS, SERIF, Tape, Torn, Vignette, YELLOW, pop, ramp, useT} from './kit';
import {LL, WorldMap} from './WorldMap';
import {HAS_KAABA} from './assets';

export const DURATION = 23.6;
const GREEN = '#9CF27A';
const JAKARTA: LL = [106.85, -6.2];
const MAKKAH: LL = [39.83, 21.42];
const CAIRO: LL = [31.26, 30.05];
const ME = ['818', '682', '400', '368', '760', '422', '275', '887', '512', '784', '634', '414', '048', '364', '376'];

type SP = {s: number; e: number};

// The talking-head footage, kept in sync with the absolute timeline.
const ARoll: React.FC<{s: number; style?: React.CSSProperties}> = ({s, style}) => (
	<OffthreadVideo
		src={staticFile('aroll.mp4')}
		muted
		startFrom={Math.round(s * FPS)}
		style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(0.88) sepia(0.12)', ...style}}
	/>
);

const Logo: React.FC<{src: string; size: number}> = ({src, size}) => (
	<div style={{width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '10px solid #f4ecdb', boxShadow: '0 14px 24px rgba(0,0,0,0.45)'}}>
		<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.08)'}} />
	</div>
);

const Polaroid: React.FC<{src: string; w: number; h: number; caption?: string; pos?: string}> = ({src, w, h, caption, pos = 'center'}) => (
	<div style={{background: '#fbf8f1', padding: '18px 18px 70px', boxShadow: '0 16px 28px rgba(30,20,10,0.45)', position: 'relative'}}>
		<Img src={staticFile(src)} style={{width: w, height: h, objectFit: 'cover', objectPosition: pos, display: 'block', filter: 'contrast(1.05) saturate(0.9) sepia(0.15)'}} />
		{caption ? (
			<div style={{position: 'absolute', bottom: 16, width: w, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 36, color: '#3b2f22'}}>{caption}</div>
		) : null}
	</div>
);

// ---------- A. "Jadi selain Rehlata Tour" ----------
const A: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	return (
		<AbsoluteFill>
			<Camera t={t} start={s} end={e} from={1.0} to={1.1} drift={0}>
				<ARoll s={s} />
			</Camera>
			<div style={{position: 'absolute', left: 540, top: 380, transform: `translate(-50%,-50%) scale(${pop(t, 0.74, 9)}) rotate(${-6 + 6 * pop(t, 0.74)}deg)`}}>
				<Logo src="logo-tour.jpg" size={320} />
			</div>
			<Tape x={420} y={240} rot={-35} />
			<Label t={t} at={1.04} x={540} y={600} size={62} rot={-2}>
				Rehlata Tour
			</Label>
		</AbsoluteFill>
	);
};

// ---------- B. Umroh: photo collage (falls back to a paper illustration) ----------
const KaabaArt: React.FC<{t: number}> = ({t}) => (
	<div style={{width: 600, height: 760, background: '#d9d2c3', position: 'relative', overflow: 'hidden'}}>
		<svg width={600} height={760}>
			{[120, 190, 260, 330].map((r, i) => (
				<ellipse key={r} cx={300} cy={470} rx={r * 1.25} ry={r * 0.55} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={14} strokeDasharray="4 18" strokeDashoffset={-t * (40 + i * 12)} />
			))}
			<polygon points="200,330 400,330 430,360 430,560 230,560 200,530" fill="#121212" />
			<polygon points="400,330 430,360 430,560 400,530" fill="#2a2a2a" />
			<rect x={200} y={372} width={200} height={22} fill="#c9a24b" />
			<polygon points="400,372 430,402 430,424 400,394" fill="#a8843a" />
			<rect x={260} y={430} width={40} height={70} fill="#c9a24b" opacity={0.85} />
		</svg>
	</div>
);
const B: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	const p1 = pop(t, 1.8, 13);
	const p2 = pop(t, 3.3, 13);
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.0} to={1.1}>
				<div style={{position: 'absolute', left: 120, top: 200, transform: `rotate(-4deg) translateY(${(1 - p1) * 900}px)`}}>
					{HAS_KAABA ? (
						<Polaroid src="bg-kaaba.jpg" w={600} h={760} caption="Makkah" />
					) : (
						<div style={{background: '#fbf8f1', padding: '18px 18px 70px', boxShadow: '0 16px 28px rgba(30,20,10,0.45)', position: 'relative'}}>
							<KaabaArt t={t} />
							<div style={{position: 'absolute', bottom: 16, width: 600, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 36, color: '#3b2f22'}}>Makkah</div>
						</div>
					)}
				</div>
				<Tape x={420} y={210} rot={-6} w={180} />
				<div style={{position: 'absolute', left: 560, top: 700, transform: `rotate(6deg) translateX(${(1 - p2) * 900}px)`}}>
					{HAS_KAABA ? <Polaroid src="bg-tawaf.jpg" w={400} h={300} /> : null}
				</div>
				{HAS_KAABA && t > 3.3 ? <Tape x={760} y={710} rot={12} w={150} /> : null}
				{/* small A-roll window so the speaker stays present */}
				<Torn x={70} y={1000} w={300} h={380} seed="ar1" color="#fbf8f1" rot={-3} style={{opacity: ramp(t, 2.0, 2.3)}}>
					<div style={{position: 'absolute', inset: 12}}>
						<ARoll s={s} />
					</div>
				</Torn>
				<Label t={t} at={3.28} x={760} y={220} size={44} rot={3} bg="#fff">
					menyediakan
				</Label>
				<Label t={t} at={4.28} x={700} y={300} size={44} rot={-2} bg="#fff">
					memfasilitasi
				</Label>
				<Label t={t} at={5.38} x={485} y={1370} size={78} rot={-3}>
					Jamaah Umroh
				</Label>
			</Camera>
			<Disclaimer text={HAS_KAABA ? 'Foto: Wikimedia Commons' : 'Ilustrasi'} />
		</AbsoluteFill>
	);
};

// ---------- C. Map: Indonesia -> Makkah -> Mesir ----------
// One continuous, eased camera move that follows the plane: tight on Jakarta,
// pull out high over the ocean, then push in on Makkah and Cairo.
// A slight 3D tilt settles as we climb and returns on the push-in; camera
// motion blur smooths the fast middle of the move.
const C: React.FC<SP> = ({s}) => {
	const t = useT(s);
	const tiltX = interpolate(t, [7.0, 7.9, 9.1], [26, 0, 12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
	const rotZ = interpolate(t, [7.0, 7.9, 9.1], [-4, 0, 2.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
	return (
		<AbsoluteFill style={{background: '#2b7c86', perspective: 1600}}>
			<CameraMotionBlur samples={6} shutterAngle={200}>
				<AbsoluteFill style={{transform: `scale(1.32) rotateX(${tiltX}deg) rotateZ(${rotZ}deg)`, transformOrigin: '50% 45%'}}>
					<WorldMap
						t={t}
						smooth
						keys={[
							{t: 7.0, lon: 106.85, lat: -6.2, scale: 4800},
							{t: 7.4, lon: 103, lat: -3, scale: 2300},
							{t: 7.85, lon: 80, lat: 5, scale: 720},
							{t: 8.3, lon: 52, lat: 17, scale: 680},
							{t: 8.7, lon: 38, lat: 25, scale: 1250},
							{t: 9.1, lon: 36, lat: 26, scale: 1600},
						]}
						highlight={[
							{ids: ['360'], at: 7.0, color: GREEN},
							{ids: ['682'], at: 8.0, color: '#f2c94c'},
							{ids: ['818'], at: 8.5, color: '#f2c94c'},
						]}
						routes={[
							{from: JAKARTA, to: MAKKAH, a: 7.3, b: 8.15},
							{from: MAKKAH, to: CAIRO, a: 8.2, b: 8.6},
						]}
						pins={[
							{ll: JAKARTA, at: 7.05},
							{ll: MAKKAH, at: 8.0},
							{ll: CAIRO, at: 8.5},
						]}
						labels={[
							{ll: JAKARTA, at: 7.1, text: 'Indonesia', dy: 80},
							{ll: MAKKAH, at: 8.02, text: 'Umroh', dx: 40, dy: 70},
							{ll: CAIRO, at: 8.5, text: 'Mesir', dx: -40, dy: -70},
						]}
					/>
				</AbsoluteFill>
			</CameraMotionBlur>
			<Label t={t} at={8.38} x={485} y={1370} size={84} rot={-3}>
				UMROH + MESIR
			</Label>
		</AbsoluteFill>
	);
};

// ---------- D. Rehlata Academy ----------
const D: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	return (
		<AbsoluteFill>
			<Camera t={t} start={s} end={e} from={1.12} to={1.04} drift={0}>
				<ARoll s={s} />
			</Camera>
			<div style={{position: 'absolute', left: 540, top: 380, transform: `translate(-50%,-50%) scale(${pop(t, 10.02, 9)}) rotate(${6 - 6 * pop(t, 10.02)}deg)`}}>
				<Logo src="logo-academy.jpg" size={320} />
			</div>
			<Tape x={660} y={240} rot={32} />
			<Label t={t} at={10.48} x={540} y={600} size={62} rot={2}>
				Rehlata Academy
			</Label>
		</AbsoluteFill>
	);
};

// ---------- E. Bimbingan & pelatihan ----------
const E: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	const item = (txt: string, at: number, y: number) => (
		<div style={{position: 'absolute', left: 40, top: y, display: 'flex', alignItems: 'center', gap: 22, opacity: ramp(t, at - 0.2, at)}}>
			<div style={{width: 56, height: 56, border: '5px solid #3b2f22', borderRadius: 6, position: 'relative'}}>
				<svg width={56} height={56} style={{position: 'absolute', left: -5, top: -5}}>
					<path d="M10,30 L24,44 L50,10" stroke="#2e8b3a" strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={70} strokeDashoffset={70 * (1 - ramp(t, at + 0.05, at + 0.35))} />
				</svg>
			</div>
			<div style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: INK}}>{txt}</div>
		</div>
	);
	return (
		<AbsoluteFill>
			<Paper tone="#e5d6b8" />
			<Camera t={t} start={s} end={e} from={1.0} to={1.08}>
				<Torn x={60} y={150} w={720} h={1040} seed="frameE" color="#fbf8f1" rot={-2}>
					<div style={{position: 'absolute', inset: 16}}>
						<ARoll s={s} />
					</div>
				</Torn>
				<Tape x={420} y={155} rot={-4} w={200} />
				<Torn x={540} y={1000} w={470} h={360} seed="noteE" color="#f7f0dc" rot={3}>
					<div style={{position: 'absolute', top: 30, width: '100%', textAlign: 'center', fontFamily: 'DejaVu Sans Mono, monospace', fontSize: 30, letterSpacing: 3, color: '#3b2f22'}}>
						REHLATA ACADEMY
					</div>
					{item('Bimbingan', 13.86, 120)}
					{item('Pelatihan', 15.24, 220)}
				</Torn>
				<Caption t={t} at={11.6} x={900} y={260} size={46} font={SERIF} color="#7b2a2a" weight={400} rot={4}>
					<i>fokus kami:</i>
				</Caption>
			</Camera>
		</AbsoluteFill>
	);
};

// ---------- F. Map: Timur Tengah -> zoom to Kairo ----------
const F: React.FC<SP> = ({s}) => {
	const t = useT(s);
	return (
		<AbsoluteFill>
			<WorldMap
				t={t}
				keys={[
					{t: 16.1, lon: 100, lat: 2, scale: 900},
					{t: 17.6, lon: 70, lat: 15, scale: 480},
					{t: 18.8, lon: 44, lat: 26, scale: 950},
					{t: 19.3, lon: 38, lat: 27, scale: 1150},
					{t: 20.0, lon: CAIRO[0], lat: CAIRO[1] - 1.5, scale: 9000, ease: Easing.in(Easing.cubic)},
				]}
				highlight={[
					{ids: ['360'], at: 16.1, color: GREEN},
					{ids: ME, at: 18.94, color: '#f2c94c'},
				]}
				routes={[{from: JAKARTA, to: CAIRO, a: 16.6, b: 18.2, color: YELLOW}]}
				pins={[{ll: CAIRO, at: 19.3, color: '#e34b4b'}]}
				labels={[
					{ll: JAKARTA, at: 16.3, text: 'Indonesia', dy: 80},
					{ll: [45, 24], at: 18.94, text: 'Timur Tengah', dy: 0, size: 64},
				]}
			/>
			<Label t={t} at={18.38} x={485} y={1370} size={74} rot={-2} bg="#fff">
				kuliah
			</Label>
		</AbsoluteFill>
	);
};

// ---------- G. Al-Azhar, Kairo ----------
const G: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	const p = pop(t, 20.5, 13);
	return (
		<AbsoluteFill>
			<Camera t={t} start={s} end={e} from={1.18} to={1.0} drift={-40}>
				<Img src={staticFile('minaret.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.06) saturate(0.95)'}} />
			</Camera>
			<div style={{position: 'absolute', left: 90, top: 760, transform: `rotate(-5deg) translateX(${(1 - p) * -900}px)`}}>
				<Polaroid src="gate.jpg" w={420} h={460} pos="center 25%" caption="Universitas Al-Azhar" />
			</div>
			{t > 20.5 ? <Tape x={300} y={770} rot={-12} w={160} /> : null}
			<Label t={t} at={20.04} x={540} y={300} size={96} rot={-3}>
				Al-Azhar
			</Label>
			<Label t={t} at={20.5} x={600} y={420} size={50} rot={2} bg="#fff">
				Kairo, Mesir
			</Label>
			<Caption t={t} at={20.7} x={540} y={500} size={28} color="#fff" weight={700}>
				30°02′45″N · 31°15′45″E
			</Caption>
		</AbsoluteFill>
	);
};

// ---------- H. End card ----------
const Hc: React.FC<SP> = ({s, e}) => {
	const t = useT(s);
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.0} to={1.06}>
				<div style={{position: 'absolute', left: 540, top: 520, transform: `translate(-50%,-50%) scale(${pop(t, 21.75)}) rotate(-2deg)`}}>
					<div style={{position: 'relative', width: 820, height: 380}}>
						<Torn x={0} y={0} w={820} h={380} seed="tourBadge" color="#1d5a33" amp={14}>
							<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.12), rgba(0,0,0,0.18) 80%)'}} />
							<Img src={staticFile('logo-tour-wide.png')} style={{position: 'absolute', left: 60, top: 60, width: 700, height: 'auto', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.35))'}} />
						</Torn>
					</div>
				</div>
				{t > 21.75 ? <Tape x={170} y={345} rot={-28} /> : null}
				{t > 21.75 ? <Tape x={910} y={350} rot={24} /> : null}
				<div style={{position: 'absolute', left: 540, top: 920, transform: `translate(-50%,-50%) scale(${pop(t, 22.05)}) rotate(4deg)`}}>
					<Logo src="logo-academy.jpg" size={300} />
				</div>
				<Label t={t} at={22.4} x={485} y={1190} size={56} rot={-2}>
					Umroh + Mesir
				</Label>
				<Label t={t} at={22.6} x={485} y={1290} size={56} rot={2} bg={GREEN}>
					Kuliah di Al-Azhar
				</Label>
			</Camera>
		</AbsoluteFill>
	);
};

// Paper sheet that sweeps across the frame at a cut (Vox-style collage wipe).
const PaperWipe: React.FC<{at: number; dir?: 1 | -1}> = ({at, dir = 1}) => {
	const t = useT(0);
	const p = ramp(t, at - 0.2, at + 0.22, Easing.inOut(Easing.cubic));
	if (p <= 0 || p >= 1) return null;
	const x = (1 - 2 * p) * 1300 * dir;
	return (
		<AbsoluteFill style={{transform: `translateX(${x}px) rotate(${dir * 4}deg) scale(1.2)`}}>
			<Torn x={-60} y={-80} w={1200} h={2080} seed={`wipe${at}`} color="#e9dcc2" amp={40} />
		</AbsoluteFill>
	);
};

const SCENES: [React.FC<SP>, number, number][] = [
	[A, 0, 1.7],
	[B, 1.7, 7.0],
	[C, 7.0, 9.1],
	[D, 9.1, 11.3],
	[E, 11.3, 16.1],
	[F, 16.1, 19.95],
	[G, 19.95, 21.6],
	[Hc, 21.6, DURATION],
];

const SFX: [string, number, number][] = [
	['whip', 0.7, 0.5],
	['mouse-click', 1.04, 0.5],
	['whoosh', 1.55, 0.7],
	['shutter-old', 1.8, 0.45],
	['shutter-modern', 3.3, 0.4],
	['mouse-click', 3.28, 0.35],
	['mouse-click', 4.28, 0.35],
	['mouse-click', 5.38, 0.5],
	['whoosh', 6.85, 0.7],
	['mouse-click', 8.02, 0.4],
	['ding', 8.5, 0.18],
	['whip', 9.0, 0.5],
	['page-turn', 10.0, 0.6],
	['mouse-click', 10.48, 0.5],
	['page-turn', 11.2, 0.6],
	['switch', 13.86, 0.5],
	['switch', 15.24, 0.5],
	['whoosh', 15.95, 0.7],
	['mouse-click', 18.94, 0.45],
	['whoosh', 19.4, 0.6],
	['shutter-old', 19.95, 0.45],
	['shutter-modern', 20.5, 0.4],
	['whoosh', 21.45, 0.7],
	['page-turn', 21.75, 0.5],
	['ding', 22.6, 0.2],
];

export const AzharVox: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		{SCENES.map(([C2, s, e]) => (
			<Sequence key={s} from={Math.round(s * FPS)} durationInFrames={Math.round((e - s) * FPS)}>
				<C2 s={s} e={e} />
			</Sequence>
		))}
		<PaperWipe at={1.7} />
		<PaperWipe at={11.3} dir={-1} />
		<PaperWipe at={21.6} />
		<Vignette strength={0.45} />
		<Grain />
		<Audio src={staticFile('aroll.mp4')} volume={1} />
		{SFX.map(([name, at, vol], i) => (
			<Sequence key={i} from={Math.round(at * FPS)}>
				<Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
			</Sequence>
		))}
	</AbsoluteFill>
);
