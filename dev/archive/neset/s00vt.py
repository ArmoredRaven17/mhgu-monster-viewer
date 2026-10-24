import sys, json
sys.argv = ['x', 's00.json', 's00_tmp.json']
exec(open('rkrun.py').read().replace("json.dump(out, open(out_path, 'w'))", "print('VT', hex(F.r32(F.SHELL)))"))
