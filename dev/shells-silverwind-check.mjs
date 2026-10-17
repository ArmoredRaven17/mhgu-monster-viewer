// Silverwind Nargacuga's shells (em037_04) in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/sw37/emu37.py (env SW37_EMU overrides) runs the WHOLE executable on unicorn after its
//      static initialisers (the Nargacuga spike harness's method, efx/agents/narga-shell-scratch/nharness.py), hooking only the
//      rShell getters (answered with em037_04.arc's files), the hit registration, the setup allocators, 0x48b884 (the setup
//      logged), the stage query (the plane stand-in at floorY), the ground marker 0x43b2b0 and the effect requester / start /
//      stop. The setups are the class's own spawners run on the ROM -- 0xe48fc8 (the spike throws), 0xe49a78 (the rising
//      spike 8 / 13 / 14), 0xe49b24 / 0xe49bc8 (shell45) -- and every shell a move creates (shell46 from a rising spike's end
//      0xe595ac, shell01 from a floor landing 0xe59334 / 0xe59f84) is run from the setup the ROM built. Each case then runs
//      through stepShells as the viewer steps it (the action's clip one frame a step, the row's spawn frame) and every move of
//      every shell -- state, position, velocity, acceleration, anchor, angle words, timer, the base45 shrink scale, the effect
//      starts / stops, the creates -- is compared bit for bit (float32) to the end (state 0xfe), the children the same way.
//      Not run on the ROM: the action code's own frame tests and the facing word (e+0xcae4) the 'yaw0' rows hand the spawner
//      -- read statically (dev/em037_04-shells-spec.md 2), the spawner run here is given the words the module computes.
//   2. The contract: the pick lists, the rows' gates (tired: none; the tail: the second mode), the refusals, Nargacuga's data
//      unchanged by Silverwind's.
//   3. CONTROLS: a wrong target, a wrong joint and a wrong owner facing must FAIL the comparison.
//
//   node dev/shells-silverwind-check.mjs
//
// Exit code 1 when anything fails.
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const EMU = process.env.SW37_EMU ||
  'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/sw37/emu37.py';
const f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, detail = '') => { if (c){ pass++; console.log('PASS ' + msg + (detail ? '  -- ' + detail : '')); } else { fail++; console.log('FAIL ' + msg + (detail ? '  -- ' + detail : '')); } };

// a joint 143 world matrix: a rotation (yaw a, pitch b, roll c) and a point, rows = axes (the game's memory order)
function jointOf(a, b, c, t){
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
  const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
  const R = mul(mul(Rz, Rx), Ry);
  return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
}
const J1 = jointOf(0.3, -0.2, 0.1, [40.5, 520.25, 310.75]);
const J2 = jointOf(-1.9, 0.35, -0.4, [-220.0, 610.5, -480.25]);
const U16_TO_DEG = f(0.0054931640625), DEG = f(182.04444885253906);
// e+0xcae4 back to a word, as the 'yaw0' rows hand it (spawn037w): the ROM's spawner is given this
const yaw0 = Y => Math.trunc(f(f(0.5) + f(f(f(Y & 0xffff) * U16_TO_DEG) * DEG))) & 0xffff;

// the cases: a clip and its pick (or a forced action), the inputs, and the ROM spawner call the row makes
const OW = [0x0300, 0x5000, 0x0100], OP = [150.5, 20.25, -340.75], TG = [300.0, 0.0, 1500.0];
const C = (name, list, clip, variant, spawn, x = {}) => Object.assign({ name, list, clip, variant, spawn, joint: J1, owner: OW,
  ownerPos: OP, target: TG, floorY: 0.0, sev: false, steps: 700 }, x);
