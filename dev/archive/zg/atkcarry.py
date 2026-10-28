"""atkcarry.py (atkfix lane, 2026-10-27): THE CARRY of an unlocked attack arm into the motions its action plays next.

READ (rom-map "Monster attack shapes", dev/attack-hitshapes.md 3):
  * flags bit 0 CLEAR -> 0x7ddb8 calls 0x169258: the hit is LOCKED to the motion it was armed in (H+0x74, H+0x30 bit 0x100) and the
    countdown 0x168d44.. kills it on any other motion. Bit 0 SET: no lock, the countdown runs on through motion changes.
  * the delay the arm writes (0x7dc88..0x7dd18) is the record's start less the arm motion's frames already run, so the window
    (attack-hitboxes.js windowOf) is in the ARM MOTION's frames; the countdown steps by the tick, x the layer speed e+0x50c when flags
    bit 2 is CLEAR (H+0x31 bit 1, 0x7de00) -- i.e. in motion frames.
  * e+0x4f4 (the gate the delay subtracts) is written with the motion's blend (0x951678: s0 blend -> +0x4f0 / +0x4f4) and the delay
    adds it back, so a motion's frame 0 comes `blend` ticks after its set (INFERRED from that formula: the frame holds through the gate).
So a carried window, in the next motion N's frames, is the arm motion's window less (the frames run before N + N's blend).

WHICH motion comes next is the action -> motion census (docs/action-motions.json): an entry of the SAME action, a different motion,
in the arm motion's phases (from the arm's) or the next one, whose setMotion the census saw only with the ended answer 1 (`when.ef` all "1x": entered on the
arm motion's end). Anything else is REFUSED BY NAME (refuse()), never guessed:
  frame-gated     -- the next motion is set on a frame test ("0x" in ef): its frame is not in the census
  phase-entry     -- set unconditionally at the next phase's entry: what advances the phase is not in the census
  stub-answer     -- set on a stubbed call's answer (`ret`) with no end test: its timing is not in the census
  several         -- more than one different motion qualifies
  timing-ambiguous -- the next motion is set on the end AND without the end test
  phase-gap       -- the next motion is set two or more phases on: the phase between sets none, its length is not in the census
  follow:<act>    -- the action sets no further motion and hands over to <act> (chains 'follow'): when, not in the census
  action-ends     -- the action sets no further motion and follows none: the next action is the AI's
  cycle           -- the chain comes back to a motion already carried into
  replayed        -- the motion is set in more than one phase: whether it plays again (and how often) is not in the census
  blend-ambiguous -- the next motion's census blends differ
  tick-rate       -- flags bit 2 SET (the countdown in ticks, not frames) and a motion on the path has a rate other than 1
  not-in-lists    -- the arm motion's or the next motion's clip is not in the viewer's lists (no length)
  per-frame       -- a pf+ arm (no action)
A next motion with _start / _loop clips is OPEN (the action leaves it on its own terms): the rest of the window ends there. A finite one
the window outlasts CHAINS on (the same rule from that motion's phases).
"""

def windowOf(rec, gate):
    arm = gate if gate >= 0 else 0
    start, dur = rec[0], rec[1]
    if start < 1: return [arm, arm + dur] if dur >= 1 else None
    a, b = max(start, arm), start + dur
    return [a, b] if b > a else None

def _ended_only(ef):
    return bool(ef) and all(x[0] == '1' for x in ef)

