# Compare the CLIP_EFFECTS em081_00 block before / after (every (motion, bit, efl, key, on) binding).
import re, sys
def block(path, mon='em081_00'):
    s = open(path, encoding='utf-8').read()
    i = s.index('export const CLIP_EFFECTS')
    j = s.index('\n  %s: {' % mon, i)
    k = s.index('\n  },', j)
    out = set()
    for m in re.finditer(r"'([^']+)': \{ frames: (\d+), bits: \[(.*?)\] \},?\n", s[j:k + 5]):
        for b in re.finditer(r"\{ bit: (\d+), efl: '([^']+)', key: (\d+), on: (\[\[.*?\]\]) \}", m.group(3)):
            out.add((m.group(1), int(b.group(1)), b.group(2), int(b.group(3)), b.group(4)))
    return out
a = block(sys.argv[1]); b = block(sys.argv[2])
print('before', len(a), 'after', len(b))
print('DROPPED:'); [print(' ', x) for x in sorted(a - b)]
print('ADDED:'); [print(' ', x) for x in sorted(b - a)]
