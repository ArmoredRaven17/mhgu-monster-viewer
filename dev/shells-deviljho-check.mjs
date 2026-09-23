// Deviljho's shells in render/shells.js (em043_00: the family's class with the variant byte 0, where Savage Deviljho
// em043_05 is variant 5) against his own files and the ROM's branches.
//
//   1. THE FILES: SHELL_DATA.em043_00 against the values read from his .arc, as the reference JSON carries them
//      (C:\MHGU-Extract\efx\agents\deviljho-shell-scratch\jref.py; env DEVILJHO_SHELL_REF overrides): every mode's sh
//      FUP and EffectParams bit for bit, and the .shl byte comparison that carries his ShellCmnParam -- his shell00 and
//      shell54 .shl are Savage's file but for the name digit inside it, so the cmn values in the block are those. The
//      fifth class the table gives him, shell01 (0xd4), is here too: its .shl is in both .arc, and no mode of it names
//      an effect, which is why the block has no entry for it.
//   2. THE BREATH: shell04 and shell55, the two shells whose data he does not share. The spawns through stepShells at
//      the frames their actions test (130.0 / 136.0 on L2 M25 / M26, 86.0 on L2 M41 / M42), his mode 0 with its own
//      beam length and u 60, against Savage's mode 1 / 2 on the same clips.
//   3. THE PICKS: his command streams never reach the enraged breath (the op-0x6f value is his enraged flag, 0 or 1,
//      never the 2 the streams switch on: 0xe80e4c), so one entry serves both states; Savage's pair is untouched. The
//      rocks take the viewer's pick as Savage's do.
//   4. THE RECORDS his shells request (docs/effects/em043_00.json) and the inputs they read.
//   5. CONTROLS: deliberately wrong inputs must FAIL.
//
// His rocks are checked in dev/shells-rock-check.mjs, which runs every reference flight from his data as well.
//
//   node dev/shells-deviljho-check.mjs
//
// Exit code 1 when anything fails.
import { readFileSync } from 'node:fs';
import { createShellState, stepShells, SHELL_DATA, actionFor, pickVariantsFor, ROCK_VARIANTS } from '../docs/render/shells.js';

