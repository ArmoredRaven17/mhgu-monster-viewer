import os, json
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
p = os.path.join(V, 'index.html')
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("""const DEFAULT_VIEW = new Proxy({}, { get: (_, id) =>
  (typeof id === 'string' ? (reviewFor(id) || {}).view : undefined) || undefined });""",
"""// EVERY MONSTER OPENS ON LIST 0, MOTION 1. Raven, 2026-10-17: "let's revert the default animation for each monster to L0,
// M1". The review's per-monster `view` entries (above) are kept in part-review.json as the record of those calls, and no
// longer pick the opening clip. Motion[1] itself, else its _loop piece, else its _start piece; a monster without an L0 M1
// opens on its first list's first clip, as before.
function openingView(id){
  const e = (MON.monsters || []).find(m => m.id === id);
  const l0 = e && (e.lists || []).find(l => String(l.id) === '0');
  const names = l0 ? (l0.clips || []).map(c => c.clip) : [];
  const clip = ['Motion[1]', 'Motion[1]_loop', 'Motion[1]_start'].find(n => names.includes(n));
  return clip ? { list: '0', clip } : undefined;
}
const DEFAULT_VIEW = new Proxy({}, { get: (_, id) => (typeof id === 'string' ? openingView(id) : undefined) });""")
rep("  if (!want) want = (reviewFor(e && e.id) || {}).view;\n",
    "  if (!want) want = DEFAULT_VIEW[e && e.id];             // where every monster opens: L0 M1 (openingView)\n")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

q = os.path.join(V, 'part-review.json')
t = open(q, encoding='utf-8', newline='').read()
a = "a mismatched pair cannot drop the monster onto a clip from the wrong list.\""
assert t.count(a) == 1
t = t.replace(a, "a mismatched pair cannot drop the monster onto a clip from the wrong list. NO LONGER USED FOR THE OPENING VIEW since 2026-10-17 (Raven: \\\"let's revert the default animation for each monster to L0, M1\\\"): index.html openingView opens every monster on List 0 Motion[1]; these entries stay as the record of the earlier calls.\"")
json.loads(t)
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)
print('ok')
