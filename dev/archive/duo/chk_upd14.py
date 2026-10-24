p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
anchor = "  // ---- THE STATIC AUDIT (2026-10-18;"
assert s.count(anchor) == 1
NEW = r"""  // ---- HER M79 KILLS HIM (2026-10-22, spec §21; Raven: "Seltas dies, but then is dropped back onto the queen's body"): her
  // 1:0x24 arms record 0x23 (kind 0xa, sphere r200 on joint 200, past the partner exclusion); his frozen 1:0x21 holds the
  // reaction lock until her M79 frame 80; then HP 0 and his death (11, 8): unlinked, L4 M77 falling to her ground, L4 M78 lying
  {
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const at = async f => { V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3); return P(); };
    for (const [entry, k] of [['Queen L4 Motion[79]', 80], ['S. Motion[76]-[79]', 492]]){
      await pickOn(DUO, entry);
      const a = await at(k - 1), b = await at(k), c = await at(k + 20);
      const n = b.unl && b.unl.tLand, L = await at(n + 5);
      check(!a.dead && dist(a.frameAt, a.bodyJointAt) < 0.01 && a.local.clip === 'Motion[79]_loop' && a.local.frame === 6 && a.groupsOn.includes(8),
            entry + ': to her M79 frame 79 he is linked and frozen (M79 @ 6, glow on)', { a });
      check(b.dead && b.local.clip === 'Motion[77]_start' && !b.groupsOn.includes(8) && dist(b.frameAt, b.bodyJointAt) < 0.05,
            entry + ': at her M79 frame 80 he dies -- his death (11, 8) starts with L4 M77, unlinked where joint 200 is, glow off', { b });
      check(c.frameAt[1] < b.frameAt[1] - 0.5 && dist(c.frameAt, c.bodyJointAt) > 0.5,
            entry + ': he falls in world space and her joint 200 no longer carries him (not put back on her body)', { b: b.frameAt, c: c.frameAt, j: c.bodyJointAt });
      check(L.local.clip === 'Motion[78]_start' && Math.abs(L.frameAt[1] - L.unl.floor) < 0.05,
            entry + ': on her ground he lies dead (L4 M78)', { L: L.local, y: L.frameAt[1], floor: L.unl.floor });
    }
    const e = await at(720), q = e.routed;
    check(q && q.list === '0' && q.clip === 'Motion[16]' && e.local.clip === 'Motion[78]_loop',
          'S. Motion[76]-[79]: after her M79 she eats him (her g1 s46 -> 1:0x1c, L0 M16) while he lies dead', { her: q, his: e.local });
    V.pose.action.paused = false;
  }

"""
s = s.replace(anchor, NEW + anchor)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
