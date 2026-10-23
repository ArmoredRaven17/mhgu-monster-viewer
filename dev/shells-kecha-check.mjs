// Kecha Wacha's (em065_00) shells in render/shells.js against the ROM -- uEm065_00: sp_00 (0x116, the drop), sp_01 (0x117, c 31 on
// the ground and the hit volumes), sp_13 (0x118, base13: the arcing water shots) and sp_23 (0x119, a NEW base, base23: the
// straight water shots).
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em065_00.arc's shell files. The setups are the class's OWN CODE: its action main
//      0xf55740 with the action at e+0x73e0, the phase and the frame test answered (one step per shot frame); every shell flown
//      from the setup the ROM built, its children (sp_01 1 at a contact) from theirs.
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong joint, a wrong facing, a moved floor, a moved target must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; every exported shell record
//      starts and runs out with no refusal.
//
//   node dev/shells-kecha-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-kecha-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const MAIN = !!process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
async function nodeMain(){
  const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
  const EMU = process.env.FB_EMU ||
    'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/fb/emu_fb.py';
  const f = Math.fround;
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
  const J50 = jointOf(-0.3, 0.4, -0.15, [-95.25, 120.5, 140.75]);
  const J0b = jointOf(-0.6, 0.35, 0.05, [40.5, 180.25, 260.75]), J140 = jointOf(2.4, -0.2, 0.3, [-30.0, 120.5, -250.25]);
  const J150 = jointOf(0.9, -0.45, 0.25, [130.25, 240.5, -70.75]);
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F065 = { 0x116: ['em065_00', '00'], 0x117: ['em065_00', '01'], 0x118: ['em065_00', '13'], 0x119: ['em065_00', '23'] };
  const v = (st, n) => st + ':0x' + n.toString(16).padStart(2, '0');
  const C = (name, st, n, steps, seq, x = {}) => Object.assign({ name, mon: 'em065_00', n, steps, seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, owner_bytes: { '0x73e0': [st, n] },
    joints: { 0: J0, 131: J150 } }, x);
  const SHOTS = (fr, ph = 1) => fr.map(F => ({ fn: 'f55740', phase: ph, win: 0, frame: F }));
  const cases = [
    // (7, 6) L2 M78: the straight shots, sp_23 0 / 1 / 2 at 108 / 130 / 150
    C('kw_shot23', 7, 6, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 200 }]),
    C('kw_shot23_turned', 7, 6, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 200 }], { owner: [0, 0xb123, 0], target: [-700.0, 300.0, 200.0] }),
    // a target inside the near distance and one past the far: the clamps of 0x40cf9c
    C('kw_shot23_near', 7, 6, SHOTS([108]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 120 }], { target: [200.0, 40.0, 0.0] }),
    C('kw_shot23_far', 7, 6, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 160 }], { target: [6000.0, -500.0, 4000.0] }),
    // (7, 7) L2 M80 and (7, 0x3b) L2 M77: the arcing shots, sp_13 0..2 / 3..5
    C('kw_shot13', 7, 7, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[80]', variant: v(7, 7), len: 200 }]),
    C('kw_shot13b', 7, 0x3b, SHOTS([116, 136, 156]), [{ list: '2', clip: 'Motion[77]', variant: v(7, 0x3b), len: 200 }], { owner: [0, 0x4800, 0] }),
    // (7, 0x17) L2 M78: the hit volumes on joint 131 (sp_01 2, no EffectParam)
    C('kw_hit17', 7, 0x17, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 0x17), len: 200 }]),
    // (3, 7) L5 M25 f16: c 31 on the ground 300 ahead
    C('kw_ground', 3, 7, SHOTS([16]), [{ list: '5', clip: 'Motion[25]', variant: v(3, 7), len: 60 }]),
    // (7, 0x15) L2 M117 f33 (phase 6): the drop, from a raised owner (it lands)
    C('kw_drop', 7, 0x15, SHOTS([33], 6), [{ list: '2', clip: 'Motion[117]', variant: v(7, 0x15), len: 80 }], { ownerPos: [120.5, 815.25, -80.75] }),
  ];
  for (const c of cases) c.folders = F065;

  // ---- the module ---------------------------------------------------------------------------------------------------------------
  function runJS(c, over = {}){
    const x = Object.assign({}, c, over);
    const st = S.createShellState(x.mon);
    const J = gid => x.joints[gid] || x.joints[0];
    const snaps = new Map(), info = new Map(), refused = [];
    const marks = { landed: new Map(), converted: new Map(), thrown: new Map() };
    let k = 0;
    const steps = [];
    for (const q of x.seq) for (let i = 0; i <= q.len; i++) steps.push({ q, frame: i });
    const last = steps[steps.length - 1];
    for (let i = 0; i < 460; i++) steps.push({ q: last.q, frame: last.q.len });
    for (const { q, frame } of steps){
      const out = S.stepShells(st, { monId: x.mon, list: q.list, clip: q.clip, frame, joints: J,
        rock: { variant: q.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: false, rank: x.rank, questLevel: x.quest });
      for (const r of out.refused) refused.push(r);
      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });
      for (const sh of out.spawned) if (sh.creator != null && info.has(sh.creator)) info.get(sh.creator).children.push(sh.id);
      for (const sh of out.alive.concat(out.ended, out.removed)){
        const I = info.get(sh.id); if (!I) continue;
        if (sh.landed && !marks.landed.has(sh.id)) marks.landed.set(sh.id, sh.moves);
        if (sh.converted && !marks.converted.has(sh.id)) marks.converted.set(sh.id, sh.moves);
        if (sh.throw && !marks.thrown.has(sh.id)) marks.thrown.set(sh.id, sh.moves);
        const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
        if (L.length && L[L.length - 1].moves === sh.moves) continue;
        L.push({ moves: sh.moves, state: sh.state, pos: sh.position && sh.position.slice(), vel: sh.velocity && sh.velocity.slice(),
                 anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0),
                 timer: sh.base === 'base13' ? sh.lifetime : sh.base === 'base23' ? sh.life : sh.timer });
      }
      for (const { shell: sh, start } of out.started){ const I = info.get(sh.id); if (I) I.starts.push(start); }
      k++;
    }
    return { info, snaps, refused, state: st, marks };
  }
  // the ROM run's own inputs that follow the module's action frames: the conversion `after` landed moves, the throw's move
  function emuCase(c, J){
    const o = { name: c.name, mon: c.mon, folders: c.folders, variant: c.emVariant, owner: c.owner, ownerPos: c.ownerPos, target: c.target,
      floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, rank: c.rank, quest: c.quest, owner_bytes: c.owner_bytes,
      joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: 460 };
    if (c.conv){
      const top = [...J.info.values()].find(I => I.S.base === 'base24' && I.S.creator == null && J.marks.converted.has(I.S.id));
      if (top){
        const after = J.marks.converted.get(top.S.id) + 1 - top.S.landedAt;   // the frames that start landed, up to the module's
        o.convert = { id: '0x10c', fn: c.conv[0], args: c.conv[1], after };
        if (c.hold){
          const kid = J.info.get(top.children[0]);
          o.track = { 1: [0x90a, 0] }; o.ownvt54 = 1; o.pokeDepth = 1;
          if (kid && J.marks.thrown.has(kid.S.id)) o.pokes = { [J.marks.thrown.get(kid.S.id)]: { '0xcae0': [2, 0, 0, 0] } };
        }
      }
    }
    return o;
  }
  const JS = new Map(cases.map(c => [c.name, runJS(c)]));

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'kwshells-'));
  const runEmu = list => {
    writeFileSync(join(dir, 'cases.json'), JSON.stringify(list));
    const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
    if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_fb.py failed'); }
    return JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));
  };
  const ROM = runEmu(cases.map(c => emuCase(c, JS.get(c.name))));

  const eq = (a, b) => a === b || (a !== a && b !== b);
  const eqv = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => eq(f(v), f(b[i])));
  const BASE = { 0x116: 'base00', 0x117: 'base01', 0x118: 'base13', 0x119: 'base23' };
  const FULL = new Set(['base00', 'base13', 'base23']);
  function diffShell(R, I, snaps, base){
    const S0 = I.S, L = snaps.get(S0.id) || [];
    if (!R.init) return 'the ROM init deleted it, the module made it';
    const sp = R.spawn;
    if (FULL.has(base)){
      const ln = S0.launch;
      if (!eqv(ln.position || ln.point, sp.pos)) return 'init position ' + JSON.stringify(ln.position || ln.point) + ' vs ROM ' + JSON.stringify(sp.pos);
      if (!eqv(ln.velocity, sp.vel)) return 'init velocity ' + JSON.stringify(ln.velocity) + ' vs ROM ' + JSON.stringify(sp.vel);
      if (!eqv(ln.gravity || S0.gravity, sp.acc)) return 'gravity ' + JSON.stringify(ln.gravity || S0.gravity) + ' vs ' + JSON.stringify(sp.acc);
      if (!eqv((ln.angles || [0, 0, 0]).map(w => w & 0xffff), sp.ang.map(w => w & 0xffff))) return 'init words ' + JSON.stringify(ln.angles) + ' vs ROM ' + JSON.stringify(sp.ang);
      if (!eq(f(base === 'base13' ? ln.life : ln.timer), f(sp.timer))) return 'init timer ' + (base === 'base13' ? ln.life : ln.timer) + ' vs ' + sp.timer;
    }
    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);
      // (a lump the monster converts leaves state 1 between two moves -- its last move is a state-1 one; the shell itself is 0xfe now)
      if (!s){ if (fr.state >= 0xfe && ((L.length && L[L.length - 1].state >= 0xfe) || (S0.converted && S0.state >= 0xfe))) break; return 'no module move ' + fr.k + ' (ROM state ' + fr.state + ')'; }
      if (s.state !== fr.state) return 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state;
      if (fr.state === 0xff) break;
      if (!eqv(s.pos, fr.pos)) return 'move ' + fr.k + ' position ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos);
      if (FULL.has(base)){
        if (!eqv(s.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(s.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
        if (!eqv(s.anchor, fr.anchor)) return 'move ' + fr.k + ' anchor ' + JSON.stringify(s.anchor) + ' vs ROM ' + JSON.stringify(fr.anchor);
        if (!eq(f(s.timer), f(fr.timer)) && (s.state === 1 || (base === 'base13' && s.state === 2))) return 'move ' + fr.k + ' timer ' + s.timer + ' vs ' + fr.timer;
      }
      if (!eqv(s.ang.map(w => w & 0xffff), fr.ang.map(w => w & 0xffff))) return 'move ' + fr.k + ' words ' + JSON.stringify(s.ang) + ' vs ROM ' + JSON.stringify(fr.ang);
    }
    const romStarts = R.log.concat(...R.frames.map(x => x.log)).filter(e => e[0] === 'start');
    const jsStarts = (S0.start ? [S0.start] : []).concat(I.starts);
    if (romStarts.length !== jsStarts.length) return 'starts ' + jsStarts.length + ' ' + JSON.stringify(jsStarts.map(q => q.key)) + ' vs ROM ' + romStarts.length + ' ' + JSON.stringify(romStarts.map(e => e.slice(1, 3)));
    for (let i = 0; i < romStarts.length; i++){
      const r = romStarts[i], q = jsStarts[i];
      if (r[1] !== q.listId || r[2] !== q.key) return 'start ' + i + ' (' + q.listId + ', ' + q.key + ') vs ROM (' + r[1] + ', ' + r[2] + ')';
      if (!eqv(q.requester.position, r[3])) return 'start ' + i + ' point ' + JSON.stringify(q.requester.position) + ' vs ROM ' + JSON.stringify(r[3]);
    }
    return null;
  }
  function diffTree(R, I, J){
    const d = diffShell(R, I, J.snaps, BASE[I.S.globalId]);
    if (d) return { d, n: 1 };
    const kids = R.children;
    if (kids.length !== I.children.length) return { d: 'children ' + I.children.length + ' vs ROM ' + kids.length + ' ' + JSON.stringify(kids.map(k => k.id)), n: 1 };
    let n = 1;
    for (let j = 0; j < kids.length; j++){
      const K = J.info.get(I.children[j]);
      if (K.S.globalId !== kids[j].id) return { d: 'child ' + j + ' id ' + K.S.globalId + ' vs ROM ' + kids[j].id, n };
      const setupMode = parseInt(kids[j].run.setup.slice(16, 18), 16);
      if (K.S.modeIndex !== setupMode) return { d: 'child ' + j + ' mode ' + K.S.modeIndex + ' vs ROM ' + setupMode, n };
      const r = diffTree(kids[j].run, K, J);
      n += r.n;
      if (r.d) return { d: 'child ' + j + ' (' + K.S.shell + ' ' + K.S.modeIndex + '): ' + r.d, n };
    }
    return { d: null, n };
  }
  function compare(c, R, J){
    const mine = [...J.info.values()].filter(I => I.S.creator == null);
    const isLive = s => !!s.run && !!s.run.init && (s.run.spawn.state === 1 || s.run.spawn.state === 2);
    const live = R.shells.filter(isLive), dead = R.shells.length - live.length;
    if (mine.length !== live.length) return { why: 'shells ' + mine.length + ' vs ROM ' + live.length + ' (' + dead + ' dead)' + (J.refused.length ? ' (refused ' + JSON.stringify(J.refused[0]) + ')' : '') };
    let n = 0;
    for (let i = 0; i < live.length; i++){
      const r = live[i], I = mine[i];
      if (I.S.globalId !== r.id || I.S.modeIndex !== r.mode) return { why: 'shell ' + i + ' id/mode ' + I.S.globalId + '/' + I.S.modeIndex + ' vs ROM ' + r.id + '/' + r.mode };
      const t = diffTree(r.run, I, J);
      n += t.n;
      if (t.d) return { why: 'shell ' + i + ' (' + I.S.shell + ' ' + I.S.modeIndex + '): ' + t.d };
    }
    return { why: null, n };
  }
  const count = R => R.shells.reduce((a, s) => a + (s.run ? 1 + (function k(x){ return x.children.reduce((b, c) => b + 1 + k(c.run), 0); })(s.run) : 0), 0);
  const movesOf = R => R.shells.reduce((a, s) => a + (s.run ? (function m(x){ return x.frames.length + x.children.reduce((b, c) => b + m(c.run), 0); })(s.run) : 0), 0);
  for (const c of cases){
    const R = ROM[c.name], J = JS.get(c.name);
    const { why } = compare(c, R, J);
    ok(!why && R.shells.length > 0, c.name + ': ' + R.shells.length + ' shell(s), ' + count(R) + ' with their children, ' + movesOf(R) + ' moves equal to the ROM', why || '');
  }
  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em065_00', '2', 'Motion[78]') === '["7:0x06","7:0x17"]', 'L2 M78 picks the shots and their hit-only twin', pv('em065_00', '2', 'Motion[78]'));
  ok(pv('em065_00', '2', 'Motion[117]') === '["7:0x15","7:0x16"]', 'L2 M117 picks the drop and its hit-only twin', pv('em065_00', '2', 'Motion[117]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['kw_shot23', { joints: { 0: J0, 131: J50 } }, 'another joint 131'],
    ['kw_shot23_turned', { owner: [0, 0xb124, 0] }, 'the facing one word off'],
    ['kw_shot13', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher'],
    ['kw_shot13b', { target: [900.0, 60.0, 2400.0] }, 'the target 20 higher (the arc)'],
    ['kw_drop', { ownerPos: [120.5, 815.25, -80.5] }, 'the owner a quarter unit over'],
  ];
  const CR = runEmu(controls.map(([n]) => emuCase(byName(n), JS.get(n))));
  for (const [n, over, what] of controls){
    const c = byName(n), J = runJS(c, over);
    const { why } = compare(c, CR[n], J);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  return fail ? 1 : 0;
}
if (MAIN) process.exit(await nodeMain());

// ---- 4. IN THE VIEWER: run by run-check.mjs, serialised with .toString() and evaluated IN THE PAGE (closes over nothing here) ----
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Kecha Wacha shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em065_00';
  const open = async () => {
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    return until(() => body() && body().monsterId === MON && body().schedule);
  };
  const OLD = new Set();
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start');
    if (!o){ check(false, 'list ' + list + ' has ' + name, [...clipSel.options].slice(0, 5).map(x => x.value)); return false; }
    OLD.clear();
    const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
    for (const s of (st ? st.shells : [])) OLD.add(s);
    clipSel.value = o.value; await clipSel.onchange();
    return true;
  };
  const watch = async (n, stop) => {
    const seen = new Map();
    for (let i = 0; i < n; i++){
      await frames(1);
      const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
      for (const s of (st ? st.shells : [])){
        if (seen.has(s) || OLD.has(s)) continue;
        seen.set(s, { shell: s.shell, mode: s.modeIndex, key: s.start && s.start.key, req: !!s.request });
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  check(await open(), 'his runtime is up');
  {
    await pick('2', 'Motion[78]');
    const w = await watch(260, x => x.filter(y => y.shell === 'shell23').length >= 3);
    check(w.filter(x => x.shell === 'shell23' && x.key === 0 && x.req).length === 3, 'L2 M78: three straight shots, shell23 0 / 1 / 2, u 0 started', w);
  }
  {
    await pick('2', 'Motion[80]');
    const w = await watch(260, x => x.filter(y => y.shell === 'shell13').length >= 3);
    check(w.filter(x => x.shell === 'shell13' && x.key === 0 && x.req).length === 3, 'L2 M80: three arcing shots, shell13, u 0 started', w);
  }
  const S = body().schedule;
  for (const [pel, key] of [['em065_00u', 0], ['em065_00u', 1], ['em065_00u', 2], ['em065_00u', 10], ['em065_00u', 11], ['em065_00u', 12], ['em065_00c', 31]]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === pel && x.def.record.key === key);
    if (!e){ check(false, pel + ' ' + key + ' exported as a shell record'); continue; }
    let started = 0, maxRun = 0;
    for (let rep = 0; rep < 2; rep++){
      try { S.start(e); started++; } catch (err){ check(false, pel + ' ' + key + ' start', String(err)); }
      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
    }
    check(!body().failed && started === 2, 'record ' + pel + ' ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
    if (body().failed) await open();
  }
  return out;
}
