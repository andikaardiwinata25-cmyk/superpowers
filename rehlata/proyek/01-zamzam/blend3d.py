"""Rehlata #01 Zamzam - 3D scenes (Blender/Cycles, run with the bpy venv).
python blend3d.py <scene> still <t> out.jpg      # one test frame
python blend3d.py <scene> frames <outdir>         # whole scene -> outdir/00000.jpg + anchors.json
"""
import bpy, bmesh, math, random, sys, json, os, time
from mathutils import Vector, noise
from bpy_extras.object_utils import world_to_camera_view

FPS = 30
RX, RY = 720, 1280
FONT = "/usr/local/share/fonts/montserrat/Montserrat-800.ttf"
WORDS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "words.json")))


def T(i):
    return WORDS[i]["start"]


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x); return x * x * (3 - 2 * x)


def lerp(a, b, u):
    return a + (b - a) * u


def vlerp(a, b, u):
    return Vector(a).lerp(Vector(b), u)


# ------------------------------------------------------------------ setup helpers
def reset(sky=(0.55, 0.78, 0.95), sky_strength=1.0, bounces=(3, 1, 1, 2), samples=6):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = False
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoising_prefilter = "FAST"
        sc.cycles.denoising_quality = "FAST"
    except Exception:
        pass
    sc.cycles.max_bounces, sc.cycles.diffuse_bounces, sc.cycles.glossy_bounces, sc.cycles.transmission_bounces = (
        bounces[0] + 2, bounces[1], bounces[2], bounces[3])
    sc.cycles.transparent_max_bounces = 4
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 1.0
    sc.render.use_persistent_data = True
    sc.render.resolution_x, sc.render.resolution_y = RX, RY
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 93
    try:
        sc.view_settings.view_transform = "Standard"
        sc.view_settings.look = "None"
        sc.view_settings.exposure = -0.55
    except Exception:
        pass
    w = bpy.data.worlds.new("w"); sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (*sky, 1); bg.inputs[1].default_value = sky_strength
    return sc


_mats = {}


