# patch_ring.py: the Gore line's slot ring (effects lane, 2026-10-20) -- schedule.js (the ring), live.js (the proxy), proof.js
# (type8 with a position-only requester), shells.js (the two owner calls 0xfc083c from sp_00 / sp_03)
import io, os
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render'
def patch(P, reps):
    t = io.open(P, encoding='utf8', newline='').read()
    nl = '\r\n' if t.count('\r\n') > t.count('\n') / 2 else '\n'
    for a, b in reps:
        a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
        assert t.count(a2) == 1, (P, a[:70])
        t = t.replace(a2, b2)
    io.open(P, 'w', encoding='utf8', newline='').write(t)

patch(os.path.join(R, 'rom', 'effect', 'schedule.js'), [
("""    this.stepDrool();                 // the same handler's other branch (0xa41b8): rage and tiredness exclude each other
""", """    this.stepDrool();                 // the same handler's other branch (0xa41b8): rage and tiredness exclude each other
    this.stepRing();                  // the Gore line's slot timers (vt+0x1dc 0xfae96c..0xfae9cc), in the enemy update
"""),
("""  stepDrool(){""", """  // THE GORE LINE'S SLOT RING (effects lane, 2026-10-20; READ: 0xfc05ec, 0xfaf318, the ctor 0xfad6cc..0xfad7b4, vt+0x1dc 0xfae96c..
  // 0xfae9cc; dev/rom-map.md "Class requests driven"). Two slots in the control block (C + 0x40k: byte +0 = 0xff free, else the
  // counter it was filled at; +0x10.. the point; +0x2c / +0x30 s0 / s1; +0x38 the u 30 handle), the counter C+0x80 (0..3) and the
  // live count C+0x81 (bytes). ringFill is one call of a fill site: the caller steps the counter (+1, 4 -> 0) and k = counter & 1;
  // 0xfc05ec: a busy slot k is burst first (0xfaf318: stop its handle 0x329c40(h, 0), id 1002 = u 31 at its point with +0x1c |= 3,
  // +8 = 1; byte 0xff; count - 1); flag 0 -> the ground query 0x183664 from the point + 500 down: a hit within 500 below takes its
  // height, none -> no fill (the counter stays stepped); then the slot is filled, and while count <= 1 id 1001 = u 30 is requested at
  // the point (+0x1c |= 3, +8 = 2) and count + 1. Every frame each busy slot's +0x30 counts down 1.0 (0x7206c); at <= 0 it is burst.
  // The ground is the stand-in floor plane (host.stageFloorY, the same answer as 0x18154c's).
  ringFill(pel, { position, s0 = 400, s1 = 240, flag = 1 }){
    const R = this.ring || (this.ring = { pel, counter: 0, count: 0, slots: [{ byte: 0xff }, { byte: 0xff }] });
    R.pel = pel;
    R.counter = (R.counter + 1) & 0xff; if (R.counter >= 4) R.counter = 0;
    const k = R.counter & 1;
    const out = { k, burst: null, filled: false, requested: false };
    const p = position.map(Math.fround);
    if (flag === 0){
      const floor = Math.fround(this.host.stageFloorY || 0), from = Math.fround(p[1] + 500);
      if (!(floor <= from)) return out;                                   // no hit below the ray's start
      if (!(Math.fround(p[1] - floor) <= 500)) return out;                // farther than 500 below: no fill
      p[1] = floor;
    }
    if (R.slots[k].byte !== 0xff) out.burst = this.ringBurst(k);
    R.slots[k] = { byte: R.counter, point: p, s0: Math.fround(s0), life: Math.fround(s1), handle: null };
    out.filled = true;
    if (R.count <= 1){
      const q = this.placeEvent(pel, 30, [{ position: p, flags1c: 3, positionOnly: true, type8: 2 }]);
      R.slots[k].handle = q[0] || null;
      R.count = (R.count + 1) & 0xff;
      out.requested = true;
    }
    return out;
  }
  ringBurst(k){
    const R = this.ring, s = R.slots[k];
    if (s.handle && !s.handle.stopped){ this.host.stopRequest(s.handle, 0); s.handle.stoppedAtStep = this.frame || 0; }
    this.placeEvent(R.pel, 31, [{ position: s.point, flags1c: 3, positionOnly: true, type8: 1 }]);
    R.slots[k] = { byte: 0xff };
    R.count = (R.count - 1) & 0xff;
    return s.point;
  }
  stepRing(){
    const R = this.ring;
    if (!R) return;
    for (const k of [0, 1]){
      const s = R.slots[k];
      if (s.byte === 0xff) continue;
      s.life = Math.fround(s.life - 1);
      if (s.life <= 0) this.ringBurst(k);
    }
  }
  stepDrool(){"""),
])

