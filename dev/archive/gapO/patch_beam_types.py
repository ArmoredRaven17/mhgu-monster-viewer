# patch_beam_types.py (gapO, 2026-10-22) -- ADD "folder" and "hit" to every entry of docs/render/beam-types.js (BEAM_TYPES and
# BEAM_MODES), inserted right after the entry's "cls": "..." field; every other byte kept (line endings as the file has them).
#   python patch_beam_types.py [in.js] [out.js]
#     in  default C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\beam-types.js (read only)
#     out default beam-types.patched.js beside this script
# The values are the ROM reads of gapO RESULT.md (beamreads.py -> beamreads.json):
#   folder = the .shl path's folder, from the shell id the monster's beam spawn writes to the setup +4 (dev/beams/<mon>.md) ->
#            the shell table 0x175c3e8 row's res (0x48b79c -> 0x152530) -> 0x159daa0[res] = ~crc32 of the lowercase path;
#   hit    = the mode's HitParam FUP ints (ShellInfoList[mode] +0x10, the .shl's own entry -- not the mode number), whose
#            int 0 every beam reader stores to +0x1654 through 0x4a23f4 and base02 registers as slot 0 (0x3fbab0).
# Refuses (exits non-zero, writes nothing) on an entry it has no read for, an entry that already has "folder" / "hit", or
# an entry whose "cls" field is not found exactly once.
import sys, os, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\beam-types.js'
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'beam-types.patched.js')
READ = {   # id -> (folder, HitParam ints)
    "em004_00:1": ("shell\\em\\em004_00_shell02", [0]),
    "em005_00:1": ("shell\\em\\em005_00_shell02", [1]),
    "em005_00:2": ("shell\\em\\em005_00_shell02", [2]),
    "em005_00:3": ("shell\\em\\em005_00_shell02", [1]),
    "em005_00:5": ("shell\\em\\em005_00_shell02", [3]),
    "em005_00:6": ("shell\\em\\em005_00_shell02", [4]),
    "em005_00:7": ("shell\\em\\em005_00_shell02", [3]),
    "em005_00:8": ("shell\\em\\em005_00_shell02", [1]),
    "em005_00:9": ("shell\\em\\em005_00_shell02", [3]),
    "em005_00:10": ("shell\\em\\em005_00_shell02", [1]),
    "em005_00:11": ("shell\\em\\em005_00_shell02", [3]),
    "em010_00:0": ("shell\\em\\em010_00_shell02", [0]),
    "em010_00:1": ("shell\\em\\em010_00_shell02", [1]),
    "em010_00:2": ("shell\\em\\em010_00_shell02", [2]),
    "em010_00:3": ("shell\\em\\em010_00_shell02", [3]),
    "em010_00:4": ("shell\\em\\em010_00_shell02", [0]),
    "em010_00:5": ("shell\\em\\em010_00_shell02", [1]),
    "em010_00:6": ("shell\\em\\em010_00_shell02", [1]),
    "em010_00:9": ("shell\\em\\em010_00_shell02", [1]),
    "em010_00:10": ("shell\\em\\em010_00_shell02", [1]),
    "em010_00:13": ("shell\\em\\em010_00_shell02", [0]),
    "em010_00:15": ("shell\\em\\em010_00_shell02", [4]),
    "em010_00:16": ("shell\\em\\em010_00_shell02", [5]),
    "em010_00:17": ("shell\\em\\em010_00_shell02", [6]),
    "em010_00:18": ("shell\\em\\em010_00_shell02", [7]),
    "em010_00:19": ("shell\\em\\em010_00_shell02", [4]),
    "em010_00:20": ("shell\\em\\em010_00_shell02", [5]),
    "em010_00:21": ("shell\\em\\em010_00_shell02", [5]),
    "em010_00:24": ("shell\\em\\em010_00_shell02", [5]),
    "em010_00:25": ("shell\\em\\em010_00_shell02", [5]),
    "em010_00:28": ("shell\\em\\em010_00_shell02", [4]),
    "em013_00:0": ("shell\\em\\em013_00_shell02", [0]),
    "em013_01:0": ("shell\\em\\em013_01_shell02", [0]),
    "em019_00:0": ("shell\\em\\em019_00_shell02", [0]),
    "em019_00:1": ("shell\\em\\em019_00_shell02", [0]),
    "em019_04:0": ("shell\\em\\em019_04_shell02", [1]),
    "em020_00:4": ("shell\\em\\em020_00_shell02", [0]),
    "em020_04:0": ("shell\\em\\em020_04_shell02", [0]),
    "em020_04:1": ("shell\\em\\em020_04_shell02", [1]),
    "em020_04:2": ("shell\\em\\em020_04_shell02", [2]),
    "em020_04:3": ("shell\\em\\em020_04_shell02", [3]),
    "em023_00:0": ("shell\\em\\em023_00_shell02", [0]),
    "em023_00:1": ("shell\\em\\em023_00_shell02", [1]),
    "em023_00:2": ("shell\\em\\em023_00_shell02", [2]),
    "em023_05:0": ("shell\\em\\em023_05_shell02", [0]),
    "em023_05:1": ("shell\\em\\em023_05_shell02", [1]),
    "em023_05:2": ("shell\\em\\em023_05_shell02", [2]),
    "em024_00:0": ("shell\\em\\em024_00_shell02", [0]),
    "em024_00:1": ("shell\\em\\em024_00_shell02", [1]),
    "em033_00:1": ("shell\\em\\em033_00_shell02", [1]),
    "em033_00:3": ("shell\\em\\em033_00_shell02", [3]),
    "em033_00:5": ("shell\\em\\em033_00_shell02", [5]),
    "em033_00:6": ("shell\\em\\em033_00_shell02", [5]),
    "em038_00:0": ("shell\\em\\em038_00_shell02", [0]),
    "em038_00:1": ("shell\\em\\em038_00_shell02", [0]),
    "em038_00:2": ("shell\\em\\em038_00_shell02", [0]),
    "em038_00:3": ("shell\\em\\em038_00_shell02", [1]),
    "em038_00:4": ("shell\\em\\em038_00_shell02", [1]),
    "em038_00:5": ("shell\\em\\em038_00_shell02", [2]),
    "em038_00:6": ("shell\\em\\em038_00_shell02", [2]),
    "em038_00:7": ("shell\\em\\em038_00_shell02", [2]),
    "em049_00:0": ("shell\\em\\em049_00_shell02", [0]),
    "em049_00:1": ("shell\\em\\em049_00_shell02", [1]),
    "em049_00:2": ("shell\\em\\em049_00_shell02", [2]),
    "em049_00:3": ("shell\\em\\em049_00_shell02", [3]),
    "em049_00:5": ("shell\\em\\em049_00_shell02", [0]),
    "em049_00:6": ("shell\\em\\em049_00_shell02", [0]),
    "em049_00:9": ("shell\\em\\em049_00_shell02", [0]),
    "em050_00:0": ("shell\\em\\em050_00_shell02", [0]),
    "em056_00:0": ("shell\\em\\em056_00_shell02", [0]),
    "em056_00:1": ("shell\\em\\em056_00_shell02", [1]),
    "em058_00:0": ("shell\\em\\em058_00_shell02", [0]),
    "em058_00:1": ("shell\\em\\em058_00_shell02", [0]),
    "em067_00:0": ("shell\\em\\em067_00_shell02", [0]),
    "em067_00:1": ("shell\\em\\em067_00_shell02", [0]),
    "em081_04:4": ("shell\\em\\em081_04_shell02", [0]),
    "em081_04:5": ("shell\\em\\em081_04_shell02", [0]),
    "em081_04:7": ("shell\\em\\em081_04_shell02", [0]),
    "em081_04:8": ("shell\\em\\em081_04_shell02", [0]),
    "em082_00:0": ("shell\\em\\em082_00_shell02", [0]),
    "em082_00:1": ("shell\\em\\em082_00_shell02", [1]),
    "em082_00:2": ("shell\\em\\em082_00_shell02", [0]),
    "em082_04:10": ("shell\\em\\em082_04_shell02", [2]),
    "em082_04:11": ("shell\\em\\em082_04_shell02", [3]),
    "em082_04:12": ("shell\\em\\em082_04_shell02", [2]),
    "em084_00:0": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:1": ("shell\\em\\em084_00_shell02", [1]),
    "em084_00:2": ("shell\\em\\em084_00_shell02", [1]),
    "em084_00:3": ("shell\\em\\em084_00_shell02", [4]),
    "em084_00:4": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:5": ("shell\\em\\em084_00_shell02", [3]),
    "em084_00:6": ("shell\\em\\em084_00_shell02", [3]),
    "em084_00:7": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:8": ("shell\\em\\em084_00_shell02", [1]),
    "em084_00:9": ("shell\\em\\em084_00_shell02", [1]),
    "em084_00:10": ("shell\\em\\em084_00_shell02", [4]),
    "em084_00:11": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:14": ("shell\\em\\em084_00_shell02", [2]),
    "em084_00:20": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:21": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:25": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:26": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:30": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:31": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:36": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:37": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:50": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:51": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:52": ("shell\\em\\em084_00_shell02", [4]),
    "em084_00:53": ("shell\\em\\em084_00_shell02", [4]),
    "em084_00:54": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:55": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:56": ("shell\\em\\em084_00_shell02", [1]),
    "em084_00:57": ("shell\\em\\em084_00_shell02", [1]),
    "em084_00:58": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:59": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:60": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:61": ("shell\\em\\em084_00_shell02", [0]),
    "em084_00:62": ("shell\\em\\em084_00_shell02", [5]),
    "em084_00:63": ("shell\\em\\em084_00_shell02", [5]),
}