const b45 = (fn, mode, words) => ({ fn, mode, words, h: 0 });
const cases = [
  // the spike throws, Nargacuga's rows on Silverwind's files (kinds 0 / 1 / 2); every floor landing makes shell01 mode 0 (u 4)
  C('throw28', '2', 'Motion[8]', '7:0x28', { fn: 'e48fc8', xIdx: 0, kind: 0 }, { owner: [0, 0x3000, 0] }),
  C('throw3a', '2', 'Motion[8]', '7:0x3a', { fn: 'e48fc8', xIdx: 3, kind: 1 }, { joint: J2, owner: [0x0100, 0x9000, 0x0200] }),
  C('throw82', '2', 'Motion[8]', '7:0x82', { fn: 'e48fc8', xIdx: 0, kind: 2 }, { owner: [0x0800, 0x1000, 0] }),
  // the rising spike: 100 moves up, then shell46 falls to the floor and makes shell01
  C('rise8', '2', 'Motion[8]', '7:0xf4', { fn: 'e49a78', mode: 8 }, { owner: [0x0400, 0x2000, 0] }),
  C('rise8land', '2', 'Motion[8]', '7:0xf4', { fn: 'e49a78', mode: 8 }, { owner: [0x0400, 0x2000, 0], floorY: 4524.0 }),
  C('leap13', '9', 'Motion[6]', '7:0xea', { fn: 'e49a78', mode: 13 }, { joint: J2, owner: [0, 0xb000, 0] }),
  C('leap14', '9', 'Motion[7]', null, { fn: 'e49a78', mode: 14 }, { force: [7, 0xdf], owner: [0, 0x7000, 0x0400] }),
  // the blades
  C('blade02', '2', 'Motion[5]', '7:0x02', b45('e49bc8', 2, [0, 0, 0])),
  C('blade02s', '2', 'Motion[5]', '7:0x02', b45('e49bc8', 5, [0, 0, 0]), { sev: true, joint: J2 }),
  C('blade6c', '2', 'Motion[21]', '7:0x6c', [b45('e49bc8', 2, [0, 0, 0]), b45('e49bc8', 2, [0, 0, 0])]),
  C('bladef8', '2', 'Motion[19]', '7:0xf8', b45('e49bc8', 8, [0, yaw0(OW[1]), 0])),
  C('bladef8s', '2', 'Motion[19]', '7:0xf8', b45('e49bc8', 9, [0, yaw0(OW[1]), 0]), { sev: true }),
  C('bladef7', '2', 'Motion[20]', '7:0xf7', b45('e49bc8', 6, [0, yaw0(OW[1]), 0])),
  C('bladef7s', '2', 'Motion[20]', '7:0xf7', b45('e49bc8', 7, [0, yaw0(OW[1]), 0]), { sev: true }),
  C('blade6d', '2', 'Motion[19]', '7:0x6d', b45('e49b24', 8, [0, 0, 0])),
  C('blade6e', '4', 'Motion[3]', null, b45('e49b24', 6, [0, yaw0(OW[1]), 0])),
  C('bladef2', '2', 'Motion[3]', '7:0xf2', b45('e49bc8', 0, [0, 0, 0])),
  // the target inside both clamps (the aim's difference from the owner's words within [-10, 10] / [-40, 40] deg): the aim kept
  C('bladef2aim', '2', 'Motion[3]', '7:0xf2', b45('e49bc8', 0, [0, 0, 0]), { target: [1477.0, -100.0, -260.0] }),
  C('bladef2s', '2', 'Motion[3]', '7:0xf2', b45('e49bc8', 3, [0, 0, 0]), { sev: true, joint: J2, target: [-2500.0, 300.0, -400.0] }),
  C('bladef3', '2', 'Motion[2]', '7:0xf3', b45('e49bc8', 1, [0, 0, 0]), { owner: [0, 0xe000, 0] }),
  C('bladef3s', '2', 'Motion[2]', '7:0xf3', b45('e49bc8', 4, [0, 0, 0]), { sev: true }),
  C('bladeef10', '9', 'Motion[10]', null, b45('e49bc8', 12, [0, yaw0(OW[1]), 0])),
  C('bladeef5', '9', 'Motion[5]', null, b45('e49b24', 10, [0, yaw0(OW[1]), 0])),
  C('bladeef5s', '9', 'Motion[5]', null, b45('e49b24', 11, [0, yaw0(OW[1]), 0]), { sev: true }),
  // the ending: the flight's effect gone at move 30 (base45 waits for its handle: deleted on the next move after its end)
  C('blade02kill', '2', 'Motion[5]', '7:0x02', b45('e49bc8', 2, [0, 0, 0]), { kill: 30 }),
];
const romCase = c => ({ name: c.name, folder: c.spawn.fn === 'e48fc8' || c.spawn.fn === 'e49a78' ? '00' : (Array.isArray(c.spawn) ? '45' : '45'),
                        spawn: c.spawn, joint: c.joint, owner: c.owner, ownerPos: c.ownerPos, target: c.target, floorY: c.floorY,
                        frames: 700, childFrames: 700, kill: c.kill });
