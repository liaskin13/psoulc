---
name: commands
description: "Skill for the Commands area of psoulc. 45 symbols across 7 files."
---

# Commands

45 symbols | 7 files | Cohesion: 94%

## When to Use

- Working with code in `skills/`
- Understanding how handle_geometry_command, create_cube, create_sphere work
- Modifying commands-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `skills/blender-astro/addon/commands/geometry.py` | create_cube, create_sphere, create_cylinder, create_plane, create_cone (+9) |
| `skills/blender-astro/addon/commands/material.py` | create_material, list_materials, delete_material, assign_material, list_object_materials (+5) |
| `skills/blender-astro/addon/commands/modifier.py` | add_modifier, apply_modifier, list_modifiers, remove_modifier, toggle_modifier (+3) |
| `skills/blender-astro/addon/websocket_server.py` | handle_geometry_command, handle_material_command, handle_modifier_command, handle_collection_command, handle_object_command |
| `skills/blender-astro/addon/commands/collection.py` | create_collection, list_collections, add_to_collection, remove_from_collection, delete_collection |
| `skills/blender-astro/addon/commands/import_.py` | import_fbx, import_dae |
| `skills/blender-astro/addon/utils/security.py` | validate_file_path |

## Entry Points

Start here when exploring this area:

- **`handle_geometry_command`** (Function) — `skills/blender-astro/addon/websocket_server.py:224`
- **`create_cube`** (Function) — `skills/blender-astro/addon/commands/geometry.py:17`
- **`create_sphere`** (Function) — `skills/blender-astro/addon/commands/geometry.py:50`
- **`create_cylinder`** (Function) — `skills/blender-astro/addon/commands/geometry.py:92`
- **`create_plane`** (Function) — `skills/blender-astro/addon/commands/geometry.py:134`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handle_geometry_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 224 |
| `create_cube` | Function | `skills/blender-astro/addon/commands/geometry.py` | 17 |
| `create_sphere` | Function | `skills/blender-astro/addon/commands/geometry.py` | 50 |
| `create_cylinder` | Function | `skills/blender-astro/addon/commands/geometry.py` | 92 |
| `create_plane` | Function | `skills/blender-astro/addon/commands/geometry.py` | 134 |
| `create_cone` | Function | `skills/blender-astro/addon/commands/geometry.py` | 167 |
| `create_torus` | Function | `skills/blender-astro/addon/commands/geometry.py` | 209 |
| `get_vertices` | Function | `skills/blender-astro/addon/commands/geometry.py` | 395 |
| `move_vertex` | Function | `skills/blender-astro/addon/commands/geometry.py` | 422 |
| `subdivide_mesh` | Function | `skills/blender-astro/addon/commands/geometry.py` | 458 |
| `extrude_face` | Function | `skills/blender-astro/addon/commands/geometry.py` | 499 |
| `handle_material_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 385 |
| `create_material` | Function | `skills/blender-astro/addon/commands/material.py` | 16 |
| `list_materials` | Function | `skills/blender-astro/addon/commands/material.py` | 46 |
| `delete_material` | Function | `skills/blender-astro/addon/commands/material.py` | 66 |
| `assign_material` | Function | `skills/blender-astro/addon/commands/material.py` | 91 |
| `list_object_materials` | Function | `skills/blender-astro/addon/commands/material.py` | 134 |
| `set_material_base_color` | Function | `skills/blender-astro/addon/commands/material.py` | 164 |
| `set_material_metallic` | Function | `skills/blender-astro/addon/commands/material.py` | 206 |
| `set_material_roughness` | Function | `skills/blender-astro/addon/commands/material.py` | 244 |

## How to Explore

1. `gitnexus_context({name: "handle_geometry_command"})` — see callers and callees
2. `gitnexus_query({query: "commands"})` — find related execution flows
3. Read key files listed above for implementation details
