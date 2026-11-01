"""Rehlata #01 Zamzam - procedural 2D motion-graphics renderer.
Usage: python3 render.py scene <idx> out.mp4   |  python3 render.py still <idx> <t> out.png
"""
import math, random, subprocess, sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, SS = 1080, 1920, 30, 1.5
FD = "/usr/local/share/fonts/montserrat/Montserrat-%d.ttf"
GREEN = (156, 242, 122)
_fc = {}


def font(sz, wt=800):
    k = (int(sz), wt)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FD % wt, max(4, int(sz)))
    return _fc[k]


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def lerp(a, b, x):
    return a + (b - a) * x


def backout(x):
    x = clamp(x); s = 1.9
    x -= 1
    return x * x * ((s + 1) * x + s) + 1


# ---------------------------------------------------------------- Pen
class Pen:
    """Draws in world coords onto img: screen = (p - o) * k."""

    def __init__(s, img, ox=0, oy=0, k=1.0):
        s.img, s.ox, s.oy, s.k = img, ox, oy, k
        s.d = ImageDraw.Draw(img)

    def P(s, x, y):
        return ((x - s.ox) * s.k, (y - s.oy) * s.k)

    def pts(s, pts):
        return [s.P(x, y) for x, y in pts]

    def box(s, x0, y0, x1, y1):
        a = s.P(x0, y0); b = s.P(x1, y1)
        return [min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1])]

    def rect(s, x0, y0, x1, y1, fill=None, r=0, outline=None, width=0):
        b = s.box(x0, y0, x1, y1)
        if b[2] - b[0] < 1 or b[3] - b[1] < 1:
            return
        if r:
            s.d.rounded_rectangle(b, radius=r * s.k, fill=fill, outline=outline,
                                  width=max(1, int(width * s.k)) if outline else 0)
        else:
            s.d.rectangle(b, fill=fill, outline=outline,
                          width=max(1, int(width * s.k)) if outline else 0)

    def ell(s, cx, cy, rx, ry=None, fill=None, outline=None, width=0):
        ry = rx if ry is None else ry
        b = s.box(cx - rx, cy - ry, cx + rx, cy + ry)
        if b[2] - b[0] < 0.5:
            return
        s.d.ellipse(b, fill=fill, outline=outline, width=max(1, int(width * s.k)) if outline else 0)

    def poly(s, pts, fill=None, outline=None, width=0):
        s.d.polygon(s.pts(pts), fill=fill, outline=outline,
                    width=max(1, int(width * s.k)) if outline else 0)

    def line(s, pts, fill, width=2, joint="curve"):
        s.d.line(s.pts(pts), fill=fill, width=max(1, int(width * s.k)), joint=joint)

    def arc(s, cx, cy, r, a0, a1, fill, width):
        s.d.arc(s.box(cx - r, cy - r, cx + r, cy + r), a0, a1, fill=fill, width=max(1, int(width * s.k)))

    def text(s, x, y, t, size, fill, wt=800, anchor="mm", stroke=0, sfill=(0, 0, 0)):
        s.d.text(s.P(x, y), t, font=font(size * s.k, wt), fill=fill, anchor=anchor,
                 stroke_width=int(stroke * s.k), stroke_fill=sfill)

    def vgrad(s, x0, y0, x1, y1, c0, c1):
        b = [int(v) for v in s.box(x0, y0, x1, y1)]
        w, h = b[2] - b[0], b[3] - b[1]
        if w <= 0 or h <= 0:
            return
        t = np.linspace(0, 1, h)[:, None]
        c0 = np.array(c0 + (255,) * (4 - len(c0)), float); c1 = np.array(c1 + (255,) * (4 - len(c1)), float)
        arr = (c0[None, :] * (1 - t) + c1[None, :] * t)
        arr = np.repeat(arr[:, None, :], w, axis=1).astype(np.uint8)
        g = Image.fromarray(arr, "RGBA")
        s.img.alpha_composite(g, (b[0], b[1]))

    def layer(s):
        return Pen(Image.new("RGBA", s.img.size, (0, 0, 0, 0)), s.ox, s.oy, s.k)

    def merge(s, sub, blur=0):
        im = sub.img.filter(ImageFilter.GaussianBlur(blur * s.k)) if blur else sub.img
        s.img.alpha_composite(im)


def static_pen(ww=W, wh=H, bg=(0, 0, 0, 255)):
    return Pen(Image.new("RGBA", (int(ww * SS), int(wh * SS)), bg), 0, 0, SS)


# ---------------------------------------------------------------- shared drawing bits
def soft_shadow(p, cx, cy, rx, ry, a=90, blur=18):
    L = p.layer(); L.ell(cx, cy, rx, ry, fill=(0, 0, 0, a)); p.merge(L, blur)


def person(p, x, y, sc=1.0, body=(250, 250, 250), skin=(205, 160, 120), head=None, walk=0.0):
    """Simple rounded figure; (x,y) = feet."""
    h = 120 * sc
    lg = math.sin(walk) * 8 * sc
    p.line([(x - 6 * sc, y - h * .38), (x - 8 * sc + lg, y)], (60, 60, 60), 7 * sc)
    p.line([(x + 6 * sc, y - h * .38), (x + 8 * sc - lg, y)], (60, 60, 60), 7 * sc)
    p.rect(x - 17 * sc, y - h * .82, x + 17 * sc, y - h * .32, fill=body, r=14 * sc)
    p.ell(x, y - h * .91, 12 * sc, fill=skin)
    if head:
        p.ell(x, y - h * .95, 12.5 * sc, 9 * sc, fill=head)


def droplet(p, x, y, r, fill=(70, 170, 235)):
    p.poly([(x, y - r * 1.8), (x - r * .85, y - r * .3), (x + r * .85, y - r * .3)], fill=fill)
    p.ell(x, y, r, fill=fill)
    p.ell(x - r * .35, y - r * .25, r * .28, fill=(255, 255, 255, 170))


# ---------------------------------------------------------------- overlays (screen space)
_oc = {}


