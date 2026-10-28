// laneA3/dbg083.mjs (lane A3, 2026-10-26): Gammoth u 242 (em083_00_011, mode 1, no joint, pos (0,0,1000), +0x4b 0x40) -- the request's
// life in the viewer, frame by frame: is a request made, what state its core takes, does it ever hold an effect.
// DBG env: { "id": "em083_00", "list": "2", "clip": "Motion[23]", "key": 242, "frames": 300, "hunter": "" }
async function dbg(Pj){
  const P = JSON.parse(Pj || '{}');
  const ID = P.id || 'em083_00', LIST = P.list || '2', CLIP = P.clip || 'Motion[23]', KEY = P.key || 242, N = P.frames || 300;
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === ID)) monSel.add(new Option(ID, ID));
  monSel.value = ID; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 900 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === ID); i++) await frames(1);
  if (P.hunter){ const h = $("monHunterDist"); if (h){ h.value = P.hunter; h.dispatchEvent(new Event('change')); await frames(4); } }
  const rt = M.effectRuntimeInstance(), S = rt.schedule;
  const ents = S.entries.filter(e => e.def.record && e.def.record.key === KEY && /u$/.test(e.def.record.pel));
  const res = { entries: ents.map(e => ({ when: e.def.when, pel: e.def.record.pel, payload: e.def.record.payload && String(e.def.record.payload).slice(0, 200) })), log: [], rays: [] };
  const host = S.host, orig = host.requestEffect.bind(host);
  host.requestEffect = (owner, parent, record, area, requester) => {
    const q = orig(owner, parent, record, area, requester);
    if (record && record.key === KEY){
      res.log.push({ f: Math.round(V.pose.action ? V.pose.action.time * 60 : -1), req: true, requester: requester || null, q: !!q,
                     stageFloorY: host.stageFloorY, unitY: (() => { const T = new V.camera.matrixWorld.constructor(); try { rt.unitMatrix(T); return T.elements.slice(12, 15); } catch (e){ return 'err ' + e.message; } })() });
      const mm = q && q.m;
      if (mm && mm.svc && mm.svc.stageRay && !mm.svc._a3){
        const sr = mm.svc.stageRay.bind(mm.svc); mm.svc._a3 = true;
        mm.svc.stageRay = (args) => { const r = sr(args); if (res.rays.length < 12) res.rays.push({ f: Math.round(V.pose.action.time * 60), ay: mm.f32(args[1] + 4), by: mm.f32(args[2] + 4), bx: mm.f32(args[2]), bz: mm.f32(args[2] + 8), floor: r }); return r; };
      }
    }
    return q;
  };
  // the two viewer-side what-ifs (DBG noOrigin: joint -1 at the model root, 0x939278's model+0xb0; floorAtUnit: the floor at the clip
  // origin, the posture-0 pin 0xbf284 -- index.html FLOOR_AT_UNIT_CLIPS)
  if (P.noOrigin){ rt.originBone = null; const pin = Object.getOwnPropertyDescriptor(rt, 'originBone'); Object.defineProperty(rt, 'originBone', { get: () => null, set: () => {}, configurable: true }); }
  if (P.floorAtUnit && S.rockInput){ const ri0 = S.rockInput.bind(S); S.rockInput = () => { const r = ri0(); if (r) r.floorY = 0; return r; }; }
  const listSel = $('monList'), clipSel = $('monClip');
  listSel.value = LIST; await listSel.onchange(); await frames(5);
  const opt = [...clipSel.options].find(o => o.value === CLIP) || [...clipSel.options].find(o => o.value.startsWith(CLIP));
  res.opt = opt ? opt.value : null; res.opts = [...clipSel.options].map(o => o.value).filter(v => v.startsWith(CLIP));
  V.state.loop = false;
  if (P.meter){ const C = V.controls, cam = V.camera; cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update(); V.effectMeter(true, { every: 5 }); }
  clipSel.value = opt.value; await clipSel.onchange();
  const seen = new Set();
  for (let i = 0; i < N; i++){
    await frames(1);
    for (const e of ents) for (const q of e.requests){
      const m = q.m, c = q.core;
      const st = { f: Math.round(V.pose.action ? V.pose.action.time * 60 : -1), core: c, c0c: (m.u32(c + 0xc) >>> 0).toString(16), n15c: m.u32(c + 0x15c), fx: q.effects().length, fin: q.finished() };
      const k = JSON.stringify([st.c0c, st.n15c, st.fx, st.fin]);
      if (!seen.has(c + k)){ seen.add(c + k); res.log.push(st); }
    }
    if (rt.failed){ res.failed = rt.failed; break; }
  }
  res.stats = { steps: rt.stats.steps, failed: rt.failed || null };
  if (P.meter){ const rep = V.effectMeterReport(); V.effectMeter(false); res.meter = rep.recs.filter(r => r.when !== 'shell' && r.key.split('|')[2] === String(KEY)).map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, verdict: r.verdict })); }
  return [[true, 'dbg ' + ID + ' u ' + KEY, JSON.stringify(res)]];
}
export const pageCheck = dbg;
export const args = [[(typeof process !== 'undefined' && process.env.DBG) || '{}']];
