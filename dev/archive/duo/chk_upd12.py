p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
rep("check(r.mounted && r.clip === 'Motion[31]' && r.herSide", "check(r.mounted && r.local && r.local.clip === 'Motion[31]' && r.herSide")
anchor = "  // ---- THE PAIRS: his clip and his frame against hers"
NEW = r"""  // ---- THE STATIC AUDIT (2026-10-18; Raven: "Seltas in the grab animations is still static in some instances"): his clip must
  // ADVANCE through every entry except where the ROM holds him -- the M78 / M79 freeze (1:0x21's speed 0, both layers,
  // emulated: duo/emu_freeze.py) and his one-frame pose M3 (her L4 M3 loop / M25: a 0-frame motion)
  {
    const ROMHOLD = new Set(['Queen L4 Motion[78]_loop', 'Queen L4 Motion[79]', 'Queen L4 Motion[3]_loop', 'Queen L4 Motion[25]']);
    const bad = [];
    for (const c of duoList().clips){
      if (ROMHOLD.has(c.clip)) continue;
      await pickOn(DUO, c.clip);
      V.pose.action.paused = true;
      const F = Math.max(2, Math.round(V.pose.action.getClip().duration * 60));
      const seen = [];
      for (const k of [0.15, 0.4, 0.65, 0.9]){
        const f = Math.floor(k * F);
        V.pose.action.time = f / 60; await frames(1);
        const q1 = await P();
        V.pose.action.time = (f + 1) / 60; await frames(1);
        const q2 = await P();
        seen.push(!!(q1.local && q2.local && (q1.local.clip !== q2.local.clip || q1.local.frame !== q2.local.frame)));
        if (!seen[seen.length - 1] && !(c.clip === 'S. Motion[76]-[79]' && f >= 252)) bad.push({ entry: c.clip, f, a: q1.local, b: q2.local });
      }
      V.pose.action.paused = false;
    }
    check(bad.length === 0, 'every combined entry: his clip advances at 15 / 40 / 65 / 90 % of it, except the ROM\'s holds (M78 / M79 freeze, the joined grab from M78, the one-frame M3)', bad.slice(0, 8));
    // his own entries go on to the ride at their action's end (0xfc9518 / 0xfd46e8 / 0xfd480c / 0xfd4908; M34 via 3:0x3d's M5)
    const ends = {};
    for (const [n, len] of [['Seltas Motion[43]', 187], ['Seltas Motion[31]', 261], ['Seltas Motion[32]', 227], ['Seltas Motion[33]', 173], ['Seltas Motion[34]', 173]]){
      await pickOn(DUO, n);
      V.pose.action.paused = true;
      V.pose.action.time = (len + 12) / 60; await frames(1); const a = await P();
      V.pose.action.time = (len + 30) / 60; await frames(1); const b = await P();
      ends[n] = [a.local, b.local];
      V.pose.action.paused = false;
    }
    check(Object.values(ends).every(([a, b]) => a && b && a.clip === 'Motion[35]_loop' && b.clip === 'Motion[35]_loop' && b.frame > a.frame),
          'his own entries: after his clip, the ride M35 plays on (advancing), not his last frame held', ends);
    // the holds the ROM keeps: M3 is a one-frame motion; the freeze holds M79 at 6 through her M78 and M79
    const S4 = V.MON.monsters.find(m => m.id === 'em076_00').lists.find(l => l.id === '4');
    const m3 = S4.clips.find(x => x.clip === 'Motion[3]_loop');
    check(m3 && Math.round(m3.dur * 60) === 0, 'ROM hold: his M3 (her L4 M3 loop / M25) is a one-frame motion', m3 && m3.dur);
  }

"""
assert s.count(anchor) == 1
s = s.replace(anchor, NEW + anchor)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
