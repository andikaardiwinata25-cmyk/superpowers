import json
O = {1: 0.5, 2: 0.5 + 6.61 + 0.3, 3: 0.5 + 6.61 + 0.3 + 28.11 + 0.3}
REP = {"zam": "Zamzam", "ketangan": "ke tangan", "disini,": "di sini,", "Tawaf,": "thawaf,",
       "ngedot": "nyedot", "gak": "nggak", "kudai,": "Kudai,", "masjidil": "Masjidil",
       "Harom,": "Haram,", "disana": "Di sana", "mesjidil": "Masjidil", "harum.": "Haram.",
       "mesjid,": "masjid,", "saf.": "shaf.", "10": "10", "Ka": "Ka'bah,",
       "dia?": "dia?", "dulu": "Dulu", "sekarang": "Sekarang,", "tapi": "Tapi", "dia": "Dia",
       "airnya": "airnya"}
KEY = {"Zamzam", "10", "km", "Ka'bah,", "thawaf,", "30", "meter,", "ember,", "pompa", "raksasa",
       "Kudai,", "5", "kilometer", "pabrik", "disaring", "laboratorium,", "200", "ribu",
       "raksasa,", "pulang", "galon", "dingin,", "keluar", "kota,", "Rehlata"}
out = []
for n in (1, 2, 3):
    ws = json.load(open(f"w{n}.json"))
    i = 0
    while i < len(ws):
        w = dict(ws[i]); t = w["text"]
        nxt = ws[i + 1]["text"] if i + 1 < len(ws) else ""
        if nxt.startswith("-") or nxt.startswith("'"):
            # merge suffix
            if t == "zam":
                w["text"] = "Zamzam" + ("," if nxt.endswith(",") else "")
            elif t == "Ka":
                w["text"] = "Ka'bah,"
            else:
                w["text"] = t + nxt
            w["end"] = ws[i + 1]["end"]; i += 2
        elif t == "tangkirak":
            a, b = dict(w), dict(ws[i + 1]); a["text"] = "tangki"; b["text"] = "raksasa,"
            a["end"] = b["start"] = (w["start"] + ws[i + 1]["end"]) / 2 - 0.15
            out += [{**a, "start": a["start"] + O[n], "end": a["end"] + O[n]}]
            w = b; i += 2
        elif t == "petuga":
            a, b = dict(w), dict(ws[i + 1]); a["text"] = "petugas"; b["text"] = "ngisi"
            out += [{**a, "start": a["start"] + O[n], "end": a["end"] + O[n]}]
            w = b; i += 2
        elif t == "rehat":
            w["text"] = "Rehlata"; w["end"] = ws[i + 1]["end"]; i += 2
        else:
            w["text"] = REP.get(t, t); i += 1
        w["start"] += O[n]; w["end"] += O[n]
        out.append(w)
for w in out:
    w["key"] = w["text"] in KEY
    w["start"] = round(w["start"], 3); w["end"] = round(w["end"], 3)
# only first-sentence Zamzam is key; first-scene "Sekarang," lowercase fix
json.dump(out, open("words.json", "w"), indent=1, ensure_ascii=False)
print(" ".join(("*" if w["key"] else "") + w["text"] for w in out))
