#!/usr/bin/env bash
# Generate a "Dokter Brando"-style voice-over with Microsoft Edge TTS.
# Needs speech.platform.bing.com allowed in the environment's network settings.
# Usage: bash rehlata/voice.sh naskah.txt out.mp3 [rate] [pitch]
#   Text file: one sentence per line; an empty line = ~0.5 s dramatic pause.
set -euo pipefail
IN=$1; OUT=$2; RATE=${3:-+5%}; PITCH=${4:-+8Hz}
VOICE=${REHLATA_VOICE:-id-ID-ArdiNeural}
python3 -c "import edge_tts" 2>/dev/null || pip install -q --break-system-packages edge-tts
D=$(mktemp -d); i=0; : > "$D/list.txt"
ffmpeg -v error -f lavfi -i anullsrc=r=24000:cl=mono -t 0.5 -c:a libmp3lame "$D/pause.mp3"
while IFS= read -r line || [ -n "$line" ]; do
  if [ -z "${line// }" ]; then echo "file '$D/pause.mp3'" >> "$D/list.txt"; continue; fi
  i=$((i+1))
  edge-tts ${HTTPS_PROXY:+--proxy "$HTTPS_PROXY"} --voice "$VOICE" --rate="$RATE" --pitch="$PITCH" --text "$line" --write-media "$D/$i.mp3"
  echo "file '$D/$i.mp3'" >> "$D/list.txt"
done < "$IN"
ffmpeg -v error -y -f concat -safe 0 -i "$D/list.txt" -af "loudnorm=I=-16:TP=-1" -ar 44100 "$OUT"
rm -rf "$D"; echo "$OUT"
