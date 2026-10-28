# b02check.py: base02 (the beam base) and Deviljho's base04 / base55 against the -1 rule: each base ctor run (+0x15a8 / +0x15ac /
# +0x15bc), each class init's call graph (depth 6) to the seven aura copies, its +0x15ac writers, and its vt+0x140 call sites.
import json, struct, sys, importlib.util
spec = importlib.util.spec_from_file_location('ha', 'hyperall.py'); src = open('hyperall.py', encoding='utf8').read()
src = src[:src.index('auraclass = json.load')]
ns = {'__name__': 'ha'}; sys.argv = ['x']; exec(compile(src, 'ha', 'exec'), ns)
ac = {}; exec(compile(open('auraclass.py', encoding='utf8').read().split('# the reader under unicorn')[0], 'ac', 'exec'), ac)
emu, i32 = ns['emu'], ns['i32']
for name, ctor, inits in (('base02', 0x3fb7f8, {'base02 0x3fb9bc': 0x3fb9bc, 'Zamtrios sp_02 0xf78788': 0xf78788}),
                          ('base04', 0x3ff080, {'Deviljho sp_04 0x3ff1a0': 0x3ff1a0}),
                          ('base55', 0x42c484, {'Deviljho sp_55 0x42c5cc': 0x42c5cc})):
    S, seen, err = emu(ctor)
    print(name, 'ctor', hex(ctor), '+0x15a8', i32(S, 0x15a8), '+0x15ac', S[0x15ac], '+0x15bc', i32(S, 0x15bc), 'ran 0x43a78c', 0x43a78c in seen, err)
    for k, a in inits.items():
        print('  ', k, 'reaches copies:', [ac['COPY'][h][0] for h in ac['reaches'](a)])
