# p_docs3d0.py (2026-10-19): the vt+0x3d0 blind spot -- rom-map (rows, Withdrawn, tooling, trap 111) and the engine doc's trap list
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()

# 1. the address rows, after Amatsu's makers row
a = "| `0xf0f3a0` / `0xf0f4bc` / `0xf0f794` / `0xf0fa28` / `0xf103b0` | Amatsu's sp_00 reader"
i = s.index(a); j = s.index('\n', i)
rows = (
"| vt+0x3d0 (uEnemy `0x6c178` = `b 0x768c8`) | **the virtual action change**: a class helper's `ldr r3, [r0, #0x3d0]` (r1 st, r2 n) then bx / blx -- the chains of Amatsu, Kushala, Alatreon .. go through it, not a direct `bl 0x768c8`. vt+0x3e0..0x3f0 (`0x7527c` ..) are the idle choosers (to status 0 / 1), not chains | shared | R | fb/vchain.py; elder spec 8 |\n"
"| `0xf07f24` / `0xf0ac10` / `0xf0afa4` / `0xf0ba8c` / `0xf0ca20` / `0xf0d8a0` / `0xf0e154` / `0xf0e638` / `0xf0eae0` | Amatsu's vt+0x3d0 changes: (2, 8 / 9) 0xf07c08 -> (7, 6 / 7); 0xf0ab30 (k 0..4) -> (7, 0xf) at the end; 0xf0aed8 -> (7, 5); (2, 0xd) 0xf0b380 -> (7, 8); (2, 0xe) -> (7, 0xe); (3, 1) -> (7, 0xf); (7, 5) 0xf0c948 -> (7, 0x18) and (7, 0xf) 0xf0d76c -> (7, 0x19) while e+0x7420; (7, 0x19) 0xf0dda0 -> (7, 0x1a); (7, 0x1a) 0xf0e194 -> (7, 0x1b); (7, 0x1b) 0xf0e678 -> (3, 2) | uEm058_00 | R + E (chainx) | elder spec 8 |\n"
"| e+0x17f4 (uEm058_00) | a halfword of flags: bit 1 set at a part break (`0xf07518`, ldrh / orr #2 / strh through a post-indexed pointer); bit 0 tested by (7, 1) (`0xf0bd70`: set -> no sp_01 4). **No writer of bit 0 anywhere in the text** (fb/fieldscan.py: 6 sites, 4 out of band on other objects -- `0x8d0d3c`'s r4 has an array at +0x30cec, `0x3b065c` / `0x3b3024` sum a global's counters); its start value (the ctor's zeroing) NOT READ | uEm058_00 | R (negative, controlled: the same scan finds 0xf07518, and e+0x15fb's sole writer 0xf091ac) | elder spec 8 |\n")
s = s[:j + 1] + rows + s[j + 1:]

# 2. Withdrawn
a = "| claim | why wrong | correction |\n|---|---|---|\n"
assert s.count(a) >= 1
i = s.index("### Withdrawn"); k = s.index(a, i) + len(a)
w = (
"| elder spec 8 / rom-map Amatsu rows (2026-10-19, shells lane): \"Not reached: (7, 0x08 / 0x0e / 0x18 / 0x19 / 0x1a / 0x1b) -- every sp_06 and sp_42 maker\"; chain058 \"no edges\" | fb/trgen.py stubs every call outside the class band, so a change through **vt+0x3d0** (`0x6c178`, out of band) was stubbed before the hooked `0x768c8` and never logged; and e+0x7420 (this machine owns him; offline set) was 0, parking the (7, 5) / (7, 0xf) chains | trgen logs the class's vt+0x3d0 target and sets e+0x7420 = 1. All six are CHAIN-issued (not variant-gated, not HP-staged): (2, 0xd) -> (7, 8), (2, 0xe) -> (7, 0xe), (7, 5) -> (7, 0x18), (3, 1) -> (7, 0xf) -> (7, 0x19) -> (7, 0x1a) -> (7, 0x1b). Their sp_06 / sp_42 makers are to build |\n"
"| elder spec 5 (Kushala, 2026-10-18): \"fb/chain024.py: no call adds an action\"; \"Not reached: (7, 0x04 / .. / 0x41)\" | the same blind spot | (2, 0xb) -> (7, 4) (sp_33 0xb2 mode 2 f122); (2, 0xa) -> (3, 0x29) -> (3, 0x2a) -> (3, 0x2b) -> (7, 0x41) (the shot twin, 0xb2 mode 6 f20); also (2, 0x1c) -> (3, 0x14), (2, 0xa) -> (3, 0x15), (4, 0x17) -> (3, 0x1b). The rest of the list stands as run (fb/chainx.py) |\n"
"| elder spec 7 (Alatreon, 2026-10-19): \"Not reached (named): (7, 0x48..0x51)\" | the same blind spot | (7, 0x10) -> (7, 0x48), (7, 0x41) -> (7, 0x4d), (7, 0x44) -> (7, 0x4f), (7, 0x43) -> (7, 0x50), (7, 0x45) -> (7, 0x51) are reached (sp_01 0xf0 m6 f28 / m7 f38 on L2 M29); (7, 0x49..0x4c / 0x4e) still not reached |\n")
s = s[:k] + w + s[k:]

