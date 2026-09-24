// Khezu's shells in render/shells.js (em003_00) against his own files and against the ROM running its own code.
//
//   1. THE FILES: SHELL_DATA.em003_00 against the values read from his .arc, as the reference JSON carries them
//      (C:\MHGU-Extract\efx\agents\khezu-shell-scratch\kref.py; env KHEZU_SHELL_REF overrides): the five shells'
//      global ids, classes and folders, and every mode's ShellParam FUP and EffectParams, bit for bit.
//   2. THE ACTIONS: which numbers the command table issues, what each one's index makes, and the frame it makes it
//      at -- the entries the viewer picks by name (pick 'ai'), and the two the table must not offer.
//   3. THE BOLTS, step for step: for every lightning action, the shells stepShells makes on L2 Motion[3] and their
//      position / velocity / angle words / timer on each of the next 40 frames, against the same run in the ROM
//      (kharness.run_shell: the shell's own ctor, init and move, with the rShell getters answered from the .arc).
//   4. THE RECORDS his lightning requests, and the inputs it reads.
//   5. CONTROLS: deliberately wrong inputs must FAIL.
//
//   node dev/shells-khezu-check.mjs
//
// Exit code 1 when anything fails.
import { readFileSync } from 'node:fs';
import { createShellState, stepShells, SHELL_DATA, actionFor, variantActionFor, pickVariantsFor } from '../docs/render/shells.js';

const REF = process.env.KHEZU_SHELL_REF || String.raw`C:\MHGU-Extract\efx\agents\khezu-shell-scratch\khezu-shell-reference.json`;
const ref = JSON.parse(readFileSync(REF, 'utf8'));
const J = ref.meta.joint, FLOOR = ref.meta.floor;

const f = Math.fround;
const DV = new DataView(new ArrayBuffer(4));
const bits = x => { DV.setFloat32(0, x, true); return DV.getUint32(0, true); };
const sameF = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => bits(f(x)) === bits(f(b[i])));
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
let pass = 0, fail = 0;
function check(name, ok, detail){
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  -- ' + detail : ''));
}
const fmt = v => '(' + v.map(x => +x.toFixed(4)).join(', ') + ')';

// ---- 1. the files ------------------------------------------------------------------------------------------------
console.log(`== 1. SHELL_DATA.em003_00 against his own .arc (${REF})`);
const D = SHELL_DATA.em003_00;
{
  const want = ref.meta.ids, got = Object.fromEntries(Object.entries(D.shells).map(([k, v]) => [k, v.id]));
  check('the block carries his five shells with the ids vtable slot 86 (0xd20544) writes at +0xcac4..+0xcad4',
        JSON.stringify(got) === JSON.stringify(want),
        Object.entries(got).map(([k, v]) => `${k} ${'0x' + v.toString(16)}`).join(' '));
  const cls = ref.meta.classes;
  check('each one is the class the table 0x175c3e8 names, over the base its vtable +0x13c / +0x24 point at',
        Object.entries(cls).every(([k, [name, base]]) => D.shells[k] && D.shells[k].cls === name && D.shells[k].base === base),
        Object.entries(D.shells).map(([k, v]) => `${k} ${v.cls}/${v.base}`).join(' '));
  check('the five folders are his own',
        Object.entries(D.shells).every(([k, v]) => v.folder === `shell\\em\\em003_00_shell${k.slice(5)}`));
  check("the monster's effect list is em003_00u, and shell01 alone also names the c.pel (its .shl EffectLists)",
        D.lists[0].pel === 'em003_00u' && !D.lists[1] && D.shells.shell01.lists[0].pel === 'em003_00u' &&
        D.shells.shell01.lists[1].pel === 'em003_00c' &&
        ['shell00', 'shell03', 'shell05', 'shell13'].every(k => !D.shells[k].lists));
  for (const [fo, name] of [['00', 'shell00'], ['01', 'shell01'], ['03', 'shell03'], ['05', 'shell05'], ['13', 'shell13']]){
    const w = ref.files[fo].modes, g = D.shells[name].modes, bad = [];
    for (const m of Object.keys(w)){
      const a = g[m], b = w[m];
      if (!a){ bad.push(`mode ${m} missing`); continue; }
      if (!sameF(a.sh.floats, b.sh.floats) || !eq(a.sh.ints, b.sh.ints) ||
          a.sh.vecs.length !== b.sh.vecs.length || !a.sh.vecs.every((v, i) => sameF(v, b.sh.vecs[i])) ||
          JSON.stringify(a.ef) !== JSON.stringify(b.ef) || a.scale !== 1.0) bad.push(`mode ${m}`);
    }
    check(`${name}: all ${Object.keys(w).length} modes of the .arc (sh ints / floats / vecs, ef, ShellScale 1.0)`,
          bad.length === 0 && Object.keys(g).length === Object.keys(w).length, bad.join('; '));
  }
  check('no .shl names a ShellCmnParam, so no shell carries one', Object.values(D.shells).every(v => !v.cmn));
}

