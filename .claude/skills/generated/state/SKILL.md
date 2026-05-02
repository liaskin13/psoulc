---
name: state
description: "Skill for the State area of psoulc. 29 symbols across 7 files."
---

# State

29 symbols | 7 files | Cohesion: 86%

## When to Use

- Working with code in `src/`
- Understanding how SystemProvider, voidItem, restoreItem work
- Modifying state-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/state/SystemContext.jsx` | checkAuthorization, loadListeners, loadCollaborators, loadMembers, SystemProvider (+11) |
| `src/data/collaborators.js` | migrateToCollaborators, isCollaboratorActive, canCollaboratorAccess, canLockboxAccess, makeCollaborator |
| `src/App.jsx` | handleVoid, renderVault |
| `src/console/ArchitectConsole.jsx` | confirmVoidProtocol, handleRosterAdd |
| `src/entry/RequestAccessModal.jsx` | handleCollaborateNext, handleListenSubmit |
| `src/lib/tracks.js` | fetchVaultTracks |
| `src/console/MembersPanel.jsx` | handleAdd |

## Entry Points

Start here when exploring this area:

- **`SystemProvider`** (Function) — `src/state/SystemContext.jsx:141`
- **`voidItem`** (Function) — `src/state/SystemContext.jsx:194`
- **`restoreItem`** (Function) — `src/state/SystemContext.jsx:200`
- **`fetchVaultTracks`** (Function) — `src/lib/tracks.js:3`
- **`migrateToCollaborators`** (Function) — `src/data/collaborators.js:111`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SystemProvider` | Function | `src/state/SystemContext.jsx` | 141 |
| `voidItem` | Function | `src/state/SystemContext.jsx` | 194 |
| `restoreItem` | Function | `src/state/SystemContext.jsx` | 200 |
| `fetchVaultTracks` | Function | `src/lib/tracks.js` | 3 |
| `migrateToCollaborators` | Function | `src/data/collaborators.js` | 111 |
| `getCollaboratorForSession` | Function | `src/state/SystemContext.jsx` | 314 |
| `canEnterVault` | Function | `src/state/SystemContext.jsx` | 322 |
| `canEnterLockbox` | Function | `src/state/SystemContext.jsx` | 332 |
| `isCollaboratorActive` | Function | `src/data/collaborators.js` | 44 |
| `canCollaboratorAccess` | Function | `src/data/collaborators.js` | 54 |
| `canLockboxAccess` | Function | `src/data/collaborators.js` | 64 |
| `finalApproveRequest` | Function | `src/state/SystemContext.jsx` | 238 |
| `addMember` | Function | `src/state/SystemContext.jsx` | 275 |
| `addCollaborator` | Function | `src/state/SystemContext.jsx` | 307 |
| `makeCollaborator` | Function | `src/data/collaborators.js` | 22 |
| `addInboxRequest` | Function | `src/state/SystemContext.jsx` | 209 |
| `addListener` | Function | `src/state/SystemContext.jsx` | 266 |
| `handleVoid` | Function | `src/App.jsx` | 178 |
| `checkAuthorization` | Function | `src/state/SystemContext.jsx` | 29 |
| `loadListeners` | Function | `src/state/SystemContext.jsx` | 69 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `MercuryStream → VoidItem` | cross_community | 5 |
| `App → VoidItem` | cross_community | 5 |
| `App → IsCollaboratorActive` | cross_community | 5 |
| `HandleDragEnd → VoidItem` | cross_community | 5 |
| `App → GetCollaboratorForSession` | cross_community | 4 |
| `SystemProvider → MigrateToCollaborators` | intra_community | 3 |
| `HandleRosterAdd → GenerateCode` | intra_community | 3 |
| `HandleRosterAdd → MakeCollaborator` | intra_community | 3 |
| `HandleComment → GetCollaboratorForSession` | cross_community | 3 |
| `HandleVoiceComment → GetCollaboratorForSession` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Console | 2 calls |
| Mercury | 1 calls |
| Venus | 1 calls |

## How to Explore

1. `gitnexus_context({name: "SystemProvider"})` — see callers and callees
2. `gitnexus_query({query: "state"})` — find related execution flows
3. Read key files listed above for implementation details
