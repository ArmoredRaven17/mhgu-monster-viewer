import sys, struct
import trace as TR
orig = TR.hook
def hook(uc, addr, size, ud):
    if addr == 0x7206c and not (TR.C_['lo'] <= addr < TR.C_['hi']):
        TR.ret(uc, 1); return
    return orig(uc, addr, size, ud)
TR.mu.hook_del if False else None
TR.mu = TR.mu
# rebind: unicorn keeps the original hook; patch the dispatch instead
TR.sc['timer'] = 1
