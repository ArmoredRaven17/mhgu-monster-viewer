# Gypceros (em009_00) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (the Bird Wyverns survey's "overrides to read", after Kut-Ku). Static
ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming
instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/bird-wyverns-effects-survey.md ("Gypceros"), rom-map.md ("The PSL enable word per class":
`0xd5e768` R / UNREAD; the `0x9d36c` break-level getter row; the `0x3a8430` chooser row; the uEm049_00 `[[E+0x75f0]+0x64]`
threshold row; the EMC op table row, op 0x92 = the variant switch), docs/render/psl-mask.js, motion-states.js
(MOTION_STATES em009_00, SHELL_TAIL / SHELL_PARTS), E:\offline\decode\notes\states-em009_00.md (its vtable table names
+0x13c "attack hit groups (keyed on the motion, band 0x403..0x419)" — the slot is the enable word; the band is right),
the task board (grep: only the survey's own line).

Survey gap: enable word unread, 17 bindings outside the file mask (110 file-mask bindings, 127 whole-block); c 140 / c 141
named and not exported.

## 1. The word — uEm009_00 vt+0x13c = `0xd5e768` — R, emulated

Vtable **`0x179c5d8`** (checked: `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x208` = `0xd5d508` the frame handler,
`+0x210` = `0xd5e39c` the part pass, as states-em009_00.md lists them). Extent **`0xd5e768..0xd5e838`**: one
`push {r4, r5, r6, r7, fp, lr}`; exits `pophs` at `0xd5e7e0`, `pop` at `0xd5e7f4` and `0xd5e838`; the word at `0xd5e83c`
is the method's PIC literal (`0xad3488`, loaded at `0xd5e7c0`); `0xd5e840` is the next function's `push`.

    0xd5e774  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xd5e778  k = motion - 0x403; k > 0x16 -> return       ; bhi 0xd5e838: only L4 M3..L4 M25 go on
    0xd5e794  bit k of 0x400021 (tst r2, r1, lsl r0)       ; k 0 / 5 / 0x16 = L4 M3 (0x403), L4 M8 (0x408), L4 M25 (0x419)
    0xd5e7a4    lvl = 0x9d36c(e, 6)                        ; byte P+0x3bc + 6*12 = P+0x404: part 6's break level (the crest)
    0xd5e7b0    A   = [[e+0x75f0]+0x64]                    ; the .dtp +0x64 break rows; r6 = A[1], r7 = A[2]
    0xd5e7cc    thr = 0x3a8430([[0x1831c54]]) <= 4 ? A[1] : A[2]      ; movle r7, r6 (GOT 0x1831c54 = PIC 0xad3488 + 0xd5e7cc)
    0xd5e7dc    lvl >= thr -> return (pophs)               ; unsigned, thr uxtb
    0xd5e7e8    else |= 0x8000 (bit 15)
    0xd5e7fc  bit k of 0x50 (tst)                          ; k 4 / 6 = L4 M7 (0x407), L4 M9 (0x409)
    0xd5e808    status e+0x73e0 == 7 and e+0x73e1 - 0x26 <= 2 (n 0x26, 0x27, 0x28) -> |= 0x70000 (bits 16-18)
              any other action -> nothing
    every other motion (and the other 18 k in range): the base alone

Both writes go through a post-indexed pointer (`ldr r0, [r4, r0]!` at `0xd5e7e8` / `0xd5e82c`, `r0` = the `movw #0x13f4`
before each) and the one `str r0, [r4]` at `0xd5e7f0` (the second arm branches to it from `0xd5e834`).

**The crest test is the part pass's own** (R, the rows are states-em009_00.md's): the same getter `0x9d36c(e, 6)`, the
same rows `[[e+0x75f0]+0x64]` and the same rank choose decide set 9 in the part pass `0xd5e39c` (note §2: `breakLevel(e,
6) >= thr -> setVisibleGroup(e, 9)`) and the crest capsule in vt+0x1dc `0xd536f4` (note §3.3). His `.dtp +0x64` is the
single row `{part 6, level 2, level at G 2, group 1}` (note §3.1), so thr = 2 at either rank and **the `0x3a8430` choose
changes nothing for him** (its byte's meaning stays NR, rom-map's `0x3a8430` row). So: **bit 15 fires on L4 M3 / M8 / M25
while the crest is unbroken, and stops on the depletion that draws set 9.** No sever: he has none (note §3.4); P+0x3b4
is not read here.

