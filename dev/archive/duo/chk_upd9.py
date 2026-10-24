p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:70])
    s = s.replace(a, b)
rep("g.his === 7 && g.free === 95 &&\n          L.clips.length === 152", "g.his === 8 && g.free === 95 &&\n          L.clips.length === 153")
rep("'the combined list: 44 required clips of hers, 1 joined, 5 where he leaves her, 7 of his, 95", "'the combined list: 44 required clips of hers, 1 joined, 5 where he leaves her, 8 of his (his drop off her too), 95")
rep("...Array(7).fill('his')", "...Array(8).fill('his')")
rep("      if (c.leaves) want = 'leaves';", "      if (c.leaves || c.drop) want = 'unlinked';")
rep("""      const ok = q.mounted && (c.leaves ? (q.released && q.local && /^Motion\\[4[67]\\]$/.test(q.local.clip))""",
    """      const ok = q.mounted && ((c.leaves || c.drop) ? (q.released && q.unl && q.unl.kind === (c.drop ? 'drop' : 'leave') && q.local)""")
rep("'every one of the 152 combined-list entries", "'every one of the 153 combined-list entries")
a = s.index("  // ---- HE LEAVES HER (request 7")
b = s.index("  // ---- HIS WINGS ON HER")
NEW = r"""  // ---- THE DISMOUNTS (render/monster.js ROM_PARTNER_BODY `dismounts`; spec §18): unlinked he is a unit of his own, in world
  // space -- his clip's joint 0 drawn on his unit (the reference track held), the unit moved by his code
  {
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const at = async f => { V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3); return P(); };
    // the LEAVE (request 7 -> his 1:0x13): M46 b4; at its end the unit jumps by (0, 1392.5, 245) x size along his facing;
    // M47 b0; then vt+0x3e0's (0, 3): L1 M1, the hover
    await pickOn(DUO, 'Queen L4 Motion[68]_loop + Seltas leaves');
    const q0 = await at(0), q20 = await at(20), q30 = await at(30), q31 = await at(31), q60 = await at(60);
    check(q0.mounted && q0.released && q0.unl && q0.unl.kind === 'leave' && dist(q0.frameAt, q0.bodyJointAt) < 0.01 && q0.local.clip === 'Motion[46]',
          'leave: at her frame 0 his unit is where joint 200 is, unlinked, playing M46', { f: q0.frameAt, j: q0.bodyJointAt, local: q0.local });
    check(dist(q20.frameAt, q0.frameAt) < 1e-3 && dist(q20.bodyJointAt, q0.bodyJointAt) > 0.5 && dist(q20.root, q0.root) > 1,
          'leave: his unit stays put while her joint 200 moves on -- his root rises on M46\'s own path', { f: [q0.frameAt, q20.frameAt], j: [q0.bodyJointAt, q20.bodyJointAt], root: [q0.root, q20.root] });
    const S = q0.frameScale, y = q0.unl.yaw;
    const want = [q0.frameAt[0] + Math.sin(y) * 2.45 * S, q0.frameAt[1] + 13.925 * S, q0.frameAt[2] + Math.cos(y) * 2.45 * S];
    check(dist(q31.frameAt, want) < 0.01 && q31.local.clip === 'Motion[47]',
          'leave: at M46\'s end (frame 31) the unit moves up 1392.5 and forward 245 x his size (0xfc8d44), M47 plays', { got: q31.frameAt, want });
    check(dist(q31.root, q30.root) < 0.2, 'leave: his root runs on across the M46 -> M47 seam (the code\'s jump and the clip agree)', { r30: q30.root, r31: q31.root });
    check(q60.local && q60.local.clip === 'Motion[1]_loop' && q60.local.list === '1' && dist(q60.frameAt, q31.frameAt) < 1e-3,
          'leave: after M47, his hover L1 M1 (vt+0x3e0 -> (0, 3)) where the jump left him', q60.local);
    check(q0.groupsOn && !q0.groupsOn.includes(8), 'leave: his glow (group 8) off from the unlink (0xfc6468)', q0.groupsOn);
    // the DROP (his 1:0x22): turned 180 degrees at frame 0, falling -10 / frame and -1 / frame^2 to her ground, L3 M11, L3 M29,
    // then vt+0x3dc's (0, 0): L0 M1
    await pickOn(DUO, 'Seltas Motion[77] drop off her (1:0x22)');
    const d0 = await at(0), n = d0.unl.tLand;
    const d5 = await at(5), dL = await at(n), dM = await at(n + 190), dI = await at(n + 315 + 5);
    const fall5 = d0.frameAt[1] - (10 * 5 + 0.5 * 25) * 0.01;
    check(d0.unl.kind === 'drop' && Math.abs(Math.abs(d0.frameYaw - d0.unl.yaw) - Math.PI) < 1e-3 && d0.local.clip === 'Motion[77]_start',
          'drop: at frame 0 he is turned 180 degrees from his facing on her (yaw + 0x8000), playing M77', { yaw: d0.frameYaw, base: d0.unl.yaw });
    check(Math.abs(d5.frameAt[1] - fall5) < 1e-3, 'drop: 5 frames in, the unit has fallen 10 x 5 + 25 / 2 game units (0x7d65c)', { y: d5.frameAt[1], want: fall5 });
    check(n > 0 && Math.abs(dL.frameAt[1] - d0.unl.floor) < 0.1 && dL.local.clip === 'Motion[11]_start' && dL.local.list === '3',
          'drop: on the ground at frame ' + n + ' (her ground, the grid floor), L3 M11 from there', { y: dL.frameAt[1], floor: d0.unl.floor, local: dL.local });
    check(dM.local.clip === 'Motion[29]' && dI.local.clip === 'Motion[1]_loop' && dI.local.list === '0',
          'drop: L3 M11 (start and one loop pass) -> L3 M29 -> L0 M1 (vt+0x3dc, unaware: (0, 0))', { m: dM.local, i: dI.local });
    check(d0.root[1] - dL.root[1] > 1.5, 'drop: his root comes down with him', { r0: d0.root, rL: dL.root });
    V.pose.action.paused = false;
    // a linked entry still follows her joint, as a control for the same readback
    await play('4', 'Motion[36]');
    const c0 = await at(0), c1 = await at(40);
    check(!c0.released && dist(c0.frameAt, c0.bodyJointAt) < 0.01 && dist(c1.frameAt, c1.bodyJointAt) < 0.01 && dist(c1.frameAt, c0.frameAt) > 1e-3,
          'control: on a linked entry (L4 M36 + Seltas free) his root follows joint 200 frame by frame', { f: [c0.frameAt, c1.frameAt], j: [c0.bodyJointAt, c1.bodyJointAt] });
    check(c1.groupsOn && c1.groupsOn.includes(8), 'control: linked, the glow group 8 is on', c1.groupsOn);
    V.pose.action.paused = false;
  }

"""
s = s[:a] + NEW + s[b:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
