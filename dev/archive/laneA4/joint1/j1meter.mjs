// laneA4/joint1/j1meter.mjs (lane A4, 2026-10-25): JOINT -1 -- the viewer's rule (live.js unitMatrix: the gid-0 bone's position)
// against the ROM's (0x939278 / 0x329b7c: the parent unit's own +0xb0 / +0x40, the enemy's P+0x40 = index.html unitGamePos()).
// For every joint -1 (payload +0x32 == -1) CLIP record of each monster (or the keys given), every clip CLIP_EFFECTS names it on is
// played whole under the draw meter (live.js METER: starts / live / draw frames / lit samples), with the rule chosen:
//   rule 'cur'  -- as shipped (gid-0 bone);   'root' -- rt.originBone = null (live.js root.matrixWorld, laneA3/dbg083 noOrigin);
//   rule 'unit' -- the unit: unitMatrix's position = __view.unitGamePos() (the clip origin through the world group, the reference
//                  node's travel, less the air drop), rotation / scale as shipped;
//   floorAtUnit -- the ground ray's floor (rockInput().floorY) at the unit's height (the posture-0 pin, 0xbf284).
// Each request of a universe record logs the three anchors (game units) and the floor at its start, and (spawn-height records)
// the ground ray the core casts (host svc.stageRay: A.y, B.y, the floor it got).
// DBG env: { "ids": ["em083_00"], "rule": "unit", "floorAtUnit": false, "keys": { "em083_00": ["em083_00u|242"] } | null,
//            "sh": true (only spawn-height records), "maxClips": 0 }
async function j1(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  const RULE = P.rule || 'cur';
  const j1 = hex => { const b = parseInt(hex.substr(100, 2), 16) | (parseInt(hex.substr(102, 2), 16) << 8); return (b << 16) >> 16; };
  const u8 = (hex, o) => parseInt(hex.substr(2 * o, 2), 16);
  const f32 = (hex, o) => { const b = new Uint8Array(4); for (let i = 0; i < 4; i++) b[i] = u8(hex, o + i); return new DataView(b.buffer).getFloat32(0, true); };
  const r1 = v => Math.round(v * 10) / 10;
  for (const MON of P.ids){ try {
    const t0 = performance.now();
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    if (!await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900)){
      out.push([false, 'J1 ' + MON, JSON.stringify({ error: 'no runtime' })]); continue;
    }
    const ent = V.MON.monsters.find(e => e.id === MON);
    const C = V.controls, cam = V.camera;
    cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
    const base = c => String(c).replace(/#.*$/, '').replace(/_(start|loop)$/, '');
    const def = await fetch('/effects/' + MON + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
    const univ = new Map();      // 'pel|key' -> info
    const eflKey = new Map();    // 'efl|key' -> 'pel|key'
    const want = P.keys && P.keys[MON] ? new Set(P.keys[MON]) : null;
    for (const e of (def && def.effects) || []){
      const r = e.record;
      if (!r || !r.payload || e.when !== 'clip' || j1(r.payload) !== -1) continue;
      const pk = r.pel + '|' + r.key;
      const sh = u8(r.payload, 0x40);
      if (want && !want.has(pk)) continue;
      if (P.sh && !sh) continue;
      univ.set(pk, { sh, lim: f32(r.payload, 0x58), r52: u8(r.payload, 0x52), mode: u8(r.payload, 0x36), space: u8(r.payload, 0x38) });
      eflKey.set(String(e.efl || '').replace(/^files\//, '').replace(/\.efl$/, '') + '|' + r.key, pk);
    }
    const clipRecs = new Map();  // 'list|base' -> Set of pk
    for (const [k, v] of Object.entries((M.CLIP_EFFECTS || {})[MON] || {})){
      const m = /^L(\S+) (.+)$/.exec(k); if (!m) continue;
      for (const b of (v && v.bits) || []){
        const pk = eflKey.get(String(b.efl).replace(/\.efl$/, '') + '|' + b.key);
        if (!pk) continue;
        const ck = m[1] + '|' + base(m[2]);
        if (!clipRecs.has(ck)) clipRecs.set(ck, new Set());
        clipRecs.get(ck).add(pk);
      }
    }
    // THE RULE, on the body's runtime (re-installed when the runtime is remade)
    const S0 = M.effectRuntimeInstance().schedule;
    const allReq = new Map(), playedLog = [];
    const install = rt => {
      if (!rt || rt.__j1) return;
      rt.__j1 = true; rt.__ob0 = rt.originBone;
      const um = rt.unitMatrix.bind(rt);
      rt.unitMatrix = o => {
        if (RULE === 'root'){ const ob = rt.originBone; rt.originBone = null; um(o); rt.originBone = ob; }
        else um(o);
        if (RULE === 'unit'){ const u = V.unitGamePos(); o.elements[12] = u[0] * 0.01; o.elements[13] = u[1] * 0.01; o.elements[14] = u[2] * 0.01; }
        return o;
      };
      const S = rt.schedule;
      if (P.floorAtUnit && S && S.rockInput && !S.__j1f){ S.__j1f = true; const ri0 = S.rockInput.bind(S); S.rockInput = () => { const r = ri0(); if (r) r.floorY = V.unitGamePos()[1]; return r; }; }
      const host = S.host;
      if (host.__j1) return;
      host.__j1 = true;
      const orig = host.requestEffect.bind(host);
      host.requestEffect = (owner, parent, record, area, requester) => {
        const q = orig(owner, parent, record, area, requester);
        const ek = record ? String(record.path || '').split(/[\\/]/).pop() + '|' + record.key : null;
        const pk = ek ? (eflKey.get(ek) || null) : null;
        if (ek) allReq.set(ek, (allReq.get(ek) || 0) + 1);
        if (pk && univ.has(pk)){
          const u = univ.get(pk); u.req = (u.req || 0) + 1;
          if ((u.log || (u.log = [])).length < 4){
            const rtc = M.effectRuntimeInstance();
            const pos = n => { if (!n) return null; n.updateWorldMatrix(true, false); const e = n.matrixWorld.elements; return [r1(e[12] * 100), r1(e[13] * 100), r1(e[14] * 100)]; };
            const ri = rtc.schedule.rockInput ? rtc.schedule.rockInput() : null;
            u.log.push({ clip: V.state.list + '|' + (V.pose.action ? V.pose.action.getClip().name : '?'), f: Math.round(V.pose.action ? V.pose.action.time * 60 : -1),
                         gid0: pos(rtc.__ob0), root: pos(rtc.root), unit: V.unitGamePos().map(r1), floor: ri && Number.isFinite(ri.floorY) ? r1(ri.floorY) : null,
                         q: !!q, requester: requester ? Object.keys(requester) : null });
          }
          const mm = q && q.m;
          if (u.sh && mm && mm.svc && mm.svc.stageRay && !mm.svc.__j1){
            const sr = mm.svc.stageRay.bind(mm.svc); mm.svc.__j1 = true;
            mm.svc.stageRay = args => { const r = sr(args); if ((u.rays || (u.rays = [])).length < 6) u.rays.push({ f: Math.round(V.pose.action ? V.pose.action.time * 60 : -1), ay: r1(mm.f32(args[1] + 4)), by: r1(mm.f32(args[2] + 4)), floor: r }); return r; };
          }
        }
        return q;
      };
    };
    install(M.effectRuntimeInstance());
    const lists = new Map((ent.lists || []).map(l => [String(l.id), l]));
    V.state.loop = false;
    let played = 0;
    const durOf = (l, b) => { const L = lists.get(l); if (!L) return 200; let d = 0; for (const c of L.clips) if (base(c.clip) === b) d += c.dur; return Math.min(900, Math.round(d * 60) + 30); };
    V.effectMeter(true, { every: 5 });
    let ks = [...clipRecs.keys()];
    if (P.maxClips) ks = ks.slice(0, P.maxClips);
    for (const k of ks){
      const i = k.indexOf('|'), l = k.slice(0, i), b = k.slice(i + 1);
      if (!lists.has(l)) continue;
      if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); await frames(2); }
      const opts = [...clipSel.options].map(o => o.value).filter(v => base(v) === b);
      for (const v of opts){
        clipSel.value = v; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(String(v).replace(/#.*$/, '').replace(/_(start|loop)$/, '')), 120);
        install(M.effectRuntimeInstance());
        const fr0 = V.pose.action ? V.pose.action.time * 60 : -1, tt = performance.now();
        await frames(durOf(l, b));
        playedLog.push([l, v, durOf(l, b), Math.round(fr0), Math.round(V.pose.action ? V.pose.action.time * 60 : -1), Math.round(performance.now() - tt)]);
        played++;
      }
    }
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    const rows = [];
    for (const [pk, u] of univ){
      const r = rep.recs.find(x => x.key === MON + '|' + pk + '|clip');
      rows.push({ pk, sh: u.sh, lim: u.lim, r52: u.r52, mode: u.mode, space: u.space, req: u.req || 0,
                  st: r ? r.starts : 0, live: r ? r.liveFrames : 0, df: r ? r.drawFrames : 0, s: r ? r.samples : 0, lit: r ? r.litSamples : 0,
                  verdict: r ? r.verdict : (u.req ? 'requested, never started' : 'not requested'),
                  clips: [...clipRecs].filter(([, s]) => s.has(pk)).map(([c]) => c).slice(0, 6), log: u.log || [], rays: u.rays || [] });
    }
    const rt = M.effectRuntimeInstance();
    out.push([true, 'J1 ' + MON + ' ' + RULE + (P.floorAtUnit ? '+floorAtUnit' : ''), JSON.stringify({ rule: RULE, floorAtUnit: !!P.floorAtUnit, played, secs: Math.round((performance.now() - t0) / 1000),
      failed: rt && rt.failed ? String(rt.failed).slice(0, 200) : null, universe: univ.size, playedLog: P.verbose ? playedLog : undefined, allReq: P.verbose ? [...allReq] : undefined, rows })]);
  } catch (e){ out.push([false, 'J1 ' + MON, JSON.stringify({ error: String(e && e.stack || e).slice(0, 400) })]); } }
  return out;
}
export const pageCheck = j1;
export const args = [[(typeof process !== 'undefined' && process.env.DBG) || '{}']];
