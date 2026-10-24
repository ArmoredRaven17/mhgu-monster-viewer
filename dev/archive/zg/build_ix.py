# build_ix.py: index.html -- the eight approved controls' page side (2026-10-19)
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
def rep(a, b, n=1):
    global t
    a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
    assert t.count(a2) == n, (t.count(a2), a[:80])
    t = t.replace(a2, b2)

# imports
rep("undef: false, extend: false, gap: false, proxy: false, ...STATE_DEFAULTS, axes: {}, rawParts: false,", "undef: false, extend: false, gap: false, proxy: false, ...STATE_DEFAULTS, axes: {}, toggles: {}, rawParts: false,")
rep("BOULDER, CLASS_CONTROLS, CLASS_CONTROLS2,", "BOULDER, CLASS_CONTROLS, CLASS_CONTROLS2, CLASS_TOGGLES,")
# state: the toggles object, reset per monster
rep("  state.axes = {};        // an object, so not in STATE_DEFAULTS, where Object.assign would share one\n",
    "  state.axes = {};        // an object, so not in STATE_DEFAULTS, where Object.assign would share one\n"
    "  state.toggles = {};     // the class toggles (render/motion-states.js CLASS_TOGGLES), the same way\n")
# markup: a box for the class toggles after the second class control
rep("""          <div class="field" id="monClassCtl2Row" hidden>
            <label for="monClassCtl2" id="monClassCtl2Lab">State</label>
            <select id="monClassCtl2"></select></div>
""", """          <div class="field" id="monClassCtl2Row" hidden>
            <label for="monClassCtl2" id="monClassCtl2Lab">State</label>
            <select id="monClassCtl2"></select></div>
          <!-- THE CLASS TOGGLES (render/motion-states.js CLASS_TOGGLES): one switch per class input no other control holds --
               Begins Burrowed, Tired (with Rage), Poisoned. Working labels, listed for Raven (2026-10-19). -->
          <div id="monClassToggles"></div>
""")
# painting + handlers, beside paintClassControl2
rep("// the second class byte (render/motion-states.js CLASS_CONTROLS2): Teostra's size type P+0x5cb6\n",
"""// THE CLASS TOGGLES (render/motion-states.js CLASS_TOGGLES): a switch per entry, its value in state.toggles[key]
const ctog = key => !!(state.toggles && state.toggles[key]);
function paintClassToggles(){
  const box = document.getElementById('monClassToggles');
  box.textContent = '';
  if (!state.toggles || typeof state.toggles !== 'object') state.toggles = {};
  for (const spec of (CLASS_TOGGLES[state.id] || [])){
    const lab = document.createElement('label');
    lab.className = 'chk switch'; lab.title = spec.title || ''; lab.id = 'monTog_' + spec.key;
    const box2 = document.createElement('input');
    box2.type = 'checkbox'; box2.checked = ctog(spec.key);
    box2.onchange = e => {
      state.toggles[spec.key] = !!e.target.checked;
      saveState();
      plays.key = null; plays.motion = null;          // the next frame starts the play again with the input
    };
    const sw = document.createElement('span'); sw.className = 'toggle';
    lab.append(box2, sw, document.createTextNode(spec.label));
    box.appendChild(lab);
  }
}
// the second class byte (render/motion-states.js CLASS_CONTROLS2): Teostra's size type P+0x5cb6
""")
rep("  paintClassControl();\n  paintClassControl2();\n", "  paintClassControl();\n  paintClassControl2();\n  paintClassToggles();\n")
# the word's inputs: Begins Burrowed, Tired (with Rage), Poisoned
rep("  const tired = !rage && (!!(row && row.tired) || exhausted());\n",
    "  // Tired (with Rage), the Rath line's toggle: 0x81614 = P+0x505 alone, which the stamina machine 0xbd1a4 sets with no rage test\n"
    "  const tired = (!rage && (!!(row && row.tired) || exhausted())) || (rage && ctog('tiredRage'));\n")
rep("  const sunk = clipSunkFor(state.id, list, clip, plays.cn);\n",
    "  // Begins Burrowed (CLASS_TOGGLES `burrowed`): 0x81d6c is posture 4 AND P+0x5c below 0.9 x MoguriBaseOfs -- on, every posture-4\n"
    "  // play reads sunk; off, only the entries that name it (a posture-4 play begun from the surface)\n"
    "  const sunk = clipSunkFor(state.id, list, clip, plays.cn) || (ctog('burrowed') && posture === 4);\n")
rep("snowMap: snowNow(), seltasLink: state.id === 'em069_00' ? herLinkedForShells() : false,",
    "snowMap: snowNow(), aura5e08: ctog('poisoned'), seltasLink: state.id === 'em069_00' ? herLinkedForShells() : false,")
# Congalala's gas: the Gas Type control (CLASS_CONTROLS em021_00) for the breath
rep("  const gas = cg ? em021Gas(action, clipFieldFor(state.id, list, clip, plays.cn, 'gas')) : undefined;\n",
    "  // the breath's gas: the Gas Type control (CLASS_CONTROLS em021_00, ctl[1]); the eating plays set their own (em021Gas)\n"
    "  const gas = cg ? em021Gas(action, state.classCtl | 0) : undefined;\n")
rep("    return em021Gas(plays.action, clipFieldFor(state.id, plays.motion.list, plays.motion.clip, plays.cn, 'gas')) | 0;\n",
    "    return em021Gas(plays.action, state.classCtl | 0) | 0;      // the Gas Type control, as the word's\n")
# the user input the class timers read
rep("                   classCtl2: state.classCtl2 | 0, snowMap: snowNow() };",
    "                   classCtl2: state.classCtl2 | 0, snowMap: snowNow(), toggles: state.toggles || {} };")
# the class timers' fades
rep("    for (const [pel, key] of r.holdOn) rt.holdEvent(pel, key, true);\n",
    "    for (const [pel, key] of r.holdOn) rt.holdEvent(pel, key, true);\n"
    "    // a held record's fade as its class writes it each frame (unit 0's colour block: Amatsu's aura, Valstrax's glow)\n"
    "    for (const [pel, key, a] of (r.alpha || [])) rt.alphaEvent(pel, key, a);\n")
# a copy's start frame (Deadeye's L0 M7 B: the ROM plays begin at frame 18)
rep("  pose.anchorXZ = state.anchor;\n  // the new clip's first frame goes where the old clip's last drawn one was (THE WALK CARRIES OVER)\n",
    "  pose.anchorXZ = state.anchor;\n"
    "  // A COPY'S START FRAME (psl-mask.js CLIP_ACTIONS `startFrame`, frames at 60 a second): the ROM sets the motion from that frame\n"
    "  // (Deadeye's (7, 0xe3) / (7, 0xe5) on L0 M7 begin at 18)\n"
    "  { const base0 = String(c.clip).replace(/_(start|loop)$/, ''), vv = state.clipVariant || '';\n"
    "    const sf = vv ? clipFieldFor(state.id, l.id, base0, clipEntryIndex(state.id, l.id, base0, 0, vv), 'startFrame') : undefined;\n"
    "    if (Number.isFinite(sf) && pose.action && pose.mixer){ pose.action.time = Math.min(sf / 60, Math.max(0, clipDur(pose.action) - 1e-3)); pose.mixer.update(0); if (pose.anchorProxy) pose.anchorProxy(); } }\n"
    "  // the new clip's first frame goes where the old clip's last drawn one was (THE WALK CARRIES OVER)\n")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
