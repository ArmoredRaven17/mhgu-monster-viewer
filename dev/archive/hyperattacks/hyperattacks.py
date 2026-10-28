"""hyperattacks/hyperattacks.py (hyper-attacks lane, 2026-10-27; Raven: "We need to look over each attack, see if they are impacted by
Hyper state parts or not" / "If they are, then look into how they are impacted").  khezutable.py generalised to every hyper monster.

ROWS: every action that arms an attack record (docs/attack-hitshapes.json `arms`), makes a shell (render/shells.js SHELL_DATA) or a beam
(render/beam-spawns.js BEAM_SPAWNS), requests an effect from its own code (psl-mask.js ACTION_EFFECTS) or plays a clip whose PSL fires
effect records (render/monster.js CLIP_EFFECTS), or is named by a ModifyData entry -- with the clips it plays (docs/action-motions.json
`actions`, the arms' clips, the shells' clips / partners, hyper-motion.json `actMotions`).
COLUMNS: per .mdd file (below G = <id>_doumouka.mdd, G = _g.mdd; the loader 0x4bd64 by e+0xb736) and per pair the viewer can hold
(index.html hyperOptions: one group-0 aura x one group-1 aura), every MECHANISM below.  The mechanisms are the READ ones of
dev/hyper-states.md 6 / 6.5 / 7; a new one is added by appending a function to MECHANISMS, or -- without code -- an entry in
mechanisms_extra.json (format at load_extra()), and re-running:

   node dev/archive/hyperattacks/dumpviewer.mjs > dev/archive/hyperattacks/viewer.json
   python dev/archive/hyperattacks/hyperattacks.py          -> dev/hyper-attacks.md + dev/archive/hyperattacks/hyperattacks.json

Every "not impacted" is "per the mechanisms read so far" (the list is printed in the document's head)."""
import json, os, re, collections
HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
J = lambda *p: json.load(open(os.path.join(V, *p), encoding='utf8'))
HM, HA, AM, AH = J('docs', 'hyper-motion.json'), J('docs', 'hyper-auras.json'), J('docs', 'action-motions.json'), J('docs', 'attack-hitshapes.json')
HOOKS = J('dev', 'archive', 'hypermotion', 'hooks.json')
HSH = J('dev', 'archive', 'gapZ', 'hypershells2.json')            # render/shells.js HYPER_SHELLS: per shell cls (+0x15a8), aura, off
VW = J('dev', 'archive', 'hyperattacks', 'viewer.json')            # dumpviewer.mjs
MONS = {m['id']: m for m in J('docs', 'monsters.json')['monsters']}
RANK = {'normal': 'below G', 'g': 'G'}

# ---------------------------------------------------------------------------------------------------------------- helpers
def aname(a): return ('clip ' + hkey(a[1])) if a and a[0] == 'clip' else '%d:0x%02x' % (a[0], a[1])
def aparse(s):
    m = re.match(r'(\d+):0x([0-9a-f]+)', str(s), re.I)
    return (int(m.group(1)), int(m.group(2), 16)) if m else None
def ckey(list_, clip):                                   # '2|Motion[3]'
    return '%s|%s' % (list_, re.sub(r'_(start|loop)$', '', clip))
def hkey(ck):                                            # '2|Motion[3]' -> 'L2 M3'
    l, c = ck.split('|'); return 'L%s M%s' % (l, re.search(r'\d+', c).group())
def order():
    out = []
    for l in open(os.path.join(V, 'dev', 'effects-walk-order.md'), encoding='utf8'):
        c = [x.strip() for x in l.split('|')]
        if len(c) > 3 and c[1].isdigit() and re.match(r'em\d{3}_\d\d$', c[2]): out.append((c[2], c[3]))
    return out
def triage_joints(mon):
    out = {}
    p = os.path.join(V, 'dev', 'effects-triage', mon + '.md')
    if os.path.exists(p):
        for l in open(p, encoding='utf8'):
            c = [x.strip() for x in l.split('|')]
            if len(c) > 6 and c[1] == 'u' and c[2] == 'UNIQUE' and c[3].isdigit():
                try: out[int(c[3])] = int(c[5])
                except ValueError: pass
    return out
def viewer_clips(mon):
    m = MONS.get(mon) or {}
    return {ckey(L['id'], c['clip']) for L in m.get('lists', []) for c in L.get('clips', [])}

def pairs(mon, fk):
    h = (HA.get(mon) or {}).get(fk)
    if not h: return []
    g0 = [a for a in h['auras'] if a['group'] == 0] or [None]; g1 = [a for a in h['auras'] if a['group'] == 1] or [None]
    out = []
    for a in g0:
        for b in g1:
            p = [x for x in (a, b) if x]
            if p: out.append(','.join(str(x['id']) for x in p))
    return out
def group_ids(mon, fk, pair):                            # [group-0 ID, group-1 ID] (None where the group holds none)
    h = HA[mon][fk]; ids = [int(x) for x in pair.split(',')]
    return [next((i for i in ids if any(a['id'] == i and a['group'] == k for a in h['auras'])), None) for k in (0, 1)]

