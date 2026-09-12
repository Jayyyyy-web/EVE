import bpy
import math
import os
from pathlib import Path
from mathutils import Vector


# ============================================================
# EVE — Supra MK5 (stylized approximation)
#
# This is a low-poly, proportions-inspired approximation of the
# 2020+ Toyota Supra (MK5/A90), built from primitive shapes.
# It is NOT a dimensionally accurate replica — real panel curves,
# exact measurements, and surfacing are far more complex than boxes
# and bevels can capture. Treat this as a stand-in that evokes the
# car's silhouette and character lines, not a CAD-accurate model.
# ============================================================

VEHICLE_ID = "supra_mk5"
DISPLAY_NAME = "Supra MK5 (Stylized)"
PREFIX = "EVE_SUP_"


# ============================================================
# PROJECT PATH
# ============================================================

def find_repo_root():
    candidates = []
    env_root = os.environ.get("EVE_ROOT")
    if env_root:
        candidates.append(Path(env_root).resolve())
    candidates.append(Path.home() / "OneDrive" / "Desktop" / "EVE")
    if bpy.data.filepath:
        candidates.append(Path(bpy.data.filepath).resolve().parent)
    candidates.append(Path.cwd().resolve())
    for start in candidates:
        for p in [start, *start.parents]:
            if (p / "frontend").is_dir():
                return p
    raise RuntimeError(
        "EVE project root not found. Set the EVE_ROOT environment variable "
        "to your EVE repository folder (for example C:/Users/Mckay/OneDrive/Desktop/EVE)."
    )


ROOT = find_repo_root()
ASSET_DIR = ROOT / "frontend" / "public" / "assets" / "vehicles"
ASSET_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# MATERIALS
# ============================================================

def mat(name, base, metallic=0.0, roughness=0.45):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.diffuse_color = (*base, 1.0)
    if not m.use_nodes:
        m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return m


BODY = mat("EVE_SUP_Body", (0.62, 0.06, 0.05), 0.55, 0.28)      # Renaissance-red-ish
DARK = mat("EVE_SUP_Dark", (0.012, 0.015, 0.018), 0.15, 0.28)
GLASS = mat("EVE_SUP_Glass", (0.02, 0.05, 0.07), 0.05, 0.10)
RUBBER = mat("EVE_SUP_Rubber", (0.008, 0.009, 0.010), 0.0, 0.62)
METAL = mat("EVE_SUP_Metal", (0.18, 0.20, 0.22), 0.9, 0.20)
BRAKE = mat("EVE_SUP_Brake", (0.55, 0.035, 0.025), 0.55, 0.25)
LIGHT_F = mat("EVE_SUP_LightF", (0.85, 0.92, 1.0), 0.1, 0.1)
LIGHT_R = mat("EVE_SUP_LightR", (0.85, 0.08, 0.05), 0.1, 0.1)
INTERIOR = mat("EVE_SUP_Interior", (0.02, 0.02, 0.022), 0.05, 0.4)


# ============================================================
# COLLECTIONS
# ============================================================

def clean():
    for obj in list(bpy.data.objects):
        if obj.name.startswith(PREFIX):
            bpy.data.objects.remove(obj, do_unlink=True)


