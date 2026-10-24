# build_ms.py: motion-states.js -- the eight approved controls' data side (2026-10-19)
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
def rep(a, b, n=1):
    global t
    a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
    assert t.count(a2) == n, (t.count(a2), a[:70])
    t = t.replace(a2, b2)

# 1. CLASS_TOGGLES (a generic on / off class input), before CLASS_CONTROLS2
rep("export const CLASS_CONTROLS2 = {\n", """// CLASS TOGGLES -- on / off inputs a class reads that no other control holds (dev/effects-open-items.md section 5, approved by
// Raven 2026-10-19; the labels are WORKING LABELS, listed for Raven to name). index.html draws one switch per entry
// (monClassToggles) and keeps the value in state.toggles[key]; each consumer names the ROM test it stands for.
//   burrowed  "Begins Burrowed": 0x81d6c -- posture 4 AND P+0x5c below 0.9 x MoguriBaseOfs (0xbf62c, dtbase +0xa8) at the play's
//             start. Every posture-4 play then reads sunk (index.html: sunk = the entry's own || (burrowed && posture 4)); off,
//             a posture-4 play is begun from the surface unless its entry names sunk (the burrowed L0 M6 copies).
//   tiredRage "Tired (with Rage)": 0x81614 = P+0x505 alone (no rage test); the stamina machine 0xbd1a4 sets it with no rage
//             test either, so a monster can be enraged and tired at once. The Rath line's word (bits 24-26 on L2 M1 / L4 M32) reads
//             it: on, with Enraged, the play reads tired.
//   poisoned  "Poisoned": P+0x5e08 bit 1, set by the hit pass's first ailment accumulator (0x9a290 -> 0xa239c) -- while it is set
//             Kushala's wind (ctl+0x18) and Teostra's aura (vt+0x208 0xe10f7c) are off, and the shared 0xa4518 requests c 1100
//             (id 0) on its timer.
const BURROWED = { key: 'burrowed', label: 'Begins Burrowed',
                   title: '0x81d6c: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs at the play\\'s start -- the burrow clips read "already sunk".' };
const TIRED_RAGE = { key: 'tiredRage', label: 'Tired (with Rage)',
                     title: '0x81614 (P+0x505) has no rage test: with Enraged on, the play reads tired too (L2 M1 / L4 M32 lose bits 24-26).' };
const POISONED = { key: 'poisoned', label: 'Poisoned',
                   title: 'P+0x5e08 bit 1 (0xa239c): the aura / wind is held off and c 1100 is requested every 60 frames (0xa4518).' };
export const CLASS_TOGGLES = {
  em004_00: [BURROWED], em005_00: [BURROWED], em033_00: [BURROWED], em038_00: [BURROWED], em043_00: [BURROWED], em043_05: [BURROWED],
  em044_00: [BURROWED], em045_00: [BURROWED], em063_00: [BURROWED], em063_05: [BURROWED], em060_00: [BURROWED], em060_04: [BURROWED],
  em001_00: [TIRED_RAGE], em001_02: [TIRED_RAGE], em001_04: [TIRED_RAGE], em002_00: [TIRED_RAGE], em002_02: [TIRED_RAGE], em002_04: [TIRED_RAGE],
  em024_00: [POISONED], em027_00: [POISONED],
};
export const CLASS_CONTROLS2 = {
""")

# 2. Congalala's Gas Type (CLASS_CONTROLS)
rep("export const CLASS_CONTROLS = {\n", """export const CLASS_CONTROLS = {
  // CONGALALA's gas ctl[1] (the type his last meal left; table 0xdd7dc0): his breath L2 M16 (7, 0x34) reads it -- 1 bits 15-16,
  // 2 bits 19-20, 3 bits 17-18, 4 bits 21-22, 0 none (psl-mask.js em021_00). Was a per-play cycle of the four (approved
  // 2026-10-19; working label). The eating plays still set their own gas.
  em021_00: { key: 'gasType', label: 'Gas Type', options: [[0, 'None'], [1, 'Gas 1'], [2, 'Gas 2'], [3, 'Gas 3'], [4, 'Gas 4']],
              title: 'ctl[1], the gas his breath L2 M16 (7, 0x34) carries: set by what he ate (0xdd7dc0).' },
""")

