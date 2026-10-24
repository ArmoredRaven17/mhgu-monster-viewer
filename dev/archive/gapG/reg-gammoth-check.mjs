// Gammoth's (em083_00) shells in render/shells.js against the ROM -- uEm083_00: sp_00 (0x161, the aimed ice shot), sp_00_02 (0x162,
// the snowball's pieces), sp_01 (0x163, the bursts, the stomps and the hit volumes) and sp_13 (0x164, base13: the snowball, held on
// joint 157 and thrown, split at G rank).
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em083_00.arc's shell files. The setups are the class's OWN CODE: its action main
//      0x1050a1c with the action at e+0x73e0, the phase and the frame tests answered; every shell flown from the setup the ROM built,
//      its children (sp_01 at a contact, the pieces at the split) from theirs. The snowball: the helper's two tests both pass in the
//      one call (e+0xcb0c 1 then 2), so the run pokes e+0xcb0c = 1 before its first update and 2 before the update the module
//      throws it on; the unit walker's vt+0x28 (0x1064354, the split) runs after each update (`post28`).
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong joint, a wrong facing, a moved floor, a moved target, a lower rank must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; every exported shell record
//      starts and runs out with no refusal.
//
//   node dev/shells-gammoth-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-gammoth-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const MAIN = !!process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
async function nodeMain(){
  const S = await import(pathToFileURL('C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/gapG/shells.patched.js').href);
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
  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 7: jointOf(-0.3, 0.4, -0.15, [-95.25, 120.5, 140.75]),
                   11: jointOf(0.5, -0.1, 0.2, [140.5, 118.25, 20.5]), 14: jointOf(-0.6, 0.35, 0.05, [40.5, 60.25, -120.75]),
                   17: jointOf(1.1, 0.2, -0.3, [150.25, 60.5, -118.0]), 140: jointOf(2.4, -0.2, 0.3, [-30.0, 300.5, -10.25]),
                   157: jointOf(0.9, -0.45, 0.25, [160.25, 260.5, -40.75]) };
  const J157b = jointOf(-0.4, 0.3, 0.1, [150.0, 250.0, -30.0]);
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F083 = { 0x161: ['em083_00', '00'], 0x162: ['em083_00', '00_02'], 0x163: ['em083_00', '01'], 0x164: ['em083_00', '13'] };
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em083_00', n,
    steps: [{ fn: '1050a1c', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, hitLife: false,
    owner_bytes: { '0x73e0': [7, n], '0xcae0': [0x61, 1, 0, 0], '0xcae4': [0x63, 1, 0, 0], '0xcae8': [0x64, 1, 0, 0] }, joints: JOINTS }, x);
  const Q = (clip, n, len) => [{ list: '2', clip, variant: v(n), len }];
  const cases = [
    // the aimed ice shot: L2 M61 f26 mode 0, L2 M62 f18 modes 1 / 2 (the aim offset (+-400, 80, 0)), a target behind (the clamps)
    C('g00_c9', 0xc9, 1, 26.0, 1, Q('Motion[61]', 0xc9, 60)),
    C('g00_d3', 0xd3, 1, 18.0, 1, Q('Motion[62]', 0xd3, 50)),
    C('g00_d4', 0xd4, 1, 18.0, 1, Q('Motion[62]', 0xd4, 50), { owner: [0, 0xa123, 0] }),
    C('g00_d3_behind', 0xd3, 1, 18.0, 1, Q('Motion[62]', 0xd3, 50), { target: [-900.0, 900.0, -2400.0] }),
    // the snowball: L2 M23 at 220, thrown at 266; modes 0 / 1 / 2 (G rank: 1 and 2 split into pieces)
    C('g13_1d', 0x1d, 1, 220.0, 1, Q('Motion[23]', 0x1d, 300), { snow: 1 }),
    C('g13_1c', 0x1c, 1, 220.0, 1, Q('Motion[23]', 0x1c, 300), { snow: 1 }),
    C('g13_1b', 0x1b, 1, 220.0, 1, Q('Motion[23]', 0x1b, 300), { snow: 1, owner: [0, 0x5800, 0] }),
    // ...the pieces living on hit slot 0 (the ROM's byte held set at depth 1; the module's slots from hitdata) to their contacts
    C('g13_1b_pieces', 0x1b, 1, 220.0, 1, Q('Motion[23]', 0x1b, 300), { snow: 1, slot0: [1], hitLife: true }),
    C('g13_1c_pieces', 0x1c, 1, 220.0, 1, Q('Motion[23]', 0x1c, 300), { snow: 1, slot0: [1], hitLife: true, target: [-400.0, 0.0, 1800.0] }),
    // ...below G rank: no split
    C('g13_1b_r3', 0x1b, 1, 220.0, 1, Q('Motion[23]', 0x1b, 300), { snow: 1, rank: 3 }),
    // sp_01 at the owner's point and words
    C('g01_04', 0x04, 1, 245.0, 1, Q('Motion[5]', 0x04, 260)),
    C('g01_0a', 0x0a, 1, 80.0, 1, Q('Motion[9]', 0x0a, 100)),
    C('g01_0e', 0x0e, 1, 190.0, 1, Q('Motion[14]', 0x0e, 200)),
    C('g01_0f', 0x0f, 1, 76.0, 1, Q('Motion[15]', 0x0f, 90)),
    C('g01_12a', 0x12, 1, 90.0, 1, Q('Motion[20]', 0x12, 100)),
    C('g01_12b', 0x12, 2, 100.0, 1, Q('Motion[21]', 0x12, 110)),
    C('g01_5a', 0x5a, 1, 172.0, 0, Q('Motion[37]', 0x5a, 180)),
    C('g01_5c', 0x5c, 2, 172.0, 0, Q('Motion[37]', 0x5c, 180)),
  ];
  for (const c of cases) c.folders = F083;

  // ---- the module ---------------------------------------------------------------------------------------------------------------
  function runJS(c, over = {}){
    const x = Object.assign({}, c, over);
    const st = S.createShellState(x.mon);
    const J = gid => x.joints[gid] || x.joints[0];
    const snaps = new Map(), info = new Map(), refused = [];
    const marks = { thrown: new Map() };
    let k = 0;
    const steps = [];
    for (const q of x.seq) for (let i = 0; i <= q.len; i++) steps.push({ q, frame: i });
    const last = steps[steps.length - 1];
    for (let i = 0; i < 460; i++) steps.push({ q: last.q, frame: last.q.len });
    for (const { q, frame } of steps){
      const out = S.stepShells(st, { monId: x.mon, list: q.list, clip: q.clip, frame, joints: J,
        rock: { variant: q.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest });
      for (const r of out.refused) refused.push(r);
      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });
      for (const sh of out.spawned) if (sh.creator != null && info.has(sh.creator)) info.get(sh.creator).children.push(sh.id);
      for (const sh of out.alive.concat(out.ended, out.removed)){
        const I = info.get(sh.id); if (!I) continue;
        if (sh.throw && !marks.thrown.has(sh.id)) marks.thrown.set(sh.id, sh.moves);
        const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
        if (L.length && L[L.length - 1].moves === sh.moves) continue;
        L.push({ moves: sh.moves, state: sh.state, pos: sh.position && sh.position.slice(), vel: sh.velocity && sh.velocity.slice(),
                 anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0),
                 timer: sh.base === 'base13' ? sh.lifetime : sh.timer });
      }
      for (const { shell: sh, start } of out.started){ const I = info.get(sh.id); if (I) I.starts.push(start); }
      k++;
    }
    return { info, snaps, refused, state: st, marks };
  }
  // the ROM run's own inputs that follow the module: e+0xcb0c = 1 before the snowball's first update, 2 before its throw's
  function emuCase(c, J){
    const o = { name: c.name, mon: c.mon, folders: c.folders, variant: c.emVariant, owner: c.owner, ownerPos: c.ownerPos, target: c.target,
      floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, rank: c.rank, quest: c.quest, owner_bytes: c.owner_bytes,
      joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: 460 };
    if (c.snow){
      o.post28 = 1;
      const top = [...J.info.values()].find(I => I.S.base === 'base13' && I.S.creator == null);
      o.pokes = { 1: { '0xcb0c': [1, 0, 0, 0] } };
      if (top && J.marks.thrown.has(top.S.id)) o.pokes[J.marks.thrown.get(top.S.id)] = { '0xcb0c': [2, 0, 0, 0] };
    }
    // (the pieces' hit-side loop 0x10632bc runs on slot 0: no other em083 in the run -- 0x5cdf8 answers none)
    if (c.slot0){ o.slot0 = 1; o.slot0Depths = c.slot0; o.noEm = 1; }
    return o;
  }
  const JS = new Map(cases.map(c => [c.name, runJS(c)]));

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'gmshells-'));
  const runEmu = list => {
    writeFileSync(join(dir, 'cases.json'), JSON.stringify(list));
    const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
    if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_fb.py failed'); }
    return JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));
  };
  const ROM = runEmu(cases.map(c => emuCase(c, JS.get(c.name))));

  const eq = (a, b) => a === b || (a !== a && b !== b);
  const eqv = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => eq(f(v), f(b[i])));
  const BASE = { 0x161: 'base00', 0x162: 'base00', 0x163: 'base01', 0x164: 'base13' };
  const FULL = new Set(['base00', 'base13']);
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
      if (!s){ if (fr.state >= 0xfe && L.length && L[L.length - 1].state >= 0xfe) break; return 'no module move ' + fr.k + ' (ROM state ' + fr.state + ')'; }
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
    // the split's stop: the ROM's 0x329c40(h, 1) once, exactly when the module split (S0.split083)
    const romAtOnce = R.frames.some(x => x.log.some(e => e[0] === 'stop' && e[1] === 1));
    if (romAtOnce !== !!S0.split083) return 'the flight stopped at once (the split): module ' + !!S0.split083 + ' vs ROM ' + romAtOnce;
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
  ok(pv('em083_00', '2', 'Motion[23]') === '["7:0x1d","7:0x1c","7:0x1b"]', 'L2 M23 picks the three snowballs', pv('em083_00', '2', 'Motion[23]'));
  ok(pv('em083_00', '2', 'Motion[62]') === '["7:0xce","7:0xd3","7:0xd4"]', 'L2 M62 picks the three shots', pv('em083_00', '2', 'Motion[62]'));
  ok(pv('em083_00', '2', 'Motion[37]') === '["7:0x5a","7:0x5c"]', 'L2 M37 picks its two hit volumes', pv('em083_00', '2', 'Motion[37]'));
  // a held snowball ends when another action starts (the setter's e+0xcb0c = 0)
  {
    const st = S.createShellState('em083_00');
    const inp = (clip, variant, frame) => ({ monId: 'em083_00', list: '2', clip, frame, joints: g => JOINTS[g] || JOINTS[0],
      rock: { variant, target: { x: TG[0], y: TG[1], z: TG[2] }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: OP[0], y: OP[1], z: OP[2] }, ground: 0, size: [1, 1], baseScale: 1, rank: 5 });
    let ball = null;
    for (let i = 0; i <= 240; i++){ const o = S.stepShells(st, inp('Motion[23]', '7:0x1d', i)); if (o.spawned.length) ball = o.spawned[0]; }
    const held = !!ball && ball.state === 1;
    let ended = false;
    for (let i = 0; i < 3; i++){ const o = S.stepShells(st, inp('Motion[61]', '7:0xc9', i)); if (o.ended.includes(ball)) ended = true; }
    ok(held && ended, 'a held snowball ends at the next action (e+0xcb0c cleared)', 'held ' + held + ', ended ' + ended);
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['g00_c9', { joints: Object.assign({}, JOINTS, { 157: J157b }) }, 'another joint 157'],
    ['g00_d4', { owner: [0, 0xa124, 0] }, 'the facing one word off'],
    ['g13_1c', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher'],
    ['g13_1b', { target: [900.0, 60.0, 2400.0] }, 'the target 20 higher (the arc)'],
    ['g13_1b', { rank: 3 }, 'a lower rank (no split)'],
    ['g01_04', { ownerPos: [120.5, 15.25, -80.5] }, 'the owner a quarter unit over'],
  ];
  const CR = runEmu(controls.map(([n]) => emuCase(byName(n), JS.get(n))));
  for (let i = 0; i < controls.length; i++){
    const [n, over, what] = controls[i];
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
  const check = (ok, label, detail) => out.push([!!ok, 'Gammoth shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em083_00';
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
    await pick('2', 'Motion[61]');
    const w = await watch(120, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.key === 1 && x.req), 'L2 M61: the ice shot, shell00, u 1 started', w);
  }
  {
    await pick('2', 'Motion[23]');
    const w = await watch(420, x => x.some(y => y.shell === 'shell01'));
    check(w.some(x => x.shell === 'shell13' && x.req), 'L2 M23: the snowball, shell13, its flight started', w);
    check(w.some(x => x.shell === 'shell01'), 'L2 M23: the snowball bursts into a shell01', w);
    // the plays take the three snowballs in turn (0, 1, 2): 1 and 2 split into the pieces at G rank, shell00_02 with u 41 / u 51
    const w2 = await watch(1400, x => x.some(y => y.shell === 'shell00_02'));
    check(w2.some(x => x.shell === 'shell00_02' && (x.key === 41 || x.key === 51) && x.req), 'L2 M23: a later play splits into shell00_02 pieces', w2.filter(x => x.shell !== 'shell01'));
  }
  const S = body().schedule;
  for (const key of [1, 2, 31, 32, 41, 42, 51, 52, 60, 61, 70, 80]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em083_00u' && x.def.record.key === key);
    if (!e){ check(false, 'em083_00u ' + key + ' exported as a shell record'); continue; }
    let started = 0, maxRun = 0;
    for (let rep = 0; rep < 2; rep++){
      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }
      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
    }
    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
    if (body().failed) await open();
  }
  return out;
}
