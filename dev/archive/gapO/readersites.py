# every beam reader's 0x4a23f4 call(s) and the store after it (reader = vt+0x14c from readermap.json); bounded by the
# reader's own pop {.., pc} / bx lr ends (the function's extent derived: first push to the matching return after the last branch)
import sys, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'gapN'))
import w
RM = json.load(open(r'C:\MHGU-Extract\efx\agents\basarios-scratch\shell02\readermap.json'))
for cls, v in RM.items():
    rd = int(next(iter(v.values()))['tags']['reader'], 16)
    L = w.dis(rd, 400)
    # extent: up to the next function's push (a push after a pop {...pc} / bx lr)
    end = None
    for k, l in enumerate(L[1:], 1):
        if ' push ' in l.replace('push    ', ' push ') and re.search(r'(pop\s+\{[^}]*pc\}|bx\s+lr)', L[k - 1]): end = k; break
    L = L[:end]
    sites = []
    for k, l in enumerate(L):
        if 'bl ' in l and '#0x4a23f4' in l:
            # the hit index argument and the store of r0 after
            arg = next((L[j] for j in range(k - 1, max(k - 6, 0), -1) if re.search(r'\bmov[sw]?\s+r1,', L[j])), None)
            st = next((L[j] for j in range(k + 1, min(k + 8, len(L))) if re.search(r'\bstr\s+r0,', L[j])), None)
            sites.append((l.split()[0], arg and ' '.join(arg.split()[1:]), st and ' '.join(st.split())))
    print(cls, hex(rd), 'len', len(L), sites)
