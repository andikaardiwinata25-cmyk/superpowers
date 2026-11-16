"""Potong video SFX jadi file WAV per efek. Dipakai sekali untuk rehlata/sfx/ui."""
import sys, numpy as np, wave
sr = 48000
a = np.frombuffer(sys.stdin.buffer.read(), np.float32).reshape(-1, 2)
# batas label "UI n" di video (detik), dideteksi dari perubahan teks label
b = [0, 0.7, 1.4, 1.933, 2.767, 3.4, 4.267, 5.2, 5.667, 6.7, 7.7, 8.2, 9.1, 9.733, 10.7, len(a) / sr]
env = np.abs(a).max(1)
for i in range(15):
    s, e = int(b[i] * sr), min(int(b[i + 1] * sr), len(a))
    seg = env[s:e]
    pk = seg.max()
    # onset: 40 dB di bawah peak; 24 dB untuk klip yang membawa sisa ekor efek sebelumnya
    thr = -24 if i + 1 in (2, 8, 11) else -40
    on = np.where(seg > pk * 10 ** (thr / 20))[0][0]
    # mundur ke titik hening terdekat (maks 15 ms) supaya transien tak terpotong
    k = on
    while k > 0 and on - k < int(.015 * sr) and seg[k - 1] > pk * 10 ** (-50 / 20): k -= 1
    st = s + max(0, k - int(.002 * sr))
    tail = np.where(seg > 10 ** (-50 / 20))[0][-1]
    en = min(e, s + tail + int(.03 * sr))
    x = a[st:en].astype(np.float64)
    x *= 10 ** (-1 / 20) / np.abs(x).max()                      # normalisasi peak -1 dBFS
    n = len(x); fi = int(.002 * sr); fo = min(int(.02 * sr), n // 4)
    x[:fi] *= np.linspace(0, 1, fi)[:, None]; x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    w = wave.open('ui/ui-%02d.wav' % (i + 1), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((x * 32767).astype('<i2').tobytes()); w.close()
    print('ui-%02d  sumber %.3fs  durasi %.3fs' % (i + 1, st / sr, n / sr))
