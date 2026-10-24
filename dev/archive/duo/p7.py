p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8').read()
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
# the Special list leaves the duo animations to the combined list
rep("""  const clips = [];
  for (const an of anims){
    // the chain with its loop cycles (render/monster.js piecesOf: an entry's `loops`)
    const pieces = piecesOf(an).map(([lid, cn, blend]) => {""", """  const clips = [];
  for (const an of anims){
    if (an.duo) continue;                // a duo animation lives on the combined list (ROM_PARTNER_BODY partnerList)
    // the chain with its loop cycles (render/monster.js piecesOf: an entry's `loops`)
    const pieces = piecesOf(an).map(([lid, cn, blend]) => {""")
# the combined list
a = s.index("// A PARTNER'S OWN LIST (render/monster.js ROM_PARTNER_BODY `partnerList`, Seltas on the Queen)")
b = s.index("// Part NAMES, built by build-part-names.py.")
s = s[:a] + r"""// THE COMBINED LIST (render/monster.js ROM_PARTNER_BODY `partnerList`; Raven, 2026-10-17: "leave Queen's raw animations
// uncombined in case people want to see them"). Her raw lists play her alone; this one list holds every animation the
// ROM plays with him on her, in four groups, in this order: (1) her required clips ('Queen L4 Motion[6]', `her`: the
// clip of hers it plays; he plays its ROM pair), (2) the joined duo animations (`pieces`, ROM_ANIMATIONS `duo`), (3) his
// clips no clip of hers leads ('Seltas Motion[31]', `his` / `body` / `hisSeq`), (4) her `both` clips with him free
// ('... + Seltas free'). The list's `file` is her list 4's, which her pose driver needs for its proxy.
for (const m of MON.monsters){
  const spec = partnerBodyOf(m.id), pl = spec && spec.partnerList;
  if (!pl || (m.lists || []).some(l => l.id === pl.id)) continue;
  const pm = MON.monsters.find(x => x.id === spec.monster);
  const his = pm && (pm.lists || []).find(l => String(l.id) === String(pl.from));
  const herList = (m.lists || []).find(l => String(l.id) === String(spec.list));
  if (!his || !herList){ noteError('partner list ' + pl.id + ': a list is missing'); continue; }
  const req = [], joined = [], hisClips = [], free = [];
  const unresolved = new Set(spec.unresolved || []);
  for (const lid of pl.herLists || []){
    const hl = (m.lists || []).find(l => String(l.id) === String(lid));
    for (const c of (hl && hl.clips) || []){
      const bare = String(lid) + '|' + c.clip.replace(/_(start|loop)$/, '');
      const k = partnerClassOf(spec, lid, c.clip);
      if (k === 'combined') req.push({ clip: 'Queen L' + lid + ' ' + c.clip, dur: c.dur, her: { list: lid, clip: c.clip }, group: 'required' });
      else if (k === 'both' && !unresolved.has(bare))
        free.push({ clip: 'Queen L' + lid + ' ' + c.clip + ' + Seltas free', dur: c.dur, her: { list: lid, clip: c.clip }, group: 'free' });
    }
  }
  for (const an of romAnimationsOf(m.id)){
    if (!an.duo) continue;
    const pieces = piecesOf(an).map(([lid, cn, blend]) => {
      const l = (m.lists || []).find(x => String(x.id) === String(lid));
      const c = l && (l.clips || []).find(x => x.clip === cn);
      return c ? { list: l, clip: cn, dur: c.dur, blend: blend || 0 } : null;
    });
    if (pieces.some(p => !p)){ noteError('duo animation ' + an.name + ': a piece is missing'); continue; }
    joined.push({ clip: an.name, dur: pieces.reduce((t, p) => t + p.dur, 0), pieces, group: 'joined' });
  }
  for (const [name, ent] of Object.entries(pl.clips)){
    // an entry is [her clips] for his clip of that name, or { his, body, hisSeq } where his side is several clips
    const hc = Array.isArray(ent) ? name : ent.his, body = Array.isArray(ent) ? ent : ent.body;
    const c = (his.clips || []).find(x => x.clip === hc);
    if (!c){ noteError('partner list ' + pl.id + ': his ' + hc + ' is missing'); continue; }
    hisClips.push({ clip: pl.prefix + name, his: hc, dur: c.dur, body, hisSeq: Array.isArray(ent) ? null : ent.hisSeq || null, group: 'his' });
  }
  const clips = [...req, ...joined, ...hisClips, ...free];
  if (clips.length) m.lists.push({ id: pl.id, label: pl.label, file: herList.file, clips, partner: true,
                                   groups: { required: req.length, joined: joined.length, his: hisClips.length, free: free.length } });
}
""" + s[b:]
# body clip in play()
rep("""              : l.partner ? await partnerListBodyClip(e, l, c)""", """              : l.partner ? (c.her ? await clipFor((e.lists || []).find(x => String(x.id) === String(c.her.list)), c.her.clip, e.glb)
                             : c.pieces ? await sequenceClipFor(c, e.glb) : await partnerListBodyClip(e, l, c))""")
# class / wanted: only the combined list mounts him
rep("""function partnerWanted(e, l, c){
  const k = partnerClassAt(e, l, c);
  return k === 'combined' ? true : (k === 'solo' || k === 'release') ? false : !!partnerOn[e.id];
}""", """// HE IS ON HER ONLY ON THE COMBINED LIST (Raven, 2026-10-17): her raw lists play her alone
function partnerWanted(e, l, c){ return !!(l && l.partner && c); }""")
# his pick for a her-led / joined entry of the combined list
rep("""  if (l && l.partner){
    const pl = ((a.part && a.part.lists) || []).find(x => String(x.id) === String(a.spec.partnerList.from));""", """  // a combined-list entry that is a clip of hers: his ROM pair for that clip, exactly as before (or his own logic)
  if (l && l.partner && c.her){
    const e = entry(), hl = e && (e.lists || []).find(x => String(x.id) === String(c.her.list));
    const hc = hl && (hl.clips || []).find(x => x.clip === c.her.clip);
    return hl && hc ? partnerClipOf(a, hl, hc) : null;
  }
  if (l && l.partner && !c.pieces){
    const pl = ((a.part && a.part.lists) || []).find(x => String(x.id) === String(a.spec.partnerList.from));""")
# no Off / Combined row any more
rep("""  buildPartnerRow(e);
""", """  // (the Seltas Off / Combined row is gone: the combined list replaces it -- partnerWanted)
""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
