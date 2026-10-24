// replay37.mjs (gapB, 2026-10-20): Nargacuga's / Silverwind's shell01 MODE 1 -- the frame handler 0xe47b0c's ground impact (c 30,
// em037_00c, cm200_040) -- run through stepShells of a PATCHED COPY of docs/render/shells.js (gapB/shells.patched.js, made by
// patch37.py; the repo file is not touched). Shows:
//   1. the spawn table: L0 M28 f20 / L1 M1 f60 / L1 M2 f2 make one shell01 mode 1 each (0xc9 Nargacuga, 0xcb Silverwind), c 30
//      started from its init at (owner x, ground, owner z); no other clip makes one
//   2. bit for bit against the ROM: (a) efx/agents/narga-shell-scratch/narga-spike-reference.json's three mode-1 runs (the ROM's
//      0x3fa498 / 0x3faec4 from the 0xe47b0c setup), (b) gapB/emu37n.py (the whole executable, both monsters' files) -- flags
//      0x1080, the init point, the start (list, key, point), the end at move 1 with no hit registration (the harnesses' 0x4a1ad8 -> 0)
//   3. the life with input.hitLife (what the viewer's schedule passes): hit slot 1 (14, 10) -> the end at move 14 + 10 + 2 = 26
//   4. the L1 M2 gate 0x6fe88(e, 3, 5): a (3, 5) play of L1 M2 makes none, (3, 4) does (a test-only action row; the viewer's
//      tables have no (3, 5) row, so in the app the gate is open, as Tigrex's)
//   5. 900 above the ground: deleted by the init (no shell, no start), as the ROM; no ground: refused by name
//   6. control: the unpatched repo shells.js makes no shell01 on these clips
// Run: node replay37.mjs   (from anywhere; python on PATH for emu37n.py)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const S = await import(pathToFileURL(join(HERE, 'shells.patched.js')).href);
const U = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const REF = JSON.parse(readFileSync(String.raw`C:\MHGU-Extract\efx\agents\narga-shell-scratch\narga-spike-reference.json`, 'utf8'));
const f = Math.fround, I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
let pass = 0, fail = 0;
const ok = (c, msg, d = '') => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + msg + (d ? '  -- ' + d : '')); };
const same = (a, b) => Object.is(f(a), f(b)), eq = (a, b) => a.length === b.length && a.every((x, i) => same(x, b[i]));

const inputOf = (mon, c, x = {}) => ({ monId: mon, joints: () => I, rage: false, dt: 1, hitLife: x.hitLife !== false,
  owner: { x: c.owner[0], y: c.owner[1], z: c.owner[2] }, ownerPos: { x: c.ownerPos[0], y: c.ownerPos[1], z: c.ownerPos[2] },
  ground: c.ground, size: c.size || [1, 1], baseScale: c.base == null ? 1 : c.base, rock: { variant: null, floorY: 0 }, effectAlive: () => true,
  action: x.action });
// a clip from frame 0 after one step of another clip (so its start is a new motion); every shell made, and each one's moves
function play(M, mon, list, clip, c, x = {}){
  const st = M.createShellState(mon), b = inputOf(mon, c, x);
  M.stepShells(st, Object.assign({}, b, { list: '0', clip: 'Motion[3]', frame: 0, action: undefined }));
  const made = [], refused = [], snaps = new Map();
  for (let fr = 0; fr < (x.steps || 100); fr++){
    const out = M.stepShells(st, Object.assign({}, b, { list, clip, frame: fr }));
    refused.push(...out.refused);
    for (const sh of out.spawned) made.push({ sh, step: fr });
    for (const { sh } of made){
      const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
      if (sh.state === 0xff || (L.length && L[L.length - 1].moves === sh.moves)) continue;
      L.push({ moves: sh.moves, state: sh.state, pos: sh.position.slice(), stops: (sh.events || []).filter(e => e.ev === 'stop').map(e => e.flag) });
    }
  }
  return { made, refused, snaps };
}
const C0 = { owner: [0x0100, 0x2000, 0x0040], ownerPos: [120.0, 35.0, -340.0], ground: 10.0, size: [1.2, 1.1], base: 0.9 };
const ID = { em037_00: 0xc9, em037_04: 0xcb };

