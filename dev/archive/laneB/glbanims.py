import json, struct, sys
def anims(path):
    b = open(path, 'rb').read()
    n = struct.unpack_from('<I', b, 12)[0]
    j = json.loads(b[20:20+n])
    return [a.get('name') for a in j.get('animations', [])]
if __name__ == '__main__':
    m = sys.argv[1]; pat = sys.argv[2:] 
    a = anims(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\models\monsters\%s.glb' % m)
    print(len(a), [x for x in a if not pat or any(p in x for p in pat)])
