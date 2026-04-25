# PSC SYSTEM DIRECTIVE

> The canonical design specification for the Pleasant Soul Collective platform.
> Last updated: 2026-04-25.
> Maintained by D + L. Updated as phases complete.

---

## 1. THE DUAL CORES (Founding Authority)

* **D's GOD MODE CONSOLE:** The active command center of the Collective. Full sovereign control. (**Access: 0528**).
* **THE PULL CORD:** A physical, braided 3D pull cord suspended in D's console.
  * **MECHANIC:** Pulling the cord activates the Void — draining all color from the system UI into High-Contrast Grayscale.
  * **ACTION:** Severs access for all tiers below Master. Access is restored only when D reactivates via the cord.
  * *(Grayscale drain and tier-access severance — confirmed, Phase 9 implementation complete.)*
* **L's ARCHITECT CONSOLE (THE VOID):** The silent governance layer. The Architect has full visibility and elevated permissions, including the exclusive `RESTORE` command. (**Access: 7677**).

---

## 2. VAULT ARCHITECTURE

> Internal code IDs (venus, saturn, etc.) are technical keys only — never displayed to users.

### Active Vaults (launch priority order)

| Internal ID | Display Name     | Content                                                        |
|-------------|------------------|----------------------------------------------------------------|
| venus       | **MIXES**        | Soul Pleasant curated mixes — D's long-form deep-storage mixes. Priority 1. |
| saturn      | **ORIGINAL MUSIC** | Master tracks, remixes, productions by Soul Pleasant. Priority 2. |
| mercury     | **LIVE SETS**    | Pre-recorded sets + live streaming. Ultimate goal — not yet built. |

### Member Vaults (access-restricted, not in general listener dock)

| Internal ID | Display Name | Owner  |
|-------------|--------------|--------|
| mars        | **JESS B**   | Jess B dedicated vault. Access: 1984. Nothing to upload yet. |
| amethyst    | **ANGI**     | Angi's vault — singing bowls + sound bath sessions. Access: 4096. Nothing to upload yet. |

### Deferred Vaults

| Internal ID | Display Name          | Content                                                                        |
|-------------|-----------------------|--------------------------------------------------------------------------------|
| earth       | **SONIC ARCHITECTURE** | Confidential proposals, roadmaps, sonic architecture volumes. Not a listener priority. |

### Muse Vaults (separate section in listener view)

| ID     | Artist | Parent Vault    |
|--------|--------|-----------------|
| janet  | Janet  | ORIGINAL MUSIC  |
| erikah | Erikah | ORIGINAL MUSIC  |
| drake  | Drake  | ORIGINAL MUSIC  |
| larry  | Larry  | ORIGINAL MUSIC  |

> The MUSES section is a distinct block in the listener shell — separate from the main vault dock. Design TBD.

---

## 3. D's CONSOLE (The Soul Interface)

* **AESTHETIC:** 70s Soul vibe — warm amber lighting, Honey Amber tones, analogue studio character. Grounded in D's actual studio environment.
* **VAULT MAP:** The console shows active vaults as nodes in an overview panel. Amber-lit, high-contrast.
* **THE COMMANDS:**

| Command       | Tier Access                    | Purpose                                          |
|---------------|--------------------------------|--------------------------------------------------|
| `< EXPLORE >` | All authenticated              | Enter a vault                                    |
| `< TUNE >`    | Member+ (own vault)            | Library control — upload, rename, edit, void     |
| `< VOID >`    | D, L, assigned vault owner     | Initiate transfer to the Eternal Registry        |
| `< RESTORE >` | L only                         | Retrieve from Eternal Registry                   |
| `< BROADCAST >` | D only (for now)             | Transmit signal from console                     |
| `< INTAKE >`  | D, L                           | Asset intake slot                                |
| `< CLAIM >`   | D, L                           | Claim a vault node                               |
| `< UPLOAD >`  | D, L, assigned vault owner     | Upload track to vault                            |

*TUNE is the umbrella for all library management — tier and vault ownership determine scope.*

