import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')

old = """function stepTurn(base, frame){
  turnYaw = base ? turnAt(state.id, state.list, base, frame) * Math.PI / 180 : 0;"""
new = """// THE STEER TOWARD THE TARGET (Raven, 2026-10-05: "We already have a proxy target for this kind of situation, just an
// invisible target"). Some actions turn the unit toward the target rather than by a fixed angle: the monster steer
// 0x7840c -> 0x77d28 -> 0x770e4, READ in full (dev/beams/em020_00.md "The steer 0x7840c / 0x77d28"; bit-for-bit against
// the ROM under unicorn). Each update whose frame step overlaps [from, to] (0x72714 mode 9): s = ceil(rate x step x share)
// & 0xffff, T = the target's bearing, d = s16(offset - yaw + T); |d| < s snaps the yaw onto T + offset, else it moves s
// the shorter way. The target is rockInput's (the viewer's invisible one, ahead of the monster), its bearing taken
// against his facing, so the yaw here is relative and adds to CLIP_TURN's. NOT REPLAYED, by name: the steer's stop once
// the unit has travelled 150 with the target behind him within 150 (0x7828c) -- the proxy target is never that close.
//   Rustrazor (7, 0xdf) / (7, 0xe2), 0xdcbe78 ph1: rate 910 (tune 0x27 / (0x26 - 0x25) x 182.044 = 5 degrees a frame),
// offset 0x8000 (his back on the target) or 0x838e (+ tune 0x29, 5 degrees), frames 50..56 (tune 0x25 / 0x26).
const STEER = {
  em020_04: { '9|Motion[20]': { from: 50, to: 56, rate: 910, offset: { '7:0xdf': 0x8000, '7:0xe2': 0x838e } } },
};
const steer = { key: null, prev: 0, yaw: 0 };
const s16 = v => ((v & 0xffff) ^ 0x8000) - 0x8000;
function steerAt(base, frame){
  const t = base && STEER[state.id] && STEER[state.id][state.list + '|' + base];
  if (!t){ steer.key = null; return 0; }
  const ri = rockInput(), O = ri ? t.offset[ri.variant] : undefined;
  const key = state.id + '|' + state.list + '|' + base + '|' + (ri && ri.variant);
  if (key !== steer.key || frame < steer.prev){ steer.key = key; steer.prev = frame; steer.yaw = 0; }
  const prev = steer.prev, cur = frame;
  steer.prev = frame;
  const rt = effectRuntimeInstance(), P = rt && rt.parent;
  if (O !== undefined && P && ri && ri.target && cur > prev &&
      ((t.from <= prev && prev <= t.to) || (t.from <= cur && cur <= t.to))){
    const share = Math.max(0, Math.min(cur, t.to) - Math.max(prev, t.from)) / (cur - prev);
    const sStep = Math.ceil(t.rate * (cur - prev) * share) & 0xffff;
    const bearing = Math.trunc(0.5 + Math.atan2(ri.target.x - P.position[0], ri.target.z - P.position[2]) * 10430.378);
    const T = (bearing - rt.schedule.ownerYaw16()) & 0xffff;              // against his facing: the yaw here is relative
    const d = s16(O - steer.yaw + T);
    steer.yaw = Math.abs(d) < sStep ? (T + O) & 0xffff : (steer.yaw + (d < 0 ? -sStep : sStep)) & 0xffff;
  }
  return s16(steer.yaw) * 360 / 65536;
}
function stepTurn(base, frame){
  turnYaw = base ? (turnAt(state.id, state.list, base, frame) + steerAt(base, frame)) * Math.PI / 180 : 0;"""
assert s.count(old) == 1
s = s.replace(old, new)
if crlf: s = s.replace('\n', '\r\n')
open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p); print('patched')
