set -e
cd /home/user/superpowers/rehlata/proyek/01-zamzam
python3 compose3d.py
ffmpeg -v error -y -i vo_full.wav -i sfx.wav -filter_complex \
 "[1:a]volume=-2dB[s];[0:a]aformat=channel_layouts=stereo,asplit=2[v][vk];[s][vk]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=350[sd];[v][sd]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[o]" \
 -map "[o]" -ar 48000 -t 79.1 mix_full.wav
ffmpeg -v error -y -i video_3d_raw.mp4 -i mix_full.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest av3d.mp4
python3 ../../subtitle.py render av3d.mp4 words.json -o "Rehlata-01-Zamzam-Edukasi-Baitullah-3D-v2.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 Rehlata-01-Zamzam-Edukasi-Baitullah-3D-v2.mp4