### 3.1 L's CONSOLE (The Architect Interface)

* Same layout as D's console. Cold graphite/cyan palette — no soul warmth. Architect's tools: M³ Roster, permission matrix, activity feed, restore command.

---

## 4. THE GATE (Access System)

* **VISUAL:** `dp` logo wallpaper background. Centered 4-cell code entry grid. Comfortaa font for the `dp` mark and the PLEASANT SOUL COLLECTIVE name. Chakra Petch for all UI labels.

### M³ Tier System

| Tier        | Who                       | Access                                                                 |
|-------------|---------------------------|------------------------------------------------------------------------|
| **MASTER**  | D, L                      | God Mode — total admin control. Founders.                              |
| **MUSE**    | Angi, Jess B, invited artists | Admin of assigned vault + explore all vaults. Assigned jointly by L and D. |
| **MEMBER**  | Collective members        | Explore all vaults. Elevated from Listener by L or D.                  |
| **ASPIRING** | Self-submitted pipeline  | Browse-only until elevated. Artists who believe they belong here.      |
| **LISTENER** | Open access              | Browse-only. No edit, comment, or void. Auto-assigned on entry request. No approval required. |

### Onboarding Pipeline (Muse / Member)
Potential member submits request → L reviews → D confirms → code auto-generated and assigned.

---

## 5. THE VAULT INTERIOR (Library)

* **AESTHETIC:** Each vault is a warm, high-contrast chamber with a **30/70 split** — top viewport window (artist-facing view) / lower file-cell library wall.
* **LIBRARY WALL:** A grid of square file-cells in a warm wood-tone frame under Honey Amber lighting. Each cell has an identity-colored ownership rail, creator sigil, and reveals VOID + COMMENT handles on hover. Each vault carries its own identity color.
* **MUSE VAULTS** inherit this template, themed to their artist — simple aesthetic choices (accent color, lighting tone) are within each vault owner's sovereignty.
* **READOUT:** Hovering over a file displays **Track Name** and **BPM** in Amber.
* **CONTROLS:** Selecting a file reveals options: **PLAY, FFWD, REWIND, STOP, REC**.
* **SCROLL:** Vertical, kinetic scroll that feels heavy and mechanical.
* **VOICE TRANSMISSIONS:** The **REC** button on the Studer transport arms a voice-note capture. Any authenticated tier may leave a voice note on any track they can access — **audio only, no text**. Notes are pinned to the track and visible to the vault owner. *(Full mic/MediaRecorder implementation — pending.)*

---

## 6. KINETIC STUDER TAPE PLAYER PHYSICS

* **STROBE EFFECT:** Subtle Motion Blur and a 70s Shutter flicker (stroboscopic look) under Honey Amber lighting.
* **HOVER:** Triggers an Amber Glow and a soft Tape Hiss audio floor.
* **TRANSPORT:** Brushed Chrome Studer-style Transport Bar at the bottom centre.

---

## 7. THE VOID TRANSFER

* **THE ACTION:** Non-Linear Stretch Transform toward the Eternal Registry.
* **VECTOR:** Asset elongates and thins until it is a **1px line of light**.
* **COLOR LOGIC:** The streak inherits the **identity color** of the originating vault, fading into absolute black at the void threshold.
* **SOUND:** Granular pitch-down audio effect as the asset stretches.
* **THE STICK:** Successful capture triggers an Inverse Bloom (Flash of Darkness) at the Registry core.
* **LOGIC:** Only the Architect has the Restore command.

---

## 8. THE ETERNAL REGISTRY

* **PURPOSE:** Permanent archive of voided assets. Immutable record of origin vault and timestamp of voiding.
* **METADATA:** Origin vault and time of voiding stored permanently.
* **VISUALIZATION:** Hovering over the Registry core in the vault map displays a multi-colored ambient layer representing the stored frequencies.
* **CONFIRMATION:** *"Commit to the Void? This cannot be undone."*
* **RESTORE:** L-only command. Retrieves asset and re-attaches original metadata.
