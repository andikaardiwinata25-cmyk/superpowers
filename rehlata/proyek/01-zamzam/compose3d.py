"""Composite 3D frames + overlays (title, labels, checklist) -> video_3d_raw.mp4
python3 compose3d.py [preview <frame_no> out.png]
"""
import json, os, subprocess, sys
from PIL import Image
import render as R
from render import (W, H, FPS, T, pop, put, badge, label, sticker_img, disclaimer, checklist, GREEN,
                    clamp, backout, ov_s0, ov_s13, ov_s11)

RANGES = {0: (0.0, T(13)), 1: (T(13), T(17)), 2: (T(17), T(32)), 3: (T(32), T(37)), 4: (T(37), T(45)),
          5: (T(45), T(64)), 6: (T(64), T(74)), 7: (T(74), T(83)), 8: (T(83), T(91)), 9: (T(91), T(103)),
          10: (T(103), T(127)), 11: (T(127), T(149)), 12: (T(149), T(160) - .4), 13: (T(160) - .4, 79.1)}


class A:
    def __init__(s, d):
        s.d = d

    def __call__(s, k, dx=0, dy=0):
        x, y, z = s.d[k]
        return x * W + dx, y * H + dy


def ov(i, f, t, a):
    if i == 0:
        ov_s0(f, t)
    elif i == 1:
        disclaimer(f)
        pop(f, badge("LEWAT MANA?", 70, bg=(255, 255, 255), rot=-3), W / 2, 380, t, T(13) + .1)
    elif i == 2:
        pop(f, label("KA'BAH", 46), *a("kaaba"), t, T(24), T(25) - .15)
        pop(f, label("LANTAI THAWAF", 42), *a("floor"), t, T(26), T(28) - .1)
        pop(f, label("SUMUR ZAMZAM", 46, GREEN), *a("well"), t, T(28))
        pop(f, badge("± 30 m", 72), *a("depth"), t, T(30))
        disclaimer(f)
    elif i == 3:
        pop(f, badge("DULU", 84, bg=(255, 236, 200), rot=-4), 300, 360, t, T(32))
        pop(f, label("TIMBA + EMBER", 46), W / 2, 520, t, T(36))
        disclaimer(f)
    elif i == 4:
        pop(f, badge("SEKARANG", 84, bg=(255, 255, 255), rot=-4), 340, 360, t, T(37))
        pop(f, badge("POMPA RAKSASA", 64), W / 2, 560, t, T(39))
        disclaimer(f)
    elif i == 5:
        pop(f, label("MASJIDIL HARAM", 48), *a("haram", 0, -60), t, T(45))
        pop(f, label("KUDAI", 54, GREEN), *a("kudai"), t, T(57))
        pop(f, badge("± 5 KM", 88), *a("mid"), t, T(59))
        disclaimer(f)
    elif i == 6:
        pop(f, label("PABRIK ZAMZAM · KUDAI", 46), W / 2, 560, t, T(66), T(69) - .1)
        pop(f, badge("DISARING BERLAPIS", 64), W / 2, 560, t, T(69))
        pop(f, badge("MATIIN KUMAN", 52, bg=(255, 120, 110), fg=(255, 255, 255), rot=4), 720, 1480, t, T(72))
        disclaimer(f)
        if t > T(69):
            checklist(f, t)
    elif i == 7:
        pop(f, label("LABORATORIUM", 48), W / 2, 520, t, T(78), T(79) - .1)
        pop(f, badge("LOLOS UJI", 72), W / 2, 560, t, T(79))
        disclaimer(f); checklist(f, t)
    elif i == 8:
        pop(f, badge("200.000 BOTOL", 84, sub="PER HARI", rot=-3), W / 2, 600, t, T(88))
        disclaimer(f); checklist(f, t)
    elif i == 9:
        pop(f, label("TANGKI RAKSASA", 48), *a("tanks"), t, T(95), T(97) - .1)
        pop(f, badge("PULANG KE", 56, sub="MASJIDIL HARAM", rot=-3), W / 2, 600, t, T(98))
        disclaimer(f); checklist(f, t)
    elif i == 10:
        pop(f, label("RIBUAN GALON ZAMZAM", 48), W / 2, 560, t, T(108), T(113) - .2)
        pop(f, badge("COLD", 50, bg=(110, 190, 250), fg=(10, 30, 60), rot=-4), *a("c0", 0, -40), t, T(115), T(121) - .2)
        pop(f, badge("NOT COLD", 50, bg=(255, 196, 110), fg=(60, 30, 0), rot=4), *a("c1", 0, -110), t, T(119), T(121) - .2)
        pop(f, label("buat yang lagi radang tenggorokan", 38), W / 2, 560, t, T(125))
        disclaimer(f)
    elif i == 12:
        pop(f, badge("RUTE ZAMZAM", 72, rot=-2), W / 2, 360, t, T(153))
        disclaimer(f)
    elif i == 13:
        ov_cta(f, t, a)


