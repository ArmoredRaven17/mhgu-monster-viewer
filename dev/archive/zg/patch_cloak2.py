# Chameleos's cloak, the three gaps closed (2026-10-18): the model alpha (in and out by the read timings), the shimmer path's material
# slot swap (stealth01 / stealth02 into slots 1 / 3, their clips), the hit zones' second meat block while cloaked.
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def patch(path, pairs):
    s = open(path, encoding='utf8', newline='').read()
    NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
    for a, b in pairs:
        a2, b2 = a.replace('\n', NL), b.replace('\n', NL)
        assert s.count(a2) == 1, (path, a[:90], s.count(a2))
        s = s.replace(a2, b2)
    open(path, 'w', encoding='utf8', newline='').write(s)

# ---- monster.js: the stage machine takes a phase driver's clips ('manual'), the swap table, the meat rules on the class byte
patch(V + r'\render\monster.js', [
 # the em025 tables: driven by index.html's phase machine (root.userData.manualClips[key] = [clip | null, tSec])
 ("  em025_00: [{ mats: ['XfB_N__E0__m02_body', 'XfBAN__E1__m50_wing'], clips: ['stealth_start_S', 'stealth_start_S', 'stealth_end_S'],\n"
  "               on: 'cloak', hold: true, settle: 'rest' },\n"
  "             { mats: ['XfB_0__m01_light'], clips: ['fade_out', 'fade_out', 'fade_in'], on: 'cloak', hold: true, rest: 'auto', settle: 'rest' }],",
  "  // [2026-10-18, the gaps closed: the three machines are now DRIVEN by index.html's phase machine stepCloak025 -- `manual` names\n"
  "  // the key of root.userData.manualClips it reads, [clip or null, start second] -- because the ROM's phases interleave the three\n"
  "  // (the uncloak's stealth_end on the swapped-in stealth01 / 02, then stealth_end_S on the body and wing, then the light's fade_in).\n"
  "  // stealth01 / stealth02 (#a525c570 / #15178149) are STATE_MATERIAL_SWAP.em025_00's `stealth` swap-ins; `frames` gives the ROM's\n"
  "  // own lengths (0x169d44c), since a swap-in is not on a mesh when the machine is made.]\n"
  "  em025_00: [{ mats: ['XfB_N__E0__m02_body', 'XfBAN__E1__m50_wing'], clips: ['stealth_start_S', 'stealth_end_S'], manual: 'body' },\n"
  "             { mats: ['XfB_0__m01_light'], clips: ['fade_out', 'fade_in'], manual: 'light', rest: 'auto' },\n"
  "             { mats: ['#a525c570', '#15178149'], clips: ['stealth_start', 'stealth', 'stealth_end'], manual: 'stealth',\n"
  "               frames: { stealth_start: 15, stealth: 120, stealth_end: 30 } }],"),
 ("function newStageMachine(root, tbl){",
  "function newStageMachine(root, tbl){\n"
  "  if (tbl.manual) return { tbl, mats: tbl.mats, rest: tbl.rest || null, stage: 0, clip: null, t0: 0, tOn: null, tLast: -Infinity,\n"
  "                           frames: Object.assign({}, tbl.frames || {}), manual: tbl.manual };"),
 ("function stepOneStage(s, tSec, state, root){",
  "function stepOneStage(s, tSec, state, root){\n"
  "  // A DRIVEN MACHINE (`manual`): its clip and start come from the page's phase machine (Chameleos's cloak, index.html stepCloak025)\n"
  "  if (s.manual){\n"
  "    const mc = root && root.userData && root.userData.manualClips && root.userData.manualClips[s.manual];\n"
  "    s.clip = mc ? mc[0] : null; s.t0 = mc ? mc[1] : 0; s.tLast = tSec; s.stage = s.clip ? 1 : 0;\n"
  "    return { mats: s.mats, rest: s.rest, clip: s.clip, t0: s.t0, tbl: s.tbl, tOn: null, cycled: !s.clip, restT0: 0, base: null };\n"
  "  }"),
 ("  em003_00: { charged: { 'XfBA_A0__m03_blood': '#833258c1' } },",
  "  em003_00: { charged: { 'XfBA_A0__m03_blood': '#833258c1' } },\n"
  "  // CHAMELEOS's shimmer cloak (vt+0x210 0xe00eb4 phase 1, 0xe01500: setMaterialAt slot 1 = m03_stealth01, slot 3 = m04_stealth02 --\n"
  "  // READ by hash in the .mrl; the model's slots 1 / 3 are XfB_N__E0__m02_body / XfBAN__E1__m50_wing, the glb's material order) and\n"
  "  // the full cloak's uncloak (phase 0, 0xe01764); put back at 0xe017b8. index.html stepCloak025 sets the state.\n"
  "  em025_00: { stealth: { 'XfB_N__E0__m02_body': '#a525c570', 'XfBAN__E1__m50_wing': '#15178149' } },"),
 ("  em068_00: {\n    modes: ['Normal', 'Exhausted'],",
  "  // CHAMELEOS cloaked (vt+0x210 0xe00eb4: 0xbaafc(e, k, k) for k 0..6 at the cloak's phase 1 / 2, 0xbaacc back at the uncloak's\n"
  "  // phase 2, 0xe019c4): slots 0-6 on their own table-1 rows. `ctl` is the class byte (CLASS_CONTROLS em025_00, Invisible).\n"
  "  em025_00: { rules: [0, 1, 2, 3, 4, 5, 6].map(k => ({ slot: k, row: k, ctl: [1] })) },\n"
  "  em068_00: {\n    modes: ['Normal', 'Exhausted'],"),
 ("    if (r.mode && r.mode.indexOf((st && st.mode) | 0) < 0) continue;",
  "    if (r.mode && r.mode.indexOf((st && st.mode) | 0) < 0) continue;\n"
  "    if (r.ctl && r.ctl.indexOf((st && st.ctl) | 0) < 0) continue;"),
 ("  if (Array.isArray(sw.modes) && sw.modes.length > 1) return 'mode';",
  "  if (Array.isArray(sw.modes) && sw.modes.length > 1) return 'mode';\n"
  "  if (sw.rules.some(r => r.ctl)) return 'ctl';             // the class control's byte (Chameleos's Invisible)"),
])

