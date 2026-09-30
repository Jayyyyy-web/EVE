"""
EVE procedural wheel generator.

Builds a small catalog of swappable wheel/rim models entirely in Python
(trimesh), no Blender / external downloads required. Wheels are radially
symmetric so revolve+array primitives produce convincing results.

Local space convention (matches blender_scripts/eve_s01.py's wheel()):
  - Rotation/axle axis = X
  - Wheel sits centered on its own local origin (so the frontend can
    position + mirror it at each of the 4 wheel points)
  - Outer tire radius ~0.43m, matching the existing car rig's wheel scale
  - +X is the "outward" face (visible side, where spokes/caps live)
"""
import math
import os
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

# Outputs straight into the frontend's asset folder by default. Run with
# `pip install trimesh pygltflib numpy shapely manifold3d` then
# `python blender_scripts/generate_wheels.py` from the repo root.
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "assets", "wheels")
os.makedirs(OUT_DIR, exist_ok=True)

TIRE_R = 0.430          # outer tire radius (ground contact radius)
TIRE_WIDTH = 0.26        # axial tire width
RIM_R = 0.300            # rim outer lip radius (where tire bead sits)
RIM_WIDTH = 0.235        # axial rim width (slightly narrower than tire)
HUB_R = 0.085
HUB_DEPTH = 0.05
ROTOR_R = 0.235
ROTOR_THICK = 0.018

RUBBER = PBRMaterial(name="Rubber", baseColorFactor=[0.035, 0.035, 0.038, 1.0],
                      metallicFactor=0.0, roughnessFactor=0.92)
ROTOR_MAT = PBRMaterial(name="BrakeRotor", baseColorFactor=[0.42, 0.40, 0.39, 1.0],
                         metallicFactor=0.85, roughnessFactor=0.55)
CALIPER_MAT = PBRMaterial(name="Caliper", baseColorFactor=[0.72, 0.06, 0.05, 1.0],
                           metallicFactor=0.2, roughnessFactor=0.35)


def rim_material(finish):
    presets = {
        "gunmetal": ([0.16, 0.165, 0.175, 1.0], 0.92, 0.32),
        "gloss_black": ([0.02, 0.02, 0.022, 1.0], 0.55, 0.22),
        "polished": ([0.82, 0.83, 0.85, 1.0], 1.0, 0.14),
        "bronze": ([0.42, 0.24, 0.10, 1.0], 0.95, 0.30),
    }
    color, metal, rough = presets.get(finish, presets["gunmetal"])
    return PBRMaterial(name=f"Rim_{finish}", baseColorFactor=color,
                        metallicFactor=metal, roughnessFactor=rough)


def rotate_x(mesh, angle):
    mesh.apply_transform(trimesh.transformations.rotation_matrix(angle, [1, 0, 0]))
    return mesh


def axis_to_x(mesh):
    # revolve() builds around 3D Z; rotate so the spin axis becomes X (axle direction)
    mesh.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    return mesh


def make_tire():
    # profile in (radius, axial-position-before-axis-swap) -> becomes (radius, z) then swapped to x
    half = TIRE_WIDTH / 2
    prof = np.array([
        [RIM_R * 0.97, -half * 0.94],
        [TIRE_R * 0.90, -half],
        [TIRE_R, -half * 0.55],
        [TIRE_R * 1.012, 0.0],
        [TIRE_R, half * 0.55],
        [TIRE_R * 0.90, half],
        [RIM_R * 0.97, half * 0.94],
    ])
    tire = trimesh.creation.revolve(prof, sections=64)
    axis_to_x(tire)
    tire.visual = trimesh.visual.TextureVisuals(material=RUBBER)
    return tire


def make_rim_barrel(dish=0.0):
    """dish: 0 = flush face, positive = deep-dish (face recessed inward)."""
    half = RIM_WIDTH / 2
    face_x = -half + dish * RIM_WIDTH  # face plane pulled inward for deep-dish look
    prof = np.array([
        [RIM_R, -half],
        [RIM_R * 1.01, -half + 0.012],
        [RIM_R * 0.80, face_x - 0.01],
        [HUB_R * 1.55, face_x],
        [HUB_R * 1.55, face_x + 0.02],
        [RIM_R * 0.80, face_x + 0.03],
        [RIM_R * 1.01, half - 0.012],
        [RIM_R, half],
        [RIM_R * 0.94, half],
        [RIM_R * 0.94, -half + 0.02],
    ])
    barrel = trimesh.creation.revolve(prof, sections=64)
    axis_to_x(barrel)
    return barrel, face_x


def make_hub(face_x):
    hub = trimesh.creation.cylinder(radius=HUB_R, height=HUB_DEPTH, sections=32)
    axis_to_x(hub)
    hub.apply_translation([face_x + HUB_DEPTH / 2 - 0.01, 0, 0])
    return hub