# ---------------------------------------------------------------------------------------------------------------- the monster bundle
class Mon:
    def __init__(s, mon):
        s.id = mon; s.T = HM[mon]; s.A = AH.get(mon) or {}; s.AMo = AM.get(mon) or {}
        s.files = [fk for fk in ('normal', 'g') if (s.T.get(fk) or {}).get('hooks') is not None and pairs(mon, fk)]
        s.vclips = viewer_clips(mon); s.bj = triage_joints(mon)
        s.shells = VW['shells'].get(mon, []); s.beams = VW['beams'].get(mon, []); s.ce = VW['clipEffects'].get(mon, {})
        s.ca = VW['clipActions'].get(mon, {}); s.sp = VW['specials'].get(mon, []); s.picks = VW['picks'].get(mon, {})
        s.ae = VW['actionEffects'].get(mon, {})
        s.H = HSH.get(mon, {})
        s.rows = collections.OrderedDict(); s.build()
    def row(s, act):
        return s.rows.setdefault(act, {'act': act, 'why': set(), 'clips': set(), 'records': set(), 'shells': [], 'beams': [], 'effects': set()})
    def build(s):
        for clip, arms in (s.A.get('arms') or {}).items():
            for a in arms:
                ac = aparse(a[4])
                if ac: r = s.row(ac); r['why'].add('attack'); r['clips'].add(clip); r['records'].add(a[1])
        for x in s.shells:
            for ac in [x['action']] + (x.get('also') or []):
                r = s.row(tuple(ac)); r['why'].add('shell'); r['shells'].append(x)
                if x.get('clip'): r['clips'].add(ckey(x['list'], x['clip']))
                for p in x.get('partners') or []: r['clips'].add(ckey(x['list'], p))
        for b in s.beams:
            if b.get('action'):
                r = s.row(tuple(b['action'])); r['why'].add('beam'); r['beams'].append(b); r['clips'].add(ckey(b['list'], b['clip']))
        for clip, e in s.ae.items():
            for an, rec in e['by'].items():
                r = s.row(aparse(an)); r['why'].add('effect (action code)'); r['clips'].add(clip); r['effects'].add('%s %d @f%g' % (rec[0][-1], rec[1], e['frame']))
        # the per-frame shell makers (by motion id): on every census action playing the motion, else a row of the clip itself
        for r in VW['perFrame'].get(s.id, []):
            for mid in r['ids']:
                ck = '%d|Motion[%d]' % (mid >> 8, mid & 0xff)
                x = dict(shell=r['shell'], mode=r.get('mode'), modes=r.get('modes'), list=str(mid >> 8), clip='Motion[%d]' % (mid & 0xff),
                         frame=(r.get('frames') or [None])[0], perFrame=r['src'], pick='perFrame', rankG=r.get('rankG'))
                acts = [aparse(a) for a in ((s.AMo.get('motions') or {}).get(ck) or []) if aparse(a)] or [('clip', ck)]
                for ac in acts:
                    rw = s.row(ac); rw['why'].add('shell (per-frame)'); rw['shells'].append(x); rw['clips'].add(ck)
        for fk in s.files:
            for ID, ents in s.T[fk]['modify'].items():
                for e in ents: s.row((e[0], e[1]))['why'].add('ModifyData')
        # the tired-only actions (op-0x24 tired arms) and the Exhausted clips are rows too (mech_never_tired)
        for ac in tired_only_actions(s): s.row(ac)['why'].add('tired-only')
        for ck in VW.get('tiredClips', {}).get(s.id) or []:
            ck = ckey(*ck.split('|'))
            for ac in [aparse(a) for a in ((s.AMo.get('motions') or {}).get(ck) or []) if aparse(a)] or [('clip', ck)]:
                rw = s.row(ac); rw['why'].add('Exhausted clip'); rw['clips'].add(ck)
        # the clips each action plays: the full census, ModifyData's own tracer (actMotions)
        for an, ms in (s.AMo.get('actions') or {}).items():
            ac = aparse(an)
            if ac in s.rows:
                for m in ms: s.rows[ac]['clips'].add(m['m'])
        for an, ms in (s.T.get('actMotions') or {}).items():
            ac = aparse(an)
            if ac in s.rows:
                for m in ms: s.rows[ac]['clips'].add(m)
        # clip-PSL effects: an action is an effect row when a clip it plays fires effect records -- added for EVERY census action
        for an, ms in (s.AMo.get('actions') or {}).items():
            ac = aparse(an)
            fx = set()
            for m in ms:
                ck = m['m']; l, c = ck.split('|')
                for bit in s.ce.get('L%s %s' % (l, c), []): fx.add('%s %s' % (bit[1].replace('.efl', ''), bit[2]))
            if fx:
                r = s.row(ac); r['why'].add('effect (clip PSL)'); r['effects'] |= fx
                for m in ms: r['clips'].add(m['m'])
        # COVERAGE (2026-10-27, after Raven's L2 M37 question): every clip that arms a record, fires PSL effects, is hooked or makes a
        # shell must reach a row. Two kinds missed before: the PER-FRAME arms (attack-hitshapes `arms` keyed 'pf+0x2a8' / 'pf+0x208' ..:
        # a vtable slot run every frame of the motion, not an action) -- now on every census action playing the clip -- and clips no
        # census action plays (chains, partner layers, turn pieces): now a row of the clip itself ('clip L M').
        mot = s.AMo.get('motions') or {}
        def clip_rows(ck):
            acts = [aparse(a) for a in (mot.get(ck) or []) if aparse(a)]
            out = []
            for a in acts:
                r = s.row(a); out.append(r)
                for m in ((s.AMo.get('actions') or {}).get(aname(a)) or []): r['clips'].add(m['m'])
            return out or [s.row(('clip', ck))]
        for ck, arms in (s.A.get('arms') or {}).items():
            pf = [a for a in arms if not aparse(str(a[4]))]
            if pf:
                for r in clip_rows(ck):
                    r['why'].add('attack (per-frame %s)' % '/'.join(sorted({str(a[4]) for a in pf}))); r['clips'].add(ck); r['records'] |= {a[1] for a in pf}
        covered = set().union(*[r['clips'] for r in s.rows.values()]) if s.rows else set()
        want = {}
        for k, bits in s.ce.items():
            mm = re.match(r'L(\d+) (Motion\[\d+\])$', k)
            if mm and bits: want.setdefault(mm.group(1) + '|' + mm.group(2), set()).add('effect (clip PSL)')
        for fk in s.files:
            for h in s.T[fk]['hooks'].values():
                for hk in h:
                    l, n = re.findall(r'\d+', hk); want.setdefault('%s|Motion[%s]' % (l, n), set()).add('hooked')
        for ck, why in want.items():
            if ck in covered: continue
            for r in clip_rows(ck):
                r['why'] |= why; r['clips'].add(ck)
                l, c = ck.split('|')
                r['effects'] |= {'%s %s' % (b[1].replace('.efl', ''), b[2]) for b in s.ce.get('L%s %s' % (l, c), [])}
    # the actions known to play a clip (index.html hyperMotionAt's census branch: arms + actMotions + the full census)
    def census(s, ck):
        names = {a[4] for a in (s.A.get('arms') or {}).get(ck, [])}
        names |= {a for a, ms in (s.T.get('actMotions') or {}).items() if ck in ms}
        names |= set(((s.AMo.get('motions') or {}).get(ck)) or [])
        return {aparse(n) for n in names if aparse(n)}
    # the viewer's route to a play's action on a clip (index.html playNow): a Special naming it, the shells' pick, CLIP_ACTIONS, else census
    def viewer_actions(s, ck):
        picks = [aparse(v) for v in s.picks.get(ck, []) if aparse(v)]
        if picks: return 'pick', set(picks)
        ents = s.ca.get(ck)
        if ents: return 'CLIP_ACTIONS', {aparse(x) for e in ents for x in e if x}
        return 'census', None
    def specials_for(s, act):
        return [x['name'] for x in s.sp if x.get('action') and aparse(x['action']) == act]

