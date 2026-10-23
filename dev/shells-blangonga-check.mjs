// Blangonga's (em022_00) shells in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers (the Congalala / Zinogre harness's machine), the getters answered with em022_00.arc's shell files. The setups are the
//      class's OWN CODE run on the ROM at the row's frame (the frame test 0xb0974 answering 1 for that frame alone): the throw
//      0xddd6dc(e, kind, sub) (L2 M12 / M14 frame 100) and 0xddd840(e, sub) (L2 M8 frame 98). Each shell is flown from the setup the
//      ROM built (the class DTI's `new`, the base's init with the class's reader, the move) -- the shell13 lob through base13 to its
//      contact, and the three shell00 its landing 0xde1420 / burst 0xde14ac make from the setups the ROM built for them; every init /
//      move / effect start compared bit for bit (float32) to the end.
//   2. The contract: the pick lists, the named refusal of (7, 0x18)'s mode 14, the motion end of shell01.
//   3. CONTROLS: a wrong target height, a wrong facing, a wrong joint, a moved floor, a wrong owner point must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): L2 M12 / L2 M8 spawn their shells on the body's runtime
//      and start their records; every exported shell record (u 0, 10, 30..33, 40..43) starts and runs out with no refusal.
//
//   node dev/shells-blangonga-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-blangonga-check.mjs         (4: the viewer)
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
    ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10,
    joints: { 0: J0, 130: J140 } }, x);
  const fr = (fn, frames, x = {}) => frames.map(F => Object.assign({ fn, frame: F }, x));
  const F022 = { 0xa4: ['em022_00', '00'], 0xa5: ['em022_00', '01'], 0xa6: ['em022_00', '13'] };
  const cases = [
    // the throw 0xddd6dc(e, kind, sub): kind 1 sub 0..2 -> 0..2, kind 2 -> 3..5, kind 4 sub 1 / 2 -> 8 / 9, kind 5 -> 12 / 13
    C('bl_lob_0', 'em022_00', '2', 'Motion[12]', '7:0x05', fr('ddd6dc', [100], { args: [1, 0], phase: 1 }), { len: 140 }),
    C('bl_lob_1', 'em022_00', '2', 'Motion[12]', '7:0x08', fr('ddd6dc', [100], { args: [1, 1], phase: 1 }), { len: 140, owner: [0, 0xb123, 0] }),
    C('bl_lob_2', 'em022_00', '2', 'Motion[12]', '7:0x09', fr('ddd6dc', [100], { args: [1, 2], phase: 1 }), { len: 140, target: [-700.0, 260.0, 1900.0] }),
    C('bl_lob_3', 'em022_00', '2', 'Motion[12]', '7:0x0d', fr('ddd6dc', [100], { args: [2, 0], phase: 1 }), { len: 140 }),
    C('bl_lob_4', 'em022_00', '2', 'Motion[12]', '7:0x0e', fr('ddd6dc', [100], { args: [2, 1], phase: 1 }), { len: 140, ownerPos: [-410.25, 60.5, 330.0] }),
    C('bl_lob_5', 'em022_00', '2', 'Motion[12]', '7:0x0f', fr('ddd6dc', [100], { args: [2, 2], phase: 1 }), { len: 140, owner: [0, 0x6a00, 0] }),
    C('bl_lob_8', 'em022_00', '2', 'Motion[12]', '7:0x1c', fr('ddd6dc', [100], { args: [4, 1], phase: 1 }), { len: 140 }),
    C('bl_lob_9', 'em022_00', '2', 'Motion[12]', '7:0x1d', fr('ddd6dc', [100], { args: [4, 2], phase: 1 }), { len: 140, target: [300.0, -20.0, 900.0] }),
    C('bl_lob_12', 'em022_00', '2', 'Motion[12]', '7:0x1e', fr('ddd6dc', [100], { args: [5, 1], phase: 1 }), { len: 140, owner: [0, 0xe400, 0] }),
    C('bl_lob_13', 'em022_00', '2', 'Motion[12]', '7:0x1f', fr('ddd6dc', [100], { args: [5, 2], phase: 1 }), { len: 140 }),
    // a tilted owner (the X / Z words turn the first point, 0x43ae70) and a target below the start (the drop not clamped)
    C('bl_lob_0_tilt', 'em022_00', '2', 'Motion[12]', '7:0x05', fr('ddd6dc', [100], { args: [1, 0], phase: 1 }), { len: 140, owner: [0x0400, 0x3000, 0xfe00], target: [900.0, -300.0, 2400.0], floorY: -350.0, ground: -350.0 }),
    // 0xddd840(e, sub) at L2 M8 98: sub 0 -> shell01 0, sub 2 -> 1
    C('bl_s01_0', 'em022_00', '2', 'Motion[8]', '7:0x07', fr('ddd840', [98], { args: [0], phase: 1 }), { len: 120 }),
    C('bl_s01_1', 'em022_00', '2', 'Motion[8]', '7:0x0c', fr('ddd840', [98], { args: [2], phase: 1 }), { len: 120, owner: [0, 0x7777, 0] }),
  ];
  for (const c of cases) c.folders = F022;

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'blshells-'));
  writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases.map(c => ({ name: c.name, mon: c.mon, folders: c.folders, variant: 0, owner: c.owner,
    ownerPos: c.ownerPos, target: c.target, floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, charged: !!c.charged,
    rage: !!c.rage, severed: !!c.severed, rank: c.rank, quest: c.quest, unstub: c.unstub || [], owner_bytes: c.owner_bytes || null, block: c.block || null,
    joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: 460 }))));
  const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_fb.py failed'); }
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
      const out = S.stepShells(st, { monId: x.mon, list: x.list, clip: x.clip, frame: x.loop ? k % (x.len + 1) : Math.min(k, x.len), joints: J, rage: !!x.rage,
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
                 anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0), timer: sh.base === 'base13' ? sh.lifetime : sh.timer });
      }
      for (const { shell: sh, start } of out.started){ const I = info.get(sh.id); if (I) I.starts.push(start); }
    }
    return { info, snaps, refused, state: st };
  }
  const eq = (a, b) => a === b || (a !== a && b !== b);
  const eqv = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => eq(f(v), f(b[i])));
  const BASE = { 0xa4: 'base00', 0xa5: 'base01', 0xa6: 'base13' };
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
    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);
      if (!s){ if (fr.state >= 0xfe && L.length && L[L.length - 1].state >= 0xfe) break; return 'no module move ' + fr.k + ' (ROM state ' + fr.state + ')'; }
      if (s.state !== fr.state) return 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state;
      if (fr.state === 0xff) break;
      if (!eqv(s.pos, fr.pos)) return 'move ' + fr.k + ' position ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos);
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
  const shells = (c, over) => [...runJS(c, over).info.values()].map(I => I.S.shell + ':' + I.S.modeIndex);
  ok(pv('em022_00', '2', 'Motion[12]') === '["7:0x05","7:0x08","7:0x09","7:0x0d","7:0x0e","7:0x0f","7:0x1c","7:0x1d","7:0x1e","7:0x1f"]',
     'L2 M12 picks the ten lobs', pv('em022_00', '2', 'Motion[12]'));
  ok(pv('em022_00', '2', 'Motion[8]') === '["7:0x07","7:0x0c"]', 'L2 M8 picks shell01 0 / 1', pv('em022_00', '2', 'Motion[8]'));
  {
    // (7, 0x18): L2 M14's lob is mode 14, past the file's 14 modes -- refused by name, nothing made
    const J = runJS(Object.assign({}, byName('bl_lob_0'), { list: '2', clip: 'Motion[14]', variant: null }));
    ok(J.info.size === 0 && J.refused.length === 1 && /past the file's 14 modes/.test(J.refused[0].why), 'L2 M14 (7, 0x18): mode 14 refused by name', J.refused);
  }
  {
    // shell01's +0x150 0xde1138: it ends on the move its owner's motion is no longer L2 M8 (hit slots on, so only the motion ends it)
    const st = S.createShellState('em022_00'), Jf = g => (g === 130 ? J140 : J0);
    const inp = (clip, k) => ({ monId: 'em022_00', list: '2', clip, frame: k, joints: Jf, rock: { variant: '7:0x07', target: { x: 0, y: 0, z: 1500 }, floorY: 0 },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, hitLife: true });
    let made = null, endedAt = null;
    for (let k = 0; k <= 110; k++){ const o = S.stepShells(st, inp('Motion[8]', k)); if (o.spawned.length) made = o.spawned[0]; }
    for (let k = 0; k < 5 && endedAt == null; k++){ const o = S.stepShells(st, inp('Motion[9]', k)); if (made && o.ended.includes(made)) endedAt = k; }
    ok(made && made.shell === 'shell01' && made.modeIndex === 0 && endedAt === 0, 'shell01 0 ends on the first move after L2 M8 gives way to L2 M9', { made: !!made, endedAt });
    // the loop (frames 96..141, loopStart 96) passes 98 on every wrap: one shell01 an action (+0x1a3)
    const st2 = S.createShellState('em022_00');
    let n = 0;
    for (let k = 0; k < 142 + 46 * 3; k++){
      const F = k < 142 ? k : 96 + (k - 142) % 46;
      n += S.stepShells(st2, Object.assign(inp('Motion[8]', F), { loopStart: 96 })).spawned.length;
    }
    ok(n === 1, 'L2 M8\'s loop: one shell01 an action, not one a wrap', n);
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    // (a target above the start is clamped away -- the drop is <= 0 -- so the height control is the tilted case's, below it)
    ['bl_lob_0_tilt', { target: [900.0, -299.0, 2400.0] }, 'the target 1 higher (the thrown point\'s height, the drop)'],
    ['bl_lob_1', { owner: [0, 0xb124, 0] }, 'the facing one word off'],
    ['bl_lob_4', { ownerPos: [-410.25, 61.5, 330.0] }, 'the owner 1 higher'],
    ['bl_lob_0', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the contact, the burst)'],
    ['bl_s01_0', { joints: { 0: J0, 130: J50 } }, 'another joint 130'],
    ['bl_lob_0_tilt', { owner: [0x0401, 0x3000, 0xfe00] }, 'the X word one off (the first point\'s turn)'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Blangonga shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em022_00';
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
  check(await open(), 'his runtime is up');
  {
    await pick('2', 'Motion[12]');
    const w = await watch(300, x => x.some(y => y.shell === 'shell00'));
    const lob = w.find(x => x.shell === 'shell13'), kids = w.filter(x => x.shell === 'shell00' && x.child);
    check(lob && lob.key !== undefined && lob.req, 'L2 M12: a lob, shell13, its record started', w);
    check(kids.length === 3 && kids.every(x => x.req), 'its contact bursts into three shell00, their records started', kids);
  }
  {
    // frame 98 is in the motion's loop: the _loop piece (frames 96.. of the motion; the _start alone replays and never reaches it)
    await pick('2', 'Motion[8]_loop');
    const w = await watch(240, x => x.some(y => y.shell === 'shell01'));
    check(w.some(x => x.shell === 'shell01' && (x.mode === 0 || x.mode === 1) && x.req), 'L2 M8: shell01 0 / 1 (u 0 / u 10) started', w);
  }
  for (const key of [0, 10, 30, 31, 32, 33, 40, 41, 42, 43]){
    const S = body().schedule, e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em022_00u' && x.def.record.key === key);
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
