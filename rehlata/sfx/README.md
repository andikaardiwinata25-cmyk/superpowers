# Bank Sound Effect Rehlata

33 efek dari 3 video sumber:

- `ui/` — 15 efek dari `sumber-sfx_notif_apple.mov` (label UI 1–UI 15, audio 32 kbps)
- `fx/` — 18 efek bernama dari `sumber-aaura-fx.mov` (9) dan `sumber-kienobimedia.mov` (9),
  audio 128 kbps → kualitas lebih bagus; utamakan ini bila fungsinya sama.

Dicek kemiripannya (spektrogram): tidak ada efek yang sama persis antar-video,
jadi semua disimpan. Suara outro logo TikTok di akhir video aaura dibuang.

Setiap efek dipotong sesuai label di video, dirapikan (hening di awal/akhir
dibuang, fade 2 ms masuk / 20 ms keluar), peak dinormalisasi ke -1 dBFS,
WAV 48 kHz stereo.

Deskripsi berdasarkan bentuk gelombang & nada. Dengarkan dulu sebelum memilih.

| File | Durasi | Bentuk / karakter | Cocok untuk |
|---|---|---|---|
| `ui/ui-01.wav` | 0.68 s | dua nada "ding-ding" bergema, keras | notifikasi utama, judul muncul |
| `ui/ui-02.wav` | 0.49 s | kilau pendek + 3 "pop" naik | daftar/poin muncul satu per satu |
| `ui/ui-03.wav` | 0.44 s | "ding" pendek, nada rendah-tengah | kata kunci muncul, pop-up kecil |
| `ui/ui-04.wav` | 0.63 s | 3 klik sangat halus berjarak | tik-tik, hitung mundur, kursor |
| `ui/ui-05.wav` | 0.47 s | swoosh/kilau pendek, terang | transisi cepat, teks masuk |
| `ui/ui-06.wav` | 0.78 s | 8 pulsa rendah beruntun | loading, mengetik, daftar panjang |
| `ui/ui-07.wav` | 0.88 s | swell lembut dua tahap | transisi halus antar adegan |
| `ui/ui-08.wav` | 0.20 s | 3 klik/pop cepat, terang | tap/klik tombol, centang |
| `ui/ui-09.wav` | 0.97 s | dua whoosh rendah (masuk–keluar) | transisi slide, zoom in/out |
| `ui/ui-10.wav` | 0.97 s | swell/riser panjang, penuh | reveal, momen penting |
| `ui/ui-11.wav` | 0.18 s | 2 pop cepat, terang | klik ganda, emoji muncul |
| `ui/ui-12.wav` | 0.79 s | tap + nada tinggi panjang | pesan masuk, notif HP |
| `ui/ui-13.wav` | 0.44 s | 3 tik sangat tinggi + kilau kecil | sparkle, highlight, bintang |
| `ui/ui-14.wav` | 0.81 s | hentakan rendah bergaung, keras | punchline, fakta mengejutkan |
| `ui/ui-15.wav` | 0.63 s | chime kecil berlapis, terang | sukses, jawaban benar |

### `fx/` — efek bernama (kualitas lebih bagus)

| File | Durasi | Bentuk / karakter | Cocok untuk |
|---|---|---|---|
| `fx/bubble-burst.wav` | 0.32 s | "blup" gelembung pecah, rendah | emoji/ikon muncul, efek lucu |
| `fx/button-click.wav` | 0.56 s | klik tombol halus | tap layar, pilih menu |
| `fx/electronics-glitch.wav` | 0.58 s | cicit digital tinggi patah-patah | error kecil, teks glitch singkat |
| `fx/glitch.wav` | 0.95 s | glitch/statik lebih tebal | transisi glitch, "rusak", plot twist |
| `fx/oscillating-riser.wav` | 1.60 s | nada bergetar yang makin pelan | ketegangan, sebelum reveal |
| `fx/cinematic-whoosh-riser.wav` | 3.46 s | whoosh di awal + riser metalik naik panjang | intro/hook, bangun ketegangan menuju drop |
| `fx/scifi-hit.wav` | 3.52 s | hentakan sci-fi berat, ekor panjang | momen dramatis, judul besar |
| `fx/low-hit.wav` | 1.54 s | boom rendah keras | punchline, fakta mengejutkan, drop |
| `fx/ui-tone.wav` | 0.45 s | dua nada "tu-tung" bersih | notif, info muncul |
| `fx/iphone-vibrate.wav` | 0.95 s | getar HP (dengung ~180 Hz) | pesan/telepon masuk |
| `fx/ringtone.wav` | 1.90 s | dering marimba berulang | telepon masuk, panggilan |
| `fx/reward.wav` | 1.05 s | chime "berhasil" cerah | sukses, jawaban benar, hadiah |
| `fx/counting.wav` | 1.35 s | 14 tik cepat berirama | hitungan angka naik, timer, daftar |
| `fx/camera-flash.wav` | 1.89 s | flash kamera (desis mengisi + kilat) | foto, "bukti", screenshot |
| `fx/camera-shutter.wav` | 1.70 s | jepret shutter + flash | jepret foto, freeze frame |
| `fx/page-flip.wav` | 0.60 s | kertas dibalik | ganti topik, buka dokumen/kitab |
| `fx/shine.wav` | 1.98 s | kilau/sparkle panjang | highlight, sesuatu "berkilau"/istimewa |
| `fx/pop.wav` | 0.42 s | "pop" tajam singkat | teks/stiker muncul, bubble chat |

## Pakai di video

```bash
# tempel SFX ke video: NAMA@DETIK[:VOLUME_dB]
python3 rehlata/sfx/add_sfx.py IN.mp4 OUT.mp4 ui-03@1.2 ui-14@4.8:-3 ui-08@6.05
```

Video tetap (tanpa encode ulang), audio asli dipertahankan, SFX default -6 dB
agar tidak menutupi voice-over. Jika video tidak punya audio, SFX tetap ditempel.

`split.py` (untuk `ui/`) dan `cut.py` (untuk `fx/`, bisa dipakai lagi untuk video
SFX baru) = skrip pemotong video sumber.
