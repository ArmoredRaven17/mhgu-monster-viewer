import os, json
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
p = os.path.join(V, 'index.html')
s = open(p, encoding='utf-8', newline='').read()
a = """// EVERY MONSTER OPENS ON LIST 0, MOTION 1. Raven, 2026-10-17: "let's revert the default animation for each monster to L0,
// M1". The review's per-monster `view` entries (above) are kept in part-review.json as the record of those calls, and no
// longer pick the opening clip. Motion[1] itself, else its _loop piece, else its _start piece; a monster without an L0 M1
// opens on its first list's first clip, as before.
function openingView(id){
  const e = (MON.monsters || []).find(m => m.id === id);"""
b = """// EVERY MONSTER OPENS ON LIST 0, MOTION 1. Raven, 2026-10-17: "let's revert the default animation for each monster to L0,
// M1". The review's per-monster `view` entries (above) are kept in part-review.json as the record of those calls, and no
// longer pick the opening clip. Motion[1] itself, else its _loop piece, else its _start piece; a monster without an L0 M1
// opens on its first list's first clip, as before.
// THE NEW BASELINE'S EXCEPTIONS are part-review `opening: {list, clip}` -- Raven's calls made from here on ("Update Tigrex
// to use L0, M25 as its default; I will be making adjusts", 2026-10-17), `clip` as the motion (Motion[25]) or a piece of
// it (Motion[25]_loop), resolved the same way. Kept apart from the old `view` so the two sets of calls never mix.
function openingView(id){
  const e = (MON.monsters || []).find(m => m.id === id);
  const want = (reviewFor(id) || {}).opening;
  if (want && e){
    const l = (e.lists || []).find(x => String(x.id) === String(want.list));
    const names = l ? (l.clips || []).map(c => c.clip) : [];
    const base = String(want.clip).replace(/_(start|loop)$/, '');
    const clip = [want.clip, base, base + '_loop', base + '_start'].find(n => names.includes(n));
    if (clip) return { list: String(want.list), clip };
    console.warn('part-review: ' + id + ' opening names ' + want.list + '|' + want.clip + ', which this monster does not have');
  }"""
assert s.count(a) == 1
s = s.replace(a, b)
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

q = os.path.join(V, 'part-review.json')
t = open(q, encoding='utf-8', newline='').read()
a2 = ' "em032_00": {\n  "reviewed": "2026-09-10",\n'
nl = '\r\n' if '\r\n' in t[:2000] else '\n'
a2 = a2.replace('\n', nl)
assert t.count(a2) == 1, t.count(a2)
t = t.replace(a2, a2 + ('  "opening": { "list": "0", "clip": "Motion[25]" },' + nl))
json.loads(t)
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)
print('ok')