// ---- 2. the actions ----------------------------------------------------------------------------------------------
console.log('== 2. the lightning actions his command table issues');
{
  const A = D.actions.filter(a => a.shell === 'shell03');
  check('six numbers reach the handler 0xd16e08, each with its own index (0xd1c94c -> the case bodies)',
        A.length === 6 && A.every(a => a.code === 0xd16e08 && a.spawner === 0xd16e08) &&
        eq(A.map(a => a.action[1]), [0x05, 0x0e, 0x35, 0x46, 0x47, 0x4d]) &&
        eq(A.map(a => a.args[0]), [0, 4, 1, 2, 3, 5]),
        A.map(a => `(7, ${'0x' + a.action[1].toString(16)}) index ${a.args[0]}`).join(', '));
  check('every one plays L2 Motion[3] and tests 176.0',
        A.every(a => a.list === '2' && a.clip === 'Motion[3]' && a.frame === 176.0 && a.shell === 'shell03'));
  const want = { 0x0e: [12, 13, 14], 0x35: [], 0x46: [20], 0x47: [6, 7, 8], 0x4d: [15, 16, 17], 0x05: [0, 1, 2] };
  check('each index makes the modes the ROM makes for it (0xd16f30 and the blocks it reaches)',
        A.every(a => eq(a.modes, want[a.action[1]])),
        A.map(a => `${'0x' + a.action[1].toString(16)}: [${a.modes.join(',')}]`).join('  '));
  check("the five the streams issue are the viewer's to name, in the table's order; (7, 0x05) is not among them",
        eq(pickVariantsFor('em003_00', '2', 'Motion[3]'), ['7:0x0e', '7:0x35', '7:0x46', '7:0x47', '7:0x4d']),
        pickVariantsFor('em003_00', '2', 'Motion[3]').join(', '));
  check('the clip alone picks no action (which number the AI issues is not read)',
        actionFor('em003_00', '2', 'Motion[3]', false) === null && actionFor('em003_00', '2', 'Motion[3]', true) === null);
  check('a named variant resolves to its own entry, and an unknown name to none',
        variantActionFor('em003_00', '2', 'Motion[3]', '7:0x47').action[1] === 0x47 &&
        variantActionFor('em003_00', '2', 'Motion[3]', '7:0x05') === null &&
        variantActionFor('em003_00', '2', 'Motion[3]', '7:0x99') === null);
}

// ---- 3. the bolts, step for step --------------------------------------------------------------------------------
console.log('== 3. every bolt against the ROM, step for step');
function play(variant, steps){
  const st = createShellState('em003_00');
  const made = [], stepsOf = new Map();
  for (let k = 0; k < steps; k++){
    const out = stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[3]', frame: k, joints: () => J,
                                 rock: { variant, target: { x: 0, y: 0, z: 2000 }, floorY: FLOOR }, owner: { x: 0, y: 0 } });
    for (const S of out.spawned){ made.push(S); stepsOf.set(S.id, []); }
    for (const S of made) if (S.state !== 0xff) stepsOf.get(S.id).push({ state: S.state, pos: S.position.slice(), vel: S.velocity.slice(), ang: S.angles.slice(), timer: S.timer });
  }
  return { made, stepsOf, refused: [] };
}
{
  const byMode = new Map(ref.shell03_runs.map(r => [r.mode, r]));
  for (const variant of ['7:0x47', '7:0x0e', '7:0x4d', '7:0x46']){
    const num = Number(variant.split(':')[1]);
    const a = D.actions.find(x => x.action[1] === num);
    const r = play(variant, 177 + ref.meta.frames);
    check(`${variant}: the ${a.modes.length === 1 ? 'bolt' : a.modes.length + ' bolts'} it makes ${a.modes.length === 1 ? 'is mode' : 'are modes'} ${a.modes.join(', ')}, at frame 176`,
          eq(r.made.map(S => S.modeIndex), a.modes) && r.made.every(S => S.spawnFrame === 176.0),
          r.made.map(S => 'mode ' + S.modeIndex).join(', '));
    for (const S of r.made){
      const want = byMode.get(S.modeIndex);
      const got = r.stepsOf.get(S.id);
      let bad = null;
      for (let i = 0; i < want.steps.length && i < got.length; i++){
        const w = want.steps[i], g = got[i];
        if (!sameF(g.pos, w.pos) || !sameF(g.vel, w.vel) || !eq(g.ang.map(x => x >>> 0), w.ang.map(x => x >>> 0)) ||
            bits(f(g.timer)) !== bits(f(w.timer))){
          bad = `step ${i + 1}: pos ${fmt(g.pos)} vs ${fmt(w.pos)}, vel ${fmt(g.vel)} vs ${fmt(w.vel)}, ` +
                `ang ${g.ang.join('/')} vs ${w.ang.join('/')}, timer ${g.timer} vs ${w.timer}`;
          break;
        }
      }
      check(`   mode ${S.modeIndex}: ${Math.min(want.steps.length, got.length)} moves match the ROM's, float for float`,
            bad === null && got.length >= want.steps.length, bad || `${got.length} steps here, ${want.steps.length} recorded`);
    }
  }
}
{
  // mode 20 is the one bolt that takes the other ground path (0x3fdfcc -> 0x3fe074): its two probes and its wall
  // query cost it nothing on a plane, so it must come out with the same numbers as the centre bolt of a triple
  const centre = play('7:0x4d', 220), twenty = play('7:0x46', 220);
  const cs = centre.stepsOf.get(centre.made[1].id), ts = twenty.stepsOf.get(twenty.made[0].id);
  check('mode 20 runs the other ground path and lands on the same numbers as a centre bolt (both fan 0, speed 40)',
        cs.length >= 40 && ts.length >= 40 && cs.slice(0, 40).every((c, i) =>
          JSON.stringify(c.pos) === JSON.stringify(ts[i].pos) && JSON.stringify(c.vel) === JSON.stringify(ts[i].vel)),
        fmt(ts[0].pos) + ' vs ' + fmt(cs[0].pos));
  const r35 = play('7:0x35', 200);
  check('(7, 0x35) makes nothing at all -- its index has no bolts in the ROM either', r35.made.length === 0);
  const st = createShellState('em003_00');
  let spawned = 0;
  for (let k = 0; k < 200; k++){
    const out = stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[3]', frame: k, joints: () => J,
                                 rock: { variant: null, target: { x: 0, y: 0, z: 2000 }, floorY: FLOOR }, owner: { x: 0, y: 0 } });
    spawned += out.spawned.length;
  }
  check('with no variant named, the clip makes nothing (the AI’s pick is not read)', spawned === 0);
}

