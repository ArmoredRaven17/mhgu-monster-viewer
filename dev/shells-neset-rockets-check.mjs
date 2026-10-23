// Ahtal-Neset's rockets (sp_59 0x17a, base59) in render/shells.js against the ROM -- dev/ahtal-neset-shells-spec.md 3C (shells agent,
// 2026-10-20).
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/neset/rkrun.py -- emu_fb.py (the whole executable on unicorn) calling the maker 0x10a795c(e, k)
//      for k 0..8 and flying the rocket 700 moves: base59's init and move, every state. Two sets:
//        r0..r8: no area_patrol manager (e+0x760c 0) -- 0xb3ca0's miss, his own position;
//        p0..p8: his own rAreaPatrolData built in memory as his file holds it (map 27, area 1, index 0x7f, 10 points) at e+0x760c,
//                e+0x1053 / +0x1054 = 27 / 1, his real vt+0x9c (0x6bb20), the player's area byte = his (base59's draw test).
//      The harness's stand-ins (rkrun.py): the rocket model's resource (0x152530 -> a zeroed block; setModel vt+0x58 and the release
//      answered), the quake's global (0x276e0c), the pickup object (0x664918 / 0x31a2ac: not drawn), the RNG 0 (rng0: the pick
//      only names the pickup's item).
//   2. CONTROLS: his position 30 aside, and the patrol off against the patrol run, must FAIL.
//   3. THE GATE (the module alone): the Rockets control fires one side's three at an action start; none while any is out; Off fades
//      them (20 frames); the 90 s cooldown (5400 frames) holds the next volley.
//   4. IN THE VIEWER (pageCheck): the control, a clip, the three rockets falling, landing, drawn with the model; Off fades them.
//
//   node dev/shells-neset-rockets-check.mjs                                 (1..3)
//   node <scratchpad>/run-check.mjs dev/shells-neset-rockets-check.mjs       (4)
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const MAIN = !!process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
async function nodeMain(){
  const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
  const RUN = process.env.RK_RUN ||
    'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/neset/rkrun.py';
  const f = Math.fround, eq = (a, b) => f(a) === f(b);
  let pass = 0, fail = 0;
  const ok = (c, msg, detail = '') => { if (c){ pass++; console.log('PASS ' + msg + (detail ? '  -- ' + detail : '')); } else { fail++; console.log('FAIL ' + msg + (detail ? '  -- ' + detail : '')); } };
  function jointOf(a, b, c, t){
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
    const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
    const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
    const R = mul(mul(Rz, Rx), Ry);
    return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
  }
  const J0 = jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]);
  const base = { mon: 'em087_00', folders: { '378': ['em087_00', '59'], '375': ['em087_00', '01'] }, variant: 0, owner: [0, 0x3000, 0],
    ownerPos: [120.5, 15.25, -80.75], target: [900.0, 40.0, 2400.0], floorY: 0.0, ground: 0.0, size: [1, 1], base: 1.0, rank: 5, quest: 10,
    owner_bytes: { '0x73e0': [7, 4] }, joints: { 0: J0 }, frames: 700, frameStep: 1.0, rng0: 1 };
  const cases = [];
  for (let k = 0; k < 9; k++) cases.push(Object.assign({}, base, { name: 'r' + k, steps: [{ fn: '10a795c', args: [k] }] }));
  for (let k = 0; k < 9; k++) cases.push(Object.assign({}, base, { name: 'p' + k, steps: [{ fn: '10a795c', args: [k] }], patrol: 1, ownvt: { '0x9c': '0x6bb20' } }));
  const dir = mkdtempSync(join(tmpdir(), 'rk087-'));
  writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases));
  const py = spawnSync('python', [RUN, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('rkrun.py failed'); }
  const ROM = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));

  function runJS(c, over = {}){
    const x = Object.assign({}, c, over), k = c.steps[0].args[0];
    const st = S.createShellState('em087_00');
    const snaps = [], starts = [];
    let made = null;
    for (let i = 0; i < x.frames + 5; i++){
      const out = S.stepShells(st, { monId: 'em087_00', list: '2', clip: 'Motion[3]', frame: i, joints: () => x.joints[0],
        rock: { variant: null, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: 0 },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: 0, size: [1, 1], baseScale: 1, hitLife: false, rank: 5, questLevel: 10, fire087: i === 0 ? [k] : [],
        patrol087: !!x.patrol, anchor087: false });
      for (const sh of out.spawned) if (sh.base === 'base59') made = sh;
      for (const s of out.started) if (s.shell === made) starts.push([s.start.key, s.start.requester.position.slice()]);
      if (made && (!snaps.length || snaps[snaps.length - 1].moves !== made.moves))
        snaps.push({ moves: made.moves, state: made.state, pos: made.position.slice(), ang: made.angles.slice() });
    }
    return { made, snaps, starts };
  }
  function compare(R, J){
    const run = R && R.shells && R.shells[0] && R.shells[0].run;
    if (!run || !J.made) return { why: 'no shell: ROM ' + !!run + ' JS ' + !!J.made };
    for (const fr of run.frames){
      const s = J.snaps.find(x => x.moves === fr.k);
      if (!s) return { why: 'no JS move ' + fr.k };
      if (s.state !== fr.state) return { why: 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state };
      if (!s.pos.every((v, i) => eq(v, fr.pos[i]))) return { why: 'move ' + fr.k + ' pos ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos) };
      if (!s.ang.every((v, i) => (v & 0xffff) === (fr.ang[i] & 0xffff))) return { why: 'move ' + fr.k + ' words ' + JSON.stringify(s.ang) + ' vs ROM ' + JSON.stringify(fr.ang) };
    }
    const rs = run.log.concat(...run.frames.map(x => x.log)).filter(e => e[0] === 'start');
    if (rs.length !== J.starts.length) return { why: 'starts ' + JSON.stringify(J.starts.map(x => x[0])) + ' vs ROM ' + JSON.stringify(rs.map(e => e[2])) };
    for (let i = 0; i < rs.length; i++){
      if (rs[i][2] !== J.starts[i][0]) return { why: 'start ' + i + ' key ' + J.starts[i][0] + ' vs ' + rs[i][2] };
      if (!rs[i][3].every((v, j) => eq(v, J.starts[i][1][j]))) return { why: 'start ' + i + ' point ' + JSON.stringify(J.starts[i][1]) + ' vs ' + JSON.stringify(rs[i][3]) };
    }
    const states = [...new Set(run.frames.map(x => x.state))];
    return { why: null, n: run.frames.length, states };
  }
  for (const c of cases){
    const { why, n, states } = compare(ROM[c.name], runJS(c));
    ok(!why, c.name + ': rocket ' + c.steps[0].args[0] + (c.patrol ? ' on his patrol point' : ' (no manager: his position)') + ', ' + (n || 0) +
       ' moves equal to the ROM, states ' + (states || []).join('/'), why || '');
  }
  // ---- 2. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const ctl = [['r0', { ownerPos: [150.5, 15.25, -80.75] }, 'his position 30 aside'], ['p3', { patrol: 0 }, 'the patrol off (his position instead of point 3)'],
               ['r4', { joints: { 0: jointOf(0.2, 0.0, 0.0, [148.0, 210.5, -60.25]) } }, 'joint 0 moved (nothing reads it: must still match)', true]];
  for (const [n, over, what, same] of ctl){
    const { why } = compare(ROM[n], runJS(byName(n), over));
    ok(same ? !why : !!why, 'CONTROL ' + n + ' with ' + what + (same ? ' matches' : ' fails'), why || 'it matched');
  }
  // ---- 3. THE GATE ------------------------------------------------------------------------------------------------------------------
  {
    const st = S.createShellState('em087_00');
    const J = () => J0;
    let clip = 'Motion[3]', ctlv = 1, made = [], gone = 0;
    const step = (i, frame) => {
      const out = S.stepShells(st, { monId: 'em087_00', list: '2', clip, frame, joints: J, rock: { variant: null, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
        owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: false,
        rank: 5, questLevel: 10, rockets087: ctlv, patrol087: true, anchor087: true });
      for (const sh of out.spawned) if (sh.base === 'base59') made.push(sh);
      for (const sh of out.removed) if (sh.base === 'base59') gone++;
    };
    let fr = 0;
    for (let i = 0; i < 300; i++) step(i, fr++);
    ok(made.length === 3 && made.map(s => s.slot).join() === '0,1,2' && made.every(s => s.state === 5),
       'GATE: Rockets A at an action start -- rockets 0 / 1 / 2, all landed (state 5) by 300 frames', JSON.stringify(made.map(s => [s.slot, s.state, s.position.map(Math.round)])));
    ok(made[0] && eq(made[0].position[0], f(3500 + f(120.5))) && eq(made[0].position[2], f(3800 + f(-80.75))),
       'GATE: anchored on him -- rocket 0 on (3500 + his x, 0, 3800 + his z)', made[0] && JSON.stringify(made[0].position));
    clip = 'Motion[30]'; fr = 0;
    for (let i = 0; i < 100; i++) step(i, fr++);
    ok(made.length === 3, 'GATE: a new action start with the rockets out makes none (selector 7)', 'made ' + made.length);
    ctlv = 0;
    for (let i = 0; i < 30; i++) step(i, fr++);
    ok(gone === 3, 'GATE: Off fades them -- gone within the 20-frame fade', 'gone ' + gone);
    ctlv = 2; clip = 'Motion[3]'; fr = 0;
    for (let i = 0; i < 100; i++) step(i, fr++);
    ok(made.length === 3, 'GATE: Rockets B inside the 90 s cooldown makes none', 'made ' + made.length);
    for (let i = 0; i < 5400; i++) step(i, fr++);
    clip = 'Motion[30]'; fr = 0;
    for (let i = 0; i < 50; i++) step(i, fr++);
    ok(made.length === 6 && made.slice(3).map(s => s.slot).join() === '3,4,5', 'GATE: after the cooldown, the next action start fires rockets 3 / 4 / 5',
       JSON.stringify(made.slice(3).map(s => s.slot)));
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  return fail ? 1 : 0;
}
if (MAIN) process.exit(await nodeMain());

// ---- 4. IN THE VIEWER: run by run-check.mjs, serialised with .toString() and evaluated IN THE PAGE ----
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Neset rockets: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const ctl = document.getElementById('monClassCtl');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em087_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  check(await until(() => body() && body().monsterId === MON && body().schedule), 'the runtime is up');
  check(ctl && [...ctl.options].map(o => o.textContent).join('|') === 'Off|Rockets A (0-2)|Rockets B (3-5)', 'the Rockets control is offered',
        ctl && [...ctl.options].map(o => o.textContent));
  const shells = () => { const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state; return st ? st.shells.filter(s => s.base === 'base59') : []; };
  ctl.value = '1'; ctl.onchange({ target: ctl });
  if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === 'Motion[3]') || [...clipSel.options][1];
  clipSel.value = o.value; await clipSel.onchange();
  const made = await until(() => shells().length === 3, 200);
  check(made, 'the next action start makes three rockets', shells().map(s => [s.slot, s.state]));
  const landed = await until(() => shells().length === 3 && shells().every(s => s.state === 5), 400);
  const S0 = shells();
  check(landed && S0.every(s => s.drawn && s.model && s.model.part === 'em087_00_rocket'), 'they land (state 5), drawn with the em087_00_rocket model',
        S0.map(s => [s.slot, s.state, s.drawn, s.position.map(Math.round)]));
  const P = V.state && body().parent;
  check(S0.length === 3 && S0.map(s => s.slot).join() === '0,1,2', 'side A: rockets 0 / 1 / 2', S0.map(s => s.slot));
  ctl.value = '0'; ctl.onchange({ target: ctl });
  check(await until(() => shells().length === 0, 120), 'Off fades them and they go', shells().map(s => [s.slot, s.state]));
  ctl.value = '0'; ctl.onchange({ target: ctl });
  return out;
}
