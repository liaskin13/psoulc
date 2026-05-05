# PHASE 10 PRIORITIES — MUST SHIP VS DEFER

## ✅ COMPLETE
- [x] Real waveforms with frequency colors
- [x] Streaming audio playback (<audio> element)
- [x] Upload flow with waveform preprocessing
- [x] Cursor refinement (smaller, tighter glow)

---

## 🔥 CRITICAL — MUST SHIP FOR D BETA TEST

### Hot Cues (CURRENT TASK)
- **Why critical:** Core DJ workflow, familiar Serato pattern
- **Scope:**
  - 8 hot cue buttons with Serato colors
  - Click to set cue, click again to jump
  - Visual markers on waveform
  - Per-track storage (localStorage or DB)
- **Estimate:** 30-45 min

### Vault Architecture Finalization
- **Why critical:** D needs to understand his domain
- **Scope:**
  -  vault (D's territory) complete
  - Entry→Console→Vault flow polished
  - File browsing/organization clear
- **Estimate:** 1-2 hours

### Permission Guards Verification
- **Why critical:** Can't ship if D can see/edit L's files
- **Scope:**
  - Verify tier-based access works
  - Test upload/edit/void permissions
  - Ensure browse-only tiers can't mutate
- **Estimate:** 30 min (mostly testing)

---

## ⚠️ HIGH PRIORITY — SHIP IF TIME ALLOWS

### Track Metadata Display
- **Why useful:** D needs to see BPM, artist, date on loaded track
- **Defer risk:** Low — can add post-beta
- **Estimate:** 15 min

### Deck Transport Polish
- **Why useful:** PLAY/PAUSE/CUE buttons need visual feedback refinement
- **Defer risk:** Low — functional now, just aesthetics
- **Estimate:** 20 min

### Waveform Zoom
- **Why useful:** See more detail when analyzing breakdowns
- **Defer risk:** Medium — nice-to-have for DJ workflow
- **Estimate:** 45 min

---

## 📦 DEFER TO PHASE 11

### Loop Controls
- **Why defer:** Not essential for beta playback testing
- **Phase 11 scope:** Loop in/out, loop size controls

### Effects Panel
- **Why defer:** D just needs to hear his tracks clean first
- **Phase 11 scope:** Reverb, delay, filter, gain

### Prepare Queue Functionality
- **Why defer:** +Q button exists but queue playback not wired
- **Phase 11 scope:** Auto-advance, queue reordering

### BPM Sync/Tap
- **Why defer:** Single-deck playback for now
- **Phase 11 scope:** Beat matching, tempo sync

#

### Smart Crates / Sorting
- **Why defer:** Buttons exist but not wired
- **Phase 11 scope:** BPM-based grouping, play history filters

---

## 🎯 RECOMMENDED PHASE 10 COMPLETION PATH

**Goal:** Get D testing  vault + playback ASAP

1. **Hot Cues** (30-45 min) ← NOW
2. **Vault Architecture Review** (1-2 hours)
   - Polish  vault entry/browsing
   - Verify upload→library flow

4. **Ship to D** 🚀

**Total time to beta:** ~3 hours from now

Everything else (loops, effects, queue, BPM) can wait for Phase 11 after D validates the core experience.

---

## DECISION NEEDED

**Track metadata display:** Show BPM/artist/date on loaded deck?  
- If yes: add to Phase 10 (15 min)  
- If no: defer to Phase 11

**Waveform zoom:** Zoom in/out on deck waveform?  
- If yes: add to Phase 10 (45 min)  
- If no: defer to Phase 11
