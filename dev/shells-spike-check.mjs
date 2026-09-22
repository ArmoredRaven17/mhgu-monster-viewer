// Nargacuga's tail spikes in render/shells.js -- em037_00 shell00 = uShellEm037_sp_00 : uShellEmBase00 -- against the ROM.
//
//   1. THE ROM'S REFERENCE FLIGHTS: C:\MHGU-Extract\efx\agents\narga-shell-scratch\narga-spike-reference.json (env
//      NARGA_REF overrides), made by nrefs.py on the Unicorn harness nharness.py: the ROM's own spawner 0xe48fc8, sp_00
//      ctor 0xe59014, init 0xe594d4 (-> base00 0x3f8b80, reader 0xe59050) and move 0x3f96a0 every frame (landing
//      0xe59334 -> 0xe593d8, 0x3f8970; end 0x3f9ef4); hooked there only the rShell getters (the .arc's values), the
//      hit setup, the create 0x48b884 (logged), the stage query 0x183490 (a plane at floorY) and the effect start /
//      stop (logged). 8 scenarios, 30 spikes. Each scenario runs through stepShells as the viewer steps it: L2
//      Motion[8] one frame per step, input.rock.variant = the action ('7:0x28' ...), the joint 143 matrix of the
//      scenario; the spikes spawn when the motion passes 46.0. Every spike's setup words, reader params, spawn state,
//      flight effect start, every move to its end (state, position, velocity, anchor, angle words, timer) and every
//      event (floor contact, shell01 drop, landing effect start, graceful stop) is compared bit for bit (float32
//      hex), and its canonical text against the reference's text and sha256.
//   2. shell01: the spike drops against the ROM's shell01 runs (position, angles, the refused start); mode 1's data.
//   3. The module's contract: the spawn step and the joints it reads, pickVariantsFor / variantActionFor (and Savage's
//      rock names unchanged), the inputs that are not read, what schedule.js reads, the ending, a clip change.
//   4. CONTROLS: deliberately wrong inputs (facing, joint, action, floor, target, owner X) and a corrupted text must
//      FAIL the comparison -- so a PASS above is not a blind one.
//   5. --rom [n] [seed]: n random scenarios (default 60) run on the ROM harness itself (python + unicorn; env
//      NARGA_SCRATCH overrides its folder) and through stepShells, every spike's canonical text compared line by line:
//      every action of the table (forced), random joint matrices with scale, owner words past 16 and 24 bits, random
//      targets and floors (float32 values; -1e9 = none).
//
//   node dev/shells-spike-check.mjs [--rom [n] [seed]] [--print <scenario> <mode>]
//
// Exit code 1 when anything fails.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createShellState, stepShells, pickVariantsFor, variantActionFor, rockActionFor, ROCK_VARIANTS, SHELL_DATA }
  from '../docs/render/shells.js';

const REF = process.env.NARGA_REF || String.raw`C:\MHGU-Extract\efx\agents\narga-shell-scratch\narga-spike-reference.json`;
const ref = JSON.parse(readFileSync(REF, 'utf8'));

const f = Math.fround;
const DV = new DataView(new ArrayBuffer(4));
const bits = x => { DV.setFloat32(0, x, true); return DV.getUint32(0, true); };
const hx = x => bits(x).toString(16).padStart(8, '0');
const w8 = x => (x >>> 0).toString(16).padStart(8, '0');
const v3 = v => v.map(hx).join(',');
const a3 = v => v.map(w8).join(',');
const sameF = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => bits(x) === bits(b[i]));
const sameW = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => (x >>> 0) === (b[i] >>> 0));
const sha = s => createHash('sha256').update(s).digest('hex');

let pass = 0, fail = 0;
function check(name, ok, detail){
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  -- ' + detail : ''));
}

