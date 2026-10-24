# patch_checks_rank.py: the two G-only assertions the Quest Rank control superseded (em057_00.mjs, em085_00.mjs)
import io
D = 'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/checks/'
def patch(P, a, b):
    t = io.open(P, encoding='utf8', newline='').read()
    nl = '\r\n' if t.count('\r\n') > t.count('\n') / 2 else '\n'
    a, b = a.replace('\n', nl), b.replace('\n', nl)
    assert t.count(a) == 1, (P, t.count(a))
    io.open(P, 'w', encoding='utf8', newline='').write(t.replace(a, b))
patch(D + 'em057_00.mjs',
"""    check(P && P.joint === 2 && P.records.every(r => r[0] === U && r[1] === 250 && r[2] === 'UNIQUE'),
          'HIS PUFF IS HIS CLASS\\'S OWN at G: e+0xb7d2 = 0 kills the shared request and vtable +0x208 runs id 1008 ' +
          '-> u key 250. BOTH slots name it, because below G he would use the shared u 1121 and the viewer is at G. ' +
          'The record names its ARRAY because em057_04u holds key 250 in SEQUENCE and in UNIQUE', P && P.records);""",
"""    // [2026-10-20, effects lane: the Quest Rank control -- the pick now reads the rank: records [u 250 UNIQUE, the shared u 1121],
    // u 250 at G, u 1121 below; the puff itself is played at both ranks by dev/checks/quest-rank.mjs]
    check(P && P.joint === 2 && P.records[0][0] === U && P.records[0][1] === 250 && P.records[0][2] === 'UNIQUE' && P.records[1][1] === 1121 &&
          P.pick(null, { rank: 5 }) === 1 && P.pick(null, { rank: 1 }) === 0,
          'HIS PUFF IS HIS CLASS\\'S OWN at G: e+0xb7d2 = 0 kills the shared request and vtable +0x208 runs id 1008 ' +
          '-> u key 250 (UNIQUE: em057_04u holds key 250 in SEQUENCE and in UNIQUE); below G the shared u 1121 -- by the Quest Rank', P && P.records);""")
patch(D + 'em085_00.mjs',
"""  check(keys.includes(1001) && !keys.includes(1011),
        'u 1001 (the crest) is there and u 1011 IS NOT: at G the tail break asks for key 1012, which his pel does ' +
        'not hold, so the low-rank record is never reachable and is not exported', keys);""",
"""  // [2026-10-20, effects lane: the Quest Rank control reaches the low-rank tail break, so u 1011 is exported (the tail arm's
  // `lowRank`); at G it is still never asked for -- dev/checks/quest-rank.mjs plays both ranks]
  check(keys.includes(1001) && keys.includes(1011),
        'u 1001 (the crest) is there, and u 1011 too: at G the tail break asks for key 1012, which his pel does ' +
        'not hold; below G (the Quest Rank control) it asks for u 1011', keys);""")
print('ok')
