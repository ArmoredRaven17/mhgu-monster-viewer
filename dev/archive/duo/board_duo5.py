# board_duo5.py: the combined-list layout and the tail-grab end under the DUO REVIEW item (binary-safe; never committed)
P = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
assert 'COMBINED LIST 2026-10-17' not in s
i = s.index('DUO REVIEW 2026-10-17')
j = s.index("- [ ] (question, Raven) Seltas' list 4 is nearly all duo clips", i)
item = '''- **COMBINED LIST 2026-10-17** (Raven: "leave Queen's raw animations uncombined in case people want to see them").
        Her raw lists 0 / 3 / 4 play her alone; the Seltas Off / Combined row is gone. One list "Combined (with Seltas)"
        (id duo), 152 entries in order: required 44 ("Queen L4 Motion[6]"), joined 1 (S. Motion[76]-[79], moved off her
        Special list), leaves 5 ("... + Seltas leaves"), his 7 ("Seltas Motion[31]"), free 95 ("... + Seltas free", his
        seeded loop). His S_4 clips that a required clip of hers already leads are not repeated. Her clip-keyed effects /
        states do not fire on the renamed entries (her raw list has them). Spec §9.3.
      - **TAIL-GRAB END + UNLINKS 2026-10-17** (Raven: "does she place the Dead Seltas back on her body?"). READ: he is
        NOT dead -- his 1:0x21 freezes him (speed 0) on a 1200-frame timer (0xfc9a18, counted by the unit delta at
        0xfc9a88, not by motion speed) and he stays linked, so her M79 carries him back onto her back, rigid, ~844 frames
        past her M79's end; then 1:0x22 unlinks him (0xc20f4), turns 180 and drops (M77, landing L3 M11, L3 M29). Kept as
        the ROM's; joined clip not extended (the drop is not in any clip of hers). Unlinks audited (spec §15): request 7
        (L4 M68 shake-off, L3 M12 / M18, deaths L3 M35 / M36) now "+ Seltas leaves": released at her frame 0 in world
        space, M46 then M47, glow off; 1:0x12's trigger NR. Check em069_00: 104 / 105 (duo 61 / 61; the 1 failure is the
        pre-existing ragePuff count, fails at HEAD).
      - [ ] (idea) a "Seltas 1:0x22 drop" entry (his M77 -> L3 M11 -> L3 M29 off her back) -- her clip under the
        844-frame wait is her table's pick, so it needs Raven's call on what she plays.
      '''
s = s[:j] + item + s[j:]
open(P, 'wb').write(s.encode('utf-8', 'surrogateescape'))
print('ok')