// ---- a scenario through stepShells, as the viewer steps it ------------------------------------------------------------
const actionName = a => '7:0x' + a[1].toString(16);
function run(sc, opts = {}){
  const st = createShellState('em037_00');
  const M = (opts.matrix || sc.inputs.joint143).map(f);
  const T = opts.target !== undefined ? opts.target : sc.inputs.target;
  const floor = opts.floor !== undefined ? opts.floor : sc.inputs.floorY;
  const owner = opts.owner || sc.inputs.owner;
  const variant = opts.variant !== undefined ? opts.variant : actionName(sc.action);
  const maxEnd = sc.spikes.length ? Math.max(...sc.spikes.map(s => s.end_move)) : 400;
  const steps = opts.steps || (47 + maxEnd + 2);
  const rec = { spawnStep: null, spikes: [], outs: [], refused: [], created: [] };
  for (let step = 0; step < steps; step++){
    const joints = opts.joints ? opts.joints(step) : (gid => (gid === 143 || gid === 0) ? M : null);
    const input = { monId: 'em037_00', list: '2', clip: opts.clipAt ? opts.clipAt(step) : (opts.clip || 'Motion[8]'), frame: step,
                    joints, rage: false,
                    rock: opts.rock !== undefined ? opts.rock(step)
                                                  : { variant, target: T ? { x: T[0], y: T[1], z: T[2] } : null, floorY: floor },
                    owner: { x: owner.x, y: owner.y, z: owner.z } };
    if (opts.action) input.action = opts.action;
    if (opts.effectAlive) input.effectAlive = (S, p, h) => opts.effectAlive(step, S, p, h);
    const out = stepShells(st, input);
    rec.outs.push(out);
    for (const r of out.refused) rec.refused.push(Object.assign({ step }, r));
    for (const c of out.created) rec.created.push({ step, shell: c.shell, create: c.create });
    for (const S of out.spawned){
      if (rec.spawnStep == null) rec.spawnStep = step;
      const L = S.launch, r = { S, spawnStep: step, moves: [], lines: [], endMove: null, endStep: null, removedStep: null };
      r.lines.push(`spawn mode=${S.modeIndex} setup=${a3(L.setup)} pos=${v3(L.position)} vel=${v3(L.velocity)} anchor=${v3(L.anchor)} ang=${a3(L.angles)} timer=${hx(L.timer)}`);
      if (S.start) r.lines.push(`  start list=${S.start.listId} key=${S.start.key} at=${v3(S.start.requester.position)}`);
      rec.spikes.push(r);
    }
    for (const r of rec.spikes){
      const S = r.S;
      if (out.removed.includes(S) && r.removedStep == null) r.removedStep = step;
      if (r.endMove == null && S.moves > r.moves.length){
        r.moves.push({ k: S.moves, step, state: S.state, position: S.position.slice(), velocity: S.velocity.slice(),
                       anchor: S.anchor.slice(), angles: S.angles.slice(), timer: S.timer, events: S.events.slice(),
                       started: out.started.filter(e => e.shell === S).map(e => e.start) });
        r.lines.push(`m${S.moves} st=${S.state.toString(16).padStart(2, '0')} pos=${v3(S.position)} vel=${v3(S.velocity)} anchor=${v3(S.anchor)} ang=${a3(S.angles)} timer=${hx(S.timer)}`);
        for (const e of S.events){
          if (e.ev === 'hit') r.lines.push(`  hit at=${v3(e.point)}`);
          else if (e.ev === 'create') r.lines.push(`  shell01 id=${e.id.toString(16)} mode=${e.mode} at=${v3(e.position)} ang=${a3(e.angles)}`);
          else if (e.ev === 'start') r.lines.push(`  start list=${e.start.listId} key=${e.start.key} at=${v3(e.start.requester.position)}`);
          else if (e.ev === 'refused') r.lines.push('  refused');
          else if (e.ev === 'stop') r.lines.push(`  stop flag=${e.flag}`);
        }
        if (S.state !== 1){ r.endMove = S.moves; r.endStep = step; }
      }
    }
  }
  for (const r of rec.spikes) r.text = r.lines.join('\n') + '\n';
  return rec;
}

