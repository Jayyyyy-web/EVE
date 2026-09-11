import bpy
import math
import os
from pathlib import Path
from mathutils import Vector

# EVE S-01 — original sports coupe prototype.
# Broadly inspired by the proportions of modern Japanese sports coupes,
# but designed as an original vehicle rather than a recreation of any real car.
VEHICLE_ID = "eve_s01"
DISPLAY_NAME = "EVE S-01"
PREFIX = "EVE_"


def find_repo_root():
    candidates = []
    env_root = os.environ.get("EVE_ROOT")
    if env_root:
        candidates.append(Path(env_root).resolve())
    # Known local EVE project location on Windows. EVE_ROOT can override this.
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


def mat(name, base, metallic=0.0, roughness=0.45):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (*base, 1.0)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return m


BODY = mat("EVE_S01_Body", (0.055, 0.10, 0.16), 0.72, 0.23)
DARK = mat("EVE_S01_Dark", (0.012, 0.015, 0.018), 0.15, 0.28)
GLASS = mat("EVE_S01_Glass", (0.025, 0.055, 0.075), 0.05, 0.12)
RUBBER = mat("EVE_S01_Rubber", (0.008, 0.009, 0.010), 0.0, 0.62)
METAL = mat("EVE_S01_Metal", (0.18, 0.20, 0.22), 0.9, 0.20)
BRAKE = mat("EVE_S01_Brake", (0.55, 0.035, 0.025), 0.55, 0.25)
LIGHT = mat("EVE_S01_Light", (0.72, 0.90, 1.0), 0.1, 0.12)
INTERIOR = mat("EVE_S01_Interior", (0.025, 0.027, 0.03), 0.05, 0.38)


def clean():
    for obj in list(bpy.data.objects):
        if obj.name.startswith(PREFIX):
            bpy.data.objects.remove(obj, do_unlink=True)
    for c in list(bpy.data.collections):
        if c.name.startswith(PREFIX):
            bpy.data.collections.remove(c)


def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


COL_BODY = collection("EVE_S01_BODY")
COL_POWER = collection("EVE_S01_POWERTRAIN")
COL_WHEELS = collection("EVE_S01_WHEELS")
COL_INTERIOR = collection("EVE_S01_INTERIOR")
COL_LIGHTS = collection("EVE_S01_LIGHTING")
COL_COMPONENTS = collection("EVE_S01_COMPONENTS")