def ov_cta(f, t, a):
    from PIL import ImageDraw
    from render import font
    card = Image.new("RGBA", (860, 330), (0, 0, 0, 0)); d = ImageDraw.Draw(card)
    d.rounded_rectangle([0, 0, 859, 329], 44, fill=(6, 22, 14, 200), outline=(201, 162, 39, 200), width=3)
    items = [("Like", T(160)), ("Share", T(161)), ("Follow", T(162))]
    for k, (txt, ti) in enumerate(items):
        x = 170 + k * 260; y = 110
        on = t >= ti
        kk = backout((t - ti) / 0.3) if on else 0.0
        r = 58 * (0.75 + 0.25 * kk)
        col = GREEN if on else (70, 90, 80)
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (255,))
        ic = (20, 30, 20); s = r * .44
        if k == 0:
            d.ellipse([x - s * 1.1, y - s * .9, x, y + s * .2], fill=ic); d.ellipse([x, y - s * .9, x + s * 1.1, y + s * .2], fill=ic)
            d.polygon([(x - s * 1.08, y - s * .25), (x + s * 1.08, y - s * .25), (x, y + s * 1.05)], fill=ic)
        elif k == 1:
            d.line([(x - s, y + s * .6), (x - s, y - s * .1), (x + s * .3, y - s * .1)], fill=ic, width=int(r * .14))
            d.polygon([(x + s * .2, y - s * .75), (x + s * 1.05, y - s * .1), (x + s * .2, y + s * .55)], fill=ic)
        else:
            d.line([(x - s, y), (x + s, y)], fill=ic, width=int(r * .16)); d.line([(x, y - s), (x, y + s)], fill=ic, width=int(r * .16))
        d.text((x, y + 92), txt, font=font(32, 700), fill=(255, 255, 255), anchor="mm")
    if t >= T(163):
        d.text((430, 290), "@rehlata_tour", font=font(44, 800), fill=(232, 205, 120), anchor="mm")
    t0 = T(160) - .25
    put(f, card, W / 2, 1010, backout((t - t0) / 0.4))
    if t >= T(169):
        pop(f, label("Info edukasi umroh selanjutnya", 36), W / 2, 1420, t, T(169))


def frame(i, n, cache):
    t = n / FPS
    if i == 11:
        if "s11" not in cache:
            cache["s11"] = R.setup(11)
        sc, st, cam = cache["s11"]
        return R.make_frame(sc, st, cam, t).convert("RGB")
    d = f"frames/s{i:02d}"
    if d not in cache:
        cache[d] = json.load(open(f"{d}/anchors.json"))
    im = Image.open(f"{d}/{n:05d}.jpg").convert("RGB").resize((W, H), Image.LANCZOS).convert("RGBA")
    ov(i, im, t, A(cache[d][str(n)]))
    return im.convert("RGB")


def scene_of(n):
    t = n / FPS
    for i, (a, b) in RANGES.items():
        if round(a * FPS) <= n < round(b * FPS):
            return i
    return 13


def main():
    cache = {}
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        n = int(sys.argv[2]); frame(scene_of(n), n, cache).save(sys.argv[3]); return
    N = round(79.1 * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                           "-pix_fmt", "yuv420p", "video_3d_raw.mp4"], stdin=subprocess.PIPE)
    for n in range(N):
        ff.stdin.write(frame(scene_of(n), n, cache).tobytes())
    ff.stdin.close(); ff.wait()


if __name__ == "__main__":
    main()