def main():
    raw = open(SRC, 'rb').read()
    text = raw.decode('utf-8')
    lines = text.splitlines(keepends=True)
    n = 0
    for k, line in enumerate(lines):
        body = line.rstrip('\r\n')
        if not body.startswith('  {"id": '): continue
        e = json.loads(body.strip().rstrip(','))
        if 'folder' in e or 'hit' in e: sys.exit('refused: %s already has folder / hit' % e['id'])
        if e['id'] not in READ: sys.exit('refused: no read for %s' % e['id'])
        folder, hit = READ[e['id']]
        anchor = '"cls": ' + json.dumps(e['cls'])
        if body.count(anchor) != 1: sys.exit('refused: %s: the cls field found %d times' % (e['id'], body.count(anchor)))
        i = body.index(anchor) + len(anchor)
        ins = ', "folder": ' + json.dumps(folder) + ', "hit": ' + json.dumps(hit)
        lines[k] = line[:i] + ins + line[i:]
        n += 1
    out = ''.join(lines).encode('utf-8')
    # every byte outside the insertions is the input's
    assert re.sub(rb', "folder": "[^"]*", "hit": \[[^\]]*\]', b'', out) == raw, 'bytes outside the insertions changed'
    open(OUT, 'wb').write(out)
    print('%d entries patched -> %s' % (n, OUT))

if __name__ == '__main__':
    main()
