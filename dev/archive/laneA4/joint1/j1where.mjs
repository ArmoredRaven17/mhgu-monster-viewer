// laneA4/joint1/j1where.mjs (lane A4, 2026-10-25): WHERE each joint -1 clip record starts under both rules, without running the
// effects: every clip CLIP_EFFECTS names a joint -1 clip record on (payload +0x32 == -1, when 'clip') is scrubbed to each of the
// record's bit rises (the first frame of each `on` run, up to 3), with the viewer's own frame loop run once at that time (the clock
// at 0: the ground lock, the air height and the travel applied as the page applies them). At each: the gid-0 bone's world position
// (live.js unitMatrix's anchor as shipped), __view.unitGamePos() (P+0x40, the ROM's model +0xb0 / +0x40 for joint -1), the mounted
// root (laneA3 noOrigin) and the viewer's ground-ray floor (rockInput().floorY), all in game units.
// DBG env: { "ids": ["em083_00", ...] }
async function where(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), SK = await import('/render/skeleton.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  const j1 = hex => { const b = parseInt(hex.substr(100, 2), 16) | (parseInt(hex.substr(102, 2), 16) << 8); return (b << 16) >> 16; };
  const u8 = (hex, o) => parseInt(hex.substr(2 * o, 2), 16);
  const r1 = v => Math.round(v * 10) / 10;
  const base = c => String(c).replace(/#.*$/, '').replace(/_(start|loop)$/, '');
  for (const MON of P.ids){ try {
    const t0 = performance.now();
    V.pose.clock.getDelta = () => 1 / 60;
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange(); await frames(5);
    const root = V.mounted.main;
    const g0 = (SK.gidBonesOf(root).find(b => b.gid === 0) || {}).node || null;
    const def = await fetch('/effects/' + MON + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
    const univ = new Map(), eflKey = new Map();
    for (const e of (def && def.effects) || []){
      const r = e.record;
      if (!r || !r.payload || e.when !== 'clip' || j1(r.payload) !== -1) continue;
      const pk = r.pel + '|' + r.key;
      univ.set(pk, { sh: u8(r.payload, 0x40), r52: u8(r.payload, 0x52), space: u8(r.payload, 0x38), s: [] });
      eflKey.set(String(e.efl || '').replace(/^files\//, '').replace(/\.efl$/, '') + '|' + r.key, pk);
    }
    const ent = V.MON.monsters.find(e => e.id === MON);
    const lists = new Map((ent.lists || []).map(l => [String(l.id), l]));
    V.state.loop = false;
    const pos = n => { if (!n) return null; n.updateWorldMatrix(true, false); const e = n.matrixWorld.elements; return [r1(e[12] * 100), r1(e[13] * 100), r1(e[14] * 100)]; };
    let samples = 0;
    for (const [k, v] of Object.entries((M.CLIP_EFFECTS || {})[MON] || {})){
      const m = /^L(\S+) (.+)$/.exec(k); if (!m) continue;
      const want = [];
      for (const b of (v && v.bits) || []){
        const pk = eflKey.get(String(b.efl).replace(/\.efl$/, '') + '|' + b.key);
        if (!pk) continue;
        for (const [a] of (b.on || []).slice(0, 3)) want.push([a, pk]);
      }
      if (!want.length || !lists.has(m[1])) continue;
      if (V.state.list !== m[1]){ listSel.value = m[1]; await listSel.onchange(); await frames(2); }
      // the clip's pieces: a split motion's _loop starts after its _start (CLIP_EFFECTS frames run over the whole motion)
      const L = lists.get(m[1]);
      const pieces = L.clips.filter(c => base(c.clip) === base(m[2]) && !/#/.test(c.clip));
      want.sort((x, y) => x[0] - y[0]);
      for (const [f, pk] of want){
        let at = 0, piece = null;
        for (const c of pieces){ const n = Math.round(c.dur * 60); if (f < at + n){ piece = c; break; } at += n; }
        if (!piece) piece = pieces[pieces.length - 1];
        if (!piece) continue;
        const o = [...clipSel.options].find(x => x.value === piece.clip);
        if (!o) continue;
        if (!V.pose.action || V.pose.action.getClip().name !== piece.clip){
          V.pose.clock.getDelta = () => 1 / 60;
          clipSel.value = o.value; await clipSel.onchange();
          await until(() => V.pose.action && V.pose.action.getClip().name === piece.clip, 60);
        }
        // play (not scrub) up to the frame: the travel and the world shifts the page applies on the way
        V.pose.clock.getDelta = () => 1 / 60;
        await until(() => V.pose.action && Math.round(V.pose.action.time * 60) >= f - at, Math.max(5, f - at + 30));
        V.pose.clock.getDelta = () => 0;
        await frames(1);
        const ri = V.rockInput ? V.rockInput() : null;
        const u = univ.get(pk);
        if (u.s.length < 3) u.s.push({ clip: m[1] + '|' + m[2], f, at: Math.round(V.pose.action.time * 60) + at, gid0: pos(g0), unit: V.unitGamePos().map(r1), root: pos(root),
                                       floor: ri && Number.isFinite(ri.floorY) ? r1(ri.floorY) : null });
        samples++;
      }
    }
    V.pose.clock.getDelta = () => 1 / 60;
    out.push([true, 'WHERE ' + MON, JSON.stringify({ secs: Math.round((performance.now() - t0) / 1000), samples, recs: [...univ].map(([pk, u]) => [pk, u.sh, u.r52, u.space, u.s]) })]);
  } catch (e){ out.push([false, 'WHERE ' + MON, JSON.stringify({ error: String(e && e.stack || e).slice(0, 400) })]); } }
  return out;
}
export const pageCheck = where;
export const args = [[(typeof process !== 'undefined' && process.env.DBG) || '{}']];
