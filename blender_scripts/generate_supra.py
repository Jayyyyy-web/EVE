"""
EVE procedural Toyota Supra MK5 (A90) body — trimesh only, no Blender.

Replaces the previously-downloaded/decimated real scan. Built as a smooth
loft (a sequence of cross-section rings connected into a continuous shell)
rather than stacked boxes, so the silhouette reads as a car and not a set
of blocks: long hood, fastback double-bubble-ish roofline, wide rear
haunches, ducktail spoiler. Wheel arches are cut into the loft by pushing
any ring point that falls inside a clearance disk around each wheel hub
outward onto that disk, so the wheels (added separately at render time via
WheelSet) never clip through the body.

Axis convention matches frontend/src/data/wheelHardpoints.js:
  X = left(+)/right(-), Y = up, Z = front(+)/rear(-)
"""
import math
import os
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

# Run with `pip install trimesh pygltflib numpy` then
# `python blender_scripts/generate_supra.py` from the repo root.
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "assets", "vehicles")
os.makedirs(OUT_DIR, exist_ok=True)

# ---- wheel hardpoints (must match frontend/src/data/wheelHardpoints.js) ----
HUB_X = 0.80
HUB_Y = 0.35
WHEEL_R = 0.35
FRONT_Z = 1.65
REAR_Z = -1.30
CLEARANCE_R = WHEEL_R * 1.28

N = 24  # points per cross-section ring


def superellipse_ring(hw, bot, top, p=4.2, n=N):
    mid = (top + bot) / 2
    halfh = (top - bot) / 2
    pts = []
    for i in range(n):
        theta = 2 * math.pi * i / n
        c, s = math.cos(theta), math.sin(theta)
        x = hw * (abs(c) ** (2 / p)) * (1 if c >= 0 else -1)
        y = mid + halfh * (abs(s) ** (2 / p)) * (1 if s >= 0 else -1)
        pts.append([x, y])
    return pts


def apply_wheel_clearance(pts, center, r, hw_clamp):
    out = []
    for x, y in pts:
        dx, dy = x - center[0], y - center[1]
        d = math.hypot(dx, dy)
        if 1e-6 < d < r:
            k = r / d
            nx, ny = center[0] + dx * k, center[1] + dy * k
            nx = max(-hw_clamp, min(hw_clamp, nx))
            ny = max(0.14, ny)
            out.append([nx, ny])
        else:
            out.append([x, y])
    return out


def station(z, hw, bot, top, wheel_z=None):
    pts = superellipse_ring(hw, bot, top)
    if wheel_z is not None:
        pts = apply_wheel_clearance(pts, (HUB_X, HUB_Y), CLEARANCE_R, hw)
        pts = apply_wheel_clearance(pts, (-HUB_X, HUB_Y), CLEARANCE_R, hw)
    return [[x, y, z] for x, y in pts]


# ---- station table: (z, half_width, floor_y, top_y, is_wheel_station) ----
STATIONS = [
    (2.30, 0.32, 0.34, 0.54, False),   # nose tip
    (2.05, 0.84, 0.20, 0.62, False),   # front bumper / fascia
    (1.80, 0.92, 0.18, 0.70, False),   # front fender lead-in
    (FRONT_Z, 0.94, 0.20, 0.74, True),  # front fender peak (wheel arch)
    (1.45, 0.88, 0.20, 0.78, False),   # fender trailing edge
    (1.05, 0.78, 0.22, 0.86, False),   # cowl / windshield base
    (0.55, 0.60, 0.24, 1.29, False),   # windshield top / roof front
    (-0.10, 0.58, 0.24, 1.31, False),  # roof peak (set back, fastback)
    (-0.75, 0.64, 0.22, 1.06, False),  # roofline drop / decklid start
    (-1.05, 0.86, 0.20, 0.80, False),  # rear fender lead-in
    (REAR_Z, 0.96, 0.20, 0.76, True),   # rear fender peak (wheel arch, widest)
    (-1.55, 0.90, 0.18, 0.68, False),  # fender trailing edge
    (-1.85, 0.86, 0.18, 0.66, False),  # rear bumper / fascia
    (-2.15, 0.36, 0.32, 0.56, False),  # tail tip
]