// ---- 4. the records ----------------------------------------------------------------------------------------------
console.log('== 4. the records his lightning requests');
{
  const keys = new Set();
  for (const a of D.actions.filter(x => x.shell === 'shell03')) for (const m of a.modes){
    const md = D.shells.shell03.modes[m];
    if (md) for (const [lid, key] of md.ef) if (lid !== 999 && key >= 0) keys.add((D.lists[lid] || {}).pel + '|' + key);
  }
  check('every bolt of every index asks for one record, u 0 of em003_00u (em003_00_005)',
        eq([...keys], ['em003_00u|0']), [...keys].join(', '));
  const r = play('7:0x47', 180);
  check('each bolt starts it once, on itself, at its own point',
        r.made.every(S => S.start && S.start.list === 'u' && S.start.key === 0 && S.start.requester.parent === 'shell'),
        r.made.map(S => `${S.modeIndex}: ${S.start && S.start.pel} ${S.start && S.start.key}`).join(', '));
}

// ---- 5. controls -------------------------------------------------------------------------------------------------
console.log('== 5. controls: wrong inputs must fail');
{
  const base = play('7:0x47', 180).made[0];
  const one = opts => {
    const st = createShellState('em003_00');
    const made = [], refused = [];
    for (let k = 0; k < 180; k++){
      const out = stepShells(st, Object.assign({ monId: 'em003_00', list: '2', clip: 'Motion[3]', frame: k,
        joints: () => J, rock: { variant: '7:0x47', target: { x: 0, y: 0, z: 2000 }, floorY: FLOOR }, owner: { x: 0, y: 0 } }, opts));
      made.push(...out.spawned); refused.push(...out.refused);
    }
    return { made, refused };
  };
  const noFloor = one({ rock: { variant: '7:0x47', target: { x: 0, y: 0, z: 2000 }, floorY: null } });
  check('control no floor: nothing is made, and the refusal says so', noFloor.made.length === 0 && noFloor.refused.length > 0,
        (noFloor.refused[0] || {}).why);
  const noOwner = one({ owner: {} });
  check('control no owner facing: nothing is made', noOwner.made.length === 0 && noOwner.refused.length > 0,
        (noOwner.refused[0] || {}).why);
  const noJoint = one({ joints: () => null });
  check('control no joint 3: the init refuses and no bolt is made', noJoint.made.length === 0);
  const turned = one({ owner: { x: 0, y: 0x4000 } });
  check('control the owner turned a quarter (Y 0x4000): every bolt leaves in another direction',
        JSON.stringify(turned.made.map(S => S.velocity)) !== JSON.stringify(play('7:0x47', 180).made.map(S => S.velocity)),
        fmt(turned.made[0].velocity) + ' vs ' + fmt(base.velocity));
  const high = one({ rock: { variant: '7:0x47', target: { x: 0, y: 0, z: 2000 }, floorY: -600.0 } });
  check('control a floor out of the init’s reach (500 below the joint): no ground, no bolt', high.made.length === 0);
}

