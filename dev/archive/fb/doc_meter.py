# doc_meter.py: the batch's draw-meter result + the tooling rows, into rom-map after the draw-survey rows
import os
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
b = open(P, 'rb').read(); NL = b'\r\n'; BS = bytes([92])
SP = b'<scratchpad>' + BS + b'fb' + BS
anchor = b"| -- OFF CAMERA, explained: the survey camera, not the placement |"
i = b.find(anchor); assert i >= 0
j = b.find(NL, i)
rows = [
 b"| THE SHELLS BATCH'S DRAWS (shells agent, 2026-10-20; the effects agent's meter `__view.effectMeter`, run by " + SP + b"shellmeter.mjs) | "
 b"Gravios, Tigrex, Grimclaw, Akantor, Barioth, Seregios, Barroth, Uragaan, Crystalbeard, Glavenus, Hellblade, Kut-Ku, Gypceros, Iodrome, Giadrome, "
 b"Garuga, Deadeye, Diablos: **134 shell records, 107 DRAW (lit pixels; Tigrex u 30 / 33 draw off the meter's camera, lit when aimed)**. "
 b"**Grimclaw u 76 / u 78 start and build NO generator**: the record's row mask 2 selects none of em032_04_004.efl's rows (masks 5 / 4 / 8), so "
 b"the ROM draws nothing there. **24 never start, each for a named reason:** "
 b"(a) 8 need Tigrex's floor selector 2 (floor flag & 6), which no Ground type offers: Tigrex u 1 / 31, Grimclaw u 1 / 31 / 81 / 91 / 101 / 111. "
 b"(b) 13 are type-0 / type-2 contacts (a wall or a hunter; the viewer has neither), base00 / base28 ef 1 / ef 3: Kut-Ku u 2, Gypceros u 2, "
 b"Iodrome u 90 / 110, Garuga u 2, Deadeye u 2, Giadrome u 20, Barioth u 20, Barroth u 20, Crystalbeard u 61, Seregios u 32 / 42, Hellblade u 3. "
 b"(c) Gravios u 131 is his beam with the head broken (headModes 5 / 6), not metered unbroken. (d) Gypceros u 3 is the puddle at quest rank <= 4 "
 b"(the page runs rank 5). (e) Crystalbeard u 33 is sp_32's ef 2 (+0x15d0): no read of +0x15d0 in base32's band, his class methods or their "
 b"direct callees; the controls +0x15c8 (0x415744) and +0x15cc (0x416090) were found by the same scan, so the ROM never starts it. "
 b"Soaks: all 18 play every motion with 0 refused | batch | R (measured) | " + SP + b"sm_final.txt, sm_report.txt, soakS_<mon>.log |",
 b"| tooling: " + SP + b"smplan.mjs / shellmeter.mjs / smreport.py / meter_locked.sh (shells agent 2026-10-20) | smplan replays stepShells over every "
 b"clip x pick (x Ground for em032) and lists the plays whose shells start each record (smplan_started.mjs: started only; the plain one also "
 b"counts records a mode merely NAMES). shellmeter plays EVERY menu entry of those clips (copies, and both halves of a split clip: trap 120's "
 b"_loop pick runs the frames after the _start), once per pick, clip loop ON, through the two-slot soak lock, and reports the meter's shell rows. "
 b"smreport merges them against the expected list | control: the effects agent's draw-meter controls (dev/checks/draw-meter.mjs); "
 b"Akantor u 10 / 30 / 31 / 40 measured draws on the trial run | **with the clip loop OFF the frame handler's shells (Kut-Ku c 30, Diablos c 1) "
 b"never start; with the _start piece alone, shells timed past it never start.** Both runs are merged per record |",
 b"| tooling: " + SP + b"shell_audit.py (over reach.mjs), b00quick.mjs / hdquick.mjs, efslot.mjs, shprobe.mjs / mprobe.mjs (shells agent "
 b"2026-10-20) | shell_audit: every record any monster's shells reach against its docs/effects 'shell' entries (the Bloodbath gap class). "
 b"b00quick / hdquick: shells that end on move 1 with no slots and no start, and hitdata refusals (trap 127). efslot: which shell / mode / ef "
 b"slot names a record. shprobe / mprobe: one clip in the page, the shells made (and requests) and the meter's rows | audit control: em007_04 "
 b"(clean after the effects agent's patch); hdquick found Crystalbeard L9 and Tigrex c 32, both fixed, and Hellblade sp_03 9..11 / 18..20, "
 b"which the ROM ends early too | reach-based: a record only a wall / hunter / rank / break makes is named, not counted |",
]
b = b[:j] + NL + NL.join(rows) + b[j:]
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P); print('ok')