// 1. THE SPAWN TABLE
console.log('== 1. the spawn table (frame F crossed on the action code\'s pair (F[k-2], F[k-1]]: the shell on step F + 1)');
for (const mon of ['em037_00', 'em037_04']){
  for (const [l, c, F] of [['0', 'Motion[28]', 20], ['1', 'Motion[1]', 60], ['1', 'Motion[2]', 2]]){
    const r = play(S, mon, l, c, C0, { steps: 120 }), m = r.made.filter(x => x.sh.shell === 'shell01');
    const sh = m[0] && m[0].sh, st = sh && sh.start;
    ok(m.length === 1 && m[0].step === F + 1 && sh.globalId === ID[mon] && sh.modeIndex === 1 && sh.k.flags === 0x1080 &&
       st && st.key === 30 && st.list === 'c' && eq(sh.prevPosition, [120.0, 10.0, -340.0]) && eq(sh.angles, [0, 0, 0]),
       `${mon} L${l} ${c} f${F}: one shell01 mode 1`, sh ? `step ${m[0].step}, id ${sh.globalId.toString(16)}, flags ${sh.k.flags.toString(16)}, ` +
       `c ${st && st.key} (list ${st && st.list}, listId ${st && st.listId}) at ${sh.prevPosition.join(', ')}, words ${sh.angles.join(',')}` : 'none ' + r.refused.map(q => q.why).join('; '));
  }
  const none = [['0', 'Motion[27]'], ['1', 'Motion[3]'], ['1', 'Motion[7]'], ['2', 'Motion[8]'], ['0', 'Motion[1]']]
    .map(([l, c]) => play(S, mon, l, c, C0, { steps: 120 }).made.filter(x => x.sh.shell === 'shell01' && x.sh.modeIndex === 1).length);
  ok(none.every(n => n === 0), `${mon}: L0 M27 / L1 M3 / L1 M7 / L2 M8 / L0 M1 make no mode-1 shell01`, none.join(','));
}
{ // which pel the start resolves to (the shell's own .shl lists: Nargacuga list 0, Silverwind list 1 = em037_00c)
  const pels = ['em037_00', 'em037_04'].map(mon => { const sh = play(S, mon, '0', 'Motion[28]', C0).made[0].sh;
    const L = S.SHELL_DATA[mon].shells.shell01.lists[sh.start.listId]; return `${mon}: listId ${sh.start.listId} -> ${L.list} ${L.pel}`; });
  ok(pels.every(p => /em037_00c$/.test(p)), 'c 30 is em037_00c\'s on both (the export has it `when: shell`, cm200_040)', pels.join(' | '));
}

// 2. BIT FOR BIT AGAINST THE ROM
console.log('== 2. against the ROM (no hit registration in the harnesses: input.hitLife false)');
const romOf = (o) => ({ deleted: o.state !== 1 || !o.events_init.length, flags: o.flags15ec, pos: o.pos, start: o.events_init[0],
                        end: (o.moves.find(m => m.state === 0xfe) || {}).k, stop: ((o.moves[0] || {}).events || []).filter(e => e.ev === 'stop').map(e => e.flag) });
