p = 'mk066spec.py'
s = open(p, encoding='utf8').read()
a = """    "  const S = body().schedule;",
    "  for (const key of [0, 1, 2, 20, 22, 24, 30, 32, 40, 42]){","""
b = """    "  {",
    "    // THE SNOW VARIANTS LIST (Raven, 2026-10-18): the same clips with the snow map on -- the rocks' and the slab's snow modes",
    "    const snowList = [...listSel.options].find(o => o.value === 'snow');",
    "    check(!!snowList && snowList.textContent.includes('Snow Variants'), 'the Snow Variants list is there', snowList ? snowList.textContent : null);",
    "    if (snowList){",
    "      await pick('snow', 'L4 Motion[1]');",
    "      const w = await watch(200, x => x.some(y => y.shell === 'shell00'));",
    "      check(w.some(x => x.shell === 'shell00' && (x.mode === 3 || x.mode === 4) && x.key === 21 && x.req), 'Snow Variants L4 Motion[1]: the snow rocks (modes 3 / 4, u 21)', w);",
    "      await pick('snow', 'L4 Motion[30]');",
    "      const s = await watch(120, x => x.some(y => y.shell === 'shell16'));",
    "      check(s.some(x => x.shell === 'shell16' && (x.mode === 0 || x.mode === 1) && x.req), 'Snow Variants L4 Motion[30]: the snow slab (mode 0 / 1)', s);",
    "    }",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [0, 1, 2, 20, 22, 24, 30, 32, 40, 42, 21, 23, 25, 31, 33, 41, 43]){","""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
