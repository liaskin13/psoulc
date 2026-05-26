# Session Intelligence

Session intelligence is how PSC knows who is at the console, what they can do, and how every layer of the UI adapts to that identity — without exposing the machinery to the visitor.

---

## Identity Taxonomy

| Identity | Code | Tier | Session Owner | Entry |
|---|---|---|---|---|
| D | 0528 | A | `"D"` | Main gate |
| L | 7677 | A | `"L"` | Main gate |
| Code Guest | worker-issued | B / C / G | `null` | Linked access URL |
| Unknown | — | — | — | Blocked |

ResidentId values from `RESIDENT_REGISTRY` (`src/data/residentBlueprint.js`):

- D → `residentId: 1`
- L → `residentId: 2`

---

## Entry Paths

### Main Gate (EntrySequence)

The hidden 4-digit input in the bottom-right corner of the entry screen. Only D and L know it exists.

1. `findResidentByCode(code)` — synchronous lookup against `RESIDENT_REGISTRY`
2. **Match (D or L):** writes session to `localStorage["psc_session"]`, calls `onIgnite(name, tier)`, opens gate animation
3. **No match:** `redeemCode(code)` — async `POST /redeem` via Cloudflare Worker
4. **Redemption success:** `onIgnite(null, tier)` — no localStorage session written for guests; identity lives only in transient React state and is lost on refresh
5. **Failure:** lockout counter increments; 3 failures → 30-second lockout via `psc_gate_lock` in localStorage

**Sources:** `src/entry/EntrySequence.jsx:74–129`, `src/config.js`

### Linked Access (?code= URL)

D distributes personal access URLs. Guests arrive here and never see the main gate.

1. `?code=` param detected on mount in `App.jsx`
2. App skips EntrySequence entirely — stage jumps to `"code-entry"`
3. `ListenerShell` renders with the `code` prop
4. Internal `CodeGate` calls `redeemCode(code)` independently
5. On success: `codeSession` state `{ tier, grantedTo }` held in ListenerShell
6. Welcome overlay (1.2s hold, 400ms fade): WELCOME / grantedTo / CURATED BY D

**Sources:** `src/App.jsx:48–50, 139–145`, `src/listener/ListenerShell.jsx`

---

## Session State Schema

```
// localStorage["psc_session"]  —  written ONLY for D and L
{
  owner:      string,   // "D" | "L"
  vault:      string | null,  // "saturn" (D) | "architect" (L)
  tier:       string,   // "A"
  residentId: number,   // 1 (D) | 2 (L)
  expires:    number    // Date.now() + SESSION_TTL_MS (4 hours)
}

// sessionStorage["psc_fp"]  —  guests only, per browser tab
UUID  — generated once via getFingerprint() in accessCodes.js.
        Sent in POST /redeem body. Stored as access_codes.redeemed_by in D1.
        Cleared on tab close.

// localStorage["psc_gate_lock"]  —  brute-force protection
{ count: number, lockedUntil: number }
Cleared on any successful entry.

// No persistent session exists for code guests.
// Guest identity lives in codeSession React state inside ListenerShell.
```

**Sources:** `src/entry/EntrySequence.jsx:89–96`, `src/config.js`, `src/lib/accessCodes.js`

---

## Session Lifecycle

```
COLD        no localStorage session, no ?code= URL
  ↓ user types 4 digits
ENTERING    gate rendered, input active
  ↓ 4th digit submitted
VERIFYING   async redeemCode() in flight  →  "VERIFYING" shown in gate
  ↓ success
ACTIVE      session in localStorage (D/L) | codeSession in state (guest)
  ↓ time passes
EXPIRING    [ no current UI signal — see Design Gaps ]
  ↓ TTL exceeded
EXPIRED     refreshSessionMeta() returns null; gate re-renders on next load
```

**Auto-login:** On mount, App.jsx reads `localStorage["psc_session"]`. If valid and non-expired, `handleIgnite()` fires immediately — the entry gate is never shown.

**Sources:** `src/App.jsx:67–78`, `src/entry/EntrySequence.jsx:74–129`

