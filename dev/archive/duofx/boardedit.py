p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
old = (b"      - [ ] (idea) his own PSL effects on the combined list (L4 M31..M34, his riding attacks) need a second effect\n"
       b"        runtime for him -- the viewer runs one, hers (render/rom/effect-mounts.js). Effects lane's call.\n")
assert b.count(old) == 1, b.count(old)
new = (b"      - [ ] (review, effects agent 2026-10-17) **HIS OWN EFFECT RUNTIME, BUILT (uncommitted).** A second runtime on his\n"
       b"        mounted model (effect-mounts.js attachPartnerEffects; index.html drivePartnerEffects / partnerFxClip): his clip and\n"
       b"        own frame from partnerLocalAt (pairs, free loop, the frozen hold, the release), key em076_00|4|Motion[N] as solo,\n"
       b"        his word = base 0xca170 calm 0x1ff (his class reads no link bit; READ: neither class tests the other's rage --\n"
       b"        duofx/ragescan.py, rom-map). effectRuntimeInstance() stays hers. Fires: his L4 M31 u 362 at f66 identical to solo\n"
       b"        Seltas (records, frames, walker key / word / frame); his free M32 (under her L4 M41) c 211 / c 221 as solo; held M79\n"
       b"        passes nothing; released M46 followed; disposed on drop / switch / monster change. His answers under her required\n"
       b"        clips have no PSL bits. Check em069_00 132 / 133 (the 1 = the pre-existing ragePuff count); soaks em069_00 85 / 0\n"
       b"        refused, em076_00 48 / 0 refused -- no lift needed. Spec \xc2\xa79.4. Raven to look: a free entry whose draw is M31 / M32.\n")
b = b.replace(old, new)
open(p, 'wb').write(b)
print('ok')
