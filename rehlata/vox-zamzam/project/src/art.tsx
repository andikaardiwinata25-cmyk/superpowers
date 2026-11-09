// Flat cut-out illustrations used by the scenes (all drawn in SVG, no stock media).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, SANS, W} from './kit';

export const Glass: React.FC<{size?: number; level?: number; wobble?: number}> = ({size = 380, level = 0.72, wobble = 0}) => {
	const w = size;
	const h = size * 1.25;
	const top = h * (1 - level);
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible'}}>
			<defs>
				<clipPath id="glassClip">
					<path d={`M${w * 0.08},0 L${w * 0.92},0 L${w * 0.8},${h} L${w * 0.2},${h} Z`} />
				</clipPath>
				<linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#bfe6f2" />
					<stop offset="1" stopColor="#6fb8d3" />
				</linearGradient>
			</defs>
			<g clipPath="url(#glassClip)">
				<rect width={w} height={h} fill="rgba(255,255,255,0.35)" />
				<path
					d={`M0,${top + wobble} Q${w * 0.25},${top - 10 - wobble} ${w * 0.5},${top} T${w},${top - wobble} L${w},${h} L0,${h} Z`}
					fill="url(#water)"
				/>
				{[0.3, 0.55, 0.7, 0.42].map((x, i) => (
					<circle key={i} cx={w * x} cy={top + 60 + i * 55} r={5 + (i % 2) * 4} fill="rgba(255,255,255,0.7)" />
				))}
				<rect x={w * 0.2} y={0} width={w * 0.06} height={h} fill="rgba(255,255,255,0.55)" />
			</g>
			<path d={`M${w * 0.08},0 L${w * 0.92},0 L${w * 0.8},${h} L${w * 0.2},${h} Z`} fill="none" stroke="#2c3b44" strokeWidth={6} />
			<ellipse cx={w / 2} cy={0} rx={w * 0.42} ry={12} fill="none" stroke="#2c3b44" strokeWidth={5} />
		</svg>
	);
};

export const Droplet: React.FC<{size?: number}> = ({size = 140}) => (
	<svg width={size} height={size * 1.35} viewBox="0 0 100 135">
		<path d="M50,4 C70,40 92,62 92,88 C92,114 72,131 50,131 C28,131 8,114 8,88 C8,62 30,40 50,4 Z" fill="#5fb4d6" stroke="#1d3a48" strokeWidth={5} />
		<ellipse cx={34} cy={84} rx={8} ry={16} fill="rgba(255,255,255,0.7)" />
		<circle cx={42} cy={92} r={5} fill="#1d3a48" />
		<circle cx={64} cy={92} r={5} fill="#1d3a48" />
		<path d="M44,108 Q53,116 62,108" stroke="#1d3a48" strokeWidth={4} fill="none" strokeLinecap="round" />
	</svg>
);

export const Suitcase: React.FC<{size?: number}> = ({size = 90}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<rect x={36} y={8} width={28} height={16} rx={5} fill="none" stroke="#3a2a1a" strokeWidth={6} />
		<rect x={8} y={22} width={84} height={66} rx={10} fill="#b5532f" stroke="#3a2a1a" strokeWidth={5} />
		<rect x={8} y={48} width={84} height={8} fill="#e2b15a" />
	</svg>
);

// Relief-shaded desert map (Vox-like satellite feel) with city patch + roads.
export const DesertMap: React.FC<{city: [number, number]}> = ({city}) => (
	<AbsoluteFill>
		<svg width={W} height={H}>
			<filter id="relief" x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves={6} seed={11} result="n" />
				<feDiffuseLighting in="n" surfaceScale={32} lightingColor="#fff4dc" result="l">
					<feDistantLight azimuth={225} elevation={38} />
				</feDiffuseLighting>
				<feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1={1.05} k2={0} k3={0} k4={0} />
			</filter>
			<filter id="blob">
				<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={4} />
				<feDisplacementMap in="SourceGraphic" scale={120} />
			</filter>
			<filter id="blocks">
				<feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={1} seed={9} />
				<feColorMatrix values="0 0 0 0 0.93  0 0 0 0 0.91  0 0 0 0 0.87  0 0 0 9 -4.2" />
			</filter>
			<rect width={W} height={H} fill="#d6b27c" filter="url(#relief)" />
			<g filter="url(#blob)" opacity={0.85}>
				<ellipse cx={city[0]} cy={city[1]} rx={330} ry={390} fill="#cbbfa9" />
			</g>
			<g opacity={0.55} filter="url(#blob)">
				<ellipse cx={city[0]} cy={city[1]} rx={300} ry={350} fill="#fff" filter="url(#blocks)" />
			</g>
			{[
				'M-50,300 C200,380 300,420 430,430 S800,520 1150,480',
				'M430,430 C380,700 520,900 650,1060 S760,1500 820,2000',
				'M120,-40 C220,200 380,330 430,430',
				'M430,430 C620,330 860,250 1150,150',
				'M-60,1200 C200,1120 450,1100 650,1060 S1000,1000 1150,1050',
			].map((d, i) => (
				<g key={i}>
					<path d={d} stroke="rgba(90,70,40,0.35)" strokeWidth={14} fill="none" />
					<path d={d} stroke="#f7efe0" strokeWidth={7} fill="none" />
				</g>
			))}
		</svg>
	</AbsoluteFill>
);