def make_rotor():
    rotor = trimesh.creation.annulus(r_min=HUB_R * 0.9, r_max=ROTOR_R, height=ROTOR_THICK, sections=48)
    axis_to_x(rotor)
    rotor.apply_translation([-RIM_WIDTH / 2 + 0.01, 0, 0])
    return rotor


def make_caliper():
    cal = trimesh.creation.box(extents=[0.075, 0.075, 0.16])
    cal.apply_translation([-RIM_WIDTH / 2 - 0.01, 0, ROTOR_R * 0.72])
    cal.visual = trimesh.visual.TextureVisuals(material=CALIPER_MAT)
    return cal


def spoke_wedge(inner_r, outer_r, face_x, thickness, taper=0.55, twist=0.0):
    """One spoke as a tapered wedge solid via extrude_polygon along the axle axis."""
    w_in = inner_r * 0.62
    w_out = outer_r * taper * 0.5
    poly_pts = [
        (0.0, -w_in), (0.0, w_in),
        (outer_r - inner_r, w_out), (outer_r - inner_r, -w_out),
    ]
    from shapely.geometry import Polygon
    poly = Polygon(poly_pts)
    spoke = trimesh.creation.extrude_polygon(poly, height=thickness)
    # extrude_polygon builds in XY with extrusion along Z; remap to wheel's face plane (Y-Z) x=axial
    spoke.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    spoke.apply_translation([face_x + thickness / 2, inner_r, 0])
    if twist:
        spoke.apply_transform(trimesh.transformations.rotation_matrix(twist, [1, 0, 0],
                                                                        point=[face_x, inner_r, 0]))
    return spoke


def array_spokes(count, inner_r, outer_r, face_x, thickness, taper=0.55, twist=0.0, material=None):
    base = spoke_wedge(inner_r, outer_r, face_x, thickness, taper, twist)
    parts = []
    for i in range(count):
        s = base.copy()
        rotate_x(s, 2 * math.pi * i / count)
        parts.append(s)
    merged = trimesh.util.concatenate(parts)
    if material is not None:
        merged.visual = trimesh.visual.TextureVisuals(material=material)
    return merged


def build_wheel(style, finish, spoke_count, dish=0.0, thickness=0.028, taper=0.55, twist=0.0):
    mat = rim_material(finish)
    tire = make_tire()
    barrel, face_x = make_rim_barrel(dish=dish)
    barrel.visual = trimesh.visual.TextureVisuals(material=mat)
    hub = make_hub(face_x)
    hub.visual = trimesh.visual.TextureVisuals(material=mat)
    rotor = make_rotor()
    rotor.visual = trimesh.visual.TextureVisuals(material=ROTOR_MAT)
    caliper = make_caliper()
    spokes = array_spokes(spoke_count, HUB_R * 1.5, RIM_R * 0.86, face_x + 0.005,
                           thickness, taper=taper, twist=twist, material=mat)

    scene = trimesh.Scene()
    scene.add_geometry(tire, node_name="Tire")
    scene.add_geometry(barrel, node_name="RimBarrel")
    scene.add_geometry(spokes, node_name="RimSpokes")
    scene.add_geometry(hub, node_name="HubCap")
    scene.add_geometry(rotor, node_name="BrakeRotor")
    scene.add_geometry(caliper, node_name="BrakeCaliper")
    scene.metadata["eve_wheel_style"] = style
    return scene


CATALOG = [
    dict(id="gt_5spoke", name="GT 5-Spoke", style="5spoke", finish="gunmetal",
         spoke_count=5, dish=0.10, thickness=0.034, taper=0.62, twist=0.0),
    dict(id="mesh_10spoke", name="Mesh 10-Spoke", style="mesh", finish="polished",
         spoke_count=10, dish=0.04, thickness=0.020, taper=0.42, twist=0.0),
    dict(id="deep_dish_6spoke", name="Deep Dish 6-Spoke", style="deep_dish", finish="gloss_black",
         spoke_count=6, dish=0.30, thickness=0.036, taper=0.58, twist=0.0),
    dict(id="turbine_12spoke", name="Turbine 12-Spoke", style="turbine", finish="bronze",
         spoke_count=12, dish=0.06, thickness=0.018, taper=0.40, twist=0.35),
]

if __name__ == "__main__":
    for spec in CATALOG:
        scene = build_wheel(
            style=spec["style"], finish=spec["finish"], spoke_count=spec["spoke_count"],
            dish=spec["dish"], thickness=spec["thickness"], taper=spec["taper"], twist=spec["twist"],
        )
        out_path = os.path.join(OUT_DIR, f"{spec['id']}.glb")
        scene.export(out_path)
        tri_count = sum(len(g.faces) for g in scene.geometry.values())
        size_kb = os.path.getsize(out_path) / 1024
        print(f"{spec['id']:20s} -> {out_path}  ({tri_count:6d} tris, {size_kb:7.1f} KB)")
