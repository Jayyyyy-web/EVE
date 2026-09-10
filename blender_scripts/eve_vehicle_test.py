import bpy
from pathlib import Path

# EVE Vehicle Pipeline v1
# Creates a small structured test vehicle and exports it as GLB.

VEHICLE_ID = "eve_test_vehicle"

# Resolve the EVE repository from the current .blend file when possible.
blend_path = Path(bpy.data.filepath).resolve() if bpy.data.filepath else None
if blend_path:
    repo_root = blend_path.parent
    while repo_root != repo_root.parent and not (repo_root / "frontend").exists():
        repo_root = repo_root.parent
else:
    repo_root = Path.cwd()

assets_dir = repo_root / "frontend" / "public" / "assets" / "vehicles"
assets_dir.mkdir(parents=True, exist_ok=True)

# Remove only objects from a previous EVE test run.
for obj in list(bpy.data.objects):
    if obj.name.startswith("EVE_"):
        bpy.data.objects.remove(obj, do_unlink=True)


def add_cube(name, location, scale):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def add_cylinder(name, location, radius, depth, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj

# Main vehicle structure.
body = add_cube("EVE_Body", (0, 0, 1.0), (2.8, 1.2, 0.45))
body.data.materials.clear()

cabin = add_cube("EVE_Cabin", (0.35, 0, 1.65), (1.45, 1.05, 0.45))

# Wheels: cylinders rotated so their axle runs across the vehicle.
for side in (-1, 1):
    for axle, x in (("Front", 1.75), ("Rear", -1.75)):
        wheel = add_cylinder(
            f"EVE_Wheel_{axle}_{'L' if side < 0 else 'R'}",
            (x, side * 1.25, 0.65),
            0.55,
            0.35,
            rotation=(1.5708, 0, 0),
        )

# Powertrain placeholder. It is intentionally separate so the real system can
# swap engines/powertrains later.
engine = add_cube("EVE_Engine_V8", (2.0, 0, 1.0), (0.55, 0.8, 0.35))
engine["engine_type"] = "V8"
engine["power_hp"] = 450
engine["torque_nm"] = 520

# Vehicle metadata for the EVE frontend.
body["eve_vehicle_id"] = VEHICLE_ID
body["display_name"] = "EVE Test Vehicle"
body["drive"] = "RWD"
body["engine"] = "V8"
body["power_hp"] = 450
body["torque_nm"] = 520

# Select the vehicle objects for a clean export.
bpy.ops.object.select_all(action="DESELECT")
for obj in bpy.data.objects:
    if obj.name.startswith("EVE_"):
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

# Save the Blender source file beside the exported asset.
blend_output = assets_dir / f"{VEHICLE_ID}.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(blend_output))

# Export GLB for Three.js / the EVE frontend.
glb_output = assets_dir / f"{VEHICLE_ID}.glb"
bpy.ops.export_scene.gltf(
    filepath=str(glb_output),
    export_format="GLB",
    use_selection=True,
)

print(f"EVE PIPELINE: exported {glb_output}")
