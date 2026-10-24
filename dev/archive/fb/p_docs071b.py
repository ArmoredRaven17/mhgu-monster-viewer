# p_docs071b.py (2026-10-19): Chaotic / Shagaru -- the spec's 2 / 3, rom-map rows, the engine doc, the board
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
p = D + r'\gore-line-shells-spec.md'
s = open(p, encoding='utf8').read()
s = s.replace("Status: **1. Gore Magala built** (below). 2. Chaotic and 3. Shagaru are to be done as deltas.",
              "Status: **built: 1. Gore Magala, 2. Chaotic Gore Magala, 3. Shagaru Magala** (2026-10-19).")
s = s.rstrip('\n') + '\n' + open('spec071b.md', encoding='utf8').read()
open(p, 'w', encoding='utf8').write(s)

p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| `0xfc333c` (-> `0xfc3384`) / `0xfc38b8(shell, k)` |"
i = s.index(a); j = s.index('\n', i)
rows = open('rows071b.md', encoding='utf8').read()
s = s[:j + 1] + rows + s[j + 1:]
a = "| tooling: `<scratchpad>\fb\gen071.py <mon>` / `ins071.py` / `mk071spec.py`; fb/gorepokes.json |"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + ("| tooling: `<scratchpad>\fb\ff071.py <mon> <variant> <counter> [em]` (env FB_RANKQ) / `mk071x.py <mon>` / `ins071b.py` / `armdiff.py` / `idsites.py` / `up.py`; emu_fb case stub `0x49710` | every call of the footfall helper 0xfb700c per action (joint, frame, x, z, its call site) with the class block's C+0x84 poked; the Chaotic / Shagaru checks; three reader arms side by side as (getter index -> field); every load of a class's id field with its mode store; a function's callers up the class band | -- | -- | controls: the rank-4 run makes no call (positive: rank 5); C+0x84 15000 none, 20000 one ((7, 0x1c) f65) |\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "base03's target arms (the Gore line's sp_03): a life from the target's distance, a turn toward it each move |"
assert s.count(a) == 1
s = s.replace(a, "base03's target arms (the Gore line's sp_03): a life from the target's distance, a turn toward it each move; base00's request arm (+0x15e8 0x10 / 0x20: the setup's point and words) |")
open(p, 'w', encoding='utf8').write(s)

p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "        em071_00c 30 / 31 are recorded (shell kind) and lifted.\n"
assert s.count(a) == 1
s = s.replace(a, a +
  "      - [x] 2026-10-19 -- CHAOTIC GORE MAGALA'S and SHAGARU MAGALA'S SHELLS (spec dev/gore-line-shells-spec.md 2 / 3): Gore's set plus\n"
  "        the falling balls (L4 M15 / M7) and what they leave on the ground, the lines at the hunter (L4 M1), Chaotic's L4 M30 row,\n"
  "        and the footfall dust on G-rank walks and turns (Shagaru always; Chaotic only with his counter at 20000 or more -- an input,\n"
  "        default 0, so it does not show yet). Checks 25/25 and 19/19; pages 4/4.\n"
  "      - [ ] (bug) Chaotic's and Shagaru's shells show nothing until recorded and lifted: em071_05u 0 / 1 / 10 / 11 / 60 / 61 / 90 / 91 /\n"
  "        120 / 121 / 123 / 150..154 / 180..182 / 210 / 220 / 230 / 300 (+ em071_00c 30 / 31); em072_00u 0 / 1 / 60 / 61 / 90 / 91 / 120 /\n"
  "        121 / 123 / 124 / 150..154 / 180..182 / 210 / 220 / 230, em072_00c 30 / 31.\n"
  "      - [ ] (idea) Chaotic Gore Magala's counter C+0x84 (his footfall dust from 20000): its writers (the per-frame 0xfae824..0xfaee44,\n"
  "        0xfadc58's 20000.0, the (7, 0x64) reset) are not transcribed -- the viewer takes it as input.gauge071 (default 0). Wire a\n"
  "        control or transcribe the counter.\n")
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')