const REF = process.env.DEVILJHO_SHELL_REF || String.raw`C:\MHGU-Extract\efx\agents\deviljho-shell-scratch\deviljho-shell-reference.json`;
const ref = JSON.parse(readFileSync(REF, 'utf8'));

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
console.log(`== 1. SHELL_DATA.em043_00 against his own .arc (${REF})`);
const D = SHELL_DATA.em043_00, SV = SHELL_DATA.em043_05;
{
  check('the block is there, with his ids 0xd3 / 0xd5 / 0xd6 / 0xd7 (0xe727d0, variant 0) and his own folders and u.pel',
        !!D && D.shells.shell00.id === 0xd3 && D.shells.shell04.id === 0xd5 && D.shells.shell54.id === 0xd6 && D.shells.shell55.id === 0xd7 &&
        D.lists[0].pel === 'em043_00u' && D.lists[0].list === 'u' &&
        ['shell00', 'shell04', 'shell54', 'shell55'].every(k => D.shells[k].folder === `shell\\em\\em043_00_${k}`),
        Object.entries(D.shells).map(([k, v]) => `${k} 0x${v.id.toString(16)}`).join(' '));
  check('the ids the ctor gives each variant are a pair: his 0xd3..0xd7 where Savage gets 0xd8..0xdc (0xe727f0 / 0xe72808)',
        eq(ref.ids.em043_00, [0xd3, 0xd4, 0xd5, 0xd6, 0xd7]) && eq(ref.ids.em043_05, [0xd8, 0xd9, 0xda, 0xdb, 0xdc]) &&
        D.shells.shell00.id + 5 === SV.shells.shell00.id && D.shells.shell04.id + 5 === SV.shells.shell04.id &&
        D.shells.shell54.id + 5 === SV.shells.shell54.id && D.shells.shell55.id + 5 === SV.shells.shell55.id);
  for (const [fo, name] of [['00', 'shell00'], ['04', 'shell04'], ['54', 'shell54'], ['55', 'shell55']]){
    const want = ref.files[fo].modes, got = D.shells[name].modes, bad = [];
    for (const m of Object.keys(got)){
      const w = want[m], g = got[m];
      if (!w){ bad.push(`mode ${m}: no file`); continue; }
      if (!sameF(g.sh.floats, w.sh.floats) || !eq(g.sh.ints, w.sh.ints) ||
          g.sh.vecs.length !== w.sh.vecs.length || !g.sh.vecs.every((v, i) => sameF(v, w.sh.vecs[i])) ||
          JSON.stringify(g.ef) !== JSON.stringify(w.ef) || g.scale !== 1.0) bad.push(`mode ${m}`);
    }
    check(`${name}: the ${Object.keys(got).length} modes the block carries = ${name === 'shell00' || name === 'shell54' ? `${Object.keys(want).length} in the files, those it throws` : 'the file'} (sh ints / floats / vecs, ef, scale 1.0)`,
          bad.length === 0, bad.join('; '));
  }
  // the ShellCmnParam: it lives in the .shl, and his shell00 / shell54 .shl are Savage's bytes but for the name digit
  const s00 = ref.shl['00'], s54 = ref.shl['54'];
  check(`shell00 / shell54 .shl are Savage's file but for the name digit (${s00.differing_bytes} and ${s54.differing_bytes} bytes, every one a '0' where his says '5'), so the cmn values are his brother's`,
        s00.same_length && s54.same_length && s00.only_the_name_digit && s54.only_the_name_digit &&
        JSON.stringify(D.shells.shell00.cmn) === JSON.stringify(SV.shells.shell00.cmn) &&
        JSON.stringify(D.shells.shell54.cmn) === JSON.stringify(SV.shells.shell54.cmn),
        JSON.stringify(ref.shl));
  check(`shell04 / shell55 .shl are their own (${ref.shl['04'].len} and ${ref.shl['55'].len} bytes against ${ref.shl['04'].savage_len} and ${ref.shl['55'].savage_len}): one mode each, and no cmn in the block (base04 / base55 read none)`,
        !ref.shl['04'].same_length && !ref.shl['55'].same_length && !D.shells.shell04.cmn && !D.shells.shell55.cmn &&
        Object.keys(D.shells.shell04.modes).length === 1 && Object.keys(D.shells.shell55.modes).length === 1);
  check('the rock modes his actions throw are the values Savage carries: shell00 0 / 8 and shell54 0 (the held rock 4 has his own keys)',
        ['0', '8'].every(m => JSON.stringify(D.shells.shell00.modes[m]) === JSON.stringify(SV.shells.shell00.modes[m])) &&
        JSON.stringify(D.shells.shell54.modes['0']) === JSON.stringify(SV.shells.shell54.modes['0']) &&
        JSON.stringify(D.shells.shell54.modes['4'].ef) !== JSON.stringify(SV.shells.shell54.modes['4'].ef));
  check('both .arc carry one command table (em043_00_cmdtbl.emc, the same md5), so the streams that issue these actions are the same',
        ref.cmdtbl_md5.em043_00 === ref.cmdtbl_md5.em043_05, ref.cmdtbl_md5.em043_00);
  // the fifth class, the one the block leaves out: global 0xd4 (Savage 0xd9), table 0x175c3e8 row {uShellEm043_sp_01
  // DTI 0x188c908, setup 0x18859e8, resource 0x8a27 -- Savage's 0x8a2c}. Its .shl is there; nothing in it draws.
  const s01 = ref.shell01, m01 = ref.shl['01'];
  const noKeys = v => Object.keys(s01[v]).length === 5 && Object.values(s01[v]).every(e => Array.isArray(e) && e.length === 0);
  check(`shell01 (his 0xd4 / resource 0x8a27, Savage's 0xd9 / 0x8a2c) is in both .arc -- ${m01.len} bytes, ${m01.differing_bytes} differing, every one the name digit -- with five modes and no EffectParams in any of them, so it draws nothing and the block carries no entry for it`,
        !D.shells.shell01 && !SV.shells.shell01 && m01.same_length && m01.only_the_name_digit && noKeys('em043_00') && noKeys('em043_05'),
        `modes ${Object.keys(s01.em043_00).join(', ')}; keys ${JSON.stringify(s01.em043_00)}`);
}

