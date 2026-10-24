# map_arms2.py: rom-map / spec / open-items / board after the efx round (2026-10-19): appends, never deletes
import io
def edit(path, pairs, binary=False):
    t = io.open(path, encoding='utf8', newline='').read()
    for a, b in pairs:
        assert t.count(a) == 1, (path, a[:70], t.count(a))
        t = t.replace(a, b)
    io.open(path, 'w', encoding='utf8', newline='').write(t)

RM = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
edit(RM, [
 ("The arms' runtimes take it as a named refusal (index.html seekTo: dropped and made again); the BODY's is open | effect runtime | R (code) / record OWED (efx slot) |",
  "The arms' runtimes take it as a named refusal (index.html seekTo: dropped and made again); the BODY's is open. **RECORDED 2026-10-19 (efx slot): vecdrawsched.py `<frame>:release:<n>` (new: the viewer's releaseRequest -- core and effects off the passes, vt+4), sets add_em084_00_c135_rel60 / c135l_rel60 / c130l_rel8 / c130l_rel45, lifted: 0xa55f20 is in lifted-proof.js; a step back with u 135 running is clean on the body and both arms (dev/checks/em084_00.mjs). `0xa55eec` ([r5] != 0) still unrecorded -- the arms keep the named drop for it** | effect runtime | R (code) / RECORDED |"),
 ("`C800.on = false` until the efx recorder has an em084_00c 800 set and the lift carries it | uEm084_00 | built / record OWED (efx slot) |",
  "`C800.on = false` until the efx recorder has an em084_00c 800 set and the lift carries it. **RECORDED AND ON 2026-10-19: sets add_em084_00_c800 / _stop / _near; two --grow rounds put `0xaf6ac0` (called from 0xaf6740) and `0x13b7264` (a matrix routine, from 0xaf6fa4) on lifted-added.js's line, each re-recorded and lifted; `C800.on = true`; the check 26/26** | uEm084_00 | built / RECORDED |"),
 ("a viewer STEP BACK on any Nakarkos idle reaches 0xa55f20 (Effects open items row, trap 115)**",
  "a viewer STEP BACK on any Nakarkos idle reaches 0xa55f20 (Effects open items row, trap 115)** -> **0xa55f20 recorded the same day (release sets, vecdrawsched `<frame>:release:<n>`); 0xa55eec stays open**"),
 ("A soak that never seeks will not find it: probe a step back with a long record live (armseek.mjs). (T: the viewer's seek; G: the destructor's free list)",
  "A soak that never seeks will not find it: probe a step back with a long record live (armseek.mjs). (T: the viewer's seek; G: the destructor's free list) [Recorded 2026-10-19 with vecdrawsched's `<frame>:release:<n>`: record the release the viewer makes, not only the stop.]"),
])
# tooling row for the release notice, after the tooling header
t = io.open(RM, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
anchor = "| `<scratchpad>/zg/jscheckarm.py [--control]` (2026-10-19)"
assert t.count(anchor) == 1
row = ("| `efx/vecdrawsched.py <frame>:release:<n>` (2026-10-19, effects lane) | THE VIEWER'S RELEASE (proof.js releaseRequest, a seek back's "
       "clearClipEffects): request n's core and effects taken off the passes and destroyed (vt+4) at the frame's start, after its stops -- "
       "a generator mid-emission walks 0xa55ea8's free-list arm | add_em084_00_c135_rel60 calls 0xa55ea8 6x and, lifted, the viewer's "
       "step back stops refusing at 0xa55f20 | vt+4 (the non-deleting dtor, the harness's bump heap) where the viewer calls vt+0: the "
       "destructor bodies recorded are the same |" + nl)
t = t.replace(anchor, row + anchor)
io.open(RM, 'w', encoding='utf8', newline='').write(t)

SP = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em084_00-effects-spec.md'
t = io.open(SP, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
t = t.rstrip() + nl + nl + nl.join([
"## Recorded and on (efx slot, 2026-10-19)",
"",
"* **The step back:** a new recorder notice, vecdrawsched.py `<frame>:release:<n>`, is the viewer's releaseRequest. It takes the",
"  core and its effects off the passes and destroys them (vt+4).",
"  * Sets: add_em084_00_c135_rel60 (the body's u 135), add_em084_00_c135l_rel60 (the arm's u 135), add_em084_00_c130l_rel8 and",
"    add_em084_00_c130l_rel45 (the arm's u 130, mid-emission and after its bit is off).",
"  * Lifted: 0xa55f20 is in lifted-proof.js. A step back with u 135 running is clean on the body and both arms (the check: no",
"    throw, no runtime dropped, the requests cleared, u 135 back).",
"  * 0xa55eec ([r5] != 0) is still unrecorded; the arms keep the named drop for it.",
"* **c 800:** sets add_em084_00_c800 / _stop / _near.",
"  * Two --grow rounds: 0xaf6ac0 (called from 0xaf6740), then 0x13b7264 (a game matrix routine, from 0xaf6fa4). Each went onto",
"    lifted-added.js's line, the sets were recorded again, and a lift followed. The earlier sets are in",
"    <scratchpad>/zg/sets_c800_r1 / _r2.",
"  * **C800.on = true.** dev/checks/em084_00.mjs passes 26/26: three requests at the ROM's points and block, held across the",
"    loop with no refusal, stopped at the next play.",
]) + nl
io.open(SP, 'w', encoding='utf8', newline='').write(t)

OI = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\effects-open-items.md'
edit(OI, [("c 800 exported + placed (placeEvent), HELD OFF until em084_00_200 is recorded; the step back's 0xa55f20 recording owed (body too) |",
           "c 800 exported + placed (placeEvent), recorded (two --grow rounds) and ON; the step back's 0xa55f20 recorded (release sets) -- body and arms clean; 0xa55eec still open |")])

B = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(B, 'rb').read()
a = b"recording owed; c 800 x3 built and held off (C800.on) until"
assert b.count(a) == 1
b = b.replace(a, b"RECORDED 2026-10-19 (release sets) -- body and arms clean; c 800 x3 built, RECORDED and ON (formerly held off until", 1)
a2 = b"em084_00_200 is recorded (0xaf6734). dev/em084_00-effects-spec.md."
assert b.count(a2) == 1
b = b.replace(a2, b"em084_00_200 was recorded: 0xaf6734, then --grow 0xaf6ac0 / 0x13b7264). dev/em084_00-effects-spec.md.", 1)
open(B, 'wb').write(b)
print('ok')
