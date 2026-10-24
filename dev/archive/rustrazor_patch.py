import os
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
    s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
    for old, new in pairs:
        assert s.count(old) == 1, (rel, old[:80], s.count(old))
        s = s.replace(old, new)
    if crlf: s = s.replace('\n', '\r\n')
    open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
    print('patched', rel, 'crlf' if crlf else 'lf')

# ---- the rows: where Rustrazor's actions leave the beam's motion (Raven, 2026-10-01: "Review Rustrazor's water beams") ----
patch(r'docs\render\beam-spawns.js', [
("""//   arm          the attached body whose OWN action fires it (Nakarkos's 'left' / 'right' arm): the ray is built from that
//                body's joints (input.attachedJoints, index.html shellExtra), not the monster's
""",
"""//   arm          the attached body whose OWN action fires it (Nakarkos's 'left' / 'right' arm): the ray is built from that
//                body's joints (input.attachedJoints, index.html shellExtra), not the monster's
//   leave        where the ACTION leaves the beam's motion, when it sets its next motion itself: the beam's +0x170 (base02's
//                0x3fd4c4: the owner's motion is no longer the spawn's) ends it on that update, while the viewer's clip
//                plays on. { frame: F } -- a mode-1 test, 0xb0968(e, 1, 0, F): the frame has reached F; { end: true } --
//                0xb09c8, the motion's ended flag, which the layer update raises on the update whose frame reaches the
//                motion's length -- a loop's wrap included (0x94f374). Without it a beam ends by its life or a clip change
"""),
("""  // SHOGUN / RUSTRAZOR (uEm020_00; dev/beams/em020_00.md, READ). Shogun (7, 0x32): L2 M27 f50, 0x9e mode 4, only while
  // his shell is type 3 (e+0xcadc), the one part pass 0xdc5228 shows as set 3 -- the yado01 skull, part 109. Rustrazor
  // (0xa0; list 9 is his alone): (7, 0xc9) / (7, 0xca) at the first frame of L9 M31 / M33, mode 0; (7, 0xd4) as L2 M73's
  // f34 sets L2 M74, mode 2 (the beam lives on M74); (7, 0xdf) / (7, 0xe2) L9 M20 f50 (tune float 0x28), mode 1 / 3 --
  // each only when not tired. (7, 0xd5) is not issued.
""",
"""  // SHOGUN / RUSTRAZOR (uEm020_00; dev/beams/em020_00.md, READ). Shogun (7, 0x32): L2 M27 f50, 0x9e mode 4, only while
  // his shell is type 3 (e+0xcadc), the one part pass 0xdc5228 shows as set 3 -- the yado01 skull, part 109. Rustrazor
  // (0xa0; list 9 is his alone): (7, 0xc9) / (7, 0xca) at the first frame of L9 M31 / M33, mode 0; (7, 0xd4) as L2 M73's
  // f34 sets L2 M74, mode 2 (the beam lives on M74); (7, 0xdf) / (7, 0xe2) L9 M20 f50 (tune float 0x28), mode 1 / 3 --
  // each only when not tired. (7, 0xd5) is not issued.
  //   WHERE THEY END (Raven, 2026-10-01: "Review Rustrazor's water beams"; dev/beams/em020_00.md section 5). Modes 0 / 2
  // live 2000 frames, so it is the ACTION that ends them, by setting L2 M75 (0x24b) -- the beam's +0x170 then sees another
  // motion (his class keeps the base's 0x3fd4c4): (7, 0xc9) / (7, 0xca) at L9 M31 / M33's frame 70 (0xdca660: 0xb0968(e,
  // 1, 0, tune float 0x1b = 70.0)), after turning the unit -150 / +150 degrees over frames 2..70 (0x76dd0, tune 0x1a /
  // 0x1c: render/motion-states.js CLIP_TURN, so the beam sweeps); (7, 0xd4) when L2 M74 first ENDS (0xdcb480: 0xb09c8) --
  // the start and one pass of its loop, 106 frames. Modes 1 / 3 (L9 M20) live 108 frames and end by themselves, 103
  // before the action's own end at the motion's (0xdcc00c); that action's turn, frames 50..56 toward the hunter's
  // bearing + 180 degrees (0x7840c, tune 0x25..0x27 / 0x29), follows a target the viewer does not have.
"""),
("""    { list: '9', clip: 'Motion[31]', atStart: true, type: 'em020_04:0', action: [7, 0xc9], when: { tired: false } },
    { list: '9', clip: 'Motion[33]', atStart: true, type: 'em020_04:0', action: [7, 0xca], when: { tired: false } },
    { list: '2', clip: 'Motion[74]', atStart: true, type: 'em020_04:2', action: [7, 0xd4], when: { tired: false } },
""",
"""    { list: '9', clip: 'Motion[31]', atStart: true, type: 'em020_04:0', action: [7, 0xc9], when: { tired: false }, leave: { frame: 70 } },
    { list: '9', clip: 'Motion[33]', atStart: true, type: 'em020_04:0', action: [7, 0xca], when: { tired: false }, leave: { frame: 70 } },
    { list: '2', clip: 'Motion[74]', atStart: true, type: 'em020_04:2', action: [7, 0xd4], when: { tired: false }, leave: { end: true } },
"""),
])