def modify_entry(M, fk, pair, act):
    """vt+0x16c 0xc9e88: BOTH groups' ActionElements held, group 0's entries then group 1's, the first naming the action, roll < Rate."""
    g = group_ids(M.id, fk, pair); mod = M.T[fk]['modify']
    if g[0] is None or g[1] is None or str(g[0]) not in mod or str(g[1]) not in mod: return None, None
    for i in g:
        for k, e in enumerate(mod[str(i)]):
            if (e[0], e[1]) == act and e[2] > 0: return e, (i, k)
    return None, None
def factor(e): return min(e[3], e[4]) if e else 1

# ---------------------------------------------------------------------------------------------------------------- the mechanisms
# Each: fn(M, fk, pair, row) -> [change]; a change = dict(kind, cls ('projectile' | 'effect' | 'motion' | 'power' | 'hit'), what, ids, addr,
# viewer ('yes' | 'no' | 'partly' | 'listed'), why).  'cls' orders the section: projectile / effect changes first (Raven: "some do impact
# projectiles or similar effects").
def mech_hook(M, fk, pair, row):
    """the class hook (vt+0x1ec below G / vt+0x1f0 G): rates 0xb07b4, bursts 0xca4e0 = u 1310 + ID."""
    out = []; hk = M.T[fk]['hooks'].get(pair, {}); tab = (HOOKS.get(M.id, {}).get(fk) or {}).get('table') or {}
    for ck in sorted(row['clips'], key=lambda c: [int(x) for x in re.findall(r'\d+', c)]):
        h = hk.get(hkey(ck))
        if not h: continue
        ids = [i for i in pair.split(',') if hkey(ck) in tab.get(i, {})]
        sites = sorted({x for i in ids for x in tab[i][hkey(ck)].get('sites', [])})
        inview = ck in M.vclips
        vw, why = ('yes', '') if inview else ('no', 'the motion is not in the viewer\'s list')
        addr = 'hook %s, bl %s' % (M.T['hook'][fk], ' '.join(sites) or '?')
        if h['rates']:
            out.append(dict(kind='speed (hook)', cls='motion', what='%s: %s' % (hkey(ck), ', '.join('f%d x%g' % tuple(r) for r in h['rates'])),
                            ids='ID ' + '/'.join(ids), addr=addr, viewer=vw, why=why))
        for b in h['bursts']:
            j = M.bj.get(1310 + b[1])
            out.append(dict(kind='burst', cls='motion', what='%s f%d u %d (cm202_100%s)' % (hkey(ck), b[0], 1310 + b[1], ', joint %d' % j if j is not None else ''),
                            ids='ID %d' % b[1], addr=addr, viewer=vw, why=why))
    return out
def mech_modify(M, fk, pair, row):
    """ModifyData ActionElements: MotionSpeedRate / Limit (0xc9e88 -> 0xc046c, P+0x38c) and AttackRate / PowerRate (0x1689b0)."""
    e, at = modify_entry(M, fk, pair, row['act'])
    if not e: return []
    out = []; src = 'ModifyData ID %d #%d' % (at[0], at[1])
    def route(val, label):
        """index.html hyperMotionAt: the play's action (a Special, the shells' pick, CLIP_ACTIONS), else the clip's census when every
        action that plays it gives the same value -- else none ('ambiguous')."""
        vws = []
        for ck in sorted(row['clips']):
            how, acts = M.viewer_actions(ck)
            if how == 'census':
                fs = {val(modify_entry(M, fk, pair, a)[0]) for a in M.census(ck)}
                ok = fs == {val(e)}
                vws.append((ck, 'yes' if ok else 'no', 'census agrees' if ok else 'ambiguous: %d actions, %s' % (len(M.census(ck)), '/'.join(sorted(str(f) for f in fs)))))
            else:
                ok = row['act'] in acts
                vws.append((ck, 'yes' if ok else 'no', 'the play names it (%s)' % how if ok else 'plays name %d other action(s) (%s)' % (len(acts), how)))
        sp = M.specials_for(row['act'])
        vws = [v for v in vws if v[0] in M.vclips] or vws
        ys = [v for v in vws if v[1] == 'yes']
        vw = 'yes' if vws and len(ys) == len(vws) else ('partly' if ys or sp else 'no')
        why = '; '.join('%s %s: %s' % (hkey(v[0]), v[1], v[2]) for v in vws if v[1] != 'yes')
        if sp: why = (why + '; ' if why else '') + 'Special %s names it' % ' / '.join("'%s'" % n for n in sp)
        return vw, why
    if factor(e) != 1:
        vw, why = route(lambda x: 'x%g' % factor(x), 'factors')
        out.append(dict(kind='speed (ModifyData)', cls='motion', what='x%g (MotionSpeedRate %g, Limit %g) on every motion of the action' % (factor(e), e[3], e[4]),
                        ids='ID %d' % at[0], addr=src + ' -> 0xc9e88 / 0xc046c', viewer=vw, why=why))
    if len(e) > 6 and (e[5] != 1 or e[6] != 0):
        recs = sorted(row['records'])
        R = M.A.get('records') or []; R2 = M.A.get('records2') or []
        def rec(h): return (R2[h - 1000] if h >= 1000 and h - 1000 < len(R2) else R[h] if h < len(R) else None)
        vwp, whyp = route(lambda x: 'x%g +%g' % (x[5], x[6]) if x and len(x) > 6 else 'none', 'powers')
        pw = ', '.join('r%d %d -> %g, byte +0xb %d -> %d' % (h, rec(h)[5], round(rec(h)[5] * e[5], 2), rec(h)[8], rec(h)[8] + e[6]) for h in recs if rec(h))
        out.append(dict(kind='power', cls='power', what='AttackRate x%g, PowerRate +%g%s' % (e[5], e[6], ' (' + pw + ')' if pw else ' (no attack record of its own: every hit it arms)'),
                        ids='ID %d' % at[0], addr=src + ' -> 0xc9e88 -> 0x1689b0',
                        viewer='listed' if vwp == 'yes' else vwp, why='' if vwp == 'yes' else 'not in the tooltip -- ' + whyp))
    return out
