p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "        attacks (its clip unread).\n"
assert s.count(a) == 1
add = (
"      - [x] 2026-10-18 -- KUSHALA DAORA'S SHELLS (spec dev/elder-dragon-shells-spec.md 4): his wind balls (sp_00) and the TORNADOES\n"
"        their landing makes -- the small travelling ones (sp_34, at most two at once: a third ends the oldest), the big ones that grow\n"
"        in and the wandering tornado (sp_38: random heading and turns, leashed to where it landed) -- his ground-riding winds (sp_33)\n"
"        and the bursts of his turns at Wind Aura 2+. Which mode each attack makes follows the Wind Aura control. Check 33/33 against\n"
"        the ROM's own runs + page 13/13; soak 53 motions, 0 refused.\n"
"      - [ ] (question) Kushala's snow maps (Arctic Ridge / Frozen Seaway / Polar Field): enraged there, every shell takes another\n"
"        mode (other effects). His beams offer a 'snow maps' Clip copy; his shells do not yet (named in the spec) -- add the copies?\n"
)
s = s.replace(a, a + add)
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')