# ---- the runtime: the beam carries its row's `leave`; the action's update marks it; +0x170 ends it ----
patch(r'docs\render\shells.js', [
("""              action: row.action, spawnFrame: row.atStart ? 0 : row.frame, state: 1, activated: false, motionId: ctx.ownerMotion,
""",
"""              action: row.action, spawnFrame: row.atStart ? 0 : row.frame, state: 1, activated: false, motionId: ctx.ownerMotion,
              leave: row.leave || null, left: false,
"""),
("""  if (ctx.ownerMotion != null && ctx.ownerMotion !== S.motionId){ end02g(S, out); return; } // +0x170
""",
"""  // +0x170: another motion -- the clip's, or the one the action itself set where the viewer's clip plays on (S.left)
  if (S.left || (ctx.ownerMotion != null && ctx.ownerMotion !== S.motionId)){ end02g(S, out); return; }
"""),
("""  if (ctx.motion !== state.motion || (back && input.loopStart == null)){
""",
"""  // a replay of a clip the game plays once: the play before reached the motion's end, past any `leave` of its beams
  if (ctx.motion === state.motion && back && input.loopStart == null) for (const S of state.shells) if (S.leave) S.left = true;
  if (ctx.motion !== state.motion || (back && input.loopStart == null)){
"""),
("""        if (row.atStart ? first : pass001(state, f(row.frame))) spawnBeamReal(state, D, row, ctx, input, out);
    }
  }
""",
"""        if (row.atStart ? first : pass001(state, f(row.frame))) spawnBeamReal(state, D, row, ctx, input, out);
      // ...and the action leaving the motion (a row's `leave`), on the frame pair its update sees: a mode-1 test passes
      // once the frame has reached F (0x72b04; after a wrap, 0x72904); the ended flag rises on the update that reaches the
      // motion's length, which a looping motion shows as the wrap (0x94f374)
      const [p0, p1] = state.hist;
      for (const S of state.shells)
        if (S.leave && S.state === 1 && !S.left && (p1 < p0 || (S.leave.frame != null && !(p1 < S.leave.frame)))) S.left = true;
    }
  }
"""),
])

# ---- the turn: Rustrazor's beam actions turn the unit while the beam fires; op 0x0a's spread is now READ ----
patch(r'docs\render\motion-states.js', [
("""// WHAT IS NOT READ: how the angle is spread across the window. The op gives an angle and a first and last
// frame and nothing else, so the turn here runs LINEARLY between them; whether the engine eases it is in the
// op's handler, which has not been found. Everything else -- the angle, its sign, the frames, the clip and
// the owner -- is off the ROM.
""",
"""// HOW THE ANGLE IS SPREAD, READ (Viewer agent, 2026-10-01): LINEARLY by the motion's frame. Op 0x0a is arm 10
// of the script switch 0x9ef3c; its handler 0x9f58c copies the block's first frame, last frame and angle to
// P+0x56c / +0x570 / +0x574 (a first frame below 0 adds the angle to the yaw word P+0x54 at once), and every
// frame after it (0x9ffac / 0xa07d4, while +0x570 > 0) calls 0x76dd0(e, angle, first, last): P+0x54 +=
// s32(step x frac x angle / (last - first)), frac the share of this step's frames inside [first, last]
// (0x72714 mode 9, 0x729fc) and step the motion's +0x13b8 -- the angle in equal parts per frame, each update's
// part truncated toward zero, so a turn can end up to a unit per update short of its angle (here at most 68
// units, 0.37 degree). Everything else -- the angle, its sign, the frames, the clip and the owner -- is off the
// ROM too.
//   A CLASS'S OWN TURN THE SAME WAY: 0x76dd0 is also what monster classes call themselves (654 call sites), and
// an entry below may be one of those when the class passes it a fixed angle and window and is the only code
// that plays the clip -- named on its entry.
"""),
("""  // 0x17b0868
  em021_00: { '3|Motion[23]': { deg: -180, from: 55, to: 95 } },
""",
"""  // RUSTRAZOR'S BEAM SWEEP (Raven, 2026-10-01: "Review Rustrazor's water beams"): not a script turn but his class's
  // own -- (7, 0xc9) / (7, 0xca)'s phase 5 (0xdca604) calls 0x76dd0(e, -/+ s32(0.5 + tune float 0x1c x 182.044),
  // tune 0x1a, tune 0x1b) = (-/+27307, 2.0, 70.0) on every update of L9 M31 / M33 until frame 70, where it sets
  // L2 M75 (the beam's end); the sign is negative for (7, 0xc9), which plays M31. Nothing else plays L9 M31 / M33:
  // no other movw of 0x91f / 0x921 in .text (neither is an ARM immediate) and no aligned word of either in .data /
  // .rodata, where scripts keep (list << 8) | motion (control: 0x914, L9 M20, found at 0x1794638 / 0x17eb234). It
  // turns whether or not the beam fires (tired).
  em020_04: { '9|Motion[31]': { deg: -27307 * 360 / 65536, from: 2, to: 70 }, '9|Motion[33]': { deg: 27307 * 360 / 65536, from: 2, to: 70 } },
  // 0x17b0868
  em021_00: { '3|Motion[23]': { deg: -180, from: 55, to: 95 } },
"""),
])