// ---- the comparison of one spike with the ROM's -----------------------------------------------------------------------
// returns { setup, params, spawn, start, moves, events, text }: each '' when identical, else the first difference
function compareSpike(s, r){
  const S = r && r.S, L = S && S.launch, res = {};
  if (!S){ for (const k of ['setup', 'params', 'spawn', 'start', 'moves', 'events', 'text']) res[k] = 'no such spike'; return res; }
  res.setup = sameW(L.setup, s.setup.angles) && s.setup.id === S.globalId && s.setup.mode === S.modeIndex ? ''
            : `setup ${a3(L.setup)} id ${S.globalId} vs ROM ${a3(s.setup.angles)} id ${s.setup.id}`;
  const P = s.params, k = S.k;
  const pf = [['x_deg15ec', k.xDeg], ['y_deg15f0', k.yDeg], ['speed15f4', k.vz], ['vy15f8', k.vy], ['flight15fc', k.flight],
              ['xmin1600', k.xLo], ['xmax1604', k.xHi]].filter(([n, v]) => bits(v) !== bits(P[n])).map(([n]) => n);
  res.params = (k.flags === P.flags15e8 && k.joint === P.joint && !pf.length) ? ''
             : `flags 0x${k.flags.toString(16)} vs 0x${P.flags15e8.toString(16)}, joint ${k.joint} vs ${P.joint}, floats ${pf.join(' ')}`;
  const sp = s.spawn, bad = [];
  if (!sameF(L.position, sp.pos)) bad.push(`pos ${v3(L.position)} vs ${v3(sp.pos)}`);
  if (!sameF(L.velocity, sp.vel)) bad.push(`vel ${v3(L.velocity)} vs ${v3(sp.vel)}`);
  if (!sameF(L.gravity, sp.acc)) bad.push(`acc ${v3(L.gravity)} vs ${v3(sp.acc)}`);
  if (!sameF(L.anchor, sp.anchor)) bad.push(`anchor ${v3(L.anchor)} vs ${v3(sp.anchor)}`);
  if (!sameW(L.angles, sp.angles)) bad.push(`angles ${a3(L.angles)} vs ${a3(sp.angles)}`);
  if (bits(L.timer) !== bits(sp.timer)) bad.push(`timer ${L.timer} vs ${sp.timer}`);
  if (L.target && !sameF(L.target, sp.target1640)) bad.push(`target ${v3(L.target)} vs +0x1640 ${v3(sp.target1640)}`);
  res.spawn = bad.join('; ');
  const e0 = s.events_init[0], st = S.start;
  res.start = (s.events_init.length === 1 && !!st && st.listId === e0.list && st.key === e0.key && st.pel === 'em037_00u' &&
               st.list === 'u' && sameF(st.requester.position, e0.at)) ? ''
            : `start ${st ? `${st.pel} ${st.key} at ${v3(st.requester.position)}` : 'none'} vs ROM ${JSON.stringify(s.events_init)}`;
  // every move
  res.moves = '';
  if (r.moves.length !== s.moves.length) res.moves = `${r.moves.length} moves vs ROM ${s.moves.length}`;
  for (let i = 0; i < Math.min(r.moves.length, s.moves.length) && !res.moves; i++){
    const a = r.moves[i], b = s.moves[i], d = [];
    if (a.k !== b.k) d.push(`k ${a.k} vs ${b.k}`);
    if (a.state !== b.state) d.push(`state ${a.state} vs ${b.state}`);
    if (!sameF(a.position, b.pos)) d.push(`pos ${v3(a.position)} vs ${v3(b.pos)}`);
    if (!sameF(a.velocity, b.vel)) d.push(`vel ${v3(a.velocity)} vs ${v3(b.vel)}`);
    if (!sameF(a.anchor, b.anchor)) d.push(`anchor ${v3(a.anchor)} vs ${v3(b.anchor)}`);
    if (!sameW(a.angles, b.angles)) d.push(`angles ${a3(a.angles)} vs ${a3(b.angles)}`);
    if (bits(a.timer) !== bits(b.timer)) d.push(`timer ${a.timer} vs ${b.timer}`);
    if (d.length) res.moves = `move ${b.k}: ${d.join('; ')}`;
  }
  // every event, in ROM order
  res.events = '';
  for (let i = 0; i < Math.min(r.moves.length, s.moves.length) && !res.events; i++){
    const got = r.moves[i].events.filter(e => e.ev !== 'refused'), want = s.moves[i].events, d = [];
    if (got.length !== want.length) d.push(`${got.map(e => e.ev).join(',') || 'none'} vs ROM ${want.map(e => e.ev).join(',') || 'none'}`);
    else want.forEach((w, j) => {
      const g = got[j];
      if (w.ev === 'hit'){ if (!(g.ev === 'hit' && sameF(g.point, w.at) && g.type === w.type)) d.push(`hit ${g.ev} ${g.point && v3(g.point)} vs ${v3(w.at)}`); }
      else if (w.ev === 'spawn_shell01'){
        if (!(g.ev === 'create' && g.shell === 'shell01' && g.id === w.id && g.mode === w.mode && sameF(g.position, w.pos) && sameW(g.angles, w.angles30)))
          d.push(`shell01 ${g.ev} ${g.id} ${g.mode} ${g.position && v3(g.position)} ${g.angles && a3(g.angles)} vs ${w.id} ${w.mode} ${v3(w.pos)} ${a3(w.angles30)}`);
      } else if (w.ev === 'start'){
        const q = g.start;
        if (!(g.ev === 'start' && q && q.listId === w.list && q.key === w.key && q.pel === 'em037_00u' && sameF(q.requester.position, w.at)))
          d.push(`start ${g.ev} ${q && q.key} vs ${w.key} at ${v3(w.at)}`);
      } else if (w.ev === 'stop'){ if (!(g.ev === 'stop' && g.flag === w.flag && g.key === 0)) d.push(`stop ${g.ev} flag ${g.flag} vs ${w.flag}`); }
      else d.push('unknown ROM event ' + w.ev);
    });
    if (d.length) res.events = `move ${s.moves[i].k}: ${d.join('; ')}`;
  }
  const a = r.text.split('\n'), b = s.canonical.split('\n'), j = a.findIndex((x, i) => x !== b[i]);
  res.text = (r.text === s.canonical && sha(r.text) === s.sha256) ? ''
           : `line ${j + 1}:\n     js  ${a[j]}\n     rom ${b[j]}`;
  return res;
}
const identical = (sc, rec) => sc.spikes.every((s, i) => Object.values(compareSpike(s, rec.spikes[i])).every(v => v === '')) &&
                               rec.spikes.length === sc.spikes.length;