const dir = mkdtempSync(join(tmpdir(), 'sw37-'));
const romCases = [];
for (const c of cases){
  const sp = Array.isArray(c.spawn) ? c.spawn : [c.spawn];
  sp.forEach((s, i) => romCases.push(Object.assign(romCase(c), { name: c.name + '#' + i, spawn: s,
    folder: s.fn === 'e48fc8' || s.fn === 'e49a78' ? '00' : '45' })));
}
writeFileSync(join(dir, 'cases.json'), JSON.stringify(romCases));
const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'rom.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
if (py.status !== 0){ console.log(py.stdout, py.stderr); process.exit(1); }
const ROMJ = JSON.parse(readFileSync(join(dir, 'rom.json'), 'utf8'));
const romOf = c => { const out = []; for (let i = 0; ; i++){ const r = ROMJ[c.name + '#' + i]; if (!r) break; out.push(...r); } return out; };

// one case through stepShells as the viewer steps it; every shell's snapshot after each of its moves
function runJS(c, over = {}){
  const st = S.createShellState('em037_04');
  const M = over.joint || c.joint, J = () => M, tgt = over.target || c.target, ow = over.owner || c.owner;
  const base = { monId: 'em037_04', joints: J, rage: false, dt: 1, hitLife: false, tired: false, tailSevered: c.sev,
                 owner: { x: ow[0], y: ow[1], z: ow[2] }, ownerPos: { x: c.ownerPos[0], y: c.ownerPos[1], z: c.ownerPos[2] },
                 action: c.force,
                 rock: { variant: c.variant, target: { x: tgt[0], y: tgt[1], z: tgt[2] }, floorY: c.floorY },
                 effectAlive: (sh, param) => !(c.kill != null && sh.creator == null && sh.moves + 1 >= c.kill) };
  // a step of another clip first, so the action's start reads last frame's joints (prevJoints) as the game's does
  S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[1]', frame: 0, action: undefined, rock: Object.assign({}, base.rock, { variant: null }) }));
  const all = [], snaps = new Map(), refused = [];
  for (let fr = 0; fr < c.steps; fr++){
    const out = S.stepShells(st, Object.assign({}, base, { list: c.list, clip: c.clip, frame: fr }));
    refused.push(...out.refused);
    for (const sh of out.spawned) all.push(sh);
    for (const sh of all){
      const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
      const last = L[L.length - 1];
      if (sh.state === 0xff || (last && last.moves === sh.moves && last.state === sh.state)) continue;
      if (!sh.moves) continue;
      const started = out.started.filter(x => x.shell === sh).map(x => x.start.key);
      L.push({ moves: sh.moves, state: sh.state, pos: sh.position.slice(), vel: sh.velocity ? sh.velocity.slice() : null,
               acc: sh.gravity ? sh.gravity.slice() : null, anchor: sh.anchor ? sh.anchor.slice() : null,
               words: sh.angles.map(w => w >>> 0), timer: sh.timer, scale: sh.unitScale, events: (sh.events || []).slice(), started });
    }
  }
  return { st, all, snaps, refused };
}
const same = (a, b) => Object.is(f(a), f(b)) || (Number.isNaN(a) && Number.isNaN(b));
const eq = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => same(x, b[i]));
const ID = { 0xca: 'shell00', 0xcb: 'shell01', 0xcc: 'shell45', 0xcd: 'shell46' };
// one JS shell against its ROM run, and its children against the run's children; returns a fault string or a move count
function compare(js, sh, R, name){
  const L = js.snaps.get(sh.id) || [];
  // the init: the ROM's request and the module's start
  const ri = R.log.filter(x => x[0] === 'start').map(x => x[2]), ji = sh.start ? [sh.start.key] : [];
  if (ri.join() !== ji.join()) return name + ' init: effect start ' + ji + ' / ROM ' + ri;
  let moves = 0;
  for (let i = 0; i < R.frames.length; i++){
    const b = R.frames[i], a = L[i];
    if (!a) return name + ' move ' + (i + 1) + ': the module made no move (ROM state ' + b.state + ')';
    if (a.moves !== b.k) return name + ' move ' + (i + 1) + ': the module\'s move ' + a.moves;
    if (a.state !== b.state) return name + ' move ' + b.k + ': state ' + a.state + ' / ROM ' + b.state;
    if (!eq(a.pos, b.pos)) return name + ' move ' + b.k + ': position ' + a.pos + ' / ROM ' + b.pos;
    if (!eq(a.words, b.ang)) return name + ' move ' + b.k + ': words ' + a.words.map(x => x.toString(16)) + ' / ROM ' + b.ang.map(x => x.toString(16));
    if (a.vel && !eq(a.vel, b.vel)) return name + ' move ' + b.k + ': velocity ' + a.vel + ' / ROM ' + b.vel;
    if (a.acc && sh.base !== 'base01' && !eq(a.acc, b.acc)) return name + ' move ' + b.k + ': acceleration ' + a.acc + ' / ROM ' + b.acc;
    if (a.anchor && sh.base !== 'base01' && !eq(a.anchor, b.anchor)) return name + ' move ' + b.k + ': anchor ' + a.anchor + ' / ROM ' + b.anchor;
    if (!same(a.timer, b.timer)) return name + ' move ' + b.k + ': timer ' + a.timer + ' / ROM ' + b.timer;
    if (sh.base === 'base45' && !same(a.scale == null ? 1.0 : a.scale, b.scale)) return name + ' move ' + b.k + ': scale ' + a.scale + ' / ROM ' + b.scale;
    // the starts / stops / creates this move
    const rs = b.log.filter(x => x[0] === 'start').map(x => 's' + x[2]).concat(b.log.filter(x => x[0] === 'stop').map(x => 'x' + x[1]),
               b.log.filter(x => x[0] === 'create').map(x => 'c' + ID[x[1]] + ':' + x[2])).sort().join();
    const js_ = a.events.filter(e => e.ev === 'start').map(e => 's' + e.start.key).concat(a.events.filter(e => e.ev === 'stop').map(e => 'x' + e.flag),
               a.events.filter(e => e.ev === 'create').map(e => 'c' + e.shell + ':' + e.mode)).sort().join();
    if (rs !== js_) return name + ' move ' + b.k + ': events ' + js_ + ' / ROM ' + rs;
    moves = b.k;
    if (b.state === 0xfe || b.state === 0xff) break;
  }
  // the children, in the order the moves made them
  const kids = js.all.filter(x => x.creator === sh.id);
  if (kids.length !== R.children.length) return name + ': ' + kids.length + ' children / ROM ' + R.children.length;
  for (let i = 0; i < kids.length; i++){
    if (kids[i].createdAtMove !== R.children[i].at) return name + ' child ' + i + ' made at move ' + kids[i].createdAtMove + ' / ROM ' + R.children[i].at;
    const r = compare(js, kids[i], R.children[i].run, name + ' > ' + kids[i].shell + ' ' + kids[i].modeIndex);
    if (typeof r === 'string') return r;
  }
  return moves;
}
function check(c, over = {}){
  const js = runJS(c, over), R = romOf(c);
  const top = js.all.filter(x => x.creator == null);
  if (top.length !== R.length) return top.length + ' shells / ROM ' + R.length + (js.refused.length ? ' (' + js.refused.map(r => r.why).join('; ') + ')' : '');
  const res = [];
  for (let i = 0; i < top.length; i++){
    const r = compare(js, top[i], R[i], top[i].shell + ' ' + top[i].modeIndex);
    if (typeof r === 'string') return r;
    res.push(top[i].shell + ' ' + top[i].modeIndex + ' ' + r + ' moves' + (R[i].children.length ? ' + ' + R[i].children.length + ' child' : ''));
  }
  return res;
}
for (const c of cases){
  const r = check(c);
  ok(Array.isArray(r), c.name + ' (' + c.list + ' ' + c.clip + ' ' + (c.variant || 'force ' + c.force) + '): every move of every shell bit for bit, to the end',
     Array.isArray(r) ? r.join('; ') : r);
}

