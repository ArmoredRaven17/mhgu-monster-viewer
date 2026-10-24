def patch(p, pairs):
    s = open(p, encoding='utf8', newline='').read()
    for a, b in pairs:
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8', newline='').write(s)

R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
patch(R + r'\render\motion-states.js', [(
"""  em050_00: { period: 30, joint: 2, records: [['em050_00u', 1120], ['em050_00u', 1121]], pick: () => 1 },""",
"""  //   NOW REACHED (2026-10-18; dev/em050_00-effects-spec.md 5): his puff is his frame handler vt+0x208 0xecce08's own request
  // (0xecce84, READ): enraged, the countdown e+0xcb04 by 0x7206c, reset to 30.0, then id 1001 = u 1120, or id 1002 = u 1121 while
  // P+0x1bb == 2 -- the BLUE form, the Form rung's second (render/monster.js ROM_FORM_CLIPS). So the pick reads the user's rung
  // (`user.rung`, live.js puffGates' third argument). And the handler has NO SLEEP GATE (no rest / 0x81bb0 test before the
  // countdown, only isEnraged 0x81670): `ownGates` keeps the shared puff's sleep pause off him.
  em050_00: { period: 30, joint: 2, records: [['em050_00u', 1120], ['em050_00u', 1121]], pick: (q, user) => (user && user.rung === 1) ? 0 : 1,
              ownGates: true },""")])
patch(R + r'\render\rom\effect\live.js', [(
"""      this.schedule.setRagePuff({ period: puff.period, records: puff.records,
                                  pick: () => puff.pick(node ? [node.quaternion.x, node.quaternion.y, node.quaternion.z, node.quaternion.w] : null) });""",
"""      this.schedule.setRagePuff({ period: puff.period, records: puff.records,
                                  pick: () => puff.pick(node ? [node.quaternion.x, node.quaternion.y, node.quaternion.z, node.quaternion.w] : null,
                                                        this.puffUser || {}) });
      this.puffOwnGates = !!puff.ownGates;"""), (
"""  puffGates(paused, tired){
    if (this.failed || !this.schedule) return;
    try { this.schedule.puffGates(paused, tired); }""",
"""  // `user`: the user's state a class's own puff reads (Alatreon's Form rung, RAGE_PUFF em050_00); a puff with `ownGates` is its
  // class's own request, so the shared puff's sleep pause does not apply to it
  puffGates(paused, tired, user){
    if (this.failed || !this.schedule) return;
    this.puffUser = user || null;
    try { this.schedule.puffGates(this.puffOwnGates ? false : paused, tired); }""")])
patch(R + r'\index.html', [(
"""    rt.puffGates(motionStates.puffOff(), motionStates.tired());""",
"""    rt.puffGates(motionStates.puffOff(), motionStates.tired(), { rung: state.level | 0 });""")])
print('ok')
