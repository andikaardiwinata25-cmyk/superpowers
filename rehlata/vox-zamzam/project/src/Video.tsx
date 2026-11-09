import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile} from 'remotion';
import {Bottle, Bucket, Check, DesertMap, Droplet, Factory, Galon, Glass, Pump, Suitcase, Tank, Truck} from './art';
import {
	Camera,
	Caption,
	Disclaimer,
	Dot,
	FPS,
	Grain,
	INK,
	Label,
	Paper,
	RED,
	Route,
	SANS,
	SERIF,
	Stamp,
	Tape,
	Torn,
	Vignette,
	YELLOW,
	bezier,
	fmtID,
	pointAt,
	pop,
	ramp,
	useT,
} from './kit';

export const DURATION = 66;

const HARAM: [number, number] = [430, 430];
const KUDAI: [number, number] = [650, 1060];
const ROUTE = bezier(HARAM, [400, 820], KUDAI);

// ---------------- 1. Hook: the glass ----------------
const S1: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const bob = Math.sin(t * 2) * 6;
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} to={1.1}>
				<Caption t={t} at={0.15} x={540} y={250} font={SERIF} size={54} weight={400} color={RED}>
					<i>Masjidil Haram, Mekkah</i>
				</Caption>
				<Torn x={200} y={330} w={680} h={760} seed="card1" rot={-2} style={{transform: `rotate(-2deg) translateY(${(1 - pop(t, 0)) * 60}px)`}}>
					<div style={{position: 'absolute', left: 150, top: 120, transform: `translateY(${bob}px)`}}>
						<Glass size={380} wobble={Math.sin(t * 5) * 6} />
					</div>
				</Torn>
				<Tape x={250} y={345} rot={-30} />
				<Tape x={830} y={340} rot={25} />
				<Label t={t} at={0.4} x={790} y={470} size={60} rot={4}>
					Zamzam
				</Label>
				<Caption t={t} at={0.6} x={540} y={1135} size={30} color="#7b2a2a" weight={600}>
					21°25′21″N · 39°49′34″E
				</Caption>
				<Label t={t} at={2.9} x={540} y={1440} size={56}>
					langsung dari sumurnya?
				</Label>
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 2. "Ternyata nggak. Mudik." ----------------
const S2: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const scroll = (t * 520) % 160;
	const ride = interpolate(t, [s, e], [180, 620]);
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.05} to={1.12}>
				<Torn x={-40} y={760} w={1160} h={330} seed="road" color="#3a3530" amp={18}>
					{Array.from({length: 9}, (_, i) => (
						<div key={i} style={{position: 'absolute', top: 155, left: i * 160 - scroll, width: 90, height: 16, background: '#f1e6c8'}} />
					))}
				</Torn>
				<div style={{position: 'absolute', left: ride, top: 600 + Math.abs(Math.sin(t * 9)) * -18}}>
					<Droplet size={150} />
					<div style={{position: 'absolute', left: 120, top: 110}}>
						<Suitcase size={95} />
					</div>
				</div>
				{/* road sign */}
				<div
					style={{
						position: 'absolute',
						left: 640,
						top: 360,
						transform: `scale(${pop(t, 7.9)}) rotate(3deg)`,
						transformOrigin: 'bottom center',
					}}
				>
					<div style={{position: 'absolute', left: 140, top: 150, width: 18, height: 260, background: '#6d6d6d'}} />
					<div
						style={{
							background: '#1f7a43',
							color: '#fff',
							border: '6px solid #fff',
							outline: '4px solid #1f7a43',
							borderRadius: 12,
							padding: '18px 26px',
							fontFamily: SANS,
							fontWeight: 800,
							fontSize: 40,
							lineHeight: 1.15,
							width: 250,
						}}
					>
						LUAR KOTA →
					</div>
				</div>
				{t < 7.3 ? <Stamp t={t} at={5.76} x={540} y={420} text="NGGAK" /> : null}
				<Label t={t} at={7.46} x={540} y={1440} size={110} rot={-3}>
					MUDIK
				</Label>
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 3a. Top view: Ka'bah & the well ----------------
const S3a: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const well: [number, number] = [690, 770];
	const steps = ramp(t, 11.3, 12.0);
	return (
		<AbsoluteFill>
			<Camera t={t} start={s} end={e} from={1} to={1.3}>
				<AbsoluteFill style={{background: '#e7e2d6'}}>
					<svg width={1080} height={1920}>
						<filter id="marble">
							<feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves={4} seed={2} />
							<feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.58  0 0 0 0 0.55  0 0 0 0.8 -0.3" />
						</filter>
						<rect width={1080} height={1920} filter="url(#marble)" />
						{/* surrounding building */}
						<circle cx={540} cy={700} r={560} fill="none" stroke="#b9ad97" strokeWidth={140} />
						{Array.from({length: 48}, (_, i) => {
							const a = (i / 48) * Math.PI * 2;
							return <circle key={i} cx={540 + Math.cos(a) * 480} cy={700 + Math.sin(a) * 480} r={9} fill="#8e826d" />;
						})}
						{[160, 230, 300, 370].map((r) => (
							<circle key={r} cx={540} cy={700} r={r} fill="none" stroke="rgba(120,110,95,0.35)" strokeWidth={3} strokeDasharray="10 14" />
						))}
						<g transform="translate(540,700) rotate(12)">
							<rect x={-70} y={-62} width={140} height={124} fill="#141414" />
							<rect x={-70} y={-62} width={140} height={124} fill="none" stroke="#c9a24b" strokeWidth={8} />
						</g>
						<line x1={540} y1={700} x2={well[0]} y2={well[1]} stroke={INK} strokeWidth={4} strokeDasharray="8 10" opacity={steps} />
					</svg>
					<Dot t={t} at={9.6} x={well[0]} y={well[1]} color={RED} />
					<Label t={t} at={9.9} x={760} y={920} size={54} rot={-2}>
						Sumur Zamzam
					</Label>
					<Caption t={t} at={11.4} x={850} y={770} size={30} weight={800}>
						beberapa langkah
					</Caption>
					<Label t={t} at={12.1} x={420} y={530} size={50} rot={2} bg="#fff">
						Ka'bah
					</Label>
				</AbsoluteFill>
			</Camera>
			<Disclaimer text="Ilustrasi · bukan visual asli" />
		</AbsoluteFill>
	);
};

