# build_ground.py: index.html -- the Ground control (Raven approved, 2026-10-19/20): the floor flags a unit's ground probe reports
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
def rep(a, b, n=1):
    global t
    a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
    assert t.count(a2) == n, (t.count(a2), a[:80])
    t = t.replace(a2, b2)
# 1. the row
rep("""          <div id="monClassToggles"></div>""", """          <div id="monClassToggles"></div>
          <!-- THE GROUND (Raven, 2026-10-19: "Yes"): the floor under the monster as the game's ground probe reports it -- the flag word
               e+0x1068 and the attribute byte e+0x1066 (0x18154c from the polygon). It picks the effects' floor rows (0x41c74 -> MASK2)
               and the shells' floor selectors (input.floorFlags / floorAttr). WORKING labels, by the bits: Raven names them. -->
          <div class="field" id="monGroundRow" title="The ground under the monster: the floor flag word (e+0x1068) and attribute byte (e+0x1066) the game's ground probe reports. Picks the effects' floor rows and the shells' floor choices. Working names.">
            <label for="monGround">Ground</label>
            <select id="monGround"></select></div>""")
# 2. the import
rep("""         sideEffectRuntime, attachSideEffects, detachSideEffects, sideEffectsPending } from './render/rom/effect-mounts.js';""",
    """         sideEffectRuntime, attachSideEffects, detachSideEffects, sideEffectsPending, setEffectFloor } from './render/rom/effect-mounts.js';""")
# 3. the types, the state, the handler -- after the Begins-Burrowed class toggles helper (ctog) is defined: put beside paintClassToggles
anchor = "function paintClassToggles("
i = t.index(anchor)
block = """// THE GROUND (the Ground control above). The game's per-frame ground probe (0x18154c) writes the polygon's flag word to e+0x1068 and its
// attribute byte to e+0x1066; READ consumers: 0x41c74 (an effect's MASK2: flag & 6 -> an UNRECORDED arm, & 0x1040 -> 9, else & 8 -> 0x21,
// else & 0x800000 -> 0x41, else & 0x800 -> 0x81, else attr bit 1 -> 0x101, else 3), Tigrex's ctl+0x29 (flag & 6 -> 2, & 0x40 -> 3, else
// attr bit 1), Nerscylla's PSL word (flag bit 3). The types offered are the classes those tests tell apart; flag 6 is left out (its
// MASK2 arm 0x41c88 is unrecorded: every effect of the monster would refuse). Which floor each is (water, sand, snow, lava ...) is NOT
// READ: working labels by the bits, for Raven to name. The footstep dust (cm202_001 / _002 / _020 ...) carries one row set per class.
const GROUND_TYPES = [
  { key: 'plain', label: 'Plain floor',             flags: 0,        attr: 0 },
  { key: 'g1040', label: 'Ground A (0x1040)',       flags: 0x1040,   attr: 0 },
  { key: 'g8',    label: 'Ground B (0x8)',          flags: 0x8,      attr: 0 },
  { key: 'g800k', label: 'Ground C (0x800000)',     flags: 0x800000, attr: 0 },
  { key: 'g800',  label: 'Ground D (0x800)',        flags: 0x800,    attr: 0 },
  { key: 'a2',    label: 'Ground E (attribute 2)',  flags: 0,        attr: 2 },
  { key: 'g40',   label: 'Ground F (0x40)',         flags: 0x40,     attr: 0 },
];
function groundNow(){ return GROUND_TYPES.find(g => g.key === state.ground) || GROUND_TYPES[0]; }
function setGround(key){
  state.ground = GROUND_TYPES.some(g => g.key === key) ? key : 'plain';
  const g = groundNow(), sel = document.getElementById('monGround');
  if (sel && sel.value !== g.key) sel.value = g.key;
  setEffectFloor(g.flags, g.attr);
}
{
  const sel = document.getElementById('monGround');
  if (sel){
    sel.innerHTML = GROUND_TYPES.map(g => '<option value="' + g.key + '">' + g.label + '</option>').join('');
    sel.onchange = () => setGround(sel.value);
  }
}
window.__ground = { types: GROUND_TYPES, set: setGround, now: () => groundNow() };
"""
t = t[:i] + block + t[i:]
# 4. the shells' inputs (the body's and the partner's)
rep("""           // the snow maps (the Snow Variants list): Kushala's makers (with the play's rage), Tetsucabra's / Drilltusk's rocks and slab
           snow: snowNow(),""", """           // the snow maps (the Snow Variants list): Kushala's makers (with the play's rage), Tetsucabra's / Drilltusk's rocks and slab
           snow: snowNow(),
           // the ground (the Ground control): e+0x1068 / e+0x1066 -- Tigrex's ctl+0x29 selector, Garuga's 0x1040 child (render/shells.js)
           floorFlags: groundNow().flags, floorAttr: groundNow().attr,""")
rep("""  return { questLevel: SHELL_QUEST_LEVEL, rank: SHELL_QUEST_RANK, ownerPos: { x: p.pos[0], y: p.pos[1], z: p.pos[2] },""",
    """  return { questLevel: SHELL_QUEST_LEVEL, rank: SHELL_QUEST_RANK, ownerPos: { x: p.pos[0], y: p.pos[1], z: p.pos[2] },
           floorFlags: groundNow().flags, floorAttr: groundNow().attr,""")
# 5. the PSL word's state
rep("""snowMap: snowNow(), aura5e08: ctog('poisoned'),""", """snowMap: snowNow(), floorFlag8: !!(groundNow().flags & 8), aura5e08: ctog('poisoned'),""")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