// ---- 6. the orbs (base13) ----------------------------------------------------------------------------------------
console.log('== 6. the orb: its ring slot, its flight, and what it leaves');
const REF13 = process.env.KHEZU_BASE13_REF || String.raw`C:\MHGU-Extract\efx\agents\khezu-shell-scratch\khezu-base13-reference.json`;
const r13 = JSON.parse(readFileSync(REF13, 'utf8'));
function orb(target, rank, steps, variant = '7:0x3f'){
  const st = createShellState('em003_00');
  const made = [], stepsOf = new Map(), created = [], refused = [];
  for (let k = 0; k < steps; k++){
    const out = stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[61]', frame: k, joints: () => J,
                                 rock: { variant, target: { x: target[0], y: target[1], z: target[2] }, floorY: FLOOR },
                                 owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, rank, size: [1, 1] });
    for (const S of out.spawned){
      if (S.shell === 'shell13'){ made.push(S); stepsOf.set(S.id, []); }
      else created.push({ k, shell: S.shell, mode: S.modeIndex, pos: S.position.slice(), start: S.start && S.start.key });
    }
    for (const S of made) if (S.state !== 0xff) stepsOf.get(S.id).push({ state: S.state, pos: S.position.slice(), vel: S.velocity.slice(), ang: S.angles.slice() });
    for (const x of out.refused) refused.push(x);
  }
  return { made, stepsOf, created, refused };
}
{
  const A = D.actions.filter(a => a.shell === 'shell13');
  check('his five orb actions all reach 0xd18ee0 on L2 Motion[61] and test 114.0 (0xd1c94c and its case bodies)',
        A.length === 5 && A.every(a => a.code === 0xd18ee0 && a.spawner === 0xd18ee0 && a.list === '2' &&
                                       a.clip === 'Motion[61]' && a.frame === 114.0) &&
        eq(A.map(a => a.action[1]), [0x29, 0x3a, 0x3f, 0x42, 0x43]),
        A.map(a => '(7, 0x' + a.action[1].toString(16) + ')').join(' '));
  check('the two the streams issue are the ones the viewer can name; the chained pair and (7, 0x29) are not',
        eq(pickVariantsFor('em003_00', '2', 'Motion[61]'), ['7:0x3f', '7:0x42']),
        pickVariantsFor('em003_00', '2', 'Motion[61]').join(', '));
  let bad = 0, first = null;
  for (const row of r13.slots){
    const r = orb(row.target, row.rank, 130);
    const S = r.made[0];
    const point = S && S.launch.point;
    if (!S || S.modeIndex !== row.mode || !sameF(point, row.point) || S.spawnFrame !== 114.0){
      bad++;
      if (!first) first = 'bearing ' + row.bearing + ' rank ' + row.rank + ': mode ' + (S && S.modeIndex) + ' vs ' +
                          row.mode + ', point ' + (point ? fmt(point) : '-') + ' vs ' + fmt(row.point);
    }
  }
  check('the ring slot picks the same orb the ROM does at all ' + r13.slots.length + ' bearings of the sweep ' +
        '(six sixths of a turn, both quest ranks, each with its own point)', bad === 0, first || '');
  for (const run of r13.runs.filter(x => x.action.indexOf('(7,0x29)') === 0)){
    const r = orb(r13.meta.target, run.rank, 114 + run.frames.length + 2);
    const S = r.made[0], got = r.stepsOf.get(S.id);
    let why = null;
    for (let i = 0; i < run.frames.length && i < got.length; i++){
      const w = run.frames[i], g = got[i];
      if (!sameF(g.pos, w.pos) || !sameF(g.vel, w.vel) || g.state !== w.state){
        why = 'step ' + (i + 1) + ': pos ' + fmt(g.pos) + ' vs ' + fmt(w.pos) + ', vel ' + fmt(g.vel) + ' vs ' +
              fmt(w.vel) + ', state ' + g.state + ' vs ' + w.state;
        break;
      }
    }
    check('mode ' + run.mode + ' (quest rank ' + run.rank + '): ' + run.frames.length +
          " moves match the ROM's, float for float", why === null, why || '');
    const land = run.frames.find(x => x.log.some(l => l[0] === 'hit'));
    check('mode ' + run.mode + ": it lands on the floor at the ROM's own step and leaves a shell01 there",
          !!land && r.created.length === 1 && r.created[0].shell === 'shell01' &&
          r.created[0].mode === (run.rank > 1 ? 2 : 1) && r.created[0].k === 114 + land.k,
          r.created.map(c => c.shell + ' mode ' + c.mode + ' at k' + c.k).join(', ') + (land ? ' (ROM k' + land.k + ')' : ''));
  }
  const keys = new Set(), keysG = new Set();
  for (const m of [0, 1, 2, 3, 4, 5]) for (const [lid, key] of D.shells.shell13.modes[m].ef) keys.add(D.lists[lid].pel + '|' + key);
  for (const m of [6, 7, 8, 9, 10, 11]) for (const [lid, key] of D.shells.shell13.modes[m].ef) keysG.add(D.lists[lid].pel + '|' + key);
  check('every orb of the ring asks for one record: u 30 below quest rank 2 and u 32 above (em003_00_009 either way)',
        eq([...keys], ['em003_00u|30']) && eq([...keysG], ['em003_00u|32']), [...keys].concat([...keysG]).join(', '));
  const drive = opts => {
    const st = createShellState('em003_00'), out = [];
    for (let k = 0; k < 130; k++) out.push(stepShells(st, Object.assign({ monId: 'em003_00', list: '2',
      clip: 'Motion[61]', frame: k, joints: () => J,
      rock: { variant: '7:0x3f', target: { x: 0, y: 0, z: 2100 }, floorY: FLOOR },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, rank: 1, size: [1, 1] }, opts)));
    return out;
  };
  const noTarget = drive({ rock: { variant: '7:0x3f', target: null, floorY: FLOOR } });
  check('control no target: no orb, and the refusal says which input is missing',
        noTarget.every(o => o.spawned.length === 0) && noTarget.some(o => o.refused.length),
        (noTarget.find(o => o.refused.length) || { refused: [{}] }).refused[0].why);
  const noPos = drive({ ownerPos: null });
  check('control no owner position: no orb (base13 starts it from the monster, not from a joint)',
        noPos.every(o => o.spawned.length === 0) && noPos.some(o => o.refused.length),
        (noPos.find(o => o.refused.length) || { refused: [{}] }).refused[0].why);
  const ahead = orb([0, 0, 2100], 1, 130), sideways = orb([2100, 0, 0], 1, 130);
  check('control the target moved a quarter turn round him: another slot, another orb, from another point',
        ahead.made[0].modeIndex !== sideways.made[0].modeIndex &&
        !sameF(ahead.made[0].launch.point, sideways.made[0].launch.point),
        'mode ' + ahead.made[0].modeIndex + ' from ' + fmt(ahead.made[0].launch.point) + ' vs mode ' +
        sideways.made[0].modeIndex + ' from ' + fmt(sideways.made[0].launch.point));
}

