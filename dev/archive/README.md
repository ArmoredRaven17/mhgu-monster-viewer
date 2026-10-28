# dev/archive -- the decode scripts and notes behind the ROM map

This folder holds the working scripts and result notes used to decode Monster Hunter Generations Ultimate (Switch) for this viewer:
the tracers, censuses, emulator harnesses, scanners and check generators, and the RESULT notes they produced. Every finding they
established is indexed in [`dev/rom-map.md`](../rom-map.md), one line per address, with its status (READ / INFERRED / WITHDRAWN)
and the tool that found it. The per-monster detail lives in the specs under `dev/` (`emNNN*-effects-spec.md`, `*-shells-spec.md`).

If you are here to understand how monster effects work, or to port them to another game, start with
[`dev/effects-porting-guide.md`](../effects-porting-guide.md), then [`dev/effect-runtime-engine.md`](../effect-runtime-engine.md).

These are research scripts written by agents during the work, not a maintained tool suite. Many are one-offs, several exist in
numbered variants (`emu88.py`, `emu88b.py` ...), and some were superseded by later versions in the same folder. The map and the
specs say which one produced a result.

## The `<archive>` token

The notes write paths into this folder as `<archive>\x\y.py` (or `<archive>/x/y.py`). That is `dev/archive/x/y.py` here. A path
that is not here is one of the excluded files (see below). The original working copy, with everything, is
`C:\MHGU-RE\offline\decode\monster-viewer-scratch\` on the author's machine. rom-map's "2. Tooling" section defines the token and
lists what was already lost before the archive was made.

## Layout

The folders are working names, mostly one per task:

- `fb\`: the shells census and ROM harness (`emu_fb.py`, `trgen.py`, `cengen11.py`, `rec_shellrec.py`, `export_plain.py`,
  `mk_plaincheck.py`).
- `zg\`: the effects lane's tracers (`tracec.py`, `reqtrace.py`, `reqcensus.py`, `jscheckpd.py`, `wordsweep.py`).
- `gapA\`..`gapQ\`: one decode question each, with its `RESULT.md` (`gapQ\`: Brachydios / Raging's shells, 2026-10-25).
- `gapR\`..`gapZ\`: the shells lane's reads, tools and outputs (no RESULT.md; the rom-map rows cite them). `gapZ\`: GU Hyper's ShellElements -- the aura ID census, the -1 rule (cadcheck.py), every class's audit (hyperall.py), the Khezu page meter (2026-10-27).
- `flashed\`: the Flashed state (2026-10-25; spec `dev/flashed-state.md`): `d.py` / `blsites.py` / `immsites.py` / `owner.py` /
  `slotof.py` (disassembly and scans), `census.py` (per monster: the flash gate bit, the blindness rows, the flash cone ->
  `census.json`), `flashemu.py` (the sense scan's flash test under unicorn, with controls -> `flashemu.json`), `mkflash_js.py`,
  `flashmeter.mjs` (the page's Flashed switch under the draw meter); the scan outputs `imm*.txt`, `orbic.txt`.
  These import capstone / unicorn from the user site: run them with plain `python`, not `python -I`.
- `t3\`: the ARM-VFP leaf-routine translator.
- `duo\`: the Seltas duo census.
- `docaudit\`: the 2026-10-24 documentation audit.
- `laneB\`: effects lane B's probes and reads (2026-10-25, Amphibian .. ???): `probe2.mjs` / `probe3.mjs` (probe.mjs with the loop set first / the meter every frame), `mkprobe.py`, `where.py`, the duo tracer runs `duo\cad0watch.py` / `hook204.py`; specs and outputs in `cen\pq*`. Note: dev/effects-lane-b-2026-10-25.md.
- `laneB2\`: effects lane B2 (2026-10-25, Elder Dragon / ???): `probe2.mjs` (a `rage` step for the Enraged toggle or the rage ladder, the
  runtime's rage logged, `sweep` / `dumpParts`, `no clip` logged), `run.sh` (mount retries), `puffpick.py` (the rage puff's pick over every
  key of a joint), `neset_thread_export150.py`, `dbg084.mjs` (Nakarkos's arm runtimes); specs and outputs `cen\pq\c2*`.
- `laneA2\`: effects lane A2 (2026-10-26, Fanged Beast .. Leviathan): `scan505.py` (every P+0x505 writer, word by word), `stam1104.py`
  (the stamina writers under unicorn: Thunderlord vs Zinogre), `classreq.py` (a class's request sites with their keys), `hyperG.mjs`
  (the Hyper meter at Quest Rank G), `probe.sh` (laneB/probe2.mjs through the slot-2 lock), `dbg022*.mjs` (the zero-length-clip clock
  hunt); specs and outputs `cen\pq\a2_*`.
- `laneA3\`: effects lane A3 (2026-10-26, Fanged Beast .. Leviathan): `reach.py` (does a recorder set reach the factory's zero-generator
- `laneA4\`: effects lane A4 (2026-10-26): `tune44.py` / `issue101b.py` (tune+0x44 readers; every P+0x3ae store, the (10, 0x1b) issuer), `lagi\` (one action's calls, (s, n) issuers), `p4audit\` (the posture-4 audit of every class: p4trace.py, p4group.txt, moguri_dtb.txt), `sink4\` (SINK4 generator gen_sink4.py + gen_js.py, players.py, sinkmeter.mjs / cmp2.py the OFF / ON meter, sinkshot.mjs + sheet.py -> sink4_sheet.png, dbg1050.mjs), `joint1\` (the joint -1 audit: joint1_table.csv, j1meter.mjs, j1where.mjs, j1shot.mjs -> joint1_sheet.png). rom-map "Effects lane A4"
  test 0x9bb30c / the build 0x9bb330), `dbg083.mjs` + `dbg.sh` (one record's request life frame by frame: core state, the ground ray's
  start and floor, what-ifs for the joint -1 origin and the posture-0 floor, the meter), `probe.sh` (laneB2/probe2.mjs through slot 2),
  `pqsum.py`, `run_re.sh` + `slot2_rcd3t.sh` (census3 reruns with a per-monster timeout), `vt208_083.txt` (Gammoth's vt+0x208),
  `sub046\` / `sub082\` (helper reads: Lagiacrus's dive chain, Mizutsune's (10, 0xaf) side); specs and outputs `cen\pq\a3_*`.
- `laneB3\`: effects lane B3 (2026-10-25, Nakarkos u 215 / u 3, Ahtal-Neset's rocket points): `gen215.mjs` (one clip record's
  generators per frame, headless, with an optional life log from an instrumented copy of docs/render), `ptrscan.py` (who points into a
  table: its readers), `vt1d0all.py` (every vt+0x1d0 call in the text with its id), `immsites.py` (a field's users by immediate),
  `armlist.py` (a plain listing), `probe3.mjs` (laneB2/probe2.mjs keeping the shell rows, with a shell log) with `probe.sh` / `run.sh`
  / `rcd3b.mjs`; specs and outputs `laneB3\pq\b3*`, `*.out`. Second round (2026-10-27): `blcallers.py` (every bl / b to a routine with
  its r1 / r2), `notice-rage.mjs` (the notice marks with the combat byte as an event, calm / enraged / timeout legs), `point087.mjs`
  (Ahtal-Neset's point toggles under the meter, then shots), `dbg087.mjs`, and `notice2pq.py` / `rows2pq.py` (a check's meter rows
  into the census's probe format).
- `actmot\`: the action -> motion census (2026-10-27; dev/action-motions.md, docs/action-motions.json): `amtrace.py` (the machine),
  `census.py` / `runall.py` (all 94 list entries), `build.py`, `resolve21.py` (the 21 ModifyData actions), `ambig.py` (Hyper's
  ambiguous count), `cand.py` -> `candidates.md` (clips whose actions differ in posture / rate / PSL word), `mountcheck.mjs` + `rcd.mjs`
  (the page), meter outputs `meter_*.out`. Raw per-monster runs stay local (scratchpad `actmot\raw\`).
- `atkfix\`: the attack arms' class fix (2026-10-27; rom-map trap 176, dev/attack-hitshapes.md 3): `attrace_all.py` (the census
  runner on the spawn-table map; `attrace_all.WRONG.py` the old nearest-lower rule), `mapcheck.py` (every monster's class against
  dev/notice-marks.md, the old rule as the control), `attexport_dry.py` (attexport into a scratch file), `patch_arms.py` (replaces
  only the named monsters' `arms` in docs/attack-hitshapes.json), `atkfix_check.mjs` with `run-check-detail-all.mjs` (the page:
  records, joints, shots), `ctl\` (em034_00 / em062_00 census, new and WRONG), `*.out`, `shots\` before / after. Follow-up the same
  day: `mapcheck2.py` (fb/runfbb.py / runchg.py's SHARED lists against notice-marks), `overrun.py` -> `overrun.out` (every arm whose
  window overruns its clip, locked / free by flags bit 0), `atkfix_carry.mjs` (the dromes' (7, 2) carried into L2 M2; shots
  `shots\atkfix-carry\`), `atkfix_arzuros.mjs` (ids past the table named, no shape). The carry widened: `zg\atkcarry.py` (the rule
  and the named refusals; attexport.py calls it), `carry_report.txt` (one line per unlocked overrunning arm: carried hops or the
  refusal), `carrystats.py`, `mkdry.py` -> `attexport_dry.py`, `atkfix_carry2.mjs` (spot checks + the first-lap test; shots
  `shots\atkfix-carry2\`). Then READ, superseding that rule: `leadcases.py` (the lead per arm from the action census's raw runs ->
  `leads.json`, `leadlog.txt`; and the carry cases), `carrysim.py` + `simall.py` (each case's action main stepped tick by tick under
  actmot/amtrace.py), `mergecarry.py` -> `carries.json` + `carry_report_sim.txt` (the exporter reads leads.json / carries.json;
  `carry_export_log.txt` its log), `fprobe.py` (the frame tests a frame-gated transition asks), shots `shots\atkfix-carry3\`.
  Frame by frame (superseding carrysim.py): `amtrace_ovr.py` (amtrace with answers: frame tests, action tune, overrides),
  `leadcases2.py` (leads with the follow credit and stepped arm frames; `leadjobs_out.json`), `carrysim2.py` + `simall2.py`,
  `mergecarry2.py` -> `carries.json`, `carry_report_sim2.txt`; shots `shots\atkfix-carry4\`.
- `kushwind\`: Kushala's wind aura placement (2026-10-27; spec dev/em024_00-effects-spec.md 9): `kwpos.mjs` / `kwnodes.mjs` /
  `kwtime.mjs` / `kwshot.mjs` (+ `saveshots.py`; `mon` / `list` / `old` for Amatsu, Teostra and the before view) through `run.sh` +
  `rcd3.mjs`, `pushaudit.py` (-> `census.out`), `nodeaudit.py` (-> `nodecensus.out`, the camera-node census), `bit3scan.py` /
  `blk4scan.py` (node flag readers, pointer-tracked), `propnames.py` (a class's registered properties and offsets), `kwsoak.mjs`
  (every monster, event records started, side camera), `dbgclip.mjs`, `feats.py`; `vfp2js.py` (0x232e24 -> docs/render/rom/effect/
  rom-inv44.js) checked by `inv44check.py` (the ROM on unicorn) + `inv44check.mjs`; `vstm70.py` / `cam70.py` / `w70scan.py` /
  `copy4070.py` / `camusers.py` (the camera +0x70 writer hunt: uCamera vt+0x28 0x895af8); `shots\reshoot\` before / after side, front,
  behind (Kushala L1-3, Amatsu u 0 / u 1, Teostra u 0 / u 10), `shots\final\` the first pass's views (`shots\stale_camera\` were
  taken with the camera moved after the clock stopped: not placements). rom-map "Kushala's wind aura -- where it draws".

rom-map's tooling table gives each script's purpose, its validated control and its caveats.

## What the scripts expect

They were run on Windows, from the author's machine, and use absolute paths. To run one elsewhere, change the paths at its top.

| what | where the scripts look | notes |
|---|---|---|
| the game's executable, split | `C:\MHGU-ROM\exefs\` (`main.text`, `main.rodata`, `main.data`, ...) | your own dump of the game; nothing from the ROM is in this repo |
| the game's files | `C:\MHGU-ROM\romfs\nativeNX\...`, and arcs extracted under `C:\MHGU-Extract\scratch-em*\` | same |
| `armdis.py` and the effect tooling | `C:\MHGU-Extract\efx\` (put on `sys.path`) | `armdis.py` loads the three sections, resolves PIC address pairs, and is imported by most scripts here. efx is not in this repo |
| enemy class registry | `C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.py` | class -> vtable, module, band, action main |
| the static-init emulator | `C:\MHGU-Extract\build\arm\` (`emu.py`, `dti.json`) | runs `main` after all its `init_array` entries |
| the viewer | `C:\MHGU-Extract\MHGU-Monster-Viewer\` | the `.mjs` checks import `docs/render/*.js` |
| a temp scratchpad | `C:\Users\...\AppData\Local\Temp\claude\...\scratchpad` | 277 occurrences in 246 files: the folder they ran in. Read it as `<archive>` |

Python 3 with `capstone` (disassembly) and `unicorn` (emulation); some use `numpy`. The `.mjs` / `.js` files run on Node.js. The
emulation is ARM32 (the Switch build's code); see the porting guide for what changes on other platforms.

## What was left out, and how to get it back

[`EXCLUDED.md`](EXCLUDED.md) lists every file left out, with its reason. In short:

- **Uncited run output:** census, disassembly and trace dumps that no note cites. These are usually rewritten by the script beside
  them; that was not checked file by file.
- **Files over 200 KB:** the larger dumps, data JSON, and generated or copied JS.
- **Not scripts or notes:** images, models, recordings, logs, pickles and binary snapshots.
- **Copies:** copies and patched copies of the viewer's own files (git has those), and backup versions of scripts kept beside the
  live one.
- **Bulk inputs:** five inputs over 20 MB were never archived. Each is rewritten by an included script:

  | file | rewritten by |
  |---|---|
  | `zg\jspd_in*.json` | `zg\jscheckpd.py` |
  | `zg\js019_in.json` | `zg\jscheck019.py` |
  | `zg\pool2ctl.json` | `zg\pool2ctl.py` |
  | `d410\slotpts.pkl` | `d410\slotpts.py` |

Nothing here contains the game's files or bytes in bulk. Notes quote individual values and instructions read from the ROM, and a few
scripts transcribe one short game routine each (for example `t3/rom_t3.js`), as the viewer's own `docs/render/rom/` does.

## Rules the notes follow

These are from the project's agent rules (`CLAUDE.md` in the parent folder, not in this repo) and summarised in the porting guide:

- A value is READ only when the instruction that consumes it has been read.
- Every negative has a positive control run the same way.
- Extents are derived, never chosen.
- Withdrawn findings are kept, with their correction, in rom-map's Withdrawn table.

Read a note's own status words before reusing a result.
