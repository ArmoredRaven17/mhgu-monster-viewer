# The row-exclusion gate at 0x9bb904 — open, three unknowns (2026-09-29)

**Every line is a ROM read with its address, or is marked UNREAD.** Written so the next pass starts
from the page. Companion to `dev/recompose-0x31d16c-trace.md`.

## The gate, in full

A row of an effect builds **only if all three tests pass**. The first is an EXCLUSION, keyed on the
effect and a global rather than on the record, and it is the one this file is about.

    a row builds iff  NOT ((effect +0x116 | global +0x228) & row[+4])     <- 0x9bb904..0x9bb934
                      AND (row.w00 & MASK1)                              <- 0x9bb954..0x9bb960
                      AND (row.w04 & MASK2)                              <- 0x9bb964..0x9bb974

MASK1 / MASK2 come from the effect's `+0x1c8` / `+0x1cc`, written by `0x9ba670` (0x9bb69c / 0x9bb6a0)
from arguments the start supplies out of the record — **payload +0x48 and +0x4c**.

The exclusion arm, as lifted (`lifted-request.js`, 0x9bb904-0x9bb934):

    9bb904  ldrb r2, [r0, #0x116]     ; a byte on the EFFECT
    9bb908  ldr  r4, [r0, #0xf4]      ; the effect's row-table holder
    9bb918  ldr  r3, [r3, #0x228]     ; a GLOBAL word (chain below)
    9bb91c  orr  lr, r2, r3           ; lr = effect byte | global
    9bb920  ldr  r2, [r4, #0x70]      ; the per-row table base
    9bb924  add  r3, r1, r1, lsl #4   ; r1 * 17
    9bb928  add  r2, r2, r3, lsl #2   ; base + r1 * 0x44   (row stride 68 bytes)
    9bb92c  ldr  r2, [r2, #4]         ; THAT ROW'S WORD AT +4
    9bb930  tst  lr, r2
    9bb934  bne  #0x9bb984            ; returns ip, zeroed at 0x9bb90c: ROW NOT BUILT

**TWO DIFFERENT ROW TABLES, which is easy to conflate and I did:**

| table | base | stride | used by |
|---|---|---|---|
| exclusion | `[[effect+0xf4] + 0x70]` | **0x44** | the `tst` above, word at +4 |
| masks | `[[effect+0xf4] + 0x68]` | **0x10** | the MASK1 / MASK2 tests |

The decoder's `baseBlk.w00` / `w04` feed the **mask** table. Checking "is row[+4] ever non-zero"
against `baseBlk.w04` would answer a different question and look like an answer. Not done.

## Viewer status: faithful, and INERT — but that is not the same as harmless

The exclusion is **lifted in full** and the viewer applies it, so no row is built that the ROM skips
*given the same inputs*. But **nothing in the translated code writes either input**: a whole-runtime
search for `+0x116` finds exactly one reference, the gate's own read, and the global is never written
either. So in the viewer `lr = 0 | 0 = 0`, the `tst` sets Z, and **every row passes the exclusion**.

> **Do not restate this as "no bearing on anything currently on screen" — that is unestablished and
> was wrong when I wrote it (PM, 2026-09-29).** The inputs are authored data, not harness state. If
> the byte is non-zero in shipped files, then **rows are on screen now that the game hides**, on
> every monster. Whether that is so is precisely the open question.

## Input 1: effect +0x116 — AUTHORED DATA, not runtime state

A whole-`.text` scan for byte transfers at displacement `0x116` gives **12**, four of them
stack-relative. The ones that matter:

| address | what |
|---|---|
| `0x349e44` | **the deserialiser** — reads ONE BYTE from a stream and stores it (below) |
| `0x352b00` | **a clone copy** — `ldrb r2,[r1,#0x116]` immediately followed by `strb r2,[r0,#0x116]` |
| `0x980248` | inside a long constructor run storing the same two registers into many fields; whatever it sets is overwritten when the resource loads. **The stored register's value is UNREAD** |
| `0x1cdac4` | **UNREAD** |
| `0x9b9c04` | a generated getter (`ldrb r0,[r0,#0x116]; bx lr`) |
| `0x9bb904` | the gate |

**The deserialiser** (`0x349e44`), which is what makes this authored rather than stateful:

    00349e10  ldr  r1, [r5, #0x10]   ; the stream's length
    00349e14  cmp  r0, r1 / blo      ; bounds check
    00349e20  bl   #0x8232d4         ; the stream's own check
    00349e30  ldr  r0, [r5, #0xc]    ; the CURSOR
    00349e34  ldr  r1, [r5, #8]      ; the BUFFER base
    00349e38  ldrb r1, [r1, r0]      ; read one byte at the cursor
    00349e3c  add  r0, r0, #1        ; advance the cursor
    00349e40  str  r0, [r5, #0xc]
    00349e44  strb r1, [r4, #0x116]

It sits inside a **16.5 KB generated loader starting at 0x345d84**, with **414 stores** into its
target object, **in no vtable** (called directly). Three call sites:

    0003a970   bl 0x345d84   between 0x8231ac (byte-stream init) and 0x823208 (teardown)
    00398ce0   bl 0x345d84   IN A LOOP: `add r6, r6, #0x3b8` -- an array of 0x3b8-byte records,
                             with the array and its count at [r4+0x6c] / [r4+0x64]
    003bfec0   bl 0x345d84   same stream init/teardown shape as the first

`0x8231ac` / `0x823208` are the byte-stream init and teardown that `effects-pel.md` records for the
`.pel` loader.

**WITHDRAWN:** I earlier described `+0x110..+0x118` as "a packed property group" and `+0x116` as "the
high half of the +0x114 word". **Both are wrong.** The loader shows +0x114, +0x115 and +0x116 as three
consecutive **per-entry bytes** of a repeating structure, each read the same way:

    00349d14  strb r1, [r4, #0x114]   then 3 x strh [r4, r1], then strh r0, [r4, #0xee]
    00349dac  strb r1, [r4, #0x115]   then 3 x strh [r4, r1], then strh r0, [r4, #0xf0]
    00349e44  strb r1, [r4, #0x116]   then 3 x strh [r4, r1]

**WHICH RESOURCE THIS IS: UNREAD.** The three call sites give the shape — a stream in, 0x3b8-byte
records out, one site walking an array of them — but not the type. "It is near the effect code" is
not ownership; that reasoning produced a phantom Rathian request site the same day.

## Input 2: the global at +0x228 — UNREAD

Resolved statically from the gate's own PC-relative chain:

    literal at 0x9bb98c            = 0xe800d4
    ldr r3, [pc, r3] at 0x9bb910  -> 0x183b9ec        (the GOT slot)
    [0x183b9ec]                    = 0x211f554        (the object pointer; 0 in the image, filled at load)
    the gate reads                   [that + 0x228]

So it is a field on a **runtime singleton** — engine-owned, not per-monster data. **What owns
0x211f554 and what writes its +0x228 is UNREAD.**

**This input matters independently.** The two are OR-ed, so even a definitive "the authored byte is
zero in every shipped file" would NOT close the gate — it could still fire from the global alone.

## Resume points, cheapest first

1. **Name the resource.** From the caller at `0x398ce0`, which holds the array and count at
   `[r4+0x6c]` / `[r4+0x64]` — identify the 0x3b8-byte record type, then find the byte's position in
   the stream by counting the fields the loader reads before `0x349e44`.
2. **Test the shipped files.** Is that byte ever non-zero — em001..em007 first, then the tree? Zero
   everywhere closes *this input only* (see Input 2). Non-zero anywhere: it is a **loader gap in the
   viewer**, which is the Effects leg's to fix, and the effects and excluded rows can be listed.
3. **The row side.** Identify which `.efl` field becomes the 0x44-stride table, so `row[+4]` can be
   checked. The resource identified in (1) may answer this too, since `row[+4]` is the other half of
   the same authored pair.
4. Unread writers: the value stored at `0x980248`, and `0x1cdac4` entirely.

## Standing

Open, behind the `driven-split` reachability fix and the walk itself. Not closed, not parked for
want of a trigger: three unknowns, each named above, any one of which could show that the viewer
draws rows the game hides.
