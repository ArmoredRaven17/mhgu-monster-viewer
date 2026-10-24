# Malfestio (em079_00) / Nightcloak Malfestio (em079_04) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (Raven: the Bird Wyverns, easiest first; dev/bird-wyverns-effects-survey.md
"What closing each needs" 3). Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit.
`R` = READ (the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/bird-wyverns-effects-survey.md (Malfestio / Nightcloak: 0 bindings outside the file mask, 121 /
134 bindings), rom-map.md ("The PSL enable word per class" row uEm079_00 `0xfef4b8`; "THE PSL ENABLE MASK"; the uShellEmBase31
rows naming Malfestio's spawner `0xff2604`), docs/render/psl-mask.js whole, dev/em038_00-effects-spec.md and
dev/em042_00-effects-spec.md (the format), E:\offline\decode\notes\states-em079_00.md and states-em079_04.md (§1.2 "Every
variant test in the class"), states-em001.md (op 0x92), the task board (grep: only the survey's line), monster.js CLIP_EFFECTS
em079_00 / em079_04, efx/agents/nightcloak-scratch (s2_v0.txt / s2_v4.txt action probes).

Survey gap: enable word unread; the whole-block plan equals the file-mask plan (121 / 134 rows), so the question is only which
in-mask bindings the word gates.

## 1. The word — uEm079_00 vt+0x13c = `0xfef4b8` — R, emulated

Vtable **`0x17e9444`** (checked: `+0xf0` = base `0xca52c`; `+0x208` = `0xff036c` = class-effects.json's frame handler).
Extent **`0xfef4b8..0xfef518`**: one `push {r4, r5, fp, lr}`, exits `popne` at `0xfef504` and `pop` at `0xfef518`;
`0xfef51c` is the next method (vt+0x1d0, the u request: the word at `0x17e9614`), `0xfef54c` the one after (vt+0x138,
`0x17e957c`). One `bl`, to the base.

    0xfef4c4  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xfef4c8  cmp #0x8d, motion lsr #1  -> motion 0x11a / 0x11b (L1 M26 / L1 M27), else pop
    0xfef4d4  ldrb [e+0xb5f5] == 4      -> Nightcloak only, else pop          ; THE ONE VARIANT TEST IN THE WORD
    0xfef4e4  ldrb [e+0x73e0] == 7      -> status 7, else pop
    0xfef4f4  (ldrb [e+0x73e1] & 0xfe) == 0xcc -> number 0xcc or 0xcd, else popne (0xfef504)
    0xfef508  movw r0,#0x13f4; ldr r0,[r4,r0]!; orr #0x38000; str r0,[r4]  ; |= bits 15-17 (post-indexed pointer)
    every other case: the base alone

So **Malfestio (variant 0) is the base word on every motion** — the method reads nothing else for him — and **Nightcloak adds
bits 15-17 on L1 M26 / L1 M27 while the action is (7, 0xcc) or (7, 0xcd)**. It reads no part, sever, rage, posture or cloak
state (`e+0xcafc` is not touched): the viewer needs no new state field.

The decode note states-em079_04.md §1.2 lists this site (`0xfef4d4`, "+0x13c") as "at action (7, 0xcc) / (7, 0xcd) the
attack-hit-group getter returns early". Both halves are corrected here: the slot is the PSL enable word (the "attack hit
groups" reading is rom-map's withdrawn trap), and at those actions Nightcloak's word **gains** bits 15-17 — it is every other
case that returns with the base. Its count of 27 `== 4` variant tests in the class stands (one of them is this one).

Negative with control: the band `0xfee698..0xffe0dc` (uEm077_00's code end to uEm080_00's start; it contains
class-effects.json's `0xfef344..0xffd1e4`) has exactly one `0x13f4` immediate, `0xfef508`, and no `ldr`/`str` with an
immediate `0x13f4`. The same scan over uEm077_00's band finds its two (`0xfee0b4`, `0xfee118`) and over uEm084_00's its three
(`0x106cb44`, `0x106cb54`, `0x106cb98`).

**Emulated** (`<archive>/mm/emu13c_mm.py`: emu13c.py plus the variant byte e+0xb5f5; case = motion:status:number:sever:
rage:tired:variant):

| case | word |
|---|---|
| L1 M26 (7, 0xcc) / (7, 0xcd), variant 4, calm | `0x381ff` |
| L1 M27 (7, 0xcc), variant 4, calm | `0x381ff` |
| L1 M27 (7, 0xcd), variant 4, enraged | `0x38e3f` |
| L1 M27 (7, 0xcd), variant 4, tired + sever bit set | `0x3f03f` |
| L1 M26 (7, 0xce) / (7, 0xcb) / (6, 0xcc), variant 4 | `0x1ff` |
| L1 M26 / L1 M27 (7, 0xcc / 0xcd), **variant 0** | `0x1ff` |
| L1 M26 (7, 0xcc), variant 1 / 5 | `0x1ff` |
| L1 M28 / L1 M25 / L2 M26 / L0 M26 (7, 0xcc), variant 4 | `0x1ff` |
| L2 M3 calm / enraged, variant 0 | `0x1ff` / `0xe3f` |
| L3 M5 (1, 4) tired, variant 4 | `0x703f` |

All match the read.

**For psl-mask.js CLASS_MASK:**

    // MALFESTIO (em079_00) and NIGHTCLOAK MALFESTIO (em079_04), one class uEm079_00 (vtable 0x17e9444; +0xf0 the base
    // 0xca52c), vtable +0x13c = 0xfef4b8, READ whole (0xfef4b8..0xfef518, the pop) and emulated (dev/em079_00-effects-spec.md
    // 1). 0xca170 first, then ONE arm: motion >> 1 == 0x8d (L1 M26 / L1 M27), variant byte e+0xb5f5 == 4 (Nightcloak),
    // status 7 and (number & 0xfe) == 0xcc -- (7, 0xcc) / (7, 0xcd) -- ORs bits 15-17 (0x38000) through the post-indexed
    // pointer (0xfef50c). Every other case, and every case on variant 0, is the base word: Malfestio never fires above bit 14.
    // On the PSLs: Nightcloak's L1 M27 b15 u 361 (em079_04_005); bits 16-17, and L1 M26's 15-17, are named in no block.
    const em079_00 = () => 0;
    function em079_04(motion, action){
      if ((motion >>> 1) === 0x8d && action && action[0] === 7 && (action[1] & 0xfe) === 0xcc) return 0x38000;
      return 0;
    }

Inputs: motion and action only (the variant is the monster id). With no action (`null`), Nightcloak's L1 M27 b15 is off —
so the clip needs a CLIP_ACTIONS entry (§2).

## 2. Which actions play L1 M26 / L1 M27 — R

* **One body plays both**: `0xff757c(e, r1 mode, r2 kind)`, a phase machine on P+0x1a1 (table `0xff75b4`, `cmp #4`):
  phase 0 posture 0, setMotion0 **L1 M26** (`0xff75e0`), blend 4; phase 1 at the motion's end (`0xb09c8`) `0xff27cc(e, 0)`,
  posture 3, setMotion0 **L1 M27** (`0xff763c`); phase 2 frame test (`0xb0968`) and, for kind 2 only, `0xff26fc(e, 3)` (a
  0x30-byte request enqueued through `0x48b884`, handle e+0xcb54: a shell request, which shell NR); at the end mode 2 ->
  vt+0x3e4, mode 1 -> **L1 M28** (`0xff76f4`); phase 3 at the end posture 0, **L1 M29** (`0xff7758`); phase 4 at the end
  vt+0x3dc. These are the only `movw 0x11a` / `0x11b` in the band; the decode notes' script tables name no L1 M26 / M27 (I,
  grep). Callers (`b`, the only two):
  * status 7 (handler `0xff5fe8` = status table `0xfefae4` entry 7; number table `0xff6018` on n - 1, `cmp #0xe2`):
    **(7, 0xcc)** -> `0xff6714` -> `0xff757c(e, 1, 2)`; **(7, 0xcd)** -> `0xff6720` -> `0xff757c(e, 2, 2)`;
  * status 2 (handler `0xff3648` = entry 2; table `0xff3678`, `cmp #0x35`): **(2, 4)** -> `0xff3820` -> `0xff757c(e, 1, 0)`;
    **(2, 5)** -> `0xff382c` -> `0xff757c(e, 2, 0)`. The action probes agree (nightcloak-scratch s2_v0.txt / s2_v4.txt:
    (2, 4) / (2, 5) setMotion0 L1 M26, both variants).
* The action holds through every phase (no setAction until vt+0x3e4 / vt+0x3dc), so **L1 M27 is played under (7, 0xcc / 0xcd)
  or (2, 4 / 5), nothing else**.
* **The command tables** (`scratch-em/em079_0{0,4}/enemy/cmd_tbl/*.emc`, parsed with malfestio-scratch/emc.py): op 0x92 is
  the switch on the variant byte (states-em001.md: case `0x8453c` reads e+0xb5f5). g1 s7 / s8 / s54: `92 01 00` (variant 0)
  -> (2, 4), default -> (7, 0xcc); g1 s12: case 0 (2, 5), default (7, 0xcd); g1 s9 / s10 / s13 / s14: case 0 (2, 5), default
  op `14 63` / `14 64` (I: a call of g1 s99 / s100, which issue (7, 0xcc) / (7, 0xcd)). Outside any switch: (2, 4) in g1 s11 /
  s31 / s32, g5 s1, g8 s0; (7, 0xcc) in g1 s99; (7, 0xcd) in g1 s100 / s107 / s108 / s112. Both tables issue the same.
  So **Nightcloak reaches L1 M27 both ways**: (7, 0xcc / 0xcd) fires u 361, (2, 4 / 5) does not. Which stream the AI runs is
  its own choice — the viewer shows each as its own entry.

## 3. What the word changes — whole-block plan (equal to the file-mask plan, 121 / 134 rows)

`<archive>/ng/planrows.py em079_0X [--whole]`. Every binding not listed sits on bits 0-5 and stays always-on.

**Turned ON**: none (whole = file, row for row).

**Gated** (in the file mask — the viewer fires them in every state and action today):

| monster | binding | record | game |
|---|---|---|---|
| em079_04 | **L1 M27 b15** f0-6 | u 361 (`em079_04_005`, exported) | only under (7, 0xcc) / (7, 0xcd) |
| both | L2 M12 b6 f10-37 | c 130 (`cm202_004`) | calm, not tired |
| both | L2 M12 b12 f10-37 | c 130 (`cm202_004`) | tired and calm — so L2 M12 fires c 130 once calm or tired, never twice, and not at all enraged |

**Turned OFF — never enabled**: none in the data. Malfestio's own L1 M27 b15 (u 361) has no record in any array (the
survey's "named with no record") and the word never enables it for variant 0 either.

**Enabled, named in no block**: Nightcloak's bits 16-17 on L1 M27 and bits 15-17 on L1 M26 (the plan has no L1 M26 row).

## 4. CLIP_ACTIONS

    // NIGHTCLOAK MALFESTIO, L1 Motion[27]: played by 0xff757c phase 1 under (7, 0xcc) / (7, 0xcd) (status-7 table 0xff6018 ->
    // 0xff6714 / 0xff6720) and (2, 4) / (2, 5) (status-2 table 0xff3678 -> 0xff3820 / 0xff382c); his command streams take
    // the status-7 form on the variant switch's default (op 0x92). Each play the next: u 361 on the first, not on the second.
    // (7, 0xcc) stands for (7, 0xcd), (2, 4) for (2, 5): the word reads (number & 0xfe).
    em079_04: {
      '1|Motion[27]': [{ action: [7, 0xcc] }, { action: [2, 4] }],
    },

Malfestio (em079_00) needs none.

## 5. What to implement, in order

1. psl-mask.js: `em079_00` (`() => 0`) and `em079_04` as §1 into CLASS_MASK; both ids into `PSL_MASK_MONSTERS`; the
   em079_04 CLIP_ACTIONS entry of §4 in the same change (without it u 361 never fires).
2. `add_effects.py em079_00 --check` / `em079_04 --check` (no regeneration is owed: the whole-block plan equals the
   file-mask plan; `--apply` would rewrite the same rows), then the live soak with `--viewer-inputs`.
3. Raven verifies: Nightcloak L1 M27 shows u 361 on alternate plays; L2 M12's c 130 once when calm or tired, none enraged.

NOT READ, by name: the conditions of the AI's stream choice beyond op 0x92 (op 0x14's call reading is I); what
`0xff26fc(e, 3)` spawns on the (7, 0xcc / 0xcd) plays (a shell request; Malfestio has no shells.js entry — out of this
spec's scope, flagged); what `0xff27cc(e, 0)` does with handle e+0xcb4c before L1 M27.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **`0xff27cc(e, 0)` / `0xff26fc(e, 3)` -- READ by the shells lane** (rom-map rows `0xff27cc` "THE PUSH" on the kept whirlwind
  e+0xcb4c, `0xff26fc` the shell00 spawner, em079-shells-spec.md). Superseded here.
* **Op 0x14 as a call -- READ** (`0x83e1c`, rom-map "Effects open items"); op 0x6f / 0x92 share one switch (`0x8e088`). The other
  conditions of his stream choice stay walked both ways (an upper bound), as section 2 says.