# 3. Soulseer's repeated (2, 0x36): copy D of L0 M4
rep("  em082_04: { '0|Motion[12]': ['A', 'B'], '0|Motion[4]': ['A', 'B', 'C'],", "  em082_04: { '0|Motion[12]': ['A', 'B'], '0|Motion[4]': ['A', 'B', 'C', 'D'],")
rep("    '9|Motion[5]': P310, '9|Motion[8]': P310, '9|Motion[1]#B': P310, '0|Motion[4]#C': P310,",
    "    '9|Motion[5]': P310, '9|Motion[8]': P310, '9|Motion[1]#B': P310, '0|Motion[4]#C': P310,\n"
    "    // copy D: (2, 0x36) after (2, 0x36) -- the action start's selector 2 (0x1037318..0x103749c) requests id 1004 = u 330 as it\n"
    "    // starts, then phase 1 sets e+0xcb45 (u 310 held, u 300 off) as copy C (approved 2026-10-19)\n"
    "    '0|Motion[4]#D': Object.assign({}, P310, { start: [U(330)] }),")
rep("// handle), and (2, 0x36) after (2, 0x36) -> u 330 (not shown: the viewer cannot tell a repeated play).",
    "// handle), and (2, 0x36) after (2, 0x36) -> u 330 (copy D of L0 M4, 2026-10-19).")

# 4. Deadeye's L0 M7 copy B (start frame 18)
rep("export const CLIP_VARIANTS = {\n", "export const CLIP_VARIANTS = {\n  em018_04: { '0|Motion[7]': ['A', 'B'] },     // B: (7, 0xe3) / (7, 0xe5), begun at frame 18 (psl-mask.js `startFrame`)\n")

# 5. the class timers' alpha output (the unit colour block +0x180..+0x19c, as the class writes it)
rep("    for (const r of T.step(k.t, c)) out.fire.push(r);\n",
    "    for (const r of T.step(k.t, c)) out.fire.push(r);\n"
    "    // `alpha`: [pel, key, a] -- the class writes unit 0's colour block (+0x180..+0x19c) of that held request to a each frame\n"
    "    // (Amatsu 0xf09ac8, Valstrax 0x109f110); index.html hands it to the runtime (alphaEvent)\n"
    "    if (T.alpha) for (const r of T.alpha(k.t, c)) out.alpha.push(r);\n")
rep("                  holdOn: [], holdOff: [], eyesOff: [], eyesOn: [] };", "                  holdOn: [], holdOff: [], eyesOff: [], eyesOn: [], alpha: [] };")

# 6. Amatsu's aura: hidden = alpha 0 with the handle kept; the fade back in 0.02 a frame (0xf099cc, READ 2026-10-19)
rep("""  em058_00: { step: (t, c) => {
                const U = k => ['em058_00u', k, 'UNIQUE'], fire = [], hp = c.ctl === 1;
                const hidden = !!c.action && c.action[0] === 7 && c.action[1] !== 0xc;
                if (c.dead){ if (!t.died){ t.died = true; fire.push(U(2), U(102)); } c.hidden = hidden; return fire; }
                t.died = false;
                if (hidden && !t.hidden) fire.push(U(3));
                t.hidden = hidden; c.hidden = hidden;""",
"""  // THE FADE (0xf099cc..0xf09c08, READ 2026-10-19): on a hidden action, if the handle is up and +0x1c1 set, +0x1c1 is cleared, u 3
  // requested and unit 0's colour block (+0x180..+0x19c) set to 0 -- the aura is KEPT, invisible; otherwise (calm / enraged key
  // unchanged) +0x1c1 = 1 and the block rises by [[0x211f764]+0x68] x 0.02 a frame to 1.0 (50 frames); a key change stops the
  // handle and requests the other (a new request draws at 1.0, the ctor's). `alpha` hands the block to the runtime.
  em058_00: { step: (t, c) => {
                const U = k => ['em058_00u', k, 'UNIQUE'], fire = [], hp = c.ctl === 1;
                const hidden = !!c.action && c.action[0] === 7 && c.action[1] !== 0xc;
                if (c.dead){ if (!t.died){ t.died = true; fire.push(U(2), U(102)); } c.hidden = hidden; t.key = null; return fire; }
                t.died = false;
                const key = c.rage ? 1 : 0;
                if (t.key !== key){ t.key = key; t.a = 1; t.vis = false; }               // a new request: 1.0, +0x1c1 clear
                if (hidden){ if (t.vis){ t.vis = false; fire.push(U(3)); t.a = 0; } }
                else { t.vis = true; t.a = Math.min(1, (t.a == null ? 1 : t.a) + 0.02 * c.dt); }
                t.hidden = hidden; c.hidden = hidden;""")
