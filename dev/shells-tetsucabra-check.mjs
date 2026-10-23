// Tetsucabra's (em066_00) shells in render/shells.js against the ROM -- uEm066_00's sp_00 (0x11a, the rocks, base00 through its
// reader 0xf64f38), sp_13 (0x11c, the thrown rock, base13 through 0xf65478, its landing 0xf65640), its child sp_01 (0x11b, a hit
// volume) and sp_16 (0x11d, the slab, NEW base16 through 0xf65954). dev/amphibian-shells-spec.md 1.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn, the class's action main
//      0xf63180 (the slab: the action start vt+0x204 0xf57f8c) with the action at e+0x73e0, the ids e+0xcac4.. and the .dtp array
//      filled, the tusks' level at block +0x3bc, the map read (vt+0x9c 0x6bb20, e+0x1053 = 0xff); every shell flown from the setup
//      the ROM built, its children from theirs; the slab's BodyDataList radii and its ray from 500 above (0x183664's start).
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong facing, a moved target, a moved floor, the tusks read one level off must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.
//
//   node dev/shells-tetsucabra-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-tetsucabra-check.mjs         (4: the viewer)
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
  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F083 = {"282": ["em066_00", "00"], "283": ["em066_00", "01"], "284": ["em066_00", "13"], "285": ["em066_00", "16"]};
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em066_00', n,
    steps: [{ fn: 'f63180', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, hitLife: false,
    owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, {"0xcac4": [28, 1, 0, 0], "0xcac8": [26, 1, 0, 0], "0xcacc": [27, 1, 0, 0], "0xcad0": [29, 1, 0, 0], "0x1053": [255]}), joints: JOINTS }, x);
  const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];
  const cases = [
    // (an `also` action plays under its row's variant, the primary's)
    // L4 M1 / L4 M2 f124: the rocks by the tusks (0 / 1 / 2: two, one, none) -- the map read e+0x1053 = 0xff (no snow map)
    C('r55', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4')),
    C('r55_one', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { tusk: 1 }),
    C('r55_none', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { tusk: 2, none: 1 }),
    C('r83', 0x83, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { owner: [0, 0x9123, 0] }),
    C('r56', 0x56, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { owner: [0, 0x5800, 0] }),
    C('r56_one', 0x56, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { tusk: 1, rank: 3 }),
    C('r86', 0x86, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { size: [1.2, 1.1] }),
    // L2 M12 f58: the thrown rock (sp_13 0) and its landing's hit volume (sp_01 0)
    C('t21', 0x21, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2')),
    C('t37_side', 0x37, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2'), { target: [-2400.0, 80.0, 300.0], owner: [0, 0xd000, 0], size: [1.15, 1.0] }),
    C('t22_near', 0x22, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2'), { target: [300.0, 0.0, 250.0] }),
    // the action start (vt+0x204 0xf57f8c): the slab, mode 2 below the tusks' second level, 3 at it
    C('s89', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { steps: [{ fn: 'f57f8c', args: [7, 0x89] }], frames: 900, bodydata: { 0: 360.0, 1: 160.0 }, rayStart: 1, coreVt: 1 }),
    C('s89_broken', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { tusk: 2, steps: [{ fn: 'f57f8c', args: [7, 0x89] }], frames: 900, bodydata: { 0: 360.0, 1: 160.0 }, rayStart: 1, coreVt: 1 }),
    C('s77_turned', 0x77, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { tusk: 1, owner: [0, 0xa321, 0], steps: [{ fn: 'f57f8c', args: [7, 0x77] }], frames: 900, bodydata: { 0: 360.0, 1: 160.0 }, rayStart: 1, coreVt: 1 }),
    // THE SNOW MAPS (the Snow Variants list, input.snow): e+0x1053 = 3 / 14 / 20 -- the rocks' table 0x16a0820, the slab's 0 / 1
    C('r55_snow', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { map: 3 }),
    C('r56_snow_one', 0x56, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { map: 14, tusk: 1 }),
    C('s89_snow', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { map: 20, steps: [{ fn: 'f57f8c', args: [7, 0x89] }], frames: 900, bodydata: { 0: 360.0, 1: 160.0 }, rayStart: 1, coreVt: 1 }),
    C('s89_snow_broken', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { map: 3, tusk: 2, steps: [{ fn: 'f57f8c', args: [7, 0x89] }], frames: 900, bodydata: { 0: 360.0, 1: 160.0 }, rayStart: 1, coreVt: 1 }),
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
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, tusk066: x.tusk || 0, snow: [3, 14, 20].includes(x.map) });
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
    if (c.map != null) o.owner_bytes = Object.assign({}, o.owner_bytes, { '0x1053': [c.map] });
    o.dtp = [0, 1, 1, 129, 0, 2, 2, 129, 4, 1, 1, 2, 5, 1, 1, 2, 1, 1, 1, 3];
    o.block_bytes = { '0x3bc': [c.tusk || 0] };
    o.ownvt = { '0x9c': '0x6bb20' };
    if (c.bodydata) o.bodydata = c.bodydata;
    if (c.rayStart) o.rayStart = 1;
    if (c.coreVt) o.coreVt = 1;
    if (c.frames) o.frames = c.frames;
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
  const BASE = { 0x11a: "base00", 0x11b: "base01", 0x11c: "base13", 0x11d: "base16" };
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
    const romKill = R.frames.find(x => x.log.some(e => e[0] === 'kill'));
    const jsKill = (S0.events || []).find(e => e.ev === 'stop' && e.kill);
    if (!!romKill !== !!jsKill || (romKill && romKill.k !== jsKill.move)) return 'the kill of ef 0: module ' + (jsKill ? jsKill.move : null) + ' vs ROM ' + (romKill ? romKill.k : null);
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
  for (const c of cases.filter(c => c.name[0] === 's')){
    const R = ROM[c.name], fr = R.shells[0] && R.shells[0].run ? R.shells[0].run.frames : [];
    const at = t => (fr.find(t) || {}).k, body = at(x => x.log.some(e => e[0] === 'body' && e[2] === 1)), kill = at(x => x.log.some(e => e[0] === 'kill'));
    const end = at(x => x.state === 0xfe), I = [...JS.get(c.name).info.values()][0], L = I ? JS.get(c.name).snaps.get(I.S.id) || [] : [];
    const jsEnd = (L.find(x => x.state === 0xfe) || {}).moves, jsKill = I && (I.S.events.find(e => e.kill) || {}).move;
    const K = I && I.S.k, e0 = K && K.t0, e1 = K && f(K.t0 + K.t1), e3 = K && f(f(f(K.t0 + K.t1) + K.t2) + K.t3);
    ok(!!K && body === e0 && kill === e1 && end === e3 && jsKill === kill && jsEnd === end, c.name + ': the slab -- the body on at move ' + body + ', ef 0 killed at ' + kill + ', the end at ' + end + ' (the module: ' + jsKill + ' / ' + jsEnd + ')');
  }
  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em066_00', '4', 'Motion[1]') === '["7:0x55"]', 'L4 M1 picks its rocks', pv('em066_00', '4', 'Motion[1]'));
  ok(pv('em066_00', '4', 'Motion[2]') === '["7:0x56"]', 'L4 M2 picks its rocks', pv('em066_00', '4', 'Motion[2]'));
  ok(pv('em066_00', '2', 'Motion[12]') === '["7:0x21"]', 'L2 M12 picks its thrown rock', pv('em066_00', '2', 'Motion[12]'));
  ok(pv('em066_00', '4', 'Motion[30]') === '["7:0x89"]', 'L4 M30 picks its slab', pv('em066_00', '4', 'Motion[30]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['r83', { owner: [0, 0x9124, 0] }, 'the facing one word off'],
    ['r55', { tusk: 1 }, 'the tusks read one level up'],
    ['r55_snow', { map: 255 }, 'the snow map off (the rocks)'],
    ['s89_snow', { map: 255 }, 'the snow map off (the slab)'],
    ['t21', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further'],
    ['t21', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],
    ['s89', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the slab)'],
    ['s77_turned', { owner: [0, 0xa322, 0] }, 'the facing one word off (the slab)'],
    ['s89_broken', { tusk: 1 }, 'the tusks read one level down (the slab)'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Tetsucabra shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em066_00';
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
  {
    await pick('4', 'Motion[1]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.key === 20 && x.req), 'L4 M1: a rock, shell00, u 20 started', w);
  }
  {
    await pick('2', 'Motion[12]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell13'));
    check(w.some(x => x.shell === 'shell13' && x.key === 0 && x.req), 'L2 M12: the thrown rock, shell13, u 0 started', w);
  }
  {
    await pick('4', 'Motion[30]');
    const w = await watch(120, x => x.some(y => y.shell === 'shell16'));
    check(w.some(x => x.shell === 'shell16' && (x.key === 30 || x.key === 32) && x.req), 'L4 M30: the slab, shell16, u 30 / 32 started', w);
    const st = body().schedule.shells.state, s16 = st.shells.find(s => s.shell === 'shell16');
    let rose = false;
    for (let i = 0; i < 900 && s16; i++){ await frames(1); if (s16.effect2 && s16.effect2.request){ rose = true; break; } }
    check(rose, 'L4 M30: the slab, at its second phase, starts u 40 / 42 (its first two waits run out)', s16 ? { phase: s16.phase, timer: s16.timer } : null);
  }
  {
    // THE SNOW VARIANTS LIST (Raven, 2026-10-18): the same clips with the snow map on -- the rocks' and the slab's snow modes
    const snowList = [...listSel.options].find(o => o.value === 'snow');
    check(!!snowList && snowList.textContent.includes('Snow Variants'), 'the Snow Variants list is there', snowList ? snowList.textContent : null);
    if (snowList){
      await pick('snow', 'L4 Motion[1]');
      const w = await watch(200, x => x.some(y => y.shell === 'shell00'));
      check(w.some(x => x.shell === 'shell00' && (x.mode === 3 || x.mode === 4) && x.key === 21 && x.req), 'Snow Variants L4 Motion[1]: the snow rocks (modes 3 / 4, u 21)', w);
      await pick('snow', 'L4 Motion[30]');
      const s = await watch(120, x => x.some(y => y.shell === 'shell16'));
      check(s.some(x => x.shell === 'shell16' && (x.mode === 0 || x.mode === 1) && x.req), 'Snow Variants L4 Motion[30]: the snow slab (mode 0 / 1)', s);
    }
  }
  const S = body().schedule;
  for (const key of [0, 1, 2, 20, 22, 24, 30, 32, 40, 42, 21, 23, 25, 31, 33, 41, 43]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em066_00u' && x.def.record.key === key);
    if (!e){ check(false, 'em066_00u ' + key + ' exported as a shell record'); continue; }
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