// ---- a clip through stepShells, as the viewer steps it -------------------------------------------------------------
const J4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 300, 400, 1].map(f);
function play(mon, clip, opts = {}){
  const st = createShellState(mon);
  const rec = { spawns: [], refused: [], S: null, moves: [] };
  for (let step = 0; step < (opts.steps || 200); step++){
    const input = { monId: mon, list: '2', clip, frame: step, joints: () => opts.joint || J4, rage: !!opts.rage,
                    rock: { variant: opts.variant || null, target: { x: 0, y: 0, z: 2000 }, floorY: opts.floor == null ? 0 : opts.floor },
                    owner: { x: 0, y: opts.oY || 0, z: 0 } };
    if (opts.action) input.action = opts.action;
    if (opts.noTarget) input.rock.target = null;
    const out = stepShells(st, input);
    for (const r of out.refused) rec.refused.push(Object.assign({ step }, r));
    for (const S of out.spawned){ rec.spawns.push({ step, S }); if (!rec.S) rec.S = S; }
    // a breath shell has no move counter of its own (stepBreath): one move per step while it is alive
    if (rec.S && rec.S.state === 1 && rec.spawns.length && step > rec.spawns[0].step)
      rec.moves.push({ k: rec.moves.length + 1, step, state: rec.S.state, position: rec.S.position.slice(),
                       anchor: rec.S.anchor.slice(), place: rec.S.place, timer: rec.S.timer });
  }
  return rec;
}

// ---- 2. the breath -------------------------------------------------------------------------------------------------
console.log('== 2. shell04 and shell55: the shells whose data he does not share');
{
  const r25 = play('em043_00', 'Motion[25]'), r26 = play('em043_00', 'Motion[26]'), r41 = play('em043_00', 'Motion[41]');
  const s25 = r25.spawns[0], s26 = r26.spawns[0], s41 = r41.spawns[0];
  check('L2 M25 (7, 0x06): shell04 mode 0 at the step showing pose 131 (its action tests 130.0), id 0xd5, starting u 60 of em043_00u',
        !!s25 && s25.step === 131 && s25.S.shell === 'shell04' && s25.S.modeIndex === 0 && s25.S.globalId === 0xd5 &&
        s25.S.start && s25.S.start.pel === 'em043_00u' && s25.S.start.key === 60 && s25.S.start.param === 0,
        s25 && `step ${s25.step} ${s25.S.shell} mode ${s25.S.modeIndex} ${s25.S.start && s25.S.start.pel} u ${s25.S.start && s25.S.start.key}`);
  check('L2 M26 (7, 0x07): the same shell at pose 137 (136.0)', !!s26 && s26.step === 137 && s26.S.shell === 'shell04' && s26.S.modeIndex === 0,
        s26 && `step ${s26.step}`);
  check('L2 M41 (7, 0x93): shell55 mode 0 at pose 87 (86.0), id 0xd7, starting u 60',
        !!s41 && s41.step === 87 && s41.S.shell === 'shell55' && s41.S.modeIndex === 0 && s41.S.globalId === 0xd7 &&
        s41.S.start && s41.S.start.key === 60, s41 && `step ${s41.step} ${s41.S.shell} mode ${s41.S.modeIndex} u ${s41.S.start && s41.S.start.key}`);
  // the beam: his 1000.0 where Savage's mode 1 is 1200.0 -- the shell's own reach, from the mode's first float
  const sv25 = play('em043_05', 'Motion[25]'), sv41 = play('em043_05', 'Motion[41]');
  const beam = (rec) => rec.moves.length ? Math.hypot(...rec.moves[rec.moves.length - 1].position.map((x, i) => x - rec.moves[rec.moves.length - 1].anchor[i])) : null;
  check('his beam is the file\'s 1000.0 and Savage\'s mode 1 is 1200.0; his shell55 1000.0 against 1700.0',
        D.shells.shell04.modes[0].sh.floats[0] === 1000.0 && SV.shells.shell04.modes[1].sh.floats[0] === 1200.0 &&
        D.shells.shell55.modes[0].sh.floats[0] === 1000.0 && SV.shells.shell55.modes[0].sh.floats[0] === 1700.0 &&
        beam(r25) < beam(sv25) && beam(r41) < beam(sv41),
        `jho ${beam(r25).toFixed(1)} / ${beam(r41).toFixed(1)}, savage ${beam(sv25).toFixed(1)} / ${beam(sv41).toFixed(1)}`);
  check('Savage\'s own breath is unchanged: L2 M25 calm is his mode 1 (u 60) and enraged his mode 2 (u 70)',
        sv25.spawns[0].S.modeIndex === 1 && sv25.spawns[0].S.start.key === 60 &&
        play('em043_05', 'Motion[25]', { rage: true }).spawns[0].S.modeIndex === 2 &&
        play('em043_05', 'Motion[25]', { rage: true }).spawns[0].S.start.key === 70);
  check('the breath is placed every move (0x329c9c / 0x329d04: the anchor and the aim in degrees), as base04 does',
        r25.moves.length > 5 && r25.moves.every(m => m.place && m.place.param === 0 && m.place.rotationDeg) &&
        r41.moves.length > 5 && r41.moves.every(m => m.place));
}