def sticker_img(lines, bg, fg, pad=(34, 18), rot=0, rad=22, shadow=True):
    key = (tuple(lines), bg, fg, rot)
    if key in _oc:
        return _oc[key]
    fs = [font(sz, wt) for _, sz, wt, _ in lines]
    ws = [f.getbbox(t)[2] - f.getbbox(t)[0] for (t, _, _, _), f in zip(lines, fs)]
    hs = [sz * 1.18 for _, sz, _, _ in lines]
    bw = int(max(ws) + 2 * pad[0]); bh = int(sum(hs) + 2 * pad[1])
    im = Image.new("RGBA", (bw + 40, bh + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([20, 26, 20 + bw, 26 + bh], rad, fill=(0, 0, 0, 110))
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    if bg:
        d.rounded_rectangle([20, 20, 20 + bw, 20 + bh], rad, fill=bg)
    y = 20 + pad[1]
    for (t, sz, wt, col), f, hh in zip(lines, fs, hs):
        kw = dict(stroke_width=0) if bg else dict(stroke_width=max(2, sz // 14), stroke_fill=(0, 0, 0, 200))
        d.text((20 + bw / 2, y + hh / 2), t, font=f, fill=col or fg, anchor="mm", **kw)
        y += hh
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    _oc[key] = im
    return im


def put(frame, im, x, y, scale=1.0, alpha=1.0):
    if scale <= 0.02 or alpha <= 0.01:
        return
    if abs(scale - 1) > 0.01:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    if alpha < 0.99:
        im = im.copy(); a = im.getchannel("A").point(lambda v: int(v * alpha)); im.putalpha(a)
    frame.alpha_composite(im, (int(x - im.width / 2), int(y - im.height / 2)))


def pop(frame, im, x, y, t, t0, t1=None, dur=0.32):
    if t < t0 or (t1 is not None and t > t1 + 0.2):
        return
    sc = backout((t - t0) / dur)
    al = 1.0
    if t1 is not None and t > t1:
        al = 1 - (t - t1) / 0.2; sc *= 1 - 0.15 * (t - t1) / 0.2
    put(frame, im, x, y, sc, al)


def label(t_, sz=42, col=(255, 255, 255)):
    return sticker_img([(t_, sz, 800, col)], None, col, pad=(10, 6), shadow=False)


def badge(t_, sz=64, bg=GREEN, fg=(20, 30, 20), rot=-3, sub=None):
    lines = [(t_, sz, 800, fg)]
    if sub:
        lines.append((sub, int(sz * .45), 700, fg))
    return sticker_img(lines, bg + (255,), fg, rot=rot)


def disclaimer(frame):
    put(frame, sticker_img([("Ilustrasi · bukan visual asli", 24, 600, (255, 255, 255, 190))], None,
                           (255, 255, 255), pad=(6, 4), shadow=False), W / 2, 112)


CHECK = [("Disaring", 32.97), ("Dicek lab", 36.7), ("Dibotolin", 40.66), ("Pulang ke Haram", 47.66)]


def checklist(frame, t):
    L = Image.new("RGBA", (430, 300), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    d.rounded_rectangle([0, 0, 429, 299], 26, fill=(10, 20, 30, 150))
    d.text((28, 34), "RUTE ZAMZAM", font=font(28, 800), fill=GREEN, anchor="lm")
    for i, (txt, t0) in enumerate(CHECK):
        y = 92 + i * 52
        on = t >= t0
        d.rounded_rectangle([28, y - 17, 62, y + 17], 8, outline=(255, 255, 255, 200), width=3,
                            fill=GREEN + (255,) if on else None)
        if on:
            k = clamp((t - t0) / 0.25)
            pts = [(34, y), (43, y + 9), (57, y - 10)]
            if k < .5:
                pts = [pts[0], (lerp(34, 43, k * 2), lerp(y, y + 9, k * 2))]
            else:
                pts = [pts[0], pts[1], (lerp(43, 57, k * 2 - 1), lerp(y + 9, y - 10, k * 2 - 1))]
            d.line(pts, fill=(20, 40, 20), width=5, joint="curve")
        d.text((80, y), txt, font=font(30, 700), fill=(255, 255, 255, 255 if on else 140), anchor="lm")
    frame.alpha_composite(L, (56, 160))


# ---------------------------------------------------------------- scenes
WORDS = json.load(open("words.json"))


def T(i):
    return WORDS[i]["start"]


# ---------- S0 / S13: glass
GL = dict(cx=540, top=690, bot=1340, tw=190, bw=145)


def st_glass():
    p = static_pen()
    p.vgrad(0, 0, W, H, (40, 28, 20), (92, 66, 42))
    L = p.layer()
    for i in range(5):
        x = 60 + i * 240
        L.rect(x, 380, x + 170, 1500, fill=(140, 105, 70, 120))
        L.ell(x + 85, 380, 85, 85, fill=(140, 105, 70, 120))
    rnd = random.Random(3)
    for i in range(40):
        L.ell(rnd.uniform(0, W), rnd.uniform(150, 1350), rnd.uniform(18, 60),
              fill=(255, 214, 150, rnd.randint(30, 90)))
    p.merge(L, 22)
    p.vgrad(0, 1330, W, H, (236, 232, 224), (186, 178, 166))
    V = p.layer(); rnd = random.Random(5)
    for i in range(9):
        x0 = rnd.uniform(-100, W); V.line([(x0, 1330), (x0 + rnd.uniform(-200, 200), 1600), (x0 + rnd.uniform(-300, 300), H)],
                                           (120, 115, 105, 60), 3)
    p.merge(V, 2)
    soft_shadow(p, 560, 1345, 210, 28, 130, 14)
    g = GL; cx = g["cx"]
    body = [(cx - g["tw"], g["top"]), (cx + g["tw"], g["top"]), (cx + g["bw"], g["bot"]), (cx - g["bw"], g["bot"])]
    G = p.layer()
    G.poly(body, fill=(255, 255, 255, 38))
    wt = 830
    f = (wt - g["top"]) / (g["bot"] - g["top"])
    wl, wr = lerp(cx - g["tw"], cx - g["bw"], f), lerp(cx + g["tw"], cx + g["bw"], f)
    G.poly([(wl + 6, wt), (wr - 6, wt), (cx + g["bw"] - 8, g["bot"] - 30), (cx - g["bw"] + 8, g["bot"] - 30)],
           fill=(110, 185, 230, 120))
    G.ell(cx, wt, (wr - wl) / 2 - 6, 22, fill=(190, 230, 250, 170))
    G.rect(cx - g["bw"] + 6, g["bot"] - 34, cx + g["bw"] - 6, g["bot"], fill=(230, 245, 255, 110), r=10)
    G.poly([(cx - g["tw"] + 30, g["top"] + 30), (cx - g["tw"] + 62, g["top"] + 30),
            (cx - g["bw"] + 58, g["bot"] - 60), (cx - g["bw"] + 32, g["bot"] - 60)], fill=(255, 255, 255, 80))
    G.line([body[0], body[3]], (255, 255, 255, 160), 5); G.line([body[1], body[2]], (255, 255, 255, 120), 5)
    G.ell(cx, g["top"], g["tw"], 26, outline=(255, 255, 255, 170), width=5)
    p.merge(G)
    return p.img


def dy_glass(p, t):
    L = p.layer(); rnd = random.Random(11)
    for i in range(16):
        x = 540 + rnd.uniform(-120, 120); sp = rnd.uniform(60, 140); ph = rnd.uniform(0, 500)
        y = 1300 - ((t * sp + ph) % 460)
        L.ell(x + math.sin(t * 3 + i) * 6, y, rnd.uniform(4, 9), outline=(255, 255, 255, 150), width=2)
    p.merge(L)


def ov_s0(f, t):
    title = sticker_img([("EDUKASI", 104, 800, (255, 255, 255)),
                         ("BAITULLAH", 118, 800, GREEN)], None, (255, 255, 255), pad=(10, 4), shadow=False)
    if t < 3.6:
        sc = backout((t - 0.1) / 0.45) if t > 0.1 else 0
        al = 1 if t < 3.3 else 1 - (t - 3.3) / 0.3
        put(f, title, W / 2, 400 - 10 * clamp(t / 3.3), sc, al)
    pop(f, badge("± 10 KM", 88, sub="bolak-balik"), W / 2, 420, t, T(7))
    disclaimer(f)


def ov_s13(f, t):
    t0 = T(160)
    card = Image.new("RGBA", (820, 640), (0, 0, 0, 0)); d = ImageDraw.Draw(card)
    d.rounded_rectangle([0, 0, 819, 639], 46, fill=(12, 20, 28, 215))
    # icons: heart, share, plus
    items = [("Like", T(160)), ("Share", T(161)), ("Follow", T(162))]
    for i, (txt, ti) in enumerate(items):
        x = 150 + i * 260; y = 150
        on = t >= ti
        k = backout((t - ti) / 0.3) if on else 0.0
        r = 62 * (0.75 + 0.25 * k)
        col = GREEN if on else (90, 100, 110)
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (255,))
        ic = (20, 30, 20)
        if i == 0:
            s = r * .42
            d.ellipse([x - s * 1.1, y - s * .9, x, y + s * .2], fill=ic); d.ellipse([x, y - s * .9, x + s * 1.1, y + s * .2], fill=ic)
            d.polygon([(x - s * 1.08, y - s * .25), (x + s * 1.08, y - s * .25), (x, y + s * 1.05)], fill=ic)
        elif i == 1:
            s = r * .45
            d.line([(x - s, y + s * .6), (x - s, y - s * .1), (x + s * .3, y - s * .1)], fill=ic, width=int(r * .14))
            d.polygon([(x + s * .2, y - s * .75), (x + s * 1.05, y - s * .1), (x + s * .2, y + s * .55)], fill=ic)
        else:
            s = r * .45
            d.line([(x - s, y), (x + s, y)], fill=ic, width=int(r * .16)); d.line([(x, y - s), (x, y + s)], fill=ic, width=int(r * .16))
        d.text((x, y + 100), txt, font=font(34, 700), fill=(255, 255, 255), anchor="mm")
    d.text((410, 380), "Instagram", font=font(34, 600), fill=(255, 255, 255, 220), anchor="mm")
    if t >= T(164):
        d.text((410, 450), "REHLATA", font=font(92, 800), fill=GREEN, anchor="mm")
    if t >= T(169):
        d.text((410, 548), "Info edukasi umroh selanjutnya", font=font(32, 600), fill=(255, 255, 255, 230), anchor="mm")
    sc = backout((t - (t0 - 0.35)) / 0.4)
    put(f, card, W / 2, 640, sc)


# ---------- map (S1, S5, S12)
ROUTE = [(540, 470), (560, 600), (610, 760), (600, 920), (650, 1080), (620, 1240), (590, 1390), (600, 1460)]


def route_pts(n=200):
    out = []
    for i in range(n + 1):
        u = i / n * (len(ROUTE) - 1); k = min(int(u), len(ROUTE) - 2); f = u - k
        a, b = ROUTE[k], ROUTE[k + 1]
        out.append((lerp(a[0], b[0], f), lerp(a[1], b[1], f)))
    return out


RP = route_pts()


def st_map():
    p = static_pen()
    p.vgrad(0, 0, W, H, (238, 226, 198), (228, 212, 178))
    L = p.layer(); rnd = random.Random(8)
    for i in range(16):  # mountains
        x = rnd.choice([rnd.uniform(-80, 280), rnd.uniform(800, 1160)]); y = rnd.uniform(200, 1800)
        L.ell(x, y, rnd.uniform(120, 260), rnd.uniform(80, 170), fill=(176, 132, 92, 90))
    p.merge(L, 30)
    R = p.layer()
    for pts in ([(0, 700), (300, 760), (560, 600), (1080, 640)], [(0, 1300), (400, 1220), (620, 1240), (1080, 1180)],
                [(200, 0), (380, 300), (520, 470)], [(900, 0), (760, 260), (560, 470)], [(600, 1460), (700, 1920)]):
        R.line(pts, (255, 255, 255, 200), 18); R.line(pts, (200, 190, 170, 255), 10)
    p.merge(R)
    rnd = random.Random(2)  # city blocks around haram
    for i in range(140):
        a = rnd.uniform(0, 6.28); r = rnd.uniform(150, 360)
        x = 540 + math.cos(a) * r * 1.1; y = 440 + math.sin(a) * r * .85
        if 0 < y < 900:
            s = rnd.uniform(14, 30); c = rnd.randint(200, 235)
            p.rect(x - s, y - s * .7, x + s, y + s * .7, fill=(c, c - 8, c - 25), r=3)
    soft_shadow(p, 540, 455, 150, 120, 80, 12)
    p.ell(540, 440, 150, 120, fill=(250, 248, 242), outline=(210, 200, 180), width=4)
    p.rect(470, 380, 610, 500, fill=(236, 230, 216), r=12)
    for x, y in ((455, 365), (625, 365), (455, 515), (625, 515)):
        p.ell(x, y, 9, fill=(200, 190, 170))
    p.rect(528, 428, 552, 452, fill=(20, 20, 20))
    # Kudai plant
    soft_shadow(p, 610, 1485, 150, 40, 90, 10)
    for i, (x, w, h) in enumerate(((480, 90, 70), (580, 120, 95), (710, 90, 60))):
        p.rect(x, 1480 - h, x + w, 1480, fill=(232, 238, 244), outline=(150, 165, 180), width=3)
        p.poly([(x - 4, 1480 - h), (x + w / 2, 1480 - h - 26), (x + w + 4, 1480 - h)], fill=(70, 140, 205))
    for x in (650, 690):
        p.ell(x, 1500, 22, 10, fill=(100, 170, 220))
    return p.img


def draw_route(p, frac, col=(59, 167, 230), back=False):
    n = max(2, int(len(RP) * clamp(frac)))
    pts = RP[:n] if not back else [(x - 26, y) for x, y in RP[::-1][:n]]
    p.line(pts, (255, 255, 255), 22); p.line(pts, col, 13)
    return pts[-1]


def dy_s1(p, t):
    t0 = T(13)
    for i in range(0, len(RP) - 1, 8):  # dashed travelling
        j = (i + int(t * 40)) % (len(RP) - 1)
        if (j // 4) % 2 == 0:
            p.line([RP[j], RP[min(j + 3, len(RP) - 1)]], (60, 80, 100, 255), 9)


def ov_s1(f, t, cam):
    q = badge("?", 120, bg=(255, 255, 255), rot=6)
    pop(f, q, *cam.S(760, 760), t, T(13) + .2)
    pop(f, badge("?", 80, bg=GREEN, rot=-8), *cam.S(380, 1060), t, T(15))
    disclaimer(f)


def dy_s5(p, t):
    k = ease((t - T(53)) / (T(58) - T(53)))
    if k > 0:
        x, y = draw_route(p, k)
        droplet(p, x, y - 10, 22)


def ov_s5(f, t, cam):
    pop(f, label("MASJIDIL HARAM", 46), *cam.S(540, 290), t, T(45))
    pop(f, label("KUDAI", 50, GREEN), *cam.S(330, 1430), t, T(57))
    pop(f, badge("± 5 KM", 84), *cam.S(830, 960), t, T(59))
    disclaimer(f)


def dy_s12(p, t):
    draw_route(p, 1.0)
    draw_route(p, 1.0, col=(120, 205, 120), back=True)
    u = ((t - 68.72) / 3.2) % 1.0
    i = int(u * (len(RP) - 1))
    droplet(p, RP[i][0], RP[i][1] - 10, 22)
    j = len(RP) - 1 - i
    droplet(p, RP[j][0] - 26, RP[j][1] - 10, 20, fill=(110, 200, 110))


def ov_s12(f, t, cam):
    pop(f, label("MASJIDIL HARAM", 46), *cam.S(540, 290), t, 68.72)
    pop(f, label("KUDAI", 50, GREEN), *cam.S(330, 1430), t, 68.72)
    pop(f, badge("RUTE ZAMZAM", 72, rot=-2), W / 2, 330, t, T(153))
    disclaimer(f)


# ---------- S2 Ka'bah + well cutaway
WELL = (780, 860)


def st_kaaba():
    p = static_pen()
    p.vgrad(0, 0, W, 640, (110, 190, 238), (210, 238, 252))
    # arcade
    p.rect(0, 430, W, 640, fill=(236, 228, 210))
    for i in range(12):
        x = -20 + i * 95
        p.rect(x + 18, 480, x + 78, 640, fill=(196, 182, 156), r=0)
        p.ell(x + 48, 482, 30, 30, fill=(196, 182, 156))
    p.rect(0, 430, W, 452, fill=(214, 202, 178))
    for x in (60, 1010):
        p.rect(x - 16, 150, x + 16, 640, fill=(240, 234, 220)); p.poly([(x - 18, 150), (x, 95), (x + 18, 150)], fill=(200, 170, 90))
    # floor
    p.vgrad(0, 600, W, 720, (246, 244, 238), (230, 226, 216))
    # kaaba
    soft_shadow(p, 540, 640, 210, 24, 120, 10)
    p.vgrad(395, 300, 685, 640, (32, 32, 32), (12, 12, 12))
    p.rect(395, 372, 685, 404, fill=(201, 162, 39))
    for i in range(14):
        p.ell(410 + i * 20.5, 388, 4, fill=(120, 90, 20))
    p.rect(590, 470, 640, 620, fill=(201, 162, 39), r=4); p.rect(598, 480, 632, 610, outline=(140, 105, 25), width=3)
    p.rect(395, 300, 685, 310, fill=(50, 50, 50))
    # cutaway earth
    layers = [(720, 770, (240, 238, 232)), (770, 1010, (178, 124, 76)), (1010, 1310, (154, 104, 58)),
              (1310, 1660, (126, 90, 60)), (1660, 1920, (100, 72, 48))]
    for y0, y1, c in layers:
        p.vgrad(0, y0, W, y1, c, tuple(max(0, v - 18) for v in c))
    p.rect(0, 716, W, 724, fill=(200, 196, 186))
    rnd = random.Random(4); S = p.layer()
    for i in range(120):
        x = rnd.uniform(0, W); y = rnd.uniform(800, 1900)
        S.ell(x, y, rnd.uniform(6, 22), rnd.uniform(4, 14), fill=(60, 40, 25, rnd.randint(40, 90)))
    p.merge(S, 1)
    A = p.layer(); A.rect(0, 1500, W, 1640, fill=(90, 170, 230, 70)); p.merge(A, 14)
    x0, x1 = WELL
    p.rect(x0 - 16, 724, x1 + 16, 1580, fill=(120, 116, 110))
    p.vgrad(x0, 724, x1, 1580, (40, 34, 30), (22, 20, 18))
    for y in range(740, 1560, 34):
        p.line([(x0 - 16, y), (x0, y)], (90, 86, 80), 3); p.line([(x1, y), (x1 + 16, y)], (90, 86, 80), 3)
    p.vgrad(x0, 1470, x1, 1580, (80, 170, 230), (40, 110, 180))
    p.rect(x0 - 26, 704, x1 + 26, 724, fill=(225, 220, 210), r=4)
    # depth marker
    p.line([(700, 726), (700, 1468)], (255, 255, 255), 4)
    for y in (726, 1468):
        p.line([(684, y), (716, y)], (255, 255, 255), 4)
    return p.img


def dy_kaaba(p, t):
    rnd = random.Random(9)
    figs = []
    for i in range(22):
        sp = rnd.uniform(30, 45); ph = rnd.uniform(0, 1400); y = rnd.uniform(650, 712)
        x = 1200 - ((t * sp + ph) % 1400)
        figs.append((y, x, rnd.uniform(.38, .5), rnd.random()))
    for y, x, sc, c in sorted(figs):
        person(p, x, y, sc, walk=t * 7 + x * .05, skin=(190 + int(c * 40), 145 + int(c * 30), 105))
    L = p.layer()
    yy = 1500 + math.sin(t * 2.5) * 4
    L.rect(WELL[0], yy - 10, WELL[1], yy + 4, fill=(170, 220, 250, 160))
    p.merge(L)


def ov_s2(f, t, cam):
    pop(f, label("KA'BAH", 44), *cam.S(300, 420), t, T(24))
    pop(f, label("LANTAI THAWAF", 40), *cam.S(520, 745), t, T(26))
    pop(f, label("SUMUR ZAMZAM", 44, GREEN), *cam.S(820, 1640), t, T(28))
    pop(f, badge("± 30 m", 72), *cam.S(520, 1100), t, T(30))
    disclaimer(f)


# ---------- S3 dulu
def st_dulu():
    p = static_pen()
    p.vgrad(0, 0, W, 1250, (226, 196, 150), (240, 222, 186))
    for i, (x, w, h) in enumerate(((0, 260, 360), (230, 200, 300), (760, 320, 420))):
        p.rect(x, 1250 - h, x + w, 1250, fill=(200, 164, 118)); p.rect(x + 40, 1250 - h + 60, x + 80, 1250 - h + 120, fill=(150, 112, 74))
    p.vgrad(0, 1250, W, H, (196, 160, 112), (160, 124, 82))
    soft_shadow(p, 540, 1520, 320, 40, 120, 12)
    p.vgrad(250, 1180, 830, 1510, (170, 150, 128), (120, 104, 88))
    for row, y in enumerate(range(1190, 1500, 52)):
        for x in range(250 + (row % 2) * 40, 830, 80):
            p.rect(x, y, x + 74, y + 46, outline=(96, 82, 68), width=3, r=4)
    p.ell(540, 1180, 290, 50, fill=(150, 132, 112)); p.ell(540, 1180, 250, 38, fill=(30, 24, 20))
    for x in (300, 780):
        p.rect(x - 22, 560, x + 22, 1190, fill=(120, 82, 46))
    p.rect(260, 540, 820, 590, fill=(132, 92, 52), r=8)
    p.ell(540, 600, 40, fill=(90, 60, 32)); p.ell(540, 600, 16, fill=(60, 40, 22))
    return p.img


def dy_dulu(p, t):
    k = ease((t - 16.6) / 2.1)
    by = lerp(1210, 820, k)
    p.line([(540, 600), (540, by - 70)], (200, 170, 120), 6)
    p.poly([(470, by - 70), (610, by - 70), (590, by + 40), (490, by + 40)], fill=(130, 88, 48))
    p.line([(470, by - 70), (540, by - 120), (610, by - 70)], (80, 60, 40), 5)
    for yb in (by - 40, by + 10):
        p.line([(472, yb), (604, yb)], (80, 54, 30), 6)
    p.ell(540, by - 70, 70, 14, fill=(110, 180, 220))
    if k > .2:
        for i in range(3):
            dy = ((t * 400 + i * 90) % 300)
            droplet(p, 520 + i * 18, by + 50 + dy, 7, fill=(110, 180, 220))


def ov_s3(f, t, cam):
    pop(f, badge("DULU", 80, bg=(255, 236, 200), rot=-4), 260, 360, t, T(32))
    pop(f, label("TIMBA + EMBER", 44), *cam.S(540, 470), t, T(36))
    disclaimer(f)


# ---------- S4 sekarang (pumps)
def st_pump():
    p = static_pen()
    p.vgrad(0, 0, W, 1350, (206, 214, 222), (176, 186, 198))
    for x in range(0, W, 180):
        p.line([(x, 0), (x, 1350)], (190, 198, 208), 3)
    p.vgrad(0, 1350, W, H, (150, 158, 168), (110, 118, 128))
    p.rect(0, 640, W, 720, fill=(120, 140, 160), r=0)
    p.rect(0, 660, W, 700, fill=(150, 170, 190))
    for cx in (330, 760):
        soft_shadow(p, cx, 1360, 260, 30, 120, 14)
        p.rect(cx - 30, 700, cx + 30, 980, fill=(120, 140, 160))
        p.rect(cx - 240, 1260, cx + 240, 1360, fill=(90, 100, 112), r=10)
        p.rect(cx - 220, 1000, cx + 40, 1250, fill=(44, 111, 183), r=40)
        for i in range(7):
            p.line([(cx - 190 + i * 32, 1020), (cx - 190 + i * 32, 1230)], (30, 86, 150), 6)
        p.ell(cx + 110, 1120, 120, fill=(54, 125, 196)); p.ell(cx + 110, 1120, 70, fill=(36, 96, 166))
        p.rect(cx + 90, 960, cx + 130, 1010, fill=(120, 140, 160))
        p.rect(cx + 180, 1200, cx + 240, 1380, fill=(120, 140, 160))
        p.ell(cx - 90, 930, 40, fill=(245, 245, 245), outline=(80, 90, 100), width=6)
    p.rect(870, 1380, 960, H, fill=(120, 140, 160))
    return p.img


def dy_pump(p, t):
    L = p.layer()
    off = (t * 260) % 80
    x = -80 + off
    while x < W:
        L.rect(x, 668, x + 40, 692, fill=(120, 200, 245, 220), r=10); x += 80
    p.merge(L)
    for cx in (330, 760):
        a = t * 14 + cx
        for i in range(3):
            aa = a + i * 2.094
            p.line([(cx + 110, 1120), (cx + 110 + math.cos(aa) * 60, 1120 + math.sin(aa) * 60)], (200, 225, 250), 10)
        na = -2.4 + 1.2 + math.sin(t * 9 + cx) * .25
        p.line([(cx - 90, 930), (cx - 90 + math.cos(na) * 28, 930 + math.sin(na) * 28)], (220, 40, 40), 5)


def ov_s4(f, t, cam):
    pop(f, badge("SEKARANG", 80, bg=(255, 255, 255), rot=-4), 330, 360, t, T(37))
    pop(f, badge("POMPA RAKSASA", 64), *cam.S(540, 880), t, T(39))
    disclaimer(f)


# ---------- S6 factory filters
TANKS = (120, 410, 700)


def st_factory():
    p = static_pen()
    p.vgrad(0, 0, W, 1500, (214, 226, 236), (186, 202, 216))
    for x in range(80, W, 240):
        p.rect(x, 130, x + 150, 330, fill=(236, 246, 252), outline=(160, 176, 190), width=5)
    p.vgrad(0, 1500, W, H, (160, 172, 184), (124, 136, 148))
    p.rect(0, 420, W, 456, fill=(130, 150, 170))
    for x0 in TANKS:
        x1 = x0 + 260
        soft_shadow(p, x0 + 130, 1500, 150, 24, 120, 10)
        p.rect(x0 + 110, 440, x0 + 150, 520, fill=(130, 150, 170))
        p.rect(x0, 500, x1, 1480, fill=(228, 234, 240), r=60, outline=(140, 156, 172), width=6)
        lay = [(560, 760, (130, 195, 235)), (760, 920, (150, 150, 150)), (920, 1100, (222, 200, 150)),
               (1100, 1240, (60, 60, 64)), (1240, 1420, (236, 222, 186))]
        for y0, y1, c in lay:
            p.rect(x0 + 20, y0, x1 - 20, y1, fill=c, r=10 if y0 == 560 else 0)
        rnd = random.Random(x0)
        for i in range(70):
            y = rnd.uniform(765, 915); x = rnd.uniform(x0 + 28, x1 - 28)
            p.ell(x, y, rnd.uniform(6, 11), fill=(110, 110, 112))
        for i in range(120):
            y = rnd.uniform(925, 1095); x = rnd.uniform(x0 + 24, x1 - 24)
            p.ell(x, y, 2.5, fill=(190, 166, 120))
        p.rect(x0 + 110, 1480, x0 + 150, 1600, fill=(130, 150, 170))
    p.rect(0, 1590, W, 1630, fill=(130, 150, 170))
    return p.img


def dy_factory(p, t):
    L = p.layer()
    off = (t * 220) % 80
    x = -80 + off
    while x < W:
        L.rect(x, 428, x + 40, 448, fill=(120, 200, 245, 230), r=8); L.rect(x, 1598, x + 40, 1622, fill=(120, 200, 245, 230), r=8)
        x += 80
    rnd = random.Random(6)
    for x0 in TANKS:
        for i in range(16):
            xx = x0 + rnd.uniform(40, 220); sp = rnd.uniform(90, 160); ph = rnd.uniform(0, 860)
            y = 580 + ((t * sp + ph) % 840)
            L.ell(xx, y, 7, fill=(90, 180, 245, 220))
        yw = 570 + math.sin(t * 3 + x0) * 5
        L.rect(x0 + 20, yw - 6, x0 + 240, yw + 6, fill=(200, 235, 255, 150), r=6)
    p.merge(L)


def ov_s6(f, t, cam):
    pop(f, label("PABRIK ZAMZAM · KUDAI", 44), W / 2, 560, t, T(66), T(69) - .1)
    pop(f, badge("DISARING BERLAPIS", 64), W / 2, 560, t, T(69))
    pop(f, badge("MATIIN KUMAN", 52, bg=(255, 120, 110), fg=(255, 255, 255), rot=4), 760, 1480, t, T(72))
    disclaimer(f)
    if t > T(69):
        checklist(f, t)


# ---------- S7 lab
def st_lab():
    p = static_pen()
    p.vgrad(0, 0, W, 1250, (222, 240, 238), (196, 224, 222))
    for x in range(0, W, 120):
        p.line([(x, 0), (x, 1250)], (210, 232, 230), 3)
    p.rect(620, 300, 1000, 620, fill=(40, 60, 70), r=20); p.rect(640, 320, 980, 600, fill=(230, 250, 248), r=10)
    p.vgrad(0, 1250, W, H, (232, 236, 240), (190, 196, 204))
    p.rect(0, 1200, W, 1260, fill=(250, 252, 252)); p.rect(0, 1260, W, 1290, fill=(170, 180, 190))
    # rack
    p.rect(560, 1100, 940, 1200, fill=(90, 120, 150), r=10)
    for i in range(6):
        x = 590 + i * 60
        p.rect(x, 920, x + 34, 1170, fill=(240, 250, 255), r=16, outline=(150, 170, 190), width=3)
        p.rect(x + 4, 1040, x + 30, 1166, fill=(100, 185, 235), r=12)
    p.rect(550, 1080, 950, 1110, fill=(70, 100, 130), r=8)
    # beaker
    p.poly([(330, 900), (430, 900), (460, 1200), (300, 1200)], fill=(236, 248, 255), outline=(150, 170, 190), width=4)
    p.poly([(316, 1040), (444, 1040), (458, 1196), (302, 1196)], fill=(120, 195, 240))
    # scientist
    soft_shadow(p, 170, 1220, 120, 16, 90, 8)
    p.rect(60, 760, 280, 1220, fill=(250, 252, 252), r=70, outline=(200, 210, 215), width=4)
    p.poly([(140, 760), (170, 900), (200, 760)], fill=(110, 160, 200))
    p.ell(170, 680, 70, fill=(200, 155, 115)); p.ell(170, 640, 74, 46, fill=(50, 40, 34))
    p.rect(118, 670, 222, 700, fill=(160, 210, 240, 255), r=12)
    return p.img


def dy_lab(p, t):
    for i in range(6):
        h = 60 + 80 * ease((t - 36.0 - i * .25) / 1.2) * (0.5 + 0.5 * ((i * 37) % 10) / 10)
        p.rect(670 + i * 48, 560 - h, 700 + i * 48, 560, fill=(80, 170, 120), r=4)
    lift = ease((t - 36.5) / .8) - ease((t - 38.6) / .8)
    x = 230 + 0 * lift; y = 1000 - 120 * lift
    p.line([(250, 900), (x + 40, y + 40)], (250, 252, 252), 40)
    p.rect(x + 30, y - 90, x + 64, y + 90, fill=(240, 250, 255), r=16, outline=(150, 170, 190), width=3)
    p.rect(x + 34, y, x + 60, y + 86, fill=(100, 185, 235), r=12)
    p.ell(x + 46, y + 40, 26, fill=(200, 155, 115))


def ov_s7(f, t, cam):
    pop(f, label("LABORATORIUM", 46), *cam.S(800, 260), t, T(78))
    pop(f, badge("LOLOS UJI", 72), *cam.S(760, 760), t, T(79))
    disclaimer(f); checklist(f, t)


# ---------- S8 bottling
def st_bottle():
    p = static_pen()
    p.vgrad(0, 0, W, 1300, (200, 214, 228), (170, 186, 204))
    rnd = random.Random(1)
    for x in range(-40, W, 150):
        for y in range(820, 1180, 90):
            if rnd.random() < .8:
                p.rect(x, y, x + 140, y + 84, fill=(196, 160, 112), outline=(150, 116, 74), width=3)
                p.line([(x + 70, y), (x + 70, y + 84)], (226, 196, 150), 6)
    p.vgrad(0, 1300, W, H, (140, 150, 162), (104, 112, 124))
    p.rect(0, 1290, W, 1340, fill=(46, 50, 56))
    for x in range(0, W, 60):
        p.ell(x + 30, 1360, 16, fill=(90, 96, 104))
    p.rect(0, 1340, W, 1350, fill=(30, 32, 36))
    p.rect(620, 380, 900, 640, fill=(150, 160, 172), r=18); p.rect(640, 410, 880, 470, fill=(80, 200, 120), r=8)
    p.rect(735, 640, 785, 760, fill=(120, 130, 140))
    return p.img


def dy_bottle(p, t):
    off = (t * 160) % 210
    x = -260 + off
    while x < W + 200:
        bx = x
        L = p.layer()
        L.rect(bx, 1060, bx + 150, 1290, fill=(150, 210, 245, 200), r=28)
        L.rect(bx + 10, 1120, bx + 140, 1284, fill=(90, 175, 235, 210), r=22)
        p.merge(L)
        p.rect(bx + 50, 1020, bx + 100, 1064, fill=(255, 255, 255), r=8)
        p.rect(bx + 14, 1170, bx + 136, 1220, fill=(255, 255, 255))
        p.text(bx + 75, 1195, "ZAMZAM", 22, (40, 110, 70), 800)
        p.arc(bx + 128, 1100, 30, 270, 90, (240, 250, 255), 10)
        x += 210
    k = abs(math.sin(t * 2.4))
    p.rect(740, 760, 780, 760 + 160 * k, fill=(170, 180, 190))
    p.rect(715, 750 + 160 * k, 805, 790 + 160 * k, fill=(90, 100, 110), r=8)


def ov_s8(f, t, cam):
    pop(f, badge("200.000 BOTOL", 84, sub="PER HARI", rot=-3), W / 2, 560, t, T(88))
    disclaimer(f); checklist(f, t)


# ---------- S9 tanks + truck (world 2160 wide)
def truck_x(t):
    return lerp(470, 1700, ease((t - 46.3) / 3.6))


def st_truck():
    p = static_pen(2160, H)
    p.vgrad(0, 0, 2160, 1100, (100, 182, 236), (206, 236, 252))
    L = p.layer()
    for x, w, h in ((-100, 600, 300), (400, 700, 380), (1000, 600, 260), (1500, 800, 340)):
        L.poly([(x, 1100), (x + w / 2, 1100 - h), (x + w, 1100)], fill=(178, 140, 104, 255))
    p.merge(L, 3)
    # clock tower skyline
    cx = 1880
    for x, w, h in ((1700, 110, 320), (1960, 130, 360), (2060, 100, 260)):
        p.rect(x, 1100 - h, x + w, 1100, fill=(214, 206, 190))
    p.rect(cx - 80, 520, cx + 80, 1100, fill=(222, 214, 196)); p.rect(cx - 56, 300, cx + 56, 520, fill=(226, 218, 200))
    p.ell(cx, 420, 46, fill=(240, 240, 236), outline=(60, 130, 80), width=8)
    p.poly([(cx - 30, 300), (cx, 160), (cx + 30, 300)], fill=(200, 170, 90))
    p.vgrad(0, 1100, 2160, H, (226, 206, 168), (196, 172, 132))
    p.rect(0, 1190, 2160, 1330, fill=(80, 84, 90)); p.rect(0, 1186, 2160, 1196, fill=(240, 240, 240))
    for x in range(0, 2160, 120):
        p.rect(x, 1256, x + 60, 1264, fill=(250, 220, 90))
    for x0 in (60, 300):
        soft_shadow(p, x0 + 100, 1100, 130, 18, 110, 8)
        p.rect(x0, 640, x0 + 200, 1100, fill=(240, 244, 248), r=30, outline=(170, 180, 190), width=4)
        p.rect(x0, 820, x0 + 200, 860, fill=(60, 140, 210))
        p.ell(x0 + 100, 646, 100, 26, fill=(214, 222, 230))
    return p.img


def dy_truck(p, t):
    x = truck_x(t); y = 1250
    soft = p.layer(); soft.ell(x + 150, y + 62, 200, 16, fill=(0, 0, 0, 90)); p.merge(soft, 6)
    p.rect(x, y - 150, x + 250, y + 30, fill=(236, 240, 246), r=60, outline=(150, 160, 170), width=4)
    p.rect(x, y - 70, x + 250, y - 46, fill=(60, 140, 210))
    p.text(x + 125, y - 100, "ZAMZAM", 34, (40, 100, 160), 800)
    p.rect(x + 262, y - 120, x + 350, y + 30, fill=(60, 140, 210), r=14)
    p.rect(x + 300, y - 106, x + 342, y - 60, fill=(200, 230, 250), r=6)
    for wx in (x + 50, x + 190, x + 300):
        a = t * 10
        p.ell(wx, y + 40, 30, fill=(30, 30, 34)); p.ell(wx, y + 40, 12, fill=(180, 180, 186))
        p.line([(wx, y + 40), (wx + math.cos(a) * 20, y + 40 + math.sin(a) * 20)], (90, 90, 96), 4)


def ov_s9(f, t, cam):
    pop(f, label("TANGKI RAKSASA", 46), *cam.S(260, 580), t, T(95))
    pop(f, badge("PULANG KE", 56, sub="MASJIDIL HARAM", rot=-3), W / 2, 560, t, T(98))
    disclaimer(f); checklist(f, t)


# ---------- S10 mosque interior coolers
COOL = [(200, 1.0), (430, 1.0), (660, 1.0), (890, 1.0)]


def cooler(p, x, y, label_=None, lid=(70, 110, 150)):
    soft_shadow(p, x, y + 6, 90, 14, 110, 8)
    p.rect(x - 85, y - 300, x + 85, y, fill=(244, 240, 230), r=34, outline=(190, 180, 160), width=4)
    p.ell(x, y - 300, 85, 22, fill=lid)
    p.rect(x - 85, y - 230, x + 85, y - 200, fill=lid)
    p.rect(x - 14, y - 120, x + 14, y - 80, fill=(190, 190, 196), r=6)
    p.rect(x - 6, y - 82, x + 6, y - 60, fill=(160, 160, 166))
    p.text(x, y - 168, "ZAMZAM", 22, (60, 90, 120), 800)


def st_mosque():
    p = static_pen()
    p.vgrad(0, 0, W, 1250, (244, 236, 218), (226, 214, 190))
    for i in range(5):
        x = -60 + i * 300
        p.rect(x, 0, x + 70, 1250, fill=(250, 246, 236), outline=(206, 190, 160), width=3)
        p.rect(x - 10, 1180, x + 80, 1250, fill=(236, 226, 206))
        p.arc(x + 185, 520, 115, 180, 360, (200, 170, 100), 14)
        p.rect(x + 70, 520, x + 300, 1180, fill=(232, 222, 200))
    for i in range(5):
        x = -60 + i * 300
        p.ell(x + 185, 160, 60, fill=(250, 240, 210), outline=(200, 170, 100), width=4)
    p.vgrad(0, 1250, W, H, (160, 30, 44), (120, 20, 32))
    for y in range(1290, H, 110):
        p.rect(0, y, W, y + 10, fill=(200, 160, 90))
    for x, _ in COOL:
        cooler(p, x, 1240, lid=(70, 110, 150) if x != 430 else (150, 120, 80))
    return p.img


def dy_mosque(p, t):
    # petugas filling the first cooler
    x = 60; y = 1250
    person(p, x, y, 1.9, body=(214, 190, 140), skin=(190, 140, 100), head=(240, 240, 240))
    k = (math.sin(t * 2) + 1) / 2
    p.rect(x + 20, 850 - 20 * k, x + 140, 940 - 20 * k, fill=(180, 210, 230), r=14)
    L = p.layer()
    L.line([(x + 140, 900 - 20 * k), (150, 950)], (120, 200, 245, 200), 10)
    p.merge(L)


def ov_s10(f, t, cam):
    pop(f, label("RIBUAN GALON ZAMZAM", 46), W / 2, 560, t, T(108), T(113) - .2)
    pop(f, badge("COLD", 46, bg=(110, 190, 250), fg=(10, 30, 60), rot=-4), *cam.S(200, 880), t, T(115))
    pop(f, badge("NOT COLD", 46, bg=(255, 196, 110), fg=(60, 30, 0), rot=4), *cam.S(450, 780), t, T(119))
    pop(f, label("buat yang lagi radang tenggorokan", 36), W / 2, 560, t, T(125))
    disclaimer(f)


# ---------- S11 recap
NODES = [("SUMUR", 300, 330, T(132)), ("KUDAI", 780, 520, T(136)), ("DISARING", 300, 720, T(138)),
         ("DICEK LAB", 780, 900, T(139)), ("MASJIDIL HARAM", 300, 1440, T(141)), ("GELAS KAMU", 760, 1560, T(147))]


def st_recap():
    p = static_pen()
    p.vgrad(0, 0, W, H, (14, 28, 46), (8, 16, 28))
    for x in range(0, W, 90):
        p.line([(x, 0), (x, H)], (30, 46, 66), 2)
    for y in range(0, H, 90):
        p.line([(0, y), (W, y)], (30, 46, 66), 2)
    for i in range(len(NODES) - 1):
        a, b = NODES[i], NODES[i + 1]
        p.line([(a[1], a[2]), (b[1], b[2])], (50, 70, 96), 10)
    return p.img


def icon(p, i, x, y, r, c):
    ic = (14, 28, 46)
    if i == 0:
        p.rect(x - r * .5, y - r * .2, x + r * .5, y + r * .5, fill=ic, r=6); p.ell(x, y - r * .2, r * .5, r * .15, fill=c)
        p.line([(x - r * .45, y - r * .2), (x - r * .45, y - r * .6), (x + r * .45, y - r * .6), (x + r * .45, y - r * .2)], ic, r * .1)
    elif i == 1:
        p.poly([(x - r * .6, y + r * .45), (x - r * .6, y - r * .1), (x - r * .2, y - r * .4), (x - r * .2, y - r * .1),
                (x + r * .2, y - r * .4), (x + r * .2, y - r * .1), (x + r * .6, y - r * .4), (x + r * .6, y + r * .45)], fill=ic)
    elif i == 2:
        p.poly([(x - r * .55, y - r * .45), (x + r * .55, y - r * .45), (x + r * .12, y + r * .1), (x + r * .12, y + r * .5),
                (x - r * .12, y + r * .5), (x - r * .12, y + r * .1)], fill=ic)
    elif i == 3:
        p.line([(x - r * .45, y), (x - r * .1, y + r * .35), (x + r * .5, y - r * .35)], ic, r * .18)
    elif i == 4:
        p.ell(x, y, r * .38, fill=ic); p.rect(x - r * .5, y, x + r * .5, y + r * .45, fill=ic)
        p.rect(x + r * .5, y - r * .55, x + r * .62, y + r * .45, fill=ic)
    else:
        p.poly([(x - r * .38, y - r * .5), (x + r * .38, y - r * .5), (x + r * .28, y + r * .5), (x - r * .28, y + r * .5)], fill=ic)


def dy_recap(p, t):
    for i in range(len(NODES) - 1):
        a, b = NODES[i], NODES[i + 1]
        k = ease((t - a[3]) / max(.3, (b[3] - a[3]) * .8))
        if k > 0:
            ex, ey = lerp(a[1], b[1], k), lerp(a[2], b[2], k)
            L = p.layer(); L.line([(a[1], a[2]), (ex, ey)], GREEN + (120,), 34); p.merge(L, 10)
            p.line([(a[1], a[2]), (ex, ey)], GREEN, 10)
            if k < 1:
                droplet(p, ex, ey, 18, fill=(120, 205, 245))
    for i, (name, x, y, t0) in enumerate(NODES):
        on = t >= t0
        sc = backout((t - t0) / .35) if on else 0.8
        r = 70 * (0.8 + .2 * sc) if on else 56
        c = GREEN if on else (60, 80, 106)
        p.ell(x, y, r, fill=c)
        icon(p, i, x, y, r, c)


def ov_s11(f, t, cam):
    for i, (name, x, y, t0) in enumerate(NODES):
        side = 1 if x < 540 else -1
        im = label(name, 40, (255, 255, 255))
        sx, sy = cam.S(x + side * 110, y)
        pop(f, im, sx + side * im.width / 2 - side * 20, sy, t, t0)


# ---------------------------------------------------------------- scene table
class Cam:
    def __init__(s, shots, ww):
        s.shots, s.ww = shots, ww

    def at(s, t):
        sh = s.shots[0]
        for x in s.shots:
            if t >= x[0]:
                sh = x
        i = s.shots.index(sh)
        t1 = s.shots[i + 1][0] if i + 1 < len(s.shots) else s.end
        u = ease((t - sh[0]) / max(.01, t1 - sh[0]))
        a, b = sh[1], sh[2]
        cx, cy, z = (lerp(a[j], b[j], u) for j in range(3))
        hw, hh = W / 2 / z, H / 2 / z
        cx = clamp(cx, hw, s.ww - hw); cy = clamp(cy, hh, H - hh)
        s.cx, s.cy, s.z = cx, cy, z
        return cx, cy, z

    def S(s, x, y):
        return ((x - s.cx) * s.z + W / 2, (y - s.cy) * s.z + H / 2)


END = 79.1
SCENES = [
    dict(a=0.0, b=T(13), st=st_glass, dy=dy_glass, ov=lambda f, t, c: ov_s0(f, t),
         shots=[(0, (540, 1000, 1.0), (540, 990, 1.12)), (T(7) - .05, (540, 1030, 1.22), (550, 1010, 1.34))]),
    dict(a=T(13), b=T(17), st=st_map, dy=dy_s1, ov=ov_s1, shots=[(T(13), (540, 960, 1.0), (540, 940, 1.08))]),
    dict(a=T(17), b=T(32), st=st_kaaba, dy=dy_kaaba, ov=ov_s2,
         shots=[(T(17), (540, 690, 1.42), (560, 680, 1.55)), (T(25), (620, 760, 1.5), (680, 980, 1.5)),
                (T(28), (540, 960, 1.0), (560, 1050, 1.08))]),
    dict(a=T(32), b=T(37), st=st_dulu, dy=dy_dulu, ov=ov_s3, shots=[(T(32), (540, 980, 1.08), (540, 900, 1.22))]),
    dict(a=T(37), b=T(45), st=st_pump, dy=dy_pump, ov=ov_s4,
         shots=[(T(37), (540, 960, 1.0), (540, 960, 1.12)), (T(42), (380, 1050, 1.55), (440, 1020, 1.68))]),
    dict(a=T(45), b=T(64), st=st_map, dy=dy_s5, ov=ov_s5,
         shots=[(T(45), (540, 560, 1.45), (540, 600, 1.55)), (T(52), (560, 760, 1.25), (590, 1180, 1.25)),
                (T(59) - .1, (540, 960, 1.0), (540, 960, 1.06))]),
    dict(a=T(64), b=T(74), st=st_factory, dy=dy_factory, ov=ov_s6,
         shots=[(T(64), (540, 960, 1.0), (540, 940, 1.1)), (T(69) - .05, (540, 1000, 1.45), (540, 1080, 1.58))]),
    dict(a=T(74), b=T(83), st=st_lab, dy=dy_lab, ov=ov_s7,
         shots=[(T(74), (520, 1000, 1.18), (520, 1020, 1.3)), (T(79) - .05, (560, 960, 1.05), (560, 960, 1.14))]),
    dict(a=T(83), b=T(91), st=st_bottle, dy=dy_bottle, ov=ov_s8,
         shots=[(T(83), (540, 1100, 1.3), (620, 1100, 1.42)), (T(88) - .3, (540, 960, 1.0), (540, 960, 1.08))]),
    dict(a=T(91), b=T(103), st=st_truck, dy=dy_truck, ov=ov_s9, ww=2160,
         shots=[(T(91), (540, 900, 1.02), (620, 900, 1.1)), (T(97) - .1, (1050, 1000, 1.12), (1750, 1000, 1.12))]),
    dict(a=T(103), b=T(127), st=st_mosque, dy=dy_mosque, ov=ov_s10,
         shots=[(T(103), (540, 960, 1.0), (540, 960, 1.1)), (T(113) - .1, (330, 1060, 1.6), (360, 1060, 1.7)),
                (T(121) - .1, (560, 1000, 1.22), (520, 1000, 1.15))]),
    dict(a=T(127), b=T(149), st=st_recap, dy=dy_recap, ov=ov_s11,
         shots=[(T(127), (540, 960, 1.0), (540, 960, 1.05)), (T(139) - .1, (540, 1000, 1.08), (540, 980, 1.02))]),
    dict(a=T(149), b=T(160) - .4, st=st_map, dy=dy_s12, ov=ov_s12, shots=[(T(149), (540, 960, 1.0), (540, 960, 1.08))]),
    dict(a=T(160) - .4, b=END, st=st_glass, dy=dy_glass, ov=lambda f, t, c: ov_s13(f, t),
         shots=[(T(160) - .4, (540, 1000, 1.2), (540, 1000, 1.36))]),
]
SCENES[0]["a"] = 0.0


def make_frame(sc, static, cam, t):
    cx, cy, z = cam.at(t)
    box = ((cx - W / 2 / z) * SS, (cy - H / 2 / z) * SS, (cx + W / 2 / z) * SS, (cy + H / 2 / z) * SS)
    fr = static.resize((W, H), Image.BILINEAR, box=box)
    p = Pen(fr, cx - W / 2 / z, cy - H / 2 / z, z)
    sc["dy"](p, t)
    sc["ov"](fr, t, cam)
    return fr


def setup(i):
    sc = SCENES[i]
    st = sc["st"]()
    cam = Cam(sc["shots"], sc.get("ww", W)); cam.end = sc["b"]
    return sc, st, cam


def main():
    mode = sys.argv[1]
    i = int(sys.argv[2])
    sc, st, cam = setup(i)
    if mode == "still":
        t = float(sys.argv[3])
        make_frame(sc, st, cam, t).convert("RGB").save(sys.argv[4]); return
    out = sys.argv[3]
    n0 = round(sc["a"] * FPS); n1 = round(sc["b"] * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                           "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for n in range(n0, n1):
        ff.stdin.write(make_frame(sc, st, cam, n / FPS).convert("RGB").tobytes())
    ff.stdin.close(); ff.wait()


if __name__ == "__main__":
    main()
