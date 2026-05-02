---
name: addon
description: "Skill for the Addon area of psoulc. 36 symbols across 6 files."
---

# Addon

36 symbols | 6 files | Cohesion: 86%

## When to Use

- Working with code in `skills/`
- Understanding how handle_command, process_command, handle_armature_command work
- Modifying addon-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `skills/blender-astro/addon/retargeting.py` | list_armatures, get_bones, store_bone_mapping, load_bone_mapping, import_fbx (+8) |
| `skills/blender-astro/addon/websocket_server.py` | handle_command, process_command, handle_armature_command, handle_bonemapping_command, handle_import_command (+4) |
| `skills/blender-astro/addon/ui.py` | execute, execute, run_server, execute, _cleanup_references (+2) |
| `skills/blender-astro/addon/utils/bone_matching.py` | normalize_bone_name, calculate_similarity, find_best_match, fuzzy_match_bones, get_match_quality_report |
| `skills/blender-astro/addon/commands/retargeting.py` | auto_map_bones |
| `skills/blender-astro/addon/utils/security.py` | validate_port |

## Entry Points

Start here when exploring this area:

- **`handle_command`** (Function) — `skills/blender-astro/addon/websocket_server.py:36`
- **`process_command`** (Function) — `skills/blender-astro/addon/websocket_server.py:91`
- **`handle_armature_command`** (Function) — `skills/blender-astro/addon/websocket_server.py:136`
- **`handle_bonemapping_command`** (Function) — `skills/blender-astro/addon/websocket_server.py:171`
- **`handle_import_command`** (Function) — `skills/blender-astro/addon/websocket_server.py:213`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handle_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 36 |
| `process_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 91 |
| `handle_armature_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 136 |
| `handle_bonemapping_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 171 |
| `handle_import_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 213 |
| `list_armatures` | Function | `skills/blender-astro/addon/retargeting.py` | 35 |
| `get_bones` | Function | `skills/blender-astro/addon/retargeting.py` | 45 |
| `store_bone_mapping` | Function | `skills/blender-astro/addon/retargeting.py` | 230 |
| `load_bone_mapping` | Function | `skills/blender-astro/addon/retargeting.py` | 263 |
| `import_fbx` | Function | `skills/blender-astro/addon/retargeting.py` | 494 |
| `import_dae` | Function | `skills/blender-astro/addon/retargeting.py` | 514 |
| `execute` | Function | `skills/blender-astro/addon/ui.py` | 260 |
| `auto_map_bones` | Function | `skills/blender-astro/addon/retargeting.py` | 77 |
| `normalize_bone_name` | Function | `skills/blender-astro/addon/utils/bone_matching.py` | 10 |
| `calculate_similarity` | Function | `skills/blender-astro/addon/utils/bone_matching.py` | 39 |
| `find_best_match` | Function | `skills/blender-astro/addon/utils/bone_matching.py` | 112 |
| `fuzzy_match_bones` | Function | `skills/blender-astro/addon/utils/bone_matching.py` | 147 |
| `get_match_quality_report` | Function | `skills/blender-astro/addon/utils/bone_matching.py` | 222 |
| `auto_map_bones` | Function | `skills/blender-astro/addon/commands/retargeting.py` | 13 |
| `handle_animation_command` | Function | `skills/blender-astro/addon/websocket_server.py` | 189 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Handle_command → Normalize_bone_name` | cross_community | 8 |
| `Execute → Normalize_bone_name` | intra_community | 6 |
| `Auto_map_bones → Normalize_bone_name` | intra_community | 5 |
| `Handle_command → Get_match_quality_report` | cross_community | 5 |
| `Handle_command → Get_bones` | intra_community | 4 |
| `Handle_command → List_armatures` | intra_community | 4 |
| `Handle_command → Retarget_animation` | cross_community | 4 |
| `Handle_command → Get_preset_bone_mapping` | cross_community | 4 |
| `Handle_command → Store_bone_mapping` | intra_community | 4 |
| `Handle_command → Load_bone_mapping` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Commands | 5 calls |

## How to Explore

1. `gitnexus_context({name: "handle_command"})` — see callers and callees
2. `gitnexus_query({query: "addon"})` — find related execution flows
3. Read key files listed above for implementation details