def move_to(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def cube(name, loc, scale, material, bevel=0.15, col=COL_BODY):
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


def uv(name, loc, scale, material, col=COL_BODY, seg=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o = bpy.context.object
    o.name = PREFIX + name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    return move_to(o, col)


def cyl(name, loc, radius, depth, material, rotation=(0, 0, 0), col=COL_COMPONENTS, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    o = bpy.context.object
    o.name = PREFIX + name
    o.data.materials.append(material)
    bevel = o.modifiers.new("Edge bevel", "BEVEL")
    bevel.width = 0.025
    bevel.segments = 2
    return move_to(o, col)


def wheel(side, axle, x, y):
    # Wheels are separate, swappable components.
    w = cyl(f"Wheel_{axle}_{side}", (x, y, 0.43), 0.43, 0.28, RUBBER, rotation=(0, math.pi / 2, 0), col=COL_WHEELS)
    w["component_type"] = "wheel"
    w["wheel_size_in"] = 20
    w["swap_slot"] = f"{axle}_{side}"
    hub = cyl(f"WheelHub_{axle}_{side}", (x + (-0.15 if x < 0 else 0.15), y, 0.43), 0.24, 0.30, METAL, rotation=(0, math.pi / 2, 0), col=COL_WHEELS)
    brake = cyl(f"Brake_{axle}_{side}", (x + (-0.16 if x < 0 else 0.16), y, 0.43), 0.16, 0.31, BRAKE, rotation=(0, math.pi / 2, 0), col=COL_WHEELS)
    return w, hub, brake


def create_vehicle():
    # Coordinate system: X = width, Y = length (front +Y), Z = up.
    # Main silhouette: long hood, compact fastback cabin, muscular rear shoulders.
    cube("Body_Main", (0, 0, 0.66), (1.02, 2.25, 0.43), BODY, 0.26)
    cube("Body_Lower", (0, -0.05, 0.43), (1.10, 2.05, 0.22), DARK, 0.14)
    cube("Hood", (0, 1.25, 1.03), (0.91, 0.78, 0.12), BODY, 0.10)
    cube("RearDeck", (0, -1.48, 0.99), (0.96, 0.55, 0.14), BODY, 0.10)

    # Cabin/glass volume with a distinct original fastback silhouette.
    cabin = cube("Cabin", (0, -0.22, 1.30), (0.78, 1.03, 0.48), GLASS, 0.27)
    cabin.rotation_euler[0] = math.radians(-2)
    roof = cube("Roof", (0, -0.28, 1.67), (0.68, 0.70, 0.10), BODY, 0.12)
    roof.rotation_euler[0] = math.radians(-3)

    # Original front treatment.
    cube("FrontBumper", (0, 2.24, 0.66), (1.03, 0.16, 0.27), BODY, 0.10)
    cube("FrontSplitter", (0, 2.40, 0.39), (1.02, 0.10, 0.07), DARK, 0.035)
    cube("Intake_Center", (0, 2.405, 0.58), (0.46, 0.025, 0.16), DARK, 0.025)
    for x in (-0.72, 0.72):
        cube("Intake_Side_" + ("L" if x < 0 else "R"), (x, 2.39, 0.61), (0.20, 0.025, 0.13), DARK, 0.025)

    # Rear diffuser / exhaust system.
    cube("RearBumper", (0, -2.22, 0.62), (1.04, 0.16, 0.27), BODY, 0.10)
    cube("RearDiffuser", (0, -2.38, 0.39), (0.88, 0.10, 0.10), DARK, 0.04)
    for x in (-0.58, 0.58):
        cyl("Exhaust_" + ("L" if x < 0 else "R"), (x, -2.40, 0.52), 0.105, 0.12, METAL, rotation=(math.pi / 2, 0, 0), col=COL_POWER)

    # Side skirts and mirrors.
    for x, label in [(-1.05, "L"), (1.05, "R")]:
        cube("SideSkirt_" + label, (x, -0.12, 0.48), (0.10, 1.55, 0.11), DARK, 0.05)
        mirror = uv("Mirror_" + label, (x * 0.92, 0.42, 1.27), (0.14, 0.25, 0.10), BODY)
        mirror.rotation_euler[2] = math.radians(8 if x < 0 else -8)

    # Muscular fender volumes.
    for x, side in [(-1.0, "L"), (1.0, "R")]:
        for y, axle in [(1.28, "Front"), (-1.27, "Rear")]:
            f = uv(f"Fender_{axle}_{side}", (x, y, 0.72), (0.25, 0.58, 0.39), BODY)
            f["component_type"] = "body_panel"
            f["swap_slot"] = f"{axle}_fender_{side}"

    # Lighting, deliberately different from any real vehicle.
    for x, side in [(-0.56, "L"), (0.56, "R")]:
        cube("Headlight_" + side, (x, 2.31, 0.88), (0.34, 0.035, 0.095), LIGHT, 0.05, COL_LIGHTS)
        cube("Taillight_" + side, (x, -2.30, 0.86), (0.36, 0.035, 0.08), LIGHT, 0.04, COL_LIGHTS)

    # Aero: compact ducktail rather than copying a real spoiler shape.
    cube("Spoiler", (0, -1.94, 1.12), (0.72, 0.12, 0.06), DARK, 0.04)
    for x in (-0.60, 0.60):
        cube("SpoilerMount_" + ("L" if x < 0 else "R"), (x, -1.92, 1.05), (0.045, 0.06, 0.12), DARK, 0.02)

    # Interior is separate for future configurable swaps.
    cube("InteriorFloor", (0, -0.15, 0.94), (0.62, 0.88, 0.08), INTERIOR, 0.05, COL_INTERIOR)
    for x, side in [(-0.38, "L"), (0.38, "R")]:
        cube("Seat_" + side, (x, -0.20, 1.15), (0.22, 0.40, 0.16), INTERIOR, 0.10, COL_INTERIOR)
    cube("Dashboard", (0, 0.64, 1.24), (0.66, 0.18, 0.17), INTERIOR, 0.08, COL_INTERIOR)
    cube("CenterConsole", (0, 0.00, 1.10), (0.16, 0.56, 0.10), INTERIOR, 0.06, COL_INTERIOR)

    # Wheels and brake assemblies.
    for x, side in [(-1.02, "L"), (1.02, "R")]:
        for y, axle in [(1.28, "Front"), (-1.28, "Rear")]:
            wheel(side, axle, x, y)

    # Engine component: intentionally generic and replaceable.
    engine = cube("Engine_V8", (0, 0.95, 0.82), (0.52, 0.48, 0.28), DARK, 0.12, COL_POWER)
    engine["component_type"] = "engine"
    engine["engine_family"] = "EVE_V8_45"
    engine["engine_type"] = "V8"
    engine["displacement_l"] = 4.5
    engine["power_hp"] = 450
    engine["torque_nm"] = 520
    engine["swap_slot"] = "engine"
    for x in (-0.25, 0.25):
        cyl("EngineCover_" + ("L" if x < 0 else "R"), (x, 0.95, 1.13), 0.10, 0.55, METAL, rotation=(0, math.pi / 2, 0), col=COL_POWER)


def add_vehicle_metadata():
    root = bpy.data.objects.new(PREFIX + "Config", None)
    bpy.context.scene.collection.objects.link(root)
    root["eve_vehicle_id"] = VEHICLE_ID
    root["display_name"] = DISPLAY_NAME
    root["category"] = "sports_coupe"
    root["drive"] = "RWD"
    root["transmission"] = "8-speed automatic"
    root["engine"] = "4.5L V8"
    root["power_hp"] = 450
    root["torque_nm"] = 520
    root["weight_kg"] = 1540
    root["accel_0_100_kph_s"] = 4.2
    root["top_speed_kph"] = 285
    root["configurable_components"] = "engine,wheels,brakes,exhaust,aero,body_panels,interior"


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
    bpy.ops.export_scene.gltf(filepath=str(out), export_format="GLB", use_selection=True, export_materials="EXPORT", export_apply=True)
    print(f"EVE S-01 exported: {out}")


clean()
create_vehicle()
add_vehicle_metadata()
export()
