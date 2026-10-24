import os, json
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
("""  em076_00: { period: 30, joint: 1, records: [['em076_00u', 1120], ['em076_00u', 1121]], pick: () => 0 },""",
"""  em076_00: { period: 30, joint: 1, records: [['em076_00u', 1120], ['em076_00u', 1121]], pick: () => 0 },
  // LAO-SHAN LUNG and KUSHALA DAORA: the stub shape -- vtable +0x2a4 is the base 0x6bf64, so the request is always u 1121;
  // neither class writes e+0xb7d2 or P+0x5d04 (dev/elder-dragons-effects-survey.md 1). Their 1120 / 1121 are cm200_007,
  // byte-identical but the key: Lao-Shan's on joint 4 at (0, -20, 200), Kushala's on joint 3 at (0, 20, 200). The joint
  // is the record's, as the dromes' is. (Teostra has the same shape and is NOT here: Raven took him off _autoOnRage on
  // 2026-09-15.)
  em012_00: { period: 30, joint: 4, records: [['em012_00u', 1120], ['em012_00u', 1121]], pick: () => 0 },
  em024_00: { period: 30, joint: 3, records: [['em024_00u', 1120], ['em024_00u', 1121]], pick: () => 0 },
  // NAJARALA and NERSCYLLA: the stub shape (vtable +0x2a4 the base stub; no P+0x5d04 / e+0xb7d2 write in either band;
  // dev/remaining-classes-effects-survey.md): Najarala's cm200_007 on joint 12 at (0, 0, 200), Nerscylla's own
  // em070_00_018 on joint 1 at (0, -60, 140), 1120 / 1121 byte-identical but the key.
  em068_00: { period: 30, joint: 12, records: [['em068_00u', 1120], ['em068_00u', 1121]], pick: () => 0 },
  em070_00: { period: 30, joint: 1, records: [['em070_00u', 1120], ['em070_00u', 1121]], pick: () => 0 },
  // GORE MAGALA, CHAOTIC GORE MAGALA and SHAGARU MAGALA, one class uEm071_00 (there is no uEm072_00): vtable +0x2a4 =
  // 0xfbec80 is Rathian's 0xd08afc INSTRUCTION FOR INSTRUCTION (the same calls 0x13ecc14 / 0x13ecba8, the same literal
  // 0x4622f983, the same cmp 0x6e38), and the class setup writes P+0x5d04 = 4 (0xfadbac) -- her joint -- so
  // rathianPuffPick answers for them unchanged (dev/remaining-classes-effects-survey.md, rom-map uEm071_00). Their 1120
  // and 1121 DIFFER (em071_00_020 on joint 3: 1120 nearer the head, 1121 at z 100), so the pick shows. The puff asks for
  // the u pair; Gore's c 1120 / c 1121 are exported but nothing requests them.
  em071_00: { period: 30, joint: 4, records: [['em071_00u', 1120], ['em071_00u', 1121]], pick: rathianPuffPick },
  em071_05: { period: 30, joint: 4, records: [['em071_05u', 1120], ['em071_05u', 1121]], pick: rathianPuffPick },
  em072_00: { period: 30, joint: 4, records: [['em072_00u', 1120], ['em072_00u', 1121]], pick: rathianPuffPick },"""),
])

p = 'docs/effect-mounts.json'
b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
lst = json.loads(s)['_autoOnRage']
add = [m for m in ('em012_00', 'em024_00', 'em068_00', 'em070_00', 'em071_00', 'em071_05', 'em072_00') if m not in lst]
i = s.index('"_autoOnRage": ['); j = s.index(']', i)
s = s[:i] + s[i:j].rstrip() + ''.join(',\n  "%s"' % m for m in add) + '\n ' + s[j:]
json.loads(s)
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))
print('ok', add)
