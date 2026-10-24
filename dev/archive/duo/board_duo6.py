P = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
old = """seeded loop). His S_4 clips that a required clip of hers already leads are not repeated. Her clip-keyed effects /
        states do not fire on the renamed entries (her raw list has them). Spec §9.3."""
assert s.count(old) == 1
new = """seeded loop). His S_4 clips that a required clip of hers already leads are not repeated. Her clip-keyed records
        (effect schedule, PSL word, ACTION_EFFECTS, MOTION_STATES, variants, heat, turn, posture, air, hit-zone mode) fire
        on every entry as on the raw clip, the joined entry per piece (index.html partnerMotionNow; asserted raw vs
        combined). Spec §9.3.
      - [ ] (idea) his own PSL effects on the combined list (L4 M31..M34, his riding attacks) need a second effect
        runtime for him -- the viewer runs one, hers (render/rom/effect-mounts.js). Effects lane's call."""
s = s.replace(old, new)
open(P, 'wb').write(s.encode('utf-8', 'surrogateescape'))
print('ok')
