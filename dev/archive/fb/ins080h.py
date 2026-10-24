# ins080h.py (2026-10-20): Hellblade Glavenus (em080_04) into docs/render/shells.js -- the action shell01 arm of spawn080, sp_03's
# vt+0x154 (0x1010df8) children, SHELL_DATA.em080_04
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'
BS = chr(92)
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
def rep(a, b, cnt=1):
    global s
    a = a.replace('\n', NL); b = b.replace('\n', NL)
    assert s.count(a) == cnt, (s.count(a), a[:70])
    s = s.replace(a, b)

# 1. spawn080: the shell01 an ACTION makes (Hellblade's (7, 0x8e / 0xe8 / 0xf6 / 0xf7 / 0xfc / 0xfd))
rep("""    if (sp.shell === 'shell03'){
      const got = boltInputs(input);""", """    if (sp.shell === 'shell01'){
      // Hellblade's makers (e.g. 0x100e074 / 0x1005a78, trgen g80cap.py VAR=4): id [e+0xcbe4], the mode, him; +0x10.. and the words
      // +0x30.. zero -- base01 places it at the joint (sp_01 int 1 = 145, bit 0) plus the vec through the joint's 3x3 (flag 2 clear)
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: sp.mode, position: [0, 0, 0], angles: [0, 0, 0],
                                               action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
      else out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why: 'em080 shell01: the init refused' });
      continue;
    }
    if (sp.shell === 'shell03'){
      const got = boltInputs(input);""")

# 2. sp_03's vt+0x154 0x1010df8 (base03's end calls it): 0x3fd820 (ef +0x1660: this reader writes none), then with the owner active
#    modes 41..43 -> shell01 12, 44..46 -> 13 at its +0x40, ITS words +0xfe8.. (byte +0x15c0 = 1)
rep("""      if ((S.base === 'base19' || (S.k && S.k.ef1660)) && S.mode.ef[1]){
        contactStart(S, D, 1, S.position, 'end');
        for (const e of S.events) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
      }
      out.ended.push(S);""", """      if ((S.base === 'base19' || (S.k && S.k.ef1660)) && S.mode.ef[1]){
        contactStart(S, D, 1, S.position, 'end');
        for (const e of S.events) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
      }
      if (END03[S.cls]) END03[S.cls](S, ctx, S.events);
      out.ended.push(S);""")
rep("""// one bolt's step (vtable +0x24 = base00's 0x3f96a0: state 1 -> sp_03's +0x158, state 0xfe -> base00's 0x3f986c)
function stepBolt(""", """// a base03 class's vt+0x154 after base03's 0x3fd820, by class. GLAVENUS / HELLBLADE sp_03 0x1010df8 (READ 2026-10-20): with the owner
// active (0x4a0f38), mode 41..43 -> shell01 [owner+0xcbe4] mode 12, 44..46 -> 13 (else nothing), the setup +0x10.. = its +0x40..,
// +0x30.. = ITS words +0xfe8.., +0x3c 0xffff; byte +0x15c0 = 1. (+0x150 type 0, a stop: ef 1 at +0x40 and the end -- every reached
// mode's ef 1 is (999, -1); type 1 for modes outside 6..23: ef 2 and the end; type 2: ef 3 with byte +0x15c1 0)
const END03 = {
  uShellEm080_sp_03: (S, ctx, events) => {
    const m = S.modeIndex, cm = m >= 41 && m <= 43 ? 12 : m >= 44 && m <= 46 ? 13 : -1;
    if (cm < 0 || !ctx || !ctx.create) return;
    ctx.create(S, 'shell01', { mode: cm, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) }, events);
  },
};
// one bolt's step (vtable +0x24 = base00's 0x3f96a0: state 1 -> sp_03's +0x158, state 0xfe -> base00's 0x3f986c)
function stepBolt(""")

