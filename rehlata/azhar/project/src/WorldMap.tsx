// Vox-style animated map: teal sea, cut-out paper land, keyframed camera
// (center + zoom), great-circle routes, highlighted countries and labels.
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {geoInterpolate, geoMercator, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-50m.json';
import {Dot, H, Label, Pt, Route, W, ramp} from './kit';

export type Key = {t: number; lon: number; lat: number; scale: number; ease?: (x: number) => number};
export type LL = [number, number];

const countries = (feature(world as any, (world as any).objects.countries) as any).features as any[];

const cameraAt = (keys: Key[], t: number) => {
	if (t <= keys[0].t) return keys[0];
	for (let i = 1; i < keys.length; i++) {
		const a = keys[i - 1];
		const b = keys[i];
		if (t <= b.t) {
			const u = (b.ease ?? Easing.inOut(Easing.cubic))((t - a.t) / (b.t - a.t));
			return {
				t,
				lon: a.lon + (b.lon - a.lon) * u,
				lat: a.lat + (b.lat - a.lat) * u,
				scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * u),
			};
		}
	}
	return keys[keys.length - 1];
};

export const WorldMap: React.FC<{
	t: number;
	keys: Key[];
	highlight?: {ids: string[]; at: number; color: string}[];
	routes?: {from: LL; to: LL; a: number; b: number; color?: string}[];
	pins?: {ll: LL; at: number; color?: string}[];
	labels?: {ll: LL; at: number; text: string; dx?: number; dy?: number; size?: number; bg?: string; rot?: number}[];
}> = ({t, keys, highlight = [], routes = [], pins = [], labels = []}) => {
	const cam = cameraAt(keys, t);
	const proj = geoMercator().center([cam.lon, cam.lat]).scale(cam.scale).translate([W / 2, H * 0.4]);
	const path = geoPath(proj);
	const fills = useMemo(() => new Map<string, {at: number; color: string}>(), []);
	fills.clear();
	highlight.forEach((h) => h.ids.forEach((id) => fills.set(id, h)));
	const P = (ll: LL) => proj(ll) as [number, number];
	const grid = Math.max(6, 22 - Math.log2(cam.scale) * 1.4);
	return (
		<AbsoluteFill style={{background: '#2b7c86', overflow: 'hidden'}}>
			{/* sea texture */}
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<filter id="sea">
					<feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves={3} seed={5} />
					<feColorMatrix values="0 0 0 0 0.05  0 0 0 0 0.25  0 0 0 0 0.3  0 0 0 0.9 -0.2" />
				</filter>
				<rect width={W} height={H} filter="url(#sea)" opacity={0.5} />
			</svg>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<defs>
					<filter id="landShadow" x="-10%" y="-10%" width="120%" height="120%">
						<feDropShadow dx={0} dy={8} stdDeviation={6} floodColor="#0b2f33" floodOpacity={0.55} />
					</filter>
					<pattern id="dots" width={grid} height={grid} patternUnits="userSpaceOnUse">
						<circle cx={1} cy={1} r={1} fill="rgba(255,255,255,0.12)" />
					</pattern>
				</defs>
				<rect width={W} height={H} fill="url(#dots)" />
				<g filter="url(#landShadow)">
					{countries.map((c) => {
						const h = fills.get(String(c.id));
						const p = h ? ramp(t, h.at, h.at + 0.35) : 0;
						return (
							<path
								key={c.id + c.properties.name}
								d={path(c) ?? ''}
								fill={p > 0 ? mix('#efe3c8', h!.color, p) : '#efe3c8'}
								stroke="#c9b48f"
								strokeWidth={1.2}
							/>
						);
					})}
				</g>
			</svg>
			{routes.map((r, i) => {
				const gi = geoInterpolate(r.from, r.to);
				const pts: Pt[] = Array.from({length: 61}, (_, k) => P(gi(k / 60) as LL));
				return <Route key={i} id={`route${i}`} pts={pts} prog={ramp(t, r.a, r.b, Easing.inOut(Easing.quad))} color={r.color ?? '#fff'} width={7} dash="16 12" />;
			})}
			{routes.map((r, i) => {
				const p = ramp(t, r.a, r.b, Easing.inOut(Easing.quad));
				if (p <= 0 || p >= 1) return null;
				const gi = geoInterpolate(r.from, r.to);
				const [x, y] = P(gi(p) as LL);
				const [x2, y2] = P(gi(Math.min(1, p + 0.01)) as LL);
				const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
				return (
					<div key={`pl${i}`} style={{position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, transform: `rotate(${ang + 90}deg)`, fontFamily: 'DejaVu Sans', fontSize: 52, lineHeight: '60px', textAlign: 'center', color: '#fff', textShadow: '0 4px 6px rgba(0,0,0,0.5)'}}>
						✈
					</div>
				);
			})}
			{pins.map((p, i) => {
				const [x, y] = P(p.ll);
				return <Dot key={i} t={t} at={p.at} x={x} y={y} color={p.color} />;
			})}
			{labels.map((l, i) => {
				const [x, y] = P(l.ll);
				return (
					<Label key={i} t={t} at={l.at} x={x + (l.dx ?? 0)} y={y + (l.dy ?? -70)} size={l.size ?? 50} bg={l.bg} rot={l.rot ?? -2}>
						{l.text}
					</Label>
				);
			})}
		</AbsoluteFill>
	);
};

const mix = (a: string, b: string, p: number) => {
	const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
	const A = h(a);
	const B = h(b);
	return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`;
};

export const lerp = (t: number, a: number, b: number, from: number, to: number) =>
	interpolate(t, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
