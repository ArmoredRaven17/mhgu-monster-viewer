// kushwind/kwnodes.mjs (2026-10-27): the held aura's node instances (uEffect +0x1f4, 0x130 each): the joint each hangs from (+0x8c),
// transform mode (+0x10c bits 16..19), local position (+0x80), world translation (+0x30), and the attach matrix the parent gives
// (0x939278 via owner +0x30) -- L0 M1, Wind Aura level N, under the shipped joint rule or 'unit'
async function kwNodes(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  const mon = 'em024_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  const r0 = v => Math.round(v), r2 = v => Math.round(v * 100) / 100;
  for (const level of (P.levels || [1, 2, 3])){
    if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
    monSel.value = mon; await monSel.onchange(); await frames(5);
    const cs = $('monClassCtl'); cs.value = String(level); cs.dispatchEvent(new Event('change'));
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
    if (V.state.list !== '0'){ listSel.value = '0'; await listSel.onchange(); }
    clipSel.value = 'Motion[1]_loop'; await clipSel.onchange();
    await frames(P.frames || 60);
    const rt = M.effectRuntimeInstance(), sch = rt.schedule, m = sch.host.m;
    const res = [];
    for (const e of sch.entries) if (e.def.record && e.def.record.pel === 'em024_00u' && [0, 1, 10].includes(e.def.record.key))
      for (const q of e.requests) if (!q.stopped) for (const u of q.effects()){
        const n = m.u16(u + 0x1e4), base = m.u32(u + 0x1f4), nodes = [];
        const own = [0x120, 0x130, 0x140, 0x150].map(o => [0, 4, 8].map(k => r2(m.f32(u + o + k))));
        for (let i = 0; i < Math.min(n, 24); i++){
          const inst = base + i * 0x130;
          nodes.push({ i, j: m.u32(inst + 0x8c) | 0, mode: (m.u32(inst + 0x10c) >>> 16) & 0xf, f110: (m.u32(inst + 0x110) >>> 0).toString(16),
                       local: [0x80, 0x84, 0x88].map(o => r0(m.f32(inst + o))), world: [0x30, 0x34, 0x38].map(o => r0(m.f32(inst + o))),
                       xrow: [0, 4, 8].map(o => r2(m.f32(inst + o))), yrow: [0x10, 0x14, 0x18].map(o => r2(m.f32(inst + o))), zrow: [0x20, 0x24, 0x28].map(o => r2(m.f32(inst + o))) });
        }
        // the model particles (host.js sceneModelDraws' walk): each generator's particle list, the model record's +0x40 position,
        // +0x50 quaternion, +0x60 scale -- where the drawn meshes are
        // each generator (owner +0x1f0 list, +0xc next): its param (gen +0x34) words +0x100 / +0x10c and floats +0x110 (the draw's
        // view-ray push, 0xa933dc) and the base block's +0x70 / +0x78 (gen +0x30 node? read raw), and its particles' position buffers
        // (particle +0x20 / +0x30, the model draw's sp+0xa0 source 0xa9315c)
        const parts = [];
        for (let g = m.u32(u + 0x1f0) >>> 0, gi = 0; g && gi < 32; g = m.u32(g + 0xc) >>> 0, gi++){
          const par = m.u32(g + 0x34) >>> 0, ps = [];
          for (let p = m.u32(g + 0xb0) >>> 0, k = 0; p && k < 4; p = m.u32(p + 4) >>> 0, k++)
            ps.push([0x20, 0x24, 0x28, 0x30, 0x34, 0x38].map(o => r0(m.f32(p + o))));
          parts.push({ g: gi, w100: (m.u32(par + 0x100) >>> 0).toString(16), w10c: (m.u32(par + 0x10c) >>> 0).toString(16), f110: r0(m.f32(par + 0x110)),
                       fc: r2(m.f32(g + 0xfc)), ps });
        }
        // the recompose's inputs (0x327188 -> 0x31d16c): +0x320 scale, +0x330 position, +0x340 / +0x350 the two angle vectors, +0x360
        const ins = [0x320, 0x330, 0x340, 0x350, 0x360].map(o => [0, 4, 8, 12].map(k => Math.round(m.f32(u + o + k) * 1000) / 1000));
        const quat = [0x50, 0x54, 0x58, 0x5c].map(o => Math.round(m.f32(u + o) * 1000) / 1000);
        parts.push({ ins, quat });
        const par = m.u32(u + 0x30);
        res.push({ key: e.def.record.key, parent: par, j34: m.u32(u + 0x34) | 0, f114: (m.u32(u + 0x114) >>> 0).toString(16), f118: (m.u32(u + 0x118) >>> 0).toString(16),
                   pos: [0x40, 0x44, 0x48].map(o => r0(m.f32(u + o))), own, nodes, n, parts });
      }
    // the model draws this render submits (host.js drawFrame -> modeldraw.js drawMesh: CBWorld rows, game units), u 10 / 0 / 1 only
    const sch0 = sch.effects; const want = res.map(r => r.key);
    sch.effects = function(){ return this.entries.flatMap(e => (e.def.record && e.def.record.pel === 'em024_00u' && want.includes(e.def.record.key)) ? e.requests.flatMap(q => q.effects()) : []); };
    V.pose.clock.getDelta = () => 0; await frames(1); V.renderer.render(V.scene, V.camera);
    // each draw's world-space box: its mesh's vertices (live.js meshOf, the geometry syncModels draws) through CBWorld
    const box = d => { const short = String(d.model).split(String.fromCharCode(92)).pop(), sc = rt.glb(short), src = sc && rt.meshOf(sc, d.model, d.meshIndex);
      if (!src) return null; const P = src.geometry.attributes.position, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (let i = 0; i < P.count; i++){ const v = [P.getX(i), P.getY(i), P.getZ(i), 1];
        for (let r = 0; r < 3; r++){ const w = d.world.slice(4 * r, 4 * r + 4).reduce((a, x, k) => a + x * v[k], 0); lo[r] = Math.min(lo[r], w); hi[r] = Math.max(hi[r], w); } }
      return [lo.map(r0), hi.map(r0)]; };
    const draws = (sch.host.modelDraws || []).map(d => ({ model: (d.model || '').split(String.fromCharCode(92)).pop(), mesh: d.meshIndex, box: box(d), t: [3, 7, 11].map(i => r0(d.world[i])),
      xr: [0, 4, 8].map(i => r2(d.world[i])), yr: [1, 5, 9].map(i => r2(d.world[i])), zr: [2, 6, 10].map(i => r2(d.world[i])) }));
    sch.effects = sch0; V.pose.clock.getDelta = () => 1 / 60;
    const j0 = rt.gameJoints.get(0);
    out.push([res.length > 0, 'level ' + level, JSON.stringify({ draws, res, j0: j0 ? [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14].map(i => r2(j0[i])) : null })]);
  }
  $('monClassCtl').value = '0'; $('monClassCtl').dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = kwNodes;
export const args = [[process.env.DBG || '{}']];
