// Duramboros's (em061_00) shells in render/shells.js against the ROM -- uEm061_00's sp_00 (base00), sp_01 and sp_19 (base19, the
// rolling ball). Rustrum (em061_04: sp_13, sp_24, the variant-4 readers) is not built yet.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em061_00.arc's shell files (sp_19's cmn FUP by its type). The setups are the class's
//      OWN CODE: its action main 0xf32798 with the action (7, n) at e+0x73e0, the id fields e+0xcac8..+0xcad8 as vt+0x158 0xf23ec0
//      writes them, the phase, and the frame tests answered (0xb0968's window, 0xb0974's frame). Each shell is flown from the setup
//      the ROM built, its children (sp_01 from a lump's contact) from theirs; every init / move / effect start bit for bit.
//   2. The contract: the pick lists, the modes his file lacks (7 / 8: nothing made).
//   3. CONTROLS: a wrong joint, a wrong facing, a moved floor must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): L2 M28 / L2 M46 spawn their shells and start their records;
//      every exported shell record starts and runs out with no refusal.
//
//   node dev/shells-duramboros-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-duramboros-check.mjs         (4: the viewer)
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
  const IDS = { '0xcac8': [5, 1, 0, 0], '0xcacc': [6, 1, 0, 0], '0xcad0': [0x9d, 1, 0, 0], '0xcad4': [7, 1, 0, 0], '0xcad8': [0x9d, 1, 0, 0] };
  const C = (name, list, clip, n, F, x = {}) => Object.assign({ name, mon: 'em061_00', list, clip, variant: '7:0x' + n.toString(16).padStart(2, '0'),
    steps: [{ fn: 'f32798', phase: 1, win: x.win ? 1 : 0, frame: F }], owner: OW, ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0,
    size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10, emVariant: 0, owner_bytes: Object.assign({ '0x73e0': [7, n] }, IDS),
    joints: { 0: J0, 9: J0b, 14: J140 } }, x);
  const F061 = { 0x105: ['em061_00', '00'], 0x106: ['em061_00', '01'], 0x107: ['em061_00', '19'] };
  const cases = [
    // sp_00 at the window (0xb0968 mode 0): L2 M28 120 / L2 M22 120 / L2 M21 50 / L2 M23 50; L2 M56 110 the lumps 4..6
    C('dm_rock_46', '2', 'Motion[28]', 0x46, 120, { win: 1, len: 200 }),
    C('dm_rock_49', '2', 'Motion[22]', 0x49, 120, { win: 1, len: 200, owner: [0, 0xa000, 0] }),
    C('dm_rock_47', '2', 'Motion[21]', 0x47, 50, { win: 1, len: 200 }),
    C('dm_rock_4f', '2', 'Motion[28]', 0x4f, 120, { win: 1, len: 200, ownerPos: [-300.0, 60.0, 400.0] }),
    C('dm_rock_96', '2', 'Motion[22]', 0x96, 120, { win: 1, len: 200 }),
    C('dm_rock_e6', '2', 'Motion[28]', 0xe6, 120, { len: 200 }),
    C('dm_lump_ad', '2', 'Motion[56]', 0xad, 110, { win: 1, len: 200 }),
    C('dm_lump_af', '2', 'Motion[56]', 0xaf, 110, { win: 1, len: 200, owner: [0, 0x5000, 0] }),
    // sp_19 the ball: L2 M46 f94 (mode 0), L2 M56 f110 (mode 1)
    C('dm_ball_6f', '2', 'Motion[46]', 0x6f, 94, { len: 200 }),
    C('dm_ball_6f_turned', '2', 'Motion[46]', 0x6f, 94, { len: 200, owner: [0, 0xc321, 0] }),
    C('dm_ball_7d', '2', 'Motion[56]', 0x7d, 110, { len: 200 }),
    // a bigger monster: flag 0x80's size on the offset (0x3f8f9c), the ball's and the lump's
    C('dm_ball_6f_big', '2', 'Motion[46]', 0x6f, 94, { len: 200, size: [1.25, 1.1] }),
    C('dm_lump_ad_big', '2', 'Motion[56]', 0xad, 110, { win: 1, len: 200, size: [1.25, 1.1] }),
  ];
  for (const c of cases) c.folders = F061;

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'dmshells-'));
  writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases.map(c => ({ name: c.name, mon: c.mon, folders: c.folders, variant: c.emVariant || 0, owner: c.owner,
    ownerPos: c.ownerPos, target: c.target, floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, charged: !!c.charged,
    rage: !!c.rage, severed: !!c.severed, rank: c.rank, quest: c.quest, unstub: c.unstub || [], owner_bytes: c.owner_bytes || null, block: c.block || null, slot0: !!c.slot0,
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
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, charged: !!x.charged,
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
  const BASE = { 0x105: 'base00', 0x106: 'base01', 0x107: 'base19' };
  function diffShell(R, I, snaps, base){
    const S0 = I.S, L = snaps.get(S0.id) || [];
    if (!R.init) return 'the ROM init deleted it, the module made it';
    const sp = R.spawn;
    if (base === 'base00' || base === 'base13' || base === 'base19'){
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
      // a base01 child whose life is its hit slots: the module (input.hitLife) registers them, the ROM run registers none (0x4a1ad8
      // answered 0) and ends it on its first move -- its point and words up to there are compared, its life is the hit side's
      if (base === 'base01' && S0.slots && S0.slots.length && s.state === 1 && fr.state >= 0xfe) break;
      if (s.state !== fr.state) return 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state;
      if (fr.state === 0xff) break;
      if (!eqv(s.pos, fr.pos)) return 'move ' + fr.k + ' position ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos);
      if (base === 'base00' || base === 'base13' || base === 'base19'){
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
    // a mode his file does not carry (sp_00 7 from (7, 0xe6)): the ROM makes the shell, its init reads nothing, it starts and
    // creates nothing and leaves state 1 on its first move (timer 0 -> the ending, state 0xfe) -- nothing is drawn, so the
    // module makes none. Anything else such a shell does fails the count.
    const fileModes = id => { const d = Object.values(S.SHELL_DATA[c.mon] || {}).find(x => x && x.id === id); return d ? d.modes : {}; };
    const isEmpty = s => !!s.run && !fileModes(+s.id)[+s.mode] && !s.run.log.length && !s.run.created.length && !s.run.children.length
      && s.run.frames.length && s.run.frames[0].state === 0xfe;
    const empty = R.shells.filter(isEmpty);
    const live = R.shells.filter(s => isLive(s) && !isEmpty(s)), dead = R.shells.length - live.length - empty.length;
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
  ok(pv('em061_00', '2', 'Motion[28]') === '["7:0x46","7:0x4d","7:0x4f","7:0xe6"]', 'L2 M28 picks its four', pv('em061_00', '2', 'Motion[28]'));
  ok(pv('em061_00', '2', 'Motion[56]') === '["7:0xad","7:0xae","7:0xaf","7:0x7d"]', 'L2 M56 picks the lumps and the ball', pv('em061_00', '2', 'Motion[56]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['dm_rock_46', { joints: { 0: J0, 9: J0b, 14: J50 } }, 'another joint 14'],
    ['dm_rock_49', { owner: [0, 0xa001, 0] }, 'the facing one word off'],
    ['dm_lump_ad', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the contact, the shell01)'],
    ['dm_ball_6f', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the ball rides the ground)'],
    ['dm_ball_7d', { joints: { 0: J0, 9: J0b, 14: J50 } }, 'another joint 14 (the ball)'],
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
  const check = (ok, label, detail) => out.push([!!ok, 'Duramboros shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  let MON = 'em061_00';
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
  MON = 'em061_00';
  check(await open(), 'Duramboros: his runtime is up');
  {
    await pick('2', 'Motion[28]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.key === 0 && x.req), 'L2 M28: a rock, shell00, u 0 started', w);
  }
  {
    await pick('2', 'Motion[46]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell19'));
    check(w.some(x => x.shell === 'shell19' && x.mode === 0 && x.key === 13 && x.req), 'L2 M46: the ball, shell19 0, u 13 started', w);
  }
  for (const [mon, keys] of [['em061_00', [0, 1, 2, 10, 11, 12, 13]]]){
  MON = mon; await open();
  for (const key of keys){
    const S = body().schedule, e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === mon + 'u' && x.def.record.key === key);
    if (!e){ check(false, 'u ' + key + ' exported as a shell record'); continue; }
    let started = 0, maxRun = 0;
    for (let rep = 0; rep < 2; rep++){
      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }
      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
    }
    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
    if (body().failed) await open();
  }
  }
  return out;
}