def shell_elem(M, fk, pair, cls, aura):
    """0xcaa30: aura -1 (0xcad9c passes it while hyper) -> element 1's table (group 0) then element 2's; an ID -> only that ID's, if held."""
    sh = M.T[fk].get('shells') or {}
    for i in [x for x in group_ids(M.id, fk, pair) if x is not None]:
        if aura not in (-1, i): continue
        for r in sh.get(str(i), []):
            if r[0] == cls: return i, r
    return None, None
def shell_spawns(M, x, fk):
    """the shells a SHELL_DATA action entry (or a per-frame row) makes: [(shell, modes | None = every mode, clip key, frame)];
    shell '?' = the class spawner's own field names no shell the generator can resolve (named in the document)."""
    out = []; ck = ckey(x['list'], x['clip']) if x.get('clip') else x.get('ck')
    def ms(d):
        if fk == 'g' and d.get('modesG'): return list(d['modesG'])
        if d.get('modes') is not None and len(d['modes']): return list(d['modes'])
        return [d['mode']] if d.get('mode') is not None else (None if d.get('modes') is None else [])
    if x.get('shell') and not (x.get('spawns') and x.get('mode') is None and not x.get('modes')):
        m = ms(x)
        if m != []: out.append((x['shell'], m, ck, x.get('frame')))
    if isinstance(x.get('wave2'), dict) or isinstance(x.get('wave2'), list):
        for w in (x['wave2'] if isinstance(x['wave2'], list) else [x['wave2']]):
            if isinstance(w, dict): out.append((w.get('shell') or x.get('shell'), ms(w) or None, ck, w.get('frame')))
    code = x.get('code') if isinstance(x.get('code'), str) else ''
    for sp in x.get('spawns') or []:
        if not isinstance(sp, dict): continue
        fr = sp.get('frame', x.get('frame'))
        if sp.get('shell') or (x.get('shell') and code not in ('em057', 'em067', 'em070', 'em066', 'em082')):
            out.append((sp.get('shell') or x['shell'], ms(sp), ck, fr)); continue
        if code == 'em057':
            if sp.get('leap') is not None: out.append(('shell18', sorted({m for c in VW['LEAP057'][str(sp['leap'])][str(sp['which'])] for m in c}), ck, fr))
            elif sp.get('trio') is not None: pass                                   # Thunderlord only
            elif sp.get('ray') or sp.get('strikes'): out.append(('shell01', None, ck, fr))
            else: out.append(('?', None, ck, fr))
        elif code == 'em067':
            if sp.get('made'): out.append(('shell13', sorted({m for m, _ in sp['made']}), ck, fr))
            elif sp.get('hop067'): out.append(('shell13', [0, 1], ck, fr))
            else: out.append(('?', None, ck, fr))
        elif code == 'em070':
            mm = list(range(15)) if sp.get('k04') else sorted(set(sp.get('tiers') or []))
            out.append(('shell13' if sp.get('s13') else 'shell00', mm or None, ck, fr))
        elif code == 'em049' and sp.get('kind') in ('tail', 'chest'): out.append(('shell01', [sp['mode']], ck, fr))
        elif code == 'em066' and sp.get('rocks') is not None:
            out.append(('shell00', sorted({m for L in (sp['rocks'] + (sp.get('snowRocks') or [])) for m in L}), ck, fr))
        elif code == 'em082': out.append(('shell13' if sp.get('throw') else 'shell12', None, ck, fr))
        else: out.append(('?', None, ck, fr))
    return out
def mech_shell(M, fk, pair, row):
    """ShellElements (ShellClassNumber, AttackRate, ScaleRate) -> 0x43a8b0 / 0xcaa30: unit +0x60 = ScaleRate, each hit slot x ScaleRate."""
    out = []
    for x in row['shells']:
      for (shell, modes, ck, frame) in shell_spawns(M, x, fk):
        if shell == '?':
            if any((M.T[fk].get('shells') or {}).values()):
                out.append(dict(kind='shell (unresolved)', cls='projectile', what='spawner code %s makes a shell the generator cannot name (fields %s)' % (
                    x.get('code'), ','.join(sorted(k for sp in x.get('spawns') or [] for k in sp))), ids='?', addr='render/shells.js SHELL_DATA %s' % M.id,
                    viewer='?', why='read the spawner and add it to shell_spawns()'))
            continue
        c = M.H.get(shell)
        if not c: continue
        if modes == [] or (x.get('rankG') and fk != 'g'): continue
        if modes is None and isinstance(c['aura'], dict): modes = sorted(int(k) for k in c['aura'])      # a per-mode aura: every mode it lists
        hit = {}
        for m in (modes or [None]):
            mi = None if m is None else str(m)
            if mi is not None and mi in (c.get('off') or []): continue
            if isinstance(c['aura'], dict) and mi is not None and mi not in c['aura']: continue      # no such mode in the .shl
            aura = c['aura'] if isinstance(c['aura'], int) else c['aura'].get(mi, -1) if mi is not None else -1
            if aura == 0: continue
            i, r = shell_elem(M, fk, pair, c['cls'], aura)
            if r: hit.setdefault((i, r[1], r[2], aura), []).append(m)
        for (i, atk, sc, aura), ms in hit.items():
            vw, why = 'yes', ''
            if x.get('pick') == 'unread': vw, why = 'partly', 'the viewer plays this action only when forced (pick "unread": no read AI stream issues it)'
            if x.get('perFrame'): why = 'made by motion id (%s), whatever the action' % x['perFrame']
            ml = 'modes ' + ','.join(str(m) for m in ms) if ms != [None] else 'all modes' + (' but ' + ','.join(c['off']) if c.get('off') else '')
            out.append(dict(kind='shell scale' if sc != 1 else 'shell power', cls='projectile' if sc != 1 else 'power', what='%s (class %d, %s, %s f%s): scale x%g (its effects\' parent unit and each hit slot\'s radius), power x%g' % (
                                shell, c['cls'], ml, hkey(ck) if ck else '?', frame if frame is not None else '?', sc, atk),
                            ids='ID %d%s' % (i, ' (aura -1: any held)' if aura == -1 else ' (the shell\'s own ID)'),
                            addr='ShellElements ID %d class %d -> 0xcaa30' % (i, c['cls']),
                            viewer=vw, why=why))
    return out
