# dev/shells-kecha-check.mjs from dev/shells-rustrum-check.mjs: the same harness plumbing and comparison, Kecha Wacha's cases
src_p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-rustrum-check.mjs'
dst_p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-kecha-check.mjs'
s = open(src_p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
s = s.replace('\r\n', '\n')
def cut(a, b):
    i = s.index(a); j = s.index(b, i); return i, j
head_end = s.index('import { writeFileSync')
head = """// Kecha Wacha's (em065_00) shells in render/shells.js against the ROM -- uEm065_00: sp_00 (0x116, the drop), sp_01 (0x117, c 31 on
// the ground and the hit volumes), sp_13 (0x118, base13: the arcing water shots) and sp_23 (0x119, a NEW base, base23: the
// straight water shots).
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em065_00.arc's shell files. The setups are the class's OWN CODE: its action main
//      0xf55740 with the action at e+0x73e0, the phase and the frame test answered (one step per shot frame); every shell flown
//      from the setup the ROM built, its children (sp_01 1 at a contact) from theirs.
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong joint, a wrong facing, a moved floor, a moved target must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; every exported shell record
//      starts and runs out with no refusal.
//
//   node dev/shells-kecha-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-kecha-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
"""
s = head + s[head_end:]
a, b = cut("  const OW = [0, 0x3000, 0]", "  for (const c of cases) c.folders = F061;")
cases = """  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F065 = { 0x116: ['em065_00', '00'], 0x117: ['em065_00', '01'], 0x118: ['em065_00', '13'], 0x119: ['em065_00', '23'] };
  const v = (st, n) => st + ':0x' + n.toString(16).padStart(2, '0');
  const C = (name, st, n, steps, seq, x = {}) => Object.assign({ name, mon: 'em065_00', n, steps, seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 0, owner_bytes: { '0x73e0': [st, n] },
    joints: { 0: J0, 131: J150 } }, x);
  const SHOTS = (fr, ph = 1) => fr.map(F => ({ fn: 'f55740', phase: ph, win: 0, frame: F }));
  const cases = [
    // (7, 6) L2 M78: the straight shots, sp_23 0 / 1 / 2 at 108 / 130 / 150
    C('kw_shot23', 7, 6, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 200 }]),
    C('kw_shot23_turned', 7, 6, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 200 }], { owner: [0, 0xb123, 0], target: [-700.0, 300.0, 200.0] }),
    // a target inside the near distance and one past the far: the clamps of 0x40cf9c
    C('kw_shot23_near', 7, 6, SHOTS([108]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 120 }], { target: [200.0, 40.0, 0.0] }),
    C('kw_shot23_far', 7, 6, SHOTS([150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 6), len: 160 }], { target: [6000.0, -500.0, 4000.0] }),
    // (7, 7) L2 M80 and (7, 0x3b) L2 M77: the arcing shots, sp_13 0..2 / 3..5
    C('kw_shot13', 7, 7, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[80]', variant: v(7, 7), len: 200 }]),
    C('kw_shot13b', 7, 0x3b, SHOTS([116, 136, 156]), [{ list: '2', clip: 'Motion[77]', variant: v(7, 0x3b), len: 200 }], { owner: [0, 0x4800, 0] }),
    // (7, 0x17) L2 M78: the hit volumes on joint 131 (sp_01 2, no EffectParam)
    C('kw_hit17', 7, 0x17, SHOTS([108, 130, 150]), [{ list: '2', clip: 'Motion[78]', variant: v(7, 0x17), len: 200 }]),
    // (3, 7) L5 M25 f16: c 31 on the ground 300 ahead
    C('kw_ground', 3, 7, SHOTS([16]), [{ list: '5', clip: 'Motion[25]', variant: v(3, 7), len: 60 }]),
    // (7, 0x15) L2 M117 f33 (phase 6): the drop, from a raised owner (it lands)
    C('kw_drop', 7, 0x15, SHOTS([33], 6), [{ list: '2', clip: 'Motion[117]', variant: v(7, 0x15), len: 80 }], { ownerPos: [120.5, 815.25, -80.75] }),
  ];
"""
s = s[:a] + cases + s[b:].replace('  for (const c of cases) c.folders = F061;', '  for (const c of cases) c.folders = F065;', 1)
s = s.replace("  const J150 = jointOf(0.9, -0.45, 0.25, [130.25, 240.5, -70.75]);", "  const J150 = jointOf(0.9, -0.45, 0.25, [130.25, 240.5, -70.75]);")
s = s.replace("join(tmpdir(), 'rushells-')", "join(tmpdir(), 'kwshells-')")
s = s.replace("  const BASE = { 0x108: 'base00', 0x109: 'base01', 0x10a: 'base13', 0x10b: 'base19', 0x10c: 'base24' };",
              "  const BASE = { 0x116: 'base00', 0x117: 'base01', 0x118: 'base13', 0x119: 'base23' };")
s = s.replace("  const FULL = new Set(['base00', 'base13', 'base19', 'base24']);", "  const FULL = new Set(['base00', 'base13', 'base23']);")
s = s.replace("timer: sh.base === 'base13' ? sh.lifetime : sh.base === 'base24' ? sh.life : sh.timer", "timer: sh.base === 'base13' ? sh.lifetime : sh.base === 'base23' ? sh.life : sh.timer")
# the chain / contract / controls
a, b = cut("  // the chain reached its last link where it should", "  // ---- 3. CONTROLS")
mid = """  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em065_00', '2', 'Motion[78]') === '["7:0x06","7:0x17"]', 'L2 M78 picks the shots and their hit-only twin', pv('em065_00', '2', 'Motion[78]'));
  ok(pv('em065_00', '2', 'Motion[117]') === '["7:0x15","7:0x16"]', 'L2 M117 picks the drop and its hit-only twin', pv('em065_00', '2', 'Motion[117]'));

"""
s = s[:a] + mid + s[b:]
a, b = cut("  const controls = [", "  ];")
ctl = """  const controls = [
    ['kw_shot23', { joints: { 0: J0, 131: J50 } }, 'another joint 131'],
    ['kw_shot23_turned', { owner: [0, 0xb124, 0] }, 'the facing one word off'],
    ['kw_shot13', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher'],
    ['kw_shot13b', { target: [900.0, 60.0, 2400.0] }, 'the target 20 higher (the arc)'],
    ['kw_drop', { ownerPos: [120.5, 815.25, -80.5] }, 'the owner a quarter unit over'],
"""
s = s[:a] + ctl + s[b:]
# the page part
a = s.index("export async function pageCheck(){")
page = """export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Kecha Wacha shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em065_00';
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
    await pick('2', 'Motion[78]');
    const w = await watch(260, x => x.filter(y => y.shell === 'shell23').length >= 3);
    check(w.filter(x => x.shell === 'shell23' && x.key === 0 && x.req).length === 3, 'L2 M78: three straight shots, shell23 0 / 1 / 2, u 0 started', w);
  }
  {
    await pick('2', 'Motion[80]');
    const w = await watch(260, x => x.filter(y => y.shell === 'shell13').length >= 3);
    check(w.filter(x => x.shell === 'shell13' && x.key === 0 && x.req).length === 3, 'L2 M80: three arcing shots, shell13, u 0 started', w);
  }
  const S = body().schedule;
  for (const [pel, key] of [['em065_00u', 0], ['em065_00u', 1], ['em065_00u', 2], ['em065_00u', 10], ['em065_00u', 11], ['em065_00u', 12], ['em065_00c', 31]]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === pel && x.def.record.key === key);
    if (!e){ check(false, pel + ' ' + key + ' exported as a shell record'); continue; }
    let started = 0, maxRun = 0;
    for (let rep = 0; rep < 2; rep++){
      try { S.start(e); started++; } catch (err){ check(false, pel + ' ' + key + ' start', String(err)); }
      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
    }
    check(!body().failed && started === 2, 'record ' + pel + ' ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
    if (body().failed) await open();
  }
  return out;
}
"""
s = s[:a] + page
open(dst_p, 'w', encoding='utf8', newline='').write(s.replace('\n', nl))
print('ok')
