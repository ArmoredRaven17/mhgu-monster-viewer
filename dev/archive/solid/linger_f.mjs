// linger.mjs (run-check.mjs): the Solid hunter's CONTACT EFFECTS. Per case, Hunter Body None and Solid: the clip played `plays` times
// (loop off), then the monster's rest clip for `after` frames. Every frame: each shell that met the hunter (an event 'hunter' / a
// S.hunterHit latch / a contact start) is kept by reference (a deleted shell too), with every request it holds (request, effect2..4,
// handles) -- alive = the request's unit state 1 / 2 (+0xc & 7). Reported: per contact shell its base / mode / its life in frames and each
// request's first / last alive frame, the frames after the clip change it lived, and the shell entries' alive requests over time.
async function linger(cases, opts = {}){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  for (const c of cases){ try {
    if (V.state.id !== c.mon){ if (![...monSel.options].some(o => o.value === c.mon)) monSel.add(new Option(c.mon, c.mon)); monSel.value = c.mon; await monSel.onchange(); }
    for (const body of (c.bodies || [0, 1])){
      window.__hunter.set(c.dist != null ? c.dist : null, null, body);
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === c.mon, 900);
      const rt = M.effectRuntimeInstance(), sc = rt.schedule, m = sc.host.m;
      const alive = q => !!(q && (((m.u32(q.core + 0xc) & 7) - 1) >>> 0) < 2);
      V.state.loop = false;
      const pickClip = async (list, clip) => {
        if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
        await until(() => [...clipSel.options].some(x => x.value === clip || x.value.replace(/_(start|loop)$/, '') === clip), 600);
        const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value.replace(/_(start|loop)$/, '') === clip);
        if (!o) return false;
        clipSel.value = o.value; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip(), 300);
        return true;
      };
      const contact = new Map();     // shell id -> record
      let F = 0, changeAt = null;
      const look = () => {
        const shells = sc.shells ? sc.shells.state.shells : [];
        for (const S of shells){
          const met = S.hunterHit || (S.events || []).some(e => e.ev === 'hunter' || e.ev === 'hunter-mark') || (S.hit && S.hit.type === 2);
          let r = contact.get(S.id);
          if (!r && met) contact.set(S.id, r = { S, at: F, base: S.base, shell: S.shell, mode: S.modeIndex != null ? S.modeIndex : (S.type && S.type.id), reqs: new Map(), gone: null });
          if (r && !r.gone && !shells.includes(r.S)) r.gone = F;
        }
        for (const r of contact.values()){
          if (r.gone == null && !shells.includes(r.S)) r.gone = F;
          const S = r.S, hs = [['request', S.request], ['effect2', S.effect2 && S.effect2.request], ['effect3', S.effect3 && S.effect3.request],
                               ['effect4', S.effect4 && S.effect4.request], ...Object.entries(S.handles || {})];
          for (const [k, q] of hs){
            if (!q || !q.core) continue;
            const key = k + '@' + q.core;
            let e = r.reqs.get(key); if (!e) r.reqs.set(key, e = { k, q, first: null, last: null });
          }
          // every request the shell ever held, tested every frame (a dropped handle's request lives on its own)
          for (const e of r.reqs.values()) if (alive(e.q)){ if (e.first == null) e.first = F; e.last = F; }
          if (r.state == null || r.S.state !== r.lastState){ r.lastState = r.S.state; (r.states = r.states || []).push([F, r.S.state]); }
        }
      };
      const atkSel = document.getElementById('monAtkBox'); if (atkSel && c.atk){ atkSel.value = c.atk; atkSel.onchange({ target: atkSel }); }
      const vis = () => {
        let fx = 0, sh = 0, atk = 0;
        if (rt.scene) rt.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry && o.geometry.drawRange && o.geometry.drawRange.count !== 0) fx++; });
        V.scene.traverse(o => { if (o.name === 'shell-hit-shapes' && o.visible) o.children.forEach(ch => { if (ch.visible) sh++; });
                               if (o.name === 'attack-hitboxes' && o.visible) o.children.forEach(ch => { if (ch.visible) atk++; }); });
        return [fx, sh, atk];
      };
      const shellAlive = () => { let n = 0; for (const e of sc.entries) if (e.when === 'shell') for (const q of e.requests) if (alive(q)) n++; return n; };
      const curve = [];
      for (let p = 0; p < (c.plays || 1); p++){
        if (!(await pickClip(c.list, c.clip))){ out.push([false, 'NOCLIP ' + c.mon + ' ' + c.clip, '']); break; }
        const act = V.pose.action;
        for (let i = 0; i < 4000; i++){
          await raf(); F++; look();
          if (F % 30 === 0) curve.push([F, shellAlive(), ...vis()]);
          if (act.paused && act.time >= act.getClip().duration - 2e-3) break;
        }
      }
      changeAt = F;
      await pickClip(c.restList || '0', c.rest || 'Motion[0]');
      for (let i = 0; i < (c.after || 600); i++){ await raf(); F++; look(); if (F % 30 === 0) curve.push([F, shellAlive(), ...vis()]); }
      const rows = [...contact.values()].map(r => ({ shell: r.shell, base: r.base, mode: r.mode, met: r.at, gone: r.gone, states: (r.states || []).slice(0, 6),
        reqs: [...r.reqs.values()].filter(e => e.first != null).map(e => ({ k: e.k, first: e.first, last: e.last, pastChange: e.last != null ? e.last - changeAt : null, key: e.q.key || null })) }));
      out.push([false, 'CASE ' + c.mon + ' ' + c.list + '|' + c.clip + ' body ' + body, JSON.stringify({ changeAt, end: F, contacts: rows, curve: curve.filter((x, i) => i % 2 === 0) })]);
    }
  } catch (e){ out.push([false, 'ERR ' + c.mon + ' ' + c.clip, String(e).slice(0, 200)]); } }
  window.__hunter.set(null, null, 0);
  return out;
}
export const pageCheck = linger;
export const args = [[[
  { mon: 'em058_00', list: '2', clip: 'Motion[19]', plays: 1, after: 900, atk: 'armed', bodies: [0, 1] },
  { mon: 'em036_00', list: '2', clip: 'Motion[6]', plays: 1, after: 900, atk: 'armed', bodies: [0, 1] },
  { mon: 'em046_00', list: '4', clip: 'Motion[10]', plays: 1, after: 900, atk: 'armed', bodies: [0, 1] },
  { mon: 'em066_00', list: '4', clip: 'Motion[30]', plays: 1, after: 900, atk: 'armed', bodies: [0, 1] },
  { mon: 'em068_00', list: '2', clip: 'Motion[60]', plays: 1, after: 900, atk: 'armed', bodies: [0, 1] },
  { mon: 'em072_00', list: '4', clip: 'Motion[15]', plays: 1, after: 900, atk: 'armed', bodies: [0, 1] },
  { mon: 'em087_00', list: '0', clip: 'Motion[9]', plays: 1, after: 900, atk: 'armed', bodies: [0, 1] },
]]];
