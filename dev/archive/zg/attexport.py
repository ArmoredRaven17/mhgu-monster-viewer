# attexport.py: docs/attack-hitshapes.json -- every large monster's attack records (enemy\hit_data\<id>_attackdata.hde: HDE, 0x20-byte
# records from +0x10; s16 +0 the start frame, s16 +2 the duration, byte +6 the kind, u32 +0xc the flags word, byte +0x19 the hit-size
# set -- the fields 0x7db70 / 0x16877c read), its hit-size sets (<id>_hitsize.hts: HTS, the table at +0x10 of (count, offset), records
# of 0x30: u16 j0, u16 j1, u16 code, u16 flags, f32 +0xc radius, vec +0x10 off0, vec +0x20 off1 -- 0x16da04 / 0x16ddd0), and the arms
# per clip from the action census (attrace.py: (status, number) -> slot, hit id, flags, motion, the frame gate asked before the arm).
import os, re, json, struct, glob
SCR = r'C:\MHGU-Extract\scratch-em'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\attack-hitshapes.json'
mj = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json'))
def hde(p):
    b = open(p, 'rb').read()
    if b[:4] != b'HDE\0': return None
    n = struct.unpack_from('<I', b, 8)[0]
    out = []
    for k in range(n):
        o = 0x10 + 0x20 * k
        if o + 0x20 > len(b): break
        d, du = struct.unpack_from('<2h', b, o)
        fl = struct.unpack_from('<I', b, o + 0xc)[0]
        # + the fields the hunter's landing reads (0x16877c copies them into the hit object, 0x175b88 consumes it): s16 +4 the power
        # (H+0x38: x 0x1690dc, then the hunter's defence, then the element's resistance), u16 +8 (H+0x36 -> player+0x3214), byte +0xa
        # (H+0x3b, the linked attacker's facing added), byte +0xb (H+0x3c -> player+0x3217), u32 +0x10 / +0x14 the status bits (H+0x48 / 0x4c)
        # and byte +0x18 their value (H+0x50 -> one player+0x321e.. counter per bit)
        pw, u8_ = struct.unpack_from('<hH', b, o + 4)[0], struct.unpack_from('<H', b, o + 8)[0]
        sa, sb_ = struct.unpack_from('<2I', b, o + 0x10)
        out.append([d, du, b[o + 6], b[o + 0x19], fl, pw, u8_, b[o + 0xa], b[o + 0xb], sa, sb_, b[o + 0x18]])
    return out
def hts(p):
    b = open(p, 'rb').read()
    if b[:4] != b'HTS\0': return None
    ng = struct.unpack_from('<I', b, 8)[0]
    sets = []
    for g in range(ng):
        n, off = struct.unpack_from('<2I', b, 0x10 + 8 * g)
        recs = []
        for k in range(n):
            o = off + 0x30 * k
            j0, j1, code, fl = struct.unpack_from('<4H', b, o)
            r = struct.unpack_from('<f', b, o + 0xc)[0]
            o0 = struct.unpack_from('<3f', b, o + 0x10); o1 = struct.unpack_from('<3f', b, o + 0x20)
            recs.append([j0, j1, code, fl, round(r, 3)] + [round(v, 3) for v in o0 + o1])
        sets.append(recs)
    return sets
