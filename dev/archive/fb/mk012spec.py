# mk012spec.py: spec_lao.json for mk_plaincheck.py, then the em012 patches of the generated dev/shells-lao-check.mjs
import json, sys, subprocess, struct, re
mon = 'em012_00'
lao = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\lao.js', encoding='utf8').read()
rows = re.findall(r"act012\((\d+), 0x([0-9a-f]+), '(\d)', 'Motion\[(\d+)\]', (\d+), \[\{ frame: ([0-9.]+)", lao)
MOT = lambda l, m: list(struct.pack('<H', (int(l) << 8) | int(m)))
cases = []
for st, n, l, m, e, fr in rows:
    st, n, e, fr = int(st), int(n, 16), int(e), float(fr)
    var = '%d:0x%02x #%d' % (st, n, e)
    ob = {'0x73e0': [st, n], '0xcae0': list(struct.pack('<I', 0x17a50f4 + 8 * e)), '0x4b4': MOT(l, m)}
    cases.append("    C('e%d', %d, 1, %.1f, 1, [{ list: '%s', clip: 'Motion[%s]', variant: '%s', len: %d }], { st: %d, owner_bytes: %s, frames: 600 }),"
                 % (e, n, fr, l, m, var, int(fr) + 2, st, json.dumps(ob)))
cases.insert(0, "    // each listed entry: vt+0x2a8 0xd759f4 with e+0xcae0 = the entry (0x17a50f4 + 8 x idx) and the motion at e+0x4b4, its frame test passed")
spec = {
  'name': 'lao', 'title': 'Lao-Shan Lung', 'mon': mon, 'main': 'd759f4', 'variant': 0,
  'header': [
    "Lao-Shan Lung's (em012_00) shells in render/shells.js against the ROM -- uEm012_00's event lists (vt+0x2a8 0xd759f4, the table",
    "0x17a50f4): sp_13 (0x81, the falling rubble: base13 through his own init 0xd7cf9c, reader 0xd7d2bc, delay +0x15c 0xd7d3c0, landing",
    "0xd7d450, end point +0x168 0xd7d4bc) and sp_01 (0x80, the hit volumes: base01 through 0xd7cd50). dev/elder-dragon-shells-spec.md 2.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the per-frame handler on each listed entry",
    "     (e+0xcae0 poked, the motion e+0x4b4, its frame test answered), every shell flown from the setup the ROM built (0x70 bytes).",
    "  2. The contract: the pick lists (one per event entry the EMC's op 0xa3 names).",
    "  3. CONTROLS: the other entry of a pair, a moved floor must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-lao-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-lao-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x80): [mon, '01'], hex(0x81): [mon, '13']},
  'owner_bytes': {},
  'bases': {hex(0x80): 'base01', hex(0x81): 'base13'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[1]') === '[\"7:0x00 #25\",\"7:0x00 #26\",\"7:0x00 #47\",\"7:0x00 #48\"]', 'L2 M1: (7, 0) entries 25 / 26 / 47 / 48', pv('%s', '2', 'Motion[1]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[4]').split(',').length === 8 && pv('%s', '2', 'Motion[5]') === '[\"7:0x04 #37\",\"7:0x04 #38\"]', 'L2 M4: eight entries; L2 M5: 37 / 38 (39..42 unnamed)', pv('%s', '2', 'Motion[5]'));" % (mon, mon, mon),
    "  ok(pv('%s', '0', 'Motion[36]').split(',').length === 6 && pv('%s', '0', 'Motion[6]') === '[\"1:0x01 #56\",\"1:0x01 #57\"]', 'L0 M36: six entries; L0 M6: 56 / 57');" % (mon, mon)]),
  'controls': "\n".join([
    "    ['e25', { seq: [{ list: '2', clip: 'Motion[1]', variant: '7:0x00 #26', len: 722 }] }, 'the pair\\'s other entry (26 for 25)'],",
    "    ['e29', { seq: [{ list: '2', clip: 'Motion[4]', variant: '7:0x03 #30', len: 602 }] }, 'the pair\\'s other entry (30 for 29)'],",
    "    ['e27', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],"]),
  'page': "\n".join([
    "  for (const [list, clip] of [['2', 'Motion[3]'], ['0', 'Motion[36]']]){",
    "    await pick(list, clip);",
    "    const w = await watch(320, x => x.some(y => y.shell === 'shell13'));",
    "    check(w.some(x => x.shell === 'shell13' && x.key === 10 && x.req), 'L' + list + ' ' + clip + ': rubble, shell13, u 10 started', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [10, 20]){",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em012_00u' && x.def.record.key === key);",
    "    if (!e){ check(false, 'em012_00u ' + key + ' exported as a shell record'); continue; }",
    "    let started = 0, maxRun = 0;",
    "    for (let rep = 0; rep < 2; rep++){",
    "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
    "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
    "    }",
    "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\spec_lao.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-lao-check.mjs'
s = open(out, encoding='utf8').read()
a = "    if (c.precall) o.precall = c.precall;"
assert s.count(a) == 1
s = s.replace(a, a + "\n    // (Lao-Shan Lung: the event lists' flag / sound actions answered 0 -- not shells; his sp_13 setup is 0x70 bytes)\n    o.stubs = ['0xc44c70', '0x3ae2c8']; o.setupLen = 0x70;")
open(out, 'w', encoding='utf8').write(s)
print('patched')