---

## Session Reading

Two implementations of the same read exist simultaneously:

| Function | Location | Called when |
|---|---|---|
| `refreshSessionMeta()` | `src/App.jsx:24–39` | Every `handleIgnite()` call |
| `readSessionMeta()` | `src/state/SystemContext.jsx:155–170` | SystemContext initial mount |

Both return `{ owner, vault, tier, residentId } | null`. `vault` falls back to the legacy `planet` field for old session records. These are identical in logic and are a candidate for extraction into `src/lib/session.js`.

---

## Fingerprint Model

`getFingerprint()` in `src/lib/accessCodes.js`:

- Calls `crypto.randomUUID()` once and caches it in `sessionStorage["psc_fp"]`
- Scope: single browser tab — clears on tab close
- Sent with every `POST /redeem` request body
- Worker stores it as `access_codes.redeemed_by` on the first successful redemption
- **Re-entry rule:** same fingerprint + same code → allowed (user refreshed or reopened the tab); different fingerprint → code already claimed by another session, rejected

**Sources:** `src/lib/accessCodes.js`, `worker/upload-worker.js`

---

## Adaptive Behavior

### Stage Routing

| Session | Device | Stage | Component |
|---|---|---|---|
| D, tier A | desktop | `"console"` | `ArchitectConsole` (viewer="D") |
| L, tier A | desktop | `"architect"` | `ArchitectConsole` (no viewer prop) |
| D or L, tier A | mobile | `"room"` | `ListenerShell` |
| Guest (linked access) | any | `"code-entry"` | `ListenerShell` (code prop) |
| Guest (main gate fallback) | any | `"room"` | `ListenerShell` (no identity) |
| Unknown | any | `"entry"` | `EntrySequence` |

### Body Theme

Injected on `<body>` via `data-theme` whenever owner is resolved:

- `"d-soul"` — D
- `"l-architect"` — L
- No attribute — guests and unknown

### Session-Aware ListenerShell Behavior

- `code` prop present → EXIT button becomes CLOSE; calls `window.history.back()` + `window.close()`
- `codeSession.grantedTo` → rendered in header as `.listener-header-guest` (8px, rgba white 0.25)
- Vault list: `GET /vaults` returns only published vaults for unauthenticated requests; all vaults when the auth header is present (D/L only)

**Sources:** `src/App.jsx:96–111, 57–65`, `src/listener/ListenerShell.jsx`

---

## Command Registry — Status Assessment

`SystemContext` (`src/state/SystemContext.jsx:33–61`) defines a `CMD` registry and a `dispatchCommand()` function that enforces authorization and writes every dispatched command to `commandLog[]` (capped at 500, persisted to `localStorage["psc_command_log"]`). The `CommandPalette` (⌘K) is the primary UI surface.

### Authorization Matrix

| Command | Authorized |
|---|---|
| `EXPLORE_VAULT` | Any authenticated session |
| `VOID_ITEM` | D or L |
| `TUNE_VAULT` | D or L |
| `CLAIM_NODE` | D or L |
| `INTAKE_ASSET` | D or L |
| `BROADCAST` | D or L |
| `UPLOAD_TRACK` | D or L |
| `RESTORE_ITEM` | L only |

### What Is Actually Wired

- **`UPLOAD_TRACK`** — works end-to-end. `UploadModal` calls `dispatchCommand(CMD.UPLOAD_TRACK, { vault, title })`, which authorizes, logs, and returns success. (`src/components/UploadModal.jsx:263, 289`)
- **`INTAKE_ASSET`** — `CommandPalette` dispatches it; SystemContext fires `psc:open-upload-modal` CustomEvent → UploadModal opens. (`src/components/CommandPalette.jsx:111–112`)

### What Is Disconnected