RUBBER_LIKE = None  # unused


def build_body_shell():
    rings = []
    for z, hw, bot, top, is_wheel in STATIONS:
        rings.append(station(z, hw, bot, top, wheel_z=z if is_wheel else None))

    verts = []
    faces = []
    n_rings = len(rings)
    for ring in rings:
        verts.extend(ring)

    for r in range(n_rings - 1):
        base_a = r * N
        base_b = (r + 1) * N
        for i in range(N):
            j = (i + 1) % N
            a0, a1 = base_a + i, base_a + j
            b0, b1 = base_b + i, base_b + j
            faces.append([a0, b0, a1])
            faces.append([a1, b0, b1])

    # end caps: fan from centroid
    front_centroid_idx = len(verts)
    fc = np.mean(rings[0], axis=0)
    verts.append(fc.tolist())
    for i in range(N):
        j = (i + 1) % N
        faces.append([front_centroid_idx, i, j])

    rear_centroid_idx = len(verts)
    rc = np.mean(rings[-1], axis=0)
    verts.append(rc.tolist())
    base = (n_rings - 1) * N
    for i in range(N):
        j = (i + 1) % N
        faces.append([rear_centroid_idx, base + j, base + i])

    mesh = trimesh.Trimesh(vertices=np.array(verts), faces=np.array(faces), process=True)
    mesh.fix_normals()
    return mesh


def mat(name, color, metallic=0.75, rough=0.35, alpha=1.0, emissive=None):
    kwargs = dict(name=name, baseColorFactor=[*color, alpha], metallicFactor=metallic, roughnessFactor=rough)
    if emissive:
        kwargs["emissiveFactor"] = emissive
    if alpha < 1.0:
        kwargs["alphaMode"] = "BLEND"
    return PBRMaterial(**kwargs)


def box(name, extents, center, material, rot=None):
    b = trimesh.creation.box(extents=extents)
    if rot:
        b.apply_transform(trimesh.transformations.euler_matrix(*rot))
    b.apply_translation(center)
    b.visual = trimesh.visual.TextureVisuals(material=material)
    b.metadata["name"] = name
    return b


def build_canopy(paint_color):
    """Greenhouse glass insert, sitting inside the loft roof region."""
    glass = mat("Glass", [0.08, 0.12, 0.16], metallic=0.1, rough=0.08, alpha=0.35)
    pts_top = [
        (0.86, 0.30, 0.50), (0.02, 0.05, 0.05), (0.90, -0.78, 0.30), (0.02, -1.0, 0.05),
    ]
    # simple windshield + backlight as two angled quads (kept low-poly on purpose)
    parts = []
    windshield = trimesh.creation.box(extents=[1.0, 0.02, 0.62])
    windshield.apply_transform(trimesh.transformations.euler_matrix(math.radians(52), 0, 0))
    windshield.apply_translation([0, 0.98, 0.72])
    windshield.visual = trimesh.visual.TextureVisuals(material=glass)
    parts.append(windshield)

    backlight = trimesh.creation.box(extents=[0.98, 0.02, 0.62])
    backlight.apply_transform(trimesh.transformations.euler_matrix(math.radians(-38), 0, 0))
    backlight.apply_translation([0, 0.98, -0.62])
    backlight.visual = trimesh.visual.TextureVisuals(material=glass)
    parts.append(backlight)

    side_l = trimesh.creation.box(extents=[0.02, 0.36, 1.05])
    side_l.apply_translation([0.58, 1.02, 0.05])
    side_l.visual = trimesh.visual.TextureVisuals(material=glass)
    parts.append(side_l)

    side_r = side_l.copy()
    side_r.apply_translation([-1.16, 0, 0])
    parts.append(side_r)

    return parts