def collection(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


COL_BODY = collection("EVE_SUP_BODY")
COL_POWER = collection("EVE_SUP_POWERTRAIN")
COL_WHEELS = collection("EVE_SUP_WHEELS")
COL_INTERIOR = collection("EVE_SUP_INTERIOR")
COL_LIGHTS = collection("EVE_SUP_LIGHTING")
COL_COMPONENTS = collection("EVE_SUP_COMPONENTS")


def move_to(obj, col):
    target = bpy.data.collections.get(col.name)
    if target is None:
        target = bpy.data.collections.new(col.name)
        bpy.context.scene.collection.children.link(target)
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    target.objects.link(obj)
    return obj


# ============================================================
# PRIMITIVES
# ============================================================

def cube(name, loc, scale, material, bevel=0.15, col=None):
    if col is None:
        col = COL_BODY
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = PREFIX + name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new("Soft panel edges", "BEVEL")
        mod.width = bevel
        mod.segments = 4
    o.data.materials.append(material)
    return move_to(o, col)


def uv(name, loc, scale, material, col=None, seg=32, rings=16):
    if col is None:
        col = COL_BODY
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o = bpy.context.object
    o.name = PREFIX + name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    return move_to(o, col)


def cyl(name, loc, radius, depth, material, rotation=(0.0, 0.0, 0.0), col=None, vertices=32):
    if col is None:
        col = COL_COMPONENTS
    # Rotation applied after creation (avoids a Blender 5.x operator quirk
    # where passing rotation directly into the operator can throw a
    # sequence-dimension error).
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = bpy.context.object
    o.name = PREFIX + name
    o.rotation_euler = Vector(rotation)
    o.data.materials.append(material)
    bevel = o.modifiers.new("Edge bevel", "BEVEL")
    bevel.width = 0.02
    bevel.segments = 2
    return move_to(o, col)


# ============================================================
# WHEELS (staggered: slightly larger rear, like the real car)
# ============================================================

def wheel(side, axle, x, y, radius):
    w = cyl(
        f"Wheel_{axle}_{side}", (x, y, radius), radius, 0.27, RUBBER,
        rotation=(0.0, math.pi / 2, 0.0), col=COL_WHEELS
    )
    w["component_type"] = "wheel"
    w["wheel_size_in"] = 19
    w["swap_slot"] = f"{axle}_{side}"

    hub = cyl(
        f"WheelHub_{axle}_{side}",
        (x + (-0.14 if x < 0 else 0.14), y, radius), 0.23, 0.29, METAL,
        rotation=(0.0, math.pi / 2, 0.0), col=COL_WHEELS
    )
    brake = cyl(
        f"Brake_{axle}_{side}",
        (x + (-0.15 if x < 0 else 0.15), y, radius), 0.155, 0.30, BRAKE,
        rotation=(0.0, math.pi / 2, 0.0), col=COL_WHEELS
    )
    return w, hub, brake


# ============================================================
# VEHICLE
# ============================================================

def create_vehicle():
    # Coordinate system: X = width, Y = length, Z = height. Front = +Y.
    # Rough scale target: ~4.38m long, ~1.85m wide, ~1.29m tall,
    # ~2.47m wheelbase — approximating the real MK5's proportions.

    # --- Main body: long hood, cab-rearward, low stance ---
    cube("Body_Main", (0, -0.05, 0.60), (0.90, 2.15, 0.36), BODY, 0.22)
    cube("Body_Lower", (0, -0.05, 0.38), (0.96, 1.95, 0.16), DARK, 0.10)

    # Long hood — front-engine proportions, ~40% of body length
    cube("Hood", (0, 1.15, 0.92), (0.80, 0.85, 0.09), BODY, 0.08)
    # Center hood power-bulge line
    cube("HoodBulge", (0, 1.15, 0.98), (0.10, 0.80, 0.02), BODY, 0.02)

    # Short rear deck (fastback puts most of the slope into the roof, not the deck)
    cube("RearDeck", (0, -1.55, 0.86), (0.86, 0.42, 0.09), BODY, 0.08)

    # --- Cabin: set well back, fastback "double bubble" roofline ---
    cabin = cube("Cabin", (0, -0.35, 1.10), (0.68, 0.88, 0.36), GLASS, 0.22)
    cabin.rotation_euler[0] = math.radians(-4)

    roof = cube("Roof", (0, -0.42, 1.36), (0.60, 0.58, 0.08), BODY, 0.12)
    roof.rotation_euler[0] = math.radians(-4)

    # Double-bubble hint: two shallow raised strips along the roof
    for x in (-0.22, 0.22):
        bubble = cube(f"RoofBubble_{'L' if x < 0 else 'R'}", (x, -0.42, 1.415), (0.14, 0.50, 0.015), BODY, 0.01)

    # --- Front fascia ---
    cube("FrontBumper", (0, 2.14, 0.58), (0.92, 0.14, 0.24), BODY, 0.08)
    cube("FrontSplitterLip", (0, 2.28, 0.34), (0.90, 0.08, 0.05), DARK, 0.02)

    # Large lower "shark nose" intake
    cube("LowerIntake", (0, 2.26, 0.44), (0.55, 0.05, 0.13), DARK, 0.03)

    # Slim split headlights (upper DRL strip + lower main beam), pulled to the outer corners
    for x, side in [(-0.62, "L"), (0.62, "R")]:
        cube(f"Headlight_Upper_{side}", (x, 2.16, 0.78), (0.16, 0.03, 0.035), LIGHT_F, 0.015, COL_LIGHTS)
        cube(f"Headlight_Lower_{side}", (x, 2.14, 0.68), (0.14, 0.03, 0.06), DARK, 0.02, COL_LIGHTS)

    # Hood vents (a Supra signature detail)
    for x in (-0.35, 0.35):
        cube(f"HoodVent_{'L' if x < 0 else 'R'}", (x, 0.95, 0.965), (0.10, 0.16, 0.012), DARK, 0.01)

    # --- Rear fascia ---
    cube("RearBumper", (0, -2.05, 0.55), (0.92, 0.14, 0.22), BODY, 0.08)
    cube("RearDiffuser", (0, -2.18, 0.34), (0.80, 0.08, 0.09), DARK, 0.03)

    # Slim wraparound taillights (not the round MK4-style lights — the MK5 uses
    # a slimmer, more angular wraparound shape)
    for x, side in [(-0.60, "L"), (0.60, "R")]:
        tail = cube(f"Taillight_{side}", (x, -2.10, 0.66), (0.16, 0.045, 0.075), LIGHT_R, 0.02, COL_LIGHTS)
        tail.rotation_euler[2] = math.radians(12 if x < 0 else -12)

    # Dual exhaust tips at the outer edges (matches the base 3.0's layout)
    for x in (-0.55, 0.55):
        cyl(f"Exhaust_{'L' if x < 0 else 'R'}", (x, -2.20, 0.34), 0.055, 0.10, METAL,
            rotation=(math.pi / 2, 0.0, 0.0), col=COL_POWER)

    # --- Integrated ducktail spoiler (subtle lip, not a raised wing) ---
    cube("DucktailSpoiler", (0, -1.78, 0.98), (0.62, 0.16, 0.025), BODY, 0.02)

    # --- Side skirts + mirrors ---
    for x, label in [(-0.94, "L"), (0.94, "R")]:
        cube(f"SideSkirt_{label}", (x, -0.05, 0.36), (0.06, 1.55, 0.09), DARK, 0.03)
        mirror = uv(f"Mirror_{label}", (x * 0.98, 0.55, 1.02), (0.10, 0.20, 0.08), DARK)
        mirror.rotation_euler[2] = math.radians(10 if x < 0 else -10)

    # --- Wide rear haunches — the Supra's most distinctive character line.
    # Modeled as fender bulges that flare noticeably beyond the greenhouse.
    for x, side in [(-0.98, "L"), (0.98, "R")]:
        front_fender = uv(f"Fender_Front_{side}", (x, 1.30, 0.62), (0.22, 0.45, 0.34), BODY)
        rear_fender = uv(f"Fender_Rear_{side}", (x * 1.05, -1.20, 0.65), (0.27, 0.55, 0.38), BODY)
        rear_fender["component_type"] = "body_panel"
        rear_fender["swap_slot"] = f"rear_fender_{side}"

    # Front fender side vents (another Supra signature)
    for x in (-1.00, 1.00):
        cube(f"FenderVent_{'L' if x < 0 else 'R'}", (x, 1.05, 0.55), (0.02, 0.14, 0.06), DARK, 0.01)

    # --- Interior (simple) ---
    cube("InteriorFloor", (0, -0.30, 0.72), (0.55, 0.80, 0.06), INTERIOR, 0.04, COL_INTERIOR)
    for x, side in [(-0.32, "L"), (0.32, "R")]:
        cube(f"Seat_{side}", (x, -0.35, 0.90), (0.19, 0.36, 0.14), INTERIOR, 0.08, COL_INTERIOR)
    cube("Dashboard", (0, 0.55, 0.98), (0.58, 0.16, 0.14), INTERIOR, 0.06, COL_INTERIOR)

    # --- Wheels: staggered, rear slightly larger (approximating the real
    # 19in front / 19in rear but wider rear — represented here as a small
    # radius bump on the rear axle) ---
    front_r = 0.345
    rear_r = 0.360
    for x, side in [(-0.96, "L"), (0.96, "R")]:
        wheel(side, "Front", x, 1.235, front_r)
        wheel(side, "Rear", x, -1.235, rear_r)

    # --- Engine (inline-6, matching the real 3.0L B58) ---
    engine = cube("Engine_I6", (0.05, 0.85, 0.58), (0.24, 0.58, 0.22), DARK, 0.10, COL_POWER)
    engine["component_type"] = "engine"
    engine["engine_family"] = "B58-style_I6_Turbo"
    engine["engine_type"] = "Inline-6 Turbo"
    engine["displacement_l"] = 3.0
    engine["power_hp"] = 382
    engine["torque_nm"] = 500
    engine["swap_slot"] = "engine"


# ============================================================
# METADATA
# ============================================================

def add_vehicle_metadata():
    root = bpy.data.objects.get(PREFIX + "Config")
    if root is not None:
        bpy.data.objects.remove(root, do_unlink=True)
    root = bpy.data.objects.new(PREFIX + "Config", None)
    bpy.context.scene.collection.objects.link(root)

    root["eve_vehicle_id"] = VEHICLE_ID
    root["display_name"] = DISPLAY_NAME
    root["category"] = "sports_coupe"
    root["is_stylized_approximation"] = True
    root["reference_vehicle"] = "Toyota Supra MK5 / A90 (approximate, not to scale)"

    root["drive"] = "RWD"
    root["transmission"] = "8-speed automatic"
    root["engine"] = "3.0L Turbo Inline-6"
    root["power_hp"] = 382
    root["torque_nm"] = 500
    root["weight_kg"] = 1542
    root["accel_0_100_kph_s"] = 4.1
    root["top_speed_kph"] = 250

    root["configurable_components"] = (
        "engine,wheels,brakes,exhaust,aero,body_panels,interior"
    )


# ============================================================
# EXPORT
# ============================================================

def export():
    out = ASSET_DIR / f"{VEHICLE_ID}.glb"
    bpy.ops.object.select_all(action="DESELECT")

    selected = []
    for obj in bpy.data.objects:
        if obj.name.startswith(PREFIX) and obj.type in {"MESH", "EMPTY"}:
            obj.select_set(True)
            selected.append(obj)

    if selected:
        bpy.context.view_layer.objects.active = selected[0]

    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        use_selection=True,
        export_materials="EXPORT",
        export_apply=True,
    )
    print(f"EVE Supra MK5 (stylized) exported: {out}")


# ============================================================
# RUN
# ============================================================

clean()
create_vehicle()
add_vehicle_metadata()
export()