def nextMotion(ents, cur, phases, chains, act):
    """the motion the action plays after `cur` (set in `phases`): ([entries], None) or (None, reason)"""
    curE = [e for e in ents if e['m'] == cur and set(e['ph']) & set(phases)]
    curEndEntered = bool(curE) and all((e.get('when') or {}).get('ef') for e in curE)
    nxtPh = max(phases) + 1
    def eligible(e):
        if e['m'] == cur: return False
        sh = set(e['ph']) & set(phases)
        if sh and not (e.get('when') or {}) and curEndEntered: return False   # the phase's entry motion, before an end-entered cur
        return bool(sh) or nxtPh in e['ph']
    cand = [e for e in ents if eligible(e)]
    if not cand:
        if any(min(e['ph']) > nxtPh for e in ents): return None, 'phase-gap'          # phase max+1 sets no motion: its length is not in the census
        fol = [c[1] for c in (chains or []) if c[0] == 'follow' and set(c[2]) & set(phases)]
        if fol: return None, 'follow:' + '/'.join(fol)                               # handed to another action: when, not in the census
        return None, 'action-ends'                                                   # the next action is the AI's
    ok, why = [], []
    for e in cand:
        w = e.get('when') or {}
        ef = w.get('ef')
        if ef and _ended_only(ef): ok.append(e)
        elif ef: why.append('frame-gated')
        elif w.get('ret'): why.append('stub-answer')
        else: why.append('phase-entry')
    ms = sorted({e['m'] for e in ok})
    if len(ms) == 1:
        others = {e['m'] for e in cand if e not in ok}
        if others - set(ms): return None, 'several'      # an end-entered motion AND other motions in the same phases
        if others: return None, 'timing-ambiguous'      # the same motion also set without the end test
        return [e for e in ok if e['m'] == ms[0]], None
    if len(ms) > 1: return None, 'several'
    return None, sorted(set(why))[0] if len(set(why)) == 1 else 'several'

def carry(row, key, phase, rec, AM, clipLen, openKeys, chains=None):
    """-> (kind, hops, why): kind 'carried' with hops [(key2, shift), ...] (why: the reason a chain stopped short of the window's end,
    or None); 'refused' with why; 'ends-in-blend' (the rest of the window falls in the next motion's blend: no frame of it);
    None when there is nothing to carry (locked, no overrun, no window)"""
    slot, hid, fl, gate, act = row[:5]
    if not (fl & 1): return None, None, None                 # locked: dies with its motion
    w = windowOf(rec, gate)
    if not w or key in openKeys: return None, None, None
    if key not in clipLen: return 'refused', [], 'not-in-lists'
    if w[1] <= clipLen[key]: return None, None, None        # no overrun
    if str(act).startswith('pf'): return 'refused', [], 'per-frame'
    st, n = act.split(':')
    an = '%s:0x%02x' % (st, int(n, 16))
    ents = AM.get(an, [])
    ch = (chains or {}).get(an)
    rates = lambda m: [r for e in ents if e['m'] == m for r in (e.get('rate') or [])]
    if (fl & 4) and any(r != 1 for r in rates(key)): return 'refused', [], 'tick-rate'
    out, cur, shift, seen = [], key, 0, {key}
    phases = sorted({phase} | {p for e in ents if e['m'] == key for p in e['ph'] if p >= phase})
    stop = lambda why: ('carried', out, why) if out else ('refused', [], why)
    if len(phases) > 1: return stop('replayed')
    for _ in range(16):
        nx, why = nextMotion(ents, cur, phases, ch, an)
        if not nx: return stop(why)
        m2 = nx[0]['m']
        if m2 in seen: return stop('cycle')
        bl = sorted({b for e in nx for b in (e.get('blend') or [0.0])})
        if len(bl) != 1: return stop('blend-ambiguous')
        if (fl & 4) and any(r != 1 for r in rates(m2)): return stop('tick-rate')
        if m2 not in clipLen and m2 not in openKeys: return stop('not-in-lists')
        shift += clipLen[cur] + int(round(bl[0]))
        if w[1] - shift <= 0: break                          # the window ended in the blend
        out.append((m2, shift)); seen.add(m2)
        if m2 in openKeys or w[1] - shift <= clipLen[m2]: break
        cur, phases = m2, sorted({p for e in nx for p in e['ph']})
        if len(phases) > 1: return stop('replayed')
    return ('carried', out, None) if out else ('ends-in-blend', [], None)
