import ast, sys
for tag in sys.argv[1:]:
  print('==', tag)
  for f in ['cen11_%s_%s.txt' % (tag, c) for c in 'abc']:
    try: L = open(f).readlines()
    except Exception: continue
    for l in L:
      v, a, rest = l.split(' ', 2)
      i = rest.index('{'); mots = rest[:i]; d = ast.literal_eval(rest[i:])
      ks = sorted(set(k.rsplit(' ', 1)[0] for k in d if 'fALL' not in k)) or sorted(set(k.rsplit(' ', 1)[0] + ' ' + str(v2[0]) for k, v2 in d.items()))
      print(a, mots.strip(), ks)