def mech_beam(M, fk, pair, row):
    """a base02 beam: class 2, aura -1 (base02's ctor 0x3fb7f8); its unit and capsule radius x ScaleRate, not its reach."""
    out = []
    for b in row['beams']:
        if not (VW['beamHit'].get(b['type']) or [-1])[0] >= 0: continue
        i, r = shell_elem(M, fk, pair, 2, -1)
        if r:
            out.append(dict(kind='beam scale', cls='projectile', what='beam %s (%s f%s): scale x%g (look and hit-capsule radius; reach unchanged), power x%g' % (
                                b['type'], hkey(ckey(b['list'], b['clip'])), b.get('frame'), r[2], r[1]), ids='ID %d (aura -1: any held)' % i,
                            addr='ShellElements ID %d class 2 -> base02 0x3fb9bc -> 0xcaa30' % i,
                            viewer='yes', why=''))
    return out
NT_ADDR = 'P+0x1a8 bit 19 (0xba1a0; stamina 0xbd1a4)'
def tired_only_actions(M):
    """the actions only a TIRED monster plays: the shells' op-0x24 'if' picks (pickVariantsFor tired) and CLIP_ACTIONS / Special `tired`
    twins, less any action a not-tired stream or entry also names."""
    if hasattr(M, '_tired'): return M._tired
    normal = {aparse(v) for vs in M.picks.values() for v in vs if aparse(v)}
    normal |= {aparse(e[i]) for es in M.ca.values() for e in es for i in (0, 1) if e[i]}
    normal |= {aparse(x['action']) for x in M.sp if x.get('action')}
    t = {}
    for ck, vs in (VW.get('tiredPicks', {}).get(M.id) or {}).items():
        for v in vs:
            if aparse(v) and aparse(v) not in normal: t.setdefault(aparse(v), set()).add('the shells\' op-0x24 tired arm on %s' % hkey(ck))
    for ck, es in M.ca.items():
        for e in es:
            if e[2] and aparse(e[2]) not in normal: t.setdefault(aparse(e[2]), set()).add('CLIP_ACTIONS tired twin of %s on %s' % (e[0], hkey(ck)))
    for x in M.sp:
        if x.get('tired') and aparse(x['tired']) not in normal: t.setdefault(aparse(x['tired']), set()).add("Special '%s' tired form" % x['name'])
    M._tired = t
    return t
def mech_never_tired(M, fk, pair, row):
    """READ 2026-10-27 (Khezu AoE lane; hyper-states.md 8.2 READ, rom-map `0xba1a0..0xba1c0`): every Hyper monster has P+0x1a8 bit 19 set
    at the spawn init, whose only readers are the stamina routines -- it never becomes Exhausted. So every tired-only thing is ABSENT
    under Hyper (any pair, either rank: the flag, not the aura, sets it): the enable word's tired-only PSL bits (0xca170's 12-14 and any
    class arm on 0x81614), the op-0x24 tired arms (tired twin actions and the records they arm), the Exhausted clips, the drool c 1104."""
    out = []; act = row['act']
    tb = VW.get('tiredBits', {}).get(M.id) or {}
    for ck in sorted(row['clips'], key=lambda c: [int(x) for x in re.findall(r'\d+', c)]):
        l, c = ck.split('|'); e = tb.get('L%s %s' % (l, c)) or {}
        bits = e.get(aname(act)) if act[0] != 'clip' else None
        if bits is None: bits = e.get('-')
        if bits:
            out.append(dict(kind='absent (never tired)', cls='absent', what='%s: the tired-only PSL bits %s -- %s not drawn' % (
                hkey(ck), '/'.join(str(b[0]) for b in bits), ', '.join('key %s (%s)' % (b[2], b[1].replace('.efl', '')) for b in bits)),
                ids='any (the flag)', addr=NT_ADDR + '; PSL word 0xca170 / vt+0x13c', viewer='yes', why='Exhausted is cleared while a pair is held (index.html paintTired)'))
        if ck in set(VW.get('tiredClips', {}).get(M.id) or []):
            out.append(dict(kind='absent (never tired)', cls='absent', what='%s is an Exhausted clip (MOTION_STATES tired) -- never played under Hyper' % hkey(ck),
                ids='any (the flag)', addr=NT_ADDR, viewer='partly',
                why='the clip stays in the list and its row forces tired (index.html playNow: row.tired), so its tired bits still fire when picked'))
    t = tired_only_actions(M).get(act) if act[0] != 'clip' else None
    if t:
        recs = sorted(row['records'])
        out.append(dict(kind='absent (never tired)', cls='absent', what='the action is tired-only (%s) -- never issued under Hyper%s' % (
            '; '.join(sorted(t)), (': its records ' + ' '.join('r%d' % h for h in recs) + ' never armed') if recs else ''),
            ids='any (the flag)', addr=NT_ADDR + '; op 0x24 -> 0x81634', viewer='yes', why='the picks / CLIP_ACTIONS take the not-tired branch once Exhausted is cleared'))
    return out
def load_extra():
    """mechanisms_extra.json: [{"name", "addr", "status", "changes": [{"mon", "actions": ["7:0x07", ..] | "clips": ["2|Motion[12]"],
    "files": ["normal", "g"], "pairs": ["1,2"] | "any", "ids": "...", "kind", "cls", "what", "viewer", "why"}]}"""
    p = os.path.join(HERE, 'mechanisms_extra.json')
    return json.load(open(p, encoding='utf8')) if os.path.exists(p) else []
