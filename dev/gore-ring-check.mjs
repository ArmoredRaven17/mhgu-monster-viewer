// THE GORE LINE'S SLOT RING (render/rom/effect/schedule.js ringFill / ringBurst / stepRing) against the ROM: the same scenario run
// through the viewer's ring and through the ROM's own 0xfc05ec / 0xfc083c / 0xfaf318 under unicorn (<scratchpad>/zg/ringemu.py:
// tracec.py's machine, the effect request 0x6feb8, the stop 0x329c40, the ground query 0x183664 and 0x69ed0 / 0x69f0c hooked).
// Compared per step: every request (u 30 / u 31, its point, its +0x1c bits and +8), every stop, and the ring's bytes -- the two slot
// bytes, the counter C+0x80, the live count C+0x81 and each slot's life +0x30. (effects lane, 2026-10-20; rom-map "Class requests
// driven".) The slot timers (vt+0x1dc 0xfae96c..0xfae9cc, 0x7206c: life -= 1 a frame, burst at <= 0) are the viewer's stepRing and are
// checked by a step count here, not on the ROM.
//
//   node dev/gore-ring-check.mjs            (RING_EMU=<path to ringemu.py> to point elsewhere)
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const EMU = process.env.RING_EMU ||
  'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/zg/ringemu.py';
const { EffectSchedule } = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/schedule.js').href);
let pass = 0, fail = 0;
const ok = (c, msg, d = '') => { if (c){ pass++; console.log('PASS ' + msg + (d ? '  -- ' + d : '')); } else { fail++; console.log('FAIL ' + msg + (d ? '  -- ' + d : '')); } };
const scenarios = [
  { name: 'three fills, a burst by reuse, the ground (hit within 500 / farther / above), an explicit burst', floor: 0, ops: [
    { fill: [100, 0, 200], s0: 400, s1: 240, flag: 1 }, { fill: [300, 0, 400], s0: 500, s1: 480, flag: 1 },
    { fill: [500, 0, 600], s0: 400, s1: 240, flag: 1 }, { fill: [700, 300, 800], s0: 400, s1: 600, flag: 0 },
    { fill: [900, 800, 1000], s0: 400, s1: 600, flag: 0 }, { fill: [50, -900, 50], s0: 400, s1: 600, flag: 0 }, { burst: 0 },
    { fill: [10, 20, 30], s0: 280, s1: 360, flag: 1 }, { fill: [40, 50, 60], s0: 450, s1: 360, flag: 1 }, { burst: 1 }, { burst: 0 },
    { fill: [70, 80, 90], s0: 400, s1: 90, flag: 1 } ] },
  { name: 'a raised floor', floor: 250, ops: [
    { fill: [0, 0, 0], s0: 400, s1: 600, flag: 0 }, { fill: [0, 600, 0], s0: 400, s1: 600, flag: 0 }, { fill: [0, 800, 0], s0: 400, s1: 600, flag: 0 } ] },
];
function viewer(sc){
  const log = [];
  const S = Object.create(EffectSchedule.prototype);
  S.host = { stageFloorY: sc.floor, stopRequest: (q, m) => { q.stopped = true; log.push({ stop: 1, mode: m }); } };
  S.placeEvent = (pel, key, reqs) => { const r = reqs[0]; log.push({ req: key, pt: r.position.map(v => +v.toFixed(3)), f1c: r.flags1c & 3, type8: r.type8 }); return [{ stopped: false }]; };
  const out = [];
  for (const op of sc.ops){
    log.length = 0;
    if (op.fill) S.ringFill('em071_00u', { position: op.fill, s0: op.s0, s1: op.s1, flag: op.flag });
    else if (S.ring && S.ring.slots[op.burst].byte !== 0xff) S.ringBurst(op.burst);
    else if (!S.ring || S.ring.slots[op.burst].byte === 0xff){
      // 0xfaf318 on a free slot (its caller never does this; the scenario asks it only of busy slots)
    }
    const R = S.ring || { slots: [{ byte: 0xff }, { byte: 0xff }], counter: 0, count: 0 };
    out.push({ log: log.slice(), ring: { bytes: R.slots.map(s => s.byte), counter: R.counter, count: R.count,
                                          life: R.slots.map(s => s.byte === 0xff ? null : +(s.life).toFixed(3)) } });
  }
  return { S, out };
}
for (const sc of scenarios){
  const r = spawnSync('python', [EMU], { input: JSON.stringify(sc), encoding: 'utf8', cwd: EMU.replace(/[\\/][^\\/]+$/, '') });
  let rom;
  try { rom = JSON.parse(r.stdout); } catch { ok(false, sc.name + ': the ROM run', (r.stderr || r.stdout || '').slice(-400)); continue; }
  const { out: js } = viewer(sc);
  sc.ops.forEach((op, i) => {
    const a = rom[i], b = js[i];
    const reqA = a.log.filter(x => x.req != null).map(x => [x.req, x.pt, x.f1c, x.type8]);
    const reqB = b.log.filter(x => x.req != null).map(x => [x.req, x.pt, x.f1c, x.type8]);
    const stopsA = a.log.filter(x => x.stop != null).length, stopsB = b.log.filter(x => x.stop != null).length;
    // the ROM's life of a FREE slot is whatever stayed in the field; the viewer keeps none: compare the busy ones
    const lifeA = a.ring.life.map((l, k) => a.ring.bytes[k] === 0xff ? null : l);
    const same = JSON.stringify(reqA) === JSON.stringify(reqB) && stopsA === stopsB && JSON.stringify(a.ring.bytes) === JSON.stringify(b.ring.bytes)
               && a.ring.counter === b.ring.counter && a.ring.count === b.ring.count && JSON.stringify(lifeA) === JSON.stringify(b.ring.life);
    ok(same, sc.name + ' / step ' + i + ' ' + JSON.stringify(op), same ? JSON.stringify(reqB) : 'ROM ' + JSON.stringify({ reqA, stopsA, ring: a.ring }) + ' VIEWER ' + JSON.stringify({ reqB, stopsB, ring: b.ring }));
  });
}
// the timers (stepRing): two fills, lives 3 and 5 -> bursts after 3 and 5 steps, each once, u 31 at its point
{
  const log = [];
  const S = Object.create(EffectSchedule.prototype);
  S.host = { stageFloorY: 0, stopRequest: q => { q.stopped = true; } };
  S.placeEvent = (pel, key, reqs) => { log.push([key, reqs[0].position.join(',')]); return [{ stopped: false }]; };
  S.ringFill('em071_00u', { position: [1, 0, 1], s0: 400, s1: 3, flag: 1 });
  S.ringFill('em071_00u', { position: [2, 0, 2], s0: 400, s1: 5, flag: 1 });
  const at = [];
  for (let i = 1; i <= 8; i++){ const n = log.length; S.stepRing(); if (log.length > n) at.push(i + ':' + log.slice(n).map(x => x[0] + '@' + x[1]).join('/')); }
  ok(at.join(' ') === '3:31@1,0,1 5:31@2,0,2', 'the slot timers: each slot bursts (u 31 at its point) when its life reaches 0', at.join(' '));
  ok(S.ring.count === 0 && S.ring.slots.every(s => s.byte === 0xff), 'after both bursts the ring is empty, the count 0', JSON.stringify(S.ring));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