rep("              holds: c => c.dead ? [] : [...(c.hidden ? [] : [['em058_00u', c.rage ? 1 : 0]]), ['em058_00u', c.ctl === 1 ? 101 : 100]],",
    "              holds: c => c.dead ? [] : [['em058_00u', c.rage ? 1 : 0], ['em058_00u', c.ctl === 1 ? 101 : 100]],\n"
    "              alpha: (t, c) => (c.dead || t.key == null) ? [] : [['em058_00u', t.key, t.a == null ? 1 : t.a]],")

# 7. Valstrax's glow: the fades in and out (0x109f080..0x109f2b8, READ 2026-10-19)
rep("""  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;
                if (k !== t.act || c.rage !== t.rage){
                  t.act = k; t.rage = c.rage;
                  const g = !c.rage ? 3 : valstraxGlow(c.action);
                  const was = t.glow == null ? 0 : t.glow;
                  if (g != null) t.glow = g; else if (t.glow == null) t.glow = 0;
                  const full = [60, 0, 0, 30, 10][t.glow - 2] || 0;      // 3 / 4 (calm is 3) stop it at once
                  t.fade = (t.glow === 0 || t.glow === 1) ? 0 : (was === 0 || was === 1) ? full : Math.min(t.fade || 0, full);
                }
                if (t.fade > 0) t.fade -= c.dt;
                c.glow = (t.glow === 0 || t.glow === 1) || t.fade > 0;
                return [];
              },""",
"""  // THE GLOW'S FADES (0x109f080..0x109f2b8, READ 2026-10-19 -- corrects the "at once" above, Withdrawn table): state 0 / 1:
  // request u 1121 when none is held, else +0x1c1 = 1 and unit 0's block rises by dt x 1/60 (state 0) or 0.1 (state 1) to 1.0;
  // states 2..6 with +0x1c1 set: the block falls by dt x [0x16a2fa0][state - 2] = 1/60, 1/60, 1/60, 1/30, 1/10; at 0 states 3 / 4
  // stop the handle (0x329c40(h, 1)) and 2 / 5 / 6 keep it at 0 with +0x1c1 cleared; with +0x1c1 clear, 3 / 4 stop it at once and
  // 2 / 5 / 6 hold it at 0.
  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;
                if (k !== t.act || c.rage !== t.rage){
                  t.act = k; t.rage = c.rage;
                  const g = !c.rage ? 3 : valstraxGlow(c.action);
                  if (g != null) t.glow = g; else if (t.glow == null) t.glow = 0;
                }
                const g = t.glow;
                if (g === 0 || g === 1){
                  if (!t.live){ t.live = true; t.a = 1; t.vis = false; }
                  else { t.vis = true; t.a = Math.min(1, t.a + c.dt * (g === 0 ? 1 / 60 : 0.1)); }
                } else if (t.live){
                  if (t.vis){
                    if (t.a < 0){ t.a = 0; t.vis = false; }
                    else {
                      t.a -= c.dt * [1 / 60, 1 / 60, 1 / 60, 1 / 30, 1 / 10][g - 2];
                      if (t.a <= 0){ if (g === 3 || g === 4) t.live = false; else { t.a = 0; t.vis = false; } }
                    }
                  } else if (g === 3 || g === 4) t.live = false;
                  else t.a = 0;
                }
                c.glow = !!t.live;
                return [];
              },""")
