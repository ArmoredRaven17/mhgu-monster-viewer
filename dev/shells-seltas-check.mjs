// The Seltas Queen's (em069_00) and Seltas's (em076_00) shells in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/seltas/emu_seltas.py (env SELTAS_EMU overrides) -- the whole executable on unicorn after its
//      static initialisers (sw37/emu37.py's machine), the getters answered with em069_00.arc's / em076_00.arc's shell files. The
//      setups are the classes' OWN ACTION CODE run on the ROM, once per frame the row crosses (the frame test 0xb0974 answering 1
//      for that frame alone): hers 0xf938c0 (7, 0x09), 0xf954f4 (7, 0x38, the link bit), 0xf8f5bc (1, 0x20), 0xf92d40 (4, 0x04),
//      0xf91bdc (2, 0x14) / 0xf91638 (2, 0x11) on their landing, 0xf92358 (6, 0x00), 0xf9514c (7, 0x36) at L4 M4's end; his 0xfd4924
//      (the spit's aim) then 0xfd4b00(e, 0 / 2) at 68 / 88 / 96, 0xfd1e98 (7, 0x02), 0xfd2ce0 (7, 0x07), 0xfd4eb0 (7, 0x39), 0xfd5350
//      (7, 0x3a) -- the action state between the calls (P+0x1a2, P+0x30.., [+0xcac0]+6) the ROM's own. Each shell is then flown from
//      the setup the ROM built (its ctor, the base's init with the class's own reader, the move), and a shell01 a landing makes from
//      the setup the ROM's landing built. Each case runs through stepShells as the viewer steps the row's clip, and every shell --
//      its init (point, velocity, acceleration, words, timer), every move's state / position / velocity / anchor / words / timer, the
//      effect starts (keys and points), the children (their init and moves) -- is compared bit for bit (float32) to the end.
//      No hit registration on either side (input.hitLife false; the harness hooks 0x4a1ad8): a timer-0 shell01 ends at its first move.
//   2. The contract: the pick lists, the rows' gates (the link bit: none unlinked), the duo pick (named only), the refusals.
//   3. CONTROLS: a wrong target, a wrong joint, a wrong facing, a wrong link yaw must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): solo Seltas's L2 M17 / L4 M33 / L4 M34 and solo Queen's L4 M42 /
//      M20 / M26 spawn their shells on the body's runtime and start their records; on her combined list ('duo') his 7:0x3f spits come
//      from HIS runtime at HIS joint 144 (two a crossing), her 7:0x4f spits after his flag from hers, and her (7, 0x38) spit fires
//      linked.
//
//   node dev/shells-seltas-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-seltas-check.mjs         (4: the viewer)
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
  const EMU = process.env.SELTAS_EMU ||
    'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/seltas/emu_seltas.py';
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
  const J1 = jointOf(0.35, -0.25, 0.1, [140.5, 395.25, 160.75]);
  const J144 = jointOf(-0.3, 0.4, -0.15, [95.25, 330.5, 40.75]);
  const J144b = jointOf(1.2, -0.3, 0.2, [-60.0, 280.25, 210.5]);
  // her joint 200 as the link parent's (P+0x5c30, vt+0xd0): his yaw while mounted
  const J200 = jointOf(2.1, 0.15, -0.05, [0, 0, 0]);
  const RAD_TO_U16 = f(10430.3779296875);
  const linkWord = M => Math.trunc(f(f(0.5) + f(f(Math.atan2(M[8], M[10])) * RAD_TO_U16)));

  const OW = [0x0100, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 0.0, 2400.0];
  const C = (name, mon, list, clip, variant, steps, x = {}) => Object.assign({ name, mon, list, clip, variant, steps, owner: OW,
    ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0, size: [1.1, 0.95], base: 1.0, len: 360, joints: { 0: J0, 1: J1, 144: J144 } }, x);
  const fr = (fn, frames, x = {}) => frames.map(F => Object.assign({ fn, phase: 1, frame: F }, x));
  const cases = [
    // HER
    C('q_spit_7_09', 'em069_00', '4', 'Motion[42]', null, fr('f938c0', [100, 110, 120], { args: [0] }), { len: 353 }),
    C('q_spit_7_09_yaw', 'em069_00', '4', 'Motion[42]', null, fr('f938c0', [100, 110, 120], { args: [0] }),
      { len: 353, owner: [0xfe00, 0xa123, 0x0040], target: [-1500.0, 300.0, 600.0] }),
    C('q_spit_7_38_linked', 'em069_00', '4', 'Motion[20]', null, fr('f954f4', [42]), { len: 118, linked: true }),
    C('q_c31_1_20', 'em069_00', '4', 'Motion[24]', '1:0x20', fr('f8f5bc', [6], { phase: 2 }), { len: 47 }),
    C('q_c33_4_04', 'em069_00', '4', 'Motion[24]', '4:0x04', fr('f92d40', [2], { phase: 2 }), { len: 47 }),
    C('q_c32_2_14', 'em069_00', '4', 'Motion[24]', '2:0x14', [{ fn: 'f91bdc', phase: 2, landed: 1 }], { len: 47 }),
    C('q_c33_2_11', 'em069_00', '0', 'Motion[68]', null, [{ fn: 'f91638', phase: 2, landed: 1 }], { len: 177 }),
    C('q_c32_6_00', 'em069_00', '0', 'Motion[66]', '6:0x00', fr('f92358', [170], { args: [0] }), { len: 197 }),
    C('q_c31_7_36', 'em069_00', '4', 'Motion[26]', null, [{ fn: 'f9514c', phase: 1, ended: 1 }], { len: 187, owner: [0, 0x5555, 0] }),
    C('q_c31_high', 'em069_00', '4', 'Motion[26]', null, [{ fn: 'f9514c', phase: 1, ended: 1 }], { len: 187, ownerPos: [0.0, 900.5, 0.0] }),
    // HIS
    C('s_spit_7_34', 'em076_00', '4', 'Motion[33]', '7:0x34', [{ fn: 'fd4924' }].concat(fr('fd4b00', [68, 88, 96], { args: [0] })), { len: 115 }),
    C('s_spit_7_34_far', 'em076_00', '4', 'Motion[33]', '7:0x34', [{ fn: 'fd4924' }].concat(fr('fd4b00', [68, 88, 96], { args: [0] })),
      { len: 115, target: [200.0, 1500.0, -300.0], owner: [0, 0xc000, 0], joints: { 0: J0, 144: J144b } }),
    C('s_spit_7_3f_linked', 'em076_00', '4', 'Motion[33]', '7:0x3f', [{ fn: 'fd4924' }].concat(fr('fd4b00', [68, 88, 96], { args: [2] })),
      { len: 115, owner: [0, 0, 0], link: { matrix: J200, partner: true } }),
    C('s_lob_7_02', 'em076_00', '2', 'Motion[17]', '7:0x02', fr('fd1e98', [66, 84, 104], { args: [0] }), { len: 150 }),
    C('s_lob_7_02_near', 'em076_00', '2', 'Motion[17]', '7:0x02', fr('fd1e98', [66, 84, 104], { args: [0] }), { len: 150, target: [150.0, 0.0, 60.0] }),
    C('s_lob_7_07', 'em076_00', '2', 'Motion[57]', '7:0x07', fr('fd2ce0', [66, 82, 98], { args: [0] }), { len: 150, owner: [0, 0x2000, 0] }),
    C('s_lob_7_39', 'em076_00', '4', 'Motion[33]', '7:0x39', fr('fd4eb0', [66, 88, 96], { args: [0] }), { len: 115 }),
    C('s_lob_7_39_linked', 'em076_00', '4', 'Motion[33]', '7:0x39', fr('fd4eb0', [66, 88, 96], { args: [0] }),
      { len: 115, owner: [0, 0, 0], link: { matrix: J200, partner: true } }),
    C('s_lob_7_3a', 'em076_00', '4', 'Motion[34]', null, fr('fd5350', [66, 88, 96], { args: [0] }), { len: 185, target: [-3000.0, -200.0, 4000.0] }),
  ];

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'seltas-'));
  writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases.map(c => ({ name: c.name, owner: c.owner, ownerPos: c.ownerPos,
    target: c.target, floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, linked: !!c.linked, link: c.link || null,
    joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: 420 }))));
  const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_seltas.py failed'); }
  const ROM = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));

  // ---- the module ---------------------------------------------------------------------------------------------------------------
  function runJS(c, over = {}){
    const x = Object.assign({}, c, over);
    const st = S.createShellState(x.mon);
    const J = gid => x.joints[gid] || x.joints[0];
    const snaps = new Map(), info = new Map(), refused = [];
    const link = x.link ? { word: linkWord(x.link.matrix), partner: x.link.partner } : undefined;
    for (let k = 0; k <= x.len + 420; k++){
      const out = S.stepShells(st, { monId: x.mon, list: x.list, clip: x.clip, frame: Math.min(k, x.len), joints: J, rage: false,
        rock: { variant: x.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: false, rank: 5, linked: !!x.linked, link });
      for (const r of out.refused) refused.push(r);
      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });
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
  // compare one ROM shell run with one module shell; returns the first difference, or null
  function diffShell(R, I, snaps, base){
    const S0 = I.S, L = snaps.get(S0.id) || [];
    if (!R.init) return 'the ROM init deleted it, the module made it';
    const sp = R.spawn;
    if (base !== 'base01'){
      const ln = S0.launch;
      if (!eqv(ln.position || ln.point, sp.pos)) return 'init position ' + JSON.stringify(ln.position || ln.point) + ' vs ROM ' + JSON.stringify(sp.pos);
      if (!eqv(ln.velocity, sp.vel)) return 'init velocity ' + JSON.stringify(ln.velocity) + ' vs ROM ' + JSON.stringify(sp.vel);
      if (!eqv(S0.gravity, sp.acc) && base === 'base37') return 'gravity ' + JSON.stringify(S0.gravity) + ' vs ' + JSON.stringify(sp.acc);
      if (!eqv(ln.angles.map(w => w & 0xffff), sp.ang.map(w => w & 0xffff))) return 'init words ' + JSON.stringify(ln.angles) + ' vs ROM ' + JSON.stringify(sp.ang);
      if (!eq(f(ln.timer), f(sp.timer))) return 'init timer ' + ln.timer + ' vs ' + sp.timer;
    } else {
      // base01: the init's point and words (setup / snap / ground angles) -- the first move's position is the init's
    }
    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);
      // the ending's wait (state 0xfe: the handles and the 30 x 60 timer) has no moves of its own in the module: the end move matched
      if (!s){ if (fr.state >= 0xfe && L.length && L[L.length - 1].state >= 0xfe) break; return 'no module move ' + fr.k + ' (ROM state ' + fr.state + ')'; }
      if (s.state !== fr.state) return 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state;
      if (fr.state === 0xff) break;
      if (!eqv(s.pos, fr.pos)) return 'move ' + fr.k + ' position ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos);
      if (base !== 'base01'){
        if (!eqv(s.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(s.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
        if (!eqv(s.anchor, fr.anchor)) return 'move ' + fr.k + ' anchor';
        if (!eq(f(s.timer), f(fr.timer)) && s.state === 1) return 'move ' + fr.k + ' timer ' + s.timer + ' vs ' + fr.timer;
      }
      if (!eqv(s.ang.map(w => w & 0xffff), fr.ang.map(w => w & 0xffff))) return 'move ' + fr.k + ' words ' + JSON.stringify(s.ang) + ' vs ROM ' + JSON.stringify(fr.ang);
    }
    // the effect starts: the init's (ef 0) and every move's, in order -- (list, key) and the requester's point
    const romStarts = R.log.concat(...R.frames.map(x => x.log)).filter(e => e[0] === 'start');
    const jsStarts = (S0.start ? [S0.start] : []).concat(I.starts);
    if (romStarts.length !== jsStarts.length) return 'starts ' + jsStarts.length + ' vs ROM ' + romStarts.length + ' ' + JSON.stringify(romStarts.map(e => e.slice(1, 3)));
    for (let i = 0; i < romStarts.length; i++){
      const r = romStarts[i], q = jsStarts[i];
      if (r[1] !== q.listId || r[2] !== q.key) return 'start ' + i + ' (' + q.listId + ', ' + q.key + ') vs ROM (' + r[1] + ', ' + r[2] + ')';
      if (!eqv(q.requester.position, r[3])) return 'start ' + i + ' point ' + JSON.stringify(q.requester.position) + ' vs ROM ' + JSON.stringify(r[3]);
    }
    return null;
  }
  const BASE = { 0x127: 'base00', 0x128: 'base01', 0x139: 'base00', 0x13a: 'base01', 0x13b: 'base37' };
  function compare(c, over){
    const R = ROM[c.name], J = runJS(c, over);
    const mine = [...J.info.values()].filter(I => I.S.creator == null);
    // a shell the ROM's init deleted (base01's 900-above-the-ground test) is the module's named refusal
    // (base01's init returns 1 after deleting it -- 0x3fae84 vt+0x40, then `mov r7, #1` -- leaving the state byte 0)
    const isLive = s => !!s.run.init && s.run.spawn.state === 1;
    const live = R.shells.filter(isLive), dead = R.shells.length - live.length;
    const gone = J.refused.filter(r => /init deleted/.test(r.why || '')).length;
    if (dead !== gone) return { why: 'ROM init deleted ' + dead + ', the module refused ' + gone, J };
    if (mine.length !== live.length) return { why: 'shells ' + mine.length + ' vs ROM ' + live.length + (J.refused.length ? ' (refused ' + JSON.stringify(J.refused[0]) + ')' : ''), J };
    for (let i = 0; i < live.length; i++){
      const r = live[i], I = mine[i];
      if (I.S.globalId !== r.id || I.S.modeIndex !== r.mode) return { why: 'shell ' + i + ' id/mode ' + I.S.globalId + '/' + I.S.modeIndex + ' vs ROM ' + r.id + '/' + r.mode, J };
      const d = diffShell(r.run, I, J.snaps, BASE[r.id]);
      if (d) return { why: 'shell ' + i + ' (' + I.S.shell + ' ' + I.S.modeIndex + '): ' + d, J };
      const kids = r.run.children;
      if (kids.length !== I.children.length) return { why: 'shell ' + i + ' children ' + I.children.length + ' vs ROM ' + kids.length, J };
      for (let j = 0; j < kids.length; j++){
        const K = J.info.get(I.children[j]);
        if (K.S.globalId !== kids[j].id) return { why: 'shell ' + i + ' child ' + j + ' id', J };
        const setupMode = parseInt(kids[j].run.setup.slice(16, 18), 16);
        if (K.S.modeIndex !== setupMode) return { why: 'shell ' + i + ' child ' + j + ' mode ' + K.S.modeIndex + ' vs ROM ' + setupMode, J };
        const dk = diffShell(kids[j].run, K, J.snaps, BASE[kids[j].id]);
        if (dk) return { why: 'shell ' + i + ' child ' + j + ': ' + dk, J };
      }
    }
    return { why: null, J };
  }

  for (const c of cases){
    const R = ROM[c.name];
    const { why, J } = compare(c);
    const n = R.shells.length, kids = R.shells.reduce((a, s) => a + s.run.children.length, 0);
    const moves = R.shells.reduce((a, s) => a + s.run.frames.length + s.run.children.reduce((b, k) => b + k.run.frames.length, 0), 0);
    const dead = R.shells.filter(s => !(s.run.init && s.run.spawn.state === 1)).length;
    ok(!why && n > 0, c.name + ': ' + n + ' shell(s)' + (dead ? ' (' + dead + ' deleted by the init)' : '') + ', ' + kids + ' child shell01, ' + moves + ' moves equal to the ROM', why || '');
  }
  // the unlinked (7, 0x38): the ROM's 0xf954f4 makes none, nor does the module
  {
    const c = C('q_spit_7_38_unlinked', 'em069_00', '4', 'Motion[20]', null, fr('f954f4', [42]), { len: 118, linked: false });
    const J = runJS(c);
    ok(J.info.size === 0, '(7, 0x38) unlinked: no shell (0xf95588 tst #1 / beq)', J.info.size + ' made');
  }

  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em076_00', '4', 'Motion[33]') === '["7:0x34","7:0x39"]', 'his L4 M33 picks 7:0x34 / 7:0x39 (7:0x3f only named)', pv('em076_00', '4', 'Motion[33]'));
  ok(pv('em076_00', '2', 'Motion[17]') === '["7:0x02","7:0x0d"]', 'his L2 M17 picks 7:0x02 / 7:0x0d', pv('em076_00', '2', 'Motion[17]'));
  ok(pv('em076_00', '2', 'Motion[57]') === '["7:0x07","7:0x0c"]', 'his L2 M57 picks 7:0x07 / 7:0x0c', pv('em076_00', '2', 'Motion[57]'));
  ok(pv('em069_00', '4', 'Motion[24]') === '["1:0x20","4:0x04","2:0x14"]', 'her L4 M24 picks 1:0x20 / 4:0x04 / 2:0x14', pv('em069_00', '4', 'Motion[24]'));
  ok(pv('em069_00', '0', 'Motion[66]') === '["6:0x00","2:0x11"]', 'her L0 M66 picks 6:0x00 / 2:0x11', pv('em069_00', '0', 'Motion[66]'));
  ok(S.variantActionFor('em076_00', '4', 'Motion[33]', '7:0x3f') && S.variantActionFor('em076_00', '4', 'Motion[33]', '7:0x3f').pick === 'duo',
     'his (7, 0x3f) resolves when the viewer names it');
  ok(S.actionFor('em069_00', '4', 'Motion[42]', false).variant === '7:0x09', 'her L4 M42 is (7, 0x09) (also (7, 0x4f)) without a pick');
  // the no-shell picks make nothing; a missing target is refused by name
  for (const [m, l, c, v] of [['em076_00', '2', 'Motion[17]', '7:0x0d'], ['em076_00', '2', 'Motion[57]', '7:0x0c'], ['em069_00', '0', 'Motion[66]', '2:0x11']]){
    const J = runJS(C('n', m, l, c, v, [], { len: 200 }));
    ok(J.info.size === 0 && J.refused.length === 0, m + ' ' + l + ' ' + c + ' ' + v + ': no shell, nothing refused', J.info.size + ' / ' + J.refused.length);
  }
  {
    const st = S.createShellState('em076_00'), refused = [];
    for (let k = 0; k < 120; k++){
      const out = S.stepShells(st, { monId: 'em076_00', list: '4', clip: 'Motion[33]', frame: k, joints: () => J144, rock: { variant: '7:0x39', target: null, floorY: 0 },
                                     owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 } });
      refused.push(...out.refused);
    }
    ok(refused.length === 3 && refused.every(r => /no target/.test(r.why)), 'no target: each lob refused by name', JSON.stringify(refused[0]));
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  for (const [n, over, what] of [
    ['q_spit_7_09', { target: [900.0, 40.0, 2400.0] }, 'the target 40 higher'],
    ['q_spit_7_09', { joints: { 0: J0, 1: J144, 144: J144 } }, 'another joint 1'],
    ['s_spit_7_34', { owner: [0, 0x3001, 0] }, 'the facing one word off'],
    ['s_lob_7_02', { target: [900.0, 0.5, 2400.0] }, 'the target 0.5 off'],
    ['s_lob_7_39_linked', { link: { matrix: jointOf(2.11, 0.15, -0.05, [0, 0, 0]), partner: true } }, 'the link yaw off'],
    ['q_c31_7_36', { owner: [0, 0x5556, 0] }, 'her facing one word off'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Seltas shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
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
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start') ||
              [...clipSel.options].find(x => x.value === name + '_loop');
    if (!o){ check(false, 'list ' + list + ' has ' + name, [...clipSel.options].slice(0, 5).map(x => x.value)); return false; }
    // (the shells still flying from the clip before -- a spit lives 150 moves -- are not this clip's)
    OLD.clear();
    for (const R of [body(), V.partnerEffectRuntimeObj && V.partnerEffectRuntimeObj()]){
      const st = R && R.schedule && R.schedule.shells && R.schedule.shells.state;
      for (const s of (st ? st.shells : [])) OLD.add(R.monsterId + ':' + s.id);
    }
    clipSel.value = o.value; await clipSel.onchange();
    return true;
  };
  const OLD = new Set();
  // every shell a runtime's schedule steps, as first seen (its init's point, its action, its record), over n frames
  const watch = async (rts, n, stop) => {
    const seen = new Map(), old = OLD;
    for (let i = 0; i < n; i++){
      await frames(1);
      for (const R of rts()){
        const st = R && R.schedule && R.schedule.shells && R.schedule.shells.state;
        for (const s of (st ? st.shells : [])){
          const k = R.monsterId + ':' + s.id;
          if (seen.has(k) || old.has(k) || s.creator != null) continue;   // (a landing's shell01 is its shell's, not the clip's)
          const J = R.gameJoints && R.gameJoints.get(144);
          seen.set(k, { mon: R.monsterId, shell: s.shell, mode: s.modeIndex, action: s.action ? s.action.map(x => x.toString(16)).join(':') : null,
                        at: (s.launch && (s.launch.position || s.launch.point)) || s.position, key: s.start && s.start.key,
                        j144: J ? [J[12], J[13], J[14]] : null, partner: !!R.partner, req: !!s.request });
        }
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  const dist = (a, b) => a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : Infinity;

  // SOLO SELTAS
  check(await open('em076_00'), 'solo Seltas: his runtime is up');
  {
    await pick('2', 'Motion[17]');
    const w = await watch(() => [body()], 200, x => x.length >= 3);
    const lobs = w.filter(x => x.shell === 'shell37');
    check(lobs.length === 3 && lobs.map(x => x.mode).join() === '3,4,5' && lobs.every(x => x.action === '7:2'),
          'L2 M17 (7, 0x02): three shell37 3 / 4 / 5 (the lobs, u 0)', w);
    check(lobs.length === 3 && lobs.every(x => x.key === 0 && x.req), 'u 0 started on each lob (a request on the shell)', lobs);
  }
  {
    await pick('4', 'Motion[33]');
    const w = await watch(() => [body()], 140, x => x.filter(y => y.shell !== 'shell01').length >= 3);
    const sh = w.filter(x => x.shell !== 'shell01');
    check(sh.length === 3 && (sh.every(x => x.shell === 'shell00' && x.action === '7:34') || sh.every(x => x.shell === 'shell37' && x.action === '7:39')),
          'L4 M33: his pick (7, 0x34) three spits or (7, 0x39) three lobs', sh);
    check(sh.length && sh.every(x => dist(x.at, x.j144) < 400), 'each from his joint 144', sh.map(x => [x.at, x.j144]));
  }
  {
    await pick('4', 'Motion[34]');
    const w = await watch(() => [body()], 140, x => x.filter(y => y.shell === 'shell37').length >= 3);
    const sh = w.filter(x => x.shell === 'shell37');
    check(sh.length === 3 && sh.map(x => x.mode).join() === '6,7,8' && sh.every(x => x.key === 1 && x.req), 'L4 M34 (7, 0x3a): shell37 6 / 7 / 8, u 1 started', w);
  }
  // SOLO QUEEN
  check(await open('em069_00'), 'solo Queen: her runtime is up');
  {
    await pick('4', 'Motion[42]');
    const w = await watch(() => [body()], 200, x => x.filter(y => y.shell === 'shell00').length >= 3);
    const sh = w.filter(x => x.shell === 'shell00');
    check(sh.length === 3 && sh.map(x => x.mode).join() === '0,1,2' && sh.every(x => x.key === 10 && x.req), 'L4 M42 (7, 0x09): her three spits, u 10 started', w);
  }
  {
    await pick('4', 'Motion[20]');
    const w = await watch(() => [body()], 120);
    check(w.length === 0, 'raw L4 M20 (7, 0x38): no spit -- she is alone (the link bit is clear)', w);
  }
  {
    await pick('4', 'Motion[26]');
    const w = await watch(() => [body()], 30, x => x.length >= 1);
    check(w.length === 1 && w[0].shell === 'shell01' && w[0].mode === 4 && w[0].key === 31 && w[0].req, 'L4 M26 (7, 0x36): shell01 4, c 31 started', w);
  }
  // THE COMBINED LIST: his 7:0x3f (two spits a crossing) from HIS runtime and joints; her 7:0x4f spits after his flag; her linked M20
  {
    const P = () => V.partnerEffectRuntimeObj ? V.partnerEffectRuntimeObj() : null;
    await pick('duo', 'Seltas Motion[33] with her 7:0x4e');
    check(await until(() => P() && P().schedule && P().monsterId === 'em076_00', 300), 'duo: his own runtime is up');
    // (the duo agent, 2026-10-17: the entry now plays his 7:0x3f's three sets -- spec 2b -- so FIFTEEN spits, 2 + 2 + 1 a crossing)
    const w = await watch(() => [body(), P()], 420, x => x.filter(y => !y.partner && y.shell === 'shell00').length >= 3 &&
                                                          x.filter(y => y.partner && y.shell === 'shell00').length >= 15);
    const his = w.filter(x => x.partner && x.shell === 'shell00'), hers = w.filter(x => !x.partner && x.shell === 'shell00');
    check(his.length === 15 && his.every(x => x.mode === 3 && x.action === '7:3f'), 'his 7:0x3f: fifteen shell00 3 (three sets: two, two, one a crossing), on his runtime', his);
    check(his.length && his.every(x => dist(x.at, x.j144) < 400), 'from HIS joint 144', his.map(x => [x.at, x.j144]));
    check(his.length && his.every(x => x.key === 1 && x.req), 'his u 1 started on his runtime, on each', his.map(x => [x.key, x.req]));
    check(hers.length === 3 && hers.map(x => x.mode).join() === '0,1,2', 'her 7:0x4f (L4 M42 from 90): her three spits after his flag, on hers', hers);
  }
  {
    await pick('duo', 'Queen L4 Motion[20]_start + Seltas free');
    const w = await watch(() => [body()], 160, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.mode === 3 && x.action === '7:38'), 'duo L4 M20 (7, 0x38): her linked spit, shell00 3', w);
  }
  return out;
}
