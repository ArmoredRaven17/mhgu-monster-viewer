// kushwind/kwpos.mjs (2026-10-27): where Kushala's held wind aura (u 1 / u 0 / u 10, em024_00_004, record joint 0) stands, per Wind Aura
// level, on L0 M1 -- its units' uCoord +0x40 and +0xb0 rows, against his joints (game units), the effect parent (live.js unitMatrix),
// the page's unit (unitGamePos), the gid-0 bone's world rows, and the draw meter's starts / lit samples.
// Run: node <scratchpad>/rcd3.mjs dev/archive/kushwind/kwpos.mjs --url http://localhost:<port>   (DBG env: { "levels": [1,2,3] })
async function kwPos(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  const mon = 'em024_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  const r0 = v => Math.round(v);
  for (const level of (P.levels || [1, 2, 3])){
    if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
    monSel.value = mon; await monSel.onchange(); await frames(5);
    const cs = $('monClassCtl'); cs.value = String(level); cs.dispatchEvent(new Event('change'));
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
    if (P.rule === 'unit'){
      const rt = M.effectRuntimeInstance();
      const um = rt.unitMatrix.bind(rt);
      rt.unitMatrix = o => { um(o); const u = V.unitGamePos(); o.elements[12] = u[0] * 0.01; o.elements[13] = u[1] * 0.01; o.elements[14] = u[2] * 0.01; return o; };
    }
    // P.dir: the camera put on that side of him (fitted distance x 1.3) BEFORE the play -- the steps read this render's camera
    if (P.dir){ const C = V.controls, cam = V.camera, d = cam.position.distanceTo(C.target) * 1.3, t = C.target.clone();
      cam.position.copy(t.clone().add(new cam.position.constructor(...P.dir).normalize().multiplyScalar(d))); C.target.copy(t); C.update(); }
    V.effectMeter(true, { every: 5 });
    if (V.state.list !== '0'){ listSel.value = '0'; await listSel.onchange(); }
    clipSel.value = P.clip || 'Motion[1]_loop'; await clipSel.onchange();
    await frames(P.frames || 120);
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    const rt = M.effectRuntimeInstance(), sch = rt.schedule, m = sch.host.m;
    const rows = u => [0xb0, 0xc0, 0xd0, 0xe0].map(o => [0, 4, 8].map(k => Math.round(m.f32(u + o + k) * 1000) / 1000));
    const held = [];
    for (const e of sch.entries) if (e.def.record && e.def.record.pel === 'em024_00u' && [0, 1, 10].includes(e.def.record.key))
      for (const q of e.requests) if (!q.stopped)
        held.push({ key: e.def.record.key, units: q.effects().map(u => ({ pos: [0x40, 0x44, 0x48].map(o => r0(m.f32(u + o))), rows: rows(u),
                                                                           j34: m.u32(u + 0x34) | 0, off: [0x160, 0x164, 0x168].map(o => r0(m.f32(u + o))) })) });
    const joints = {};
    for (const [g, mm] of rt.gameJoints) if (g <= 6 || g === 143) joints[g] = { t: [12, 13, 14].map(i => r0(mm[i])), x: [0, 1, 2].map(i => Math.round(mm[i] * 100) / 100), y: [4, 5, 6].map(i => Math.round(mm[i] * 100) / 100), z: [8, 9, 10].map(i => Math.round(mm[i] * 100) / 100) };
    const pm = new (V.camera.matrix.constructor)(); rt.unitMatrix(pm);
    const par = { t: [12, 13, 14].map(i => r0(pm.elements[i] * 100)), z: [8, 9, 10].map(i => Math.round(pm.elements[i] * 100) / 100) };
    const recs = rep.recs.filter(r => r.starts).map(r => r.key.split('|').slice(1).join('|') + ' ' + r.starts + ' st ' + r.litSamples + '/' + r.samples);
    out.push([held.length > 0, 'level ' + level + (P.rule ? ' rule ' + P.rule : ''), JSON.stringify({ held, joints, parent: par, unit: V.unitGamePos().map(r0),
      world: [V.world.position.x * 100, V.world.position.y * 100, V.world.position.z * 100].map(r0), recs, failed: rt.failed || null })]);
  }
  $('monClassCtl').value = '0'; $('monClassCtl').dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = kwPos;
export const args = [[process.env.DBG || '{}']];
