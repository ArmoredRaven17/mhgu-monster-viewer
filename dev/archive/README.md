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
- `gapA\`..`gapP\`: one decode question each, with its `RESULT.md`.
- `t3\`: the ARM-VFP leaf-routine translator.
- `duo\`: the Seltas duo census.
- `docaudit\`: the 2026-10-24 documentation audit.

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