# 3. SHELL_DATA.em080_04
blk = r'''// ---- HELLBLADE GLAVENUS (em080_04, uEm080_00 variant 4): sp_00 0x149, sp_01 0x14a, sp_03 0x14b -- dev/em080-shells-spec.md 5 (shells
// agent, 2026-10-20; dev/shells-hellblade-check.mjs). The same classes as Glavenus's (the readers' 0x149 / 0x14b arms differ only
// in the int that sets bit 11); his own ShellInfoLists. The census of his reach (neset/triage_all2.txt, trgen g80cap.py VAR=4, the
// phases h80ph.py; clips are the ones playing at the maker's phase):
//   (7, 0x02 / 0xf0) L2 M2 f122 sp_03 9 / 10 / 11, 41 / 42 / 43; (7, 0x0b / 0xea) L2 M11 f132 sp_03 18 / 19 / 20, 44 / 45 / 46
//   (7, 0x09 / 0xd9 / 0x97 / 0xf3) L2 M9 (phase 1 from 52; 0x97 / 0xd9 phase 0 L9 M13) phase 2 f70 / 120 / 168: sp_00 7 / 8 / 9,
//   7 / 8 / 9, 1 / 2 / 3, 42 / 43 / 44; (7, 0x0a / 0x0c / 0xd4 / 0xdb / 0xf4) L2 M10 (phase 1 from 38; 0xdb phase 0 L9 M12) phase 2
//   f92: sp_00 0 / 6 / 41 / 0 / 35; (7, 0x5c / 0xfe) L2 M55 f56 sp_00 4 / 39; (7, 0x5d / 0xff) L2 M57 f56 sp_00 5 / 40
//   (7, 0xeb) L2 M15 f10 / f40 sp_00 26 / 27; (7, 0xee) L2 M1 f48 sp_00 25; (7, 0xf9) L2 M17 f58 sp_00 24
//   (7, 0xfa) phase 0 the angle-picked turn 0x7a258 on table 0x16a1d40 (threshold 0: always a side -- 0x212 L2 M18 / 0x213 L2 M19),
//   phase 1 f40 sp_00 28 (0x100f08c)
//   (7, 0xe6) phase 0 L9 M2..M6 by angle (0x902..0x906, phases 1..5), each's end L9 M7 (0x907) and phase 6 -> 7; 0x100f1f4 (actions
//   0xe5..0xe7) at his action_tune floats 0x2b = 22 -> sp_00 34 and 0x2c = 32 -> sp_00 33
//   (7, 0x8e) L4 M11 then L2 M14 from 76: phase 2 f120 sp_01 25; (7, 0xf7) L2 M14 f102 sp_01 4 / 5; (7, 0xf6) L2 M13 f100 sp_01 22 / 23;
//   (7, 0xe8) L2 M37 f66 sp_01 6 / 7; (7, 0xfc / 0xfd) L2 M34, M35, then (0xbf4e4) L2 M36 (0x224, phase 3) f20 sp_01 6 / 7 (M36 ships
//   as _start 24 + _loop: 20 is the _start's)
{
  const D = {
    name: 'Hellblade Glavenus',
    lists: { 0: { list: 'u', pel: 'em080_04u' } },
    actions: [],
    shells: {
      shell00: { id: 0x149, cls: 'uShellEm080_sp_00', base: 'base00', reader: 0x100f9fc, folder: 'shell@@BS@@em@@BS@@em080_04_shell00',
        lists: { 0: { list: 'u', pel: 'em080_04u' } }, cmn: { ints: [], floats: @@CMN00@@, vecs: [] }, modes: {
@@MODES00@@
        }, hitdata: @@HD00@@ },
      shell01: { id: 0x14a, cls: 'uShellEm080_sp_01', base: 'base01', reader: 0x1010418, folder: 'shell@@BS@@em@@BS@@em080_04_shell01',
        lists: { 0: { list: 'u', pel: 'em080_04u' } }, modes: {
@@MODES01@@
        }, hitdata: @@HD01@@ },
      shell03: { id: 0x14b, cls: 'uShellEm080_sp_03', base: 'base03', reader: 0x1010964, folder: 'shell@@BS@@em@@BS@@em080_04_shell03',
        lists: { 0: { list: 'u', pel: 'em080_04u' } }, modes: {
@@MODES03@@
        }, hitdata: @@HD03@@ },
    },
  };
  const A = (n, list, clip, spawns, more) => Object.assign({ action: [7, n], code: 'em080', list, clip, partners: [], pick: 'ai',
    variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns }, more || {});
  const at = (sh, F, ms) => ms.map(m => ({ frame: F, shell: sh, mode: m, modes: [m] }));
  const tri = (sh, ms) => [[70, ms[0]], [120, ms[1]], [168, ms[2]]].map(([frame, m]) => ({ frame, shell: sh, mode: m, modes: [m] }));
  D.actions.push(A(0x02, '2', 'Motion[2]', at('shell03', 122, [9, 10, 11])));
  D.actions.push(A(0xf0, '2', 'Motion[2]', at('shell03', 122, [41, 42, 43])));
  D.actions.push(A(0x0b, '2', 'Motion[11]', at('shell03', 132, [18, 19, 20])));
  D.actions.push(A(0xea, '2', 'Motion[11]', at('shell03', 132, [44, 45, 46])));
  D.actions.push(A(0x09, '2', 'Motion[9]', tri('shell00', [7, 8, 9])));
  D.actions.push(A(0x97, '2', 'Motion[9]', tri('shell00', [1, 2, 3])));
  D.actions.push(A(0xd9, '2', 'Motion[9]', tri('shell00', [7, 8, 9])));
  D.actions.push(A(0xf3, '2', 'Motion[9]', tri('shell00', [42, 43, 44])));
  for (const [n, m] of [[0x0a, 0], [0x0c, 6], [0xd4, 41], [0xdb, 0], [0xf4, 35]]) D.actions.push(A(n, '2', 'Motion[10]', at('shell00', 92, [m])));
  D.actions.push(A(0x5c, '2', 'Motion[55]', at('shell00', 56, [4])));
  D.actions.push(A(0xfe, '2', 'Motion[55]', at('shell00', 56, [39])));
  D.actions.push(A(0x5d, '2', 'Motion[57]', at('shell00', 56, [5])));
  D.actions.push(A(0xff, '2', 'Motion[57]', at('shell00', 56, [40])));
  D.actions.push(A(0xeb, '2', 'Motion[15]', [...at('shell00', 10, [26]), ...at('shell00', 40, [27])]));
  D.actions.push(A(0xee, '2', 'Motion[1]', at('shell00', 48, [25])));
  D.actions.push(A(0xf9, '2', 'Motion[17]', at('shell00', 58, [24])));
  D.actions.push(A(0xfa, '2', 'Motion[18]', at('shell00', 40, [28])));
  D.actions.push(A(0xfa, '2', 'Motion[19]', at('shell00', 40, [28])));
  D.actions.push(A(0xe6, '9', 'Motion[7]', [...at('shell00', 22, [34]), ...at('shell00', 32, [33])]));
  D.actions.push(A(0x8e, '2', 'Motion[14]', at('shell01', 120, [25])));
  D.actions.push(A(0xf7, '2', 'Motion[14]', at('shell01', 102, [4, 5])));
  D.actions.push(A(0xf6, '2', 'Motion[13]', at('shell01', 100, [22, 23])));
  D.actions.push(A(0xe8, '2', 'Motion[37]', at('shell01', 66, [6, 7])));
  D.actions.push(A(0xfc, '2', 'Motion[36]', at('shell01', 20, [6, 7]), { partners: ['Motion[36]_start'] }));
  D.actions.push(A(0xfd, '2', 'Motion[36]', at('shell01', 20, [6, 7]), { partners: ['Motion[36]_start'] }));
  SHELL_DATA.em080_04 = D;
}
'''
import json, ast, subprocess, sys
L = open(SP + r'\shl_em080_04.txt', encoding='utf8').read().split('\n')
def modes_of(tag):
    i = [k for k, l in enumerate(L) if l.startswith('== ') and tag in l][0]
    out = []; cmn = None
    for l in L[i+1:]:
        l2 = l.strip()
        if l2.startswith('=='): break
        if l2.startswith('cmn path') and '{' in l2 and 'NOT IN ARC' not in l2:
            cmn = ast.literal_eval(l2[l2.index('{'):])
        if not l2.startswith('mode '): continue
        n = int(l2.split()[1]); d = json.loads(l2[l2.index('{'):])
        ef = [[a, (-1 if b == 4294967295 else b)] for a, b in d['ef'][0]['arr']]
        out.append("          %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(d['hit']['ints']), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
    return '\n'.join(out), cmn
hd = subprocess.check_output([sys.executable, SP + r'\hit.py', 'em080_04'], text=True)
HD = {}
for line in hd.strip().split('\n'):
    parts = line.split(' ', 3)
    HD[parts[1]] = json.dumps([list(t) for t in ast.literal_eval(parts[3])])
m00, c00 = modes_of('shell00'); m01, _ = modes_of('shell01'); m03, _ = modes_of('shell03')
print('cmn00', c00)
blk = blk.replace('@@MODES00@@', m00).replace('@@MODES01@@', m01).replace('@@MODES03@@', m03).replace('@@CMN00@@', json.dumps(c00['floats'] if c00 else []))
blk = blk.replace('@@HD00@@', HD['em080_04_00_hitdata']).replace('@@HD01@@', HD['em080_04_01_hitdata']).replace('@@HD03@@', HD['em080_04_03_hitdata'])
blk = blk.replace('@@BS@@', BS + BS).replace('\n', NL)
A = '  SHELL_DATA.em080_00 = D;' + NL + '}' + NL
assert s.count(A) == 1
s = s.replace(A, A + blk)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
