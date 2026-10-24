# Chameleos's Invisible control (Raven, 2026-10-18), by the ROM's read (dev/em025_00-effects-spec.md 8; rom-map "Chameleos -- the
# invisibility"): the class byte ctl+0xc, the material phase machine vt+0x210 0xe00eb4, the model alpha P+0x5dfc -> e+0x158 (0 = not
# drawn), the eye set 9 (vt+0x1c8 0xe0df70) and the PSL start gate vt+0x12c 0xdff12c.
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def patch(path, pairs):
    s = open(path, encoding='utf8', newline='').read()
    NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
    for a, b in pairs:
        a2, b2 = a.replace('\n', NL), b.replace('\n', NL)
        assert s.count(a2) == 1, (path, a[:80], s.count(a2))
        s = s.replace(a2, b2)
    open(path, 'w', encoding='utf8', newline='').write(s)

patch(V + r'\render\motion-states.js', [
 ("  em058_00: { key: 'hpState'",
  "  // CHAMELEOS's invisibility ctl+0xc (dev/em025_00-effects-spec.md 8; READ 2026-10-18): set by (1, 0x11) / (1, 0x03) at L0 M16 f70,\n"
  "  // (1, 0x16) at L3 M32, (2, 0x14) at L2 M30 f0 (each with the area gate 0x5bfb8 / 0x5c1a8, NOT READ as a value), cleared at\n"
  "  // almost every action start (vt+0x204) and by ~20 action bodies -- the control is the state the play starts in. With the horn\n"
  "  // intact (ctl+0x13 = 2) it is the FULL cloak: his body and wing play stealth_start_S, the light fade_out, the eyes go (set 9),\n"
  "  // at 30 frames the model's alpha P+0x5dfc goes to 0 and the model is not drawn (0x892098), and no PSL record starts while it\n"
  "  // lasts (vt+0x12c 0xdff12c). Working label, for Raven to name.\n"
  "  em025_00: { key: 'invisible', label: 'Invisible', options: [[0, 'Off'], [1, 'On']],\n"
  "              title: 'ctl+0xc, his invisibility: body / wing fade (stealth_start_S), the light out, the eyes off, then the model not drawn; no PSL effect starts while it lasts.' },\n"
  "  em058_00: { key: 'hpState'"),
 ("export const STATE_OVERLAY = {",
  "export const STATE_OVERLAY = {\n"
  "  // CHAMELEOS invisible (CLASS_CONTROLS em025_00): vt+0x1c8 0xe0df70 answers 1 while ctl+0xc is set -> the eye set 9 (groups 1 and\n"
  "  // 6 off) in place of the open / shut pair 1 / 2\n"
  "  em025_00: { groups: [1, 6], on: ms => ms.userCtl === 1, tables: [{ off: [[1], [2]], on: [[9], [9]] }] },"),
])
patch(V + r'\render\monster.js', [
 ("  em021_00: { mats: ['XfB_N__E_m01_nose'], clips: ['angry_Change', 'angry_Loop', 'angry_End'],",
  "  // CHAMELEOS's invisibility (vt+0x210 0xe00eb4, its phases on ctl+0x15; dev/em025_00-effects-spec.md 8): cloaking, slot 0 of body\n"
  "  // (MRL id 2) and wing (id 50) gets stealth_start_S (30 frames, fTransparency 1 -> 0) and the light (id 51) fade_out (30), each\n"
  "  // HELD at its end (`hold`: the machine's loop is the start's last frame); uncloaking, stealth_end_S and fade_in, then the rest\n"
  "  // (body / wing: no clip; the light its load-time auto pulse). `on: 'cloak'` is root.userData.cloakOn (index.html stepCloak025).\n"
  "  // NOT SHOWN, named: the shimmer path (horn broken / (1, 0x16): stealth01 / stealth02 put in material slots 1 / 3, stealth_start\n"
  "  // then the stealth loop) and the uncloak's first phase on those materials (stealth_end, the alpha back over 60) -- the viewer\n"
  "  // has no material-slot swap.\n"
  "  em025_00: [{ mats: ['XfB_N__E0__m02_body', 'XfBAN__E1__m50_wing'], clips: ['stealth_start_S', 'stealth_start_S', 'stealth_end_S'],\n"
  "               on: 'cloak', hold: true, settle: 'rest' },\n"
  "             { mats: ['XfB_0__m01_light'], clips: ['fade_out', 'fade_out', 'fade_in'], on: 'cloak', hold: true, rest: 'auto', settle: 'rest' }],\n"
  "  em021_00: { mats: ['XfB_N__E_m01_nose'], clips: ['angry_Change', 'angry_Loop', 'angry_End'],"),
 ("  const on = s.tbl.heat ? !!(heatOn && heatOn[s.tbl.heat]) : s.tbl.on === 'drawn' ? matsDrawn(root, s) : state === 'enraged';",
  "  const on = s.tbl.heat ? !!(heatOn && heatOn[s.tbl.heat]) : s.tbl.on === 'drawn' ? matsDrawn(root, s)\n"
  "           : s.tbl.on === 'cloak' ? !!(root.userData && root.userData.cloakOn) : state === 'enraged';"),
 ("  else if (s.stage === 1){ if (ran()) set(1, 2); }",
  "  // `hold`: the loop IS the start's last frame (Chameleos's cloak: stealth_start_S held transparent), so the clip is not restarted\n"
  "  else if (s.stage === 1){ if (ran()){ if (s.tbl.hold){ s.stage = 2; s.loopT0 = tSec; } else set(1, 2); } }"),
])
patch(V + r'\render\rom\effect\schedule.js', [
 ("        else if (is) for (const q of this.startClip(b.efl, b.key)) m.w32(q.core + 0x194, word);",
  "        // `pslRefuse`: the class's PSL start gate refuses every start (Chameleos fully cloaked: vt+0x12c 0xdff12c; index.html)\n"
  "        else if (is && !this.pslRefuse) for (const q of this.startClip(b.efl, b.key)) m.w32(q.core + 0x194, word);"),
])
patch(V + r'\index.html', [
 ("  syncClassHolds(rt, wq ? wq.list + '|' + wRow : seq ? seq.list + '|' + seq.clip : state.list + '|' + rowClip);",
  "  syncClassHolds(rt, wq ? wq.list + '|' + wRow : seq ? seq.list + '|' + seq.clip : state.list + '|' + rowClip);\n"
  "  stepCloak025(rt);"),
 ("// the second class byte (render/motion-states.js CLASS_CONTROLS2): Teostra's size type P+0x5cb6",
  "// CHAMELEOS's INVISIBLE (render/motion-states.js CLASS_CONTROLS em025_00; dev/em025_00-effects-spec.md 8): the class byte drives the\n"
  "// material machine (render/monster.js ROM_STAGE_CLIPS em025_00, `on: 'cloak'`), and -- the full cloak, ctl+0x13 = 2 -- the model's\n"
  "// alpha P+0x5dfc goes to 0 at the end of stealth_start_S's 30 frames (vt+0x210 phase 1, 0xe01a38): e+0x158 = 0 and the model draw\n"
  "// 0x892098 returns, so the model is not drawn; uncloaked it is drawn again (the ROM's 60-frame alpha ramp back is not shown: the\n"
  "// viewer's model has no global alpha). While cloaked the class's PSL gate (vt+0x12c 0xdff12c) refuses every PSL start.\n"
  "let cloak025 = { on: false, since: 0 };\n"
  "function stepCloak025(rt){\n"
  "  const root = mounted.main;\n"
  "  const on = state.id === 'em025_00' && (state.classCtl | 0) === 1;\n"
  "  if (root && root.userData) root.userData.cloakOn = on;\n"
  "  const now = performance.now() / 1000;\n"
  "  if (on !== cloak025.on){ cloak025 = { on, since: now }; }\n"
  "  const hide = on && now - cloak025.since >= 30 / 60;\n"
  "  if (root && state.id === 'em025_00' && root.visible === hide) root.visible = !hide;\n"
  "  if (rt && rt.schedule) rt.schedule.pslRefuse = on;\n"
  "}\n"
  "// the second class byte (render/motion-states.js CLASS_CONTROLS2): Teostra's size type P+0x5cb6"),
])
print('ok')
