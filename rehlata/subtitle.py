#!/usr/bin/env python3
"""Rehlata subtitle tool.

Step 1 - transcribe voice-over to an editable word list:
    python3 rehlata/subtitle.py transcribe INPUT.mp4 -o words.json

Step 2 - (optional) fix typos in words.json, mark keywords with "key": true.

Step 3 - burn subtitles in Rehlata style (Montserrat, small, white,
keywords yellow, word-by-word reveal):
    python3 rehlata/subtitle.py render INPUT.mp4 words.json -o OUTPUT.mp4 \
        [--keywords "drone,betina,SUTET"]

Shortcut (transcribe + render in one go):
    python3 rehlata/subtitle.py auto INPUT.mp4 -o OUTPUT.mp4 [--keywords ...]
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

MODEL_DIR = os.environ.get("REHLATA_WHISPER", "/opt/rehlata/whisper-small")

# --- Style (see rehlata/STYLE.md) -----------------------------------------
FONT = "Montserrat"
FONT_SIZE_RATIO = 0.0235   # of video height -> ~30px @1280, ~45px @1920
CENTER_FROM_TOP = 0.66     # vertical position of subtitle line
MAX_WORDS = 4
MAX_CHARS = 22
GAP_BREAK = 0.35           # seconds of silence that forces a new chunk
WHITE = "&H00FFFFFF"
YELLOW = "&H0033C8FF"      # ASS is BGR: FFC833 -> warm gold
DIM = "&H40B4B4B4"         # not-yet-spoken words: grey, slightly transparent
OUTLINE = "&H90000000"


def probe_size(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split(",")[:2]
    return int(w), int(h)


def transcribe(path, language="id"):
    import numpy as np
    from faster_whisper import WhisperModel

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000",
         "-f", "s16le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    model = WhisperModel(MODEL_DIR, device="cpu", compute_type="int8",
                         cpu_threads=os.cpu_count() or 4)
    segs, _ = model.transcribe(audio, language=language,
                               word_timestamps=True, vad_filter=True)
    words = []
    for s in segs:
        for w in s.words:
            t = w.word.strip()
            if t:
                words.append({"text": t, "start": round(w.start, 3),
                              "end": round(w.end, 3), "key": False})
    return words


def chunk(words):
    chunks, cur = [], []
    for i, w in enumerate(words):
        if cur:
            gap = w["start"] - cur[-1]["end"]
            chars = sum(len(x["text"]) + 1 for x in cur) + len(w["text"])
            if len(cur) >= MAX_WORDS or chars > MAX_CHARS or gap > GAP_BREAK:
                chunks.append(cur)
                cur = []
        cur.append(w)
        if re.search(r"[.,!?;:…]$", w["text"]):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


def ts(t):
    t = max(t, 0)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def esc(t):
    return t.replace("\\", "\\\\").replace("{", "(").replace("}", ")")


def build_ass(words, w, h, keywords):
    kw = {k.strip().lower() for k in keywords if k.strip()}
    for x in words:
        bare = re.sub(r"[^\w-]", "", x["text"]).lower()
        if bare in kw:
            x["key"] = True
    size = round(h * FONT_SIZE_RATIO)
    margin_v = round(h * (1 - CENTER_FROM_TOP) - size / 2)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Rehlata,{FONT},{size},{WHITE},{WHITE},{OUTLINE},&H80000000,-1,0,0,0,100,100,0,0,1,{max(1, round(size*0.05))},{max(1, round(size*0.06))},2,{round(w*0.15)},{round(w*0.15)},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    chunks = chunk(words)
    for ci, c in enumerate(chunks):
        c_end = c[-1]["end"] + 0.15
        if ci + 1 < len(chunks):
            c_end = min(c_end, chunks[ci + 1][0]["start"])
        for i, cw in enumerate(c):
            start = cw["start"] if i else c[0]["start"]
            end = c[i + 1]["start"] if i + 1 < len(c) else c_end
            if end <= start:
                continue
            parts = []
            for j, x in enumerate(c):
                col = DIM if j > i else (YELLOW if x["key"] else WHITE)
                parts.append(f"{{\\c{col[:2]}{col[4:]}&\\1a&H{col[2:4]}&}}{esc(x['text'])}")
            lines.append(f"Dialogue: 0,{ts(start)},{ts(end)},Rehlata,,0,0,0,,{' '.join(parts)}")
    return head + "\n".join(lines) + "\n"


def render(video, words, out, keywords):
    w, h = probe_size(video)
    ass = build_ass(words, w, h, keywords)
    with tempfile.NamedTemporaryFile("w", suffix=".ass", delete=False) as f:
        f.write(ass)
        ass_path = f.name
    vf = f"subtitles={ass_path}:fontsdir=/usr/local/share/fonts/montserrat"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", vf,
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-c:a", "copy", out], check=True)
    os.unlink(ass_path)


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("transcribe")
    t.add_argument("video")
    t.add_argument("-o", "--out", default="words.json")
    t.add_argument("--lang", default="id")
    r = sub.add_parser("render")
    r.add_argument("video")
    r.add_argument("words")
    r.add_argument("-o", "--out", required=True)
    r.add_argument("--keywords", default="")
    a = sub.add_parser("auto")
    a.add_argument("video")
    a.add_argument("-o", "--out", required=True)
    a.add_argument("--keywords", default="")
    a.add_argument("--lang", default="id")
    args = p.parse_args()

    if args.cmd == "transcribe":
        words = transcribe(args.video, args.lang)
        with open(args.out, "w") as f:
            json.dump(words, f, ensure_ascii=False, indent=1)
        print(" ".join(x["text"] for x in words))
        print(f"\n{len(words)} words -> {args.out}", file=sys.stderr)
    elif args.cmd == "render":
        with open(args.words) as f:
            words = json.load(f)
        render(args.video, words, args.out, args.keywords.split(","))
        print(args.out)
    else:
        words = transcribe(args.video, args.lang)
        render(args.video, words, args.out, args.keywords.split(","))
        print(args.out)


if __name__ == "__main__":
    main()
