"""Sound-effect track for the ad, timed from ads-scenes.json (synthesised, royalty free).
usage: python3 ads_audio.py OUT.wav"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import SR, whoosh, bell, sub, shimmer, stereo, add, reverb, write

HERE = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(open(os.path.join(HERE, 'ads-scenes.json')))
N = lambda midi: 440.0 * 2 ** ((midi - 69) / 12)
CHORDS = [  # A, F#m, D, E (A major) - voiced high & airy
    [N(81), N(88), N(93), N(97)],
    [N(78), N(85), N(90), N(93)],
    [N(74), N(81), N(86), N(90)],
    [N(76), N(83), N(88), N(92)],
]

total = cfg['duration']
b = np.zeros((int((total + 3) * SR), 2))


def chord(at, notes, spread=0.06, gain=0.18):
    for k, f in enumerate(notes):
        add(b, stereo(bell(f), -0.4 + 0.8 * k / max(1, len(notes) - 1)), at + k * spread, gain)


for sc in cfg['scenes']:
    starts = [l['at'] for l in sc['lines']] + ([sc['stars']['at']] if 'stars' in sc else [])
    start = min(starts)
    add(b, whoosh(0.85, 350, 4500, 0.72), max(0, start - 0.45), 0.32)        # air swell into the title
    bolds = [l for l in sc['lines'] if l['style'] == 'bold']
    for l in sc['lines']:
        if l['style'] == 'serif':
            add(b, stereo(bell(N(100), 1.2, 0.3), 0.3), l['at'] + 0.12, 0.05)  # tiny glint
    for i, l in enumerate(bolds):
        if i == 0:
            add(b, sub(1.4, 46), l['at'] + 0.18, 0.32)                         # soft weight
            chord(l['at'] + 0.15, CHORDS[sc['chord'] % 4])
            add(b, shimmer(1.0), l['at'] + 0.85, 0.55)                         # light sweep
        else:
            notes = CHORDS[sc['chord'] % 4]
            add(b, stereo(bell(notes[i % len(notes)] * 2, 1.0, 0.35), -0.5 + 0.25 * i), l['at'] + 0.15, 0.09)
    if 'stars' in sc:
        for i, f in enumerate([N(81), N(85), N(88), N(90), N(93)]):
            add(b, stereo(bell(f * 2, 1.0, 0.4), -0.6 + 0.3 * i), sc['stars']['at'] + 0.12 + i * 0.08, 0.09)
    if sc['end'] < total - 0.3:
        add(b, whoosh(0.8, 5000, 600, 0.6, 1.4), sc['end'] - 0.85, 0.2)       # soft exit air
    else:
        add(b, whoosh(0.8, 5000, 600, 0.6, 1.4), sc['end'] - 0.95, 0.2)
        chord(sc['end'] - 0.8, [N(100), N(95), N(90)], 0.08, 0.06)

b = reverb(b, wet=0.3)[: int(total * SR)]
fade = int(0.3 * SR); b[-fade:] *= np.linspace(1, 0, fade)[:, None]
b = np.tanh(b * 1.1) / np.tanh(1.1)
b = b / np.abs(b).max() * 10 ** (-1 / 20)
write(sys.argv[1], b)
print('sfx ok', total)
