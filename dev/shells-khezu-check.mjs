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
  const A = D.actions;
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
  for (const a of D.actions) for (const m of a.modes){
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
