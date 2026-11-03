---
name: rehlata-video
description: Use for ANY work on Rehlata videos — editing, subtitling, reviewing, planning scripts/storyboards, or exporting short vertical videos (Reels/TikTok/Shorts) for the Rehlata channel. Applies the user's house editing style (Montserrat small subtitles, word-by-word reveal, light-green (#9CF27A) keywords, fast cuts, 9:16).
---

# Rehlata Video

The user (Indonesian speaker, not technical) makes short educational/satire
vertical videos for **Rehlata**. Reply in Bahasa Indonesia, plain language,
no git/repo jargon. Just do the work and deliver the finished file.

## Before anything

1. Read `rehlata/STYLE.md` — the house style. Follow it for every video.
2. Run `bash rehlata/setup.sh` (container is ephemeral; installs Montserrat,
   faster-whisper and the Whisper-small model in ~10s if missing).

## Non-negotiables

- Subtitle font **Montserrat**, **small** (≈2.35% of frame height:
  ~45px @1920, ~30px @1280), white, light-green (#9CF27A) keywords, word-by-word reveal.
- Voice-over = **"Dokter Brando" / "Dokter Toxic"** voice (see STYLE.md 2b,
  reference `rehlata/voice/dokter-brando-referensi.mp3`). Scripts: ~150 words
  per 60 s, hook with 1–2 short questions + ~0.5 s pause.
- 9:16, 30 fps, safe areas respected (bottom ~15%, right ~12%).

## Auto-subtitle workflow

```bash
python3 rehlata/subtitle.py transcribe IN.mp4 -o words.json   # prints transcript
# fix misheard words in words.json (e.g. "pesan tren" -> "pesantren",
# "tkw" -> "TKW"); keep start/end times; set "key": true on keywords
python3 rehlata/subtitle.py render IN.mp4 words.json -o OUT.mp4 \
    --keywords "kata1,kata2"
```

Always show the user the transcript and ask for corrections only if
something is genuinely ambiguous; otherwise fix obvious mishearings
yourself. Pick 1 keyword per sentence or so (nouns/punchlines) for light green.

Check output: grab a few frames with ffmpeg and look at them before
delivering. Save deliverables inside the working directory and send them
with SendUserFile.

## Voice-over (TTS)

`bash rehlata/voice.sh naskah.txt out.mp3` — Edge TTS voice `id-ID-ArdiNeural`
tuned toward Dokter Brando (rate +5%, pitch +8Hz). One sentence per line,
empty line = 0.5 s pause. Requires `speech.platform.bing.com` in the
environment's allowed domains. It only approximates the reference voice;
say so. Compare against `rehlata/voice/dokter-brando-referensi.mp3` and
tweak rate/pitch if needed. First test text: `rehlata/naskah/01-zamzam-hook.txt`.

## Other edits

Use ffmpeg directly (cuts, concat, zoom/Ken Burns via `zoompan`, scale/pad
to 1080x1920, loudness `loudnorm=I=-14`). Keep shots 2–4 s, hook in first
3 s, per STYLE.md.

## Animated / motion-graphic videos (Remotion)

When a Rehlata video needs more than cutting real footage — animated text,
infographics, maps (e.g. mudik routes), counters, kinetic typography — build it
in Remotion. Load the `remotion-best-practices` skill first; it routes to
`remotion-create`, `remotion-markup`, `remotion-captions`, `remotion-maps`,
`remotion-render` and the others (all in `.claude/skills/`, vendored from
`remotion-dev/remotion` `packages/skills`).

Rehlata style still wins over Remotion defaults:

- Composition 1080x1920, 30 fps; keep text out of the safe areas above.
- Subtitles via `remotion-captions`, styled per the non-negotiables (Montserrat,
  small, white, #9CF27A keywords, word-by-word). `words.json` from
  `subtitle.py transcribe` can feed the captions.
- Voice-over from `voice.sh` as the audio track; time scenes to it.
- Deliver a rendered MP4 (`remotion-render`), not only a Studio preview — the
  user wants the finished file.
