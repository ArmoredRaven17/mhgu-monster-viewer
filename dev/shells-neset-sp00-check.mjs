// Ahtal-Neset's sp_00 (0x176, base00) and his object clocks in render/shells.js against the ROM -- dev/ahtal-neset-shells-spec.md 3D
// (shells agent, 2026-10-20).
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/neset/rkrun.py -- emu_fb.py calling his event dispatcher vt+0x480 0x10ab6c0 on a type-14 row
//      built in memory (a0 the mode, a1 the joint, a2 the Y degrees) and flying the sp_00 it makes 400 moves (base00 with his init
//      0x10c20bc and reader 0x10c20d8). Each row his table holds (seq087.txt), against the module's shell from the same row.
//   2. CONTROLS: the facing one word off, the joint moved -- must FAIL.
//   3. THE OBJECT CLOCKS (the module alone; the gate's timing is a stand-in, named): each action's shots at the frame its type-8 row set
//      the controller plus the row's f0 -- (7, 7) L2 M28 at 144 (joints 41 / 51), (1, 0) L0 M1 s40 at 110, s41 at 100 and 190.
//   4. IN THE VIEWER (pageCheck): L2 M28 makes the two sp_00 at 144.
//
//   node dev/shells-neset-sp00-check.mjs
//   node <scratchpad>/run-check.mjs dev/shells-neset-sp00-check.mjs
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
  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 40: jointOf(0.1, 0.3, 0.0, [-420.0, 380.0, 520.0]),
    41: jointOf(0.0, 0.2, 0.1, [-450.0, 410.0, 610.0]), 42: jointOf(0.05, 0.1, 0.0, [-480.0, 400.0, 700.0]),
    50: jointOf(-0.1, 0.3, 0.0, [420.0, 380.0, 520.0]), 51: jointOf(0.0, 0.2, -0.1, [450.0, 410.0, 610.0]), 52: jointOf(-0.05, 0.1, 0.0, [480.0, 400.0, 700.0]) };
  const base = { mon: 'em087_00', folders: { '374': ['em087_00', '00'], '375': ['em087_00', '01'] }, variant: 0, owner: [0, 0x3000, 0],
    ownerPos: [120.5, 15.25, -80.75], target: [900.0, 40.0, 2400.0], floorY: 0.0, ground: 0.0, size: [1, 1], base: 1.0, rank: 5, quest: 10,
    owner_bytes: { '0x73e0': [7, 7] }, joints: JOINTS, frames: 400, frameStep: 1.0 };
  // the rows (mode, joint, deg) and the play that reaches each in the module
  const ROWS = [[1, 41, 0, '2', 'Motion[28]', '7:0x07'], [1, 51, 0, '2', 'Motion[28]', '7:0x07'], [0, 41, 0, '0', 'Motion[1]', '1:0x00/s40'],
                [0, 51, 0, '0', 'Motion[1]', '1:0x00/s40'], [0, 42, 10, '0', 'Motion[1]', '1:0x00/s41'], [0, 52, -10, '0', 'Motion[1]', '1:0x00/s41'],
                [0, 40, -10, '0', 'Motion[1]', '1:0x00/s41'], [0, 50, 10, '0', 'Motion[1]', '1:0x00/s41']];
  const cases = ROWS.map(([m, j, d]) => Object.assign({}, base, { name: 's' + m + '_' + j + '_' + d, row: { type: 14, kind: 14, f0: 144.0, args: [m, j, d] },
    steps: [{ fn: '10ab6c0', rowArg: [0, 0] }] }));
  const dir = mkdtempSync(join(tmpdir(), 'sp087-'));
  writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases));
  const py = spawnSync('python', [RUN, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('rkrun.py failed'); }
  const ROM = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));
  function runJS(r, over = {}){
    const [m, j, d, list, clip, variant] = r, x = Object.assign({}, base, over);
    const st = S.createShellState('em087_00');
    let made = null, at = null;
    const snaps = [], starts = [];
    for (let i = 0; i < 700; i++){
      const frame = Math.min(i, 600);
      const out = S.stepShells(st, { monId: 'em087_00', list, clip, frame, joints: g => x.joints[g] || x.joints[0],
        rock: { variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: 0 },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: 0, size: [1, 1], baseScale: 1, hitLife: false, rank: 5, questLevel: 10 });
      for (const sh of out.spawned) if (!made && sh.shell === 'shell00' && sh.modeIndex === m && sh.k.joint === j && eq(sh.k.degY, d)){ made = sh; at = frame; if (sh.start) starts.push([sh.start.key, sh.start.requester.position.slice()]); }
      if (made && (!snaps.length || snaps[snaps.length - 1].moves !== made.moves))
        snaps.push({ moves: made.moves, state: made.state, pos: made.position.slice(), ang: made.angles.slice() });
    }
    return { made, at, snaps, starts };
  }
  function compare(R, J){
    const run = R && R.shells && R.shells[0] && R.shells[0].run;
    if (!run || !J.made) return { why: 'no shell: ROM ' + !!run + ' JS ' + !!J.made };
    const sp = run.spawn;
    if (!J.made.launch.position.every((v, i) => eq(v, sp.pos[i]))) return { why: 'init position ' + JSON.stringify(J.made.launch.position) + ' vs ROM ' + JSON.stringify(sp.pos) };
    if (!J.made.launch.velocity.every((v, i) => eq(v, sp.vel[i]))) return { why: 'init velocity ' + JSON.stringify(J.made.launch.velocity) + ' vs ROM ' + JSON.stringify(sp.vel) };
    if (!J.made.launch.angles.every((v, i) => (v & 0xffff) === (sp.ang[i] & 0xffff))) return { why: 'init words ' + JSON.stringify(J.made.launch.angles) + ' vs ROM ' + JSON.stringify(sp.ang) };
    if (!eq(J.made.launch.timer, sp.timer)) return { why: 'flight ' + J.made.launch.timer + ' vs ROM ' + sp.timer };
    for (const fr of run.frames){
      const s = J.snaps.find(x => x.moves === fr.k);
      if (!s){ if (fr.state >= 0xfe) break; return { why: 'no JS move ' + fr.k }; }
      if (s.state !== fr.state) return { why: 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state };
      if (fr.state >= 0xfe) break;
      if (!s.pos.every((v, i) => eq(v, fr.pos[i]))) return { why: 'move ' + fr.k + ' pos ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos) };
    }
    const rs = run.log.concat(...run.frames.map(x => x.log)).filter(e => e[0] === 'start');
    if (rs.length !== J.starts.length || (rs[0] && (rs[0][2] !== J.starts[0][0] || !rs[0][3].every((v, i) => eq(v, J.starts[0][1][i])))))
      return { why: 'starts ' + JSON.stringify(J.starts) + ' vs ROM ' + JSON.stringify(rs.map(e => [e[2], e[3]])) };
    return { why: null, n: run.frames.findIndex(x => x.state >= 0xfe) };
  }
  const JSR = new Map();
  for (let i = 0; i < ROWS.length; i++){
    const J = runJS(ROWS[i]); JSR.set(cases[i].name, J);
    const { why, n } = compare(ROM[cases[i].name], J);
    ok(!why, cases[i].name + ': sp_00 mode ' + ROWS[i][0] + ' at joint ' + ROWS[i][1] + ', Y ' + ROWS[i][2] + ' deg (' + ROWS[i][5] + ' f' + J.at + '), ' +
       (n || 0) + ' moves equal to the ROM, u 90 at its start', why || '');
  }
  // ---- 2. CONTROLS ----------------------------------------------------------------------------------------------------------------
  {
    const c0 = cases[0];
    const w1 = compare(ROM[c0.name], runJS(ROWS[0], { owner: [0, 0x3001, 0] })).why;
    ok(!!w1, 'CONTROL ' + c0.name + ' with the facing one word off fails', w1 || 'it matched');
    const w2 = compare(ROM[c0.name], runJS(ROWS[0], { joints: Object.assign({}, JOINTS, { 41: jointOf(0.0, 0.2, 0.1, [-420.0, 410.0, 610.0]) }) })).why;
    ok(!!w2, 'CONTROL ' + c0.name + ' with joint 41 moved 30 fails', w2 || 'it matched');
  }
  // ---- 3. THE OBJECT CLOCKS (stand-in timing) -------------------------------------------------------------------------------------
  // (the module makes a frame-f crossing on the step whose frame is f + 1 -- every kind-1 row of his does: (7, 4)'s f204 sp_01 at 205)
  const at = n => JSR.get(n).at - 1;
  ok(at('s1_41_0') === 144 && at('s1_51_0') === 144, '(7, 7) L2 M28: objects 0..5 set at its start, object 1 at 144 -> joints 41 / 51 at f144',
     [at('s1_41_0'), at('s1_51_0')]);
  ok(at('s0_41_0') === 110 && at('s0_51_0') === 110, '(1, 0) L0 M1 s40: objects 1 / 4 set at f20, 90 later -> f110', [at('s0_41_0'), at('s0_51_0')]);
  ok(at('s0_42_10') === 100 && at('s0_52_-10') === 100 && at('s0_40_-10') === 190 && at('s0_50_10') === 190,
     '(1, 0) L0 M1 s41: objects 0 / 5 set at f10 -> f100; objects 2 / 3 at f100 -> f190',
     [at('s0_42_10'), at('s0_52_-10'), at('s0_40_-10'), at('s0_50_10')]);
  console.log(`\n${pass} passed, ${fail} failed`);
  return fail ? 1 : 0;
}
if (MAIN) process.exit(await nodeMain());

// ---- 4. IN THE VIEWER ----
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Neset sp_00: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em087_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  check(await until(() => body() && body().monsterId === MON && body().schedule), 'the runtime is up');
  const seen = new Map();
  if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === 'Motion[28]');
  check(!!o, 'L2 Motion[28] is in the menu');
  clipSel.value = o.value; await clipSel.onchange();
  for (let i = 0; i < 220; i++){
    await frames(1);
    const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
    for (const s of (st ? st.shells : [])) if (s.shell === 'shell00' && !seen.has(s)) seen.set(s, { mode: s.modeIndex, joint: s.k && s.k.joint, req: !!s.request });
  }
  const w = [...seen.values()];
  check(w.length === 2 && w.every(x => x.mode === 1 && x.req) && w.map(x => x.joint).sort().join() === '41,51', 'L2 M28: two sp_00 mode 1 at joints 41 / 51, u 90 requested', w);
  return out;
}
