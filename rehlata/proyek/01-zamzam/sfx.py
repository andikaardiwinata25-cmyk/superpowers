"""Synthesised sound-effects bed for Rehlata #01 (no samples needed) -> sfx.wav (48 kHz stereo)."""
import json, math
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 79.1
N = int(SR * DUR)
rng = np.random.default_rng(7)
W = json.load(open("words.json"))


def T(i):
    return W[i]["start"]


L = np.zeros(N); R = np.zeros(N)


def db(x):
    return 10 ** (x / 20)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos"); return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    sos = signal.butter(order, f, btype="low", fs=SR, output="sos"); return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    sos = signal.butter(order, f, btype="high", fs=SR, output="sos"); return signal.sosfilt(sos, x)


def noise(n):
    return rng.standard_normal(n)


def pink(n):
    w = noise(n); b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w) * 6


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))


def fade(x, fi=0.15, fo=0.25):
    n = len(x); a = int(fi * SR); b = int(fo * SR)
    e = np.ones(n)
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[-b:] *= np.linspace(1, 0, b)
    return x * e


def norm(x):
    m = np.max(np.abs(x)) or 1
    return x / m


def add(x, t, gain_db=0.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    x = x[: N - i] * db(gain_db)
    gl = math.cos((pan + 1) * math.pi / 4); gr = math.sin((pan + 1) * math.pi / 4)
    L[i:i + len(x)] += x * gl * 1.414; R[i:i + len(x)] += x * gr * 1.414


def add_st(xl, xr, t, gain_db=0.0):
    i = int(t * SR); n = min(len(xl), N - i)
    L[i:i + n] += xl[:n] * db(gain_db); R[i:i + n] += xr[:n] * db(gain_db)


def reverb(x, rt=1.2, wet=0.35, pre=0.012):
    n = int(rt * SR)
    ir = noise(n) * np.exp(-6.9 * np.arange(n) / n)
    ir = lp(ir, 6000); ir[: int(pre * SR)] = 0
    y = signal.fftconvolve(x, ir)[: len(x) + n] / np.sqrt(np.sum(ir ** 2)) * 0.25
    out = np.zeros(len(y)); out[: len(x)] += x * (1 - wet)
    return out + y * wet


def seg(a, b):
    return int((b - a) * SR)


# ------------------------------------------------------------------ one-shots
def whoosh(d=0.45, lo=300, hi=4000):
    n = int(d * SR); t = np.arange(n) / SR
    x = noise(n)
    out = np.zeros(n)
    blocks = 24
    for k in range(blocks):
        s, e = k * n // blocks, (k + 1) * n // blocks
        u = k / blocks
        f0 = lo + (hi - lo) * math.sin(math.pi * u) ** 1.5
        out[s:e] = bp(x[max(0, s - 2000):e], max(60, f0 * .6), min(20000, f0 * 1.6))[-(e - s):]
    e = np.sin(np.pi * t / d) ** 2
    return norm(out * e)


def pop(f=900):
    n = int(0.12 * SR); t = np.arange(n) / SR
    fr = f * (1 + 1.5 * np.exp(-t * 60))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 35)
    x += bp(noise(n), 2000, 8000) * np.exp(-t * 200) * .3
    return norm(x)


def tick():
    n = int(0.06 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) + np.sin(2 * np.pi * 3700 * t) * np.exp(-t * 120) * .5
    return norm(x)


def ding(f=880, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k) for m, a, k in ((1, 1, 3), (2.76, .4, 6), (5.4, .2, 9), (8.9, .1, 14)))
    return norm(x)


def plink(f0=None):
    f0 = f0 or rng.uniform(500, 1400)
    n = int(0.09 * SR); t = np.arange(n) / SR
    fr = f0 * (1 + 2.2 * t / .09)
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 55) * np.minimum(1, t * 900)
    return x


def drip():
    n = int(0.25 * SR); t = np.arange(n) / SR
    f0 = rng.uniform(900, 1500)
    fr = f0 * (1 + 1.8 * np.minimum(1, t / .04))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 28) * np.minimum(1, t * 2000)
    return x