EXTRA = load_extra()
def mech_extra(M, fk, pair, row):
    out = []
    for mech in EXTRA:
        for c in mech.get('changes', []):
            if c.get('mon') != M.id or fk not in c.get('files', ['normal', 'g']): continue
            if c.get('pairs', 'any') != 'any' and pair not in c['pairs']: continue
            hit = (aname(row['act']) in c.get('actions', [])) or bool(set(c.get('clips', [])) & row['clips'])
            if hit: out.append(dict(kind=c['kind'], cls=c.get('cls', 'effect'), what=c['what'], ids=c.get('ids', ''), addr=mech.get('addr', '') + ' [' + mech['name'] + ']',
                                    viewer=c.get('viewer', 'no'), why=c.get('why', '')))
    return out
MECHANISMS = [mech_shell, mech_beam, mech_hook, mech_modify, mech_never_tired, mech_extra]
MECH_DOC = [
    ('the class hook (speed, bursts)', 'vt+0x1ec / vt+0x1f0 -> 0xb07b4 / 0xca4e0', 'hooks.json / hyper-motion.json `hooks`'),
    ('ModifyData MotionSpeedRate / Limit', 'vt+0x16c 0xc9e88 -> vt+0x368 0xc046c', 'hyper-motion.json `modify`'),
    ('ModifyData AttackRate / PowerRate', '0x1689b0..0x168a18', 'hyper-motion.json `modify` [5] / [6]'),
    ('ShellElements, the -1 rule, base by base', '0x43a8b0 / 0xcaa30 / 0xcad9c', 'hyper-motion.json `shells`, gapZ/hypershells2.json (HYPER_SHELLS)'),
    ('the beam base (class 2, aura -1)', 'base02 0x3fb7f8 / 0x3fb9bc -> 0x43a8b0', 'BEAM_SPAWNS + beam-types.js hit'),
    ('NEVER TIRED: P+0x1a8 bit 19 set at the spawn init 0xba1a0..0xba1c0 on every Hyper monster (READ 2026-10-27, Khezu AoE lane)', 'read only by the stamina routines 0xbd0c8 / 0xbd1a4 / 0xbd23c / 0xbd2c4: P+0x505 stays 0', 'mech_never_tired: tired-only PSL bits, op-0x24 tired actions and their records, Exhausted clips, the drool c 1104 -- absent'),
]
NOT_CHANGED = ('the attack records\' shapes (0x1689b0 does not read byte +0x19), the clip\'s PSL effect records (no request path or PSL word '
               'builder reads e+0xb720: hyper-states.md 8.1), the action code (hyperdiff.py: no hyper path in any action main), the shell modes picked')

# ---------------------------------------------------------------------------------------------------------------- run
def run(mon):
    M = Mon(mon); res = []
    for act, row in M.rows.items():
        if act is None: continue
        ch = collections.OrderedDict()                       # (kind, what, ids, addr, viewer, why, cls) -> [(rank, pair)]
        for fk in M.files:
            for pair in pairs(mon, fk):
                for mech in MECHANISMS:
                    for c in mech(M, fk, pair, row):
                        k = (c['kind'], c['what'], c['ids'], c['viewer'], c['why'], c['cls'])
                        e = ch.setdefault(k, {'where': [], 'addr': collections.OrderedDict()})
                        e['where'].append((RANK[fk], pair)); e['addr'].setdefault(c['addr'], []).append(RANK[fk])
        def addr_str(a):
            if len(a) == 1: return next(iter(a))
            return '; '.join('%s: %s' % ('/'.join(sorted(set(r), reverse=True)), x) for x, r in a.items())
        changes = [dict(kind=k[0], what=k[1], ids=k[2], viewer=k[3], why=k[4], cls=k[5], where=e['where'], addr=addr_str(e['addr'])) for k, e in ch.items()]
        # a tired-only action never runs under Hyper: its other changes are moot (named, not listed as changes)
        gone = [c for c in changes if c['what'].startswith('the action is tired-only')]
        if gone:
            moot = sorted({c['kind'] for c in changes if c not in gone})
            if moot: gone[0]['what'] += ' (so its other Hyper changes -- %s -- never occur)' % ', '.join(moot)
            changes = gone
        res.append(dict(action=aname(act), why=sorted(row['why']), clips=sorted(row['clips']), records=sorted(row['records']),
                        effects=sorted(row['effects'])[:12], changes=changes, verdict='impacted' if changes else 'not impacted'))
    return M, res
def where_str(M, w):
    allp = {RANK[fk]: pairs(M.id, fk) for fk in M.files}
    by = collections.OrderedDict()
    for r, p in w: by.setdefault(r, []).append(p)
    parts = []
    for r, ps in by.items():
        parts.append('%s: %s' % (r, 'every pair' if sorted(ps) == sorted(allp[r]) and len(allp[r]) > 1 else ' / '.join(ps)))
    if len(by) == len(allp) and all(sorted(by[r]) == sorted(allp[r]) for r in by): return 'both ranks, every pair' if len(by) > 1 else parts[0]
    if len(by) == 2 and len({tuple(sorted(v)) for v in by.values()}) == 1: return 'both ranks: ' + ' / '.join(next(iter(by.values())))
    return '; '.join(parts)