// ---- 7. the wall, and what the bolts do at it ---------------------------------------------------------------------
console.log('== 7. the stage stand-in gains a wall: where the lightning stops');
{
  const W = ref.wall;
  const wall = { axis: W.axis === 0 ? 'x' : 'z', at: W.at, facing: W.facing, floorY: W.floorY };
  const withWall = (variant, steps, w) => {
    const st = createShellState('em003_00');
    const made = [], stepsOf = new Map();
    for (let k = 0; k < steps; k++){
      const out = stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[3]', frame: k, joints: () => J,
                                   rock: { variant, target: { x: 0, y: 0, z: 2000 }, floorY: FLOOR, wall: w },
                                   owner: { x: 0, y: 0 } });
      for (const S of out.spawned){ made.push(S); stepsOf.set(S.id, []); }
      for (const S of made) if (S.state !== 0xff) stepsOf.get(S.id).push({ state: S.state, pos: S.position.slice(), ev: S.events.map(e => e.ev) });
    }
    return { made, stepsOf };
  };
  let checked = 0, bad = null, skipped = 0;
  for (const run of ref.wall_runs){
    const num = parseInt(run.action.match(/0x([0-9a-f]+)\)/)[1], 16);
    const a = D.actions.find(x => x.action[1] === num && x.shell === 'shell03');
    if (!a || !a.variant || a.modes.indexOf(run.mode) < 0){ skipped++; continue; }
    const r = withWall(a.variant, 177 + run.steps.length + 2, wall);
    const S = r.made.find(x => x.modeIndex === run.mode), got = S && r.stepsOf.get(S.id);
    if (!S){ bad = bad || ('mode ' + run.mode + ': no bolt'); continue; }
    for (let i = 0; i < run.steps.length && i < got.length; i++){
      const w = run.steps[i], g = got[i];
      if (!sameF(g.pos, w.pos) || (w.state === 1) !== (g.state === 1)){
        bad = bad || ('mode ' + run.mode + ' step ' + (i + 1) + ': ' + fmt(g.pos) + ' vs ' + fmt(w.pos) +
                      ', alive ' + (g.state === 1) + ' vs ' + (w.state === 1));
        break;
      }
    }
    checked++;
  }
  check('with a wall across their path, every bolt the viewer can make stops where the ROM stops it -- ' + checked +
        ' runs, step for step (' + skipped + ' of the recorded runs skipped: the second wave the viewer has no phase for)',
        bad === null, bad || '');
  // the climb branch: only mode 20 takes it, and only a wall with a step over 150 reaches it
  const t20 = withWall('7:0x46', 210, wall), twenty = t20.made[0];
  const t20steps = twenty ? t20.stepsOf.get(twenty.id) : [];
  check('mode 20 reaches base03\'s second ground path and gives up at the step (0x3fe220: more than 150.0 across the wall)',
        !!twenty && twenty.state !== 1 && t20steps.some(x => x.ev.indexOf('wall') >= 0),
        twenty ? 'ended after ' + twenty.moves + ' moves at ' + fmt(twenty.position) : 'no bolt');
  const low = withWall('7:0x46', 210, { axis: 'z', at: W.at, facing: W.facing, floorY: f(FLOOR + 100.0) }).made[0];
  check('a wall with only a small step behind it does not stop it: the follow carries on (0x3fe23c)',
        !!low && low.moves > 12, low ? low.moves + ' moves, ended ' + (low.state !== 1) : 'no bolt');
  // and with no wall at all, nothing changes
  const free = withWall('7:0x47', 177 + 130, null).made;
  check('with no wall in the input the bolts run their whole life, as they did before the stand-in had one',
        free.length === 3 && free.every(S => S.moves >= 120), free.map(S => S.moves).join(', '));
  check('the wall answers only a 0x20 query and the floor only a 0x10 one: a bolt on the near side still finds ground',
        free[1].position[1] === FLOOR, String(free[1].position[1]));
}

