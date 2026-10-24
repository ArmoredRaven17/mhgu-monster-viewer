p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "        viewer's (no effect, no shell).\n"
assert s.count(a) == 1
add = (
"      - [x] 2026-10-18 -- KIRIN'S SHELLS (spec dev/elder-dragon-shells-spec.md 1): the lightning -- sp_11 the strike timer (its times by\n"
"        his motion speed, each strike's point by mode: re-anchored, at the target, or snapped to the floor) and its bolts sp_01; 33 rows.\n"
"        Check 15 / 15 (dev/shells-kirin-check.mjs), page 8 / 8; u 30 / 31 / 90 exported. The page's 'Failed to fetch' was the headless\n"
"        server under the census load.\n"
"      - [x] 2026-10-18 -- THE CLIP MENU'S COPY DECIDES THE SHELL PICK: index.html rockInput offers only the picks a CLIP_VARIANTS copy's own\n"
"        entries name (psl-mask.js clipCopyActions). Kirin's L4 M7 roar copies A / B throw no lightning, copy C does (page check).\n"
"        Also covers Soulseer L0 M4 / M15, Lavasioth L2 M10, Kirin L2 M4.\n"
"      - [x] 2026-10-18 -- LAO-SHAN LUNG'S SHELLS (spec 2): no action makes one -- a per-frame event list the EMC picks at each action's\n"
"        start drops the fortress's rubble (sp_13: from a fixed point to a fixed point, each after its own delay, hidden while it waits)\n"
"        and hit volumes (sp_01). 28 lists (one pick each, '7:0x00 #25' ...) on L2 M1 / M3 / M4 / M5 / M9, L0 M6 / M36. The points are the\n"
"        fortress's own -- 100 m and more from where the viewer stands him. Check 34 / 34 (dev/shells-lao-check.mjs), page 7 / 7;\n"
"        u 10 / 20 exported. Named: lists 1 / 3 / 22 / 39..42 (nothing picks them).\n"
"      - [ ] (question) Lao-Shan Lung's rubble falls at the fortress's absolute points (e.g. x -7800, z -12750), far off screen while he\n"
"        stands at the origin. Show it there (as the ROM), or move the stage / camera to his fortress position per motion?\n"
)
s = s.replace(a, a + add)
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')