function cmp(mon, c, R, what){
  const r = play(S, mon, '0', 'Motion[28]', c, { hitLife: false, steps: 40 }), m = r.made.find(x => x.sh.shell === 'shell01');
  if (R.deleted) return ok(!m && !r.refused.length, `${what}: deleted by the init, as the ROM`, m ? 'made' : 'none made');
  if (!m) return ok(false, what, 'no shell: ' + r.refused.map(q => q.why).join('; '));
  const sh = m.sh, L = r.snaps.get(sh.id), end = L.find(s => s.state === 0xfe);
  const st = sh.start, d = [];
  if (sh.k.flags !== R.flags) d.push('flags ' + sh.k.flags.toString(16) + ' / ' + R.flags.toString(16));
  if (!eq(sh.prevPosition, R.pos)) d.push('pos ' + sh.prevPosition + ' / ' + R.pos);
  if (!(st.listId === R.start.list && st.key === R.start.key && eq(st.requester.position, R.start.at))) d.push('start ' + [st.listId, st.key, st.requester.position] + ' / ' + [R.start.list, R.start.key, R.start.at]);
  if (!end || end.moves !== R.end) d.push('end ' + (end && end.moves) + ' / ' + R.end);
  if (end && end.stops.join() !== R.stop.join()) d.push('stops ' + end.stops + ' / ' + R.stop);
  ok(!d.length, `${what}: flags, init point, start (list, key, point), end move, graceful stop`, d.length ? d.join('; ') :
     `flags ${R.flags.toString(16)}, at ${R.pos.join(', ')}, c ${R.start.key}, end at move ${R.end}, stop ${R.stop}`);
}
// (a) the reference's runs (their "from" names the owner block): S01-motion-a / -b / -refused
const refCase = { 'S01-motion-a': { owner: [0, 0x2000, 0], ownerPos: [120.0, 35.0, -340.0], ground: 10.0 },
                  'S01-motion-b': { owner: [0, 0x9000, 0], ownerPos: [-800.5, 250.0, 1200.25], ground: 240.0 },
                  'S01-motion-refused': { owner: [0, 0, 0], ownerPos: [0.0, 1500.0, 0.0], ground: 10.0 } };