rep("              holds: c => c.dead ? [] : [['em086_00u', !c.rage ? 200 : c.hornBroken ? 1130 : 1120], ...(c.glow ? [['em086_00u', 1121]] : [])],",
    "              holds: c => c.dead ? [] : [['em086_00u', !c.rage ? 200 : c.hornBroken ? 1130 : 1120], ...(c.glow ? [['em086_00u', 1121]] : [])],\n"
    "              alpha: (t, c) => (!c.dead && c.glow) ? [['em086_00u', 1121, Math.max(0, t.a)]] : [],")
# 8. Poisoned: the class timers read c.toggles; Kushala / Teostra request c 1100 every 90 frames while it is on (0xa45e4..0xa4658:
#    P+0x5c5c through 0x7206c, reset to 90.0, vt+0x1cc id 0), and Teostra's u 0 is held off (0xe10f7c's bit-1 test)
rep("                ctl: user.classCtl | 0, ctl2: user.classCtl2 | 0, snowMap: !!user.snowMap,",
    "                ctl: user.classCtl | 0, ctl2: user.classCtl2 | 0, snowMap: !!user.snowMap, toggles: user.toggles || {},")
POISON = '''const poison1100 = (t, c, pel) => {           // 0xa4518's poison arm: P+0x5c5c counts down while P+0x5e08 bit 1, fires at <= 0
  if (c.dead || !c.toggles.poisoned) return [];
  if ((t.p5c || 0) <= 0){ t.p5c = 90; return [[pel, 1100, 'UNIQUE']]; }
  t.p5c -= c.dt; if (t.p5c <= 0){ t.p5c = 90; return [[pel, 1100, 'UNIQUE']]; }
  return [];
};
'''
rep("export const CLASS_TIMERS = {\n", POISON + "export const CLASS_TIMERS = {\n")
rep("  em024_00: { step: () => [], holds:", "  em024_00: { step: (t, c) => poison1100(t, c, 'em024_00c'), holds:")
rep("              records: [210, 220, 230, 240].map(k => ['em024_00u', k, 'UNIQUE']) },",
    "              records: [...[210, 220, 230, 240].map(k => ['em024_00u', k, 'UNIQUE']), ['em024_00c', 1100, 'UNIQUE']] },")
rep('''  em027_00: { step: (t, c) => {
                const on = c.ctl === 1, was = !!t.on; t.on = on;
                return (was && !on) ? [['em027_00u', 1, 'UNIQUE']] : [];
              },''', '''  em027_00: { step: (t, c) => {
                const on = c.ctl === 1 && !c.toggles.poisoned, was = !!t.on; t.on = on;      // P+0x5e08 bit 1 clear (0xa1f0c(e, 2))
                return [...((was && !on) ? [['em027_00u', 1, 'UNIQUE']] : []), ...poison1100(t, c, 'em027_00c')];
              },''')
rep("              holds: c => c.ctl === 1 ? [['em027_00u', c.ctl2 === 1 ? 10 : 0]] : [],",
    "              holds: c => (c.ctl === 1 && !c.toggles.poisoned) ? [['em027_00u', c.ctl2 === 1 ? 10 : 0]] : [],")
rep("              records: [0, 1, 10].map(k => ['em027_00u', k, 'UNIQUE']) },",
    "              records: [...[0, 1, 10].map(k => ['em027_00u', k, 'UNIQUE']), ['em027_00c', 1100, 'UNIQUE']] },")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