// ---- 1. the reference flights ---------------------------------------------------------------------------------------
console.log(`== 1. the ROM's reference flights (${REF})`);
const runs = {};
let spikes = 0, moves = 0;
for (const sc of ref.scenarios){
  const rec = runs[sc.name] = run(sc);
  const want = sc.spikes.map(s => s.mode), got = rec.spikes.map(r => r.S.modeIndex);
  const act = variantActionFor('em037_00', '2', 'Motion[8]', actionName(sc.action));
  check(`${sc.name} (7, 0x${sc.action[1].toString(16)}) = 0xe48fc8(e, ${sc.spawner.xIdx}, ${sc.spawner.kind}): modes ${want.join(' ')} in the ROM's order, all spawned in one step`,
        !!act && act.spawnArgs[0] === sc.spawner.xIdx && act.spawnArgs[1] === sc.spawner.kind &&
        want.length === got.length && want.every((m, i) => m === got[i]) && rec.spikes.every(r => r.spawnStep === rec.spawnStep),
        `js modes ${got.join(' ')}, spawner args ${act && act.spawnArgs.join(', ')}`);
  sc.spikes.forEach((s, i) => {
    const r = rec.spikes[i], c = compareSpike(s, r), tag = `${sc.name} mode ${s.mode}`;
    spikes++; moves += s.moves.length;
    check(`${tag}: setup words ${a3(s.setup.angles)} (spawner)`, c.setup === '', c.setup);
    check(`${tag}: reader params (flags 0x${s.params.flags15e8.toString(16)}, joint ${s.params.joint}, floats)`, c.params === '', c.params);
    check(`${tag}: spawn position, velocity, gravity, anchor, angle words, timer (init)`, c.spawn === '', c.spawn);
    check(`${tag}: the flying spike u 0 (em037_00u) started at the launch point`, c.start === '', c.start);
    check(`${tag}: ${s.moves.length} moves identical (state, position, velocity, anchor, angle words, timer)`, c.moves === '', c.moves);
    check(`${tag}: events (${s.moves[s.moves.length - 1].events.map(e => e.ev).join(', ')}) at move ${s.end_move}`, c.events === '', c.events);
    check(`${tag}: canonical text = the ROM's (sha256 ${s.sha256.slice(0, 16)}...)`, c.text === '', c.text);
  });
}
console.log(`   (${spikes} spikes, ${moves} moves compared)`);
const pr = process.argv.indexOf('--print');
if (pr > 0){
  const rec = runs[process.argv[pr + 1]], m = Number(process.argv[pr + 2]);
  const r = rec && rec.spikes.find(x => x.S.modeIndex === m);
  if (r) process.stdout.write(r.text);
}

// ---- 2. shell01 --------------------------------------------------------------------------------------------------------
console.log('== 2. shell01 (uShellEm037_sp_01, id 0xc9)');
{
  const drops = runs.N1.created;
  const refs = ref.shell01.runs.filter(x => x.mode === 0);
  refs.forEach((o, i) => {
    const m = Number(/mode (\d+)\)/.exec(o.from)[1]);
    const spike = runs.N1.spikes.find(r => r.S.modeIndex === m);
    const d = drops.find(x => x.shell === (spike && spike.S));
    const c = d && d.create, e0 = o.events_init[0];
    check(`${o.name}: the drop's setup (id 0xc9, mode 0, the contact, the spike's angle words) and its init's refused start (999, -1)`,
          !!c && c.id === o.setup.id && c.mode === o.setup.mode && sameF(c.position, o.setup.pos) && sameW(c.angles, o.setup.angles30) &&
          sameF(c.position, o.pos) && sameW(c.angles, o.angles) && c.refused === true && c.start === null &&
          !!e0 && e0.ev === 'refused' && e0.list === 999 && e0.key === -1 && sameF(e0.at, c.position),
          c ? `at ${v3(c.position)} ang ${a3(c.angles)}, refused ${c.refused}` : 'no drop');
  });
  check('a drop only at a floor contact (type 1): one per N1 spike, none in N7 (no floor)',
        drops.length === 3 && runs.N7.created.length === 0, `${drops.length} / ${runs.N7.created.length}`);
  const D1 = SHELL_DATA.em037_00.shells.shell01;
  for (const o of ref.shell01.runs.filter(x => x.mode === 1 && x.events_init.length)){
    const e0 = o.events_init[0], p = D1.modes[1].ef[0], L = D1.lists[p[0]];
    check(`${o.name}: mode 1's EffectParam 0 = the ROM's start (c.pel em037_00c, key 30) -- data only, mode 1 is not built`,
          e0.ev === 'start' && p[0] === e0.list && p[1] === e0.key && L.list === 'c' && L.pel === 'em037_00c' && /em037_00c/.test(e0.list_name),
          `${L.list} ${L.pel} ${p[1]}`);
  }
}

