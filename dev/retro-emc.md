# Why we keep missing effects — the EMC/shell lane's account

Written 2026-09-30, from one day on Basarios (em004_00) and the seven monsters signed before him.
Plain statements. Grouped by cause, not by time.

---

## 1. Reported as done, not on screen

**What my sign-off actually measured.** For #1–#7 I signed the "shell half" on a coverage oracle:
every `(shell, mode)` in the monster's arc is transcribed in `shells.js`, and the keys those modes
name match the wired records. Under-production, over-production and dead references all zero.

**What it did not measure**, and what turns out to decide whether anything appears:

- whether any **action** spawns that mode;
- whether a **spawner branch** exists — `stepShells` dispatches on literal ROM addresses
  (`a.spawner === 0xd18ee0`, …), so a monster whose spawner address has no branch spawns nothing;
- whether the class **overrides the landing** (`+0x150`) and is registered in the `LANDING` map —
  if not, it silently runs the generic base landing;
- which **placement path** the shell's flags word selects — from the spawn request, from a joint, or
  at the monster's root;
- whether the runtime's **parameter reader** is the same one the class uses.

A monster can score perfectly on all four oracle lines and put nothing on screen. Basarios did.

**Concrete cases from my own lane today:**

| reported | actually |
|---|---|
| `em004_00` entry written, oracle clean (0 untranscribed, 0 under, 0 dead) | nothing could spawn: no spawner branch for `0xd283fc` / `0xd2ba08` |
| entry verified | entry had no `actions` key; `pickVariantsFor` iterates it unguarded, so **every play of Basarios threw**. My verification was a module parse plus the oracle. Neither loads the monster. Caught by Effects. |
| ten actions written | all `pick: 'unread'`, which by this file's own convention means *nothing issues it* — while I had just reported that the command table issues all of them. Selection returned nothing. Caught by Effects. |
| the two `Motion[20]` actions written as three rows each | `variantActionFor` uses `.find`, so only the first row of a repeated variant ever fires. Mode 8 would record; 9 and 10 never. Caught by nobody — found while fixing the `pick`. |
| `base: 'base13'` | `base00`. The whole parameter map, the movement reading and the behaviour prediction were from the wrong base class. |

**What it would have taken to notice, in every one of these cases:** load the monster, play the clip,
look. Parse and oracle cannot see any of it. The two failures that were caught were caught by an agent
who ran the page (Effects) and an agent who watched the screen (Render).

---

## 2. Findings I withdrew today, by cause

### (a) A name or metadata trusted as ownership or behaviour

- **Shell ownership from class names.** `uShellEm005_sp_02` is *Basarios's* shell02 and
  `uShellEm004_sp_01` is *Gravios's* shell01. The names are crossed. Ownership is an em-number test in
  the enemy class (`0xd2e538`), not the name.
- **`base` from the DTI parent.** `dti.json`'s `parentDti` says `uShellEmBase13`. The vtable says
  `base00` — 256 of 288 slots identical to a known base00 shell, 77 to base13. Everything downstream
  collapsed with it: the near/far clamp analysis, the flags-bit analysis, the `params13` field map, and
  a published prediction that the shell would sink rather than fly.
