import os
def patch(p, reps):
    d = open(p, 'rb').read().decode('utf-8')
    for a, b in reps:
        assert d.count(a) == 1, (p, a[:70])
        d = d.replace(a, b)
    open(p + '.tmp', 'wb').write(d.encode('utf-8'))
    os.replace(p + '.tmp', p)
    print('ok', p)

R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
patch(R, [
    ("Reading the timer's slot states on that step refused every eruption. And one timer step is one viewer frame: an event flag on the input lives for every game frame the shells step inside it -- take it once by its sequence number.",
     "Reading the timer's slot states on that step refused every eruption. And one timer step is one viewer frame: an event flag on the input lives for every game frame the shells step inside it -- take it once by its sequence number. [2026-10-25 later: the effects lane rebuilt slime063 to 0xf36100's machine -- the RAW state 0..3, unchanged through the fuse, the countdown -1 turning it the next step -- so the burn-out step now carries the state 0xf46234 tests and eruptStep063 reads it as it is (the forced Red is removed); the seq-once rule stands: one slot can erupt again after the viewer's 60-frame re-arm, each with a new seq.]"),
    ("`slime063` / `erupt063 {slots, seq}` (the effects lane's slime063 timer, slimeShellInput), `tailSevered` (shellTailInput) | viewer | built | shells.js state063; eruptStep063 takes each seq once and treats a burned-out slot as Red for its own explosion (trap 146) |",
     "`slime063` (the RAW slot state [ctl+0x54 + 8k], 0 Yellow / 1 to Red / 2 Red / 3 to Yellow; Red = 2 only, as 0xf459b4 / 0xf3b7e8 / 0xf46234 test) / `erupt063 {slots, seq}` (the effects lane's slime063 timer, rebuilt to 0xf36100's machine; the hit is a click on the model, `window.__slime063.hit(slot)`), `tailSevered` (shellTailInput) | viewer | built | shells.js state063; eruptStep063 takes each seq once and reads the burn-out step's state as it is (trap 146) |"),
])
S = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em063_00-effects-spec.md'
patch(S, [
    ("`slime063` / `erupt063` (the effects lane's slime timer: Red while Red Slime is on and the slot not spent;\r\n  the burn-out slots with a sequence number), `tailSevered`. The shells take each `erupt063` sequence once, and a burned-out slot as Red\r\n  for its own explosion (the timer has already marked it spent; the ROM turns it Yellow the next tick) -- rom-map trap 146.",
     "`slime063` / `erupt063` (the effects lane's slime timer, 0xf36100's machine: the RAW slot state 0 Yellow /\r\n  1 to Red / 2 Red / 3 to Yellow -- Red is 2 only -- and the burn-out slots with a sequence number; the hit is a click on the model,\r\n  `window.__slime063.hit(slot)`, and an erupted part re-arms Red after the viewer's 60 frames), `tailSevered`. The shells take each\r\n  `erupt063` sequence once and read the burn-out step's state as it is (still 2: the countdown -1 turns it the next step) -- rom-map\r\n  trap 146."),
])