akey = lambda a: [int(x) for x in re.findall(r'\d+', a)] if a.startswith('clip') else [-1] + [int(x, 0) for x in a.split(':')]
CLS_ORDER = {'projectile': 0, 'effect': 1, 'hit': 2, 'absent': 2.5, 'motion': 3, 'power': 4}
def section(M, res, name):
    L = ['## %s (%s; %s)' % (name, M.id, M.T.get('class', '?')), '']
    files = ', '.join('%s %s: %s' % (RANK[fk], HA[M.id][fk]['file'], ' / '.join(pairs(M.id, fk))) for fk in M.files)
    L.append('Files and pairs: %s.' % files)
    sh = {fk: M.T[fk].get('shells') for fk in M.files if M.T[fk].get('shells')}
    if sh: L.append('ShellElements: ' + '; '.join('%s %s' % (RANK[fk], ', '.join('ID %s: %s' % (i, ' '.join('class %d power x%g scale x%g' % tuple(r) for r in rs)) for i, rs in v.items())) for fk, v in sh.items()) + '.')
    dr = VW.get('tiredDrool', {}).get(M.id)
    if dr: L.append('Never tired (P+0x1a8 bit 19, 0xba1a0): the tired drool %s %d (0xa42d0..0xa4334) is absent under Hyper -- viewer yes (Exhausted cleared).' % (dr[0], dr[1]))
    nul = ['%s %s' % (RANK[fk], pr) for fk in M.files for pr in pairs(M.id, fk) if any(i is None or str(i) not in M.T[fk]['modify'] for i in group_ids(M.id, fk, pr))]
    if nul: L.append('ModifyData never applies on: %s -- an aura there has no ActionElement (or its group none), so e+0xca94 / +0xcaa8 is null and 0xc9e88 picks nothing.' % ', '.join(nul))
    op = {'em007_00': 'g1 s66', 'em021_00': 'g0 s2', 'em032_00': 'g0 s6, g1 s19 / s20', 'em080_00': 'g1 s113 / s127 / s139 / s143..s159'}.get(M.id)
    if op: L.append('AI (not an attack change, not modelled): EMC op 0x9b hyper-only blocks at %s (0x8cbc8; hypermotion/emc_op9b.out).' % op)
    imp = [r for r in res if r['verdict'] == 'impacted']; nimp = [r for r in res if r['verdict'] != 'impacted']
    L.append('**%d impacted / %d not impacted (per the mechanisms read so far)** of %d rows.' % (len(imp), len(nimp), len(res)))
    L.append('')
    key = lambda r: (min(CLS_ORDER[c['cls']] for c in r['changes']), akey(r['action']))
    tobuild = [(r['action'], c) for r in imp for c in r['changes'] if c['viewer'] in ('no', 'partly', '?')]
    # THE HOOK, once per monster: motion -> per aura ID (alone in its slot) the rates / bursts and the bl sites, per rank (hooks.json `table`)
    hrows = collections.OrderedDict()
    for fk in M.files:
        for i, t in sorted(((HOOKS.get(M.id, {}).get(fk) or {}).get('table') or {}).items(), key=lambda x: int(x[0])):
            for mo, h in t.items():
                sig = ('; '.join('f%d x%g' % tuple(r) for r in h['rates']), '; '.join('f%d u %d' % (b[0], 1310 + b[1]) for b in h['bursts']))
                hrows.setdefault((mo, int(i), sig), {})[RANK[fk]] = ' '.join(h.get('sites', []))
    if hrows:
        L += ['### The hook (%s; below G %s, G %s)' % (M.T.get('class'), M.T['hook'].get('normal', '-'), M.T['hook'].get('g', '-')), '',
              'Per aura ID alone in its slot (a held pair runs both slots: slot 0 then slot 1, the last rate a frame wins -- the action rows give',
              'the pair\'s result). bl = the frame-test / call sites read.', '',
              '| motion | ID | rates (frame: x) | bursts | rank: bl sites |', '|---|---|---|---|---|']
        for (mo, i, sig), rk in sorted(hrows.items(), key=lambda x: ([int(v) for v in re.findall(r'\d+', x[0][0])], x[0][1])):
            L.append('| %s | %d | %s | %s | %s |' % (mo, i, sig[0] or '--', sig[1] or '--', '; '.join('%s: %s' % (r, s) for r, s in rk.items())))
        L.append('')
    def ctext(c):
        w = where_str(M, c['where']).replace('both ranks, every pair', 'all')
        a = c['addr'] if c['kind'] not in ('speed (hook)', 'burst') else 'hook'
        return '**%s** %s [%s; %s; %s]%s' % (c['kind'], c['what'], c['ids'], w, a, '' if c['viewer'] in ('yes', 'listed') else ' -- viewer **%s**: %s' % (c['viewer'], c['why']))
    for grp, title in ((0, 'Impacted -- projectiles / effects'), (2.5, 'Impacted -- absent under Hyper (never tired: the tired-only PSL records, tired twin actions, Exhausted clips)'), (3, 'Impacted -- motion (speed / bursts)'), (4, 'Impacted -- power only (not visual)')):
        rs = [r for r in sorted(imp, key=key) if (min(CLS_ORDER[c['cls']] for c in r['changes']) <= 2 if grp == 0 else min(CLS_ORDER[c['cls']] for c in r['changes']) == grp)]
        if not rs: continue
        L += ['### ' + title, '', '| actions (rows: why) | clips | changes [aura ID; rank / pair; ROM] -- viewer: yes unless named |', '|---|---|---|']
        groups = collections.OrderedDict()
        for r in rs:
            sig = tuple(ctext(c) for c in sorted(r['changes'], key=lambda c: (CLS_ORDER[c['cls']], c['kind'])))
            g = groups.setdefault(sig, {'acts': [], 'clips': set(), 'why': set()})
            g['acts'].append(r['action']); g['clips'] |= set(r['clips']); g['why'] |= set(r['why'])
        for sig, g in groups.items():
            L.append('| **%s** (%s) | %s | %s |' % (' '.join(g['acts']), ', '.join(sorted(g['why'])),
                                                ' '.join(hkey(x) for x in sorted(g['clips'], key=lambda c: [int(v) for v in re.findall(r'\d+', c)])), '<br>'.join(sig)))
        L.append('')
    if NOTES.get(M.id): L += ['**Open (named):** ' + NOTES[M.id], '']
    L += ['### Not impacted (per the mechanisms read so far)', '']
    bywhy = collections.OrderedDict()
    for r in sorted(nimp, key=lambda r: akey(r['action'])):
        bywhy.setdefault(', '.join(r['why']), []).append('%s (%s)' % (r['action'], ' '.join(hkey(x) for x in sorted(r['clips'], key=lambda c: [int(v) for v in re.findall(r'\d+', c)])) or '-') if not r['action'].startswith('clip') else r['action'])
    for w, acts in bywhy.items(): L.append('- %s: %s' % (w, '; '.join(acts)))
    L.append('')
    vis = [(a, c) for a, c in tobuild if c['cls'] != 'power']; pw = sorted({a for a, c in tobuild if c['cls'] == 'power'}, key=akey)
    if tobuild:
        L += ['### To build / flagged (the ROM changes it, the viewer does not or not fully)', '']
        seen = set()
        for a, c in vis:
            k = (a, c['kind'], c['why'])
            if k in seen: continue
            seen.add(k); L.append('- (%s) %s %s [%s]: %s -- %s' % (a, c['kind'], c['what'], where_str(M, c['where']), c['viewer'], c['why']))
        if pw: L.append('- power (not visual) not listed in the tooltip for %d action(s), their clips shared with other powers: %s' % (len(pw), ' '.join(pw)))
        L.append('')
    return L, len(imp), len(nimp), vis

