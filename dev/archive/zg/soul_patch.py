import json
def patch(p, pairs):
    s = open(p, encoding='utf8', newline='').read()
    for a, b in pairs:
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8', newline='').write(s)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
patch(R + r'\render\motion-states.js', [
("""                ctl: user.classCtl | 0, hornBroken:""",
 """                ctl: user.classCtl | 0, eyesOff: this.eyesOff().length > 0, hornBroken:"""),
("""  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;""",
"""  // SOULSEER's SOUL FLAME (dev/em082-effects-spec.md 5; READ 2026-10-18): vt+0x208 0x10361dc's Soulseer block holds id 1001 = u 300
  // (em082_04_000, joint 2) on e+0xcbc0 while P+0x1bb bit 1 is set (0x1036314) and e+0xcb45 == 0, and stops it the frame either
  // fails -- no dying gate. Bit 1 is the Soul Flame control (CLASS_CONTROLS below); e+0xcb45 is the u 310 latch the P310 rows
  // carry (`eyesOff`). Was `when: rage`.
  em082_04: { step: () => [], holds: c => (c.ctl === 1 && !c.eyesOff) ? [['em082_04u', 300]] : [],
              records: [['em082_04u', 300, 'UNIQUE']] },
  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;"""),
("""  em058_00: { key: 'hpState', label: 'HP State',""",
"""  // SOULSEER's SOUL FLAME P+0x1bb bit 1 (dev/em082-effects-spec.md 5; states-em082_00.md 9): lit only by 0x1039320 at the end of
  // his four rage roars (1, 0x10..0x13); put out at an action start once EMC request 0x13 armed e+0xcb46 (vt+0x204's tail
  // 0x10374b0..0x10374f0, which also ends the rage). The play starts with it as set here. Read by: his enable word (0x1038f4c:
  // bits 27-29 for 24-26), u 300's hold (vt+0x208, CLASS_TIMERS), the soul-flame shells' makers (0x1035ee8; the shells lane) and a
  // tune pick 0x1035c6c (floats 0x85 / 0x86 / 0x87) -- not his part pass or his materials (they test bits 2 / 3, the furs).
  em082_04: { key: 'soulFlame', label: 'Soul Flame', options: [[0, 'Off'], [1, 'On']],
              title: 'P+0x1bb bit 1, lit by his rage roars: u 300 on his head, bits 27-29 of his word, the soul-flame shells.' },
  em058_00: { key: 'hpState', label: 'HP State',""")])
p = R + r'\effects\em082_04.json'
t = open(p, encoding='utf8', newline='').read(); d = json.loads(t); n = 0
for e in d['effects']:
    r = e.get('record') or {}
    if e.get('when') == 'rage' and r.get('pel') == 'em082_04u' and r.get('key') == 300: e['when'] = 'event'; n += 1
out = json.dumps(d, indent=1, ensure_ascii=False)
if t.endswith('\n'): out += '\n'
open(p, 'w', encoding='utf8', newline='').write(out)
print('ok, retagged', n)