// ---- 8. his shell01, through his own reader over base01 ------------------------------------------------------------
console.log('== 8. shell01: his reader over the base Rathian\'s shells already run');
{
  // what his reader makes of each mode (0xd218c4: bits 4 / 8 / 0x80 / 0x800 / 0x1000 from sh ints 0..4)
  const want = { 0: 0, 1: 4, 2: 4, 3: 0x1084, 4: 0x1084, 5: 0, 6: 0 };
  const got = {};
  for (const m of Object.keys(D.shells.shell01.modes)){
    const sh = D.shells.shell01.modes[m].sh, I = i => i < sh.ints.length ? sh.ints[i] : 0;
    got[m] = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x80 : 0) |
             (I(3) !== -1 ? 0x800 : 0) | (I(4) !== -1 ? 0x1000 : 0);
  }
  check('his seven shell01 modes read as flags 0 / 4 / 0x1084 -- the same base01 paths Rathian\'s 13..15 and 20 take',
        JSON.stringify(got) === JSON.stringify(want), Object.entries(got).map(([m, v]) => m + ':' + '0x' + v.toString(16)).join(' '));

  // the ground patch the action makes at his feet
  const patch = (ownerPos, variant) => {
    const st = createShellState('em003_00');
    const made = [], refused = [];
    for (let k = 0; k < 140; k++){
      const out = stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[64]', frame: k, joints: () => J,
                                   rock: { variant, target: { x: 0, y: 0, z: 2100 }, floorY: FLOOR },
                                   owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: ownerPos[0], y: ownerPos[1], z: ownerPos[2] },
                                   ground: 0.0, hitLife: true });
      made.push(...out.spawned); refused.push(...out.refused);
    }
    return { made, refused };
  };
  check('the two the streams issue on L2 Motion[64] are his to name; (7, 0x3c) is not',
        eq(pickVariantsFor('em003_00', '2', 'Motion[64]'), ['7:0x40', '7:0x4c']),
        pickVariantsFor('em003_00', '2', 'Motion[64]').join(', '));
  let bad = null;
  for (const run of ref.shell01_runs){
    const r = patch(run.ownerPos, '7:0x40');
    const S = r.made[0];
    if (!S || S.modeIndex !== run.mode || S.spawnFrame !== run.frame || !sameF(S.position, run.pos))
      bad = bad || ('owner ' + fmt(run.ownerPos) + ': ' + (S ? 'mode ' + S.modeIndex + ' at ' + fmt(S.position) : 'nothing') +
                    ' vs mode ' + run.mode + ' at ' + fmt(run.pos));
  }
  check('at 96.0 of L2 Motion[64] he leaves one shell01 mode 3 where the ROM leaves it -- at his own feet, ' +
        'wherever he stands (base01\'s flag-0x80 path, his reader\'s sh int 2)', bad === null, bad || '');
  const one = patch([100, 0, 200], '7:0x40').made[0];
  check('and it asks for his c.pel record, c 30 (cm200_040), which only shell01\'s own EffectLists name',
        !!one && !!one.start && one.start.pel === 'em003_00c' && one.start.key === 30,
        one && one.start ? one.start.pel + ' ' + one.start.key : 'nothing started');
  // the orb's child, now a real shell01 rather than a report
  const orbRun = orb(r13.meta.target, 1, 200);
  const kid = orbRun.created[0];
  check('the orb\'s landing leaves a real shell01 now -- its mode from sp_13\'s own table (0x169ba40) -- and that ' +
        'shell asks for u 31',
        !!kid && kid.shell === 'shell01' && kid.mode === 1 && !!kid.start && kid.start === 31,
        kid ? kid.shell + ' mode ' + kid.mode + ' key ' + kid.start : 'nothing');
  // controls
  const noGround = (() => {
    const st = createShellState('em003_00'), out = [];
    for (let k = 0; k < 140; k++) out.push(stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[64]', frame: k,
      joints: () => J, rock: { variant: '7:0x40', target: { x: 0, y: 0, z: 2100 } }, owner: { x: 0, y: 0, z: 0 },
      ownerPos: { x: 0, y: 0, z: 0 }, hitLife: true }));
    return out;
  })();
  check('control no ground and no floor: no patch, and the refusal names the input',
        noGround.every(o => o.spawned.length === 0) && noGround.some(o => o.refused.length),
        (noGround.find(o => o.refused.length) || { refused: [{}] }).refused[0].why);
}