# the shells' owner calls: consumed right after stepShells returns
patch(os.path.join(R, 'rom', 'effect', 'schedule.js'), [
("""    const T = this.shellTally || (this.shellTally = { spawned: 0, beams: [], refused: [] });""",
 """    // a shell's call into its owner's slot ring (the Gore line's sp_00 landing 0xfc2034 / sp_03 end 0xfc3164 -> 0xfc083c: flag 0)
    for (const f of out.ownerFills || []) this.ringFill(f.pel, f);
    const T = this.shellTally || (this.shellTally = { spawned: 0, beams: [], refused: [] });"""),
])

patch(os.path.join(R, 'rom', 'effect', 'live.js'), [
("""  placeEvent(pel, key, requesters){
    if (this.failed || !this.schedule) return [];
    try { return this.schedule.placeEvent(pel, key, requesters); }
    catch (e){ this.fail(e); return []; }
  }""", """  placeEvent(pel, key, requesters){
    if (this.failed || !this.schedule) return [];
    try { return this.schedule.placeEvent(pel, key, requesters); }
    catch (e){ this.fail(e); return []; }
  }
  // one fill of the Gore line's slot ring (schedule.js ringFill)
  ringFill(pel, fill){
    if (this.failed || !this.schedule) return null;
    try { return this.schedule.ringFill(pel, fill); }
    catch (e){ this.fail(e); return null; }
  }"""),
])

patch(os.path.join(R, 'rom', 'effect', 'proof.js'), [
("""      if (r.offset){ m.w32(Q + 0x14, (m.u32(Q + 0x14) | 1) >>> 0); v4(Q + 0x20, r.offset); }""",
 """      if (r.offset){ m.w32(Q + 0x14, (m.u32(Q + 0x14) | 1) >>> 0); v4(Q + 0x20, r.offset); }
      // a position-only block with its own type word +8 (the Gore line's ring: u 30 +8 = 2, u 31 +8 = 1; 0xfc0718 / 0xfaf380)
      if (r.positionOnly && r.type8 != null) m.w32(Q + 8, r.type8 >>> 0);"""),
])

patch(os.path.join(R, 'shells.js'), [
("""  const out = { spawned: [], started: [], ended: [], removed: [], alive: [], refused: [], created: [] };""",
 """  const out = { spawned: [], started: [], ended: [], removed: [], alive: [], refused: [], created: [], ownerFills: [] };"""),
("""function landing071s00(S, D, hit, ctx){
  const m = S.modeIndex, t = hit.type;
  if ((t | 2) === 2 && ((m - 1) >>> 0) < 2) return 'keep';
  if (t === 1) child071s00(S, hit, ctx);                 // 0xfc2094: the children before the effect
  const param = t === 0 ? 1 : t === 2 ? 3 : t === 1 ? 2 : 0;
  if (param) contactStart(S, D, param, hit.point, 'landing');
}""", """function landing071s00(S, D, hit, ctx){
  const m = S.modeIndex, t = hit.type;
  if ((t | 2) === 2 && ((m - 1) >>> 0) < 2) return 'keep';
  if (t === 1) child071s00(S, hit, ctx);                 // 0xfc2094: the children before the effect
  // (effects lane, 2026-10-20) mode 0: the owner's slot ring at the shell's +0x40 (0xfc20ac..0xfc20e0 -> 0xfc083c, flag 0, s0 400 /
  // s1 600: literals 0xfc210c / 0xfc2110) -- schedule.js ringFill, before the contact effect as the ROM orders it
  if (m === 0 && ctx.out) ctx.out.ownerFills.push({ pel: ringPel071(S), position: S.position.slice(), s0: 400, s1: 600, flag: 0 });
  const param = t === 0 ? 1 : t === 2 ? 3 : t === 1 ? 2 : 0;
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// the u pel of the shell's owner (the ring's records are the owner's: em071_00u / em071_05u / em072_00u)
const ringPel071 = S => (S.monId === 'em071_05' ? 'em071_05u' : S.monId === 'em072_00' ? 'em072_00u' : 'em071_00u');"""),
("""const END03 = {
""", """const END03 = {
  // (effects lane, 2026-10-20) THE GORE LINE's sp_03 +0x154 0xfc3164 (READ whole): after 0x3fd820, modes in mask 0x3f71 (0, 4..6, 8..13)
  // call the owner's 0xfc083c at the shell's +0x40 with flag 0, s0 400 and s1 by the shell: 0x12f (Gore) 600, 0x137 (Shagaru) 900,
  // 0x133 (Chaotic) 900 for modes 8..10 else 600, any other 0 (literals 0xfc322c..0xfc3240) -- schedule.js ringFill
  uShellEm071_sp_03: (S, ctx) => {
    const m = S.modeIndex;
    if (!(m <= 13 && ((0x3f71 >>> m) & 1)) || !ctx || !ctx.out) return;
    const id = S.globalId;
    const s1 = id === 0x12f ? 600 : id === 0x137 ? 900 : id === 0x133 ? ((m - 8) >>> 0 < 3 ? 900 : 600) : 0;
    ctx.out.ownerFills.push({ pel: ringPel071(S), position: S.position.slice(), s0: 400, s1, flag: 0 });
  },
"""),
])
print('ok')