def build_lights():
    head_mat = mat("Headlight", [0.9, 0.93, 1.0], metallic=0.1, rough=0.1, emissive=[3.0, 3.0, 3.2])
    tail_mat = mat("Taillight", [0.9, 0.05, 0.04], metallic=0.1, rough=0.15, emissive=[2.2, 0.15, 0.1])

    parts = []
    for side in (1, -1):
        hl = trimesh.creation.box(extents=[0.30, 0.10, 0.08])
        hl.apply_translation([side * 0.62, 0.50, 2.06])
        hl.visual = trimesh.visual.TextureVisuals(material=head_mat)
        parts.append(hl)

    tail_bar = trimesh.creation.box(extents=[1.55, 0.09, 0.05])
    tail_bar.apply_translation([0, 0.62, -1.88])
    tail_bar.visual = trimesh.visual.TextureVisuals(material=tail_mat)
    parts.append(tail_bar)
    return parts


def build_trim():
    dark = mat("Trim.Gloss", [0.03, 0.03, 0.035], metallic=0.2, rough=0.3)
    parts = []

    # front splitter
    parts.append(box("FrontSplitter", [1.55, 0.03, 0.22], [0, 0.185, 2.12], dark))
    # rear diffuser
    parts.append(box("RearDiffuser", [1.5, 0.05, 0.3], [0, 0.20, -2.0], dark))
    # ducktail spoiler (Supra signature)
    parts.append(box("SpoilerRiser.L", [0.05, 0.16, 0.06], [0.62, 0.88, -1.72], dark))
    parts.append(box("SpoilerRiser.R", [0.05, 0.16, 0.06], [-0.62, 0.88, -1.72], dark))
    parts.append(box("SpoilerWing", [1.42, 0.035, 0.30], [0, 0.98, -1.78], dark))
    # side mirrors
    parts.append(box("Mirror.L", [0.05, 0.10, 0.18], [0.86, 0.92, 0.48], dark))
    parts.append(box("Mirror.R", [0.05, 0.10, 0.18], [-0.86, 0.92, 0.48], dark))
    # grille insert
    parts.append(box("Grille", [0.62, 0.14, 0.03], [0, 0.34, 2.17], dark))
    # exhaust tips
    exhaust_mat = mat("ExhaustTip", [0.55, 0.56, 0.58], metallic=0.95, rough=0.2)
    for side in (1, -1):
        tip = trimesh.creation.cylinder(radius=0.055, height=0.12, sections=16)
        tip.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
        tip.apply_translation([side * 0.38, 0.22, -2.14])
        tip.visual = trimesh.visual.TextureVisuals(material=exhaust_mat)
        parts.append(tip)

    return parts


def build(paint_color=(0.486, 0.361, 1.0)):
    body_mat = mat("Body.Paint", paint_color, metallic=0.6, rough=0.28)
    shell = build_body_shell()
    shell.visual = trimesh.visual.TextureVisuals(material=body_mat)

    scene = trimesh.Scene()
    scene.add_geometry(shell, node_name="Body")
    for i, p in enumerate(build_canopy(paint_color)):
        scene.add_geometry(p, node_name=f"Canopy_{i}")
    for i, p in enumerate(build_lights()):
        scene.add_geometry(p, node_name=f"Light_{i}")
    for i, p in enumerate(build_trim()):
        scene.add_geometry(p, node_name=f"Trim_{i}")
    return scene


if __name__ == "__main__":
    scene = build()
    out_path = os.path.join(OUT_DIR, "supra_mk5.glb")
    scene.export(out_path)
    tri_count = sum(len(g.faces) for g in scene.geometry.values())
    size_kb = os.path.getsize(out_path) / 1024
    print(f"supra_mk5.glb -> {out_path}  ({tri_count} tris, {size_kb:.1f} KB)")
    print("bounds:", scene.bounds.tolist())
