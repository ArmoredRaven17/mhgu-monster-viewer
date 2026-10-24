import os, json, re
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')
p = 'docs/part-review.json'
b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
start = s.index('"em080_04": {')
end = s.index('\n }', start)          # the end of the em080_04 object (one-space indent at the top level)
blk = s[start:end]
n0 = len(blk)
removed = []
for name in ('Intact (Cooled)', 'Cracked (Cooled)', 'Severed (Cooled)'):
    i = blk.index('"name": "%s"' % name)
    a = blk.rindex('{', 0, i)          # the item's opening brace
    # the item's closing brace: the first '}' at the item's own depth
    depth = 0; j = a
    while True:
        c = blk[j]
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: break
        j += 1
    # remove the item and one adjoining comma
    if blk[j + 1:j + 2] == ',':
        cut = (a, j + 2)
        k = cut[1]
        while blk[k] in ' \n': k += 1
        cut = (a, k)
    else:
        k = a - 1
        while blk[k] in ' \n': k -= 1
        assert blk[k] == ','
        cut = (k, j + 1)
    removed.append(blk[cut[0]:cut[1]][:60])
    blk = blk[:cut[0]] + blk[cut[1]:]
s = s[:start] + blk + s[end:]
d = json.loads(s)
for rk, r in d['em080_04']['rows'].items():
    if r.get('name') == 'Tail':
        print(rk, [x['name'] for x in r['synth']], 'default:', r.get('default'))
        # the note: append why
        r_note_key = rk
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))
print('removed', len(removed))