// ---- 9. his drips, through his own shell00 reader over base00 -------------------------------------------------------
console.log('== 9. the drips: his shell00 reader, his clock, his landing');
{
  const play = (clip, variant, steps) => {
    const st = createShellState('em003_00');
    const made = [], stepsOf = new Map(), started = [], created = [];
    for (let k = 0; k < steps; k++){
      const out = stepShells(st, { monId: 'em003_00', list: '2', clip, frame: k, joints: () => J,
                                   rock: { variant, target: { x: 0, y: 0, z: 2100 }, floorY: FLOOR },
                                   owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: FLOOR,
                                   hitLife: true });
      for (const S of out.spawned){
        if (S.shell === 'shell00'){ made.push({ k, S }); stepsOf.set(S.id, []); }
        else created.push({ k, shell: S.shell, mode: S.modeIndex, start: S.start && S.start.key });
      }
      for (const { S } of made) if (S.state === 1) stepsOf.get(S.id).push({ pos: S.position.slice(), vel: S.velocity.slice() });
      for (const x of out.started) started.push({ k, key: x.start.key, pel: x.start.pel, kind: x.start.kind });
    }
    return { made, stepsOf, started, created };
  };
  // the clock: which frames of L2 Motion[8] drop a drip, against the ROM's own run
  const romDrip = ref.shell00_runs.find(x => x.action.indexOf('(7,0x01)') === 0);
  const r01 = play('Motion[8]', '7:0x01', 400);
  check('(7, 0x01) drops its drips on the ROM\'s own clock -- three 32 apart past 70.0, one at 264.0, then every ' +
        '40.0 -- not on a frame test', eq(r01.made.map(x => x.k - 1), romDrip.rows.map(r => r.k)),
        r01.made.map(x => x.k - 1).join(', ') + ' vs ' + romDrip.rows.map(r => r.k).join(', '));
  check('(7, 0x41) is the same handler with its other index and drops none, as in the ROM',
        play('Motion[8]', '7:0x41', 400).made.length === 0 &&
        ref.shell00_runs.find(x => x.action.indexOf('(7,0x41)') === 0).rows.length === 0);
  // the fall, step for step
  const romFall = romDrip.rows[0], first = r01.made[0];
  const got = r01.stepsOf.get(first.S.id);
  let bad = null;
  for (let i = 0; i < romFall.steps.length && i < got.length; i++){
    const w = romFall.steps[i];
    if (w.state !== 1) break;
    if (!sameF(got[i].pos, w.pos) || !sameF(got[i].vel, w.vel)){
      bad = 'step ' + (i + 1) + ': ' + fmt(got[i].pos) + ' vs ' + fmt(w.pos) + ', ' + fmt(got[i].vel) + ' vs ' + fmt(w.vel);
      break;
    }
  }
  check('a drip falls exactly as the ROM drops it: from his joint 3, at rest, under the file\'s own gravity vector',
        bad === null && got.length > 20, bad || got.length + ' moves');
  check('and it lands on the ROM\'s own move, leaving its contact record u 92 (its EffectParam 2, the floor type)',
        r01.started.length > 0 && r01.started[0].pel === 'em003_00u' && r01.started[0].key === 92 &&
        r01.started[0].k - first.k === romFall.steps.findIndex(x => x.state !== 1),
        r01.started.slice(0, 1).map(x => x.pel + ' ' + x.key + ' at move ' + (x.k - first.k)).join(''));
  // the single drip and its child
  const romOne = ref.shell00_runs.find(x => x.action.indexOf('(7,0x33)') === 0).rows[0];
  const r33 = play('Motion[75]', '7:0x33', 200);
  check('(7, 0x33) drops one mode 1 when L2 Motion[75] passes 106.0, as the ROM does',
        r33.made.length === 1 && r33.made[0].S.modeIndex === 1 && r33.made[0].k - 1 === romOne.k,
        r33.made.map(x => 'mode ' + x.S.modeIndex + ' at f' + (x.k - 1)).join(', '));
  check('its landing leaves a shell01 mode 0 -- his u 61 -- on the ROM\'s own move, and mode 1 starts no contact ' +
        'record of its own (its EffectParams 1..3 are all (999, -1))',
        r33.created.length === 1 && r33.created[0].shell === 'shell01' && r33.created[0].mode === 0 &&
        r33.created[0].start === 61 && r33.created[0].k - r33.made[0].k === romOne.steps.findIndex(x => x.state !== 1) &&
        r33.started.every(x => x.kind !== 'landing'),
        r33.created.map(c => c.shell + ' mode ' + c.mode + ' u ' + c.start + ' at move ' + (c.k - r33.made[0].k)).join(''));
  check('the records his drips ask for are u 90 while they fall and u 92 where they land; u 93 is the wall and the ' +
        'hunter (EffectParams 1 and 3), which this stage cannot answer',
        r01.made[0].S.start.key === 90 && r01.started[0].key === 92 &&
        JSON.stringify(D.shells.shell00.modes[0].ef) === JSON.stringify([[0, 90], [0, 93], [0, 92], [0, 93]]),
        'u ' + r01.made[0].S.start.key + ' then u ' + r01.started[0].key);
}