// ---- 3. the picks ----------------------------------------------------------------------------------------------------
console.log('== 3. the actions his command streams can reach');
{
  for (const [clip, act] of [['Motion[25]', 0x06], ['Motion[26]', 0x07]]){
    const calm = actionFor('em043_00', '2', clip, false), rage = actionFor('em043_00', '2', clip, true);
    check(`${clip}: (7, 0x${act.toString(16)}) whether calm or enraged (his op-0x6f value is 0 or 1, never the 2 the streams switch on: 0xe80e4c)`,
          !!calm && !!rage && calm === rage && calm.action[1] === act && calm.pick === 'always',
          `${calm && calm.action} / ${rage && rage.action}`);
    const svCalm = actionFor('em043_05', '2', clip, false), svRage = actionFor('em043_05', '2', clip, true);
    check(`${clip}: Savage still takes his own pair (calm ${svCalm && '0x' + svCalm.action[1].toString(16)}, enraged ${svRage && '0x' + svRage.action[1].toString(16)})`,
          !!svCalm && !!svRage && svCalm !== svRage && svCalm.pick === 'calm' && svRage.pick === 'rage');
  }
  check('the enraged breath actions are not his: (7, 0x31) / (7, 0x32) are in Savage\'s table and in no entry of his',
        !D.actions.some(a => a.action[0] === 7 && (a.action[1] === 0x31 || a.action[1] === 0x32)) &&
        SV.actions.some(a => a.action[1] === 0x31) && SV.actions.some(a => a.action[1] === 0x32));
  check('his rock clips list the three rocks, as Savage\'s do (the AI\'s pick is not read: input.rock.variant)',
        eq(pickVariantsFor('em043_00', '2', 'Motion[24]'), ROCK_VARIANTS) && eq(pickVariantsFor('em043_00', '2', 'Motion[23]'), ROCK_VARIANTS) &&
        eq(pickVariantsFor('em043_00', '2', 'Motion[25]'), []) && eq(pickVariantsFor('em043_00', '2', 'Motion[41]'), []));
  check('the chains are his too: (7, 0x34) on L2 M26 and (7, 0x93) / (7, 0x94) on L2 M41 / M42, all shell mode 0',
        D.actions.filter(a => a.pick === 'chain').length === 3 &&
        D.actions.filter(a => a.pick === 'chain').every(a => a.mode === 0));
  const forced = play('em043_00', 'Motion[23]', { action: [7, 0x7f], steps: 160 });
  check('the held rock is reachable only by a forced action, as Savage\'s is: (7, 0x7f) makes shell54 mode 4 at pose 109 (108.0)',
        forced.spawns.length === 1 && forced.spawns[0].S.shell === 'shell54' && forced.spawns[0].S.modeIndex === 4 && forced.spawns[0].step === 109,
        forced.spawns.map(s => `${s.step} ${s.S.shell} ${s.S.modeIndex}`).join(' '));
}

