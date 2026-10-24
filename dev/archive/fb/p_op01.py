D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
old = [l for l in s.split('\n') if l.startswith('| em012_00_cmdtbl.emc op 01 `(05, 08, n)`')]
assert len(old) == 1
new = ("| em012_00_cmdtbl.emc op `01 s k t n` (handler `0x83cf8` -> `0x86210`) / op `5a a b` (`0x84374`) / op `5b` (`0x84394`) | **op 01 is NOT "
       "a test (2026-10-18)**: it SETS target slot s to (kind k, type t, param n) through `0xc6d58(e, k, t, n, s)` -- P+0x230+s kind, "
       "+0x232+s type, +0x234+s param, the point at P+0x1d0 + 16 s (`0xc4aec` resolves kinds 5 with types in 0x3fc0f / 0xfd at once; "
       "type 8 is not among them and its point is resolved elsewhere: NOT FOUND). Lao's streams set slot 0 / 1 to (5, 8, n), n = 1..0x12 "
       "in order: his walk goal along the fortress. THE SECTION is the EMC variable **e+0x7305** (op 5a a b: e[0x7305 + a] = b; op 5b a "
       "switches on it), set to the next section inside each section's body -- an in-stream state machine, not a test of the stage. The "
       "goal point needs the stage's navigation (type 8's resolver): not in the viewer | uEm012_00 / shared | R (ops) / NOT FOUND (type 8's "
       "point) | elder spec 2 |")
s = s.replace(old[0], new)
a = "### Withdrawn — kept so they are not rediscovered"
i = s.index(a)
# the first table row after the header
j = s.index('\n| ', i)
j = s.index('\n', s.index('\n|---', j) + 1) if '\n|---' in s[j:j + 400] else j
wd = ("| rom-map Lao row / elder spec 2 (2026-10-18, this lane): \"the section is chosen by op 01 (05, 08, n) tests -- the variable they "
      "read is NOT READ\" | op 01 is no test: `0x86210` ends in `0xc6d58(e, 5, 8, n, slot)`, the target-slot writer (the descriptor's "
      "5 argument bytes read as a block op's mode + 3) | op 01 SETS target slot s to (5, 8, n), his walk goal; the section is EMC "
      "variable e+0x7305 (ops 5a / 5b), advanced in the stream (rom-map op-01 row) |\n")
s = s[:j + 1] + wd + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
a = """  stream. The section is chosen by op 01 (05, 08, n) tests (`01 00 05 08 03` .. `01 01 05 08 12` around the op 0xa3s); the variable
  they read is NOT READ, so his position in each section is not known."""
b = """  stream. The section is the EMC variable e+0x7305 (op 5a a b sets e[0x7305 + a] = b, op 5b switches on it), stepped on inside each
  section's body: an in-stream state machine, so the sections run in order 0, 1, 2 .. (the viewer could play them as the stream
  orders them). Inside, op `01 s 05 08 n` is NOT a test (corrected 2026-10-18, rom-map Withdrawn): it SETS target slot s to (kind 5,
  type 8, param n) through 0xc6d58 -- his walk goal, n = 1..0x12 in order. Where goal n is: type 8's point is resolved outside
  0xc6d58 (0xc4aec resolves other kind-5 types at once) -- NOT FOUND; it is the stage's navigation, which the viewer does not have.
  So his position per section is the walk toward goal n, not a number the viewer holds."""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
