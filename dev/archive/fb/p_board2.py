p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = """      - [ ] (question) Kushala's snow maps (Arctic Ridge / Frozen Seaway / Polar Field): enraged there, every shell takes another
        mode (other effects). His beams offer a 'snow maps' Clip copy; his shells do not yet (named in the spec) -- add the copies?
"""
b = """      - [x] 2026-10-18 -- SNOW VARIANTS LIST (Raven: "Add Snow variations of the same clips, add them under a Snow Variants list"):
        Kushala (his wind balls, ground winds, tornadoes and the mode-1 beam, enraged) and Tetsucabra / Drilltusk (the rocks and the
        slab) play their snow-map modes on the "Snow Variants" list; the raw lists stay as they were. Kushala's old 'snow maps' Clip
        copies moved into it. Checks: Kushala 47/47 + page 23/23, Tetsucabra / Drilltusk 35/35 + pages 25/25.
      - [ ] (note, effects lane) Kushala's wind barrier on the snow maps holds u 210 calm / u 220 enraged (ids 1004 / 1005): the
        class timers now get snowMap on Snow Variants plays; CLASS_TIMERS.em024_00 still holds 230 / 240 only.
      - [x] 2026-10-18 -- Lao-Shan Lung's rubble falls around him: each event entry's landing centre is moved onto him, the ROM's
        layout and timing kept (a stand-in: the section variable that places him along the fortress is unread). Lao check 36/36.
"""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')
