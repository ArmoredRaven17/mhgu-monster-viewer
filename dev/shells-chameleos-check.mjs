// Chameleos's (em025_00) shells in render/shells.js against the ROM -- uEm025_00: sp_00 (0xb5, base00 through 0xe0eee0, its landing
// 0xe0efdc: sp_01 4 and the cloud), sp_01 (0xb6, base01 through 0xe0f2dc: the footfalls), sp_13 (0xb7, base13 through 0xe0f510, its Y word
// 0xe0f7f0, its landing 0xe0f6fc) and sp_39 (0xb8, base39: the poison cloud, the owner's ring 0xe0dad8). dev/elder-dragon-shells-spec.md 5.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xe0dd58 at each spawn's phase
//      (the footfalls: vt+0x208 0xe00344 with the motion id at e+0x4b4), every shell flown from its setup, children included (the
//      cloud's creator handed over: creatorCopy).
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong facing, a moved target, a moved floor must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.
//
//   node dev/shells-chameleos-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-chameleos-check.mjs         (4: the viewer)
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
  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]), 142: jointOf(0.0, 0.3, 0.1, [-80.0, 30.0, 150.0]) };
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F083 = {"181": ["em025_00", "00"], "182": ["em025_00", "01"], "183": ["em025_00", "13"], "184": ["em025_00", "39"]};
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em025_00', n,
    steps: [{ fn: 'e0dd58', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, hitLife: false,
    owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, {}), joints: JOINTS }, x);
  const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];
  const cases = [
    // each row: the action main 0xe0dd58 at the phase its spawn is in; the footfalls: vt+0x208 0xe00344 with the motion id at e+0x4b4
    C('g08', 8, 1, null, 0, [{ list: '2', clip: 'Motion[15]', variant: '7:0x08', len: 40 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 2, win: 1, frame: 2.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300 }),
    C('g24', 36, 1, null, 0, [{ list: '2', clip: 'Motion[15]', variant: '7:0x24', len: 40 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 2, win: 1, frame: 2.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300 }),
    C('g1f', 31, 1, null, 0, [{ list: '2', clip: 'Motion[45]', variant: '7:0x1f', len: 120 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 1, win: 1, frame: 70.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300 }),
    C('t0d', 13, 1, null, 0, [{ list: '2', clip: 'Motion[27]', variant: '7:0x0d', len: 100 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 1, win: 1, frame: 64.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300 }),
    C('t17', 23, 1, null, 0, [{ list: '2', clip: 'Motion[27]', variant: '7:0x17', len: 100 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 1, win: 1, frame: 64.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300 }),
    C('t29', 41, 1, null, 0, [{ list: '2', clip: 'Motion[27]', variant: '7:0x29', len: 100 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 2, win: 1, frame: 64.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300 }),
    C('t1e', 30, 1, null, 0, [{ list: '2', clip: 'Motion[43]', variant: '7:0x1e', len: 100 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 1, win: 1, frame: 64.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300 }),
    C('t18', 0x18, 1, null, 0, [{ list: '2', clip: 'Motion[36]', variant: '7:0x18', len: 90 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 0 }, { fn: 'e0dd58', phase: 1, win: 1, frame: 44.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300, block: { '0x30': [0, 0, 97, 68, 0, 0, 32, 66, 0, 0, 22, 69] } }),
    C('t18_l', 0x18, 1, null, 0, [{ list: '2', clip: 'Motion[36]', variant: '7:0x18', len: 90 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 0 }, { fn: 'e0dd58', phase: 1, win: 1, frame: 44.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300, block: { '0x30': [0, 128, 187, 196, 0, 0, 200, 66, 0, 0, 97, 68] }, owner: [0, 51200, 0], target: [-1500.0, 100.0, 900.0] }),
    C('t18_r', 0x18, 1, null, 0, [{ list: '2', clip: 'Motion[36]', variant: '7:0x18', len: 90 }], { st: 7, steps: [{ fn: 'e0dd58', phase: 0 }, { fn: 'e0dd58', phase: 1, win: 1, frame: 44.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300, block: { '0x30': [0, 0, 175, 68, 0, 0, 72, 194, 0, 128, 9, 69] }, owner: [0, 9216, 0], target: [1400.0, -50.0, 2200.0] }),
    C('f_l1m7', 0, 1, null, 0, [{ list: '1', clip: 'Motion[7]', variant: null, len: 60 }], { st: 7, steps: [{ fn: 'e00344', phase: 0, win: 1, frame: 22.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, frames: 200, owner_bytes: { '0x73e0': [0, 0], '0x4b4': [7, 1] } }),
    C('f_l1m9', 0, 1, null, 0, [{ list: '1', clip: 'Motion[9]', variant: null, len: 60 }], { st: 7, steps: [{ fn: 'e00344', phase: 0, win: 1, frame: 36.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, frames: 200, owner_bytes: { '0x73e0': [0, 0], '0x4b4': [9, 1] } }),
    C('f_l2m8', 0, 1, null, 0, [{ list: '2', clip: 'Motion[8]', variant: null, len: 400 }], { st: 7, steps: [{ fn: 'e00344', phase: 0, win: 1, frame: 64.0 }, { fn: 'e00344', phase: 0, win: 1, frame: 160.0 }, { fn: 'e00344', phase: 0, win: 1, frame: 256.0 }, { fn: 'e00344', phase: 0, win: 1, frame: 354.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, frames: 200, owner_bytes: { '0x73e0': [0, 0], '0x4b4': [8, 2] } }),
    C('f_l1m2', 0, 1, null, 0, [{ list: '1', clip: 'Motion[2]', variant: null, len: 90 }], { st: 7, steps: [{ fn: 'e00344', phase: 0, win: 1, frame: 64.0 }], hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, frames: 200, owner_bytes: { '0x73e0': [0, 0], '0x4b4': [2, 1] } }),
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
    for (let i = 0; i < (x.frames || 460) + 500; i++) steps.push({ q: last.q, frame: last.q.len });   // (a child made late still gets its 460 moves)
    for (const { q, frame } of steps){
      const out = S.stepShells(st, { monId: x.mon, list: q.list, clip: q.clip, frame, joints: J,
        rock: { variant: q.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart });
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
      joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: c.frames || 460 };
    if (c.snow){
      o.post28 = 1;
      const top = [...J.info.values()].find(I => I.S.base === 'base13' && I.S.creator == null);
      o.pokes = { 1: { '0xcb0c': [1, 0, 0, 0] } };
      if (top && J.marks.thrown.has(top.S.id)) o.pokes[J.marks.thrown.get(top.S.id)] = { '0xcb0c': [2, 0, 0, 0] };
    }
    // (the pieces' hit-side loop 0x10632bc runs on slot 0: no other em083 in the run -- 0x5cdf8 answers none)
    if (c.precall) o.precall = c.precall;
    if (c.stepsRaw) o.steps = c.stepsRaw;
    if (c.block) o.block = c.block;
    if (c.creatorCopy) o.creatorCopy = 1;
    if (c.slot0Until) o.slot0Until = c.slot0Until;
    o.frameStep = 1.0;
    if (c.trunk != null){ o.owner_bytes = Object.assign({}, c.owner_bytes, { '0xcb64': [c.trunk, 0, 0, 0] }); o.block_bytes = { '0x3cc': [50, 0] }; }
    if (c.noTurn) o.noTurn = 1;
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
  const BASE = { 0xb5: "base00", 0xb6: "base01", 0xb7: "base13", 0xb8: "base39" };
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
    ok(!why && (c.none ? R.shells.length === 0 : R.shells.length > 0), c.name + ': ' + R.shells.length + ' shell(s), ' + count(R) + ' with their children, ' + movesOf(R) + ' moves equal to the ROM', why || '');
  }
  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em025_00', '2', 'Motion[27]') === '["7:0x0d","7:0x16","7:0x17","7:0x29"]', 'L2 M27: the spits', pv('em025_00', '2', 'Motion[27]'));
  ok(pv('em025_00', '2', 'Motion[15]') === '["7:0x08","7:0x24"]', 'L2 M15: the gob', pv('em025_00', '2', 'Motion[15]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['t0d', { owner: [0, 0x3001, 0] }, 'the facing one word off'],
    ['t0d', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further'],
    ['g1f', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],
    ['t18_l', { target: [-1500.0, 100.0, 930.0] }, 'the target 30 further (the (7, 0x18) aim)'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Chameleos shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em025_00';
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
  check(await open(), 'the runtime is up');
  for (const [list, clip, sh] of [['2', 'Motion[27]', 'shell13'], ['2', 'Motion[45]', 'shell00']]){
    await pick(list, clip);
    const w = await watch(500, x => x.some(y => y.shell === sh) && x.some(y => y.shell === 'shell39'));
    check(w.some(x => x.shell === sh && x.req), 'L' + list + ' ' + clip + ': ' + sh + ' started', w);
    // (L2 M45's gob starts 13 below the viewer's floor at f70 -- the head at the ground, its offset (0, -80, 140) -- and falls through it,
    // as the ROM's query would for that geometry: no landing there; the spit's landing is the cloud's check)
    if (sh === 'shell13') check(w.some(x => x.shell === 'shell39' && x.req), 'L' + list + ' ' + clip + ': its landing left a cloud (shell39)', w);
  }
  const S = body().schedule;
  for (const [pel, key] of [['em025_00u', 0], ['em025_00u', 2], ['em025_00u', 1], ['em025_00u', 11], ['em025_00u', 3], ['em025_00c', 30], ['em025_00c', 31], ['em025_00u', 4]]){   // u 4 (the mode-1 cloud) back 2026-10-18: 0xa953f0 = generator flag bit 28 ([[g+0x34]+0x10c]), recorded and lifted
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
