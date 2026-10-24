p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"        so CLIP_ACTIONS plays (7, 0xe9 / 0xea). Below G it would fire -- only if a rank control is ever added.\n"
assert b.count(anchor) == 1, b.count(anchor)
assert b'FANGED BEASTS SHELLS 2026-10-17' not in b
note = """      - **FANGED BEASTS SHELLS 2026-10-17** (shells agent, in em-id order behind the effects walk). READ + BUILT, uncommitted; each checked
        bit for bit against the ROM run (dev/shells-<name>-check.mjs, controls FAIL), soaked, records exported. Spec
        dev/fanged-beasts-shells-spec.md; rom-map "Fanged Beasts -- the shells".
        * Congalala: dung throws (L2 M12), gas clouds (L0 M20 / L2 M5 / L5 M14 / the pit), splat (L5 M12), breaths (L2 M7, L2 M16 by the gas
          he carries: index.html shellExtra `gas021`). Check 26 / 26.
        * Blangonga: the snow lob (L2 M12, ten picks; base13 on his point) bursting into three pieces on the floor; L2 M8's shell01 (frame 98
          is in Motion[8]_loop). (7, 0x18) L2 M14's lob is mode 14, past the file's 14 modes: refused by name. Check 24 / 24, page 14 / 14,
          soak 0 refused.
        * Rajang / Furious: the ball (L2 M8 after the beams in the pick rotation; L2 M12 the leap's), and THE ROCK -- a new base, base22:
          dug on L2 M29 (four picks = the four rock types), held on joint 12, thrown on L2 M28 at 56, dropped on any other motion, one bounce.
          Check 31 / 31, page 21 / 21, soaks 0 refused. Note: L2 M8's PSL bits 15-17 now light on 2 plays of 5 (the ball's numbers are
          not in the word's table).
        * Redhelm: the thrown lump (L9 M9), the slam's dust (L9 M1 f116; 4 above quest level 8, else 1). Lagombi: the snowballs (L2 M28
          three picks, L2 M37). Arzuros ships no shell file; Bulldrome has no shell class. Check 20 / 20, page 14 / 14, soaks 0 refused.
      - [ ] (next) Duramboros / Rustrum (em061): census done (scratchpad fb/cen2_em061_v0 / _v4.txt, ids are fields +0xcac8..+0xcad8);
        needs sp_00 (26 modes), sp_19 = NEW base19 (over base03), sp_24 = NEW base24 (Rustrum's L9), sp_13 (own init). Then em065, em083.
      - [ ] (note) Congalala's L2 M16 gas breath needs a play to carry the gas: the soak (no playNow) refuses it by name, the viewer does not.
"""
b = b.replace(anchor, anchor + note.encode('utf8'))
open(p, 'wb').write(b)
print('ok')