def mat(name, col, rough=0.5, metal=0.0, emit=0.0, transm=0.0, ior=1.45, alpha=1.0, coat=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["IOR"].default_value = ior
    b.inputs["Alpha"].default_value = alpha
    if transm:
        b.inputs["Transmission Weight"].default_value = transm
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = (*col, 1)
        b.inputs["Emission Strength"].default_value = emit
    _mats[name] = m
    return m


def tex_mat(name, kind, c1, c2, scale=5.0, rough=0.6, extra=None):
    """Procedural material: kind = brick | noise | stripes."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    tc = nt.nodes.new("ShaderNodeTexCoord")
    if kind == "brick":
        t = nt.nodes.new("ShaderNodeTexBrick")
        t.inputs["Color1"].default_value = (*c1, 1); t.inputs["Color2"].default_value = (*[c * .85 for c in c1], 1)
        t.inputs["Mortar"].default_value = (*c2, 1); t.inputs["Scale"].default_value = scale
        t.inputs["Mortar Size"].default_value = 0.03
        nt.links.new(tc.outputs["Object"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.4
        nt.links.new(t.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    else:
        t = nt.nodes.new("ShaderNodeTexNoise"); t.inputs["Scale"].default_value = scale
        t.inputs["Detail"].default_value = 6
        nt.links.new(tc.outputs["Object"], t.inputs["Vector"])
        r = nt.nodes.new("ShaderNodeValToRGB")
        r.color_ramp.elements[0].color = (*c1, 1); r.color_ramp.elements[1].color = (*c2, 1)
        if extra:
            r.color_ramp.elements[0].position, r.color_ramp.elements[1].position = extra
        nt.links.new(t.outputs["Fac"], r.inputs["Fac"]); nt.links.new(r.outputs["Color"], b.inputs["Base Color"])
        bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.15
        nt.links.new(t.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    _mats[name] = m
    return m


def _fin(o, m, bevel=0.0, smooth=False, seg=2):
    if m:
        o.data.materials.append(m)
    if bevel:
        md = o.modifiers.new("bv", "BEVEL"); md.width = bevel; md.segments = seg; md.limit_method = "ANGLE"
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
        try:
            o.data.set_sharp_from_angle(angle=math.radians(40))
        except Exception:
            pass
    return o


def box(size, loc, m, bevel=0.02, rot=(0, 0, 0), name="box"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _fin(o, m, bevel)


def cyl(r, h, loc, m, rot=(0, 0, 0), verts=48, bevel=0.0, name="cyl", r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; o.name = name
    _fin(o, m, bevel, smooth=True)
    return o


def autosmooth(o):
    try:
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shade_auto_smooth(angle=0.6)
    except Exception:
        pass


def sph(r, loc, m, seg=24, name="sph", scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    o = bpy.context.object; o.name = name
    if scale:
        o.scale = scale
    return _fin(o, m, smooth=True)


def torus(R, r, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot,
                                     major_segments=48, minor_segments=12)
    return _fin(bpy.context.object, m, smooth=True)


def text3d(s, loc, m, size=0.3, rot=(math.pi / 2, 0, 0), extrude=0.01, align="CENTER"):
    cu = bpy.data.curves.new("t", "FONT"); cu.body = s
    cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    cu.size = size; cu.extrude = extrude; cu.align_x = align; cu.align_y = "CENTER"
    o = bpy.data.objects.new("t", cu); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    cu.materials.append(m)
    return o


def empty_parent(objs, loc=(0, 0, 0)):
    e = bpy.data.objects.new("grp", None); bpy.context.scene.collection.objects.link(e); e.location = loc
    for o in objs:
        o.parent = e
        o.location = Vector(o.location) - Vector(loc)
    return e


def sun(rot=(0.75, 0.15, 0.6), strength=3.5, col=(1, 0.96, 0.9), angle=6):
    l = bpy.data.lights.new("sun", "SUN"); l.energy = strength; l.color = col; l.angle = math.radians(angle)
    o = bpy.data.objects.new("sun", l); bpy.context.scene.collection.objects.link(o); o.rotation_euler = rot
    return o


def area(loc, rot, size, energy, col=(1, 1, 1)):
    l = bpy.data.lights.new("area", "AREA"); l.size = size; l.energy = energy; l.color = col
    o = bpy.data.objects.new("area", l); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    return o


def person(loc, sc=1.0, body=None, skin=None, head=None, rotz=0):
    body = body or mat("ihram", (0.92, 0.92, 0.9), 0.7)
    skin = skin or mat("skin", (0.62, 0.42, 0.28), 0.6)
    x, y, z = loc
    parts = [cyl(0.16 * sc, 0.75 * sc, (x, y, z + 0.6 * sc), body, verts=16),
             sph(0.16 * sc, (x, y, z + 0.98 * sc), body, seg=12),
             sph(0.12 * sc, (x, y, z + 1.2 * sc), skin, seg=14),
             cyl(0.06 * sc, 0.3 * sc, (x - .07 * sc, y, z + 0.15 * sc), mat("leg", (.3, .25, .2)), verts=8),
             cyl(0.06 * sc, 0.3 * sc, (x + .07 * sc, y, z + 0.15 * sc), mat("leg", (.3, .25, .2)), verts=8)]
    if head:
        parts.append(sph(0.125 * sc, (x, y, z + 1.25 * sc), head, seg=12, scale=(1, 1, .6)))
    g = empty_parent(parts, loc); g.rotation_euler[2] = rotz
    return g


def make_cam(lens=35):
    c = bpy.data.cameras.new("cam"); c.lens = lens; c.sensor_fit = "VERTICAL"; c.sensor_height = 24
    o = bpy.data.objects.new("cam", c); bpy.context.scene.collection.objects.link(o)
    bpy.context.scene.camera = o
    return o


def aim(cam, pos, tgt):
    cam.location = pos
    cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


class Shots:
    """[(t0, (pos, tgt, lens), (pos, tgt, lens)), ...] hard cut between shots."""

    def __init__(s, shots, end):
        s.shots, s.end = shots, end

    def apply(s, cam, t):
        i = max(k for k, x in enumerate(s.shots) if t >= x[0] or k == 0)
        sh = s.shots[i]
        t1 = s.shots[i + 1][0] if i + 1 < len(s.shots) else s.end
        u = ease((t - sh[0]) / max(0.01, t1 - sh[0]))
        a, b = sh[1], sh[2]
        aim(cam, vlerp(a[0], b[0], u), vlerp(a[1], b[1], u))
        cam.data.lens = lerp(a[2], b[2], u)


def ground(size, z, m, loc=(0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(loc[0], loc[1], z))
    o = bpy.context.object; o.scale = (size[0], size[1], 1)
    o.data.materials.append(m)
    return o


# ------------------------------------------------------------------ materials (shared)
def M():
    return dict(
        marble=tex_mat("marble", "noise", (0.93, 0.92, 0.9), (0.80, 0.78, 0.75), 3, 0.25, (0.45, 0.75)),
        white=mat("white", (0.9, 0.9, 0.88), 0.45),
        cream=mat("cream", (0.88, 0.82, 0.70), 0.6),
        gold=mat("gold", (0.85, 0.62, 0.18), 0.3, 1.0),
        black=mat("kiswa", (0.02, 0.02, 0.02), 0.85),
        water=mat("water", (0.55, 0.82, 0.95), 0.05, transm=1.0, ior=1.33),
        waterflat=mat("waterflat", (0.18, 0.55, 0.85), 0.15, coat=1.0),
        glass=mat("glass", (0.95, 0.98, 1.0), 0.02, transm=1.0, ior=1.5),
        blue=mat("blue", (0.08, 0.33, 0.70), 0.35, coat=0.5),
        steel=mat("steel", (0.55, 0.6, 0.65), 0.35, 0.8),
        pipe=mat("pipe", (0.45, 0.55, 0.65), 0.4, 0.3),
        concrete=tex_mat("concrete", "noise", (0.62, 0.63, 0.64), (0.48, 0.49, 0.5), 8, 0.85),
        wood=tex_mat("wood", "noise", (0.42, 0.25, 0.12), (0.28, 0.16, 0.07), 12, 0.7),
        sand=tex_mat("sand", "noise", (0.82, 0.68, 0.48), (0.70, 0.55, 0.36), 4, 0.9),
        glow=mat("glowblue", (0.25, 0.7, 1.0), 0.3, emit=6.0),
        green=mat("green", (0.45, 0.9, 0.35), 0.4, emit=2.0),
        dark=mat("dark", (0.05, 0.05, 0.06), 0.6),
        rubber=mat("rubber", (0.04, 0.04, 0.045), 0.8),
    )


# ================================================================== SCENES
def sc_glass(final=False):
    sc = reset(sky=(0.25, 0.16, 0.09), sky_strength=0.6, bounces=(4, 1, 1, 8), samples=5)
    m = M()
    box((8, 5, 0.2), (0, 0, -0.1), m["marble"], 0.02)
    # glass tube
    bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=1.1, location=(0, 0, 0.55), vertices=64)
    g = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(g.data)
    top = [f for f in bm.faces if f.normal.z > 0.9]; bmesh.ops.delete(bm, geom=top, context="FACES"); bm.to_mesh(g.data); bm.free()
    sol = g.modifiers.new("s", "SOLIDIFY"); sol.thickness = 0.03
    _fin(g, m["glass"], smooth=True); autosmooth(g)
    w = cyl(0.385, 0.8, (0, 0, 0.44), m["water"], verts=64)
    # back wall with arches + warm lamps (bokeh)
    wall = mat("wallwarm", (0.55, 0.40, 0.26), 0.8)
    box((30, 0.4, 14), (0, 9, 5), wall, 0)
    archm = mat("arch", (0.0, 0.0, 0.0), 0.9); archm.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.16, 0.10, 0.06, 1); archm.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1.0
    for i in range(-4, 5):
        box((1.4, 0.2, 3.6), (i * 2.6, 8.75, 2.2), archm, 0)
        cyl(0.7, 0.2, (i * 2.6, 8.75, 4.0), archm, rot=(math.pi / 2, 0, 0), verts=32)
        box((0.5, 0.1, 0.9), (i * 2.6 + 1.3, 8.5, 3.4), mat("lamp", (1, 0.75, 0.4), emit=6), 0.05)
    area((-2.5, -2.5, 3.5), (0.9, 0, -0.8), 3, 500, (1, 0.9, 0.8))
    area((3, 1, 2.5), (1.2, 0, 1.4), 2, 200, (1, 0.8, 0.6))
    sun((0.9, 0, 2.6), 1.0, (1, 0.85, 0.7))
    bub = [sph(0.02, (0, 0, 0), mat("bub", (0.9, 0.97, 1), 0.1, emit=1.5), seg=10) for _ in range(14)]
    rnd = random.Random(3)
    bdat = [(rnd.uniform(-0.28, 0.28), rnd.uniform(-0.28, 0.28), rnd.uniform(.12, .3), rnd.uniform(0, 1)) for _ in bub]
    cam = make_cam(50)
    cam.data.dof.use_dof = False; cam.data.dof.focus_distance = 3.0; cam.data.dof.aperture_fstop = 2.0
    if final:
        a, b = T(160) - .4, 79.1
        shots = Shots([(a, ((0, -5.2, 1.3), (0, 0, 0.75), 35), ((0.4, -4.8, 1.25), (0, 0, 0.75), 38))], b)
    else:
        shots = Shots([(0, ((0, -5.8, 1.5), (0, 0, 0.8), 35), ((0.3, -5.0, 1.35), (0, 0, 0.78), 36)),
                       (T(7) - .05, ((-1.2, -3.6, 1.0), (0, 0, 0.62), 35), ((-0.8, -3.2, 1.0), (0, 0, 0.62), 38))], T(13))

    def upd(t):
        shots.apply(cam, t)
        cam.data.dof.focus_distance = (cam.location - Vector((0, 0, 0.6))).length
        for o, (x, y, sp, ph) in zip(bub, bdat):
            z = 0.08 + ((t * sp + ph) % 0.72)
            o.location = (x + math.sin(t * 3 + ph * 9) * .01, y, z)
    return upd, dict(glass=(0, 0, 1.2))


# ---------- map diorama (S1, S5, S12)
ROUTE = [(0, 9.2), (0.4, 7.0), (1.6, 4.5), (1.2, 2.0), (2.2, -1.0), (1.6, -4.0), (0.9, -6.5), (0.8, -8.6)]


def route_pts(n=300):
    out = []
    for i in range(n + 1):
        u = i / n * (len(ROUTE) - 1); k = min(int(u), len(ROUTE) - 2); f = u - k
        a, b = ROUTE[k], ROUTE[k + 1]
        # catmull-rom
        p0 = ROUTE[max(k - 1, 0)]; p3 = ROUTE[min(k + 2, len(ROUTE) - 1)]
        def cr(a0, a1, a2, a3):
            return 0.5 * ((2 * a1) + (-a0 + a2) * f + (2 * a0 - 5 * a1 + 4 * a2 - a3) * f * f + (-a0 + 3 * a1 - 3 * a2 + a3) * f ** 3)
        out.append((cr(p0[0], a[0], b[0], p3[0]), cr(p0[1], a[1], b[1], p3[1])))
    return out


RP = route_pts()


def curve_obj(pts, z, m, depth=0.12, off=(0, 0)):
    cu = bpy.data.curves.new("route", "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for i, (x, y) in enumerate(pts):
        sp.points[i].co = (x + off[0], y + off[1], z, 1)
    cu.bevel_depth = depth; cu.bevel_resolution = 4; cu.use_fill_caps = True
    o = bpy.data.objects.new("route", cu); bpy.context.scene.collection.objects.link(o)
    cu.materials.append(m)
    return o


def sc_map(mode):
    sc = reset(sky=(0.62, 0.80, 0.95), sky_strength=0.9, samples=6)
    m = M()
    # terrain with mountains
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=200, size=1, location=(0, 0, 0))
    t = bpy.context.object; t.scale = (26, 44, 1); bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for v in t.data.vertices:
        x, y = v.co.x, v.co.y
        d = min((x - px) ** 2 + (y - py) ** 2 for px, py in RP[::6]) ** .5
        hgt = max(0, noise.noise(Vector((x * .18, y * .18, 0.3))) + .35) * 3.2 * clamp((d - 3.0) / 3.0)
        if (x ** 2 + (y - 9.5) ** 2) < 30 or (x - .8) ** 2 + (y + 9.5) ** 2 < 14:
            hgt = 0
        v.co.z = hgt
    for p in t.data.polygons:
        p.use_smooth = True
    t.data.materials.append(tex_mat("terrain", "noise", (0.80, 0.64, 0.44), (0.55, 0.38, 0.24), 0.5, 0.95))
    rnd = random.Random(2)
    bm_ = mat("bldg", (0.90, 0.86, 0.78), 0.7); bm2 = mat("bldg2", (0.82, 0.76, 0.66), 0.7)
    for i in range(170):
        a = rnd.uniform(0, 6.28); r = rnd.uniform(2.6, 5.5)
        x = math.cos(a) * r * 1.1; y = 9.5 + math.sin(a) * r * .9
        if abs(x - 0.4) < .6 and y < 7.5:
            continue
        s = rnd.uniform(.25, .55); h = rnd.uniform(.2, 1.1) * (1.6 if r < 3.4 else 1)
        box((s, s * rnd.uniform(.7, 1.3), h), (x, y, h / 2), rnd.choice([bm_, bm2]), 0.02)
    # Masjidil Haram
    cyl(2.3, 0.12, (0, 9.5, 0.06), m["marble"], verts=64)
    for dx, dy, sx, sy in ((0, 1.4, 3.2, .5), (0, -1.4, 3.2, .5), (1.4, 0, .5, 2.4), (-1.4, 0, .5, 2.4)):
        box((sx, sy, .35), (dx, 9.5 + dy, .3), m["cream"], .03)
    for dx, dy in ((1.7, 1.7), (-1.7, 1.7), (1.7, -1.7), (-1.7, -1.7)):
        cyl(.07, 1.6, (dx, 9.5 + dy, .8), m["white"], verts=12); cyl(.09, .2, (dx, 9.5 + dy, 1.7), m["gold"], verts=12, r2=0)
    box((.38, .38, .42), (0, 9.5, .33), m["black"], .01)
    # Kudai plant
    for x, y, sx, sy, h in ((-.4, -9.6, .9, .7, .5), (.8, -9.3, 1.2, .9, .8), (2.0, -9.8, .8, .7, .45)):
        box((sx, sy, h), (x, y, h / 2), m["white"], .03); box((sx + .06, sy + .06, .08), (x, y, h + .04), m["blue"], .02)
    for x in (.3, .9):
        cyl(.25, .6, (x, -10.5, .3), m["white"], verts=24)
    # roads
    road = mat("road", (0.35, 0.34, 0.33), 0.8)
    for pts in ([(-13, 2), (-4, 3.5), (1.4, 4.5), (13, 3.8)], [(-13, -4.5), (1.6, -4.0), (13, -5.0)]):
        curve_obj(pts, 0.02, road, 0.08)
    rt = curve_obj(RP, 0.25, m["glow"], 0.13); rt.data.bevel_factor_end = 0
    back = None
    if mode == "s12":
        back = curve_obj([(x + .35, y) for x, y in RP], 0.25, mat("glowgreen", (0.4, 0.9, 0.35), 0.3, emit=5), 0.11)
        rt.data.bevel_factor_end = 1
    drop = sph(.32, (0, 0, -5), m["glow"], seg=20, scale=(1, 1, 1.25))
    drop2 = sph(.28, (0, 0, -5), mat("glowgreen", (0.4, 0.9, 0.35), 0.3, emit=5), seg=20, scale=(1, 1, 1.25))
    q = []
    if mode == "s1":
        qm = mat("qmark", (1, 1, 1), 0.3, emit=1.5)
        for (x, y) in (RP[90], RP[200]):
            q.append(text3d("?", (x + 1.4, y, 1.4), qm, size=1.6, rot=(math.radians(60), 0, 0), extrude=.12))
    sun((0.85, 0.1, 0.9), 4.0)
    cam = make_cam(35)
    if mode == "s1":
        shots = Shots([(T(13), ((0, -12, 15), (0.5, 0.5, 0), 34), ((1.5, -11, 14), (0.5, 0.5, 0), 36))], T(17))
    elif mode == "s5":
        shots = Shots([(T(45), ((-1.5, 3.5, 6.5), (0, 9.3, 0), 30), ((-1.0, 3.8, 6.0), (0, 9.3, 0), 32)),
                       (T(52), ((-3, -0.5, 9), (0.8, 5.5, 0), 32), ((-3, -10, 9), (1.2, -4.5, 0), 32)),
                       (T(59) - .1, ((0, -18, 21), (0.6, -0.5, 0), 30), ((-1, -17, 20), (0.6, -0.5, 0), 30))], T(64))
    else:
        shots = Shots([(T(149), ((6, -14, 19), (0.6, 0, 0), 30), ((-3, -15, 19), (0.6, 0, 0), 30))], T(160) - .4)

    def pos(u):
        i = int(clamp(u) * (len(RP) - 1)); return RP[i]

    def upd(t):
        shots.apply(cam, t)
        if mode == "s5":
            k = ease((t - T(53)) / (T(58) - T(53)))
            rt.data.bevel_factor_end = max(0.001, k)
            x, y = pos(k); drop.location = (x, y, .75 if k > 0 else -5)
        elif mode == "s1":
            rt.data.bevel_factor_end = 0.001
            for i, o in enumerate(q):
                o.rotation_euler[2] = math.sin(t * 2 + i) * .25
                o.scale = [ease((t - T(13) - .2 - i * .4) / .3)] * 3
        else:
            u = ((t - T(149)) / 3.0) % 1.0
            x, y = pos(u); drop.location = (x, y, .75)
            x, y = pos(1 - u); drop2.location = (x + .35, y, .7)
    return upd, dict(haram=(0, 9.5, 1.6), kudai=(-1.6, -9.6, 1.0), mid=(4.2, 0.0, 0.5), q=(1.6, 1.5, 1))


# ---------- Ka'bah cutaway
def sc_kaaba():
    sc = reset(sky=(0.50, 0.75, 0.97), sky_strength=1.0, samples=6)
    m = M()
    # floor slab (front edge y=0)
    box((22, 16, .4), (0, 8, -.2), m["marble"], .02)
    # earth layers below front edge
    layers = [(-0.4, -1.2, (0.92, 0.9, 0.86)), (-1.2, -3.0, (0.55, 0.36, 0.20)), (-3.0, -5.0, (0.46, 0.29, 0.15)),
              (-5.0, -6.6, (0.36, 0.24, 0.14)), (-6.6, -9.0, (0.28, 0.19, 0.12))]
    wx = 3.6
    bpy.ops.mesh.primitive_cylinder_add(radius=.97, depth=7.4, location=(wx, 0.0, -3.9), vertices=40)
    cutter = bpy.context.object; cutter.hide_render = True; cutter.display_type = "WIRE"
    for i, (z0, z1, c) in enumerate(layers):
        mm = tex_mat(f"earth{i}", "noise", c, tuple(v * .75 for v in c), 2.5, 0.95)
        lb = box((22, 16, z0 - z1), (0, 8, (z0 + z1) / 2), mm, 0.0)
        if z1 > -7.8:
            bo = lb.modifiers.new("hole", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = cutter; bo.solver = "EXACT"
    aq = mat("aquifer", (0.25, 0.55, 0.85), 0.3, emit=0.4)
    for x0, x1 in ((-11, wx - .97), (wx + .97, 11)):
        box((x1 - x0, .05, 1.0), ((x0 + x1) / 2, -0.03, -6.8), mat("aqf", (0.3, 0.6, 0.9), 0.4, emit=0.25, alpha=1), 0)
    # well shaft: back half of a stone tube, open towards the camera
    ring = tex_mat("wellstone", "noise", (0.36, 0.32, 0.28), (0.16, 0.14, 0.12), 6, 0.9)
    bpy.ops.mesh.primitive_cylinder_add(radius=.95, depth=7.0, location=(wx, 0.0, -3.9), vertices=40)
    rw = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(rw.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if abs(f.normal.z) > .9], context="FACES")
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, -1, 0), clear_outer=True)
    bm.to_mesh(rw.data); bm.free()
    rw.modifiers.new("s", "SOLIDIFY").thickness = .15
    _fin(rw, ring, smooth=True)
    water = half_cyl(.9, .6, (wx, 0.0, -7.05), mat("wellwater", (0.2, 0.6, 0.95), .1, emit=0.9))
    area((wx, -2.5, -3.5), (math.pi / 2, 0, 0), 2, 40, (1, 0.95, 0.85))
    cover = cyl(1.1, .12, (wx, 0.0, 0.02), m["marble"], verts=40)
    # depth marker
    mk = mat("marker", (1, 1, 1), 0.4, emit=1.0)
    cyl(.035, 6.9, (wx - 1.6, -0.25, -3.75), mk, verts=12)
    for z in (-0.3, -7.2):
        cyl(.035, .5, (wx - 1.6, -0.25, z), mk, rot=(0, math.pi / 2, 0), verts=12)
    # Ka'bah
    K = (0, 6.5)
    box((3.0, 2.6, 3.4), (K[0], K[1], 1.7), m["black"], .03)
    box((3.04, 2.64, .32), (K[0], K[1], 2.55), m["gold"], .01)
    box((.6, .06, 1.4), (K[0] + .8, K[1] - 1.31, 1.2), m["gold"], .02)
    box((3.3, 2.9, .14), (K[0], K[1], .07), m["marble"], .03)
    # Maqam/arcade background
    arc = mat("arcade", (0.92, 0.88, 0.80), 0.6); shade = mat("archshade", (0.0, 0.0, 0.0), 0.9); shade.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.32, 0.27, 0.2, 1); shade.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1.0
    box((26, 1.2, 4.5), (0, 15.5, 2.25), arc, .03)
    for i in range(-9, 10):
        box((.9, .2, 2.2), (i * 1.4, 14.85, 1.4), shade, 0); cyl(.45, .2, (i * 1.4, 14.85, 2.5), shade, rot=(math.pi / 2, 0, 0), verts=24)
    for x in (-9, 9):
        cyl(.35, 10, (x, 15.2, 5), m["white"], verts=16); cyl(.42, 1.2, (x, 15.2, 10.6), m["gold"], verts=16, r2=0)
    # pilgrims circling
    rnd = random.Random(4); pil = []
    for i in range(44):
        r = rnd.uniform(2.6, 4.6); a0 = rnd.uniform(0, 6.28); sp = rnd.uniform(.12, .2)
        g = person((0, 0, 0), sc=rnd.uniform(.7, .85), skin=mat(f"sk{i % 4}", (0.45 + i % 4 * .08, .3 + i % 4 * .05, .2), .6))
        pil.append((g, r, a0, sp))
    sun((0.8, 0.2, 0.55), 4.2)
    cam = make_cam(32)
    shots = Shots([(T(17), ((0, -7, 4.4), (0, 6.5, 2.0), 32), ((1.2, -6.4, 4.0), (0, 6.5, 2.0), 35)),
                   (T(25), ((-1.0, -6.5, 1.8), (2.4, 2.0, -0.6), 30), ((0.5, -6.0, 0.4), (3.4, 1.0, -1.8), 30)),
                   (T(28), ((1.0, -17, -1.5), (1.5, 1.0, -3.2), 32), ((2.2, -16, -2.2), (1.8, 1.0, -3.6), 34))], T(32))

    def upd(t):
        shots.apply(cam, t)
        for g, r, a0, sp in pil:
            a = a0 + t * sp
            g.location = (K[0] + math.cos(a) * r * 1.05, K[1] + math.sin(a) * r * .95, 0.0)
            g.rotation_euler[2] = a + math.pi
        water.location.z = -7.1 + math.sin(t * 2) * .03
    return upd, dict(kaaba=(-2.4, 6.5, 3.8), floor=(-3.2, 0.6, 0.2), well=(wx, -0.3, -8.0), depth=(wx - 2.9, -0.3, -3.7))


# ---------- dulu: old well
def sc_dulu():
    sc = reset(sky=(0.95, 0.72, 0.45), sky_strength=0.9, samples=6)
    m = M()
    ground((40, 40), 0, m["sand"])
    stone = tex_mat("stone2", "brick", (0.66, 0.58, 0.48), (0.42, 0.36, 0.30), 4, 0.85)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.3, depth=1.1, location=(0, 0, .55), vertices=48)
    wl = bpy.context.object; wl.modifiers.new("s", "SOLIDIFY").thickness = .28
    bm = bmesh.new(); bm.from_mesh(wl.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.z > .9], context="FACES"); bm.to_mesh(wl.data); bm.free()
    _fin(wl, stone, smooth=True)
    cyl(1.05, .05, (0, 0, .2), mat("pit", (0.01, 0.01, 0.01), 1), verts=48)
    for x in (-1.45, 1.45):
        box((.22, .22, 3.2), (x, 0, 1.6), m["wood"], .03)
    box((3.4, .26, .26), (0, 0, 3.1), m["wood"], .03)
    cyl(.25, .16, (0, 0, 2.85), m["wood"], rot=(math.pi / 2, 0, 0), verts=24)
    rope = cyl(.025, 1, (0, 0, 2), mat("rope", (0.75, 0.62, 0.4), .9), verts=8)
    bucket = [cyl(.32, .5, (0, 0, 0), m["wood"], verts=24, r2=.38), cyl(.33, .02, (0, 0, .2), m["waterflat"], verts=24),
              torus(.36, .03, (0, 0, -.12), m["steel"]), torus(.38, .03, (0, 0, .18), m["steel"])]
    bk = empty_parent(bucket)
    rnd = random.Random(1); mud = mat("mud", (0.78, 0.62, 0.44), 0.9); mud2 = mat("mud2", (0.70, 0.54, 0.38), .9)
    for i in range(14):
        x = rnd.uniform(-14, 14); y = rnd.uniform(6, 16); s = rnd.uniform(1.5, 3.2); h = rnd.uniform(1.5, 4)
        box((s, s, h), (x, y, h / 2), rnd.choice([mud, mud2]), .06)
        box((.4, .1, .7), (x - s * .2, y - s / 2 - .05, .5), mat("door", (0.3, 0.2, 0.12), .9), .02)
    drops = [sph(.04, (0, 0, -5), m["waterflat"], seg=8) for _ in range(4)]
    sun((1.1, 0.0, 0.9), 3.8, (1, 0.82, 0.6))
    cam = make_cam(35)
    shots = Shots([(T(32), ((3.2, -6.5, 2.6), (0, 0, 1.6), 35), ((2.4, -5.6, 2.3), (0, 0, 1.7), 40))], T(37))

    def upd(t):
        shots.apply(cam, t)
        k = ease((t - 16.6) / 2.1)
        z = lerp(-.4, 2.0, k)
        bk.location = (0, 0, z)
        rope.scale = (1, 1, max(.01, 2.7 - z - .3)); rope.location = (0, 0, (2.7 + z + .3) / 2 + .0)
        for i, d in enumerate(drops):
            dz = (t * 2.5 + i * .3) % 1.2
            d.location = (math.sin(i * 2) * .25, math.cos(i * 2) * .25, z - .3 - dz if k > .25 else -5)
    return upd, dict(well=(0, 0, 3.6))


# ---------- sekarang: pumps
def sc_pump():
    sc = reset(sky=(0.7, 0.75, 0.8), sky_strength=0.5, samples=6)
    m = M()
    ground((40, 40), 0, m["concrete"])
    box((30, .4, 12), (0, 6, 6), mat("wallp", (0.70, 0.74, 0.78), 0.8), 0)
    for x in range(-12, 13, 3):
        box((.3, .2, 12), (x, 5.75, 6), mat("rib", (0.62, 0.66, 0.70), .8), 0)
    flow = []
    box((24, 1.0, 1.0), (0, 3.2, 4.6), m["pipe"], .05)
    for i in range(14):
        flow.append(box((.45, .05, .34), (0, 2.68, 4.6), m["glow"], .02))
    box((24, .02, .5), (0, 2.69, 4.6), mat("pipewin", (0.05, 0.1, 0.15), .2), 0)
    blades = []; needles = []
    for cx in (-2.6, 2.6):
        box((3.8, 2.0, .4), (cx, 0, .2), mat("base", (0.25, 0.28, 0.32), .6), .04)
        motor = cyl(.85, 2.2, (cx - .7, 0, 1.3), m["blue"], rot=(0, math.pi / 2, 0), verts=48, bevel=.05)
        for k in range(9):
            torus(.88, .04, (cx - 1.6 + k * .22, 0, 1.3), m["blue"], rot=(0, math.pi / 2, 0))
        cyl(1.0, .7, (cx + 1.05, 0, 1.3), m["blue"], rot=(0, math.pi / 2, 0), verts=48, bevel=.05)
        cyl(.55, .1, (cx + 1.45, 0, 1.3), mat("grill", (0.1, 0.1, 0.12), .5), rot=(0, math.pi / 2, 0), verts=32)
        bl = []
        for b in range(4):
            bl.append(box((.04, .9, .14), (cx + 1.5, 0, 1.3), m["steel"], .01, rot=(b * math.pi / 4, 0, 0)))
        blades.append(empty_parent(bl, (cx + 1.5, 0, 1.3)))
        cyl(.32, 3.2, (cx + 1.05, 0, 3.0), m["pipe"], verts=32)
        cyl(.32, 2.0, (cx + 1.05, -.6, -.2), m["pipe"], verts=32)
        g = cyl(.28, .08, (cx + 1.05, -.36, 2.6), m["white"], rot=(math.pi / 2, 0, 0), verts=32)
        n = box((.03, .02, .22), (cx + 1.05, -.42, 2.68), mat("needle", (0.9, 0.1, 0.1), .4), 0)
        needles.append(empty_parent([n], (cx + 1.05, -.42, 2.6)))
    area((0, -4, 7), (0.6, 0, 0), 8, 1500, (0.95, 0.97, 1))
    sun((0.9, 0.3, 0.4), 1.5)
    cam = make_cam(30)
    shots = Shots([(T(37), ((0, -9.5, 3.2), (0, 0, 2.2), 30), ((1.0, -8.8, 3.0), (0, 0, 2.2), 32)),
                   (T(42), ((-6.0, -3.6, 1.8), (-2.2, 0, 1.4), 32), ((-5.4, -4.2, 2.0), (-2.0, 0, 1.4), 36))], T(45))

    def upd(t):
        shots.apply(cam, t)
        for i, f in enumerate(flow):
            f.location.x = -12 + ((i * 1.7 + t * 4.0) % 24)
        for b in blades:
            b.rotation_euler[0] = t * 9
        for i, n in enumerate(needles):
            n.rotation_euler[1] = .6 + math.sin(t * 9 + i) * .12
    return upd, dict(pump=(-2.6, 0, 2.6), title=(0, 0, 4))


# ---------- factory filters
def half_cyl(r, h, loc, m, inner=False):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=48)
    o = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, -1, 0), clear_outer=True)
    bmesh.ops.contextual_create(bm, geom=[e for e in bm.edges if e.is_boundary]) if not inner else None
    bm.to_mesh(o.data); bm.free()
    return _fin(o, m, smooth=True)


def sc_factory():
    sc = reset(sky=(0.75, 0.82, 0.9), sky_strength=0.6, samples=6)
    m = M()
    ground((40, 40), 0, mat("floorf", (0.55, 0.6, 0.65), 0.4))
    box((30, .4, 12), (0, 4.5, 6), mat("wallf", (0.82, 0.86, 0.90), .7), 0)
    for x in range(-9, 10, 3):
        box((1.6, .1, 2.0), (x, 4.28, 6.8), mat("winf", (0.75, 0.88, 1.0), .2, emit=2.5), .02)
    lay = [(3.6, 4.4, mat("ftw", (0.35, 0.65, 0.9), .1, emit=0.3)), (2.6, 3.6, tex_mat("gravel", "noise", (0.6, 0.6, 0.6), (0.3, 0.3, 0.32), 14, .9, (0.4, 0.6))),
           (1.6, 2.6, tex_mat("fsand", "noise", (0.88, 0.78, 0.56), (0.74, 0.64, 0.44), 30, .9)),
           (0.9, 1.6, mat("carbon", (0.05, 0.05, 0.06), .8)), (0.3, 0.9, tex_mat("fsand2", "noise", (0.92, 0.86, 0.70), (0.8, 0.72, 0.56), 30, .9))]
    shell = mat("tankshell", (0.85, 0.88, 0.9), .3, .6)
    drops = []
    for cx in (-2.6, 0, 2.6):
        bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=4.6, location=(cx, 0, 2.4), vertices=48)
        o = bpy.context.object; o.modifiers.new("s", "SOLIDIFY").thickness = .06
        bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, -1, 0), clear_outer=True)
        bm.to_mesh(o.data); bm.free(); _fin(o, shell, smooth=True)
        for z0, z1, mm in lay:
            half_cyl(1.03, z1 - z0, (cx, 0, (z0 + z1) / 2), mm)
        cyl(.18, 1.5, (cx, 0.4, 5.3), m["pipe"], verts=24)
        cyl(.18, .9, (cx, 0.4, -0.0), m["pipe"], verts=24)
        rnd = random.Random(int(cx * 10))
        for i in range(10):
            d = sph(.06, (0, 0, 0), m["glow"], seg=8)
            drops.append((d, cx + rnd.uniform(-.8, .8), rnd.uniform(.4, .7), rnd.uniform(0, 4)))
    box((10, .5, .5), (0, .4, 6.1), m["pipe"], .05)
    flow = [box((.4, .05, .3), (0, .12, 6.1), m["glow"], .02) for _ in range(10)]
    area((0, -6, 6), (0.8, 0, 0), 8, 1200)
    sun((0.9, 0.2, 0.3), 1.2)
    cam = make_cam(30)
    shots = Shots([(T(64), ((0, -10.5, 3.6), (0, 0, 2.6), 30), ((0.8, -9.8, 3.4), (0, 0, 2.6), 31)),
                   (T(69) - .05, ((0.8, -4.4, 3.2), (0, 0, 2.2), 32), ((0.2, -3.8, 2.4), (0, 0, 1.8), 34))], T(74))

    def upd(t):
        shots.apply(cam, t)
        for d, x, sp, ph in drops:
            d.location = (x, -.15, 4.3 - ((t * sp + ph) % 4.0))
        for i, f in enumerate(flow):
            f.location.x = -5 + ((i * 1.0 + t * 3) % 10)
    return upd, dict(top=(0, 0, 5.6), bottom=(1.6, -.2, 0.4))


# ---------- lab
def sc_lab():
    sc = reset(sky=(0.8, 0.92, 0.9), sky_strength=0.6, samples=6, bounces=(4, 1, 1, 8))
    m = M()
    ground((40, 40), 0, mat("labfloor", (0.75, 0.78, 0.8), .4))
    box((30, .4, 10), (0, 3.5, 5), mat("labwall", (0.72, 0.88, 0.85), .7), 0)
    box((8, 1.6, .12), (0, 0.4, 1.86), m["white"], .02)
    box((7.8, 1.5, 1.8), (0, 0.45, .9), mat("cab", (0.6, 0.66, 0.72), .5), .03)
    for x in (-2.9, -1.0, 1.0, 2.9):
        box((.04, .02, 1.5), (x, -.31, .9), m["steel"], 0)
    # monitor
    box((2.2, .12, 1.4), (1.8, 2.9, 3.4), m["dark"], .04)
    scr = box((2.0, .02, 1.2), (1.8, 2.83, 3.4), mat("screen", (0.06, 0.12, 0.16), .3, emit=0.5), 0)
    bars = [box((.18, .02, 1), (1.05 + i * .3, 2.81, 2.9), mat("bar", (0.2, 0.85, 0.3), .3, emit=0.8), 0) for i in range(6)]
    # rack + tubes
    box((1.8, .5, .12), (1.0, 0.3, 2.2), m["blue"], .02)
    box((1.8, .5, .08), (1.0, 0.3, 2.55), m["blue"], .02)
    for i in range(6):
        x = .35 + i * .26
        cyl(.08, .7, (x, .3, 2.4), m["glass"], verts=24)
        cyl(.068, .38, (x, .3, 2.27), m["waterflat"], verts=24)
    # beaker
    cyl(.32, .8, (-.8, .3, 2.32), m["glass"], verts=40)
    cyl(.29, .45, (-.8, .3, 2.15), m["waterflat"], verts=40)
    # scientist
    coat = mat("coat", (0.95, 0.96, 0.97), .6)
    sci = person((-2.6, .6, 0), 1.75, body=coat, skin=mat("skin2", (0.65, 0.45, 0.32), .6), head=mat("hair", (0.06, 0.05, 0.04), .7))
    gog = box((.32, .1, .08), (-2.6, .38, 2.12), mat("gog", (0.6, 0.85, 1.0), .1, emit=.3), .03)
    arm = cyl(.09, .8, (-2.2, .4, 1.55), coat, rot=(0, -.9, 0), verts=12)
    tube = [cyl(.08, .7, (0, 0, 0), m["glass"], verts=24), cyl(.068, .38, (0, 0, -.13), m["waterflat"], verts=24)]
    tb = empty_parent(tube)
    area((-2, -5, 6), (0.8, 0, -0.3), 6, 900)
    sun((0.9, 0.2, 0.5), 1.4)
    cam = make_cam(32)
    shots = Shots([(T(74), ((-1.0, -7.5, 3.2), (0, 0.5, 2.1), 32), ((-0.4, -7.0, 3.0), (0, 0.5, 2.1), 34)),
                   (T(79) - .05, ((2.8, -4.2, 3.0), (1.2, 1.0, 2.6), 32), ((2.4, -4.6, 2.9), (1.2, 1.0, 2.6), 33))], T(83))

    def upd(t):
        shots.apply(cam, t)
        lift = ease((t - 36.5) / .8) - ease((t - 38.6) / .8)
        tb.location = (-1.85, .2, 2.0 + lift * .7)
        for i, b in enumerate(bars):
            h = .2 + .8 * ease((t - 36.0 - i * .25) / 1.2) * (.5 + .5 * ((i * 37) % 10) / 10)
            b.scale = (1, 1, h); b.location.z = 2.85 + h / 2
    return upd, dict(lab=(1.8, 2.9, 4.4), ok=(1.8, 2.9, 3.4))


# ---------- bottling line
def sc_bottle():
    sc = reset(sky=(0.75, 0.8, 0.88), sky_strength=0.6, samples=6)
    m = M()
    ground((40, 40), 0, mat("floorb", (0.5, 0.55, 0.6), .4))
    box((40, .4, 12), (0, 5, 6), mat("wallb", (0.72, 0.78, 0.85), .7), 0)
    rnd = random.Random(1); card = mat("cardboard", (0.62, 0.45, 0.28), .85); tape = mat("tape", (0.78, 0.62, 0.42), .7)
    for x in range(-8, 9):
        for z in range(3):
            if rnd.random() < .85:
                box((.95, .9, .8), (x * 1.0 + rnd.uniform(-.05, .05), 3.6, .4 + z * .82), card, .02)
                box((.12, .92, .82), (x * 1.0, 3.6, .4 + z * .82), tape, 0)
    box((30, 1.2, .14), (0, 0, 1.2), m["rubber"], .03)
    box((30, 1.3, .12), (0, 0, 1.08), m["steel"], .02)
    for x in range(-15, 16):
        cyl(.07, 1.3, (x, 0, 1.07), m["steel"], rot=(math.pi / 2, 0, 0), verts=12)
    for x in range(-14, 15, 4):
        box((.12, .12, 1.0), (x, .5, .5), m["steel"], .01); box((.12, .12, 1.0), (x, -.5, .5), m["steel"], .01)
    # capper
    box((1.8, 1.4, 1.4), (1.5, 0, 4.0), mat("machine", (0.62, 0.66, 0.72), .4, .5), .06)
    box((1.4, .05, .4), (1.5, -.72, 4.3), mat("panel", (0.3, 0.85, 0.5), .3, emit=1.5), .02)
    piston = box((.2, .2, 1.2), (1.5, 0, 3.0), m["steel"], .02)
    head = box((.6, .6, .25), (1.5, 0, 2.4), m["dark"], .03)
    lbl = mat("label", (0.97, 0.97, 0.97), .5); capm = mat("cap", (0.95, 0.95, 0.95), .4)
    btl = mat("bottle", (0.55, 0.78, 0.95), .08, coat=1.0)
    tm = mat("lbltxt", (0.12, 0.45, 0.25), .5)
    bottles = []
    for i in range(10):
        parts = [box((.7, .5, 1.1), (0, 0, .55), btl, .16), box((.72, .52, .3), (0, 0, .5), lbl, .04),
                 cyl(.13, .14, (0, 0, 1.17), capm, verts=20), torus(.18, .04, (.25, 0, 1.0), btl, rot=(math.pi / 2, 0, 0)),
                 text3d("ZAMZAM", (0, -.265, .5), tm, size=.15)]
        bottles.append(empty_parent(parts))
    area((0, -6, 7), (0.7, 0, 0), 8, 1300)
    sun((0.9, 0.2, 0.4), 1.3)
    cam = make_cam(32)
    shots = Shots([(T(83), ((-2.2, -5.2, 2.4), (0.6, 0, 1.7), 32), ((-1.2, -5.0, 2.3), (1.2, 0, 1.7), 34)),
                   (T(88) - .3, ((0, -9.5, 3.2), (0, 0, 2.0), 30), ((0.6, -9.0, 3.1), (0, 0, 2.0), 31))], T(91))

    def upd(t):
        shots.apply(cam, t)
        for i, b in enumerate(bottles):
            b.location = (-10 + ((i * 2.0 + t * 1.4) % 20), 0, 1.27)
        k = abs(math.sin(t * 2.4))
        head.location.z = 2.4 + (1 - k) * .0 + k * -.0 + (.0)
        head.location.z = 2.65 - k * .35; piston.location.z = 3.25 - k * .35
    return upd, dict(top=(0, 0, 4.8))


# ---------- tanks + truck
def truck_x(t):
    return lerp(-7.5, 15.5, ease((t - 46.3) / 3.6))


def sc_truck():
    sc = reset(sky=(0.45, 0.70, 0.95), sky_strength=1.0, samples=6)
    m = M()
    ground((120, 80), 0, m["sand"])
    box((120, 3.2, .04), (0, -1, .02), mat("asphalt", (0.12, 0.12, 0.13), .8), 0)
    ym = mat("yline", (0.95, 0.8, 0.2), .5)
    for x in range(-40, 60, 3):
        box((1.4, .14, .02), (x, -1, .05), ym, 0)
    rnd = random.Random(3); rock = tex_mat("rock", "noise", (0.62, 0.45, 0.32), (0.45, 0.3, 0.2), 1.5, .95)
    for i in range(16):
        x = rnd.uniform(-30, 40); y = rnd.uniform(20, 40); r = rnd.uniform(5, 11); h = rnd.uniform(4, 9)
        cyl(r, h, (x, y, h / 2), rock, verts=7, r2=r * .15)
    tk = mat("tankw", (0.92, 0.93, 0.95), .3, .2)
    for x in (-11, -7.5):
        cyl(1.6, 4.0, (x, 3.5, 2.0), tk, verts=48, bevel=.05)
        cyl(1.62, .35, (x, 3.5, 2.6), m["blue"], verts=48)
        cyl(1.5, .25, (x, 3.5, 4.1), tk, verts=48, r2=1.2)
    # city + clock tower
    bc = mat("cityb", (0.86, 0.82, 0.74), .6)
    for i in range(10):
        x = 20 + i * 2.2 + rnd.uniform(-.5, .5); h = rnd.uniform(3, 8)
        box((1.8, 1.8, h), (x, 9 + rnd.uniform(-1, 2), h / 2), bc, .04)
    CX = 26
    box((3.2, 3.2, 14), (CX, 12, 7), mat("towerb", (0.88, 0.84, 0.76), .5), .05)
    box((2.4, 2.4, 4), (CX, 12, 16), bc, .05)
    cyl(1.0, .1, (CX, 10.75, 16.2), mat("clockf", (0.95, 0.95, 0.92), .4, emit=.6), rot=(math.pi / 2, 0, 0), verts=48)
    torus(1.0, .08, (CX, 10.7, 16.2), mat("clockg", (0.2, 0.75, 0.35), .3, emit=1.5), rot=(math.pi / 2, 0, 0))
    cyl(.9, 3.5, (CX, 12, 19.7), m["gold"], verts=24, r2=.05)
    # truck
    tw = mat("trucktank", (0.94, 0.95, 0.97), .25, .3)
    parts = [cyl(.85, 4.6, (-.4, 0, 1.55), tw, rot=(0, math.pi / 2, 0), verts=40, bevel=.03),
             cyl(.87, .3, (-.4, 0, 1.55), m["blue"], rot=(0, math.pi / 2, 0), verts=40),
             box((1.5, 1.8, 1.8), (2.8, 0, 1.45), m["blue"], .15),
             box((.05, 1.5, .8), (3.56, 0, 1.8), mat("windshield", (0.55, 0.75, 0.9), .05, .3), .02),
             box((5.8, 1.4, .3), (.4, 0, .6), m["dark"], .03),
             text3d("ZAMZAM", (-.4, -.87, 1.6), mat("trtxt", (0.08, 0.35, 0.7), .4), size=.45, extrude=.01)]
    wheels = []
    for wx in (-2.0, -.9, 2.8):
        for wy in (-.75, .75):
            w = cyl(.42, .3, (wx, wy, .42), m["rubber"], rot=(math.pi / 2, 0, 0), verts=24)
            parts.append(w); parts.append(cyl(.2, .32, (wx, wy, .42), m["steel"], rot=(math.pi / 2, 0, 0), verts=16))
    truck = empty_parent(parts)
    sun((0.85, 0.1, 0.7), 4.2)
    cam = make_cam(30)
    shots = Shots([(T(91), ((-4, -14, 4.5), (-7, 3, 2.5), 30), ((-2.5, -13.5, 4.2), (-6, 3, 2.5), 31)),
                   (T(97) - .1, ((-1, -12, 3), (2, 0, 1.5), 30), ((15, -12, 3), (19, 3, 3.0), 30))], T(103))

    def upd(t):
        shots.apply(cam, t)
        truck.location = (truck_x(t), -1.6, 0)
    return upd, dict(tanks=(-9.2, 3.5, 5.3))


# ---------- mosque interior coolers
def sc_mosque():
    sc = reset(sky=(0.9, 0.85, 0.75), sky_strength=0.4, samples=6)
    m = M()
    carpet = tex_mat("carpet", "noise", (0.55, 0.06, 0.1), (0.42, 0.04, 0.07), 20, .95)
    ground((60, 60), 0, carpet)
    gl = mat("shafline", (0.85, 0.7, 0.4), .6)
    for y in range(-6, 30, 2):
        box((60, .1, .01), (0, y, .005), gl, 0)
    for x in range(-12, 13, 4):
        for y in (6, 14, 22):
            cyl(.45, 7, (x, y, 3.5), m["marble"], verts=32)
            cyl(.6, .4, (x, y, 7.1), m["gold"], verts=32)
            cyl(.6, .3, (x, y, .15), m["marble"], verts=32)
        for y in (6, 14, 22):
            bpy.ops.mesh.primitive_torus_add(major_radius=2.0, minor_radius=.22, location=(x + 2, y, 7.3), rotation=(math.pi / 2, 0, 0))
            o = bpy.context.object
            bm = bmesh.new(); bm.from_mesh(o.data)
            bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, -1, 0), clear_outer=True)
            bm.to_mesh(o.data); bm.free(); _fin(o, mat("archst", (0.9, 0.86, 0.78), .5), smooth=True)
    box((60, 30, .4), (0, 14, 9.5), m["cream"], 0)
    for x in range(-12, 13, 4):
        for y in (10, 18):
            sph(.35, (x + 2, y, 8.6), mat("chand", (1, 0.85, 0.6), .3, emit=12), seg=16)
    # coolers
    cbody = mat("coolerbody", (0.92, 0.9, 0.84), .35, coat=.6)
    lids = [mat("lidblue", (0.15, 0.32, 0.55), .4), mat("lidbrown", (0.55, 0.38, 0.2), .4)]
    tmc = mat("coolertxt", (0.2, 0.35, 0.55), .4)
    COOL = [-3.0, -1.2, 0.6, 2.4, 4.2]
    for i, x in enumerate(COOL):
        cyl(.62, 1.6, (x, 1.5, .8), cbody, verts=40, bevel=.03)
        cyl(.64, .18, (x, 1.5, 1.68), lids[1 if i == 1 else 0], verts=40)
        cyl(.5, .12, (x, 1.5, 1.82), lids[1 if i == 1 else 0], verts=40)
        cyl(.64, .12, (x, 1.5, 1.25), lids[1 if i == 1 else 0], verts=40)
        box((.16, .2, .2), (x, .92, .7), m["steel"], .02)
        text3d("ZAMZAM", (x, .87, 1.0), tmc, size=.16)
    # petugas filling
    vest = mat("vest", (0.75, 0.62, 0.42), .7)
    person((-4.4, 1.2, 0), 1.65, body=vest, skin=mat("skin3", (0.6, 0.42, 0.3), .6), head=mat("cap", (0.95, 0.95, 0.95), .6))
    jer = box((.5, .35, .7), (-3.6, 1.2, 2.2), mat("jerry", (0.75, 0.88, 0.95), .3), .08)
    stream = cyl(.05, .5, (-3.25, 1.4, 1.95), m["water"], verts=12)
    area((0, -8, 7), (0.9, 0, 0), 10, 2600, (1, 0.92, 0.8))
    sun((0.9, 0.3, 0.5), 1.0, (1, 0.9, 0.75))
    cam = make_cam(30)
    shots = Shots([(T(103), ((-1, -8.5, 2.8), (0.5, 4, 2.0), 30), ((0.5, -8.0, 2.6), (0.5, 4, 2.0), 31)),
                   (T(113) - .1, ((-2.9, -5.6, 2.2), (-2.1, 1.5, 1.3), 40), ((-2.4, -5.4, 2.1), (-2.1, 1.5, 1.3), 44)),
                   (T(121) - .1, ((4.5, -5.5, 2.2), (0.0, 2.0, 1.2), 30), ((3.5, -5.8, 2.1), (-0.5, 2.0, 1.2), 30))], T(127))

    def upd(t):
        shots.apply(cam, t)
        k = (math.sin(t * 2) + 1) / 2
        jer.rotation_euler[1] = .5 + .3 * k
    return upd, dict(c0=(-3.0, 1.5, 2.4), c1=(-1.2, 1.5, 2.4))


SCENE = {0: lambda: sc_glass(False), 1: lambda: sc_map("s1"), 2: sc_kaaba, 3: sc_dulu, 4: sc_pump,
         5: lambda: sc_map("s5"), 6: sc_factory, 7: sc_lab, 8: sc_bottle, 9: sc_truck, 10: sc_mosque,
         12: lambda: sc_map("s12"), 13: lambda: sc_glass(True)}
RANGE = {0: (0.0, T(13)), 1: (T(13), T(17)), 2: (T(17), T(32)), 3: (T(32), T(37)), 4: (T(37), T(45)),
         5: (T(45), T(64)), 6: (T(64), T(74)), 7: (T(74), T(83)), 8: (T(83), T(91)), 9: (T(91), T(103)),
         10: (T(103), T(127)), 11: (T(127), T(149)), 12: (T(149), T(160) - .4), 13: (T(160) - .4, 79.1)}


def anchors_now(anc):
    sc = bpy.context.scene; out = {}
    for k, p in anc.items():
        v = world_to_camera_view(sc, sc.camera, Vector(p))
        out[k] = (v.x, 1 - v.y, v.z)
    return out


def main():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    i = int(a[0]); mode = a[1]
    upd, anc = SCENE[i]()
    sc = bpy.context.scene
    if mode == "still":
        upd(float(a[2])); bpy.context.view_layer.update()
        sc.render.filepath = a[3]; bpy.ops.render.render(write_still=True); return
    outdir = a[2]; os.makedirs(outdir, exist_ok=True)
    n0, n1 = round(RANGE[i][0] * FPS), round(RANGE[i][1] * FPS)
    A = {}
    if os.path.exists(f"{outdir}/anchors.json"):
        A = json.load(open(f"{outdir}/anchors.json"))
    for n in range(n0, n1):
        fp = f"{outdir}/{n:05d}.jpg"
        upd(n / FPS); bpy.context.view_layer.update()
        A[str(n)] = anchors_now(anc)
        if os.path.exists(fp):
            continue
        sc.render.filepath = fp
        _t = time.time(); bpy.ops.render.render(write_still=True); print("RT", n, round(time.time() - _t, 2), flush=True)
        if n % 15 == 0:
            json.dump(A, open(f"{outdir}/anchors.json", "w")); print("frame", n, flush=True)
    json.dump(A, open(f"{outdir}/anchors.json", "w"))


if __name__ == "__main__":
    main()
