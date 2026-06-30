PSC session handoff — 2026-06-27

Context: Pleasant Soul Collective music platform at uoyni.com. I am L (liaskin13,
cyan identity). D (green identity, code 3865) is the artist. Guest test code: 0000.
Deploy: commit → push → npm run build → npx wrangler pages deploy dist --project-name psoulc
(Pages is NOT auto-deployed from git.)

Read tasks/lessons.md and the memory files at
~/.claude/projects/-workspaces-psoulc/memory/MEMORY.md before doing anything.

What happened last session:
- Ran /qa (report at .gstack/qa-reports/qa-report-uoyni-com-2026-06-27.md, overall 6/10)
- Ran /plan-eng-review on a chunked WAV analysis plan — the review was valid but the
  premise was WRONG. Waveform generation is NOT broken. New uploads work fine including
  800MB+ WAVs. The plan over-engineered a solution to a non-problem.

What is actually true:
- All 5 mixes have waveforms — just old-version ones (stale analyzer)
- 992NOTDONE shows the new WF in D's console; PNG may just have display issues in listener
- EncodingError in QA report was likely isolated — do NOT assume it is ongoing

What actually needs to be built (in priority order):

1. GUEST PLAYER WAVEFORM DISPLAY — Tier 7 Item 17 in master plan
   (a) PNG stretched full-screen (objectFit: fill on 60px image → "block of colours")
   (b) PNG should scroll with playhead centred — CSS translateX + rAF loop
   File: src/listener/ListenerVaultView.jsx — WaveformImg component
   Run /design-consultation BEFORE touching any CSS.

2. FORCE-REGEN for stale waveforms — L's console only (NOT D's file cell row)
   - Short term: NULL waveform_data in D1 via Wrangler dashboard for the old tracks,
     open D's console → auto-queue regenerates with current analyzer
   - Medium term: multi-select regen in L's console (design feature, needs consultation)
   - ensureWaveformForTrack(track, true, true) already supports force=true — needs UI
   - Do NOT add regen button to D's file cell row

3. Chunked WAV analysis (Tier 1 Item 3 in master plan) — architecturally sound for
   future-proofing but NOT a blocker. /plan-eng-review CLEARED with 9 spec improvements.
   Read the spec in master plan before building.

Master plan: /home/codespace/.claude/plans/can-you-go-thru-cuddly-cake.md
QA report: .gstack/qa-reports/qa-report-uoyni-com-2026-06-27.md

Do NOT start any work without reading MEMORY.md and asking me what I want to tackle first.
