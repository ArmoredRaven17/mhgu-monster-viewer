// Lao-Shan Lung's (em012_00) shells in render/shells.js against the ROM -- uEm012_00's event lists (vt+0x2a8 0xd759f4, the table
// 0x17a50f4): sp_13 (0x81, the falling rubble: base13 through his own init 0xd7cf9c, reader 0xd7d2bc, delay +0x15c 0xd7d3c0, landing
// 0xd7d450, end point +0x168 0xd7d4bc) and sp_01 (0x80, the hit volumes: base01 through 0xd7cd50). dev/elder-dragon-shells-spec.md 2.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the per-frame handler on each listed entry
//      (e+0xcae0 poked, the motion e+0x4b4, its frame test answered), every shell flown from the setup the ROM built (0x70 bytes).
//   2. The contract: the pick lists (one per event entry the EMC's op 0xa3 names).
//   3. CONTROLS: the other entry of a pair, a moved floor must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.
//
//   node dev/shells-lao-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-lao-check.mjs         (4: the viewer)
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
  const F083 = {"128": ["em012_00", "01"], "129": ["em012_00", "13"]};
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em012_00', n,
    steps: [{ fn: 'd759f4', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, hitLife: false,
    owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, {}), joints: JOINTS }, x);
  const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];
  const cases = [
    // each listed entry: vt+0x2a8 0xd759f4 with e+0xcae0 = the entry (0x17a50f4 + 8 x idx) and the motion at e+0x4b4, its frame test passed
    C('e25', 0, 1, 720.0, 1, [{ list: '2', clip: 'Motion[1]', variant: '7:0x00 #25', len: 722 }], { st: 7, owner_bytes: {"0x73e0": [7, 0], "0xcae0": [188, 81, 122, 1], "0x4b4": [1, 2]}, frames: 600 }),
    C('e26', 0, 1, 720.0, 1, [{ list: '2', clip: 'Motion[1]', variant: '7:0x00 #26', len: 722 }], { st: 7, owner_bytes: {"0x73e0": [7, 0], "0xcae0": [196, 81, 122, 1], "0x4b4": [1, 2]}, frames: 600 }),
    C('e27', 2, 1, 150.0, 1, [{ list: '2', clip: 'Motion[3]', variant: '7:0x02 #27', len: 152 }], { st: 7, owner_bytes: {"0x73e0": [7, 2], "0xcae0": [204, 81, 122, 1], "0x4b4": [3, 2]}, frames: 600 }),
    C('e28', 2, 1, 150.0, 1, [{ list: '2', clip: 'Motion[3]', variant: '7:0x02 #28', len: 152 }], { st: 7, owner_bytes: {"0x73e0": [7, 2], "0xcae0": [212, 81, 122, 1], "0x4b4": [3, 2]}, frames: 600 }),
    C('e29', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #29', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [220, 81, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e30', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #30', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [228, 81, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e31', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #31', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [236, 81, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e32', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #32', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [244, 81, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e33', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #33', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [252, 81, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e34', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #34', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [4, 82, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e35', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #35', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [12, 82, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e36', 3, 1, 600.0, 1, [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #36', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 3], "0xcae0": [20, 82, 122, 1], "0x4b4": [4, 2]}, frames: 600 }),
    C('e37', 4, 1, 600.0, 1, [{ list: '2', clip: 'Motion[5]', variant: '7:0x04 #37', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 4], "0xcae0": [28, 82, 122, 1], "0x4b4": [5, 2]}, frames: 600 }),
    C('e38', 4, 1, 600.0, 1, [{ list: '2', clip: 'Motion[5]', variant: '7:0x04 #38', len: 602 }], { st: 7, owner_bytes: {"0x73e0": [7, 4], "0xcae0": [36, 82, 122, 1], "0x4b4": [5, 2]}, frames: 600 }),
    C('e43', 5, 1, 720.0, 1, [{ list: '2', clip: 'Motion[9]', variant: '7:0x05 #43', len: 722 }], { st: 7, owner_bytes: {"0x73e0": [7, 5], "0xcae0": [76, 82, 122, 1], "0x4b4": [9, 2]}, frames: 600 }),
    C('e44', 5, 1, 720.0, 1, [{ list: '2', clip: 'Motion[9]', variant: '7:0x05 #44', len: 722 }], { st: 7, owner_bytes: {"0x73e0": [7, 5], "0xcae0": [84, 82, 122, 1], "0x4b4": [9, 2]}, frames: 600 }),
    C('e45', 5, 1, 660.0, 1, [{ list: '2', clip: 'Motion[9]', variant: '7:0x05 #45', len: 662 }], { st: 7, owner_bytes: {"0x73e0": [7, 5], "0xcae0": [92, 82, 122, 1], "0x4b4": [9, 2]}, frames: 600 }),
    C('e46', 5, 1, 660.0, 1, [{ list: '2', clip: 'Motion[9]', variant: '7:0x05 #46', len: 662 }], { st: 7, owner_bytes: {"0x73e0": [7, 5], "0xcae0": [100, 82, 122, 1], "0x4b4": [9, 2]}, frames: 600 }),
    C('e47', 0, 1, 720.0, 1, [{ list: '2', clip: 'Motion[1]', variant: '7:0x00 #47', len: 722 }], { st: 7, owner_bytes: {"0x73e0": [7, 0], "0xcae0": [108, 82, 122, 1], "0x4b4": [1, 2]}, frames: 600 }),
    C('e48', 0, 1, 720.0, 1, [{ list: '2', clip: 'Motion[1]', variant: '7:0x00 #48', len: 722 }], { st: 7, owner_bytes: {"0x73e0": [7, 0], "0xcae0": [116, 82, 122, 1], "0x4b4": [1, 2]}, frames: 600 }),
    C('e50', 4, 1, 200.0, 1, [{ list: '0', clip: 'Motion[36]', variant: '1:0x04 #50', len: 202 }], { st: 1, owner_bytes: {"0x73e0": [1, 4], "0xcae0": [132, 82, 122, 1], "0x4b4": [36, 0]}, frames: 600 }),
    C('e51', 4, 1, 200.0, 1, [{ list: '0', clip: 'Motion[36]', variant: '1:0x04 #51', len: 202 }], { st: 1, owner_bytes: {"0x73e0": [1, 4], "0xcae0": [140, 82, 122, 1], "0x4b4": [36, 0]}, frames: 600 }),
    C('e52', 4, 1, 200.0, 1, [{ list: '0', clip: 'Motion[36]', variant: '1:0x04 #52', len: 202 }], { st: 1, owner_bytes: {"0x73e0": [1, 4], "0xcae0": [148, 82, 122, 1], "0x4b4": [36, 0]}, frames: 600 }),
    C('e53', 4, 1, 200.0, 1, [{ list: '0', clip: 'Motion[36]', variant: '1:0x04 #53', len: 202 }], { st: 1, owner_bytes: {"0x73e0": [1, 4], "0xcae0": [156, 82, 122, 1], "0x4b4": [36, 0]}, frames: 600 }),
    C('e54', 4, 1, 200.0, 1, [{ list: '0', clip: 'Motion[36]', variant: '1:0x04 #54', len: 202 }], { st: 1, owner_bytes: {"0x73e0": [1, 4], "0xcae0": [164, 82, 122, 1], "0x4b4": [36, 0]}, frames: 600 }),
    C('e55', 4, 1, 200.0, 1, [{ list: '0', clip: 'Motion[36]', variant: '1:0x04 #55', len: 202 }], { st: 1, owner_bytes: {"0x73e0": [1, 4], "0xcae0": [172, 82, 122, 1], "0x4b4": [36, 0]}, frames: 600 }),
    C('e56', 1, 1, 240.0, 1, [{ list: '0', clip: 'Motion[6]', variant: '1:0x01 #56', len: 242 }], { st: 1, owner_bytes: {"0x73e0": [1, 1], "0xcae0": [180, 82, 122, 1], "0x4b4": [6, 0]}, frames: 600 }),
    C('e57', 1, 1, 240.0, 1, [{ list: '0', clip: 'Motion[6]', variant: '1:0x01 #57', len: 242 }], { st: 1, owner_bytes: {"0x73e0": [1, 1], "0xcae0": [188, 82, 122, 1], "0x4b4": [6, 0]}, frames: 600 }),
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
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });
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
    // (Lao-Shan Lung: the event lists' flag / sound actions answered 0 -- not shells; his sp_13 setup is 0x70 bytes)
    o.stubs = ['0xc44c70', '0x3ae2c8']; o.setupLen = 0x70;
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
  const BASE = { 0x80: "base01", 0x81: "base13" };
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
  ok(pv('em012_00', '2', 'Motion[1]') === '["7:0x00 #25","7:0x00 #26","7:0x00 #47","7:0x00 #48"]', 'L2 M1: (7, 0) entries 25 / 26 / 47 / 48', pv('em012_00', '2', 'Motion[1]'));
  ok(pv('em012_00', '2', 'Motion[4]').split(',').length === 8 && pv('em012_00', '2', 'Motion[5]') === '["7:0x04 #37","7:0x04 #38"]', 'L2 M4: eight entries; L2 M5: 37 / 38 (39..42 unnamed)', pv('em012_00', '2', 'Motion[5]'));
  ok(pv('em012_00', '0', 'Motion[36]').split(',').length === 6 && pv('em012_00', '0', 'Motion[6]') === '["1:0x01 #56","1:0x01 #57"]', 'L0 M36: six entries; L0 M6: 56 / 57');

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['e25', { seq: [{ list: '2', clip: 'Motion[1]', variant: '7:0x00 #26', len: 722 }] }, 'the pair\'s other entry (26 for 25)'],
    ['e29', { seq: [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #30', len: 602 }] }, 'the pair\'s other entry (30 for 29)'],
    ['e27', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],
  ];
  const CR = runEmu(controls.map(([n]) => emuCase(byName(n), JS.get(n))));
  for (let i = 0; i < controls.length; i++){
    const [n, over, what] = controls[i];
    const c = byName(n), J = runJS(c, over);
    const { why } = compare(c, CR[n], J);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

  // ---- THE VIEWER'S ANCHOR (input.anchor012, Raven 2026-10-18): each entry's sp_13 landing centre (x, z) moved onto his unit, the
  // ROM's layout kept -- every end the fortress end less the entry's centre plus the unit's point, heights the ROM's; off, the ROM's own
  {
    const P = [120.5, 15.25, -80.75];
    const run = (variant, anchor) => {
      const st = S.createShellState('em012_00'), ends = [];
      for (let fr = 0; fr <= 760; fr++){
        const out = S.stepShells(st, { monId: 'em012_00', list: '2', clip: 'Motion[4]', frame: Math.min(fr, 600), joints: () => null,
          rock: { variant, floorY: 0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: P[0], y: P[1], z: P[2] }, anchor012: anchor });
        for (const sh of out.spawned) if (sh.shell === 'shell13') ends.push(sh.end.slice());
      }
      return ends;
    };
    for (const v of ['7:0x03 #29', '7:0x03 #33']){
      const raw = run(v, false), moved = run(v, true);
      const cx = raw.reduce((t, e) => t + e[0], 0) / raw.length, cz = raw.reduce((t, e) => t + e[2], 0) / raw.length;
      const good = raw.length > 0 && moved.length === raw.length && moved.every((e, i) =>
        Math.abs(e[0] - (raw[i][0] - Math.fround(cx) + P[0])) < 0.01 && e[1] === raw[i][1] && Math.abs(e[2] - (raw[i][2] - Math.fround(cz) + P[2])) < 0.01);
      ok(good, 'anchor ' + v + ': ' + raw.length + ' rubble ends shifted by their centre onto the unit, heights kept',
         JSON.stringify(moved.slice(0, 2).map(e => e.map(x => Math.round(x)))));
    }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  return fail ? 1 : 0;
}
if (MAIN) process.exit(await nodeMain());

// ---- 4. IN THE VIEWER: run by run-check.mjs, serialised with .toString() and evaluated IN THE PAGE (closes over nothing here) ----
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Lao-Shan Lung shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em012_00';
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
  for (const [list, clip] of [['2', 'Motion[3]'], ['0', 'Motion[36]']]){
    await pick(list, clip);
    const w = await watch(320, x => x.some(y => y.shell === 'shell13'));
    check(w.some(x => x.shell === 'shell13' && x.key === 10 && x.req), 'L' + list + ' ' + clip + ': rubble, shell13, u 10 started', w);
    // the delay: its handle's draw byte core+0x1c1 is 0 while the rubble waits (state 1) and 1 once it falls (state 2)
    const sch = body().schedule, mem = sch.host.m, waits = [], falls = [];
    for (let i = 0; i < 300 && !(waits.length > 6 && falls.length > 6); i++){
      for (const s of sch.shells.state.shells) if (s.shell === 'shell13' && s.request && !OLD.has(s)){
        // the byte, and what the draw reads: each of the request's units' +0xc bit 11 (0x43da0 -> 0x327188 from [unit+0x210]+0x18c,
        // which the core's vt+0x28 0x43370 set from +0x1c1); host.js draws a unit only when (+0xc & 0x4807) == 0x4802
        // (a unit still in state 1 has not moved yet: its bit is its ctor's -- only the moved, state-2 units are read)
        const units = s.request.effects().filter(u => mem.u32(u + 0x210) === s.request.core && (mem.u32(u + 0xc) & 7) === 2);
        const b = mem.u8(s.request.core + 0x1c1) + (units.length ? ':' + units.map(u => (mem.u32(u + 0xc) >>> 11) & 1).join('') : ':-');
        if (s.state === 1) waits.push(b); else if (s.state === 2) falls.push(b);
      }
      await frames(1);
    }
    // (only readings with a moved unit count)
    const settled = x => /^[01]:(0+|1+)$/.test(x);
    check(waits.filter(settled).length && waits.filter(settled).every(b => /^0:0+$/.test(b)) &&
          falls.filter(settled).length && falls.filter(settled).every(b => /^1:1+$/.test(b)),
          'L' + list + ' ' + clip + ': the waiting rubble\'s handle byte +0x1c1 is 0 and its units\' draw bit 11 clear; the falling one\'s 1 and set',
          { waits: waits.slice(0, 4), falls: falls.slice(0, 4) });
  }
  const S = body().schedule;
  for (const key of [10, 20]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em012_00u' && x.def.record.key === key);
    if (!e){ check(false, 'em012_00u ' + key + ' exported as a shell record'); continue; }
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