export const Pump: React.FC<{spin: number; flow: number}> = ({spin, flow}) => (
	<svg width={760} height={620} viewBox="0 0 760 620">
		<rect x={40} y={520} width={680} height={40} rx={8} fill="#5d564c" />
		<path d="M520,330 L620,330 L620,90 L760,90" stroke="#8c99a3" strokeWidth={44} fill="none" />
		<path d="M520,330 L620,330 L620,90 L760,90" stroke="#6fc3e0" strokeWidth={18} fill="none" strokeDasharray="30 22" strokeDashoffset={-flow} />
		<rect x={70} y={220} width={380} height={300} rx={40} fill="#2f6f9e" stroke="#16324a" strokeWidth={8} />
		{Array.from({length: 9}, (_, i) => (
			<rect key={i} x={95 + i * 38} y={240} width={14} height={260} rx={6} fill="#245a82" />
		))}
		<rect x={440} y={280} width={100} height={110} rx={14} fill="#8c99a3" stroke="#16324a" strokeWidth={8} />
		<g transform={`translate(260,370) rotate(${spin})`}>
			<circle r={70} fill="#d9dde0" stroke="#16324a" strokeWidth={8} />
			{[0, 72, 144, 216, 288].map((a) => (
				<path key={a} d="M0,0 L60,-14 L60,14 Z" fill="#16324a" transform={`rotate(${a})`} />
			))}
			<circle r={12} fill="#e2b15a" />
		</g>
		<g transform="translate(560,180)">
			<circle r={52} fill="#f4f1ea" stroke="#16324a" strokeWidth={7} />
			<line x1={0} y1={0} x2={0} y2={-38} stroke="#c8283a" strokeWidth={6} transform={`rotate(${30 + Math.sin(spin / 20) * 12})`} />
		</g>
		<text x={260} y={180} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill="#16324a">
			POMPA
		</text>
	</svg>
);

export const Bucket: React.FC = () => (
	<svg width={150} height={140} viewBox="0 0 150 140">
		<path d="M20,40 Q75,-20 130,40" stroke="#4a3520" strokeWidth={6} fill="none" />
		<path d="M14,40 L136,40 L118,132 L32,132 Z" fill="#8a5a33" stroke="#3a2614" strokeWidth={6} />
		<rect x={18} y={64} width={114} height={10} fill="#3a2614" />
		<rect x={24} y={104} width={102} height={10} fill="#3a2614" />
	</svg>
);

export const Factory: React.FC = () => (
	<svg width={720} height={380} viewBox="0 0 720 380">
		<rect x={0} y={330} width={720} height={50} fill="#bfae8e" />
		<rect x={40} y={150} width={300} height={180} fill="#f2efe8" stroke="#3b3a36" strokeWidth={6} />
		{Array.from({length: 6}, (_, i) => (
			<rect key={i} x={62 + i * 46} y={190} width={28} height={40} fill="#6fb8d3" />
		))}
		<rect x={150} y={260} width={80} height={70} fill="#3b3a36" />
		<rect x={340} y={210} width={170} height={120} fill="#e3ded3" stroke="#3b3a36" strokeWidth={6} />
		<path d="M30,150 L190,90 L350,150 Z" fill="#2f6f9e" stroke="#3b3a36" strokeWidth={6} />
		{[540, 630].map((x) => (
			<g key={x}>
				<rect x={x - 40} y={120} width={80} height={210} rx={10} fill="#d4d9dc" stroke="#3b3a36" strokeWidth={6} />
				<ellipse cx={x} cy={120} rx={40} ry={14} fill="#eef1f2" stroke="#3b3a36" strokeWidth={6} />
			</g>
		))}
		<text x={190} y={135} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={22} fill="#fff">
			ZAMZAM
		</text>
	</svg>
);

