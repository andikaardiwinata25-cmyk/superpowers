# Bank Sound Effect Rehlata

Sumber: `sumber-sfx_notif_apple.mov` (video "UI Sound Effects", label UI 1–UI 15).
Setiap efek dipotong sesuai label di video, dirapikan (hening di awal/akhir
dibuang, fade 2 ms masuk / 20 ms keluar), peak dinormalisasi ke -1 dBFS,
WAV 48 kHz stereo. Audio aslinya HE-AAC 32 kbps, jadi kualitasnya sebatas itu.

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

## Pakai di video

```bash
# tempel SFX ke video: NAMA@DETIK[:VOLUME_dB]
python3 rehlata/sfx/add_sfx.py IN.mp4 OUT.mp4 ui-03@1.2 ui-14@4.8:-3 ui-08@6.05
```

Video tetap (tanpa encode ulang), audio asli dipertahankan, SFX default -6 dB
agar tidak menutupi voice-over. Jika video tidak punya audio, SFX tetap ditempel.

`split.py` = skrip yang dipakai untuk memotong video sumber (untuk dokumentasi).
