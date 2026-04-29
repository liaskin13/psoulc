# PSC SYSTEM DIRECTIVE

> The canonical design specification for the Pleasant Soul Collective platform.
> Last updated: 2026-04-25.
> Maintained by D + L. Updated as phases complete.

---

## 1. SOVEREIGN CONSOLES (Tier A)

> The platform is a private instrument. Achromatic Brutalist Futurism provides the architecture; the Artist brings the sovereignty through color.

* **D's ANALOG CONSOLE (The Soul):** The primary command center. A high-luxury instrument combining Dark OLED depth with 70s Soul warmth.
  * **AESTHETIC:** Aurora mesh gradients, Honey Amber accents, and Gold Foil typography.
  * **IDENTITY:** Amber (#ffb347).
  * **ACCESS:** Master Tier A (0528).
* **L's ARCHITECT CONSOLE:** The governance layer. A cold, systematic interface for structural control, permission matrix, and archival restoration.
  * **AESTHETIC:** Graphite surfaces and Cyan signal lines.
  * **IDENTITY:** Cyan (#00e5ff).
  * **ACCESS:** Master Tier A (7677).
* **CONSOLE ACCESS:** The Consoles are the exclusive instruments of Tier A (Masters). Access is strictly forbidden for all other tiers. All session management and signal protocols are integrated directly into the console interface. Hardware "Void Triggers" and pull-cords have been scrapped.

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
| **MASTER**  | D, L (+ DJ's/ARTISTS  VETTED BY L, APPROVED BY D)                     | God Mode — total admin control. Founders.                              |
| **MUSE**    | ALTRUISTIC ARTIST DREAMS, invited artists | AAccess to DIRECT MESSAGING to D and L  explore all vaults. Assigned  by L and D. |
| **MEMBER**  | Collective members        | Explore all vaults. Elevated from Listener by L or D. Elevated by subscription, auto assigned.                 |
| **ASPIRING** | Self-submitted pipeline  | Browse-only until elevated. Artists who believe they belong here.      |
| **LISTENER** | Open access              | Browse-only. No edit, comment, or void. Auto-assigned on entry request. No approval required. |
| **MASTER (A)**  | D, L                      | God Mode — Full Console Access + total admin control. Founders.         |
| **MUSE (C)**    |  invited artists | Vault-only access.  + explore others.            |
| **MEMBER (B)**  | Collective members        | Vault-only access. Explore all vaults.                                 |
| **LISTENER (G)** | Open access              | Vault-only access. Browse-only.             |

### ROUTING PROTOCOL
Upon successful authentication, the system checks `canAccessConsole`. Tier A users are routed to their respective **Console**. All other Tiers (B, C, G) are routed to the **Vault** view.

### Onboarding Pipeline (  Aspiring)
Potentialspiring collaborator submits request → L reviews → D confirms → code auto-generated and assigned.

---

## 5. THE VAULT INTERIOR (Library)

* **AESTHETIC:** Each vault is a warm, high-contrast chamber. Honey Amber lighting, wood-tone warmth.
* **LIBRARY WALL:** A full-screen grid of square file-cells. Each cell has an identity-colored ownership rail, creator sigil, and reveals VOID + COMMENT handles on hover. Each vault carries its own identity color. Layout and proportions are open — no fixed split ratio.
* **MUSE VAULTS** inherit this template, themed to their artist — simple aesthetic choices (accent color, lighting tone) are within each vault owner's sovereignty.
* **READOUT:** Hovering over a file displays **Track Name** and **BPM** in Amber.
* **CONTROLS:** Selecting a file reveals options: **PLAY, FFWD, REWIND, STOP, REC**.
* **SCROLL:** Vertical, kinetic scroll that feels heavy and mechanical.
* **VOICE TRANSMISSIONS:** The **REC** button on the Studer transport arms a voice-note capture. Any authenticated tier may leave a voice note on any track they can access — **audio &/or text**. Notes are pinned to the track and visible to the vault owner. *(Full mic/MediaRecorder implementation — pending.)*

---

## 6. KINETIC STUDER TAPE PLAYER PHYSICS

* **STROBE EFFECT:** Subtle Motion Blur and a 70s Shutter flicker (stroboscopic look) under Honey Amber lighting.
* **HOVER:** Triggers an Amber Glow and a soft Tape Hiss audio floor.
* **TRANSPORT:** Brushed Chrome Studer-style Transport Bar at the bottom centre.

---

## 7. THE VOID TRANSFER

* **THE ACTION:**  **Assets are never deleted; they are archived.**
* 
* **LOGIC:** Only the Architect has the Restore command.

---

## 8. THE ETERNAL REGISTRY

* **PURPOSE:** Permanent archive of voided assets. Immutable record of origin vault and timestamp of voiding.
* **PURPOSE:** Permanent, immutable archive of voided assets. Files are moved here to preserve the "Eternal Record" and are never purged from the system.
* **METADATA:** Origin vault and time of voiding stored permanently.
* **VISUALIZATION:** Hovering over the Registry core in the vault map displays a multi-colored ambient layer representing the stored frequencies.
* **CONFIRMATION:** *"Commit to the Void? "*
* **RESTORE:** L-only command. Retrieves asset and re-attaches original metadata.
* **RESTORE:** L-only command. Only the Architect can view the Registry or retrieve assets from it.