// ---- 3. the module's contract --------------------------------------------------------------------------------------------
console.log('== 3. spawn step, joints, variants, inputs not read, schedule fields, ending');
const N = Object.fromEntries(ref.scenarios.map(sc => [sc.name, sc]));
check('every scenario spawns at step 47 (Motion[8] passed 46.0: F[k-2] = 45 < 46 <= F[k-1] = 46), first move in that step',
      Object.values(runs).every(r => r.spawnStep === 47 && r.spikes.every(x => x.moves[0].step === 47)));
{
  // the init reads joint 143 as built for the pose BEFORE the one shown: a joint that moves with the frame
  const I = N.N1.inputs.joint143;
  const moving = step => gid => (gid === 143 || gid === 0) ? I.map((x, i) => i === 14 ? f(300 + step) : f(x)) : null;
  const r = run(N.N1, { joints: moving, steps: 50 });
  const p = r.spikes[0] && r.spikes[0].S.launch.point;
  check('the init reads joint 143 of pose 46 (spawn step 47): mode 0 launches at z = 300 + 46 + 50', !!p && p[2] === f(300 + 46 + 50), p && `z ${p[2]}`);
}
{
  const want = ['7:0x28', '7:0x29', '7:0x2a', '7:0x2b', '7:0x2c', '7:0x35', '7:0x3a', '7:0x82', '7:0x84'];
  const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  check('pickVariantsFor(em037_00, 2, Motion[8]) = the issued spike actions, in order', eq(pickVariantsFor('em037_00', '2', 'Motion[8]'), want),
        pickVariantsFor('em037_00', '2', 'Motion[8]').join(' '));
  check('pickVariantsFor takes a _start / _loop name; Motion[7] (the wind-up) and other lists have none',
        eq(pickVariantsFor('em037_00', '2', 'Motion[8]_loop'), want) && pickVariantsFor('em037_00', '2', 'Motion[7]').length === 0 &&
        pickVariantsFor('em037_00', '0', 'Motion[8]').length === 0);
  check('pickVariantsFor(em043_05, 2, Motion[24] / Motion[23]) = ROCK_VARIANTS; the breath clips have none',
        eq(pickVariantsFor('em043_05', '2', 'Motion[24]'), ROCK_VARIANTS) && eq(pickVariantsFor('em043_05', '2', 'Motion[23]'), ROCK_VARIANTS) &&
        pickVariantsFor('em043_05', '2', 'Motion[25]').length === 0 && pickVariantsFor('em043_05', '2', 'Motion[41]').length === 0,
        pickVariantsFor('em043_05', '2', 'Motion[24]').join(' '));
  check('Savage unchanged: ROCK_VARIANTS, and rockActionFor = variantActionFor for every rock variant on both clips',
        eq(ROCK_VARIANTS, ['shell00_0', 'shell00_8', 'shell54_0']) &&
        ['Motion[23]', 'Motion[24]'].every(c => ROCK_VARIANTS.every(v => { const a = rockActionFor('em043_05', '2', c, v); return !!a && a === variantActionFor('em043_05', '2', c, v); })));
  const acts = SHELL_DATA.em037_00.actions, K = SHELL_DATA.em037_00.spawner.kinds;
  check('every spike action: modes = the spawner\'s modes for its kind (0xe49044), frame 46.0 on L2 Motion[8]',
        acts.every(a => a.modes.join() === K[a.spawnArgs[1]].join() && a.frame === 46.0 && a.list === '2' && a.clip === 'Motion[8]'));
  check('the unread actions are not pickable (variantActionFor null)', acts.filter(a => a.pick === 'unread').every(a => !a.variant) &&
        variantActionFor('em037_00', '2', 'Motion[8]', 'shell00_0') === null);
}
{
  const sc = N.N1;
  const none = (rock, owner) => run(sc, { steps: 60, rock: () => rock, owner });
  const t = { x: 0, y: 0, z: 1000 };
  const r1 = none({ variant: null, target: t, floorY: 0 });
  check('no variant: no spike, nothing refused', r1.spikes.length === 0 && r1.refused.length === 0);
  const r2 = none({ variant: 'shell00_0', target: t, floorY: 0 });
  check('a Savage variant on Nargacuga: nothing', r2.spikes.length === 0 && r2.refused.length === 0);
  const r3 = none({ variant: '7:0x28', target: t });
  check('no floor: refused', r3.spikes.length === 0 && r3.refused.length === 1 && /floor/.test(r3.refused[0].why), r3.refused[0] && r3.refused[0].why);
  const r4 = none({ variant: '7:0x28', target: t, floorY: 0 }, { x: 0, z: 0 });
  check('no owner facing: refused', r4.spikes.length === 0 && r4.refused.length === 1 && /facing/.test(r4.refused[0].why), r4.refused[0] && r4.refused[0].why);
  const r5 = none({ variant: '7:0x82', target: null, floorY: 0 });
  check('an aimed action (7, 0x82) without a target: refused', r5.spikes.length === 0 && r5.refused.length === 1 && /target/.test(r5.refused[0].why) &&
        r5.refused[0].modes.join() === '9,10,11', r5.refused[0] && r5.refused[0].why);
  const r6 = run(sc, { target: null });
  check('(7, 0x28) without a target: the same flights (mode 0\'s aim is clamped to [0, 0]; modes 1 / 2 do not aim)',
        r6.spikes.length === 3 && r6.spikes.every((r, i) => r.text === runs.N1.spikes[i].text));
  const r7 = none(null);
  check('no input.rock: nothing', r7.spikes.length === 0 && r7.refused.length === 0);
  // a forced action nothing read issues: (7, 0x83) = 0xe55030(e, 0) -> 0xe48fc8(e, 0, 3)
  const r8 = run(N.N5, { variant: null, action: [7, 0x83], steps: 60 });
  const ok8 = r8.spikes.map(r => r.S.modeIndex).join() === '16,17,18' &&
              r8.spikes.every(r => { const x = r.S.launch.angles[0] & 0xffff; return x >= 0x71c && x <= 0x2000; });
  check('forced (7, 0x83): kind 3, modes 16 17 18, pitch within [10, 45] degrees', ok8,
        r8.spikes.map(r => `m${r.S.modeIndex} X 0x${r.S.launch.angles[0].toString(16)}`).join(', '));
  const r9 = run(sc, { clip: 'Motion[7]', steps: 120 });
  check('the wind-up clip (L2 Motion[7]) spawns nothing', r9.spikes.length === 0 && r9.refused.length === 0);
}
{
  // what render/rom/effect/schedule.js reads (stepShells): sh.start (pel / key / requester), sh.position / sh.angles
  // (the parent), sh.place (null: never placed), out.started (the landing effect, sh.effect2), out.ended's sh.stop
  const r = runs.N1, s0 = r.spikes[0], S = s0.S, st = S.start;
  check('spawned: start = u.pel em037_00u key 0, requester at the launch point, parent shell, scale 1, no rotation override',
        st.pel === 'em037_00u' && st.list === 'u' && st.key === 0 && st.requester.parent === 'shell' && st.requester.rotationDeg === null &&
        st.requester.scale.every(x => x === 1) && sameF(st.requester.position, S.launch.position) && st.requester.flags14 === 0x40000000);
  check('alive: never placed (place null), position and angle words kept every move', r.outs.every(o => o.alive.every(x => x.place === null && !!x.position && !!x.angles)));
  const land = s0.moves[s0.moves.length - 1], ls = land.started[0], hit = land.events.find(e => e.ev === 'hit');
  check('landing: out.started has u 1 (em037_00_002) at the contact for the spike; effect2 holds it; out.created has the drop',
        !!ls && ls.pel === 'em037_00u' && ls.key === 1 && ls.kind === 'landing' && ls.param === 2 && sameF(ls.requester.position, hit.point) &&
        S.effect2 && S.effect2.key === 1 && r.outs[s0.endStep].created.some(c => c.shell === S));
  const endOut = r.outs[s0.endStep];
  check('ended: out.ended has the spike with stop = { param 0, key 0 } (0x329c40(h, 0))',
        endOut.ended.includes(S) && S.stop && S.stop.param === 0 && S.stop.key === 0);
  // the ending: waits for its effects, at most 1800 steps (0x3f986c)
  const e1 = run(N.N1, { steps: 47 + 10 + 1800 + 3 });
  const a = e1.spikes[0];
  check('ending: effects alive -> removed 1800 steps after the end', a.removedStep === a.endStep + 1800, `end ${a.endStep}, removed ${a.removedStep}`);
  let endAt = null;
  const e2 = run(N.N1, { steps: 70, effectAlive: (step, x) => { if (x.modeIndex === 0 && x.state === 0xfe && endAt == null) endAt = step; return !(x.modeIndex === 0 && endAt != null); } });
  check('ending: both handles gone -> removed on the next step', e2.spikes[0].removedStep === e2.spikes[0].endStep + 1,
        `end ${e2.spikes[0].endStep}, removed ${e2.spikes[0].removedStep}`);
  // base00 reads no motion: a clip change after the spawn changes nothing
  const c = run(N.N2, { clipAt: step => step <= 60 ? 'Motion[8]' : 'Motion[1]' });
  check('a clip change during the flight changes nothing', c.spikes.length === 3 && c.spikes.every((x, i) => x.text === runs.N2.spikes[i].text));
}
{
  // the viewer's effect data names the records the spikes request (docs/effects/em037_00.json, the Effects Agent's):
  // information only -- not counted
  try {
    const J = JSON.parse(readFileSync(new URL('../docs/effects/em037_00.json', import.meta.url), 'utf8'));
    const have = new Set((J.effects || []).filter(e => e.when === 'shell' && e.record).map(e => e.record.pel + '|' + e.record.key));
    const need = ['em037_00u|0', 'em037_00u|1', 'em037_00u|2', 'em037_00u|3'];
    console.log(`INFO docs/effects/em037_00.json 'shell' records: ${need.map(k => k + (have.has(k) ? ' yes' : ' MISSING')).join(', ')}`);
  } catch (e) { console.log('INFO docs/effects/em037_00.json not read: ' + e.message); }
}