# ---- motion-states.js: the eyes return when the phase machine says (vt+0x1c8: P+0x5cfc bit 0 with +0x15 < 4 keeps them off)
patch(V + r'\render\motion-states.js', [
 ("  em025_00: { groups: [1, 6], on: ms => ms.userCtl === 1, tables: [{ off: [[1], [2]], on: [[9], [9]] }] },",
  "  // (the uncloak keeps them off until its phase 4: `cloakEyes`, set by index.html stepCloak025, else the control)\n"
  "  em025_00: { groups: [1, 6], on: ms => (ms.cloakEyes != null ? ms.cloakEyes : ms.userCtl === 1), tables: [{ off: [[1], [2]], on: [[9], [9]] }] },"),
])

# ---- index.html: the phase machine, the alpha, the meat axis
patch(V + r'\index.html', [
 ("let cloak025 = { on: false, since: 0 };\n"
  "function stepCloak025(rt){\n"
  "  const root = mounted.main;\n"
  "  const on = state.id === 'em025_00' && (state.classCtl | 0) === 1;\n"
  "  if (root && root.userData) root.userData.cloakOn = on;\n"
  "  // the clock: the effect runtime's 60 Hz steps when it is up (the game's frames), else the wall clock\n"
  "  const now = rt && rt.schedule && Number.isFinite(rt.schedule.frame) ? rt.schedule.frame / 60 : performance.now() / 1000;\n"
  "  if (on !== cloak025.on || (on && now < cloak025.since)){ cloak025 = { on, since: now }; }\n"
  "  const hide = on && now - cloak025.since >= 30 / 60;\n"
  "  if (root && state.id === 'em025_00' && root.visible === hide) root.visible = !hide;\n"
  "  if (rt && rt.schedule) rt.schedule.pslRefuse = on;\n"
  "}\n",
  "// [2026-10-18, the gaps closed] THE PHASE MACHINE vt+0x210 0xe00eb4 on the runtime's 60 Hz steps (frames f since the change):\n"
  "//   ON, horn intact (ctl+0x13 2, the FULL cloak): f0 body / wing stealth_start_S, light fade_out, eyes off; f30 alpha 0 at once\n"
  "//     (0xe01a38) -- the model not drawn -- and the hit zones on the second block; PSL starts refused throughout (vt+0x12c).\n"
  "//   ON, horn broken (ctl+0x13 1, the SHIMMER): f0 the same; f30 stealth01 / 02 into slots 1 / 3 (0xe01500), stealth_start (15),\n"
  "//     f45 the stealth loop; alpha stays 1; the PSL gate is open (it needs +0x13 2).\n"
  "//   OFF from full: f0 the stealth materials swapped in with stealth_end (30) and the alpha 0 -> 1 over 60 (0xe01764, the model\n"
  "//     drawn translucent while it is below 1: 0x892254); f30 the body / wing back (0xe017b8) with stealth_end_S (30); f60 the light\n"
  "//     fade_in (30); f90 the eyes back (+0x15 reaches 4).   OFF from shimmer: the same from f0, without the alpha.\n"
  "// The horn: P+0x3b4 bit 1 -> the part pass's set 4 (group 5 off) in place of set 3.\n"
  "let cloak025 = { on: false, since: 0, full: true };\n"
  "let cloakAlpha025 = 1;\n"
  "function stepCloak025(rt){\n"
  "  const root = mounted.main;\n"
  "  if (!root || !root.userData) return;\n"
  "  if (state.id !== 'em025_00'){ cloakAlpha025 = 1; return; }\n"
  "  const on = (state.classCtl | 0) === 1;\n"
  "  // the clock: the effect runtime's 60 Hz steps when it is up (the game's frames), else the wall clock\n"
  "  const now = rt && rt.schedule && Number.isFinite(rt.schedule.frame) ? rt.schedule.frame / 60 : performance.now() / 1000;\n"
  "  const drawn = root.userData.partsDrawn, hornBroken = !!(drawn && drawn.get(5) === false && drawn.get(2) === true);\n"
  "  if (on !== cloak025.on || now < cloak025.since){\n"
  "    // a change before the first one settled starts from where the model is (the ROM's phases run from the new request)\n"
  "    cloak025 = { on, since: now, full: on ? !hornBroken : cloak025.full, first: cloak025.first === undefined && !on };\n"
  "  }\n"
  "  const f = (now - cloak025.since) * 60, full = cloak025.full, settled = cloak025.first;\n"
  "  // the material clock the stage machines read: this frame's t, the phase starts placed on it\n"
  "  const tMat = performance.now() / 1000, at = fr => tMat - (f - fr) / 60;\n"
  "  const mc = root.userData.manualClips = {};\n"
  "  let swap = null, alpha = 1, eyes = on;\n"
  "  if (on){\n"
  "    mc.body = ['stealth_start_S', at(0)]; mc.light = ['fade_out', at(0)];\n"
  "    if (full){ if (f >= 30) alpha = 0; }\n"
  "    else if (f >= 30){ swap = 'stealth'; mc.stealth = f < 45 ? ['stealth_start', at(30)] : ['stealth', at(45)]; }\n"
  "  } else if (!settled){\n"
  "    if (f < 30){ swap = 'stealth'; mc.stealth = ['stealth_end', at(0)]; mc.body = ['stealth_start_S', at(-30)]; mc.light = ['fade_out', at(-30)]; }\n"
  "    else if (f < 60){ mc.body = ['stealth_end_S', at(30)]; mc.light = ['fade_out', at(-30)]; }\n"
  "    else if (f < 90) mc.light = ['fade_in', at(60)];\n"
  "    if (full) alpha = Math.min(1, f / 60);\n"
  "    eyes = f < 90;\n"
  "  }\n"
  "  if ((root.userData.matSwapState || null) !== swap) applyMaterialSwap(root, swap);\n"
  "  cloakAlpha025 = alpha;\n"
  "  motionStates.cloakEyes = eyes;\n"
  "  root.userData.cloakOn = on;\n"
  "  if (rt && rt.schedule) rt.schedule.pslRefuse = on && full;\n"
  "}\n"
  "// THE MODEL ALPHA (P+0x5dfc -> e+0x158): 0 = the model is not drawn (0x892098); below 1 the translucent draw (0x892254, INFERRED from\n"
  "// the vt+0x68 path) -- every material of the model at `alpha` x its own opacity, blended. After the material step, so an animated\n"
  "// material's own opacity is the base it multiplies; a material left alone keeps its base from the frame it was first scaled.\n"
  "function applyCloakAlpha025(){\n"
  "  const root = mounted.main;\n"
  "  if (!root) return;\n"
  "  const a = state.id === 'em025_00' ? cloakAlpha025 : 1;\n"
  "  if (root.visible === (a <= 0)) root.visible = a > 0;\n"
  "  root.traverse(o => {\n"
  "    if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;\n"
  "    for (const m of Array.isArray(o.material) ? o.material : [o.material]){\n"
  "      const u = m.userData || (m.userData = {});\n"
  "      if (a >= 1){\n"
  "        if (u.cloakA){ if (Math.abs(m.opacity - u.cloakA.set) < 1e-6) m.opacity = u.cloakA.base; m.transparent = u.cloakA.transparent; delete u.cloakA; }\n"
  "        continue;\n"
  "      }\n"
  "      const base = u.cloakA && Math.abs(m.opacity - u.cloakA.set) < 1e-6 ? u.cloakA.base : m.opacity;\n"
  "      const transparent = u.cloakA ? u.cloakA.transparent : m.transparent;\n"
  "      m.opacity = base * a; m.transparent = true;\n"
  "      u.cloakA = { base, transparent, set: m.opacity };\n"
  "    }\n"
  "  });\n"
  "}\n"),
 ("      for (const g of Object.values(mounted)) stepMatAnim(g, t, st, mid, tStateChanged, prevMatState, levelClip());\n    }\n",
  "      for (const g of Object.values(mounted)) stepMatAnim(g, t, st, mid, tStateChanged, prevMatState, levelClip());\n    }\n"
  "    applyCloakAlpha025();                  // Chameleos's model alpha over what the materials just set\n"),
 # the hit-zone table on the class control
 ("  if (axis === 'mode') return { axis, names: meatSwitchOf(e.id).modes.map(String) };",
  "  if (axis === 'mode') return { axis, names: meatSwitchOf(e.id).modes.map(String) };\n"
  "  // THE CLASS CONTROL's options (Chameleos's Invisible: CLASS_CONTROLS em025_00)\n"
  "  if (axis === 'ctl'){ const cc = CLASS_CONTROLS[e.id]; return cc ? { axis, names: cc.options.map(o => o[1]) } : null; }"),
 ("  if (axis === 'mode') return state.zoneMode | 0;\n  if (axis === 'rage') return state.rage ? 1 : 0;",
  "  if (axis === 'mode') return state.zoneMode | 0;\n"
  "  if (axis === 'ctl'){ const cc = CLASS_CONTROLS[state.id]; return cc ? Math.max(0, cc.options.findIndex(o => o[0] === (state.classCtl | 0))) : 0; }\n"
  "  if (axis === 'rage') return state.rage ? 1 : 0;"),
 ("                                              mode: st.axis === 'mode' ? i : 0, ladder: state.rageLevel | 0,",
  "                                              mode: st.axis === 'mode' ? i : 0, ladder: state.rageLevel | 0, ctl: state.classCtl | 0,"),
 ("    if (st.axis === 'mode'){\n      state.zoneMode = +e.target.value;",
  "    if (st.axis === 'ctl'){\n"
  "      const cc = CLASS_CONTROLS[en.id], sel = document.getElementById('monClassCtl'), o = cc && cc.options[+e.target.value];\n"
  "      if (o){ sel.value = String(o[0]); sel.onchange({ target: sel }); }\n"
  "      return;\n"
  "    }\n"
  "    if (st.axis === 'mode'){\n      state.zoneMode = +e.target.value;"),
 ("  plays.key = null; plays.motion = null;\n  applyPartState();                       // a control the part pass reads (STATE_OVERLAY's `on`: Amatsu's e+0x15fb)\n};",
  "  plays.key = null; plays.motion = null;\n  applyPartState();                       // a control the part pass reads (STATE_OVERLAY's `on`: Amatsu's e+0x15fb)\n"
  "  if (meatSwitchOf(state.id)) Promise.resolve().then(() => applyHeat()).then(applyGap).catch(noteError);   // a damage table on the byte (Chameleos)\n};"),
])
print('ok')