NOTES = {
    'em003_00': ('the body AoE discharges L2 M12 (7, 7) / (7, 0x34), records 27 / 56 (500-unit spheres), and L2 M28 (7, 0x26), record 48 '
                 '(r 400), are "not impacted" by every mechanism read -- no hook entry, no ModifyData entry, no shell, no action-code path, '
                 'the same PSL word off / held (hyper-states.md 7.3, 8.2). Raven: it '
                 'becomes much larger under Hyper with radial lines that "slice up the area around him". READ (hyper-states.md 8.2 READ): '
                 'Hyper never tires (P+0x1a8 bit 19), so L2 M12 never plays its tired variant (bits 12 / 13: u 270 / 271, the small spark, '
                 '17 frames) -- always the calm / enraged ring and spokes (u 260 / 263) to f273: the rows above mark the tired records '
                 'absent. Against a NOT-tired normal Khezu nothing read scales or adds line rows; whether "much larger" is more than '
                 'that is Raven\'s in-game check.'),
}
def main():
    hyper = [m for m in HM if m != '_about']
    names = dict(order()); ordered = [m for m, _ in order() if m in hyper] + [m for m in hyper if m not in names]
    doc = ['# Hyper -- every attack, impacted or not (hyper-attacks lane, 2026-10-27)', '',
           'Raven, 2026-10-27: "We need to look over each attack, see if they are impacted by Hyper state parts or not" / "If they are, then look',
           'into how they are impacted". Generated by `dev/archive/hyperattacks/hyperattacks.py` (from `dumpviewer.mjs` -> viewer.json) -- do not',
           'hand-edit; add a mechanism and re-run. JSON: `dev/archive/hyperattacks/hyperattacks.json`. Sections in the in-app list order.', '',
           '**Every "not impacted" is per the mechanisms read so far** (Khezu\'s body discharge: the never-tired mechanism below removes its',
           'tired variant; nothing read makes it larger than a not-tired normal one -- Raven\'s in-game check). The mechanisms applied:', '',
           'NEVER TIRED (added 2026-10-27): the flag, not the aura, sets it -- it holds on every pair and both ranks, so "absent (never tired)"',
           'rows read "any (the flag); all". It removes only what a TIRED normal monster does; against a not-tired one it changes nothing.', '']
    for n, a, s in MECH_DOC: doc.append('- %s -- %s (%s)' % (n, a, s))
    doc += ['', 'ROM column short forms (rom-map "GU Hyper -- the motion side" and "Hyper ShellElements" rows): **hook X, bl ...** = the',
            "class's hook dispatcher (below G vt+0x1ec, G vt+0x1f0) and the bl sites of that motion's frame tests -> rate `0xb07b4` (P+0x398) /",
            "burst `0xca4e0` (u 1310 + ID); **ModifyData ID n #k** = entry k of ID n's ActionElement in that rank's .mdd -> `0xc9e88` (vt+0x16c, the",
            'pick) -> `0xc046c` (vt+0x368, P+0x38c) for speed, -> `0x1689b0..0x168a18` (H+0x38 x AttackRate, H+0x3c + PowerRate) for power;',
            '**ShellElements ID n class c -> 0xcaa30** = the hit registration `0x43a8b0` second half, `0xcad9c` passing aura -1 while hyper, unit',
            '+0x60 = ScaleRate (`0x43a9ec`), each hit slot H+0x14 x ScaleRate (`0x43aa38`), power `+0x13e0` x AttackRate.']
    doc += ['', 'Read and NOT changed by any of them: %s.' % NOT_CHANGED, '',
            'Rows: every action that arms an attack record, makes a shell or beam, requests an effect from its own code, plays a clip whose PSL',
            'fires effect records, or is named by ModifyData. Columns: below G (`_doumouka.mdd`) and G (`_g.mdd`) x every pair the Hyper row',
            'offers. "rank / pair" says where a change holds. Viewer: yes / no / partly / listed (power: the Attack Hitboxes tooltip, not drawn).',
            'Speed "f N xR" holds from motion frame N to the motion\'s end (or the next); the clip\'s speed is the ModifyData factor x the hook rate.', '',
            '| monster | id | impacted | of which projectile / effect | absent (never tired) | motion (speed / bursts) | power only | not impacted | rows with a tired-only change | to build / flagged |', '|---|---|---|---|---|---|---|---|---|---|']
    body, J_out, counts = [], {}, []
    for m in ordered:
        M, res = run(m)
        if not M.files: counts.append((names.get(m, m), m, 0, 0, 0, 0, 0, 0, 0, 0)); continue
        L, ni, nn, tb = section(M, res, names.get(m, m))
        lo = [min(CLS_ORDER[c['cls']] for c in r['changes']) for r in res if r['changes']]
        nt = sum(1 for r in res if any(c['cls'] == 'absent' for c in r['changes']))
        body += L; J_out[m] = res; counts.append((names.get(m, m), m, ni, sum(1 for x in lo if x <= 2), sum(1 for x in lo if x == 2.5), sum(1 for x in lo if x == 3), sum(1 for x in lo if x == 4), nn, nt,
                                                  len({(a, c['kind'], c['why']) for a, c in tb})))
    for c in counts: doc.append('| %s | %s | %d | %d | %d | %d | %d | %d | %d | %d |' % c)
    doc.append('')
    open(os.path.join(V, 'dev', 'hyper-attacks.md'), 'w', encoding='utf8').write('\n'.join(doc + body) + '\n')
    json.dump({'_about': 'hyperattacks.py: per monster, per action: why it is a row, its clips, attack records, effects (first 12), changes '
               '[{kind, cls, what, ids, addr, viewer, why, where: [[rank, pair]..]}], verdict (not impacted = per the mechanisms read so far)',
               'mechanisms': [x[0] for x in MECH_DOC], **J_out}, open(os.path.join(HERE, 'hyperattacks.json'), 'w', encoding='utf8'), separators=(',', ':'))
    for c in counts: print('%-22s %s impacted %3d (proj %3d absent %3d motion %3d power %3d)  not %3d  tired-rows %3d  flagged %d' % c)
if __name__ == '__main__': main()
