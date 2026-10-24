p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)
rep("partnerPairOf, clawStageAt, clawSetOf, freeTimeline,", "partnerPairOf, clawStageAt, clawSetOf, wingPartsAt, freeTimeline,")
# ---- the partner: his wing parts by his clip and frame
rep("""        if (a.clawSet !== set){ a.clawSet = set; applyPartState(); }
      }
      continue;""", """        if (a.clawSet !== set){ a.clawSet = set; applyPartState(); }
      }
      // HIS WINGS follow his flight state at this frame (render/monster.js ROM_WINGS / wingPartsAt), Away where it has none
      {
        const loc = pose.action ? partnerLocalAt(a, Math.round(pose.action.time * 60)) : null;
        const wp = loc ? wingPartsAt(a.spec.monster, a.spec.list, loc.clip, loc.frame) : null;
        const key = wp ? wp.join(',') : null;
        if (key !== a.wingKey){ a.wingKey = key; a.wingParts = wp; applyPartState(); }
      }
      continue;""")
rep("""      for (const p of a.spec.partsOff || []) drawn.set(p, false);""",
"""      // his wing cards: the ROM's flight state where his clip has one (stepAttached a.wingParts), else Raven's Away
      if (a.wingParts) for (const p of [1, 2, 3, 4]) drawn.set(p, a.wingParts.includes(p));
      else for (const p of a.spec.partsOff || []) drawn.set(p, false);""")
# ---- the main monster (solo Seltas): the ROM's wings over the Wings row where his clip has a flight state
rep("""    // AGNAKTOR'S HEAT PARTS FOLLOW THE GAME (render/monster.js ROM_HEAT_REGIONS;""",
"""    // SELTAS' WINGS FOLLOW HIS FLIGHT STATE (render/monster.js ROM_WINGS; Raven, 2026-10-17: "Seltas wing parts are not
    // being toggled during flying sections"): where his clip has a ROM flight state it draws the cards (folded: none, out:
    // part 4, flapping: part 2 / parts 1, 3, 4 every 2 frames); elsewhere the Wings row's choice stands. Raw Parts is raw.
    const wp = rawParts ? null : wingsNow(e.id);
    if (wp) for (const p of [1, 2, 3, 4]) drawn.set(p, wp.includes(p));
    // AGNAKTOR'S HEAT PARTS FOLLOW THE GAME (render/monster.js ROM_HEAT_REGIONS;""")
rep("""function driveMotionStates(){""", """// the main monster's ROM wing parts at this frame (render/monster.js wingPartsAt), or null where it has none
function wingsNow(id){
  const act = pose.action, name = act && act.getClip ? act.getClip().name : null;
  if (!name) return null;
  const seq = seqMotionNow();
  let list = state.list, clip = name.replace(/_(start|loop)$/, ''), frame = act.time * 60;
  if (seq){ list = seq.list; clip = seq.clip; frame = seq.frame; }
  else if (/_loop$/.test(name)){
    const sib = ((listOf(entry()) || {}).clips || []).find(c => c.clip === clip + '_start');
    if (sib) frame += Math.round(sib.dur * 60);
  }
  return wingPartsAt(id, list, clip, Math.floor(frame));
}
let wingKeyMain = null;
function stepWings(){
  const wp = mounted.main && !rawParts ? wingsNow(state.id) : null;
  const key = state.id + '|' + (wp ? wp.join(',') : 'row');
  if (key === wingKeyMain) return;
  const first = wingKeyMain === null || !wingKeyMain.startsWith(state.id + '|');
  wingKeyMain = key;
  if (!first || wp) applyPartState();
}
function driveMotionStates(){""")
rep("""  driveMotionStates();
""", """  driveMotionStates();
  stepWings();
""")
# ---- readback
rep("""           released: !!(a.pick && a.pick.release), groupsOn:""", """           released: !!(a.pick && a.pick.release), wingParts: a.wingParts ? a.wingParts.slice() : null, groupsOn:""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
