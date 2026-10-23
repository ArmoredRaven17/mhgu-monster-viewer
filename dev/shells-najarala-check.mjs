// Najarala's (em068_00) shells in render/shells.js against the ROM -- uEm068_00's sp_36 (0x126, the scales, NEW base36 through its
// reader 0xf88b6c) and their blast, sp_01 (0x125 mode 2, base01 through 0xf889b0). dev/snake-wyvern-shells-spec.md 1.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the class's action start vt+0x204 0xf79d60
//      (the maker 0xf7a4bc's slots in [e+0xcac0]+4..) or its action main 0xf85ec4 at the frame; every scale flown from the setup the
//      ROM built (slotSelf: the owner block's slot is the flown scale); the ring / call-off written into the block (+0x14 / +0x20 / +0x30)
//      before the move the module heard it on, the retire marks P+0x1bb before the move the module faded on; the blast flown as a child.
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong facing, a moved target, a moved floor, the rank one off (the ring's delay) must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the throw and the ring play; the records run out.
//
//   node dev/shells-najarala-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-najarala-check.mjs         (4: the viewer)
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
  const F083 = {"293": ["em068_00", "01"], "294": ["em068_00", "36"]};
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em068_00', n,
    steps: [{ fn: 'f85ec4', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, hitLife: false,
    owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, {"0xb5f9": [1], "0x7652": [1], "0x1054": [255]}), joints: JOINTS }, x);
  const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];
  const cases = [
    // the action start (vt+0x204 0xf79d60): L2 M60's throws -- (7, 0x17) modes 0 / 1, (7, 0x1c) 2 / 3, (7, 0x22) 4 / 5, (7, 0x24) 8
    C('m17', 0x17, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x17', len: 120 }], { steps: [{ fn: 'f79d60', args: [7, 0x17] }], frames: 300 }),
    C('m1c_turned', 0x1c, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x1c', len: 120 }], { steps: [{ fn: 'f79d60', args: [7, 0x1c] }], frames: 300, owner: [0, 0xa321, 0] }),
    C('m22', 0x22, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x22', len: 120 }], { steps: [{ fn: 'f79d60', args: [7, 0x22] }], frames: 300, owner: [0x0400, 0x5800, 0xfc00] }),
    C('m24_low', 0x24, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x24', len: 120 }], { steps: [{ fn: 'f79d60', args: [7, 0x24] }], frames: 300, floorY: -120.0, ground: -120.0 }),
    // in the actions: (7, 0x26) L2 M62 f32 (mode 9, aimed) and f68 (mode 10, aimed); (7, 0x27) L2 M63 f104 (modes 0 / 1)
    C('a26', 0x26, 1, null, 0, [{ list: '2', clip: 'Motion[62]', variant: '7:0x26', len: 120 }], { steps: [{ fn: 'f85ec4', phase: 1, frame: 32.0 }, { fn: 'f85ec4', phase: 1, frame: 68.0 }], frames: 300 }),
    C('a3c_far', 0x3c, 1, null, 0, [{ list: '2', clip: 'Motion[62]', variant: '7:0x26', len: 120 }], { steps: [{ fn: 'f85ec4', phase: 1, frame: 32.0 }, { fn: 'f85ec4', phase: 1, frame: 68.0 }], frames: 300, target: [-2600.0, 0.0, 4100.0] }),
    C('a27', 0x27, 1, 104.0, 0, [{ list: '2', clip: 'Motion[63]', variant: '7:0x27', len: 160 }], { frames: 300 }),
    // THE RING: thrown, stuck, then L0 M50 (1, 0) f190 (r 5000): u 30, the delay 18 x (slot + 1) (rank 5) / 30 x (rank 3), the blast
    // (sp_01 2, u 31) -- the ROM's block +0x14.. written before the move the module heard it on (the owner's frame), cleared the next
    C('ring', 0x17, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x17', len: 100 }, { list: '0', clip: 'Motion[50]', variant: '1:0x00', len: 300 }], { steps: [{ fn: 'f79d60', args: [7, 0x17] }], frames: 420, ring: 1 }),
    C('ring_r3', 0x1c, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x1c', len: 100 }, { list: '2', clip: 'Motion[61]', variant: '7:0x18', len: 200 }], { steps: [{ fn: 'f79d60', args: [7, 0x1c] }], frames: 420, ring: 1, rank: 3 }),
    // THE CALL-OFF: L0 M36 (6, 0) f100 (mode 2): the count 0 -> the fade (sh int 0 frames), u 2, the end
    C('calloff', 0x22, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x22', len: 100 }, { list: '0', clip: 'Motion[36]', variant: '6:0x00', len: 200 }], { steps: [{ fn: 'f79d60', args: [7, 0x22] }], frames: 420, ring: 2 }),
    // OUTSIDE THE RADIUS: L2 M61's ring (r 3500) with the owner moved 6000 away -- heard, the stored ring reset, still stuck
    C('ring_out', 0x17, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x17', len: 100 }, { list: '2', clip: 'Motion[61]', variant: '7:0x18', len: 200, ownerPos: [6120.5, 15.25, -80.75] }], { steps: [{ fn: 'f79d60', args: [7, 0x17] }], frames: 420, ring: 1 }),
    // THE FLIGHT'S LIMIT: no floor in reach (y -1e6): at +0x1634 >= 600 the end (1) -- both flight handles at once, deleted -- and ef 6 (u 2)
    C('limit', 0x22, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x22', len: 120 }], { steps: [{ fn: 'f79d60', args: [7, 0x22] }], frames: 700, floorY: -1000000.0, ground: -1000000.0 }),
    // THE RETIRE: four stuck, (7, 0x26)'s start at rank 5 marks the two oldest 3 -> the fade
    C('retire', 0x17, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x17', len: 100 }, { list: '2', clip: 'Motion[60]', variant: '7:0x1c', len: 100 }, { list: '2', clip: 'Motion[62]', variant: '7:0x26', len: 20 }], { steps: [{ fn: 'f79d60', args: [7, 0x17] }, { fn: 'f79d60', args: [7, 0x1c] }], frames: 420, marks: 1 }),
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
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: (P => ({ x: P[0], y: P[1], z: P[2] }))(q.ownerPos || x.ownerPos),
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
    o.slotSelf = 1;
    o.rng0 = 1;   // (the init's draw 0x3f76d8 times +0x1614, the ctor's 0: answered 0)
    o.block_bytes = { '0x1a0': [1] };   // (0x7fe88: P+0x1a0 below 2)
    if (c.frames) o.frames = c.frames;
    const f2 = x => [...new Uint8Array(new Float32Array([x]).buffer)];
    const tops = [...J.info.values()].filter(I => I.S.base === 'base36');
    if (c.ring){
      const h = tops.map(I => I.S.log.find(e => e.ev === 'heard')).find(e => e);
      if (h){
        const B = c.ring === 1 ? (c.seq[1].ownerPos || c.ownerPos) : [0, 0, 0], r = c.ring === 1 ? (c.seq[1].clip === 'Motion[50]' ? 5000.0 : 3500.0) : -1.0;
        o.pokes = { [h.move]: { '0x8d014': [c.ring], '0x8d020': [].concat(f2(B[0]), f2(B[1]), f2(B[2]), [0, 0, 0, 0]), '0x8d030': f2(r) },
                    [h.move + 1]: { '0x8d014': [0], '0x8d030': f2(-1.0) } };
      }
    }
    if (c.marks){
      const L = tops.length ? J.snaps.get(tops[0].S.id) || [] : [], m4 = (L.find(x => x.state === 4) || {}).moves;
      // (the block outlives a flight: each scale's run starts with the marks clear)
      if (m4 != null) o.pokes = { 1: { '0x101bb': [0] }, [m4]: { '0x101bb': [0x0f] } };
    }
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
  const BASE = { 0x125: "base01", 0x126: "base36" };
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
    if (base === 'base36'){
      // the stops, in order with their mode (0x329c40(h, mode)); the timer +0x1634 and, in flight, the velocity, every move
      const romStops = R.log.concat(...R.frames.map(x => x.log)).filter(e => e[0] === 'stop').map(e => e[1]);
      const jsStops = S0.log.filter(e => e.ev === 'stop').map(e => e.mode);
      if (JSON.stringify(romStops) !== JSON.stringify(jsStops)) return 'stops ' + JSON.stringify(jsStops) + ' vs ROM ' + JSON.stringify(romStops);
      if (!eqv(S0.launch.velocity, R.spawn.vel)) return 'init velocity ' + JSON.stringify(S0.launch.velocity) + ' vs ROM ' + JSON.stringify(R.spawn.vel);
      if (!eqv(S0.launch.gravity, R.spawn.acc)) return 'init gravity ' + JSON.stringify(S0.launch.gravity) + ' vs ROM ' + JSON.stringify(R.spawn.acc);
      for (const fr of R.frames){
        const q = L.find(x => x.moves === fr.k);
        if (!q || fr.state === 0xff || q.state >= 0xfe) break;
        if (!eq(f(q.timer), f(fr.timer))) return 'move ' + fr.k + ' timer ' + q.timer + ' vs ROM ' + fr.timer;
        if (fr.state === 1 && !eqv(q.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(q.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
      }
      return null;
    }
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
  {
    const st = (n, i) => (ROM[n].shells[i].run.frames || []).map(x => x.state);
    const starts = (n, i) => ROM[n].shells[i].run.frames.flatMap(x => x.log.filter(e => e[0] === 'start').map(e => e[2]));
    const kids = n => ROM[n].shells.map(s => s.run.children.map(k => k.id + ':' + parseInt(k.run.setup.slice(16, 18), 16)));
    ok(st('m17', 0).includes(2) && starts('m17', 0).join() === '1', 'm17: the ROM scale lands (state 2) and starts u 1, nothing more', starts('m17', 0).join());
    ok(JSON.stringify(kids('ring')) === '[["293:2"],["293:2"]]' && starts('ring', 0).join() === '1,30', 'ring: the ROM scales ring (u 30) and each makes the blast sp_01 2', JSON.stringify(kids('ring')) + ' ' + starts('ring', 0).join());
    const d = n => { const f0 = ROM[n].shells.map(s => s.run.frames), a = f0.map(F => (F.find(x => x.state === 3) || {}).k), b = f0.map(F => (F.find(x => x.state === 0xfe) || {}).k); return a.map((x, i) => b[i] - x); };
    ok(JSON.stringify(d('ring')) === '[18,36]' && JSON.stringify(d('ring_r3')) === '[30,60]', 'the ring\'s delay: 18 / 36 moves at rank 5, 30 / 60 at rank 3 (the slot + 1 times cmn float 6 / 5)', JSON.stringify(d('ring')) + ' ' + JSON.stringify(d('ring_r3')));
    ok(st('calloff', 0).includes(4) && !st('calloff', 0).includes(3) && starts('calloff', 0).join() === '1,2', 'calloff: the ROM scale fades (state 4, never 3) and starts u 2', starts('calloff', 0).join());
    ok(st('ring_out', 0).every(x => x !== 3) && st('ring_out', 1).every(x => x !== 3) && JS.get('ring_out').info.size === 2 && [...JS.get('ring_out').info.values()].every(I => I.S.log.some(e => e.ev === 'heard')), 'ring_out: heard, outside r 3500 -- the ROM scales never ring', JSON.stringify([...new Set(st('ring_out', 0))]));
    { const F = ROM['limit'].shells[0].run.frames, last = F[F.length - 1], lg = F.flatMap(x => x.log.filter(e => e[0] === 'stop' || e[0] === 'start').map(e => e[0] + e[1] + (e[0] === 'start' ? ':' + e[2] : '')));
      ok(!F.some(x => x.state === 2) && last.state === 0xff && last.k === 600 && lg.join() === 'stop1,stop1,start0:2', 'limit: the ROM scale flies 600 moves, then the end (1) -- both flight handles stopped at once -- and u 2', last.k + ' ' + lg.join()); }
    ok(st('retire', 0).includes(4) && st('retire', 1).includes(4) && !st('retire', 2).includes(4) && !st('retire', 3).includes(4), 'retire: the marks fade slots 0 and 1, not 2 and 3');
  }
  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em068_00', '2', 'Motion[60]') === '["7:0x17","7:0x1c","7:0x22","7:0x24"]', 'L2 M60 picks its four throws', pv('em068_00', '2', 'Motion[60]'));
  ok(pv('em068_00', '2', 'Motion[62]') === '["7:0x26"]', 'L2 M62 picks its aimed throws', pv('em068_00', '2', 'Motion[62]'));
  ok(pv('em068_00', '2', 'Motion[61]') === '["7:0x18","7:0x1a"]', 'L2 M61 picks its two rings', pv('em068_00', '2', 'Motion[61]'));
  ok(pv('em068_00', '0', 'Motion[50]') === '["1:0x00"]', 'L0 M50 picks its ring', pv('em068_00', '0', 'Motion[50]'));
  ok(pv('em068_00', '0', 'Motion[138]') === '["2:0x44"]' && pv('em068_00', '0', 'Motion[139]') === '["2:0x45"]' && pv('em068_00', '0', 'Motion[105]') === '[]', 'L0 M138 / M139 carry the phase-2 ring of (2, 0x44..0x47); L0 M105 (phase 3) none');

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['m1c_turned', { owner: [0, 0xa322, 0] }, 'the facing one word off'],
    ['a26', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further (the aimed scales)'],
    ['m17', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],
    ['ring', { rank: 3 }, 'the rank 3 (the ring step 30, not 18)'],
    ['ring_r3', { rank: 5 }, 'the rank 5 (the ring step 18, not 30)'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Najarala shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em068_00';
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
    // (a first play of L2 M60 takes its first pick, (7, 0x17): index.html rockInput)
    await pick('2', 'Motion[60]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell36'));
    check(w.some(x => x.shell === 'shell36' && x.key === 0 && x.req), 'L2 M60: a scale, shell36, u 0 started', w);
    const st = body().schedule.shells.state, s36 = st.shells.find(s => s.shell === 'shell36');
    const stuck = await until(() => s36 && s36.state === 2, 300);
    check(stuck && s36.handles && !!s36.handles.h1680, 'L2 M60: the scale lands and starts u 1 (stuck)', s36 ? { state: s36.state } : null);
    await pick('0', 'Motion[50]');
    const rang = await until(() => s36 && s36.state >= 3 && s36.handles && !!s36.handles.h168c, 400);
    check(rang, 'L0 M50 f190: the stuck scale rings, u 30 started', s36 ? { state: s36.state } : null);
    const blast = await until(() => st.shells.some(s => s.shell === 'shell01' && s.modeIndex === 2 && s.request), 200);
    check(blast, 'the ring\'s delay out: the blast, shell01 mode 2, u 31 started');
  }
  check(await pick('0', 'Motion[138]') && await pick('0', 'Motion[139]'), 'L0 M138 / M139 (the phase-2 ring clips of (2, 0x44..0x47)) are clips he carries');
  const S = body().schedule;
  for (const key of [0, 1, 2, 3, 30, 31]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em068_00u' && x.def.record.key === key);
    if (!e){ check(false, 'em068_00u ' + key + ' exported as a shell record'); continue; }
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