// ---- 4. the records and the inputs ------------------------------------------------------------------------------------
console.log('== 4. the records his shells request, and what they read');
{
  const keysOf = picks => {
    const out = new Set();
    for (const a of D.actions.filter(x => picks.includes(x.pick))){
      const md = D.shells[a.shell] && D.shells[a.shell].modes[a.mode];
      if (md) for (const [lid, key] of md.ef) if (lid !== 999 && key >= 0 && D.lists[lid]) out.add(D.lists[lid].pel + '|' + key);
    }
    return [...out].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  };
  const issued = keysOf(['rock', 'always', 'chain', 'calm', 'rage']), forced = keysOf(['unread']).filter(k => !issued.includes(k));
  check('the records his issued actions request are four: the flying rock (u 0), its contact (u 10), the bounce (u 20) and the breath (u 60)',
        eq(issued, ['em043_00u|0', 'em043_00u|10', 'em043_00u|20', 'em043_00u|60']), issued.join(', '));
  check('the held rock adds three no stream reaches (u 30 / 40 / 50 of shell54 mode 4, as Savage\'s mode 4 has u 40 / 50 / 100)',
        eq(forced, ['em043_00u|30', 'em043_00u|40', 'em043_00u|50']), forced.join(', '));
  const order = issued.concat(forced);
  try {
    const J = JSON.parse(readFileSync(new URL('../docs/effects/em043_00.json', import.meta.url), 'utf8'));
    const have = new Set((J.effects || []).filter(e => e.when === 'shell' && e.record).map(e => e.record.pel + '|' + e.record.key));
    console.log(`INFO docs/effects/em043_00.json 'shell' records: ${order.map(k => k + (have.has(k) ? ' yes' : ' MISSING')).join(', ')}`);
  } catch (e) { console.log(`INFO docs/effects/em043_00.json not read (${e.code || e.message}); the records his shells request: ${order.join(', ')}`); }
  // the inputs: the rocks' (the pick, the target, the floor, the owner facing); the breath reads the joint and the owner
  const noRock = play('em043_00', 'Motion[24]', { variant: null, steps: 130 });
  check('a rock clip with no pick makes nothing (which rock the AI throws is not read)', noRock.spawns.length === 0 && noRock.refused.length === 0);
  const noT = play('em043_00', 'Motion[24]', { variant: 'shell00_0', noTarget: true, steps: 130 });
  check('a rock without the target: refused (the aim reads it)', noT.spawns.length === 0 && noT.refused.length === 1 && /target/.test(noT.refused[0].why),
        JSON.stringify(noT.refused));
  const breath = play('em043_00', 'Motion[25]', { noTarget: true, steps: 140 });
  check('the breath needs no target of its own: it is made without one', breath.spawns.length === 1 && breath.spawns[0].S.shell === 'shell04');
}

// ---- 5. controls ------------------------------------------------------------------------------------------------------
console.log('== 5. controls: wrong inputs must fail');
{
  const base = play('em043_00', 'Motion[25]');
  const R4 = [0.9, 0.1, -0.35, 0, -0.05, 0.98, 0.12, 0, 0.36, -0.1, 0.92, 0, -120.5, 355.25, 610.75, 1.0].map(f);
  const other = play('em043_00', 'Motion[25]', { joint: R4 });
  check('control the joint the breath comes from (rotated and moved): the beam goes elsewhere',
        JSON.stringify(base.moves[4].position) !== JSON.stringify(other.moves[4].position),
        fmt(base.moves[4].position) + ' vs ' + fmt(other.moves[4].position));
  check('the owner\'s facing words are not what aims it (base04 takes the joint): the same beam with the owner turned',
        JSON.stringify(base.moves[4].position) === JSON.stringify(play('em043_00', 'Motion[25]', { oY: 0x2000 }).moves[4].position));
  const sav = play('em043_05', 'Motion[25]');
  check('control the monster (the same clip as Savage): a different shell mode and beam',
        sav.spawns[0].S.modeIndex !== base.spawns[0].S.modeIndex || JSON.stringify(sav.moves[4].position) !== JSON.stringify(base.moves[4].position));
  const shifted = play('em043_00', 'Motion[25]', { steps: 131 });
  check('control the clip cut one step short of the spawn: nothing is made', shifted.spawns.length === 0, `${shifted.spawns.length} spawns`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
