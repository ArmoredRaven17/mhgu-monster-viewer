// Rajang's (em023_00) and Furious Rajang's (em023_05) shells in render/shells.js against the ROM -- the ball (shell00) and its hit
// volume (shell01). Their beam (sp_02) is render/beam-spawns.js's (dev/beams/em023_00.md); sp_22 (base22, the carried rock) is not
// built yet.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em023_00.arc's / em023_05.arc's shell files, the owner's variant byte 0 / 5. The
//      setups are the class's OWN CODE run on the ROM: the L2 M8 ball 0xde82f8(e, r5 != 3) (phase 1, the frame-84 window 0xb0968
//      answering 1), the leap 0xde554c's phase 3 (L2 M12 frame 22), the L2 M5 0xde7e00 / L2 M22 0xdea2c0 phase 2 at 26. Each shell
//      is flown from the setup the ROM built, and the ball's floor contact's shell01 from the setup the ROM built for it; every init
//      / move / effect start compared bit for bit (float32) to the end.
//   2. The contract: the pick lists (L2 M8: the beams' then the ball's), the ids by variant.
//   3. CONTROLS: a wrong target, a wrong facing, a wrong joint, a moved floor must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the ball on L2 M8 / L2 M12 on both, its record started;
//      every exported shell record (u 230..232) starts and runs out with no refusal.
//
//   node dev/shells-rajang-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-rajang-check.mjs         (4: the viewer)
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

  // a joint's world matrix: a rotation (yaw a, pitch b, roll c) and a point, rows = axes (the game's memory order)
  function jointOf(a, b, c, t){
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
    const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
    const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
    const R = mul(mul(Rz, Rx), Ry);
    return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
  }
  const J0 = jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]);
  const J40 = jointOf(0.35, -0.25, 0.1, [140.5, 95.25, 160.75]);
  const J50 = jointOf(-0.3, 0.4, -0.15, [-95.25, 120.5, 140.75]);
  const J145 = jointOf(1.2, -0.3, 0.2, [-60.0, 280.25, -310.5]);
  const J0b = jointOf(-0.6, 0.35, 0.05, [40.5, 180.25, 260.75]), J140 = jointOf(2.4, -0.2, 0.3, [-30.0, 120.5, -250.25]);
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const C = (name, mon, list, clip, variant, steps, x = {}) => Object.assign({ name, mon, list, clip, variant, steps, owner: OW,
    ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10, emVariant: mon === 'em023_05' ? 5 : 0,
    joints: { 0: J0, 4: J0b, 12: J140 } }, x);
  const fr = (fn, frames, x = {}) => frames.map(F => Object.assign({ fn, frame: F }, x));
  const F023 = { 0xa7: ['em023_00', '00'], 0xa8: ['em023_00', '01'], 0xaa: ['em023_00', '22'], 0xab: ['em023_05', '00'], 0xac: ['em023_05', '01'], 0xae: ['em023_05', '22'] };
  const cases = [
    // L2 M8's ball: 0xde82f8(e, 0) phase 1 (r5 == 3 makes none: 0xde8538), the frame-84 window (0xb0968 mode 1) -> sp_00 0, aimed (flag 1: base00's X aim)
    C('rj_ball_l2m8', 'em023_00', '2', 'Motion[8]', '7:0x05', [{ fn: 'de82f8', args: [0], phase: 1, win: 1, frame: 84 }], { len: 140 }),
    C('rj_ball_l2m8_far', 'em023_00', '2', 'Motion[8]', '7:0x0c', [{ fn: 'de82f8', args: [0], phase: 1, win: 1, frame: 84 }], { len: 140, target: [-300.0, 420.0, 600.0], owner: [0, 0xd000, 0] }),
    C('rj_ball_l2m8_v5', 'em023_05', '2', 'Motion[8]', '7:0x3b', [{ fn: 'de82f8', args: [0], phase: 1, win: 1, frame: 84 }], { len: 140, target: [1500.0, -200.0, 300.0], floorY: -250.0, ground: -250.0 }),
    // the leap 0xde554c's phase 3: L2 M12 frame 22 -> sp_00 1
    C('rj_ball_l2m12', 'em023_00', '2', 'Motion[12]', '7:0x07', fr('de554c', [22], { args: [0], phase: 3 }), { len: 100 }),
    C('rj_ball_l2m12_v5', 'em023_05', '2', 'Motion[12]', '1:0x0c', fr('de554c', [22], { args: [0], phase: 3 }), { len: 100, owner: [0, 0x8888, 0] }),
    // sp_01 1 at joint 12 on the ground: L2 M5 0xde7e00 / L2 M22 0xdea2c0, phase 2, frame 26
    C('rj_s01_l2m5', 'em023_00', '2', 'Motion[5]', '7:0x04', fr('de7e00', [26], { args: [0], phase: 2 }), { len: 60, ground: 3.5, floorY: 3.5 }),
    C('rj_s01_l2m22_v5', 'em023_05', '2', 'Motion[22]', '7:0x36', fr('dea2c0', [26], { args: [0], phase: 2 }), { len: 60 }),
    // THE ROCK (sp_22, base22): made at (1, 0x39)'s start by vt+0x204 0xde220c(e, 1, 0x39) with ctl+0x15 the dig's mode; held on
    // joint 12 through L2 M29, thrown at L2 M28 56 (or dropped on another motion), flown to its contacts. The owner's motion and the
    // window 0x72714 mode 2 the ROM run reads each move are the module's own run's (`track`, from the rock's trace)
    ...[['rj_rock_0', 'em023_00', '1:0x36', 0, {}], ['rj_rock_1', 'em023_00', '1:0x37', 1, { target: [-600.0, 300.0, 1700.0] }],
        ['rj_rock_2', 'em023_00', '1:0x38', 2, { owner: [0, 0x9000, 0] }], ['rj_rock_3_v5', 'em023_05', '1:0x3f', 3, { target: [400.0, -120.0, 2600.0], floorY: -180.0, ground: -180.0 }],
        ['rj_rock_1_v5_far', 'em023_05', '1:0x37', 1, { target: [2900.0, 40.0, 3900.0], owner: [0, 0x2400, 0] }]].map(([n, mon, v, m, x]) =>
      C(n, mon, '2', 'Motion[29]', v, [{ fn: 'de220c', args: [1, 0x39] }], Object.assign({ ctl: { '0x15': [m] }, rockSeg: 'throw' }, x))),
    // dropped: L2 M29 gives way to L2 M9 while it is held (0xde3734 -> 2)
    C('rj_rock_drop', 'em023_00', '2', 'Motion[29]', '1:0x36', [{ fn: 'de220c', args: [1, 0x39] }], { ctl: { '0x15': [0] }, rockSeg: 'drop' }),
    C('rj_rock_drop_v5', 'em023_05', '2', 'Motion[29]', '1:0x38', [{ fn: 'de220c', args: [1, 0x39] }], { ctl: { '0x15': [2] }, rockSeg: 'drop', owner: [0, 0xc321, 0] }),
  ];
  // the clips a rock case plays: L2 M29 0..324 (the rock at 200), then L2 M28 from 40 (the throw at 56) and on, or L2 M9 (the drop)
  const SEGS = { throw: [['2', 'Motion[29]', 0, 324], ['2', 'Motion[28]', 40, 182], ['2', 'Motion[9]', 0, 400]],
                 drop: [['2', 'Motion[29]', 0, 260], ['2', 'Motion[9]', 0, 500]] };
  for (const c of cases) if (c.rockSeg) c.segments = SEGS[c.rockSeg];
  for (const c of cases) c.folders = F023;

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'rjshells-'));
  writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases.map(c => ({ name: c.name, mon: c.mon, folders: c.folders, variant: c.emVariant || 0, owner: c.owner,
    ownerPos: c.ownerPos, target: c.target, floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, charged: !!c.charged,
    rage: !!c.rage, severed: !!c.severed, rank: c.rank, quest: c.quest, unstub: c.unstub || [], owner_bytes: c.owner_bytes || null, block: c.block || null, ctl: c.ctl || null, track: c.segments ? trackOf(c) : null,
    joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: 460 }))));
  const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_fb.py failed'); }
  const ROM = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));

  // ---- the module ---------------------------------------------------------------------------------------------------------------
  // a rock case's owner track for the ROM run: the module's own rock's [motion, window answer] a move (move k = trace[k - 1])
  function trackOf(c){
    const J = runJS(c), I = [...J.info.values()].find(x => x.S.shell === 'shell22');
    const tr = I ? I.S.trace : [];
    return Object.fromEntries(tr.map((t, i) => [i + 1, t]));
  }
  function runJS(c, over = {}){
    const x = Object.assign({}, c, over);
    const st = S.createShellState(x.mon);
    const J = gid => x.joints[gid] || x.joints[0];
    const snaps = new Map(), info = new Map(), refused = [];
    // a play before (x.pre): its own clip, on the same state; nothing of it is compared (the heading it leaves is)
    if (x.pre) for (let k = 0; k <= x.pre.len; k++)
      S.stepShells(st, { monId: x.mon, list: x.pre.list, clip: x.pre.clip, frame: k, joints: J, rage: !!x.rage,
        rock: { variant: x.pre.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: false, rank: x.rank, questLevel: x.quest, charged: !!x.charged });
    const pre = new Set(st.shells.map(sh => sh.id));
    const steps = x.segments ? x.segments.flatMap(([l, c, a, b]) => Array.from({ length: b - a + 1 }, (_, i) => [l, c, a + i]))
                             : Array.from({ length: x.len + 461 }, (_, k) => [x.list, x.clip, x.loop ? k % (x.len + 1) : Math.min(k, x.len)]);
    for (const [k, [L0, C0, F0]] of steps.entries()){
      const out = S.stepShells(st, { monId: x.mon, list: L0, clip: C0, frame: F0, joints: J, rage: !!x.rage,
        rock: { variant: x.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: false, rank: x.rank, questLevel: x.quest, charged: !!x.charged,
        action: x.action, tailSevered: !!x.severed, gas021: x.gas, gas021Last: !!x.gasLast });
      for (const r of out.refused) refused.push(r);
      for (const sh of out.spawned) if (!pre.has(sh.id)) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });
      for (const sh of out.spawned) if (sh.creator != null && info.has(sh.creator)) info.get(sh.creator).children.push(sh.id);
      for (const sh of out.alive.concat(out.ended, out.removed)){
        const I = info.get(sh.id); if (!I) continue;
        const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
        if (L.length && L[L.length - 1].moves === sh.moves) continue;
        L.push({ moves: sh.moves, state: sh.state, pos: sh.position && sh.position.slice(), vel: sh.velocity && sh.velocity.slice(),
                 anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0), timer: (sh.base === 'base13' || sh.base === 'base22') ? sh.lifetime : sh.timer });
      }
      for (const { shell: sh, start } of out.started){ const I = info.get(sh.id); if (I) I.starts.push(start); }
    }
    return { info, snaps, refused, state: st };
  }
  const eq = (a, b) => a === b || (a !== a && b !== b);
  const eqv = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => eq(f(v), f(b[i])));
  const BASE = { 0xa7: 'base00', 0xa8: 'base01', 0xaa: 'base22', 0xab: 'base00', 0xac: 'base01', 0xae: 'base22' };
  function diffShell(R, I, snaps, base){
    const S0 = I.S, L = snaps.get(S0.id) || [];
    if (!R.init) return 'the ROM init deleted it, the module made it';
    const sp = R.spawn;
    if (base === 'base00' || base === 'base13'){
      const ln = S0.launch;
      if (!eqv(ln.position || ln.point, sp.pos)) return 'init position ' + JSON.stringify(ln.position || ln.point) + ' vs ROM ' + JSON.stringify(sp.pos);
      if (!eqv(ln.velocity, sp.vel)) return 'init velocity ' + JSON.stringify(ln.velocity) + ' vs ROM ' + JSON.stringify(sp.vel);
      if (!eqv(ln.gravity || S0.gravity, sp.acc)) return 'gravity ' + JSON.stringify(ln.gravity || S0.gravity) + ' vs ' + JSON.stringify(sp.acc);
      if (!eqv((ln.angles || S0.angles0 || [0, 0, 0]).map(w => w & 0xffff), sp.ang.map(w => w & 0xffff))) return 'init words ' + JSON.stringify(ln.angles) + ' vs ROM ' + JSON.stringify(sp.ang);
      if (!eq(f(base === 'base13' ? ln.life : ln.timer), f(sp.timer))) return 'init timer ' + (base === 'base13' ? ln.life : ln.timer) + ' vs ' + sp.timer;
    }
    if (base === 'base22'){
      if (!eqv(S0.launch.position, sp.pos)) return 'init position ' + JSON.stringify(S0.launch.position) + ' vs ROM ' + JSON.stringify(sp.pos);
      if (!eq(f(S0.launch.life), f(sp.timer))) return 'init life ' + S0.launch.life + ' vs ' + sp.timer;
    }
    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);
      if (!s){ if (fr.state >= 0xfe && L.length && L[L.length - 1].state >= 0xfe) break; return 'no module move ' + fr.k + ' (ROM state ' + fr.state + ')'; }
      if (s.state !== fr.state) return 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state;
      if (fr.state === 0xff) break;
      if (!eqv(s.pos, fr.pos)) return 'move ' + fr.k + ' position ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos);
      if (base === 'base22'){
        if (!eqv(s.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(s.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
        if (s.state === 1 && !eq(f(s.timer), f(fr.timer))) return 'move ' + fr.k + ' life ' + s.timer + ' vs ' + fr.timer;
      }
      if (base === 'base00' || base === 'base13'){
        if (!eqv(s.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(s.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
        if (!eqv(s.anchor, fr.anchor)) return 'move ' + fr.k + ' anchor';
        if (!eq(f(s.timer), f(fr.timer)) && (s.state === 1 || (base === 'base13' && s.state === 2))) return 'move ' + fr.k + ' timer ' + s.timer + ' vs ' + fr.timer;
      }
      if (!eqv(s.ang.map(w => w & 0xffff), fr.ang.map(w => w & 0xffff))) return 'move ' + fr.k + ' words ' + JSON.stringify(s.ang) + ' vs ROM ' + JSON.stringify(fr.ang);
    }
    const romStarts = R.log.concat(...R.frames.map(x => x.log)).filter(e => e[0] === 'start');
    const jsStarts = (S0.starts && S0.starts.length ? S0.starts : (S0.start ? [S0.start] : [])).concat(I.starts);
    if (romStarts.length !== jsStarts.length) return 'starts ' + jsStarts.length + ' vs ROM ' + romStarts.length + ' ' + JSON.stringify(romStarts.map(e => e.slice(1, 3)));
    for (let i = 0; i < romStarts.length; i++){
      const r = romStarts[i], q = jsStarts[i];
      if (r[1] !== q.listId || r[2] !== q.key) return 'start ' + i + ' (' + q.listId + ', ' + q.key + ') vs ROM (' + r[1] + ', ' + r[2] + ')';
      if (!eqv(q.requester.position, r[3])) return 'start ' + i + ' point ' + JSON.stringify(q.requester.position) + ' vs ROM ' + JSON.stringify(r[3]);
    }
    return null;
  }
  // a shell and its children, and theirs, recursively; returns the first difference and the number of shells compared
  function diffTree(R, I, J, depth = 0){
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
      const r = diffTree(kids[j].run, K, J, depth + 1);
      n += r.n;
      if (r.d) return { d: 'child ' + j + ' (' + K.S.shell + ' ' + K.S.modeIndex + '): ' + r.d, n };
    }
    return { d: null, n };
  }
  function compare(c, over){
    const R = ROM[c.name], J = runJS(c, over);
    const mine = [...J.info.values()].filter(I => I.S.creator == null);
    const isLive = s => !!s.run && !!s.run.init && (s.run.spawn.state === 1 || s.run.spawn.state === 2);
    const live = R.shells.filter(isLive), dead = R.shells.length - live.length;
    const gone = J.refused.filter(r => /init deleted|init refused/.test(r.why || '')).length;
    if (mine.length !== live.length) return { why: 'shells ' + mine.length + ' vs ROM ' + live.length + ' (' + dead + ' dead)' + (J.refused.length ? ' (refused ' + JSON.stringify(J.refused[0]) + ')' : ''), J };
    let n = 0;
    for (let i = 0; i < live.length; i++){
      const r = live[i], I = mine[i];
      if (I.S.globalId !== r.id || I.S.modeIndex !== r.mode) return { why: 'shell ' + i + ' id/mode ' + I.S.globalId + '/' + I.S.modeIndex + ' vs ROM ' + r.id + '/' + r.mode, J };
      const t = diffTree(r.run, I, J);
      n += t.n;
      if (t.d) return { why: 'shell ' + i + ' (' + I.S.shell + ' ' + I.S.modeIndex + '): ' + t.d, J };
    }
    return { why: null, J, n, dead, gone };
  }
  const count = R => R.shells.reduce((a, s) => a + (s.run ? 1 + (function k(x){ return x.children.reduce((b, c) => b + 1 + k(c.run), 0); })(s.run) : 0), 0);
  const movesOf = R => R.shells.reduce((a, s) => a + (s.run ? (function m(x){ return x.frames.length + x.children.reduce((b, c) => b + m(c.run), 0); })(s.run) : 0), 0);
  for (const c of cases){
    const R = ROM[c.name];
    const { why, n } = compare(c);
    ok(!why && R.shells.length > 0, c.name + ': ' + R.shells.length + ' shell(s), ' + count(R) + ' with their children, ' + movesOf(R) + ' moves equal to the ROM', why || '');
  }

  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  const byName = n => cases.find(c => c.name === n);
  for (const m of ['em023_00', 'em023_05']){
    ok(pv(m, '2', 'Motion[8]') === '["7:0x06","7:0x0a","7:0x05","7:0x0c","7:0x3b","7:0x3e"]', m + ' L2 M8 picks the beams, then the ball, then g1 s35 (7, 0x3e) (no shell)', pv(m, '2', 'Motion[8]'));
    ok(pv(m, '2', 'Motion[12]') === '["7:0x07","1:0x0c"]', m + ' L2 M12 picks the leap\'s two', pv(m, '2', 'Motion[12]'));
    ok(pv(m, '2', 'Motion[29]') === '["1:0x36","1:0x37","1:0x38","1:0x3f"]', m + ' L2 M29 picks the four digs', pv(m, '2', 'Motion[29]'));
  }
  {
    // a beam pick on L2 M8 makes no ball (and a ball pick no beam: the beam rows filter on the pick)
    const J = runJS(Object.assign({}, byName('rj_ball_l2m8'), { variant: '7:0x06' }));
    ok(![...J.info.values()].some(I => I.S.shell === 'shell00'), 'L2 M8 (7, 6): no ball', [...J.info.values()].map(I => I.S.shell));
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['rj_ball_l2m8', { target: [900.0, 140.0, 2400.0] }, 'the target 100 higher (the X aim)'],
    ['rj_ball_l2m8', { owner: [0, 0x3001, 0] }, 'the facing one word off'],
    ['rj_ball_l2m12', { joints: { 0: J0, 4: J50, 12: J140 } }, 'another joint 4'],
    ['rj_ball_l2m8_v5', { floorY: -247.0, ground: -247.0 }, 'the floor 3 higher (the contact, the shell01)'],
    ['rj_s01_l2m5', { joints: { 0: J0, 4: J0b, 12: J50 } }, 'another joint 12'],
    ['rj_rock_0', { joints: { 0: J0, 4: J0b, 12: J50 } }, 'another joint 12 (the hand)'],
    ['rj_rock_1', { target: [-600.0, 330.0, 1700.0] }, 'the target 30 higher (the throw\'s aim)'],
    ['rj_rock_2', { owner: [0, 0x9001, 0] }, 'the facing one word off (the throw point, the yaw)'],
    ['rj_rock_3_v5', { floorY: -177.0, ground: -177.0 }, 'the floor 3 higher (the bounce)'],
    ['rj_rock_drop', { owner: [0, 0x0001, 0] }, 'the facing one word off (the drop)'],
  ]){
    const { why } = compare(byName(n), over);
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
  const check = (ok, label, detail) => out.push([!!ok, 'Rajang shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  let MON = 'em022_00';
  const open = async () => {
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    return until(() => body() && body().monsterId === MON && body().schedule);
  };
  const OLD = new Set();
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start') ||
              [...clipSel.options].find(x => x.value === name + '_loop');
    if (!o){ check(false, 'list ' + list + ' has ' + name, [...clipSel.options].slice(0, 5).map(x => x.value)); return false; }
    OLD.clear();
    const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
    for (const s of (st ? st.shells : [])) OLD.add(s);      // the shell objects themselves (a base00 / base04 shell carries no id)
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
        seen.set(s, { shell: s.shell, mode: s.modeIndex, key: s.start && s.start.key, req: !!s.request, child: s.creator != null });
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  for (const mon of ['em023_00', 'em023_05']){
    MON = mon;
    check(await open(), mon + ': the runtime is up');
    {
      // L2 M8's picks run beam, beam, ball, ball, ball: five plays
      const got = [];
      for (let play = 0; play < 5; play++){
        await pick('2', 'Motion[8]_start');
        const w = await watch(150, x => x.some(y => y.shell === 'shell00'));
        got.push(w.filter(x => x.shell === 'shell00' && x.key === 230 && x.req).length);
      }
      check(got.filter(n => n === 1).length === 3, mon + ' L2 M8: the ball (u 230) on three plays of five', got);
    }
    {
      await pick('2', 'Motion[12]');
      const w = await watch(120, x => x.some(y => y.shell === 'shell00'));
      check(w.some(x => x.shell === 'shell00' && x.mode === 1 && x.key === 230 && x.req), mon + ' L2 M12: the leap\'s ball, shell00 1, u 230 started', w);
    }
    {
      // the rock: L2 M29's dig (the first pick, mode 0: u 262) at frame 200, held; L2 M28 throws it at 56 and it flies
      await pick('2', 'Motion[29]');
      const w = await watch(260, x => x.some(y => y.shell === 'shell22'));
      const rock = w.find(x => x.shell === 'shell22');
      check(rock && rock.key === 262 && rock.req, mon + ' L2 M29: the rock, shell22 0, u 262 started', w);
      const st = () => body().schedule.shells.state.shells.find(s => s.shell === 'shell22' && s.state === 1);
      const held = st() && st().sub === 0;
      await pick('2', 'Motion[28]');
      let thrown = false;
      for (let i = 0; i < 120 && !thrown; i++){ await frames(1); const s = st(); thrown = !!(s && s.sub === 1); }
      check(held && thrown, mon + ' the rock held through L2 M29, thrown on L2 M28', { held, thrown });
    }
  }
  MON = 'em023_00';
  await open();
  for (const key of [230, 231, 232, 260, 261, 262, 263, 264, 265, 266, 267]){
    const S = body().schedule, e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em023_00u' && x.def.record.key === key);
    if (!e){ check(false, 'u ' + key + ' exported as a shell record'); continue; }
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
