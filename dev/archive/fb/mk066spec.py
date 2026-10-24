# mk066spec.py <0|4>: spec_tetsucabra.json / spec_drilltusk.json for mk_plaincheck.py
import json, sys
V = int(sys.argv[1]) if len(sys.argv) > 1 else 0
mon = 'em066_04' if V == 4 else 'em066_00'
ids = (0x11e, 0x11f, 0x120, 0x121) if V == 4 else (0x11a, 0x11b, 0x11c, 0x11d)
body = '{ 0: 380.0, 1: 350.0 }' if V == 4 else '{ 0: 360.0, 1: 160.0 }'
DTP = [0, 1, 1, 0, 0, 2, 2, 1, 4, 1, 1, 2, 5, 1, 1, 2, 1, 1, 1, 3] if V == 4 else [0, 1, 1, 0x81, 0, 2, 2, 0x81, 4, 1, 1, 2, 5, 1, 1, 2, 1, 1, 1, 3]
le = lambda x: [x & 0xff, (x >> 8) & 0xff, 0, 0]
title = 'Drilltusk Tetsucabra' if V == 4 else 'Tetsucabra'
name = 'drilltusk' if V == 4 else 'tetsucabra'
SLAB = "steps: [{ fn: 'f57f8c', args: [7, %s] }], frames: 900, bodydata: " + body + ", rayStart: 1, coreVt: 1"
cases = [
  "    // (an `also` action plays under its row's variant, the primary's)",
  "    // L4 M1 / L4 M2 f124: the rocks by the tusks (0 / 1 / 2: two, one, none) -- the map read e+0x1053 = 0xff (no snow map)",
  "    C('r55', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4')),",
  "    C('r55_one', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { tusk: 1 }),",
  "    C('r55_none', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { tusk: 2, none: 1 }),",
  "    C('r83', 0x83, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { owner: [0, 0x9123, 0] }),",
  "    C('r56', 0x56, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { owner: [0, 0x5800, 0] }),",
  "    C('r56_one', 0x56, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { tusk: 1, rank: 3 }),",
  "    C('r86', 0x86, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { size: [1.2, 1.1] }),",
  "    // L2 M12 f58: the thrown rock (sp_13 0) and its landing's hit volume (sp_01 0)",
  "    C('t21', 0x21, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2')),",
  "    C('t37_side', 0x37, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2'), { target: [-2400.0, 80.0, 300.0], owner: [0, 0xd000, 0], size: [1.15, 1.0] }),",
  "    C('t22_near', 0x22, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2'), { target: [300.0, 0.0, 250.0] }),",
  "    // the action start (vt+0x204 0xf57f8c): the slab, mode 2 below the tusks' second level, 3 at it",
  "    C('s89', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { " + SLAB % '0x89' + " }),",
  "    C('s89_broken', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { tusk: 2, " + SLAB % '0x89' + " }),",
  "    C('s77_turned', 0x77, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { tusk: 1, owner: [0, 0xa321, 0], " + SLAB % '0x77' + " }),",
  "    // THE SNOW MAPS (the Snow Variants list, input.snow): e+0x1053 = 3 / 14 / 20 -- the rocks' table 0x16a0820, the slab's 0 / 1",
  "    C('r55_snow', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { map: 3 }),",
  "    C('r56_snow_one', 0x56, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { map: 14, tusk: 1 }),",
  "    C('s89_snow', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { map: 20, " + SLAB % '0x89' + " }),",
  "    C('s89_snow_broken', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { map: 3, tusk: 2, " + SLAB % '0x89' + " }),",
]
spec = {
  'name': name, 'title': title, 'mon': mon, 'main': 'f63180', 'variant': V,
  'header': [
    "%s's (%s) shells in render/shells.js against the ROM -- uEm066_00's sp_00 (0x%x, the rocks, base00 through its" % (title, mon, ids[0]),
    "reader 0xf64f38), sp_13 (0x%x, the thrown rock, base13 through 0xf65478, its landing 0xf65640), its child sp_01 (0x%x, a hit" % (ids[2], ids[1]),
    "volume) and sp_16 (0x%x, the slab, NEW base16 through 0xf65954). dev/amphibian-shells-spec.md 1." % ids[3],
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn, the class's action main",
    "     0xf63180 (the slab: the action start vt+0x204 0xf57f8c) with the action at e+0x73e0, the ids e+0xcac4.. and the .dtp array",
    "     filled, the tusks' level at block +0x3bc, the map read (vt+0x9c 0x6bb20, e+0x1053 = 0xff); every shell flown from the setup",
    "     the ROM built, its children from theirs; the slab's BodyDataList radii and its ray from 500 above (0x183664's start).",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor, the tusks read one level off must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-%s-check.mjs                                   (1..3: the ROM comparison, no viewer)" % name,
    "  node <scratchpad>/run-check.mjs dev/shells-%s-check.mjs         (4: the viewer)" % name,
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(ids[0]): [mon, '00'], hex(ids[1]): [mon, '01'], hex(ids[2]): [mon, '13'], hex(ids[3]): [mon, '16']},
  'owner_bytes': {'0xcac4': le(ids[2]), '0xcac8': le(ids[0]), '0xcacc': le(ids[1]), '0xcad0': le(ids[3]), '0x1053': [0xff]},
  'bases': {hex(ids[0]): 'base00', hex(ids[1]): 'base01', hex(ids[2]): 'base13', hex(ids[3]): 'base16'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '4', 'Motion[1]') === '[\"7:0x55\"]', 'L4 M1 picks its rocks', pv('%s', '4', 'Motion[1]'));" % (mon, mon),
    "  ok(pv('%s', '4', 'Motion[2]') === '[\"7:0x56\"]', 'L4 M2 picks its rocks', pv('%s', '4', 'Motion[2]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[12]') === '[\"7:0x21\"]', 'L2 M12 picks its thrown rock', pv('%s', '2', 'Motion[12]'));" % (mon, mon),
    "  ok(pv('%s', '4', 'Motion[30]') === '[\"7:0x89\"]', 'L4 M30 picks its slab', pv('%s', '4', 'Motion[30]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['r83', { owner: [0, 0x9124, 0] }, 'the facing one word off'],",
    "    ['r55', { tusk: 1 }, 'the tusks read one level up'],",
    "    ['r55_snow', { map: 255 }, 'the snow map off (the rocks)'],",
    "    ['s89_snow', { map: 255 }, 'the snow map off (the slab)'],",
    "    ['t21', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further'],",
    "    ['t21', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],",
    "    ['s89', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the slab)'],",
    "    ['s77_turned', { owner: [0, 0xa322, 0] }, 'the facing one word off (the slab)'],",
    "    ['s89_broken', { tusk: 1 }, 'the tusks read one level down (the slab)'],"]),
  'page': "\n".join([
    "  {",
    "    await pick('4', 'Motion[1]');",
    "    const w = await watch(200, x => x.some(y => y.shell === 'shell00'));",
    "    check(w.some(x => x.shell === 'shell00' && x.key === 20 && x.req), 'L4 M1: a rock, shell00, u 20 started', w);",
    "  }",
    "  {",
    "    await pick('2', 'Motion[12]');",
    "    const w = await watch(200, x => x.some(y => y.shell === 'shell13'));",
    "    check(w.some(x => x.shell === 'shell13' && x.key === 0 && x.req), 'L2 M12: the thrown rock, shell13, u 0 started', w);",
    "  }",
    "  {",
    "    await pick('4', 'Motion[30]');",
    "    const w = await watch(120, x => x.some(y => y.shell === 'shell16'));",
    "    check(w.some(x => x.shell === 'shell16' && (x.key === 30 || x.key === 32) && x.req), 'L4 M30: the slab, shell16, u 30 / 32 started', w);",
    "    const st = body().schedule.shells.state, s16 = st.shells.find(s => s.shell === 'shell16');",
    "    let rose = false;",
    "    for (let i = 0; i < 900 && s16; i++){ await frames(1); if (s16.effect2 && s16.effect2.request){ rose = true; break; } }",
    "    check(rose, 'L4 M30: the slab, at its second phase, starts u 40 / 42 (its first two waits run out)', s16 ? { phase: s16.phase, timer: s16.timer } : null);",
    "  }",
    "  {",
    "    // THE SNOW VARIANTS LIST (Raven, 2026-10-18): the same clips with the snow map on -- the rocks' and the slab's snow modes",
    "    const snowList = [...listSel.options].find(o => o.value === 'snow');",
    "    check(!!snowList && snowList.textContent.includes('Snow Variants'), 'the Snow Variants list is there', snowList ? snowList.textContent : null);",
    "    if (snowList){",
    "      await pick('snow', 'L4 Motion[1]');",
    "      const w = await watch(200, x => x.some(y => y.shell === 'shell00'));",
    "      check(w.some(x => x.shell === 'shell00' && (x.mode === 3 || x.mode === 4) && x.key === 21 && x.req), 'Snow Variants L4 Motion[1]: the snow rocks (modes 3 / 4, u 21)', w);",
    "      await pick('snow', 'L4 Motion[30]');",
    "      const s = await watch(120, x => x.some(y => y.shell === 'shell16'));",
    "      check(s.some(x => x.shell === 'shell16' && (x.mode === 0 || x.mode === 1) && x.req), 'Snow Variants L4 Motion[30]: the snow slab (mode 0 / 1)', s);",
    "    }",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [0, 1, 2, 20, 22, 24, 30, 32, 40, 42, 21, 23, 25, 31, 33, 41, 43]){",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === '%su' && x.def.record.key === key);" % mon,
    "    if (!e){ check(false, '%su ' + key + ' exported as a shell record'); continue; }" % mon,
    "    let started = 0, maxRun = 0;",
    "    for (let rep = 0; rep < 2; rep++){",
    "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
    "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
    "    }",
    "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
    "    if (body().failed) await open();",
    "  }"]),
}
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
json.dump(spec, open(D + 'spec_%s.json' % name, 'w', encoding='utf8'), indent=1)
# the generated check's em066 inputs: the tusks (module: input.tusk066; ROM: block +0x3bc), the .dtp, the slab's options
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-%s-check.mjs' % name
import subprocess
subprocess.check_call([sys.executable, D + 'mk_plaincheck.py', D + 'spec_%s.json' % name])
s = open(P, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
rep("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
    "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, tusk066: x.tusk || 0, snow: [3, 14, 20].includes(x.map) });")
rep("    if (c.precall) o.precall = c.precall;",
    "    if (c.precall) o.precall = c.precall;\n    if (c.map != null) o.owner_bytes = Object.assign({}, o.owner_bytes, { '0x1053': [c.map] });\n    o.dtp = %s;\n    o.block_bytes = { '0x3bc': [c.tusk || 0] };\n    o.ownvt = { '0x9c': '0x6bb20' };\n"
    "    if (c.bodydata) o.bodydata = c.bodydata;\n    if (c.rayStart) o.rayStart = 1;\n    if (c.coreVt) o.coreVt = 1;\n    if (c.frames) o.frames = c.frames;" % json.dumps(DTP))
# the slab's kill: ef 0's handle killed (its vt+0x40) on the same move as the ROM's
rep("    const romAtOnce = R.frames.some(x => x.log.some(e => e[0] === 'stop' && e[1] === 1));",
    "    const romKill = R.frames.find(x => x.log.some(e => e[0] === 'kill'));\n"
    "    const jsKill = (S0.events || []).find(e => e.ev === 'stop' && e.kill);\n"
    "    if (!!romKill !== !!jsKill || (romKill && romKill.k !== jsKill.move)) return 'the kill of ef 0: module ' + (jsKill ? jsKill.move : null) + ' vs ROM ' + (romKill ? romKill.k : null);\n"
    "    const romAtOnce = R.frames.some(x => x.log.some(e => e[0] === 'stop' && e[1] === 1));")
# the slab's phases, positively: the ROM's own run registers the body at the first wait's end, kills ef 0 at the second's, ends at the
# fourth's (state 0xfe) -- and the module's moves for the same three
rep("  // ---- 2. the contract ",
    "  for (const c of cases.filter(c => c.name[0] === 's')){\n"
    "    const R = ROM[c.name], fr = R.shells[0] && R.shells[0].run ? R.shells[0].run.frames : [];\n"
    "    const at = t => (fr.find(t) || {}).k, body = at(x => x.log.some(e => e[0] === 'body' && e[2] === 1)), kill = at(x => x.log.some(e => e[0] === 'kill'));\n"
    "    const end = at(x => x.state === 0xfe), I = [...JS.get(c.name).info.values()][0], L = I ? JS.get(c.name).snaps.get(I.S.id) || [] : [];\n"
    "    const jsEnd = (L.find(x => x.state === 0xfe) || {}).moves, jsKill = I && (I.S.events.find(e => e.kill) || {}).move;\n"
    "    const K = I && I.S.k, e0 = K && K.t0, e1 = K && f(K.t0 + K.t1), e3 = K && f(f(f(K.t0 + K.t1) + K.t2) + K.t3);\n"
    "    ok(!!K && body === e0 && kill === e1 && end === e3 && jsKill === kill && jsEnd === end, c.name + ': the slab -- the body on at move ' + body + ', ef 0 killed at ' + kill + ', the end at ' + end + ' (the module: ' + jsKill + ' / ' + jsEnd + ')');\n"
    "  }\n"
    "  // ---- 2. the contract ")
open(P, 'w', encoding='utf8').write(s)
print('patched', P)
