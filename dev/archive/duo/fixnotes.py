P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
old = "      - [ ] (build, Effects lane) a second effect runtime for the partner (his L4 M31..M34 PSL bits).\n"
assert b.count(old) == 1
b = b.replace(old, "      - (correction) his second effect runtime EXISTS (another agent, 2026-10-17: effect-mounts.js attachPartnerEffects, spec\n        §9.4); partnerFxClip now keys an unlinked piece on its own list (L1 M1, L3 M11 / M29, L0 M1) -- L3 M11's record fires on landing.\n")
old2 = "        his own effect runtime is not built" 
open(P, 'wb').write(b.encode('utf-8', 'surrogateescape'))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
a = "* **Not built**: his own effect runtime (render/rom/effect-mounts.js runs one runtime, the main monster's -- the Effects" + nl + "  lane's code); a seeded pick loop for the wander (the wander itself is not readable without navigation)."
assert s.count(a) == 1, 'spec line'
s = s.replace(a, "* **His effects** (his own runtime, §9.4 -- the earlier \"not built\" here was wrong): index.html partnerFxClip keys an" + nl +
  "  unlinked piece on its own list (L1 M1, L3 M11 / M29, L0 M1); his unit is the unlinked frame. L3 M11's PSL bit 0" + nl +
  "  (cm202_020 key 121, frames 1..2) starts on landing (asserted). Not built: a seeded pick loop for the wander (the" + nl +
  "  wander itself is not readable without navigation).")
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