// ---------------- 3b. Cross-section: 30 m deep ----------------
const S3b: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const d = ramp(t, 13.4, 14.8, Easing.inOut(Easing.cubic));
	const top = 380;
	const bot = 1100;
	const layers = ['#b88b5a', '#a3764a', '#8d643f', '#76533a', '#5f4532'];
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.02} to={1.08}>
				<Torn x={60} y={300} w={960} h={70} seed="floor" color="#f2efe8" amp={6} />
				<Caption t={t} at={13.2} x={300} y={250} size={30} weight={800}>
					LANTAI THAWAF
				</Caption>
				{layers.map((c, i) => (
					<Torn key={c} x={60} y={top + i * 150} w={960} h={160} seed={`layer${i}`} color={c} amp={16} />
				))}
				{/* shaft */}
				<div style={{position: 'absolute', left: 470, top, width: 120, height: bot - top, background: '#2a211a', boxShadow: 'inset 0 0 30px #000'}} />
				<div style={{position: 'absolute', left: 470, top: bot - 110, width: 120, height: 110, background: '#4aa3c7'}} />
				{/* ruler */}
				<div style={{position: 'absolute', left: 780, top, width: 6, height: bot - top, background: YELLOW}} />
				{[0, 10, 20, 30].map((m) => (
					<React.Fragment key={m}>
						<div style={{position: 'absolute', left: 760, top: top + ((bot - top) * m) / 30 - 3, width: 46, height: 6, background: YELLOW}} />
						<div style={{position: 'absolute', left: 820, top: top + ((bot - top) * m) / 30 - 20, fontFamily: SANS, fontWeight: 700, fontSize: 30, color: YELLOW}}>
							{m} m
						</div>
					</React.Fragment>
				))}
				{/* descending marker */}
				<div style={{position: 'absolute', left: 530 - 30, top: top + (bot - top) * d - 30, width: 60, height: 60, border: `6px solid ${YELLOW}`, borderRadius: '50%'}} />
				<div
					style={{
						position: 'absolute',
						left: 140,
						top: top + (bot - top) * d - 40,
						border: `4px solid ${YELLOW}`,
						color: YELLOW,
						fontFamily: 'DejaVu Sans Mono, monospace',
						fontSize: 48,
						padding: '6px 16px',
						background: 'rgba(0,0,0,0.35)',
					}}
				>
					{(30 * d).toFixed(1).padStart(4, '0')} m
				</div>
				<Label t={t} at={14.3} x={540} y={1440} size={80} rot={-2}>
					±30 meter
				</Label>
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 4. Dulu vs Sekarang ----------------
const S4: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const rope = 200 + (Math.sin(t * 2.2) + 1) * 120;
	const slide = ramp(t, 19.0, 19.35, Easing.out(Easing.exp));
	return (
		<AbsoluteFill>
			<Paper tone="#d9c7a2" />
			<Camera t={t} start={s} end={e} from={1} to={1.08}>
				{/* DULU */}
				<Torn x={110} y={250} w={860} h={900} seed="dulu" color="#c9b087" rot={-1.5}>
					<div style={{position: 'absolute', inset: 0, filter: 'sepia(0.8) contrast(1.05)'}}>
						<div style={{position: 'absolute', left: 230, top: 90, width: 400, height: 24, background: '#5a3d22'}} />
						<div style={{position: 'absolute', left: 230, top: 90, width: 24, height: 300, background: '#5a3d22'}} />
						<div style={{position: 'absolute', left: 606, top: 90, width: 24, height: 300, background: '#5a3d22'}} />
						<div style={{position: 'absolute', left: 428, top: 60, width: 60, height: 60, borderRadius: '50%', border: '10px solid #3a2614'}} />
						<div style={{position: 'absolute', left: 454, top: 110, width: 6, height: rope, background: '#7a5a34'}} />
						<div style={{position: 'absolute', left: 382, top: 100 + rope}}>
							<Bucket />
						</div>
						<div style={{position: 'absolute', left: 170, top: 560, width: 520, height: 120, background: '#8a7a64', borderRadius: '50% / 30%', border: '8px solid #4a3e30'}} />
					</div>
				</Torn>
				<Tape x={540} y={255} rot={2} w={200} />
				<Label t={t} at={16.1} x={260} y={330} size={70} rot={-5} bg="#fff">
					DULU
				</Label>
				<Label t={t} at={17.9} x={760} y={1440} size={60} rot={2} out={19.0}>
					ditimba pakai ember
				</Label>
				{/* SEKARANG slides over */}
				{t >= 19.0 ? (
					<div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - slide) * 1100}px)`}}>
						<Torn x={70} y={230} w={940} h={940} seed="now" color="#eef1f0" rot={1.5}>
							<div style={{position: 'absolute', left: 90, top: 200}}>
								<Pump spin={t * 400} flow={t * 160} />
							</div>
						</Torn>
						<Tape x={540} y={240} rot={-3} w={200} />
						<Label t={t} at={19.2} x={300} y={320} size={70} rot={-3}>
							SEKARANG
						</Label>
						<Label t={t} at={21.4} x={540} y={1440} size={64} rot={-2}>
							nyedot terus-terusan
						</Label>
					</div>
				) : null}
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 5. Not straight to your glass -> map to Kudai ----------------
const NotDirect: React.FC<{t: number}> = ({t}) => {
	const x = ramp(t, 23.7, 24.0);
	const x2 = ramp(t, 24.0, 24.3);
	return (
		<AbsoluteFill>
			<Paper />
			<Torn x={90} y={420} w={330} h={330} seed="w1" color="#f4ecdb" rot={-4}>
				<div style={{position: 'absolute', left: 65, top: 60, width: 200, height: 160, background: '#6b5b45', borderRadius: '50% / 25%'}} />
				<div style={{position: 'absolute', width: '100%', top: 250, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK}}>SUMUR</div>
			</Torn>
			<Torn x={660} y={420} w={330} h={330} seed="w2" color="#f4ecdb" rot={3}>
				<div style={{position: 'absolute', left: 95, top: 25, transform: 'scale(0.4)', transformOrigin: 'top left'}}>
					<Glass size={340} />
				</div>
				<div style={{position: 'absolute', width: '100%', top: 250, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK}}>GELAS</div>
			</Torn>
			<svg width={1080} height={1920} style={{position: 'absolute'}}>
				<path d="M440,585 L640,585" stroke={INK} strokeWidth={10} />
				<path d="M620,560 L650,585 L620,610" stroke={INK} strokeWidth={10} fill="none" />
				<path d="M470,480 L620,690" stroke={RED} strokeWidth={22} strokeLinecap="round" strokeDasharray={260} strokeDashoffset={260 * (1 - x)} />
				<path d="M620,480 L470,690" stroke={RED} strokeWidth={22} strokeLinecap="round" strokeDasharray={260} strokeDashoffset={260 * (1 - x2)} />
			</svg>
			<Label t={t} at={23.7} x={540} y={1000} size={70} rot={-2}>
				nggak langsung
			</Label>
		</AbsoluteFill>
	);
};

const MapToKudai: React.FC<{t: number; s: number; e: number}> = ({t, s, e}) => {
	const prog = ramp(t, 26.0, 28.9, Easing.inOut(Easing.quad));
	const km = ramp(t, 27.9, 29.2, Easing.out(Easing.quad)) * 5;
	return (
		<Camera t={t} start={s} end={e} from={1.12} to={1.0} drift={-30}>
			<DesertMap city={HARAM} />
			<Route pts={ROUTE} prog={prog} id="r1" color="#5fd0ff" width={10} />
			<Dot t={t} at={25.8} x={HARAM[0]} y={HARAM[1]} color="#2e9b4f" />
			<Label t={t} at={25.9} x={HARAM[0] + 40} y={HARAM[1] - 90} size={46} rot={-1}>
				Masjidil Haram
			</Label>
			<Dot t={t} at={26.9} x={KUDAI[0]} y={KUDAI[1]} color={RED} />
			<Label t={t} at={26.9} x={KUDAI[0] + 60} y={KUDAI[1] + 90} size={64} rot={2}>
				Kudai
			</Label>
			<Caption t={t} at={26.4} x={300} y={760} size={30} color="#fff" weight={800} rot={-70}>
				PIPA →
			</Caption>
			{/* HUD scale like the reference */}
			{t > 27.8 ? (
				<div style={{position: 'absolute', left: 140, top: 1420, width: 800, opacity: ramp(t, 27.8, 28.1)}}>
					<div style={{height: 4, background: YELLOW}} />
					{Array.from({length: 21}, (_, i) => (
						<div key={i} style={{position: 'absolute', left: i * 40, top: -(i % 5 ? 10 : 22), width: 3, height: i % 5 ? 10 : 22, background: YELLOW}} />
					))}
					<div
						style={{
							position: 'absolute',
							left: 290,
							top: 26,
							border: `4px solid ${YELLOW}`,
							color: YELLOW,
							fontFamily: 'DejaVu Sans Mono, monospace',
							fontSize: 52,
							padding: '4px 18px',
							background: 'rgba(0,0,0,0.35)',
						}}
					>
						{km.toFixed(1).padStart(4, '0')} km
					</div>
				</div>
			) : null}
		</Camera>
	);
};

const S5: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	return <AbsoluteFill>{t < 25.7 ? <NotDirect t={t} /> : <MapToKudai t={t} s={25.7} e={e} />}</AbsoluteFill>;
};

// ---------------- 6. 2010: the factory ----------------
const S6: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const year = Math.round(interpolate(t, [30.0, 31.1], [1990, 2010], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
	const rise = ramp(t, 32.3, 32.9, Easing.out(Easing.back(1.4)));
	return (
		<AbsoluteFill>
			<Paper tone="#efe7d6" />
			<Camera t={t} start={s} end={e} from={1} to={1.1}>
				<div style={{position: 'absolute', top: 0, left: 0, width: 1080, height: 560, background: RED, opacity: 0.92}} />
				<Torn x={-30} y={480} w={1140} h={120} seed="redtear" color="#efe7d6" amp={26} />
				<div
					style={{
						position: 'absolute',
						width: '100%',
						top: 170,
						textAlign: 'center',
						fontFamily: SERIF,
						fontStyle: 'italic',
						fontWeight: 700,
						fontSize: 300,
						color: '#fff',
						textShadow: '0 10px 0 rgba(0,0,0,0.18)',
						letterSpacing: 6,
					}}
				>
					{year}
				</div>
				<div style={{position: 'absolute', left: 180, top: 640 + (1 - rise) * 600, opacity: rise > 0 ? 1 : 0}}>
					<Torn x={0} y={0} w={720} h={420} seed="fac" color="#fbf8f1" rot={-1}>
						<div style={{position: 'absolute', top: 20}}>
							<Factory />
						</div>
					</Torn>
				</div>
				<Caption t={t} at={33.0} x={540} y={1120} size={44} font={SERIF} color={RED} weight={400}>
					<i>Kudai, Mekkah</i>
				</Caption>
				<Label t={t} at={32.86} x={540} y={1440} size={70} rot={-2}>
					pabrik khusus
				</Label>
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 7. Clipboard checklist ----------------
const S7: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const circle = ramp(t, 37.7, 38.3);
	const drip = (t * 140) % 260;
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.0} to={1.12}>
				<div style={{position: 'absolute', left: 170, top: 230, width: 740, height: 960, background: '#a9784a', borderRadius: 26, transform: 'rotate(-2deg)', boxShadow: '0 18px 30px rgba(40,20,5,0.45)'}}>
					<div style={{position: 'absolute', left: 260, top: -30, width: 220, height: 80, background: '#c8cdd1', borderRadius: 12, border: '6px solid #6c7378'}} />
					<div style={{position: 'absolute', left: 50, top: 80, right: 50, bottom: 50, background: '#fbf8f0'}}>
						<div style={{position: 'absolute', top: 40, width: '100%', textAlign: 'center', fontFamily: 'DejaVu Sans Mono, monospace', fontSize: 40, color: INK, letterSpacing: 4}}>
							CEK KUALITAS
						</div>
						{/* filter layers */}
						<div style={{position: 'absolute', left: 60, top: 140, width: 520, height: 260, overflow: 'hidden', border: '4px solid #3b2f22'}}>
							{['#e8d8b0', '#c9b48a', '#9b8664', '#6d6253', '#3f3a34'].map((c, i) => (
								<div key={c} style={{height: 52, background: c, backgroundImage: 'radial-gradient(rgba(0,0,0,0.25) 2px, transparent 3px)', backgroundSize: `${10 + i * 4}px ${10 + i * 4}px`}} />
							))}
							{[120, 260, 400].map((x, i) => (
								<div key={x} style={{position: 'absolute', left: x, top: ((drip + i * 90) % 260) - 20, width: 16, height: 22, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#4aa3c7'}} />
							))}
						</div>
						{[
							['Disaring berlapis-lapis', 34.98],
							['Sampel dicek di lab', 37.1],
						].map(([txt, at], i) => (
							<div key={txt as string} style={{position: 'absolute', left: 60, top: 450 + i * 130, display: 'flex', alignItems: 'center', gap: 26, opacity: ramp(t, (at as number) - 0.4, at as number)}}>
								<Check p={ramp(t, (at as number) + 0.1, (at as number) + 0.45)} />
								<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: INK}}>{txt}</div>
							</div>
						))}
						<svg width={640} height={800} style={{position: 'absolute', left: 0, top: 0}}>
							<ellipse cx={482} cy={613} rx={95} ry={48} fill="none" stroke={RED} strokeWidth={7} strokeDasharray={480} strokeDashoffset={480 * (1 - circle)} transform="rotate(-6 482 613)" />
						</svg>
					</div>
				</div>
				<Label t={t} at={37.54} x={540} y={1440} size={64} rot={-2}>
					laboratorium
				</Label>
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 8. Bottling 200.000 / day ----------------
const S8: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const move = (t * 260) % 220;
	const n = interpolate(t, [41.3, 42.9], [0, 200000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.0} to={1.08}>
				<Label t={t} at={39.76} x={540} y={300} size={64} rot={-2} bg="#fff">
					dibotolin
				</Label>
				{t >= 41.3 ? (
					<div style={{position: 'absolute', left: 540, top: 520, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * pop(t, 41.3)}) rotate(-2deg)`}}>
						<div style={{background: YELLOW, fontFamily: SANS, fontWeight: 800, fontSize: 150, color: INK, padding: '10px 40px', boxShadow: '0 8px 0 rgba(0,0,0,0.25)', fontVariantNumeric: 'tabular-nums'}}>
							{fmtID(Math.round(n / 1000) * 1000)}
						</div>
					</div>
				) : null}
				<Label t={t} at={42.9} x={600} y={660} size={52} rot={-2} bg={INK} color="#fff">
					botol / hari
				</Label>
				<Caption t={t} at={43.1} x={540} y={740} size={26} color="rgba(30,20,10,0.6)" weight={600}>
					kapasitas maksimal pabrik
				</Caption>
				{/* conveyor */}
				<div style={{position: 'absolute', left: -40, top: 1080, width: 1160, height: 50, background: '#4b4f53', borderTop: '6px solid #2a2d30'}} />
				{Array.from({length: 13}, (_, i) => (
					<div key={i} style={{position: 'absolute', left: i * 90 - (move % 90), top: 1090, width: 30, height: 30, borderRadius: '50%', background: '#2a2d30'}} />
				))}
				{Array.from({length: 7}, (_, i) => (
					<div key={i} style={{position: 'absolute', left: i * 220 + move - 220, top: 880}}>
						<Bottle size={150} />
					</div>
				))}
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 9. Tank -> back home ----------------
const S9: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	if (t < 46.5) {
		return (
			<AbsoluteFill>
				<Paper />
				<Camera t={t} start={s} end={46.5} from={1.15} to={1.0} drift={-20}>
					<div style={{position: 'absolute', left: 160, top: 330}}>
						<Tank level={0.15 + 0.7 * ramp(t, 44.0, 46.4, Easing.inOut(Easing.quad))} />
					</div>
					<Label t={t} at={45.4} x={540} y={1440} size={70} rot={-2}>
						tangki raksasa
					</Label>
				</Camera>
			</AbsoluteFill>
		);
	}
	const back = [...ROUTE].reverse();
	const prog = ramp(t, 46.6, 48.4, Easing.inOut(Easing.quad));
	const [tx, ty] = pointAt(back, prog);
	return (
		<AbsoluteFill>
			<Camera t={t} start={46.5} end={e} from={1.05} to={1.15}>
				<DesertMap city={HARAM} />
				<Route pts={back} prog={prog} id="r2" color={YELLOW} width={10} />
				<Dot t={t} at={46.5} x={KUDAI[0]} y={KUDAI[1]} color={RED} />
				<Dot t={t} at={47.6} x={HARAM[0]} y={HARAM[1]} color="#2e9b4f" />
				<div style={{position: 'absolute', left: tx - 75, top: ty - 70}}>
					<Truck size={150} />
				</div>
				<Label t={t} at={46.82} x={540} y={1440} size={84} rot={-3}>
					PULANG KAMPUNG
				</Label>
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 10. Thousands of galons, cold / not cold ----------------
const S10: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	if (t < 53.2) {
		return (
			<AbsoluteFill style={{background: '#7a1f24'}}>
				<Camera t={t} start={s} end={53.2} from={1} to={1.12}>
					<svg width={1080} height={1920} style={{position: 'absolute'}}>
						{Array.from({length: 14}, (_, i) => {
							const y = 520 + Math.pow(i / 13, 1.6) * 1400;
							return <rect key={i} x={0} y={y} width={1080} height={8 + i * 2} fill="#e3c27a" opacity={0.7} />;
						})}
						<rect width={1080} height={520} fill="#e9e3d6" />
						{Array.from({length: 9}, (_, i) => (
							<path key={i} d={`M${60 + i * 120},520 v-280 a60,60 0 0 1 120,0 v280`} fill="#d6cdb9" stroke="#b8ab92" strokeWidth={6} />
						))}
					</svg>
					{Array.from({length: 12}, (_, i) => {
						const k = i / 11;
						const at = 50.9 + i * 0.1;
						const sc = 1.25 - k * 0.95;
						const x = 160 + k * 420;
						const y = 1200 - Math.pow(k, 0.8) * 640;
						return (
							<div key={i} style={{position: 'absolute', left: x, top: y, transform: `scale(${sc * pop(t, at)})`, transformOrigin: 'bottom center', zIndex: 20 - i}}>
								<Galon size={180} />
							</div>
						);
					})}
					{Array.from({length: 12}, (_, i) => {
						const k = i / 11;
						const at = 51.1 + i * 0.1;
						const sc = 1.25 - k * 0.95;
						const x = 760 - k * 120;
						const y = 1200 - Math.pow(k, 0.8) * 640;
						return (
							<div key={i} style={{position: 'absolute', left: x, top: y, transform: `scale(${sc * pop(t, at)})`, transformOrigin: 'bottom center', zIndex: 20 - i}}>
								<Galon size={180} />
							</div>
						);
					})}
					<Label t={t} at={50.96} x={540} y={300} size={72} rot={-2}>
						ribuan galon
					</Label>
					<Caption t={t} at={51.8} x={540} y={410} size={34} color="#3b2f22" weight={800}>
						di sepanjang shaf
					</Caption>
				</Camera>
			</AbsoluteFill>
		);
	}
	const tag = (at: number, txt: string, bg: string, x: number) => (
		<div style={{position: 'absolute', left: x, top: 470, transform: `rotate(${Math.sin((t - at) * 4) * 4 * (1 - ramp(t, at, at + 1.2))}deg) scale(${pop(t, at)})`, transformOrigin: 'top center'}}>
			<div style={{width: 4, height: 80, background: '#3b2f22', margin: '0 auto'}} />
			<div style={{background: bg, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 52, padding: '14px 26px', borderRadius: 10, boxShadow: '0 6px 0 rgba(0,0,0,0.25)', whiteSpace: 'nowrap'}}>{txt}</div>
		</div>
	);
	return (
		<AbsoluteFill>
			<Paper />
			<Camera t={t} start={53.2} end={e} from={1} to={1.08}>
				<div style={{position: 'absolute', left: 130, top: 560}}>
					<Galon size={330} tint="#e4f1f7" />
				</div>
				<div style={{position: 'absolute', left: 620, top: 560}}>
					<Galon size={330} />
				</div>
				{tag(53.8, '❄ DINGIN', '#2f80c0', 175)}
				{tag(54.9, 'TIDAK DINGIN', '#b5532f', 600)}
			</Camera>
		</AbsoluteFill>
	);
};