**The action arm's actions** (R): the status-7 handler `0xd5c234` (table `0xd5c260`, `cmp r0, #0x52`; `<scratchpad>/ng/
jt.py`) sends **(7, 0x0a / 0x26 / 0x29)** to `0xd5c3ac` and **(7, 0x0c / 0x28 / 0x2b)** to `0xd5c3d0`, both of whose phase 0
(`0xd5c3f8`) takes posture 0 and setMotion0 **L4 M9** (`0xd5c418`, blend 4.0); **(7, 0x1c / 0x27 / 0x2a)** go to `0xd5c428`
-> setMotion0 **L4 M7** (`0xd5c464`). These are the band's only setMotion sites for 0x407 / 0x409 (the other immediates,
`0xd5d850..0xd5d868` and `0xd5ef10` / `0xd5ef94` / `0xd5f2e8` / `0xd5f36c`, are `cmp`s against the current motion);
`0xd5c3d0`'s phase 1 calls `0xd5a8ec`, which has no setMotion call (`0xd5a8ec..0xd5abf4`).
Who issues them — `em009_00_cmdtbl.emc` (`emcfind.py`), the only streams naming any of the nine:

    g1 s4: 00 07 45 | 1d 00 00 07 | 1d 02 | 14 02 | 1d ff | 80 00 | 00 07 0a | 80 02 | 92 00 | 92 01 00 |
           1c 00 | 00 07 26 | 1c 02 | 00 07 0a | 1c ff | 92 02 | 00 07 0a | 92 ff | 80 ff | ff
    g1 s5: the same shape with 0x1c / 0x27;   g1 s6: with 0x0c / 0x28

* **op 0x92** = switch on the variant byte `e+0xb5f5` (rom-map, the EMC rows; states-em032_00.md / em001 — theirs, R):
  case 0 = Gypceros.
* **op 0x1c** (handler `0x8483c` -> `0x86b78`, read now): `1c 00` runs its body only when **`0x81688(e)` != 0**, else
  skips to `1c 02`. `0x81688` (read whole, `0x81688..0x816b4`): 0 if `e+0x1409 & 0x40`, else `P+0x518 == 1` — the enraged
  flag. So on variant 0, **enraged -> (7, 0x26 / 0x27 / 0x28), calm -> (7, 0x0a / 0x1c / 0x0c)**.
* **op 0x80** (`0x85030` -> `0xc9a9c` -> `0x8df40`): its condition is **NR**; when its case 0 holds, the calm action is
  issued whatever the rage. `e+0x1409` bit 6: **NR** (stand-in clear).
* (7, 0x29 / 0x2a / 0x2b) share the handlers and are issued by no op 00 in the file — the arm's range (0x26..0x28)
  excludes them anyway.

**Emulated** (`<scratchpad>/ng/emu13c9.py 179c5d8`, a copy of `emu13c.py` that also sets the crest level `P+0x404`, the
`.dtp` rows behind `[e+0x75f0]+0x64` (default `{6, 2, 2, 1}`) and the rank byte behind `0x3a8430`'s global; case =
`motion:status:number:sever:rage:tired[:crest[:rank[:thr1[:thr2]]]]`):

| case | word |
|---|---|
| L4 M3 calm, crest level 0 / 1 | `0x81ff` / `0x81ff` |
| L4 M3 calm, crest level 2 / 3 | `0x1ff` / `0x1ff` |
| L4 M8 (7, 0x31) calm / enraged, crest 0 | `0x81ff` / `0x8e3f` |
| L4 M8 (7, 0x31) crest 2, rank 0 / rank 5 | `0x1ff` / `0x1ff` |
| L4 M8 crest 1, rank 5 | `0x81ff` |
| L4 M25 (7, 0x3e) tired, crest 0 / 2 | `0xf03f` / `0x703f` |
| rows {6, 2, 3}, crest 2: rank byte 0 / 1 / 3 / 4 / 5 | `0x1ff` / `0x1ff` / `0x1ff` / `0x1ff` / `0x81ff` (only 5 reads A[2]); crest 1, rank 0: `0x81ff` |
| L4 M7 (7, 0x27) enraged / (7, 0x26) calm / (7, 0x28) tired | `0x70e3f` / `0x701ff` / `0x7703f` |
| L4 M9 (7, 0x26) enraged / (7, 0x28) enraged / (7, 0x27) calm | `0x70e3f` / `0x70e3f` / `0x701ff` |
| L4 M7 (7, 0x27), crest 2 | `0x701ff` (the action arm reads no crest) |
| L4 M7 (7, 0x1c) / (7, 0x2a); L4 M9 (7, 0x0a) enraged / (7, 0x0c) / (7, 0x25) / (7, 0x29) enraged | `0x1ff` / `0x1ff`; `0xe3f` / `0x1ff` / `0x1ff` / `0xe3f` |
| L4 M9 (1, 0x26) | `0x1ff` (status 1) |
| L4 M8 (7, 0x26), crest 2 | `0x1ff` |
| L4 M4 (7, 0x26), L4 M6 (7, 0x27), L4 M10 (7, 0x26), L4 M26 (7, 0x26), L4 M2 (7, 0x26), L4 M11 (1, 0x1a) | `0x1ff` each |
| L2 M12 / L1 M12 calm, L3 M13 enraged, L5 M49 (7, 0x31) | `0x1ff`, `0x1ff`, `0xe3f`, `0x1ff` |

All match the read (the crest arm runs `0x9d36c` and `0x3a8430` in every case it reaches; the action arm neither).

**For psl-mask.js CLASS_MASK:**

    // GYPCEROS (em009_00), uEm009_00 vtable +0x13c = 0xd5e768 (vtable 0x179c5d8; +0xf0 the base 0xca52c), READ whole
    // (0xd5e768..0xd5e838; literal 0xd5e83c) and emulated (dev/em009_00-effects-spec.md 1). 0xca170 first, then on
    // k = motion - 0x403 in 0..0x16:
    //   * L4 M3 / L4 M8 / L4 M25 (k in 0x400021): bit 15 unless the crest is broken -- 0x9d36c(e, 6) (P+0x404) >= the
    //     .dtp +0x64 row's level (2 at both ranks), the part pass's own set-9 test: u 320 / u 321 / u 320 with the crest on;
    //   * L4 M7 / L4 M9 (k in 0x50): status 7 and number 0x26..0x28 -> bits 16-18 (u 280). Those three are the ENRAGED
    //     forms of (7, 0x1c) (L4 M7) and (7, 0x0a) / (7, 0x0c) (L4 M9): cmdtbl g1 s4-s6, op 0x1c = 0x81688 (enraged);
    //   * every other motion: the base alone -- L2 M12's bits 15 / 18 / 21 and L1 M104's 24 (no records) never fire.
    function em009_00(motion, action, state){
      const k = motion - 0x403;
      if (k < 0 || k > 0x16) return 0;
      if ((0x400021 >>> k) & 1) return state.crestBroken ? 0 : 0x8000;
      if ((0x50 >>> k) & 1) return action && action[0] === 7 && action[1] >= 0x26 && action[1] <= 0x28 ? 0x70000 : 0;
      return 0;
    }

Inputs, and how the viewer supplies each:

* **`state.crestBroken`** — NEW (the viewer has no input for it). Read it from the parts SHOWN, as `severed` is: set 9 is
  the only set that draws group 3 (monsters.json em009_00 `groups[9]` = 3 on, 4 off, 102 off; no other set names 3 on),
  and his crest row `'3|Motion[1]': { levels: [[2], [2], [9]] }` takes it there. So **`SHELL_PARTS.em009_00 =
  { crestBroken: 3 }`** in motion-states.js, and index.html's word call passes
  `crestBroken: !!shellPartsInput(state.id, partsDrawn).crestBroken` next to `severed`. R (the threshold is the part
  pass's; the group from the data).
* **action** — CLIP_ACTIONS for L4 M7 / L4 M9 (below). The game picks the enraged form by the rage flag, so the entry
  needs an alternate keyed on rage, the twin of the existing `tired` field: `{ action: [7, 0x0a], rage: [7, 0x26] }`,
  and **clipActionFor** gains `(rage && e.rage) ? e.rage : ...` ahead of its tired arm (it already receives `rage`).
  Without that change the action falls back to the calm form and u 280 never shows — the honest default, not a guess.
* rage / tired from the viewer's toggles.

## 2. What the word changes — whole-block plan (110 file-mask bindings -> 127 whole-block)

`<scratchpad>/ng/planrows.py em009_00 [--whole]`; `add_effects.py em009_00` (plan): 27 records can go in, 25 already are —
the two missing are **c 140 / c 141** (`cm202_002`, L4 M13 b0 / b1, L4 M23 b1, L4 M48 b0 / b1): **inside the file mask on
bits 0-1, always enabled**; the word does not touch them, `--apply` / `--record` export them. Whole-block: the same 27
records (no new record comes in with the word).

**Turned ON — 13 of the survey's 17 outside the file mask, all on bits 0-2 (always):**

| binding | record |
|---|---|
| L0 M9 b0 f42 / b1 f17, f83 | c 0 / c 1 (`cm202_001`) |
| L0 M10 b0 f42 / b1 f17, f83 | c 1 / c 0 |
| L0 M12 b0 f30 / b1 f3 | c 1 / c 0 |
| L0 M117 b0 f62 / b1 f22 / b2 f9 | c 31 (`cm202_020`) / c 0 / c 1 |
| L0 M118 b0 f62 / b1 f22 / b2 f9 | c 31 / c 1 / c 0 |
| L1 M38 b0 f80-90 | u 260 (`cm202_004`) |

**Named, never enabled — the other 4** (outside the mask, and no record in any array — not effects):

| binding | why |
|---|---|
| L2 M12 b15 u 560, b18 u 570, b21 u 580 | Gypceros's arms are all L4; nothing tests 0x20c (emulated L2 M12 `0x1ff`). The same three names are Kut-Ku's, where his class does enable b15 (u 560): a shared authoring, his class does not take it up |
| L1 M104 b24 u 90 | no arm for 0x168 |

**Gated** (in the file mask — the viewer fires them in every state today):

| binding | record | game |
|---|---|---|
| **L4 M3 b15** f88, f146, f196 | u 320 (`em009_00_011`) | crest unbroken only (L4 M3 is also his combat idle (0, 1)) |
| **L4 M8 b15** f49 | u 321 (`em009_00_012`) | crest unbroken only — the flash attack's record |
| **L4 M25 b15** f70, f100, f126, f155 | u 320 | crest unbroken only |
| **L4 M7 b16** f54, f75, f98, f120 | u 280 (`em009_00_000`) | (7, 0x27) only — the enraged form |
| **L4 M9 b16** f28, f50, f70, f90 | u 280 | (7, 0x26) / (7, 0x28) only — the enraged forms |
| L4 M4 b6 / b9, b12 | u 200 / u 220 | calm / enraged (today doubled), tired-calm |
| L4 M6 b6 / b9, b12 | u 200 / u 220 | the same |
| L4 M49 b12 | u 220 | tired-calm only |

**Turned OFF:** none.

So the class turns ON 13 bindings (no new record), names 4 that never fire, and gates 12: 3 by the crest, 2 by the
enraged actions, 7 by the base state groups.

**CLIP_ACTIONS** (the plays, §1: `0xd5c234` -> `0xd5c3ac` / `0xd5c3d0` / `0xd5c428`; the rage pick, cmdtbl g1 s4 / s5 / s6
op 0x1c):

    // GYPCEROS (em009_00): the plays of the two clips his word keys on an action (0xd5e768: (7, 0x26..0x28) -> bits
    // 16-18, u 280). Status-7 table 0xd5c260: (7, 0x0a / 0x26) and (7, 0x0c / 0x28) play L4 M9 (0xd5c418), (7, 0x1c /
    // 0x27) L4 M7 (0xd5c464). cmdtbl g1 s4 / s5 / s6 issue the 0x26..0x28 form when 0x81688 (enraged) holds, on variant
    // 0 (op 0x92), else the calm form; op 0x80's own condition is NOT READ. `rage` is the enraged form.
    em009_00: {
      '4|Motion[9]': [{ action: [7, 0x0a], rage: [7, 0x26] }, { action: [7, 0x0c], rage: [7, 0x28] }],
      '4|Motion[7]': [{ action: [7, 0x1c], rage: [7, 0x27] }],
    },

## 3. What to implement, in order

1. motion-states.js: `SHELL_PARTS.em009_00 = { crestBroken: 3 }`; index.html: pass `crestBroken` (from
   `shellPartsInput`, the parts shown) into `pslMask`'s state beside `severed`.
2. psl-mask.js: `CLASS_MASK.em009_00` as §1; `CLIP_ACTIONS.em009_00` as §2; `clipActionFor` takes `e.rage` when `rage`
   (ahead of the tired arm); `'em009_00'` into `PSL_MASK_MONSTERS`.
3. `add_effects.py em009_00 --apply`, `--record`, `--check` (regenerates CLIP_EFFECTS from the whole blocks; exports
   c 140 / c 141). Recorder slot — announce.
4. Soak with `--viewer-inputs`; Raven verifies: u 320 / u 321 on L4 M3 / M8 / M25 with the crest on and gone after the
   crest break; u 280 on L4 M7 / M9 only while enraged; u 200 once, not twice, on L4 M4 / M6.

NOT READ, by name: op 0x80's condition in g1 s4-s6 (`0xc9a9c` / `0x8df40`) — when it holds the calm form is issued even
enraged; `e+0x1409` bit 6 (which makes `0x81688` answer calm); `0x3a8430`'s byte (irrelevant here: both thresholds are 2);
what L2 M12's three and L1 M104's bit 24 were authored for.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **Op 0x80's condition -- READ: there is none.** `0xc9a9c` / `0x8df40`: the open form always skips its body (as op 0x69), so g1
  s4..s6's leading calm forms are never issued; op 0x92 / op 0x1c decide, and the enraged forms come whenever he is enraged (with
  `0x81688`). The viewer's `rage` = the enraged form is the ROM's.
* `e+0x1409` bit 6: see the cross-monster row X3 of dev/effects-open-items.md.
* **`e+0x1409 & 0x40` -- the setter READ** (rom-map row `0xc983c`): it is set when the rage timer (P+0x514) runs out, with
  e+0x73dc = 1 -- the rage's end pending. While it is set, `0x81688` answers calm and op 0x1c issues the calm forms, though P+0x518
  still says enraged. In the viewer the Rage control is the rage itself; the pending stretch between the timer's end and the
  drop has no control (a short window; category c if Raven wants it). Its clear is NR.
* **The clear of e+0x1409 & 0x40**: only the spawn init drops it (`0xb8bf4`, `&= 0x41006`); no other bic / and / bfc of bit 14
  beside a 0x1408 / 0x1409 base anywhere in main.text (rom-map row "e+0x1408 bit 14 -- the clear"). Read as written, once a rage
  timer runs out the calm forms win for the rest of the spawn unless bit 16 is set; a pointer-form clear is not excluded (I).
* **The clear, re-scanned with pointer forms (2026-10-19)**: ptrscan.py over the shared layer and every enemy band finds only the
  ctor (= 4) and the spawn reset (&= 0x41006); its controls -- a pointer-form clear of e+0x1404 bits 21-22 (0xadcdc) and the spawn
  reset's register mask -- are found by the same scan. The negative stands: once set, the bit lasts to the next spawn.
* **On a second rage** (2026-10-19): the AI issues the calm forms (7, 0x0a / 0x1c / 0x0c), so L4 M7 / M9 show no bits 16-18 though
  he is enraged; parts and materials unchanged. A possible control "after first rage" for Raven (not built).