for (const o of REF.shell01.runs.filter(x => x.mode === 1)) cmp('em037_00', refCase[o.name], romOf(o), 'reference ' + o.name);
// (b) emu37n.py: both monsters, other blocks (size / base scale / facing / e+0x10f0 varied: none of them may move it)
const E = [
  { name: 'n_a', mon: 'em037_00', owner: [0x0100, 0x2000, 0x0040], ownerPos: [120.0, 35.0, -340.0], u10f0: 7.0, ground: 10.0, size: [1.2, 1.1], base: 0.9 },
  { name: 'n_b', mon: 'em037_00', owner: [0, 0xc123, 0], ownerPos: [-2400.75, 25.5, 1300.0], u10f0: -99.0, ground: -12.25, size: [0.85, 1.0], base: 1.0 },
  { name: 'n_edge', mon: 'em037_00', owner: [0, 0, 0], ownerPos: [0.0, 909.9, 0.0], u10f0: 0.0, ground: 10.0, size: [1, 1], base: 1.0 },
  { name: 'n_high', mon: 'em037_00', owner: [0, 0, 0], ownerPos: [0.0, 910.0, 0.0], u10f0: 0.0, ground: 10.0, size: [1, 1], base: 1.0 },
  { name: 'w_a', mon: 'em037_04', owner: [0, 0x9000, 0], ownerPos: [-800.5, 250.0, 1200.25], u10f0: -3.0, ground: 240.0, size: [1, 1], base: 1.0 },
  { name: 'w_high', mon: 'em037_04', owner: [0, 0x9000, 0], ownerPos: [5.0, 1240.0, 5.0], u10f0: 0.0, ground: 240.0, size: [1, 1], base: 1.0 },
].map(c => Object.assign({ target: [0, 0, 0], frames: 8 }, c));
const dir = mkdtempSync(join(tmpdir(), 'gapB37-'));
writeFileSync(join(dir, 'cases.json'), JSON.stringify(E));
const py = spawnSync('python', [join(HERE, 'emu37n.py'), join(dir, 'cases.json'), join(dir, 'rom.json')], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (py.status !== 0){ console.log(py.stdout, py.stderr); process.exit(1); }
const ROM = JSON.parse(readFileSync(join(dir, 'rom.json'), 'utf8'));
for (const c of E){
  const o = ROM[c.name], st = o.log.find(x => x[0] === 'start');
  const R = { deleted: !(o.spawn.state === 1 && st), flags: o.flags, pos: o.spawn.pos, start: st ? { list: st[1], key: st[2], at: st[3] } : null,
              end: (o.frames.find(s => s.state === 0xfe) || {}).k, stop: ((o.frames[0] || {}).log || []).filter(x => x[0] === 'stop').map(x => x[1]) };
  cmp(c.mon, c, R, 'emu37n ' + c.name);
}
{ // the comparison is not blind: the ROM point moves with the block, the JS with it
  const a = ROM.n_a.spawn.pos, b = ROM.n_b.spawn.pos;
  ok(!eq(a, b) && same(ROM.n_a.spawn.pos[1], 10.0) && same(ROM.n_b.spawn.pos[1], -12.25), 'control: the ROM point follows the block x / z and the ground (not e+0x10f0)',
     a.join(',') + ' | ' + b.join(','));
}

// 3. THE LIFE (input.hitLife, the viewer's)
console.log('== 3. the life with input.hitLife');
for (const mon of ['em037_00', 'em037_04']){
  const r = play(S, mon, '1', 'Motion[1]', C0, { steps: 120 }), sh = r.made[0].sh, L = r.snaps.get(sh.id), end = L.find(s => s.state === 0xfe);
  ok(end && end.moves === 26 && end.stops.join() === '0', `${mon}: hit slot 1 (14, 10) keeps it to move 14 + 10 + 2, then c 30's graceful stop`,
     end ? `ended at move ${end.moves}, stops ${end.stops}` : 'never ended');
}

// 4. THE L1 M2 GATE 0x6fe88(e, 3, 5)
console.log('== 4. the L1 M2 gate (a test-only action row for the play)');
for (const [act, want] of [[[3, 5], 0], [[3, 4], 1], [[7, 5], 1]]){
  const row = { action: act, list: '1', clip: 'Motion[2]', pick: 'test', code: 'gapB-test' };
  S.SHELL_DATA.em037_00.actions.push(row);
  let n;
  try { n = play(S, 'em037_00', '1', 'Motion[2]', C0, { steps: 20, action: act }).made.filter(x => x.sh.shell === 'shell01').length; }
  finally { S.SHELL_DATA.em037_00.actions.pop(); }
  ok(n === want, `L1 M2 played by action (${act.join(', ')}): ${want ? 'one shell' : 'none'}`, String(n));
}
{
  const n = play(S, 'em037_00', '0', 'Motion[28]', C0, { steps: 40, action: [3, 5] }).made.length;
  ok(n === 1, 'the gate is L1 M2\'s only: L0 M28 under a (3, 5) force still makes one', String(n));
}

// 5. REFUSALS
console.log('== 5. refusals');
{
  const st = S.createShellState('em037_00'), b = inputOf('em037_00', C0); const why = [];
  for (let fr = 0; fr < 30; fr++) why.push(...S.stepShells(st, Object.assign({}, b, { ground: undefined, rock: { variant: null }, list: '0', clip: 'Motion[28]', frame: fr })).refused.map(r => r.why));
  ok(why.length === 1 && /no ground/.test(why[0]), 'no ground: refused by name, once', why.join(' | '));
  const nf = play(S, 'em037_00', '0', 'Motion[28]', Object.assign({}, C0, { owner: [0, NaN, 0] }), { steps: 30 }).made.length;
  ok(nf === 1, 'no facing: still made (the 0x80 arm turns the zero vec by it)', String(nf));
}

// 6. CONTROL: the repo's module
console.log('== 6. control: the unpatched docs/render/shells.js');
{
  const n = ['em037_00', 'em037_04'].map(mon => [['0', 'Motion[28]'], ['1', 'Motion[1]'], ['1', 'Motion[2]']]
    .map(([l, c]) => play(U, mon, l, c, C0, { steps: 80 }).made.filter(x => x.sh.shell === 'shell01').length).join(',')).join(' / ');
  ok(n === '0,0,0 / 0,0,0', 'the repo module makes no shell01 on L0 M28 / L1 M1 / L1 M2 (the patch is what builds it)', n);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