export const Bottle: React.FC<{size?: number}> = ({size = 150}) => (
	<svg width={size} height={size * 1.3} viewBox="0 0 100 130">
		<rect x={38} y={4} width={24} height={14} rx={3} fill="#f4f4f4" stroke="#24506b" strokeWidth={3} />
		<path d="M22,26 Q22,16 34,16 L66,16 Q78,16 78,26 L88,40 L88,120 Q88,126 82,126 L18,126 Q12,126 12,120 L12,40 Z" fill="rgba(170,215,235,0.92)" stroke="#24506b" strokeWidth={4} />
		<path d="M62,20 Q84,20 84,40" stroke="#24506b" strokeWidth={6} fill="none" />
		<rect x={18} y={64} width={64} height={34} fill="#fff" />
		<text x={50} y={86} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={12} fill="#24506b">
			ZAMZAM
		</text>
		<rect x={20} y={30} width={6} height={86} fill="rgba(255,255,255,0.6)" />
	</svg>
);

export const Truck: React.FC<{size?: number}> = ({size = 150}) => (
	<svg width={size} height={size * 0.6} viewBox="0 0 150 90">
		<rect x={4} y={18} width={96} height={48} rx={22} fill="#e7ecef" stroke="#1d2a33" strokeWidth={4} />
		<path d="M100,30 L126,30 L144,50 L144,66 L100,66 Z" fill="#2f6f9e" stroke="#1d2a33" strokeWidth={4} />
		<rect x={112} y={36} width={16} height={12} fill="#bfe6f2" />
		{[28, 76, 124].map((x) => (
			<circle key={x} cx={x} cy={70} r={12} fill="#1d2a33" />
		))}
	</svg>
);

export const Galon: React.FC<{size?: number; tint?: string}> = ({size = 200, tint = '#f1ede4'}) => (
	<svg width={size} height={size * 1.55} viewBox="0 0 100 155">
		<ellipse cx={50} cy={150} rx={40} ry={5} fill="rgba(0,0,0,0.25)" />
		<path d="M10,22 Q10,10 50,10 Q90,10 90,22 L90,140 Q90,150 50,150 Q10,150 10,140 Z" fill={tint} stroke="#6b5b45" strokeWidth={3} />
		<ellipse cx={50} cy={20} rx={40} ry={10} fill="#e0d8c8" stroke="#6b5b45" strokeWidth={3} />
		<rect x={44} y={92} width={12} height={14} fill="#b8a98d" stroke="#6b5b45" strokeWidth={2} />
		<rect x={47} y={106} width={6} height={10} fill="#6b5b45" />
		<path d="M16,40 L16,130" stroke="rgba(255,255,255,0.8)" strokeWidth={5} />
		<rect x={10} y={56} width={80} height={6} fill="#c9a24b" />
	</svg>
);

export const Tank: React.FC<{level: number}> = ({level}) => (
	<svg width={760} height={720} viewBox="0 0 760 720">
		<defs>
			<linearGradient id="steel" x1="0" x2="1">
				<stop offset="0" stopColor="#9aa4ab" />
				<stop offset="0.35" stopColor="#e6eaec" />
				<stop offset="1" stopColor="#7d878e" />
			</linearGradient>
		</defs>
		<rect x={80} y={90} width={600} height={560} fill="url(#steel)" stroke="#2d363c" strokeWidth={8} />
		<ellipse cx={380} cy={90} rx={300} ry={60} fill="#dfe4e7" stroke="#2d363c" strokeWidth={8} />
		<ellipse cx={380} cy={650} rx={300} ry={60} fill="#7d878e" stroke="#2d363c" strokeWidth={8} />
		{/* cutaway window */}
		<rect x={250} y={170} width={260} height={440} fill="#24343d" stroke="#2d363c" strokeWidth={8} />
		<rect x={254} y={170 + 440 * (1 - level)} width={252} height={440 * level - 4} fill="#5fb4d6" />
		<path d={`M254,${170 + 440 * (1 - level)} h252`} stroke="#bfe6f2" strokeWidth={6} />
		{[0, 1, 2, 3].map((i) => (
			<line key={i} x1={80} x2={250} y1={200 + i * 120} y2={200 + i * 120} stroke="rgba(45,54,60,0.35)" strokeWidth={4} />
		))}
		{/* person for scale */}
		<g transform="translate(600,560)">
			<circle cx={0} cy={0} r={10} fill="#1b1712" />
			<rect x={-8} y={12} width={16} height={36} rx={6} fill="#1b1712" />
			<rect x={-8} y={46} width={6} height={30} fill="#1b1712" />
			<rect x={2} y={46} width={6} height={30} fill="#1b1712" />
		</g>
	</svg>
);

export const Check: React.FC<{p: number; size?: number; color?: string}> = ({p, size = 70, color = '#2e8b3a'}) => (
	<svg width={size} height={size} viewBox="0 0 70 70">
		<rect x={4} y={4} width={62} height={62} rx={6} fill="none" stroke="#3b2f22" strokeWidth={5} />
		<path d="M14,36 L30,52 L60,14" stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={80} strokeDashoffset={80 * (1 - p)} />
	</svg>
);