// ---- 4. controls ----------------------------------------------------------------------------------------------------------
console.log('== 4. controls: a deliberately wrong input must FAIL the comparison');
function control(name, sc, opts){
  const rec = run(sc, opts);
  const same = identical(sc, rec);
  check(`control ${name}: detected`, !same, same ? 'NOT detected -- the comparison is blind here' : '');
}
{
  const up = (m, i, n = 1) => { const x = m.slice(); DV.setFloat32(0, x[i], true); DV.setUint32(0, DV.getUint32(0, true) + n, true); x[i] = DV.getFloat32(0, true); return x; };
  control('owner facing + 1 (N2, Y 0x3001)', N.N2, { owner: { x: 0, y: 0x3001, z: 0 } });
  control('joint 143 row 3 x one ulp off (N1)', N.N1, { matrix: up(N.N1.inputs.joint143, 12) });
  // the rotation: the launch offset (0, 0, 50) reads the joint's z axis (m8, m9, m10) only -- 50 * m8 can round a
  // one-ulp change away, so 8 ulps
  control('joint 143 m8 (z axis, x) 8 ulps off (N8, rotated)', N.N8, { matrix: up(N.N8.inputs.joint143, 8, 8) });
  control('the wrong action (N1 thrown as 7:0x29)', N.N1, { variant: '7:0x29' });
  control('floor 0.5 higher (N1)', N.N1, { floor: 0.5 });
  control('target 1 unit off (N4, aimed)', N.N4, { target: [301, 0, 1500] });
  control('owner X word + 1 (N8)', N.N8, { owner: { x: 0xff01, y: 0x2000, z: 0x800 } });
  control('owner Z word + 1 (N8)', N.N8, { owner: { x: 0xff00, y: 0x2000, z: 0x801 } });
  // the comparator itself: one hex digit of one move flipped in the JS text
  const r = run(N.N1), s = N.N1.spikes[0], x = r.spikes[0];
  x.text = x.text.replace(/^(m5 st=01 pos=)(.)/m, (m0, a, b) => a + (b === '0' ? '1' : '0'));
  check('control a corrupted text (N1 mode 0, move 5): detected', compareSpike(s, x).text !== '');
}