- **I flagged another agent's correct entry as wrong** on the same bad DTI-parent reasoning
  (`em003_00`'s `base00`/`base01`). Retracted. Doubting correct work on a bad premise costs as much as
  the original error.

### (b) A scan bounded wrongly

Four instances, at four different granularities:

- **Class band from vtable clustering.** `0x404000..0x408a00` for base13 swallowed a neighbouring
  class whose constructor writes the *opposite* value to the same field. Would have inverted the flags
  conclusion.
- **Vtable base from `dti.json`'s `vtVar`.** Off by `0x174` — a sub-object vtable. A membership check
  returned all-negative and looked like evidence.
- **Fixed 0x400-byte window per method.** Ran past short functions into their neighbours; attributed
  the reader's field accesses to three unrelated slots. One fourteen-instruction method appeared to
  read six fields it never touches.
- **Reading one arm of a two-condition sequence.** Reported the values `2/3/8/9`; they are `3/7/8/9`.

### (c) A comment trusted over a read

- `init00`'s comment says "the degree offsets `+0x15ec` / `+0x15f0` are 0 from the ctor". I reinstated a
  withdrawn reading on the strength of it. Nothing reads those fields on the path Basarios takes.
- The same function's comment cites "reader `0xe820a4`". That address is the **aim**, not a reader; it
  has no accessor calls. The reader is `0xe82304`, named on `params00` itself.

### (d) One monster's code assumed general

This is the largest cause by consequence.

- **`params00`** is a transcription of one monster's reader. Its `.sh` index map differs from
  Basarios's, it requires a `cmn` block he has no file for, and it hard-codes two motion ids that are
  that monster's.
- **`init00`** takes the joint path unconditionally. That is correct for the reference monster, whose
  flags clear bit `0x10`; Basarios has it set and the ROM places his shell from the spawn request.
- **`LANDING`** is keyed by class name. Basarios is absent, so he would run the generic base landing,
  and `u 161` — spawned by his own landing — would never appear.
- Generally: **the base00 runtime in `shells.js` is a transcription of the arms one monster's flags word
  selects.** Basarios's word is nearly full where the reference's is nearly empty, so he takes the other
  arm almost everywhere.

### (e) A field nothing reads

- The spread-angle reading. Proposed; retracted for the wrong reason (wrong base class); reinstated on a
  comment; qualified; finally dead because **no instruction reads `+0x15ec` or `+0x15f0`** on base00's
  path or in any of his class's 15 override targets. At no point in that cycle did I look for the read.
  The numbers made an orderly fan across the eleven modes and I reasoned from the shape of the data.
- **flags ← `ints[1]` raw.** The value is `-1` on ten of eleven modes. Passing it would have set every
  bit of a word the base tests bitwise. The reader does not store it — it sets or clears **one bit**
  according to whether it is `-1`.

### (f) Proximity used as a proxy for aboutness

Three custom classifiers, three wrong answers:

- "a read of `+8` followed by a shift within six instructions" — found nothing, **and the positive
  control found nothing either**, so the result was worthless. I reported it as inconclusive, which was
  right, but I should not have run it that way.
- "any `str` within four instructions" = a store to the field — false positive on a **stack** store.
- the 0x400-byte window above.

The fix in all three: check the thing, not its neighbourhood; and run a positive control before
trusting a negative.

### (g) Reasoning over a set with an unresolved member

I refused `u 130` as "no spawn site". Three of the four spawn sites write the mode as a literal; I read
those. The fourth writes it **from a register** I never resolved, and I had it noted as unknown in my own
working file. It is the only one of the four with a monster test, and it is Basarios's: mode 1, `u 130`,
reachable. This is distinct from the other causes — the gap was written down and then reasoned past.

---

## 3. What the shell layer costs per monster, from Basarios

**Generic per base class** (once, reusable):

- the base's path methods, the object offsets they consume, and every flags bit they test — **with both
  arms of each test read**, not only the arm the first monster took.

**Per monster** (every time, none of it inferable from the data):

1. `base` by **vtable slot-for-slot comparison** against a shell whose base the file already states.
2. the class's **overrides**: veneers followed one instruction, bounded by function, not by window.
3. the reader's **destination map**, composed by offset against the runtime's reader's map.
4. the **flags word bit by bit** after that reader, against the reference — this decides which arms the
   monster takes, and therefore whether the existing runtime is correct for it at all.
5. the **spawner's request**: what each field carries and which the base consumes.
6. a **per-class landing** when `+0x150` is overridden, plus its `LANDING` key.
7. **second-generation spawns** — a shell spawning a shell is runtime, not data; there is no field for
   it in `SHELL_DATA`.
8. a **spawner branch**, because dispatch is on literal ROM addresses.

**What I do not know:**

- **Whether Basarios's eleven modes differ at all.** Their `.sh` blocks differ only in the two fields
  nothing reads; their effect files are identical; the spawn request is not per-mode. Under everything
  established so far the eleven are behaviourally one shell. That cannot be right, so one of my findings
  is wrong and I stopped rather than build on it. This is unresolved.
- **base02 entirely.** No runtime of any kind in `shells.js` — no reader, init, move or landing — and
  `em004_00`'s shell02 is the only base02 shell in the file, so there is nothing to compare against.
  `u 130` needs a base class transcribed from scratch.
- **Whether #1–#7's shells actually spawn, land and place correctly.** They were signed on coverage.
  I have not checked one of them against the criteria above.

**Estimate, honestly:** the per-monster list is about a day for a monster whose base class is already
transcribed *and* whose flags word matches the reference. Basarios matched neither and took a day with
the work unfinished. A monster on a fresh base class is several days. I would not quote a figure for the
remaining monsters without carriers until #1–#7 have been re-checked, because that re-check may find the
same class of problem in work already signed.

---

## 4. Organisation

**The sign-off criterion was wrong, and that is the single largest organisational cause.** "Every
`(shell, mode)` transcribed" was accepted as completing a monster's shell half. It measures the table,
not the screen. I proposed it; the PM accepted it; neither of us asked "does anything spawn?" until
Render saw Rathian and asked where two records were. Seven monsters carry that signature.

**The verification standard was parse-and-oracle until it broke.** It was raised to "load the monster
and play the clip" only after my entry threw on every play of Basarios. That should have been the
standard from the first entry.

**Lane boundaries delayed discovery.** Effects measures effect data, I measure command and shell data,
Render looks at the screen. Every failure found today was found by someone running the page — Effects
hitting the throw, Render seeing Rathian's missing records. The two data lanes agreed with each other
for hours while both were describing something that did not render. Two lanes agreeing is not
corroboration when both read the same kind of artefact.

**The PM's part**, directly, since asked:

- The PM's challenges caught more of my errors today than my own checks did: the placement question, the
  consequence of an all-ones flags word, the arm walk that found a sixth test, "read it as a condition",
  the known-answer lever, and the contradiction between two of my own store audits. That contribution
  was large and I would not have got here without it.
- **The reporting cadence hurt.** A report was expected after each small read. Several claims I later
  withdrew were stated in a report *before* the consumer was read, because a report was due and a
  partial result looked like a finding. "Do not report until the chain closes" would have prevented at
  least three withdrawals.
- **Hypotheses arrived attached to instructions.** The mode-unpacking theory, "the request vectors are
  per mode". I spent reads confirming or denying those rather than reading the thing itself. Both turned
  out wrong, and the second one is what I stopped on. A question without a proposed answer would have
  been cheaper.
- **Architectural work was scheduled inside a per-monster walk.** Basarios needed a base class's runtime
  corrected, a landing mechanism, a spawner and a reader. That is not per-monster work, and doing it
  under "finish monster #8" stalled the walk and pressured every intermediate result.

---

## 5. What I would change, in priority order

1. **Change the sign-off.** A monster's shell half is signed when the monster has been loaded, the clip
   played, and the record seen. Coverage becomes a pre-check that can only *fail* a monster, never pass
   one.
2. **Make the data lane able to fail itself.** Add to `moncheck.py`, per `(shell, mode)`: is there an
   action; does its spawner address have a branch; is the class's landing registered if it overrides
   `+0x150`; which placement path does its flags word select. Four lines that would have failed Basarios
   on day one.
3. **Re-check #1–#7 on those criteria before adding monsters.** If the same class of problem is there,
   adding #9 onward multiplies it.
4. **No field is given a meaning without the instruction that reads it.** Name the read site, or write
   "no consumer found" — which is itself a result, as it turned out to be twice today.
5. **A positive control before any negative from a custom detector.** If the control cannot find the
   known case, the negative is not evidence.
6. **Bound every scan by a structure** — function start, vtable membership, module — never by an address
   window or a fixed byte count.
7. **Treat names, DTI parents and comments as hypotheses**, tested against the vtable and the consumer.
   Three different pieces of metadata pointed the wrong way on one shell today.
8. **Lift base-class work out of the monster walk.** Transcribe a base class once, completely, with both
   arms of every flags test, before any monster on it is entered.

**Stop doing:**

- Stop signing coverage.
- Stop reporting between reads; report when a chain closes.
- Stop pre-announcing what a shell will look like. Three predictions today rested on fields nothing
  reads.
- Stop correcting another agent's work from a single read of mine. I did it once today and the flag was
  wrong.

---

## 6. On other agents' accounts

I have not seen them, so I record no disagreement. One point I would expect to differ on: Effects and I
independently derived the same pairing of Basarios's records, from different files, and treated the
agreement as corroboration. It was — for the pairing. It was not evidence that either of us had the
right base class, the right placement, or anything that renders. Two lanes agreeing about data is worth
less than one lane looking at the screen.