# 3. tooling
a = "| `<scratchpad>\\fb\\emcvar.py <file.emc> <variant>` + `chain013.py`"
i = s.index(a); j = s.index('\n', i)
t = (
"| `<scratchpad>\\fb\\trgen.py` vt+0x3d0 / e+0x7420 (2026-10-19) | the class's vt+0x3d0 target (and uEnemy `0x6c178`) logged as a change like `0x768c8`; e+0x7420 = 1 (offline: he is ours; kw own7420=0 to clear). Old copy `fb/trgen.pre3d0.py` (and `fb/old3d0/`) | every chain walk | Amatsu: the six edges above appear; Chameleos / the Fatalis line unchanged | **every chain walk before 2026-10-19 missed vt+0x3d0 changes** (trap 111) |\n"
"| `<scratchpad>\\fb\\chainx.py <mon> [class]` (2026-10-19) | emcvar (variant = the mon suffix) closed over every change, with the old and the fixed trgen side by side; for each action only the fixed walk reaches, its creates (id, mode, frame, phase) in phases 0..5 | `fb/chainall.sh` runs every em0* with a class in emclasses | Amatsu / Kushala / Alatreon: the hand-read vt+0x3d0 sites (fb/vchain.py) | a timer maker (trap 83) shows `(no create)`; FB_PHASEAT for Amatsu |\n"
"| `<scratchpad>\\fb\\vchain.py <lo> <hi>` (2026-10-19) | every action change in a band: direct b / bl to 0x768c8 / 0x75230 / 0x76098 AND `ldr rX, [rY, #0x3d0]`, with r1 / r2 immediates and the containing function | -- | Amatsu: the 9 sites, all confirmed by chainx | r2 computed (k + base) prints `?` or the nearest immediate: read the site |\n"
"| `<scratchpad>\\fb\\fieldscan.py <off> [lo hi]` (2026-10-19) | every instruction that can address object field +off: movw, ldr/str imm12, ldrh/strh/ldrd imm8, add-base + a memory op within 8, add = off | -- | e+0x17f4: finds the bit-1 writer 0xf07518 (post-indexed); e+0x15fb: finds the sole writer 0xf091ac | a register-indexed array or a memcpy over the field is not seen: check the band's movw bases near off |\n")
s = s[:j + 1] + t + s[j + 1:]

# 4. trap 111
a = "110. **An empty census can mean the phase byte is elsewhere (2026-10-19).**"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + ("111. **A chain walk must follow the VIRTUAL change (2026-10-19).** Class helpers change action through vt+0x3d0 (uEnemy `0x6c178` = "
"`b 0x768c8`); a tracer that stubs out-of-band calls never sees it, and e+0x7420 (this machine owns the monster; offline set) gates some "
"chains. Amatsu's \"not reached\" six, Kushala's (7, 4 / 0x41) and Alatreon's (7, 0x48 / 0x4d / 0x4f..0x51) were all chain-issued. Run "
"fb/chainx.py (old vs fixed) before calling an action unissued; a direct-call scan (zg/issuers.py) needs the vt+0x3d0 form too. "
"(G: changes are virtual; T: our tracer stubbed them)\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "  - 110 (G / T) an empty census can be the phase byte living elsewhere (Amatsu's e+0x15e1): read the first helper's phase load.\n"
assert s.count(a) == 1
s = s.replace(a, a + "  - 111 (G / T) action chains go through the virtual vt+0x3d0 (uEnemy 0x6c178 = b 0x768c8), some gated on e+0x7420 (the owner machine;\n    set offline): a tracer that stubs out-of-band calls sees no chain. Follow the vtable slot before calling an action unissued.\n")
open(p, 'w', encoding='utf8').write(s)
print('ok')