def glass_clink(f=2800):
    n = int(0.9 * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * m * t + rng.uniform(0, 6)) * np.exp(-t * k)
            for m, a, k in ((1, 1, 6), (1.53, .7, 8), (2.31, .5, 11), (3.1, .3, 15)))
    x += hp(noise(n), 3000) * np.exp(-t * 300) * .5
    return norm(x)


def thunk(f=70):
    n = int(0.35 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t * (1 + .5 * np.exp(-t * 30))) * np.exp(-t * 14)
    x += lp(noise(n), 900) * np.exp(-t * 40) * .6
    return norm(x)


def hiss(d=0.4):
    n = int(d * SR); t = np.arange(n) / SR
    return norm(hp(noise(n), 2500) * np.exp(-t * 6) * np.minimum(1, t * 60))


def creak(d=0.5, f=180):
    n = int(d * SR); t = np.arange(n) / SR
    fr = f * (1 + .25 * np.sin(2 * np.pi * 3 * t)) * (1 + .1 * noise(n).cumsum() / SR)
    ph = np.cumsum(fr) / SR
    x = signal.sawtooth(2 * np.pi * ph) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t) ** 2)
    x = bp(x, 300, 2400) * np.sin(np.pi * t / d)
    return norm(x)


def chime_riser(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(14):
        tt = k * d / 18; f = 1200 * 2 ** (k / 7)
        i = int(tt * SR); m = min(n - i, int(0.8 * SR)); u = np.arange(m) / SR
        out[i:i + m] += np.sin(2 * np.pi * f * u) * np.exp(-u * 6) * (0.4 + k / 20)
    out += hp(noise(n), 5000) * (t / d) ** 2 * .3
    return norm(out)


# ------------------------------------------------------------------ beds
def room(d, lo=40, hi=400, mod=0.0):
    n = int(d * SR); x = lp(hp(pink(n), lo), hi)
    if mod:
        t = np.arange(n) / SR; x *= 1 + mod * np.sin(2 * np.pi * .13 * t)
    return fade(norm(x))


def wind(d):
    n = int(d * SR); t = np.arange(n) / SR
    x = pink(n)
    gust = 0.55 + 0.45 * np.sin(2 * np.pi * .23 * t + 1) * np.sin(2 * np.pi * .07 * t)
    a = bp(x, 200, 900) * gust; b = bp(noise(n), 1500, 5000) * gust ** 2 * .15
    return fade(norm(a + b), .3, .3)


def crowd(d, voices=26):
    n = int(d * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for v in range(voices):
        f = rng.uniform(320, 900)
        x = bp(noise(n), f * .7, f * 2.2)
        sy = rng.uniform(3, 6)
        en = np.clip(np.sin(2 * np.pi * sy * t + rng.uniform(0, 6)) + rng.uniform(-.3, .4), 0, None)
        en *= np.clip(np.sin(2 * np.pi * rng.uniform(.1, .3) * t + rng.uniform(0, 6)) + .3, 0, None)
        out += x * lp(en, 20)
    steps = np.zeros(n)
    for k in range(int(d * 9)):
        i = rng.integers(0, n - 4000); m = 2500; u = np.arange(m) / SR
        steps[i:i + m] += lp(noise(m), 700) * np.exp(-u * 70) * .6
    return fade(norm(reverb(out, 1.8, .45)[:n] + steps * .4), .3, .3)


def motor(d, f=50, spinup=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    k = np.minimum(1, t / spinup)
    fr = f * (0.4 + 0.6 * k)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = sum(a * np.sin(m * ph) for m, a in ((1, 1), (2, .6), (3, .35), (6, .2), (12, .08)))
    x += bp(pink(n), 200, 1200) * .25 * k + bp(noise(n), 2000, 6000) * .03
    x *= (0.3 + 0.7 * k) * (1 + .03 * np.sin(2 * np.pi * 7 * t))
    return fade(norm(x), .05, .2)


def flow(d, lo=300, hi=2200, gurgle=True):
    n = int(d * SR); t = np.arange(n) / SR
    x = bp(pink(n), lo, hi)
    if gurgle:
        x *= 0.7 + 0.3 * lp(np.abs(noise(n)), 12) * 3
        for k in range(int(d * 14)):
            add_i = rng.integers(0, n - 5000); p = plink(rng.uniform(300, 800)) * .35
            x[add_i:add_i + len(p)] += p
    return fade(norm(x))


def bubbles(d, rate=7):
    n = int(d * SR); out = np.zeros(n)
    for k in range(int(d * rate)):
        i = rng.integers(0, n - 6000); p = plink(rng.uniform(700, 1700)) * rng.uniform(.3, 1)
        out[i:i + len(p)] += p
    return fade(norm(out) * .9 + norm(bp(pink(n), 2000, 6000)) * .05)


def conveyor(d):
    n = int(d * SR); t = np.arange(n) / SR
    x = lp(pink(n), 300) * .7
    for k in range(int(d * 11)):
        i = int(k * SR / 11 + rng.integers(0, 800)); m = 1200; u = np.arange(m) / SR
        if i + m < n:
            x[i:i + m] += bp(noise(m), 1500, 4500) * np.exp(-u * 160) * .5
    x += sum(np.sin(2 * np.pi * f * t) * a for f, a in ((120, .15), (240, .06)))
    return fade(norm(x))


def engine(d, a=0.0, b=None):
    """Diesel: low pulse train whose rate rises while the truck accelerates (a..b seconds into the clip)."""
    n = int(d * SR); t = np.arange(n) / SR
    b = b or d
    k = np.clip((t - a) / (b - a), 0, 1)
    rpm = 14 + 22 * (k ** .7)
    ph = np.cumsum(rpm) / SR
    pulses = (np.sin(2 * np.pi * ph) > 0.6).astype(float)
    x = lp(pulses, 400) * 1.0 + lp(pink(n), 250) * .6
    x += bp(noise(n), 800, 2500) * (0.05 + .1 * k)
    tire = bp(pink(n), 400, 1500) * k * .25
    return fade(norm(x + tire), .3, .4)


# ------------------------------------------------------------------ timeline
S = dict(s0=0.0, s1=T(13), s2=T(17), s3=T(32), s4=T(37), s5=T(45), s6=T(64), s7=T(74), s8=T(83), s9=T(91),
         s10=T(103), s11=T(127), s12=T(149), s13=T(160) - .4, end=DUR)
order = list(S.keys())

# scene beds
add(room(S["s1"], 30, 300), 0, -34)
add(reverb(bubbles(S["s1"] - .3, 6), .6, .3)[: int((S["s1"] - .3) * SR)], .3, -27)
add(wind(S["s2"] - S["s1"] + .3), S["s1"], -30)
add(crowd(S["s3"] - S["s2"] + .2), S["s2"], -26)
rum = lp(pink(int(3.8 * SR)), 140); rum = fade(norm(rum) * np.linspace(.3, 1, len(rum)), .6, .5)
add(rum, T(28) - .2, -24)
for k in range(5):
    add(reverb(drip(), 1.6, .55), T(28) + .8 + k * .55 + rng.uniform(0, .2), -24, .3)
add(wind(S["s4"] - S["s3"] + .2), S["s3"], -30)
add(creak(.7, 170), S["s3"] + .25, -26, -.1); add(creak(.6, 200), S["s3"] + 1.2, -27, .1); add(creak(.5, 190), S["s3"] + 2.0, -28)
for k in range(6):
    add(drip(), S["s3"] + 1.3 + k * .22, -28, .2)
add(reverb(motor(S["s5"] - S["s4"] + .2, 50, 1.0), .9, .3)[: int((S["s5"] - S["s4"] + .2) * SR)], S["s4"], -22)
add(flow(S["s5"] - S["s4"]), S["s4"] + .3, -30, .3)
add(wind(S["s6"] - S["s5"] + .2), S["s5"], -32)
add(flow(T(58) - T(53) + .6, 250, 1500), T(53), -27)
add(reverb(room(S["s7"] - S["s6"] + .2, 60, 500), .8, .3)[: int((S["s7"] - S["s6"] + .2) * SR)], S["s6"], -30)
add(flow(S["s7"] - S["s6"], 600, 3500), S["s6"] + .2, -29)
add(room(S["s8"] - S["s7"] + .2, 50, 300), S["s7"], -36)
add(reverb(glass_clink(2900), .7, .3), 36.55, -24, -.2); add(reverb(glass_clink(3300), .7, .3), 38.65, -25, -.2)
add(reverb(conveyor(S["s9"] - S["s8"] + .2), .7, .25)[: int((S["s9"] - S["s8"] + .2) * SR)], S["s8"], -25)
for k in range(8):  # capper presses, synced to the animation k=|sin(2.4t)| peaks
    tp = (math.pi / 2 + k * math.pi) / 2.4
    if S["s8"] < tp < S["s9"]:
        add(hiss(.35), tp - .3, -30, .3); add(thunk(90), tp, -24, .3)
add(wind(S["s10"] - S["s9"] + .2), S["s9"], -31)
add(engine(S["s10"] - S["s9"] + .1, 46.3 - S["s9"], 49.9 - S["s9"]), S["s9"], -23)
hall = reverb(crowd(S["s11"] - S["s10"] + .2, 14) * .5 + room(S["s11"] - S["s10"] + .2, 40, 200) * .6, 2.2, .5)
add(hall[: int((S["s11"] - S["s10"] + .2) * SR)], S["s10"], -30)
add(reverb(flow(3.0, 500, 2800), 1.6, .4), S["s10"] + .4, -30, -.3)
add(reverb(room(S["s12"] - S["s11"], 80, 600), 1.0, .3)[: int((S["s12"] - S["s11"]) * SR)], S["s11"], -38)
add(wind(S["s13"] - S["s12"] + .2), S["s12"], -32)
add(flow(S["s13"] - S["s12"], 250, 1500), S["s12"], -31)
add(reverb(chime_riser(1.5), 2.0, .5), S["s13"], -24)
add(reverb(room(S["end"] - S["s13"], 60, 400), 1.5, .4)[: int((S["end"] - S["s13"]) * SR)], S["s13"], -36)

# whooshes on every scene change and in-scene camera cut
cuts = [S[k] for k in order[1:-1]] + [T(7) - .05, T(25), T(28), T(42), T(52), T(59) - .1, T(69) - .05, T(79) - .05,
                                      T(88) - .3, T(97) - .1, T(113) - .1, T(121) - .1, T(139) - .1]
for c in cuts:
    add(whoosh(.42, 250, 3500), c - .25, -24, rng.uniform(-.3, .3))

# pops for titles/labels/badges
pops = [0.1, T(7), T(13) + .1, T(24), T(26), T(28), T(30), T(32), T(36), T(37), T(39), T(45), T(57), T(59), T(66),
        T(69), T(72), T(78), T(79), T(88), T(95), T(98), T(108), T(115), T(119), T(125), T(153), T(160), T(161),
        T(162), T(169)]
for p_ in pops:
    add(pop(rng.uniform(700, 1100)), p_, -24, rng.uniform(-.2, .2))
for tck in (32.97, 36.7, 40.66, 47.66):
    add(tick(), tck, -24, -.5)
add(ding(1320, 1.0), T(79) + .05, -26)
add(ding(990, 1.2), T(57) + .05, -28)
for i in (132, 136, 138, 139, 141, 147):
    add(ding(880 * 2 ** (rng.integers(0, 5) / 12), .8), T(i), -27)
add(ding(1760, 1.5), T(164), -26)

mix = np.stack([L, R], 1)
mix = hp(mix.T, 30).T
peak = np.max(np.abs(mix)); mix = mix / peak * db(-3)
wavfile.write("sfx.wav", SR, (mix * 32767).astype(np.int16))
print("sfx.wav", DUR, "s, peak normalised")
