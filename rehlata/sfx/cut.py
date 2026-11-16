"""Potong satu video SFX jadi WAV per efek.

  ffmpeg -i SUMBER -vn -ac 2 -ar 48000 -f f32le - | python3 cut.py OUTDIR "nama1@t0,nama2@t1,...,@akhir"

Tiap nama@t = efek mulai kira-kira di detik t (dari label di video). Batas
digeser ke titik paling sunyi di sekitar (+-0.12 s), hening di awal/akhir
dibuang, peak dinormalisasi ke -1 dBFS, fade 2 ms masuk / 20 ms keluar.
"""
import sys, os, numpy as np, wave
sr = 48000
out, spec = sys.argv[1], sys.argv[2]
a = np.frombuffer(sys.stdin.buffer.read(), np.float32).reshape(-1, 2)
env = np.abs(a).max(1)
items = [p.split("@") for p in spec.split(",")]
names = [n for n, _ in items]
ts = [float(t) if t else len(a) / sr for _, t in items]

def snap(t):
    if t <= 0 or t >= len(a) / sr: return int(t * sr)
    s, e = int((t - .12) * sr), int((t + .12) * sr)
    h = 240
    w = [env[i:i + h].max() for i in range(s, e - h, h // 4)]
    return s + int(np.argmin(w)) * (h // 4) + h // 2

b = [snap(t) for t in ts]
os.makedirs(out, exist_ok=True)
for i, name in enumerate(names[:-1]):
    if not name: continue
    s, e = b[i], min(b[i + 1], len(a))
    seg = env[s:e]; pk = seg.max()
    on = np.where(seg > pk * 10 ** (-40 / 20))[0][0]
    st = s + max(0, on - int(.002 * sr))
    tail = np.where(seg > max(pk * 10 ** (-60 / 20), 10 ** (-60 / 20)))[0][-1]
    en = min(e, s + tail + int(.03 * sr))
    x = a[st:en].astype(np.float64)
    x *= 10 ** (-1 / 20) / np.abs(x).max()
    n = len(x); fi = int(.002 * sr); fo = min(int(.02 * sr), n // 4)
    x[:fi] *= np.linspace(0, 1, fi)[:, None]; x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    w = wave.open(os.path.join(out, name + ".wav"), "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((x * 32767).astype("<i2").tobytes()); w.close()
    print("%-26s sumber %6.3fs  durasi %.3fs" % (name, st / sr, n / sr))
