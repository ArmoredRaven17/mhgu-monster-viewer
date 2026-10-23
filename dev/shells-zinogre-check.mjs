// Zinogre's (em057_00) and Thunderlord's (em057_04) shells in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/zs/emu_zinogre.py (env ZINOGRE_EMU overrides) -- the whole executable on unicorn after its
//      static initialisers (the Seltas harness's machine), the getters answered with em057_00.arc's / em057_04.arc's shell files and
//      Thunderlord's actiontune. The setups are the class's OWN CODE run on the ROM, once per frame the row crosses (the frame test
//      0xb0974 answering 1 for that frame alone): the leap spawners 0xf00590 / 0xf010e8(e, kind, which), the escorts' 0xeefc34(e, k),
//      the strike spawner 0xef870c(e, k), the ray bodies 0xefa834 / 0xefd50c (phase 1) and 0xefc044, the bodies 0xef9554 (L2 M30),
//      0xefae84 (L9 M1), 0xefb470 (L9 M4 / M5) and 0xef67a0 (L2 M15) at their phase. Each shell is flown from the setup the ROM built
//      (its ctor, the base's init with the class's reader, the move), and every shell a move makes -- a landing's shell01, an end's
//      shell11, a shell11's shell01s -- from the setup the ROM built for it. Each case runs through stepShells as the viewer steps the
//      row's clip, and every shell -- its init (point, velocity, words, timer), every move's state / position / velocity / anchor /
//      words / timer, the effect starts (keys and points), its children and theirs -- is compared bit for bit (float32) to the end.
//      No hit registration on either side (input.hitLife false; the harness hooks 0x4a1ad8): a timer-0 shell01 ends at its first move.
//   2. The contract: the pick lists, the gates (charged, enraged, the tail, the rank), the refusals.
//   3. CONTROLS: a wrong target, a wrong heading, a wrong joint, a wrong facing, a moved floor, a wrong size must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): Zinogre's L2 M31 / L0 M20 and Thunderlord's L2 M31 / L9 M5
//      spawn their shells on the body's runtime and start their records.
//
//   node dev/shells-zinogre-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-zinogre-check.mjs         (4: the viewer)
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
  const EMU = process.env.ZINOGRE_EMU ||
    'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/zs/emu_zinogre.py';
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
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const C = (name, mon, list, clip, variant, steps, x = {}) => Object.assign({ name, mon, list, clip, variant, steps, owner: OW,
    ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10,
    joints: { 0: J0, 40: J40, 50: J50, 145: J145 } }, x);
  const fr = (fn, frames, x = {}) => frames.map(F => Object.assign({ fn, frame: F }, x));
  const T4 = { charged: true };
  const cases = [
    // ZINOGRE
    C('z_leap_k0_m31', 'em057_00', '2', 'Motion[31]', '7:0x20', fr('f00590', [88], { args: [0, 0] }), { len: 120 }),
    C('z_leap_k1_m31_charged', 'em057_00', '2', 'Motion[31]', '7:0x69', fr('f00590', [88], { args: [1, 0] }), { len: 120, charged: true }),
    C('z_leap_k2_m32_aim', 'em057_00', '2', 'Motion[32]', '7:0x3d', fr('f00590', [58], { args: [2, 1] }),
      { len: 90, owner: [0xfe00, 0xa123, 0x0040], target: [-1500.0, 600.0, 600.0] }),
    C('z_escort_m15_charged', 'em057_00', '2', 'Motion[15]', null, fr('eefc34', [117], { args: [0] }), { len: 140, charged: true }),
    C('z_escort_m26', 'em057_00', '2', 'Motion[26]', null, fr('eefc34', [72], { args: [3] }), { len: 100, owner: [0, 0x5a5a, 0] }),
    C('z_escort_m38_m37', 'em057_00', '2', 'Motion[37]', null, fr('eefc34', [138], { args: [6] }), { len: 160, charged: true }),
    // the size (0x80: the offset turned, THEN scaled -- base00's own order) and a base scale (the strikes' 0xbec34)
    C('z_escort_m26_size', 'em057_00', '2', 'Motion[26]', null, fr('eefc34', [72], { args: [3] }),
      { len: 100, owner: [0, 0x1357, 0], size: [1.1, 0.95], target: [-700.0, 300.0, 1200.0] }),
    C('z_strike_size', 'em057_00', '0', 'Motion[20]', null, [66, 106].map((F, k) => ({ fn: 'ef870c', args: [k], frame: F })),
      { len: 120, action: [7, 0x71], size: [1.2, 1.0], base: 1.1 }),
    C('z_strike', 'em057_00', '0', 'Motion[20]', null, [66, 106, 136, 156, 176, 186, 196, 206, 216, 226, 236, 246].map((F, k) => ({ fn: 'ef870c', args: [k], frame: F })),
      { len: 280, action: [7, 0x71], owner: [0, 0x7123, 0] }),
    C('z_ray_m60', 'em057_00', '2', 'Motion[60]', null, fr('efa834', [18], { args: [0, 0], phase: 1 }), { len: 60 }),
    C('z_ray_m2', 'em057_00', '2', 'Motion[2]', null, fr('efd50c', [57], { args: [1], phase: 1 }), { len: 90, action: [7, 0xfc] }),
    // THUNDERLORD
    C('t_leap_k0_m31', 'em057_04', '2', 'Motion[31]', '7:0x20', fr('f010e8', [88], { args: [0, 0] }), { len: 120, variant4: true }),
    C('t_leap_k2_m32_charged', 'em057_04', '2', 'Motion[32]', '7:0x3d', fr('f010e8', [58], { args: [2, 1] }), { len: 90, charged: true, owner: [0, 0xc000, 0] }),
    C('t_leap_k3_m32_charged', 'em057_04', '2', 'Motion[32]', '7:0x7a', fr('f010e8', [58], { args: [3, 1] }), { len: 90, charged: true }),
    C('t_trio_m15', 'em057_04', '2', 'Motion[15]', null, fr('ef67a0', [116, 122, 128], { args: [0, 0], phase: 1 }), { len: 140, charged: true }),
    C('t_strike_charged', 'em057_04', '0', 'Motion[20]', null, [2, 32, 62, 92, 122, 152, 172, 192, 216, 226, 236, 246].map((F, k) => ({ fn: 'ef870c', args: [k], frame: F })),
      { len: 280, action: [7, 0x71], charged: true }),
    C('t_strike', 'em057_04', '0', 'Motion[20]', null, [66, 106, 136].map((F, k) => ({ fn: 'ef870c', args: [k], frame: F })), { len: 140, action: [7, 0x71] }),
    C('t_ray_m60_rage', 'em057_04', '2', 'Motion[60]', '7:0xa6', fr('efa834', [18], { args: [0, 0], phase: 1 }), { len: 60, charged: true, rage: true }),
    C('t_ray_m1_c044', 'em057_04', '2', 'Motion[1]', null, fr('efc044', [57], { args: [0] }), { len: 90, charged: true, action: [7, 0xe9] }),
    C('t_ray_m2_d50c', 'em057_04', '2', 'Motion[2]', null, fr('efd50c', [57], { args: [1], phase: 1 }), { len: 90, charged: true, action: [7, 0xfc] }),
    C('t_m30', 'em057_04', '2', 'Motion[30]', null, fr('ef9554', [82], { args: [0], phase: 1 }), { len: 100, charged: true, rage: true }),
    C('t_l9m1', 'em057_04', '9', 'Motion[1]', null, fr('efae84', [266, 278], { phase: 1 }), { len: 300, action: [7, 0xe3] }),
    C('t_l9m4', 'em057_04', '9', 'Motion[4]', null, fr('efb470', [2], { args: [1], phase: 1 }), { len: 170, charged: true }),
    C('t_l9m5', 'em057_04', '9', 'Motion[5]', null, fr('efb470', [204, 216], { args: [1], phase: 2 }), { len: 230, action: [7, 0xdb] }),
    // THE HEADING CARRIED: an L2 M60 play (its first update writes [+0xcac0]+0x18 from the target, 0xef93d8 run natively), then an
    // L2 M32-only leap (7, 0x7a) that reads it -- the viewer's two plays in that order
    C('t_heading_m60_then_m32', 'em057_04', '2', 'Motion[32]', '7:0x7a', [{ fn: 'efa834', args: [0, 0], phase: 0 }].concat(fr('f010e8', [58], { args: [3, 1] })),
      { len: 90, charged: true, target: [-700.0, 40.0, 900.0], unstub: ['0xef93d8'], pre: { list: '2', clip: 'Motion[60]', variant: '7:0xa8', len: 70 } }),
  ];
  for (const c of cases) c.variant4 = c.mon === 'em057_04';

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'zinogre-'));
  writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases.map(c => ({ name: c.name, variant: c.variant4 ? 4 : 0, owner: c.owner,
    ownerPos: c.ownerPos, target: c.target, floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, charged: !!c.charged,
    rage: !!c.rage, severed: !!c.severed, rank: c.rank, quest: c.quest, unstub: c.unstub || [],
    joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: 460 }))));
  const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_zinogre.py failed'); }
  const ROM = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));

  // ---- the module ---------------------------------------------------------------------------------------------------------------
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
    for (let k = 0; k <= x.len + 460; k++){
      const out = S.stepShells(st, { monId: x.mon, list: x.list, clip: x.clip, frame: Math.min(k, x.len), joints: J, rage: !!x.rage,
        rock: { variant: x.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: false, rank: x.rank, questLevel: x.quest, charged: !!x.charged,
        action: x.action, tailSevered: !!x.severed });
      for (const r of out.refused) refused.push(r);
      for (const sh of out.spawned) if (!pre.has(sh.id)) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });
      for (const sh of out.spawned) if (sh.creator != null && info.has(sh.creator)) info.get(sh.creator).children.push(sh.id);
      for (const sh of out.alive.concat(out.ended, out.removed)){
        const I = info.get(sh.id); if (!I) continue;
        const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
        if (L.length && L[L.length - 1].moves === sh.moves) continue;
        L.push({ moves: sh.moves, state: sh.state, pos: sh.position && sh.position.slice(), vel: sh.velocity && sh.velocity.slice(),
                 anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0), timer: sh.timer });
      }
      for (const { shell: sh, start } of out.started){ const I = info.get(sh.id); if (I) I.starts.push(start); }
    }
    return { info, snaps, refused, state: st };
  }
  const eq = (a, b) => a === b || (a !== a && b !== b);
  const eqv = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => eq(f(v), f(b[i])));
  const BASE = { 0xf7: 'base01', 0xf9: 'base01', 0xfa: 'base11', 0xf8: 'base18', 0xfb: 'base18' };
  function diffShell(R, I, snaps, base){
    const S0 = I.S, L = snaps.get(S0.id) || [];
    if (!R.init) return 'the ROM init deleted it, the module made it';
    const sp = R.spawn;
    if (base === 'base18'){
      const ln = S0.launch;
      if (!eqv(ln.position || ln.point, sp.pos)) return 'init position ' + JSON.stringify(ln.position || ln.point) + ' vs ROM ' + JSON.stringify(sp.pos);
      if (!eqv(ln.velocity, sp.vel)) return 'init velocity ' + JSON.stringify(ln.velocity) + ' vs ROM ' + JSON.stringify(sp.vel);
      if (!eqv(S0.gravity, sp.acc)) return 'gravity ' + JSON.stringify(S0.gravity) + ' vs ' + JSON.stringify(sp.acc);
      if (!eqv(ln.angles.map(w => w & 0xffff), sp.ang.map(w => w & 0xffff))) return 'init words ' + JSON.stringify(ln.angles) + ' vs ROM ' + JSON.stringify(sp.ang);
      if (!eq(f(ln.timer), f(sp.timer))) return 'init timer ' + ln.timer + ' vs ' + sp.timer;
    }
    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);
      if (!s){ if (fr.state >= 0xfe && L.length && L[L.length - 1].state >= 0xfe) break; return 'no module move ' + fr.k + ' (ROM state ' + fr.state + ')'; }
      if (s.state !== fr.state) return 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state;
      if (fr.state === 0xff) break;
      if (!eqv(s.pos, fr.pos)) return 'move ' + fr.k + ' position ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos);
      if (base === 'base18'){
        if (!eqv(s.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(s.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
        if (!eqv(s.anchor, fr.anchor)) return 'move ' + fr.k + ' anchor';
        if (!eq(f(s.timer), f(fr.timer)) && s.state === 1) return 'move ' + fr.k + ' timer ' + s.timer + ' vs ' + fr.timer;
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
    const isLive = s => !!s.run && !!s.run.init && s.run.spawn.state === 1;
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
  ok(pv('em057_00', '2', 'Motion[31]') === '["7:0x20","7:0x69","7:0x3d"]', 'L2 M31 picks the three leap kinds', pv('em057_00', '2', 'Motion[31]'));
  ok(pv('em057_04', '2', 'Motion[32]') === '["7:0x20","7:0x6b","7:0x3d","7:0x7a"]', 'L2 M32 picks the four kinds', pv('em057_04', '2', 'Motion[32]'));
  ok(pv('em057_00', '2', 'Motion[60]') === '[]' && pv('em057_04', '2', 'Motion[60]') === '["7:0xa6","7:0xa8"]', 'L2 M60: one Zinogre row, two Thunderlord picks');
  ok(pv('em057_00', '0', 'Motion[20]') === '[]' && pv('em057_00', '2', 'Motion[2]') === '[]', 'L0 M20 / L2 M2: no picks (the play\'s action, CLIP_ACTIONS)');
  const shells = (c, over) => [...runJS(c, over).info.values()].map(I => I.S.shell + ':' + I.S.modeIndex);
  const byName = n => cases.find(c => c.name === n);
  ok(shells(byName('z_strike'), { action: [1, 0x2d] }).length === 0, 'L0 M20 played as (1, 0x2d): no strikes');
  ok(shells(byName('z_ray_m2'), { action: [7, 0xea] }).length === 0, 'Zinogre L2 M2 as (7, 0xea): none (0xefc044 is Thunderlord charged only)');
  ok(shells(byName('t_m30'), { rage: false }).length === 0 && shells(byName('t_m30'), { severed: true }).length === 0,
     'Thunderlord L2 M30: none calm, none with the tail severed');
  ok(shells(byName('z_escort_m26'), { rank: 3 }).length === 0, 'Zinogre escorts: none below G (0x3a8430 < 5)');
  ok(shells(byName('t_trio_m15'), { charged: false }).length === 0, 'Thunderlord L2 M15 uncharged: no trio');
  ok(shells(byName('t_l9m1'), { rank: 3 }).join() === 'shell01:14,shell01:38', 'L9 M1 below G: shell01 14 / 38', shells(byName('t_l9m1'), { rank: 3 }).join());
  {
    const J = runJS(byName('z_leap_k0_m31'));
    ok(J.refused.length === 0, 'no refusal on a leap with every input', JSON.stringify(J.refused[0] || ''));
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['z_leap_k2_m32_aim', { target: [-1500.0, 640.0, 600.0] }, 'the target 40 higher (the X aim)'],
    ['z_leap_k0_m31', { owner: [0, 0x3001, 0] }, 'the heading one word off'],
    ['z_escort_m26', { owner: [0, 0x5a5b, 0] }, 'the facing one word off (the owner turn of the offset)'],
    ['z_escort_m15_charged', { size: [1.1, 1.0] }, 'the size 1.1 (0x80)'],
    ['z_ray_m60', { joints: { 0: J0, 40: J50, 50: J50, 145: J145 } }, 'another joint 40'],
    ['z_strike', { floorY: 5.0, ground: 5.0 }, 'the floor 5 higher (the snap)'],
    ['t_m30', { joints: { 0: J0, 40: J40, 50: J50, 145: J40 } }, 'another joint 145'],
    ['t_leap_k0_m31', { floorY: -2.0, ground: -2.0 }, 'the floor 2 lower (the landing)'],
    ['t_heading_m60_then_m32', { pre: null }, 'no L2 M60 play before (the clip-start yaw)'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Zinogre shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const open = async MON => {
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
    for (const s of (st ? st.shells : [])) OLD.add(s.id);
    clipSel.value = o.value; await clipSel.onchange();
    return true;
  };
  const watch = async (n, stop) => {
    const seen = new Map();
    for (let i = 0; i < n; i++){
      await frames(1);
      const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
      for (const s of (st ? st.shells : [])){
        if (seen.has(s.id) || OLD.has(s.id)) continue;
        seen.set(s.id, { shell: s.shell, mode: s.modeIndex, action: s.action ? s.action.map(x => x.toString(16)).join(':') : null,
                         key: s.start && s.start.key, req: !!s.request, child: s.creator != null });
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  check(await open('em057_00'), 'Zinogre: his runtime is up');
  {
    await pick('2', 'Motion[31]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell18'));
    const s18 = w.filter(x => x.shell === 'shell18');
    check(s18.length >= 1 && s18.every(x => x.key === 0 && x.req), 'L2 M31: a leap\'s shell18 (a thunderbug), u 0 started', w);
  }
  {
    // L0 M20's plays are (1, 0x2d) / (7, 0x71) in turn (psl-mask.js CLIP_ACTIONS): one play of each, the strikes on (7, 0x71)'s
    const counts = [];
    for (let play = 0; play < 2; play++){
      await pick('0', 'Motion[20]');
      const w = await watch(320, x => x.filter(y => y.shell === 'shell01' && !y.child).length >= 12);
      counts.push(w.filter(x => x.shell === 'shell01' && !x.child && x.action === '7:71' && x.key === 60 && x.req).length);
    }
    check(counts.slice().sort().join() === '0,12', 'L0 M20: (1, 0x2d) none, (7, 0x71) twelve strikes with u 60 (one play each)', counts);
  }
  check(await open('em057_04'), 'Thunderlord: his runtime is up');
  {
    await pick('2', 'Motion[31]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell18'));
    const s18 = w.filter(x => x.shell === 'shell18');
    check(s18.length >= 2 && s18.every(x => (x.key === 10 || x.key === 0) && x.req), 'L2 M31: his thunderbugs, u 10 / u 0 started', w);
  }
  {
    await pick('9', 'Motion[5]');
    const w = await watch(400, x => x.filter(y => y.shell === 'shell01' && !y.child).length >= 2);
    const s01 = w.filter(x => x.shell === 'shell01' && !x.child);
    check(s01.length === 2 && s01.map(x => x.mode).join() === '43,44' && s01[0].key === 220 && s01[0].req, 'L9 M5 (7, 0xdb): shell01 43 (u 220) / 44', w);
  }
  return out;
}
