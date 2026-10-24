p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
s = b.decode('utf8')
NL = '\r\n' if '\r\n' in s else '\n'
a = "Valstrax's own puffs / class machines, Amatsu's clipless tail sever, Fatalis's stun (no case), Alatreon's class keys."
assert s.count(a) == 1, s.count(a)
note = """
      OPEN READS CLOSED 2026-10-18 (Fanged agent; specs em046_00 6-7, em086_00 5, em058_00 5-7, em050_00 5, em024_00 6, em027_00
      6, em013 5; rom-map Elder Dragon section + three Withdrawn rows):
      - Teostra's nova: L4 M9 / M10 by selector, done.
      - Valstrax: the aura (u 200, u 1120, u 1130 once the head is broken) and the glow u 1121 (by the action's state, with its
        fade-out timing) are CLASS_TIMERS. THE COMET: L1 M5 B fires u 110 at f30, L1 M5 C holds u 130 for the fall. u 100 and
        u 120 run while he is gone (motion 0xffff): named.
      - Amatsu: the aura u 0 / u 1 (hidden on attacks, u 3 at the hide), the hold u 100, the puff u 1120 every 30, and u 2 +
        u 102 at death. NEW CONTROL "HP State": e+0x15fb, set once by (10, 0x8e) = reaction code 0x1a, the HP fraction. It
        shows head sets 15-17 (groups 25 / 27 / 28) and swaps in u 1121 / u 101. It is a class state, not a Parts row.
      - Alatreon: u 1120 / u 1121 every 30 by the Form rung. Ids 1003..1011 have NO requester (scanned, with a control).
      - The sleep holds: op 1 sets no motion. Kushala L3 M55 (L3 M10 withdrawn), Chameleos L3 M10 (now READ), Teostra L3 M17 B
        (L3 M5 C withdrawn).
      - Fatalis has no stun hold (no (10, 0x20) case): the ROM. c 1103 is a per-frame flag request, not a clip's.
      - Amatsu's tail is cut at (10, 0x72)'s frame 0 over the running clip. No clip frame exists: flying it on the Tail toggle
        would be Raven's call.
      - LAGIACRUS u 61: the 0xae997c bounds arm is transcribed (e2e-controlled). The view's sphere test 0x881d94 and the slot
        finder 0x4187c are now complete natives (unicorn controls, 3000 / 0 each), and cpu.js makes a native win over a lift.
        So Mizutsune's / Soulseer's looping pile-ups degrade as the game does: a full pool leaves the new effect unregistered.
      - Kirin's u 60_stop / Amatsu's u 1120_stop hang: the harness destroys a state-3 unit two update passes before the game's
        walker (0xc044c4: 3 -> 4 -> delete) would, and the stop walks the corpse. The cause is found; the harness fix
        (proofunit.py) waits for a go-ahead."""
s = s.replace(a, a + note.replace('\n', NL), 1)
open(p, 'wb').write(s.encode('utf8'))
print('ok')
