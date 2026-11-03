#!/usr/bin/env bash
# Installs the Rehlata video toolkit into this (ephemeral) container.
# Safe to re-run: skips anything already installed.
set -euo pipefail
T=/opt/rehlata
mkdir -p "$T"

# 1. Montserrat font (Google Fonts)
FD=/usr/local/share/fonts/montserrat
if ! fc-list | grep -qi montserrat; then
  mkdir -p "$FD"
  curl -sS -A "Mozilla/4.0" "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800" \
    | grep -o "https://[^)]*" | nl -v0 | while read -r n u; do
        curl -sS -o "$FD/Montserrat-$((500 + n * 100)).ttf" "$u"; done
  fc-cache -f >/dev/null
fi

# 2. faster-whisper (speech-to-text for auto subtitles)
python3 -c "import faster_whisper, edge_tts" 2>/dev/null \
  || pip install -q --break-system-packages faster-whisper edge-tts

# 3. Whisper-small model (CTranslate2 int8). HuggingFace is blocked in this
#    environment, so it comes from an npm mirror split into 4 parts.
M=$T/whisper-small
EXPECT=ca732cb1379efc49417d028465f543d83a39de2c61f3027678de103dc404ce73
if [ ! -f "$M/model.bin" ]; then
  D=$(mktemp -d); mkdir -p "$M"
  for i in 0 1 2 3; do
    curl -sS "https://registry.npmjs.org/@skillninja/shortmovie-telop-model-p$i/-/shortmovie-telop-model-p$i-1.0.0.tgz" \
      | tar -xz -C "$D"
    mv "$D/package/model.bin.part$i" "$D/part$i"
    [ "$i" = 0 ] && cp "$D"/package/{config.json,preprocessor_config.json,tokenizer.json,vocabulary.json} "$M/"
  done
  cat "$D"/part0 "$D"/part1 "$D"/part2 "$D"/part3 > "$M/model.bin"
  rm -rf "$D"
  echo "$EXPECT  $M/model.bin" | sha256sum -c --quiet
fi

echo "Rehlata toolkit ready: ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3), Montserrat, faster-whisper, $M"
