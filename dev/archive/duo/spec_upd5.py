p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
def rep(old, new):
    global s
    old = old.replace('\n', nl); new = new.replace('\n', nl)
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
rep("""  her entry plays the same pair. The solo clips (L0 M16, L4 M29) and the 11 unresolved stay off it. Her clip-keyed effects
  and state records (render/motion-states.js, keyed by her list|clip) do not fire on the renamed combined entries -- her
  raw list still shows them.""",
"""  her entry plays the same pair. The solo clips (L0 M16, L4 M29) and the 11 unresolved stay off it.
* **Her records fire on every entry as on the raw clip** (fixed 2026-10-17; the first layout left them off): index.html
  `seqMotionNow` -> `partnerMotionNow` routes an entry to the clip of hers it plays now -- a her-led entry IS that clip
  (`whole`: the raw clip's own motion-state call, copy row and frame), the joined entry walks its pieces (a split motion's
  _start + _loop as one), his entries walk the layout of her side (`partnerBodyShown.layout`). Every list|clip consumer
  reads it: the effect schedule (`setClip` key, CLIP_EFFECTS), the PSL word (CLIP_ACTIONS / psl-mask, `playNow`),
  ACTION_EFFECTS, MOTION_STATES (parts, rage, tired, puff / drool gates, class holds), CLIP_VARIANTS (her copies offered
  on her entries), heat, turn / steer, posture box, air height, the hit-zone mode (`clipZoneMode` via `herClipOf`).
  The check plays raw and combined side by side (L0 M65's PSL bit, L0 M5 rage, L0 M8 hold, L3 M35 / M36 death rows on
  the leaves entries): schedule key and frame, PSL word, state row, her parts and the records started are equal; the
  joined entry is on L4 M77 at its own frame 20 inside that piece; a view file opened on a combined entry and the Hit
  Zones panel hold / give back the entry.
* **His side**: MOTION_STATES.em076_00 has no list-4 row, so no state record of his applies to anything he plays on the
  combined list. His PSL bits on L4 M31..M34 (his riding attacks, which his free loop plays) need an effect runtime of
  his own; the viewer has one runtime (render/rom/effect-mounts.js `runtime`), hers -- NOT SHOWN, stated in the check.""")
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