// 2. THE CONTRACT
const P = (l, c, o) => S.pickVariantsFor('em037_04', l, c, o).join(' ');
ok(P('2', 'Motion[8]') === '7:0x28 7:0x29 7:0x2a 7:0x2b 7:0x2c 7:0x35 7:0x3a 7:0x82 7:0x84 7:0xf4', 'L2 M8: Nargacuga\'s spike picks and the rising spike', P('2', 'Motion[8]'));
ok(P('2', 'Motion[19]') === '7:0xf8 7:0x6d' && P('2', 'Motion[20]') === '7:0xf7 7:0x6d', 'L2 M19 / M20: the start-facing slash and (7, 0x6d)\'s zero words',
   P('2', 'Motion[19]') + ' | ' + P('2', 'Motion[20]'));
ok(P('2', 'Motion[21]') === '7:0x6c 7:0x70' && P('2', 'Motion[5]') === '7:0x02' && P('2', 'Motion[3]') === '7:0xf2' && P('2', 'Motion[2]') === '7:0xf3',
   'L2 M21 / M5 / M3 / M2 picks', [P('2', 'Motion[21]'), P('2', 'Motion[5]'), P('2', 'Motion[3]'), P('2', 'Motion[2]')].join(' | '));
ok(P('9', 'Motion[6]') === '7:0xea' && P('9', 'Motion[7]') === '7:0xeb', 'L9 M6 / M7: the leap (mode 13); mode 14\'s actions are unread', P('9', 'Motion[6]') + ' | ' + P('9', 'Motion[7]'));
ok(['4|Motion[2]', '4|Motion[3]', '9|Motion[10]', '9|Motion[5]'].every(k => { const [l, c] = k.split('|'); const a = S.actionFor('em037_04', l, c, false); return a && a.action[1] === (l === '4' ? 0x6e : 0xef); }),
   'L4 M2 / M3 (7, 0x6e) and L9 M10 / M5 (7, 0xef) need no pick');
{
  const c = cases.find(x => x.name === 'bladef8');
  const t = runJS(Object.assign({}, c, { steps: 120 }), {});
  const tired = (() => { const st = S.createShellState('em037_04'); let n = 0;
    for (let fr = 0; fr < 120; fr++){ const out = S.stepShells(st, { monId: 'em037_04', list: '2', clip: 'Motion[19]', frame: fr, joints: () => J1, dt: 1, tired: true,
      owner: { x: 0, y: 0x5000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, rock: { variant: '7:0xf8', target: { x: 0, y: 0, z: 1000 }, floorY: 0 } }); n += out.spawned.length; } return n; })();
  ok(t.all.length === 1 && tired === 0, 'tired (0x81614): the blade rows make nothing, no refusal', 'not tired ' + t.all.length + ', tired ' + tired);
  const st = S.createShellState('em037_04'); let why = [];
  for (let fr = 0; fr < 100; fr++) why.push(...S.stepShells(st, { monId: 'em037_04', list: '2', clip: 'Motion[3]', frame: fr, joints: () => J1, dt: 1,
    owner: { x: 0, y: 0x5000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, rock: { variant: '7:0xf2', floorY: 0 } }).refused.map(r => r.why));
  ok(why.length === 1 && /no target/.test(why[0]), 'an aimed blade without a target is refused by name', why.join(' | '));
}
ok(!S.SHELL_DATA.em037_00.shells.shell45 && !S.SHELL_DATA.em037_00.shells.shell46 && S.SHELL_DATA.em037_00.shells.shell00.id === 0xc8 &&
   S.SHELL_DATA.em037_04.shells.shell00.id === 0xca && !S.SHELL_DATA.em037_00.shells.shell01.stepped &&
   S.pickVariantsFor('em037_00', '2', 'Motion[8]').join(' ') === '7:0x28 7:0x29 7:0x2a 7:0x2b 7:0x2c 7:0x35 7:0x3a 7:0x82 7:0x84',
   'Nargacuga (em037_00) shares none of these shells: his ids 0xc8 / 0xc9, his files, his picks unchanged');

// 3. CONTROLS: the comparison is not blind
const ctl = [['bladef2aim', { target: [1487.0, -100.0, -260.0] }, 'a target 10 units off'], ['throw82', { target: [310.0, 0.0, 1500.0] }, 'a target 10 units off'], ['throw28', { joint: J2 }, 'another joint 143 matrix'],
             ['bladef7', { owner: [OW[0], OW[1] + 1, OW[2]] }, 'the owner facing one unit off'], ['rise8', { owner: [0x0400, 0x2001, 0] }, 'the owner facing one unit off']];
for (const [n, over, what] of ctl){
  const r = check(cases.find(x => x.name === n), over);
  ok(!Array.isArray(r), 'CONTROL ' + n + ' with ' + what + ' FAILS the comparison', Array.isArray(r) ? 'it passed' : r);
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
