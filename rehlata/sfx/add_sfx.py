#!/usr/bin/env python3
"""Tempel sound effect dari bank Rehlata ke video.

  python3 rehlata/sfx/add_sfx.py IN.mp4 OUT.mp4 ui-03@1.2 ui-14@4.8:-3

Format tiap SFX: NAMA@DETIK[:GAIN_dB]. NAMA = file di rehlata/sfx/ui atau rehlata/sfx/fx (tanpa .wav)
atau path WAV/MP3 lain. Gain default -6 dB.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def has_audio(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                          "stream=index", "-of", "json", path], capture_output=True, text=True).stdout
    return bool(json.loads(out or "{}").get("streams"))


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    src, dst, specs = sys.argv[1], sys.argv[2], sys.argv[3:]
    inputs, chains, labels = ["-i", src], [], []
    for n, spec in enumerate(specs, start=1):
        name, rest = spec.split("@", 1)
        t, _, gain = rest.partition(":")
        gain = float(gain) if gain else -6.0
        path = name if os.path.exists(name) else next(
            (p for p in (os.path.join(HERE, d, name + ".wav") for d in ("ui", "fx")) if os.path.exists(p)), "")
        if not path:
            sys.exit(f"SFX tidak ditemukan: {name}")
        inputs += ["-i", path]
        ms = int(float(t) * 1000)
        chains.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo,"
                      f"volume={gain}dB,adelay={ms}|{ms}[s{n}]")
        labels.append(f"[s{n}]")
    if has_audio(src):
        chains.append("[0:a]aresample=48000,aformat=channel_layouts=stereo[a0]")
        mix_in, dur = "[a0]" + "".join(labels), "first"
    else:
        chains.append("anullsrc=r=48000:cl=stereo[a0]")
        mix_in, dur = "[a0]" + "".join(labels), "longest"
    chains.append(f"{mix_in}amix=inputs={len(labels) + 1}:duration={dur}:normalize=0[aout]")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs,
           "-filter_complex", ";".join(chains), "-map", "0:v", "-map", "[aout]",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", dst]
    subprocess.run(cmd, check=True)
    print("OK ->", dst)


if __name__ == "__main__":
    main()