// ---- 5. --rom: random scenarios on the ROM harness ----------------------------------------------------------------------
const ROM_PY = String.raw`
import sys, os, json, struct
sys.path.insert(0, os.environ.get('NARGA_SCRATCH', r'C:\MHGU-Extract\efx\agents\narga-shell-scratch'))
import nharness as H
hx = lambda x: '%08x' % struct.unpack('<I', struct.pack('<f', x))[0]
v3 = lambda v: ','.join(hx(x) for x in v)
a3 = lambda v: ','.join('%08x' % (x & 0xffffffff) for x in v)
f = lambda x: struct.unpack('<f', struct.pack('<f', x))[0]
out = {}
for sc in json.load(sys.stdin):
    H.owner_setup(sc['oX'], sc['oY'], sc['oZ'], [f(x) for x in sc['T']])
    texts = []
    for s in H.spawn_setups(sc['xIdx'], sc['kind']):
        r = H.fly(s, [f(x) for x in sc['M']], sc['floor'], 420)
        sp = r['spawn']
        L = ['spawn mode=%d setup=%s pos=%s vel=%s anchor=%s ang=%s timer=%s' % (s['mode'], a3(s['ang']), v3(sp['pos']), v3(sp['vel']), v3(sp['anchor']), a3(sp['ang']), hx(sp['timer']))]
        req = None
        for e in r['log_init']:
            if e[0] == 'request': req = e[1]
            elif e[0] == 'start': L.append('  start list=%d key=%d at=%s' % (e[1], e[2], v3(req)))
            elif e[0] == 'start refused': L.append('  refused')
        for fr in r['frames']:
            L.append('m%d st=%02x pos=%s vel=%s anchor=%s ang=%s timer=%s' % (fr['k'], fr['state'], v3(fr['pos']), v3(fr['vel']), v3(fr['anchor']), a3(fr['ang']), hx(fr['timer'])))
            ci = 0
            req = None
            for e in fr['log']:
                if e[0] == 'hit': L.append('  hit at=%s' % v3(e[1]))
                elif e[0] == 'create':
                    c = fr['created'][ci]; ci += 1
                    w = struct.unpack('<16I', c)
                    L.append('  shell01 id=%x mode=%d at=%s ang=%s' % (w[1], w[2], v3(struct.unpack('<3f', c[0x10:0x1c])), a3(w[12:15])))
                elif e[0] == 'request': req = e[1]
                elif e[0] == 'start': L.append('  start list=%d key=%d at=%s' % (e[1], e[2], v3(req)))
                elif e[0] == 'start refused': L.append('  refused')
                elif e[0] == 'stop': L.append('  stop flag=%d' % e[2])
            if fr['state'] != 1: break
        texts.append('\n'.join(L) + '\n')
    out[sc['name']] = texts
print(json.dumps(out))
`;
const ri = process.argv.indexOf('--rom');
if (ri > 0){
  const n = Number(process.argv[ri + 1]) || 60, seed = Number(process.argv[ri + 2]) || 1;
  console.log(`== 5. ${n} random scenarios (seed ${seed}) on the ROM harness, every spike's canonical text line by line`);
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const uni = (a, b) => a + (b - a) * rnd(), pick = L => L[Math.floor(rnd() * L.length)], int = (a, b) => a + Math.floor(rnd() * (b - a));
  const matrix = () => {        // rows = axes (row-vector convention), any orthonormal basis times a scale, then row 3
    const yw = uni(-3.2, 3.2), pt = uni(-1.5, 1.5), rl = uni(-3.2, 3.2), sc = pick([1.0, 1.0, uni(0.5, 2.0)]);
    const cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt), cr = Math.cos(rl), sr = Math.sin(rl);
    const R = [[cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr], [-cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr], [sy * cp, -sp, cy * cp]];
    const m = [];
    for (const r of R) m.push(...r.map(c => f(c * sc)), 0);
    m.push(f(uni(-800, 800)), f(uni(50, 1400)), f(uni(-800, 800)), 1);
    return m;
  };
  const acts = SHELL_DATA.em037_00.actions, list = [];
  for (let i = 0; i < n; i++){
    const a = acts[i < acts.length ? i : int(0, acts.length)];      // every action at least once
    list.push({ name: 'R' + i, action: a.action, xIdx: a.spawnArgs[0], kind: a.spawnArgs[1], M: matrix(),
                oX: pick([0, 0, int(0, 0x10000), 0x1f000 + int(0, 0x1000)]), oY: pick([0, int(0, 0x10000), int(0, 0x1000000)]),
                oZ: pick([0, 0, int(0, 0x10000)]), T: [f(uni(-2500, 2500)), f(uni(-300, 1500)), f(uni(-2500, 2500))],
                floor: pick([0, f(uni(-400, 600)), -1e9]) });
  }
  const dir = mkdtempSync(join(tmpdir(), 'shells-spike-'));
  const py = join(dir, 'romspikes.py');
  writeFileSync(py, ROM_PY);
  const r = spawnSync('python', [py], { input: JSON.stringify(list), encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) check('the ROM harness runs', false, (r.stderr || String(r.error)).slice(-800));
  else {
    const rom = JSON.parse(r.stdout);
    let nSpikes = 0, nMoves = 0;
    for (const c of list){
      const sc = { name: c.name, action: c.action, spikes: [],
                   inputs: { joint143: c.M, owner: { x: c.oX, y: c.oY, z: c.oZ }, target: c.T, floorY: c.floor } };
      const rec = run(sc, { variant: null, action: c.action, steps: 47 + 401 + 2 });
      const want = rom[c.name] || [], got = rec.spikes.map(x => x.text);
      let detail = '';
      if (want.length !== got.length) detail = `${got.length} spikes vs ROM ${want.length}`;
      else for (let i = 0; i < want.length && !detail; i++){
        if (want[i] === got[i]) continue;
        const a = got[i].split('\n'), b = want[i].split('\n'), j = a.findIndex((x, k) => x !== b[k]);
        detail = `spike ${i}, line ${j + 1}:\n     js  ${a[j]}\n     rom ${b[j]}`;
      }
      nSpikes += want.length;
      nMoves += got.reduce((t, x) => t + (x.match(/^m\d+ /gm) || []).length, 0);
      check(`${c.name} (7, 0x${c.action[1].toString(16)}) kind ${c.kind} xIdx ${c.xIdx}, owner (0x${c.oX.toString(16)}, 0x${c.oY.toString(16)}, 0x${c.oZ.toString(16)}), floor ${c.floor}: ${want.length} spikes identical to the ROM`,
            !detail, detail);
    }
    console.log(`   (${nSpikes} spikes, ${nMoves} moves compared)`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