// ---- 10. his per-frame handler: the c 31 rows ------------------------------------------------------------------
console.log('== 10. the handler that runs whatever he is doing (enemy vtable +0x208)');
{
  const rowsOf = (list, clip, steps) => {
    const st = createShellState('em003_00'), made = [];
    for (let k = 0; k < steps; k++){
      const out = stepShells(st, { monId: 'em003_00', list, clip, frame: k, joints: () => J,
                                   rock: { variant: null, target: { x: 0, y: 0, z: 2100 }, floorY: FLOOR },
                                   owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: FLOOR,
                                   hitLife: true });
      for (const S of out.spawned) made.push({ k: k - 1, mode: S.modeIndex, key: S.start && S.start.key,
                                               pel: S.start && S.start.pel, pos: S.position.slice() });
    }
    return made;
  };
  const CLIPS = { '0x102': ['1', 'Motion[2]'], '0x103': ['1', 'Motion[3]'], '0x104': ['1', 'Motion[4]'],
                  '0x30b': ['3', 'Motion[11]'], '0x312': ['3', 'Motion[18]'], '0x524': ['5', 'Motion[36]'] };
  let bad = null, rows = 0;
  for (const run of ref.perframe_runs){
    const [list, clip] = CLIPS[run.motion];
    const got = rowsOf(list, clip, 300);
    if (!eq(got.map(x => x.k), run.rows.map(x => x.frame)) || !got.every(x => x.mode === 4))
      bad = bad || (run.motion + ': ' + got.map(x => x.k + ' m' + x.mode).join(', ') + ' vs ' +
                    run.rows.map(x => x.frame + ' m' + x.mode).join(', '));
    rows += run.rows.length;
  }
  check('his six per-frame motions leave a shell01 mode 4 at the ROM\'s own frames -- ' + rows + ' in all, and none ' +
        'at all for L5 Motion[36], whose case only asks and returns', bad === null, bad || '');
  const one = rowsOf('1', 'Motion[2]', 300)[0];
  check('and each of them asks for c 31 (cm200_040), from shell01\'s own second EffectList',
        !!one && one.pel === 'em003_00c' && one.key === 31, one ? one.pel + ' ' + one.key : 'nothing');
  const noGround = (() => {
    const st = createShellState('em003_00'), out = [];
    for (let k = 0; k < 20; k++) out.push(stepShells(st, { monId: 'em003_00', list: '1', clip: 'Motion[2]', frame: k,
      joints: () => J, rock: { variant: null, target: { x: 0, y: 0, z: 2100 } }, owner: { x: 0, y: 0, z: 0 },
      ownerPos: { x: 0, y: 0, z: 0 }, hitLife: true }));
    return out;
  })();
  check('control no ground: the handler makes nothing and says which input it wanted',
        noGround.every(o => o.spawned.length === 0) && noGround.some(o => o.refused.length),
        (noGround.find(o => o.refused.length) || { refused: [{}] }).refused[0].why);
}

// ---- 11. the four he leaves around himself (u 120) ----------------------------------------------------------------
console.log('== 11. (7, 0x52): four shell01 at once');
{
  const ring = (P, oY, size) => {
    const st = createShellState('em003_00'), made = [];
    for (let k = 0; k < 140; k++){
      const out = stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[37]', frame: k, joints: () => J,
                                   rock: { variant: '7:0x52', target: { x: 0, y: 0, z: 2100 }, floorY: FLOOR },
                                   owner: { x: 0, y: oY, z: 0 }, ownerPos: { x: P[0], y: P[1], z: P[2] },
                                   ground: FLOOR, hitLife: true, size: size || [1, 1] });
      for (const S of out.spawned) made.push({ k, mode: S.modeIndex, pos: S.position.slice(), ang: S.angles.slice(),
                                               key: S.start && S.start.key, pel: S.start && S.start.pel });
    }
    return made;
  };
  const a = D.actions.find(x => x.action[1] === 0x52);
  const r = ring([0, 0, 0], 0);
  check('it makes four at once -- one mode 5 and three mode 6 -- at 114.0 of L2 Motion[37]',
        r.length === 4 && eq(r.map(x => x.mode), [5, 6, 6, 6]) && r.every(x => x.k === 115) && eq(a.modes, [5, 6, 6, 6]),
        r.map(x => 'm' + x.mode).join(', '));
  check('their point is his own plus (-100, 125, 100) times his size, x and z turned by his facing -- the ROM\'s ' +
        'numbers at three owner poses', sameF(r[0].pos, [-100, 125, 100]) &&
        sameF(ring([100, 50, 200], 0)[0].pos, [0, 175, 300]) &&
        sameF(ring([100, 50, 200], 0x4000)[0].pos, [200, 175, 300]) &&
        sameF(ring([0, 0, 0], 0, [2, 1])[0].pos, [-200, 250, 200]),
        fmt(r[0].pos) + ' / ' + fmt(ring([100, 50, 200], 0x4000)[0].pos) + ' / ' + fmt(ring([0, 0, 0], 0, [2, 1])[0].pos));
  check('their angle words are his facing plus 0x1c00 and then 0x2000 apart',
        eq(r.map(x => x.ang[1] >>> 0), [0x1c00, 0x3c00, 0x5c00, 0x7c00]) &&
        eq(ring([0, 0, 0], 0x4000).map(x => x.ang[1] >>> 0), [0x5c00, 0x7c00, 0x9c00, 0xbc00]),
        r.map(x => '0x' + (x.ang[1] >>> 0).toString(16)).join(' '));
  check('only the mode 5 names a record -- u 120 (em003_00_020) -- and the three mode 6 name none at all',
        r[0].pel === 'em003_00u' && r[0].key === 120 && r.slice(1).every(x => x.key == null) &&
        JSON.stringify(D.shells.shell01.modes[6].ef) === JSON.stringify([[999, -1], [999, -1]]),
        r.map(x => x.key == null ? '-' : 'u ' + x.key).join(', '));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
