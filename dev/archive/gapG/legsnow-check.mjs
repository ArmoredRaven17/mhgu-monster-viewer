// gapG (2026-10-20): THE LEG SNOW (0x105fd94) in the PATCHED COPY gapG/shells.patched.js against the ROM; built by mk_check.py from
// dev/shells-elderfrost-check.mjs, whose header follows.
// Elderfrost Gammoth's (em083_04) shells in render/shells.js against the ROM -- uEm083_00 with the variant byte 4: sp_00 (0x165: the
// aimed shot, and L9 M15's mode 4 the reader aims itself, turned by the action setter's e+0xcb10), sp_01 (0x168) and sp_13 (0x16a:
// L9 M8's held and thrown ball, no split), sp_00_03 (0x167, the leap's icicles), his own snowball 0x16b (base13 + its class) and
// its pieces 0x166. The beam (0x169) starts no effect and is not made.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides), as dev/shells-gammoth-check.mjs; L9 M15's cases call the
//      setter's arm 0x1051ebc(e, 0, 1, r3) first (`precall`), which computes e+0xcb10 from joint 102, the target and the tune ints.
//   2. The contract: the pick lists, the named refusals.
//   3. CONTROLS: a wrong joint, a moved target, a moved floor must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.
//
//   node dev/shells-elderfrost-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-elderfrost-check.mjs         (4: the viewer)
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
  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 7: jointOf(-0.3, 0.4, -0.15, [-95.25, 120.5, 140.75]),
                   11: jointOf(0.5, -0.1, 0.2, [140.5, 118.25, 20.5]), 14: jointOf(-0.6, 0.35, 0.05, [40.5, 60.25, -120.75]),
                   17: jointOf(1.1, 0.2, -0.3, [150.25, 60.5, -118.0]), 140: jointOf(2.4, -0.2, 0.3, [-30.0, 300.5, -10.25]),
                   157: jointOf(0.9, -0.45, 0.25, [160.25, 260.5, -40.75]) };
  JOINTS[100] = jointOf(0.3, 0.1, 0.0, [60.0, 190.5, 120.25]); JOINTS[102] = jointOf(-0.2, 0.2, 0.1, [180.5, 195.25, 110.0]);
  JOINTS[2] = jointOf(0.4, -0.3, 0.2, [125.25, 210.5, -70.75]);
  const J157b = jointOf(-0.4, 0.3, 0.1, [150.0, 250.0, -30.0]), J2b = jointOf(0.1, 0.2, 0.3, [110.0, 205.0, -60.0]);
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F083 = { 0x165: ['em083_04', '00'], 0x166: ['em083_04', '00_02'], 0x167: ['em083_04', '00_03'], 0x168: ['em083_04', '01'],
                 0x169: ['em083_04', '02'], 0x16a: ['em083_04', '13'], 0x16b: ['em083_04', '13_02'] };
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em083_04', n,
    steps: [{ fn: '1050a1c', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 4, hitLife: false,
    owner_bytes: { '0x73e0': [7, n], '0xcae0': [0x65, 1, 0, 0], '0xcae4': [0x68, 1, 0, 0], '0xcae8': [0x6a, 1, 0, 0] }, joints: JOINTS }, x);
  const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];
  const F00 = { 0x161: ['em083_00', '00'], 0x162: ['em083_00', '00_02'], 0x163: ['em083_00', '01'], 0x164: ['em083_00', '13'] };
  const IDS00 = { '0xcae0': [0x61, 1, 0, 0], '0xcae4': [0x63, 1, 0, 0], '0xcae8': [0x64, 1, 0, 0] };
  // a leg case: steps at the listed frames (0xb0968 answered at that frame alone, winFrames; 0xb0974 at `frame` too), the slots
  // e+0xcb50.. at `slots` and every leg part's durability (P+0x3c0 + 12 part, parts 2..5) at 1; `zero` = { frame: [slot..] }: the
  // current levels the move step 0x105006c would have copied from next (= 0, 0x1054624) before that frame -- the harness runs the
  // action main alone
  const LEG = (name, mon, n, phase, frames, seq, slots, legs, x = {}) => {
    const v0 = mon === 'em083_00', shed = new Set();
    const steps = frames.map(F => {
      const st = { fn: '1050a1c', phase, win: 0, winFrames: [F], frame: F };
      const z = (x.zero || {})[F];
      if (z){ st.owner = {}; for (const k of z){ st.owner['0x' + (0xcb50 + 4 * k).toString(16)] = [0, 0, 0, 0]; } }
      return st;
    });
    const ob = Object.assign({ '0x73e0': [7, n] }, v0 ? IDS00 : { '0xcae0': [0x65, 1, 0, 0], '0xcae4': [0x68, 1, 0, 0], '0xcae8': [0x6a, 1, 0, 0] });
    slots.forEach((L, k) => { ob['0x' + (0xcb50 + 4 * k).toString(16)] = [L, 0, 0, 0]; });
    return C(name, n, phase, null, 0, seq, Object.assign({ mon, emVariant: v0 ? 0 : 4, steps, owner_bytes: ob, legs,
      block_bytes: { '0x3d8': [1, 0], '0x3e4': [1, 0], '0x3f0': [1, 0], '0x3fc': [1, 0] }, F: v0 ? F00 : F083 }, x));
  };
  const M6 = [208, 216, 230, 260, 268, 310, 388, 390];
  const cases = [
    LEG('g_00', 'em083_00', 0x00, 1, [116], Q('Motion[1]', 0x00, 120), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_01', 'em083_00', 0x01, 1, [100], Q('Motion[2]', 0x01, 104), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_05', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [2, 2, 2, 2], [2, 2, 2, 2], { zero: { 260: [1], 388: [0], 390: [1] } }),
    LEG('g_05_l3', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [3, 1, 3, 1], [3, 1, 3, 1], { zero: { 260: [1], 388: [0], 390: [1] } }),
    LEG('g_05_one', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [0, 0, 0, 2], [0, 0, 0, 2]),
    LEG('g_5a', 'em083_00', 0x5a, 1, [170, 172], Q('Motion[37]', 0x5a, 176), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_5c', 'em083_00', 0x5c, 2, [170, 172], Q('Motion[37]', 0x5c, 176), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_05_bare', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [0, 0, 0, 0], [0, 0, 0, 0], { none: 1 }),
    LEG('g_05_broken', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [4, 4, 4, 4], [4, 4, 4, 4], { none: 1 }),
    LEG('e_00', 'em083_04', 0x00, 1, [116], Q('Motion[1]', 0x00, 120), [2, 2, 0, 0], [2, 2, 0, 0]),
    LEG('e_05', 'em083_04', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [2, 2, 0, 0], [2, 2, 0, 0], { zero: { 260: [1], 388: [0], 390: [1] } }),
    LEG('e_05_l1', 'em083_04', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [1, 1, 0, 0], [1, 1, 0, 0], { zero: { 260: [1], 310: [0], 388: [0], 390: [1] } }),
    LEG('e_70', 'em083_04', 0x70, 1, [30], Q('Motion[11]', 0x70, 34, '9'), [2, 2, 0, 0], [2, 2, 0, 0]),
    LEG('e_71', 'em083_04', 0x71, 1, [30], Q('Motion[14]', 0x71, 34, '9'), [2, 1, 0, 0], [2, 1, 0, 0]),
  ];
  for (const c of cases){ c.folders = c.F; delete c.F; }

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
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, legSnow083: x.legs });
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
    if (c.precall) o.precall = c.precall;
    if (c.trunk != null){ o.owner_bytes = Object.assign({}, c.owner_bytes, { '0xcb64': [c.trunk, 0, 0, 0] }); o.block_bytes = { '0x3cc': [50, 0] }; }
    if (c.noTurn) o.noTurn = 1;
    if (c.block_bytes) o.block_bytes = Object.assign({}, o.block_bytes || {}, c.block_bytes);
    // (his pieces' init 0x106128c draws the RNG twice, each draw times a zero float of his files: the run answers the draws 0)
    if (c.snow) o.rng0 = 1;
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
  const BASE = { 0x161: 'base00', 0x162: 'base00', 0x163: 'base01', 0x164: 'base13', 0x165: 'base00', 0x166: 'base00', 0x167: 'base00', 0x168: 'base01', 0x16a: 'base13', 0x16b: 'base13' };
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
    const made = [...J.info.values()].filter(I => I.S.creator == null).map(I => 'm' + I.S.modeIndex + '@' + I.S.spawnFrame + ((I.S.start ? [I.S.start] : []).concat(I.starts).map(q => ' ' + q.listId + ':' + q.key).join('')));
    console.log('     ' + c.name + ' module: ' + JSON.stringify(made) + '  ROM: ' + JSON.stringify(R.shells.map(x => x.id.toString(16) + ' m' + x.mode)));
    ok(!why && (c.none ? R.shells.length === 0 : R.shells.length > 0), c.name + ': ' + R.shells.length + ' shell(s), ' + count(R) + ' with their children, ' + movesOf(R) + ' moves equal to the ROM', why || '');
  }
  // ---- 3. CONTROLS: the module's input moved, the ROM's run kept -- each must FAIL the comparison
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['g_05', { legs: [2, 2, 2, 0] }, 'leg 3 shown bare (the ROM at 2)'],
    ['g_00', { joints: Object.assign({}, JOINTS, { 7: J157b }) }, 'another joint 7'],
    ['e_70', { legs: [4, 2, 0, 0] }, 'leg 0 shown broken (the ROM at 2)'],
    ['g_5a', { owner: [0, 0x3001, 0] }, 'the facing one word off'],
  ];
  for (const [n, over, what] of controls){
    const c = byName(n), J = runJS(c, over);
    const { why } = compare(c, ROM[n], J);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  return fail ? 1 : 0;
}
if (MAIN) process.exit(await nodeMain());

