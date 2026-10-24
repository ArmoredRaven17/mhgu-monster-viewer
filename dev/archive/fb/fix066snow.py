p = 'mk066spec.py'
s = open(p, encoding='utf8').read()
a = """  "    C('s77_turned', 0x77, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { tusk: 1, owner: [0, 0xa321, 0], " + SLAB % '0x77' + " }),",
]"""
b = """  "    C('s77_turned', 0x77, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { tusk: 1, owner: [0, 0xa321, 0], " + SLAB % '0x77' + " }),",
  "    // THE SNOW MAPS (the Snow Variants list, input.snow): e+0x1053 = 3 / 14 / 20 -- the rocks' table 0x16a0820, the slab's 0 / 1",
  "    C('r55_snow', 0x55, 1, 124.0, 0, Q('Motion[1]', 0x55, 200, '4'), { map: 3 }),",
  "    C('r56_snow_one', 0x56, 1, 124.0, 0, Q('Motion[2]', 0x56, 200, '4'), { map: 14, tusk: 1 }),",
  "    C('s89_snow', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { map: 20, " + SLAB % '0x89' + " }),",
  "    C('s89_snow_broken', 0x89, 0, null, 0, Q('Motion[30]', 0x89, 900, '4'), { map: 3, tusk: 2, " + SLAB % '0x89' + " }),",
]"""
assert s.count(a) == 1
s = s.replace(a, b)
a = """rep("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
    "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, tusk066: x.tusk || 0 });")"""
b = """rep("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
    "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, tusk066: x.tusk || 0, snow: [3, 14, 20].includes(x.map) });")"""
assert s.count(a) == 1
s = s.replace(a, b)
a = """    "    if (c.precall) o.precall = c.precall;\\n    o.dtp = %s;\\n"""
assert s.count(a) == 1, 'precall'
s = s.replace(a, """    "    if (c.precall) o.precall = c.precall;\\n    if (c.map != null) o.owner_bytes = Object.assign({}, o.owner_bytes, { '0x1053': [c.map] });\\n    o.dtp = %s;\\n""")
open(p, 'w', encoding='utf8').write(s)
print('ok')
