# mk_plaincheck.py <spec.json>: a dev/shells-<name>-check.mjs from dev/shells-elderfrost-check.mjs's machinery, for a monster whose
# shells the spec lists. spec: { name, title, mon, main, variant, header (list of comment lines), folders {id: [mon, nn]},
#   owner_bytes {}, bases {id: base}, joints "js expr", cases "js array body", contract "js", controls "js array body", page "js body" }
import json, sys
S = json.load(open(sys.argv[1], encoding='utf8'))
src = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-elderfrost-check.mjs', encoding='utf8').read()
def cut(a, b, new, keep_b=True):
    global src
    i = src.index(a); j = src.index(b, i)
    src = src[:i] + new + src[j:]
i = src.index('import { writeFileSync')
src = '\n'.join('// ' + l if l else '//' for l in S['header']) + '\n' + src[i:]
cut("  const JOINTS = {", "  const v = n =>", S['joints'] + "\n  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];\n  const F083 = " +
    json.dumps({str(int(k, 0)): v for k, v in S['folders'].items()}) + ";\n")
src = src.replace("Object.assign({ name, mon: 'em083_04', n,", "Object.assign({ name, mon: '%s', n," % S['mon'])
src = src.replace("steps: [{ fn: '1050a1c', phase, win, frame }]", "steps: [{ fn: '%s', phase, win, frame }]" % S['main'])
src = src.replace("emVariant: 4, hitLife: false,", "emVariant: %d, hitLife: false," % S['variant'])
src = src.replace("owner_bytes: { '0x73e0': [7, n], '0xcae0': [0x65, 1, 0, 0], '0xcae4': [0x68, 1, 0, 0], '0xcae8': [0x6a, 1, 0, 0] }",
                  "owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, %s)" % json.dumps(S.get('owner_bytes', {})))
# C(..., x) uses x before Object.assign: rewrite the helper to read x.st
src = src.replace("  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({", "  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({")
cut("  const cases = [", "  for (const c of cases) c.folders = F083;", "  const cases = [\n" + S['cases'] + "\n  ];\n")
src = src.replace("const BASE = { 0x165: 'base00', 0x166: 'base00', 0x167: 'base00', 0x168: 'base01', 0x16a: 'base13', 0x16b: 'base13' };",
                  "const BASE = " + '{ ' + ', '.join('%s: %s' % (k, json.dumps(v)) for k, v in S['bases'].items()) + ' };')
cut("  const pv = (m, l, c) =>", "  // ---- 3. CONTROLS", "  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));\n" + S['contract'] + "\n\n")
cut("  const controls = [", "  const CR = runEmu", "  const controls = [\n" + S['controls'] + "\n  ];\n")
cut("  const MON = 'em083_04';", "  const open = async", "  const MON = '%s';\n" % S['mon'])
src = src.replace("'Elderfrost shells: '", "'%s shells: '" % S['title'])
cut("  check(await open(), 'his runtime is up');", "  return out;\n}", "  check(await open(), 'the runtime is up');\n" + S['page'] + "\n")
src = src.replace('    for (let i = 0; i < 460; i++) steps.push({ q: last.q, frame: last.q.len });', '    for (let i = 0; i < 960; i++) steps.push({ q: last.q, frame: last.q.len });   // (a child made late still gets its 460 moves)')
src = src.replace('steps: c.steps, frames: 460 };', 'steps: c.steps, frames: c.frames || 460 };')
src = src.replace('for (let i = 0; i < 960; i++) steps.push', 'for (let i = 0; i < (x.frames || 460) + 500; i++) steps.push')
# the elderfrost-only inputs stay harmless (trunk / precall / noTurn / snow read nothing unless a case names them)
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-%s-check.mjs' % S['name']
open(out, 'w', encoding='utf8').write(src)
print('wrote', out)