LINE = re.compile(r'^\((\d+), (0x[0-9a-f]+)\) (\w+) slot (\d+) hit (0x[0-9a-f]+) flags (0x[0-9a-f]+)\s+motion L(\d+) M(\d+)\s+phase (\d+) gate (-?[\d.]+)')
res = {}
CARRYLOG = []
for m in mj['monsters']:
    if m.get('small'): continue
    i = m['id']
    base = i if os.path.exists(os.path.join(SCR, i, 'enemy', 'hit_data', i + '_attackdata.hde')) else i[:6] + '00'
    hp = os.path.join(SCR, base, 'enemy', 'hit_data', base + '_attackdata.hde')
    sp = os.path.join(SCR, base, 'enemy', 'hit_data', base + '_hitsize.hts')
    if not (os.path.exists(hp) and os.path.exists(sp)): continue
    arms = {}
    PHASE = {}                                                            # (key, row...) -> the phase the census armed it in
    cp = os.path.join(HERE, 'ctl', i + '.txt')
    if os.path.exists(cp):
        for l in open(cp, encoding='utf8', errors='replace'):
            mm = LINE.match(l.strip())
            if not mm: continue
            st, n, kind, slot, hid, fl, L, M, ph, gate = mm.groups()
            if int(M) == 0 and int(L) == 0: continue                      # no motion known for it
            key = L + '|Motion[' + M + ']'
            row = [int(slot), int(hid, 16), int(fl, 16), float(gate), '%s:%s' % (st, n)]
            arms.setdefault(key, [])
            if not any(r[:4] == row[:4] for r in arms[key]): arms[key].append(row); PHASE[(key,) + tuple(row)] = int(ph)
    # + the per-frame arms (fb/pfarm.py: the vtable slots run every frame -- vt+0x13c / 0x298..0x2a8 / 0x488 -- per motion, with the
    # frame gate before the arm): Lao-Shan's, Neset's and every class arming outside its action main
    PF = re.compile(r'^PFARM (\+0x[0-9a-f]+) mot L(\d+) M(\d+) (\w+) slot (\d+) hit (0x[0-9a-f]+) flags (0x[0-9a-f]+) gate (-?[\d.]+)')
    pp = os.path.join(HERE, '..', 'fb', 'pfa', i + '.txt')
    # DROPPED: vt+0x1f4 (the ACTION DISPATCHER: a switch on e+0x73e0 / +0x73e1 at its head, e.g. uEm001 0xcee3d8 -- its arms belong to
    # actions, which attrace already places; run per motion it arms the census's default action in every motion), and any arm the
    # census finds in more than 30% of a monster's motions (not keyed on the motion)
    if os.path.exists(pp):
        LL = open(pp, encoding='utf8', errors='replace').read().splitlines()
        mnum = re.search(r'(\d+) motions', LL[0]) if LL else None
        nmot = int(mnum.group(1)) if mnum else 0
        spread = {}
        for l in LL:
            mm = PF.match(l.strip())
            if mm: spread.setdefault((mm[1], mm[5], mm[6], mm[7]), set()).add((mm[2], mm[3]))
        for l in LL:
            mm = PF.match(l.strip())
            if not mm: continue
            off, L, M, kind, slot, hid, fl, gate = mm.groups()
            if off == '+0x1f4' or len(spread[(off, slot, hid, fl)]) > 0.3 * max(nmot, 1): continue
            key = L + '|Motion[' + M + ']'
            row = [int(slot), int(hid, 16), int(fl, 16), float(gate), 'pf' + off]
            arms.setdefault(key, [])
            if not any(r[:4] == row[:4] for r in arms[key]): arms[key].append(row)
    # THE TABLES (0x70f40 / 0x70fa0, READ): ids < 1000 index [unit+0x75d4] / its hit-size [+0x75dc], ids >= 1000 index [+0x75d8] / [+0x75e0].
    # A deviant's arc carries its base's files AND its own: the base's taken as the first table, its own as the second (INFERRED from
    # the pairing -- the loader that fills +0x75d4 / +0x75d8 is not read). A monster with one file has no second table.
    hd = os.path.join(SCR, i, 'enemy', 'hit_data')
    first = i[:6] + '00'
    if i[6:] != '00' and os.path.exists(os.path.join(hd, first + '_attackdata.hde')) and os.path.exists(os.path.join(hd, i + '_attackdata.hde')):
        hp = os.path.join(hd, first + '_attackdata.hde'); sp = os.path.join(hd, first + '_hitsize.hts')
        hp2 = os.path.join(hd, i + '_attackdata.hde'); sp2 = os.path.join(hd, i + '_hitsize.hts')
        res[i] = {'files': [first, i], 'records': hde(hp), 'sets': hts(sp), 'records2': hde(hp2), 'sets2': hts(sp2), 'arms': arms}
    else:
        res[i] = {'files': [base], 'records': hde(hp), 'sets': hts(sp), 'arms': arms}
    # + THE LEAD AND THE CARRY (atkfix lane 2026-10-27; READ: dev/attack-hitshapes.md 3, rom-map "Monster attack shapes").
    #   LEAD (<archive>/atkfix/leadcases.py -> leads.json): the arm's delay is start + the blend gate e+0x4f4 - the motion's frame
    #   (0x7dc88..0x7dd18), and the frame advances through the blend (0x94eee8..0x94ef08), so a record armed t frames into a motion
    #   set with blend b goes live at frame start + max(0, b - t). Row field 7.
    #   (leads.json now from leadcases2.py: unknowns resolved through the follow credit and the stepped arm frame.)
    #   CARRY (<archive>/atkfix/carrysim2.py, the action main stepped frame by frame with the frame tests, the ended test, the action
    #   tune and the hit-live test answered -> carries.json, merged by mergecarry2.py; carrysim.py was the first, 0 / 1 pass): an arm with flags bit 0 SET is not locked to its motion (0x7ddb8 skips 0x169258), so a window that outlasts the
    #   arm motion runs on into the motions the action plays next. Each hop gets a row [.., shift, lead, lap]: the frames run before
    #   that motion, the lead, and the pass of that clip (a motion played again). Every case not resolved is REFUSED BY NAME in
    #   <archive>/atkfix/carry_report_sim2.txt. (zg/atkcarry.py, the first census-JSON rule, is superseded by this: kept as the record.)
    FIX = os.path.join(HERE, '..', 'atkfix') if os.path.exists(os.path.join(HERE, '..', 'atkfix', 'leads.json')) else r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\atkfix'
    LEADS = json.load(open(os.path.join(FIX, 'leads.json'))).get(i, {})
    CARR = json.load(open(os.path.join(FIX, 'carries.json'))).get(i, {})
    for key in list(arms):
        for row in list(arms[key]):
            if len(row) > 5: continue
            rk = '%s|%d|%d|%d|%s|%s' % (key, row[0], row[1], row[2], row[3], row[4])
            lead = LEADS.get(rk, 0)
            c = CARR.get(rk)
            if c and c['kind'] == 'carried':
                for k2, sh, lap in c['hops']:
                    r2 = row[:5] + ([sh, lead, lap] if lap else [sh, lead])
                    arms.setdefault(k2, [])
                    if not any(r[:4] == r2[:4] and r[5:] == r2[5:] for r in arms[k2]): arms[k2].append(r2)
            if lead: row.extend([0, lead])
            if c: CARRYLOG.append('%s %s: %s %s%s' % (i, rk, c['kind'], ' '.join('%s+%d%s' % (h[0], h[1], ('@lap%d' % h[2]) if h[2] else '') for h in c['hops']),
                                                     (' -- ' + c['why']) if c['why'] else ''))
json.dump(res, open(OUT, 'w'), separators=(',', ':'))
open(os.path.join(os.path.dirname(os.path.abspath(OUT)), 'carry_report.txt'), 'w').write('\n'.join(CARRYLOG) + '\n')
print(len(res), 'monsters ->', OUT, os.path.getsize(OUT) // 1024, 'KB', 'arms:', sum(len(v['arms']) for v in res.values()), 'clips')
