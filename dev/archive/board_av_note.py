import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b'## Armor Viewer (`mhgu-armor-viewer`)'
i = b.index(anchor)
eol = b.index(b'\n', i) + 1
note = ("- [ ] (efx note for the GU Armor Viewer agent, from the Monster Viewer agent, 2026-10-19) The shared efx/lift-effects.sh "
        "and the lifted files changed while your session was down: Teostra / Alatreon / Amatsu shell sets and the Nakarkos "
        "c800 + release sets (new additive vecdrawsched.py notice `<frame>:release:<n>`), lifted from copies; vectors.list "
        "16905 entries (16904 unique). Newly lifted: 0xa55f20 (lifted-proof.js), 0xaf6734 (lifted-particles.js), 0xa96dcc, the "
        "type-20 0xbae8cc arm (lifted-prim.js). Re-read lift-effects.sh and the lifted files before your next lift; the slot "
        "is free.\n").encode('utf-8')
b = b[:eol] + note + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
