"""Elegant sound design synthesised from scratch (no samples, royalty free).
usage: python3 audio.py OUTDIR
Writes A.wav (amankan seat mu) and B.wav (Bintang 5)."""
import sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def svf_bandpass(x, fc, q=0.9):
    """Time-varying state-variable band/low-pass (fc = array of Hz)."""
    lp = bp = 0.0
    out_bp = np.empty_like(x); out_lp = np.empty_like(x)
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    for i in range(len(x)):
        hp = x[i] - lp - q * bp
        bp += f[i] * hp
        lp += f[i] * bp
        out_bp[i] = bp; out_lp[i] = lp
    return out_bp, out_lp


def whoosh(d, f0, f1, peak=0.65, curve=2.0):
    """Air whoosh: noise through sweeping band-pass, swelling to `peak` (0..1 of length)."""
    t = t_axis(d); n = len(t)
    noise = rng.standard_normal(n)
    p = t / d
    fc = f0 * (f1 / f0) ** p
    bp, lp = svf_bandpass(noise, fc, 0.6)
    env = np.where(p < peak, (p / peak) ** curve, ((1 - p) / (1 - peak)) ** 1.6)
    sig = (0.7 * bp + 0.3 * lp) * env
    pan = np.clip(-0.6 + 1.2 * p, -1, 1)  # moves left -> right
    return stereo(sig / (np.abs(sig).max() + 1e-9), pan)


def stereo(sig, pan=0.0):
    pan = np.broadcast_to(pan, sig.shape)
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([sig * l, sig * r], 1)


def bell(freq, d=2.4, bright=1.0):
    """Soft glass/celesta bell."""
    t = t_axis(d)
    parts = [(1.0, 1.0, 1.0), (2.0, 0.35, 1.6), (3.01, 0.18 * bright, 2.4), (4.16, 0.08 * bright, 3.5), (5.43, 0.04 * bright, 5)]
    s = sum(a * np.sin(2 * np.pi * freq * m * t + m) * np.exp(-t * 2.2 * k) for m, a, k in parts)
    att = np.clip(t / 0.004, 0, 1)
    return s * att


def sub(d=1.6, f=48):
    t = t_axis(d)
    fr = f * (1 + 0.6 * np.exp(-t * 9))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * np.exp(-t * 3.0) * np.clip(t / 0.01, 0, 1)


def shimmer(d=1.2):
    """Light-sweep sparkle: high airy noise + a few tiny glints."""
    t = t_axis(d); n = len(t); p = t / d
    noise = rng.standard_normal(n)
    bp, _ = svf_bandpass(noise, 6000 + 5000 * p, 1.2)
    env = np.sin(np.pi * p) ** 2
    air = bp * env * 0.25
    out = stereo(air / (np.abs(air).max() + 1e-9) * 0.35, -0.7 + 1.4 * p)
    for k, (tt, f) in enumerate([(0.15, 3520), (0.32, 4186), (0.5, 4699), (0.66, 5274)]):
        g = bell(f, 0.9, 0.3) * 0.18
        add(out, stereo(g, -0.6 + 0.4 * k), tt)
    return out


def add(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if sig.ndim == 1:
        sig = stereo(sig)
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def reverb(x, secs=2.6, decay=0.55, wet=0.32):
    n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros((len(x) + n, 2))
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / decay)
        # darken the tail
        spec = np.fft.rfft(ir); fr = np.fft.rfftfreq(n, 1 / SR)
        ir = np.fft.irfft(spec / (1 + (fr / 5000) ** 2), n)
        ir /= np.sqrt((ir ** 2).sum())
        L = len(x) + n
        N = 1 << (L - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x[:, ch], N) * np.fft.rfft(ir, N), N)[:L]
        out[:, ch] = y * wet
    out[: len(x)] += x
    return out


def chord(buf, at, notes, spread=0.07, gain=0.22):
    for k, f in enumerate(notes):
        add(buf, stereo(bell(f), (-0.4 + 0.8 * k / max(1, len(notes) - 1))), at + k * spread, gain)


def master(buf, total):
    buf = reverb(buf)[: int(total * SR)]
    fade = int(0.35 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)[:, None]
    buf = np.tanh(buf * 1.1) / np.tanh(1.1)          # gentle glue
    return buf / np.abs(buf).max() * 10 ** (-1.0 / 20)  # peak -1 dB


def write(path, buf):
    data = (np.clip(buf, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


A5, Cs6, E6, Fs6, A6, B6, Cs7, E7 = 880.0, 1108.7, 1318.5, 1480.0, 1760.0, 1975.5, 2217.5, 2637.0
TAIL = 0.8


def scene_a(D=4.5):
    total = D + TAIL
    b = np.zeros((int((total + 1) * SR), 2))
    add(b, whoosh(1.0, 300, 4200, 0.7), 0.0, 0.55)       # entrance air
    add(b, sub(), 0.62, 0.45)                              # soft weight when 'seat mu' lands
    chord(b, 0.6, [A5, E6, A6, Cs7], 0.065, 0.2)           # elegant chime
    add(b, shimmer(1.15), 1.5, 0.9)                        # light sweep
    add(b, whoosh(0.95, 5000, 500, 0.62, 1.4), D - 1.1, 0.5)  # exit air
    chord(b, D - 0.85, [E7, B6, Fs6], 0.08, 0.08)         # tiny descending sparkle
    return master(b, total)


def scene_b(D=5.0):
    total = D + TAIL
    b = np.zeros((int((total + 1) * SR), 2))
    add(b, whoosh(0.9, 400, 4800, 0.7), 0.0, 0.45)
    for i, f in enumerate([A5, Cs6, E6, Fs6, A6]):         # one glint per star
        add(b, stereo(bell(f * 2, 1.0, 0.4), -0.6 + 0.3 * i), 0.16 + i * 0.09, 0.11)
    add(b, sub(), 0.6, 0.45)
    chord(b, 0.62, [A5, E6, A6, Cs7], 0.065, 0.2)
    chord(b, 1.0, [E7], 0, 0.06)                          # 'Hotel Mekkah' touch
    add(b, shimmer(1.25), 1.7, 0.9)
    add(b, whoosh(1.0, 5000, 500, 0.62, 1.4), D - 1.2, 0.5)
    chord(b, D - 0.9, [E7, B6, Fs6], 0.08, 0.08)
    return master(b, total)


if __name__ == '__main__':
    out = sys.argv[1]
    write(f'{out}/A.wav', scene_a())
    write(f'{out}/B.wav', scene_b())
    print('ok')