// ---------------- 11. Recap: the whole journey ----------------
const NODES: {txt: string; at: number; x: number; y: number}[] = [
	{txt: 'perut bumi', at: 57.8, x: 290, y: 400},
	{txt: 'keluar kota', at: 59.58, x: 790, y: 540},
	{txt: 'disaring', at: 60.68, x: 290, y: 690},
	{txt: 'dicek', at: 61.5, x: 790, y: 830},
	{txt: 'pulang', at: 62.44, x: 290, y: 980},
];
const S11: React.FC<{s: number; e: number}> = ({s, e}) => {
	const t = useT(s);
	const end = {x: 540, y: 1450};
	const pts = [...NODES.map((n) => [n.x, n.y] as [number, number]), [end.x, end.y - 120] as [number, number]];
	const times = [...NODES.map((n) => n.at), 64.1];
	const fade = 1 - ramp(t, 65.4, 66);
	return (
		<AbsoluteFill style={{opacity: fade}}>
			<Paper />
			<Camera t={t} start={s} end={e} from={1.04} to={1.0}>
				<Label t={t} at={56.9} x={540} y={220} size={56} rot={-1} bg={INK} color="#fff">
					1 gelas Zamzam
				</Label>
				{pts.slice(1).map((p, i) => (
					<Route key={i} pts={[pts[i], p]} prog={ramp(t, times[i], times[i + 1] - 0.1)} id={`rc${i}`} color={RED} width={7} dash="14 12" />
				))}
				{NODES.map((n, i) => (
					<React.Fragment key={n.txt}>
						<Dot t={t} at={n.at} x={n.x} y={n.y} color={YELLOW} r={18} />
						<Label t={t} at={n.at} x={n.x} y={n.y - 70} size={46} rot={i % 2 ? 2 : -2} bg="#fff">
							{n.txt}
						</Label>
					</React.Fragment>
				))}
				<div style={{position: 'absolute', left: end.x - 110, top: end.y - 120, transform: `scale(${pop(t, 64.1)})`, transformOrigin: 'center'}}>
					<Glass size={220} />
				</div>
				<Label t={t} at={64.1} x={540} y={1440 + 70} size={60} rot={-2}>
					tangan kamu
				</Label>
			</Camera>
			<div style={{position: 'absolute', bottom: 120, width: '100%', textAlign: 'center', opacity: ramp(t, 64.8, 65.2), fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 10, color: INK}}>
				REHLATA
			</div>
		</AbsoluteFill>
	);
};

const SCENES: [React.FC<{s: number; e: number}>, number, number][] = [
	[S1, 0, 5.0],
	[S2, 5.0, 9.35],
	[S3a, 9.35, 13.25],
	[S3b, 13.25, 15.95],
	[S4, 15.95, 22.8],
	[S5, 22.8, 29.9],
	[S6, 29.9, 34.2],
	[S7, 34.2, 39.0],
	[S8, 39.0, 43.9],
	[S9, 43.9, 48.85],
	[S10, 48.85, 56.0],
	[S11, 56.0, DURATION],
];

export const VoxZamzam: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		{SCENES.map(([C, s, e]) => (
			<Sequence key={s} from={Math.round(s * FPS)} durationInFrames={Math.round((e - s) * FPS)}>
				<C s={s} e={e} />
			</Sequence>
		))}
		<Vignette />
		<Grain />
		<Audio src={staticFile('vo.mp3')} />
	</AbsoluteFill>
);
