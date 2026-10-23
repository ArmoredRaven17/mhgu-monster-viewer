// Yian Kut-Ku's (em008_00) shells in render/shells.js against the ROM -- sp_00 0x73 (base00), sp_01 0x74 (base01: the landings' children,
// the frame handler's 0xd4ffa4, (7, 0x02)'s hover clock), sp_13 0x75 (base13). dev/em008-shells-spec.md.
//
//   node dev/shells-kutku-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-kutku-check.mjs
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
  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 4: jointOf(-0.1, 0.1, 0.05, [40.0, 380.0, 300.0]) };
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F083 = {"115": ["em008_00", "00"], "116": ["em008_00", "01"], "117": ["em008_00", "13"]};
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em008_00', n,
    steps: [{ fn: 'd4fdd8', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, hitLife: false,
    owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, {}), joints: JOINTS }, x);
  const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];
  const cases = [
    // sp_00 (base00, the velocity x float 3, the gravity x its square): L2 M2 phase 2 at 26 / 48 / 86 (0 / 1 / 0), L2 M3 at 32 (2 / 19: joint
    // -1, his point), L2 M1 at 78 / 150 / 240 / 296
    C('k12', 0x12, 2, 26.0, 0, [{ list: '2', clip: 'Motion[2]', variant: '7:0x12', len: 92 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 2, win: 0, winFrames: [26.0], frame: 26.0 }, { fn: 'd4fdd8', phase: 2, win: 0, winFrames: [48.0], frame: 48.0 }, { fn: 'd4fdd8', phase: 2, win: 0, winFrames: [86.0], frame: 86.0 }], owner_bytes: { '0x73e0': [7, 0x12] }, hitLife: true, slot0Until: { '116:0': [27, 27, 26] }, emVariant: 0, frames: 300 }),
    C('k19', 0x19, 1, 32.0, 0, [{ list: '2', clip: 'Motion[3]', variant: '7:0x19', len: 105 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 1, win: 0, winFrames: [32.0], frame: 32.0 }], owner_bytes: { '0x73e0': [7, 0x19] }, hitLife: true, slot0Until: { '116:0': 26, '116:1': 26 }, emVariant: 0, frames: 300 }),
    C('k49', 0x49, 1, 32.0, 0, [{ list: '2', clip: 'Motion[3]', variant: '7:0x49', len: 105 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 1, win: 0, winFrames: [32.0], frame: 32.0 }], owner_bytes: { '0x73e0': [7, 0x49] }, hitLife: true, slot0Until: { '116:0': 26, '116:1': 26 }, emVariant: 0, frames: 300, owner: [0, 0x6000, 0] }),
    C('k2d', 0x2d, 1, 78.0, 0, [{ list: '2', clip: 'Motion[1]', variant: '7:0x2d', len: 453 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 1, win: 0, winFrames: [78.0], frame: 78.0 }, { fn: 'd4fdd8', phase: 1, win: 0, winFrames: [150.0], frame: 150.0 }, { fn: 'd4fdd8', phase: 1, win: 0, winFrames: [240.0], frame: 240.0 }, { fn: 'd4fdd8', phase: 1, win: 0, winFrames: [296.0], frame: 296.0 }], owner_bytes: { '0x73e0': [7, 0x2d] }, hitLife: true, slot0Until: { '116:1': [26, 26, 26, 26] }, emVariant: 0, frames: 300 }),
    C('k38', 0x38, 1, 78.0, 0, [{ list: '2', clip: 'Motion[1]', variant: '7:0x38', len: 453 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 1, win: 0, winFrames: [78.0], frame: 78.0 }, { fn: 'd4fdd8', phase: 1, win: 0, winFrames: [150.0], frame: 150.0 }, { fn: 'd4fdd8', phase: 1, win: 0, winFrames: [240.0], frame: 240.0 }, { fn: 'd4fdd8', phase: 1, win: 0, winFrames: [296.0], frame: 296.0 }], owner_bytes: { '0x73e0': [7, 0x38] }, hitLife: true, slot0Until: { '116:1': [26, 26, 26, 26] }, emVariant: 0, frames: 300, owner: [0, 0xc000, 0] }),
    // sp_13 (base13, flags 0x70: from his block point along his facing): L2 M3 at 32 (0 / 1, x 1.0 / 1.15)
    C('k23', 0x23, 1, 32.0, 0, [{ list: '2', clip: 'Motion[3]', variant: '7:0x23', len: 105 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 1, win: 0, winFrames: [32.0], frame: 32.0 }], owner_bytes: { '0x73e0': [7, 0x23] }, hitLife: true, slot0Until: { '116:0': 26, '116:1': 26 }, emVariant: 0, frames: 400 }),
    C('k4c', 0x4c, 1, 32.0, 0, [{ list: '2', clip: 'Motion[3]', variant: '7:0x4c', len: 105 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 1, win: 0, winFrames: [32.0], frame: 32.0 }], owner_bytes: { '0x73e0': [7, 0x4c] }, hitLife: true, slot0Until: { '116:0': 26, '116:1': 26 }, emVariant: 0, frames: 400, target: [1500.0, 0.0, -900.0] }),
    // the frame handler 0xd4ffa4: sp_01 3 / 4 / 5 at his point and words when he is no more than 900 above his ground
    C('p018', 0x00, 0, 2.0, 0, [{ list: '0', clip: 'Motion[24]', variant: null, len: 27 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [24, 0] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
    C('p01e', 0x00, 0, 2.0, 0, [{ list: '0', clip: 'Motion[30]', variant: null, len: 23 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [30, 0] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120, owner: [0, 0x7000, 0] }),
    C('p104', 0x00, 0, 2.0, 0, [{ list: '1', clip: 'Motion[4]', variant: null, len: 39 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [4, 1] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
    C('p10e', 0x00, 0, 52.0, 0, [{ list: '1', clip: 'Motion[14]', variant: null, len: 55 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 52.0, owner: { '0x4b4': [14, 1] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
    C('p111', 0x00, 0, 2.0, 0, [{ list: '1', clip: 'Motion[17]', variant: null, len: 107 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [17, 1] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
    C('p113', 0x00, 0, 2.0, 0, [{ list: '1', clip: 'Motion[19]', variant: null, len: 49 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [19, 1] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120, ownerPos: [300.0, 15.25, 900.0] }),
    C('p166', 0x00, 0, 2.0, 0, [{ list: '1', clip: 'Motion[102]', variant: null, len: 158 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [102, 1] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
    C('p169', 0x00, 0, 2.0, 0, [{ list: '1', clip: 'Motion[105]', variant: null, len: 104 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [105, 1] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
    C('p16a', 0x00, 0, 2.0, 0, [{ list: '1', clip: 'Motion[106]', variant: null, len: 115 }], { st: 7, steps: [{ fn: 'd4ffa4', frame: 2.0, owner: { '0x4b4': [106, 1] } }], hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
    // (7, 0x02) phase 2 on L2 M21 from frame 10: the clock +0x10 (15 + dt) reaches 16 -> sp_01 6 at (his x, his ground, his z)
    C('k02', 0x02, 2, 10.0, 0, [{ list: '2', clip: 'Motion[21]', variant: '7:0x02', len: 14 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 2, win: 1, winFrames: [10.0], frame: 0.0 }], owner_bytes: { '0x73e0': [7, 0x02] }, ctl: { '0x10': [0, 0, 128, 65] }, hitLife: true, slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }, emVariant: 0, frames: 120 }),
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
    if (c.slot0Until) o.slot0Until = c.slot0Until;
    if (c.ctl) o.ctl = c.ctl;
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
  const BASE = { 0x73: "base00", 0x74: "base01", 0x75: "base13" };
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
  ok(pv('em008_00', '2', 'Motion[3]') === '["7:0x19","7:0x49","7:0x23","7:0x4c"]', 'L2 M3: (7, 0x19 / 0x49 / 0x23 / 0x4c)', pv('em008_00', '2', 'Motion[3]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['k12', { joints: Object.assign({}, JOINTS, { 4: jointOf(-0.1, 0.1, 0.05, [41.0, 380.0, 300.0]) }) }, 'joint 4 one unit along x'],
    ['k23', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],
    ['p01e', { owner: [0, 0x7100, 0] }, 'his Y word 0x100 more'],
    ['k02', { ground: 1.0 }, 'his ground 1 higher'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Kut-Ku shells shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em008_00';
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
  for (const [list, clip, sh] of [['2', 'Motion[1]', 'shell00'], ['2', 'Motion[3]', 'shell00'], ['1', 'Motion[4]', 'shell01'], ['2', 'Motion[21]', 'shell01'], ['2', 'Motion[2]', 'shell00'], ['1', 'Motion[102]', 'shell01']]){
    await pick(list, clip);
    const w = await watch(600, x => x.some(y => y.shell === sh));
    const T = body().schedule.shellTally;
    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });
    if (body().failed) await open();
  }
  return out;
}
