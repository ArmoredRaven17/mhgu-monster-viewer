// Rustrum Duramboros's (em061_04) shells in render/shells.js against the ROM -- uEm061_00 at variant 4: sp_00 (0x108, his files and
// the 0x108 reader arm), sp_01 (0x109), the ball sp_19 (0x10b, the 0xf34608 reader arm), the rust lump sp_24 (0x10c, base24) and
// the lifted lump sp_13 (0x10a, base13 held on joint 15).
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em061_04.arc's shell files. The setups are the class's OWN CODE: its action main
//      0xf32798 with the action (7, n) at e+0x73e0 and the ids at e+0xcac8.. as vt+0x158 0xf23ec0 writes them for variant 4. The
//      held lump's two conversions are the class's own calls on the shell (0xf34a20(shell, mode) -> sp_19, 0xf34b4c(shell) -> sp_13:
//      the harness's `convert`, made as many landed moves after the landing as the module's own action frame gives); the throw of
//      the lifted lump is e+0xcae0 = 2 written before the move the module's L9 M11 frame 59 falls on (`pokes`); the owner's motion
//      is L9 M10 (0x90a) for the hold (`track`), and the owner's vt+0x54 answers a joint's world matrix (`ownvt54`: the held lump's
//      joint-parented coordinate reads it).
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong joint, a wrong facing, a moved floor, a moved target must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; every exported shell record
//      starts and runs out with no refusal.
//
//   node dev/shells-rustrum-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-rustrum-check.mjs         (4: the viewer)
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
  const IDS = { '0xcac8': [8, 1, 0, 0], '0xcacc': [9, 1, 0, 0], '0xcad0': [10, 1, 0, 0], '0xcad4': [11, 1, 0, 0], '0xcad8': [12, 1, 0, 0] };
  const F061 = { 0x108: ['em061_04', '00'], 0x109: ['em061_04', '01'], 0x10a: ['em061_04', '13'], 0x10b: ['em061_04', '19'], 0x10c: ['em061_04', '24'] };
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  // one case: the module plays `seq` (clips in order, each from 0 to its len); the ROM runs `n`'s action step(s)
  const C = (name, n, steps, seq, x = {}) => Object.assign({ name, mon: 'em061_04', n, steps, seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 4, owner_bytes: Object.assign({ '0x73e0': [7, n] }, IDS),
    joints: { 0: J0, 9: J0b, 14: J140, 15: J150 } }, x);
  const P1 = (F, win) => [{ fn: 'f32798', phase: 1, win: win ? 1 : 0, frame: F }], P0 = [{ fn: 'f32798', phase: 0, win: 0, frame: null }];
  const cases = [
    // the rocks: (7, 0xe6) L2 M28 17 / 18 / 19, (7, 0xe7) L2 M22 12 / 13 / 14, (7, 0x46) L2 M28 0 (scale 1.2), the L2 M56 lump 6 (u 50)
    C('ru_rock_e6', 0xe6, P1(120, 1), [{ list: '2', clip: 'Motion[28]', variant: v(0xe6), len: 200 }]),
    C('ru_rock_e7', 0xe7, P1(120, 1), [{ list: '2', clip: 'Motion[22]', variant: v(0xe7), len: 200 }], { owner: [0, 0xa000, 0] }),
    C('ru_rock_46', 0x46, P1(120, 1), [{ list: '2', clip: 'Motion[28]', variant: v(0x46), len: 200 }]),
    C('ru_lump_af', 0xaf, P1(110, 1), [{ list: '2', clip: 'Motion[56]', variant: v(0xaf), len: 200 }]),
    // the ball through the variant-4 reader: L2 M46 f94 (mode 0), L2 M56 f110 (mode 1)
    C('ru_ball_6f', 0x6f, P1(94, 0), [{ list: '2', clip: 'Motion[46]', variant: v(0x6f), len: 200 }]),
    C('ru_ball_7d', 0x7d, P1(110, 0), [{ list: '2', clip: 'Motion[56]', variant: v(0x7d), len: 200 }]),
    // the lump thrown: L9 M2 f85 (mode 0), L9 M10 f104 (mode 1); it lands and sits out its life (u 20 at its end)
    C('ru_throw_f1', 0xf1, P1(85, 0), [{ list: '9', clip: 'Motion[2]', variant: v(0xf1), len: 150 }]),
    C('ru_throw_fa', 0xfa, P1(104, 0), [{ list: '9', clip: 'Motion[10]', variant: v(0xfa), len: 170 }], { owner: [0, 0xd123, 0] }),
    // L9 M3 places one and rolls it at 32: mode 8 / 7 (the turn) / 2 (the Y clamp, -30..30)
    C('ru_roll_ed', 0xed, P0, [{ list: '9', clip: 'Motion[3]', variant: v(0xed), len: 120 }], { conv: ['f34a20', [8]] }),
    C('ru_roll_ee', 0xee, P0, [{ list: '9', clip: 'Motion[3]', variant: v(0xee), len: 120 }], { conv: ['f34a20', [7]], owner: [0, 0x7300, 0] }),
    C('ru_roll_f5', 0xf5, P0, [{ list: '9', clip: 'Motion[3]', variant: v(0xf5), len: 120 }], { conv: ['f34a20', [2]] }),
    // the target inside the clamp: the aim's own Y, from the owner's point (flag 4 clear)
    C('ru_roll_f5_aim', 0xf5, P0, [{ list: '9', clip: 'Motion[3]', variant: v(0xf5), len: 120 }], { conv: ['f34a20', [2]], target: [1400.0, 40.0, 300.0] }),
    // thrown on L9 M2, then rolled by L9 M3 (the held one: nothing placed)
    C('ru_throw_roll', 0xf1, P1(85, 0), [{ list: '9', clip: 'Motion[2]', variant: v(0xf1), len: 150 }, { list: '9', clip: 'Motion[3]', variant: v(0xed), len: 120 }],
      { conv: ['f34a20', [8]] }),
    // L9 M10 under (7, 0xe5): placed at 182, lifted at 184 onto joint 15, thrown by L9 M11 at 59, bursting on the floor
    C('ru_lift_e5', 0xe5, P0, [{ list: '9', clip: 'Motion[10]', variant: v(0xe5), len: 220 }, { list: '9', clip: 'Motion[11]', variant: v(0xf6), len: 120 }],
      { conv: ['f34b4c', []], hold: true }),
  ];
  for (const c of cases) c.folders = F061;

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
                 timer: sh.base === 'base13' ? sh.lifetime : sh.base === 'base24' ? sh.life : sh.timer });
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
  const dir = mkdtempSync(join(tmpdir(), 'rushells-'));
  const runEmu = list => {
    writeFileSync(join(dir, 'cases.json'), JSON.stringify(list));
    const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
    if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_fb.py failed'); }
    return JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));
  };
  const ROM = runEmu(cases.map(c => emuCase(c, JS.get(c.name))));

  const eq = (a, b) => a === b || (a !== a && b !== b);
  const eqv = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => eq(f(v), f(b[i])));
  const BASE = { 0x108: 'base00', 0x109: 'base01', 0x10a: 'base13', 0x10b: 'base19', 0x10c: 'base24' };
  const FULL = new Set(['base00', 'base13', 'base19', 'base24']);
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
  // the chain reached its last link where it should: the lift's burst (sp_01 1, sp_00 23 / 24 / 25), the rolls' balls
  {
    const J = JS.get('ru_lift_e5'), all = [...J.info.values()].map(I => I.S.shell + ':' + I.S.modeIndex);
    ok(JSON.stringify(all) === '["shell24:1","shell13:0","shell01:1","shell00:23","shell00:24","shell00:25"]', 'ru_lift_e5 makes the lump, the lifted lump and its burst', JSON.stringify(all));
    const R = JS.get('ru_throw_roll'), r = [...R.info.values()].map(I => I.S.shell + ':' + I.S.modeIndex);
    ok(JSON.stringify(r) === '["shell24:0","shell19:8"]', 'ru_throw_roll rolls the thrown lump (nothing placed)', JSON.stringify(r));
  }

  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em061_04', '9', 'Motion[3]') === '["7:0xed","7:0xee","7:0xf5"]', 'L9 M3 picks the three rolls', pv('em061_04', '9', 'Motion[3]'));
  ok(pv('em061_04', '9', 'Motion[10]') === '["7:0xfa","7:0xe5"]', 'L9 M10 picks the throw and the lift', pv('em061_04', '9', 'Motion[10]'));
  ok(pv('em061_04', '2', 'Motion[28]') === '["7:0x46","7:0x4d","7:0x4f","7:0xe6"]', 'L2 M28 picks its four', pv('em061_04', '2', 'Motion[28]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['ru_rock_e6', { joints: { 0: J0, 9: J0b, 14: J50, 15: J150 } }, 'another joint 14'],
    ['ru_throw_f1', { owner: [0, 0x3001, 0] }, 'the facing one word off (the lump)'],
    ['ru_throw_fa', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the lump lands)'],
    ['ru_roll_f5_aim', { target: [1400.0, 40.0, 320.0] }, 'the target moved (the clamped aim)'],
    ['ru_lift_e5', { joints: { 0: J0, 9: J0b, 14: J140, 15: J50 } }, 'another joint 15 (the hold)'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Rustrum shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em061_04';
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
    await pick('2', 'Motion[28]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.key === 0 && x.req), 'L2 M28: a rock, shell00, u 0 started', w);
  }
  {
    await pick('9', 'Motion[2]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell24'));
    check(w.some(x => x.shell === 'shell24' && x.mode === 0 && x.key === 60 && x.req), 'L9 M2: the lump thrown, shell24 0, u 60 started', w);
  }
  {
    await pick('9', 'Motion[3]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell19'));
    check(w.some(x => x.shell === 'shell19' && x.key === 50 && x.req), 'L9 M3: the lump rolled, shell19, u 50 started', w);
  }
  const S = body().schedule;
  for (const key of [0, 1, 2, 10, 11, 12, 14, 15, 16, 17, 20, 40, 50, 51, 60]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === MON + 'u' && x.def.record.key === key);
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
