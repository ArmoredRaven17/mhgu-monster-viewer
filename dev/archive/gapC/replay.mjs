// gapC replay: Nakarkos's sp_00 0..8 (arm (7, 0xb) / (7, 0x25)), 1 (shell11 2's fall, body (7, 0x43)) and 65 / 66 (the body's
// motion-record table), on a PATCHED COPY of docs/render/shells.js (patch.py -> shells.patched.js), with the HEAD file as the
// negative control. Usage: node replay.mjs [patched|head]   (default: both). Prints spawns, the em084 pel:key starts, refusals.
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const which = process.argv[2] ? [process.argv[2]] : ['patched', 'head'];
const FILES = { patched: join(HERE, 'shells.patched.js'), head: 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js' };
const mon = 'em084_00';
// joints: identity rotation, a translation by gid (as fb/reasonsD/arm084.mjs); the arms' attached frames left / right
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const frameM = side => [1,0,0,0, 0,1,0,0, 0,0,1,0, side === 'left' ? -300 : 300, 400, 200, 1];
const base = { monId: mon, joints: jm, attachedJoints: { left: jm, right: jm },
  rock: { floorY: 0, wall: { axis: 'z', at: 3000, facing: -1 } }, owner: { x: 0, y: 0x3000, z: 0 },
  ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, questLevel: 10 };
const cases = [
  // arm (7, 0xb): l_2 / r_2 M1 (341 frames), f120; low rank and G; the form does not matter (0, none, exposed)
  ...[3, 5].flatMap(rank => ['l_2', 'r_2'].flatMap(list => [0, null, 'exposed'].map(form => (
    { name: `arm(7,0xb) ${list} M1 rank${rank} form${form}`, list, clip: 'Motion[1]', len: 341, steps: 900, rank, form })))),
  // arm (7, 0x25): M50 (341), f108
  ...[3, 5].flatMap(rank => ['l_2', 'r_2'].map(list => (
    { name: `arm(7,0x25) ${list} M50 rank${rank}`, list, clip: 'Motion[50]', len: 341, steps: 900, rank, form: 1 }))),
  // body (7, 0x43): L0 M63 (651), f460 -> shell11 2 -> 20 x (u 21 + shell00 1 falling) -> shell01 1 (u 3)
  { name: 'body(7,0x43) L0 M63 stance2', list: '0', clip: 'Motion[63]', len: 651, steps: 3700, rank: 5, stance: 2 },
  { name: 'body(7,0x43) L0 M63 stance1 (control: none)', list: '0', clip: 'Motion[63]', len: 651, steps: 700, rank: 5, stance: 1 },
  // body (7, 0xa) / (7, 0xd) / (2, 7): L0 M4 (_loop, 201), the clock records at 0 / 200 -> layer >= 58 -> 65 / 66
  ...['7:0x0a', '7:0x0d', '2:0x07'].map(variant => ({ name: `body ${variant} L0 M4`, list: '0', clip: 'Motion[4]', len: 201, loop: true, steps: 700, rank: 5, variant })),
  { name: 'body 7:0x0a L0 M4 part3 broken (control: no 65)', list: '0', clip: 'Motion[4]', len: 201, loop: true, steps: 700, rank: 5, variant: '7:0x0a', parts084: { 3: 3 } },
  { name: 'body 7:0x0d L0 M4 part2 at 2 (still below 3: 66)', list: '0', clip: 'Motion[4]', len: 201, loop: true, steps: 700, rank: 3, variant: '7:0x0d', parts084: { 2: 2 } },
  { name: 'body L0 M4 no pick (control: none)', list: '0', clip: 'Motion[4]', len: 201, loop: true, steps: 400, rank: 5 },
];
for (const w of which){
  const S = await import(pathToFileURL(FILES[w]).href + '?' + w);
  console.log('==== ' + w + ' (' + FILES[w] + ')');
  if (S.pickVariantsFor) console.log('pickVariantsFor L0 M4:', JSON.stringify(S.pickVariantsFor(mon, '0', 'Motion[4]_loop', {})));
  for (const c of cases){
    const st = S.createShellState(mon), spawned = [], starts = {}, refused = {}, seen = new WeakSet();
    for (let fr = 0; fr < c.steps; fr++){
      const frame = c.loop ? fr % c.len : Math.min(fr, c.len - 1);
      const input = Object.assign({}, base, { list: c.list, clip: c.clip, frame, rank: c.rank,
        loopStart: c.loop ? 0 : undefined, beamState: c.stance ? { stance: c.stance } : undefined, parts084: c.parts084,
        rock: Object.assign({}, base.rock, { variant: c.variant }),
        arms: { left: { form: c.form, frame: frameM('left') }, right: { form: c.form, frame: frameM('right') } } });
      let out;
      try { out = S.stepShells(st, input); } catch (e){ console.log('  ERR at', fr, e.message); break; }
      const add = (q, tag) => { if (q && q.pel){ const k = q.pel + ':' + q.key; (starts[k] = starts[k] || []).push(fr + (tag ? '/' + tag : '')); } };
      for (const s of out.started) add(s.start, s.start.kind);
      for (const sh of out.spawned){
        spawned.push(`${sh.shell} m${sh.modeIndex} @${fr}` + (sh.arm ? ' ' + sh.arm : '') + (sh.position ? ' (' + sh.position.map(x => Math.round(x)).join(',') + ')' : ''));
        add(sh.start, 'init');
      }
      for (const sh of out.alive.concat(out.ended)) for (const e of sh.events || []) if (e.ev === 'start' && e.start && e.kind !== 'create' && !seen.has(e)){ seen.add(e); add(e.start, e.kind); }
      for (const r of out.refused || []){ const k = (r.shell || '') + ' m' + r.mode + ': ' + (r.why || '').slice(0, 110); refused[k] = (refused[k] || 0) + 1; }
    }
    console.log('-- ' + c.name);
    const byShell = {};
    for (const s of spawned){ const k = s.split(' @')[0]; (byShell[k] = byShell[k] || []).push(s.slice(k.length + 1)); }
    for (const [k, v] of Object.entries(byShell)) console.log('   SPAWN ' + k + ' x' + v.length + ': ' + v.slice(0, 4).join(' | ') + (v.length > 4 ? ' ...' : ''));
    for (const [k, v] of Object.entries(starts)) if (/em084_00u(_r)?:/.test(k)) console.log('   START ' + k + ' x' + new Set(v.map(x => String(x).split('/')[0])).size + ': ' + [...new Set(v)].slice(0, 4).join(' '));
    for (const [k, v] of Object.entries(refused)) console.log('   REFUSED x' + v + ' ' + k);
  }
}