- **`VOID_ITEM`** — `ArchitectConsole` calls `voidItem()` directly at line 1469, bypassing `dispatchCommand`. The `CommandPalette` dispatches `VOID_ITEM` with an empty payload — the handler needs `payload.item` and `payload.vaultId`, so it silently does nothing.
- **`RESTORE_ITEM`** — `ArchitectConsole` passes `restoreItem` directly to `EventHorizonPanel`. Same problem from the palette: empty payload, no effect.
- **`TUNE_VAULT`, `EXPLORE_VAULT`, `BROADCAST`, `CLAIM_NODE`** — dispatched from the palette with empty payloads; SystemContext handlers return the payload unchanged (no-ops).

### Assessment

The registry's authorization check and audit log are real infrastructure. But for VOID/RESTORE/TUNE, the console calls underlying state functions directly and the registry is bypassed — the audit log is incomplete, and the palette dispatch of those commands is a UI dead end.

**Design decision required:** Either (a) route all console operations through `dispatchCommand` (filling in the payload at dispatch time) so the log is complete, or (b) remove the command registry for those commands and put a lightweight auth check in each component. The `CommandPalette` UI and `UPLOAD_TRACK` pathway are worth keeping regardless.

---

## Design Gaps

| Gap | Current State | Resolution Path |
|---|---|---|
| **No guest session persistence** | Code guests who enter via the main gate (not a URL) get no localStorage session. Refreshing the page wipes their identity — they return to the gate. | On successful `/redeem`, write `{ grantedTo, tier, expires }` to `localStorage["psc_session"]` (no `residentId`). `ListenerShell` should read and restore `codeSession` from this on mount when the `code` prop is absent. |
| **No expiry warning** | D and L sessions expire silently after 4 hours. The gate re-appears on the next page load with no warning. | Add an EXPIRING phase: ~10 minutes before `expires`, render a soft signal in the console (dim pulse or "SESSION ENDING" micro-label). `App.jsx` already has the TTL; a `setInterval` at mount is sufficient. |
| **Duplicate readSessionMeta** | `refreshSessionMeta()` in `App.jsx` and `readSessionMeta()` in `SystemContext` are identical functions. | Extract to `src/lib/session.js:readSessionMeta()` and import from both callers. Eliminates a silent divergence risk if the session schema changes. |
| **Disconnected command registry** | `ArchitectConsole` bypasses `dispatchCommand` for VOID/RESTORE, leaving those operations off the audit log. The palette versions of those commands do nothing. | See Command Registry section above — make the design decision and execute it fully either way. |
| **Dead usePresence.js** | `src/hooks/usePresence.js` is never imported anywhere and references `PRESENCE_KEY`, which does not exist in `config.js`. | Delete `src/hooks/usePresence.js`. |

---

## File Reference

| File | Role |
|---|---|
| `src/config.js` | `SESSION_KEY`, `SESSION_TTL_MS`, `GATE_LOCK_KEY`, `GATE_MAX_ATTEMPTS`, `GATE_LOCKOUT_MS` |
| `src/entry/EntrySequence.jsx` | Entry gate, lockout logic, session write for D and L |
| `src/lib/accessCodes.js` | `redeemCode()`, `getFingerprint()` |
| `src/data/residentBlueprint.js` | `RESIDENT_REGISTRY` |
| `src/App.jsx` | `refreshSessionMeta()`, `handleIgnite()`, stage routing, auto-login |
| `src/listener/ListenerShell.jsx` | `CodeGate`, `codeSession` state, Welcome overlay, session-aware UI |
| `src/state/SystemContext.jsx` | `readSessionMeta()`, `CMD` registry, `dispatchCommand()`, `commandLog` |
| `src/components/CommandPalette.jsx` | ⌘K palette UI — command surface for D and L |
| `src/components/UploadModal.jsx` | Only component that dispatches `UPLOAD_TRACK` end-to-end |
| `src/console/ArchitectConsole.jsx` | Uses `voidItem`, `restoreItem`, `architectArchive` directly |
| `worker/upload-worker.js` | `POST /redeem`, fingerprint enforcement, vault visibility by auth status |
| `worker/migrations/0004_add_access_codes.sql` | `access_codes` schema (`tier`, `redeemed_by`) |
| `src/hooks/usePresence.js` | **DEAD — delete** |
