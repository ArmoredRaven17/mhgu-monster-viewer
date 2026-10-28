// probe.mjs (effects coverage census, 2026-10-24): the draw meter on chosen plays of one monster. PROBE env (JSON):
//   { "id": "em003_00", "steps": [ {"set": {"monGroundType": "g8"}}, {"part": ["2,3", "last"]}, {"clip": "2|Motion[38]#B", "frames": 200}, ... ],
//     "want": ["em003_00|em003_00u|320|clip", ...] }
// A step sets inputs (select / checkbox ids), a Parts row (data-row, option index or 'last' / 'first'), or plays a clip option (every copy
// when the value has no '#': "2|Motion[38]*"). Prints the meter's rows for `want` (or every non-shell record) and the input log.
async function probe(spec){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  const MON = spec.id;
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  V.state.loop = false;
  V.effectMeter(true, { every: 5 });
  const log = [];
  for (const st of spec.steps || []){
    if (st.set) for (const [id, v] of Object.entries(st.set)){
      const el = $(id); if (!el){ log.push('no ' + id); continue; }
      if (el.type === 'checkbox') el.checked = !!v; else el.value = String(v);
      el.dispatchEvent(new Event('change')); if (el.onchange && el.type === 'checkbox') {}
      await frames(4); log.push(id + '=' + v);
    }
    if (st.part){
      const [row, which] = st.part;
      const f = [...document.querySelectorAll('[data-row]')].find(x => x.dataset.row === row);
      const s = f && f.querySelector('select');
      if (!s){ log.push('no part row ' + row); continue; }
      const o = which === 'last' ? s.options[s.options.length - 1] : which === 'first' ? s.options[0] : s.options[which | 0];
      s.value = o.value; s.dispatchEvent(new Event('change')); await frames(st.frames || 10); log.push('part ' + row + '=' + o.textContent.trim());
    }
    // {"partsAll": "last" | "first"} (2026-10-25): every Parts row to its last (broken) or first option
    if (st.partsAll){
      for (const s of [...document.querySelectorAll('[data-row] select')].filter(s => s.options && s.options.length > 1)){
        const o = st.partsAll === 'first' ? s.options[0] : s.options[s.options.length - 1];
        s.value = o.value; s.dispatchEvent(new Event('change')); await frames(2);
      }
      await frames(st.frames || 10); log.push('parts all ' + st.partsAll);
    }
    // {"partSweep": {"clip": "3|Motion[9]", "frames": 40, "reps": 2}} (2026-10-25): every Parts row through every option, the clip
    // played `reps` times at each (a levels row fires at the level shown when the motion starts; a cycle advances per play)
    if (st.partSweep){
      const P = st.partSweep, i = P.clip.indexOf('|'), l = P.clip.slice(0, i), c = P.clip.slice(i + 1);
      const rows = [...document.querySelectorAll('[data-row] select')].filter(s => s.options && s.options.length > 1);
      const v0 = rows.map(s => s.value);
      for (const s of rows) for (const o of [...s.options]){
        s.value = o.value; s.dispatchEvent(new Event('change')); await frames(4);
        if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
        for (let r = 0; r < (P.reps || 1); r++){ clipSel.value = c; await clipSel.onchange(); await frames(P.frames || 40); }
      }
      rows.forEach((s, k) => { s.value = v0[k]; s.dispatchEvent(new Event('change')); });
      await frames(10); log.push('partSweep ' + P.clip + ' over ' + rows.length + ' rows');
    }
    if (st.clip){
      const i = st.clip.indexOf('|'), l = st.clip.slice(0, i), c = st.clip.slice(i + 1);
      if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
      const base = c.replace(/\*$/, '');
      const opts = c.endsWith('*') ? [...clipSel.options].map(o => o.value).filter(v => v.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === base   /* the copy suffix first: 'Motion[2]_loop#B' */) : [c];
      for (const v of opts){
        const o = [...clipSel.options].find(x => x.value === v);
        if (!o){ log.push('no clip ' + l + '|' + v); continue; }
        clipSel.value = o.value; await clipSel.onchange();
        if (st.loop) V.state.loop = true;
        await frames(st.frames || 300);
        V.state.loop = false;
        log.push('played ' + l + '|' + v);
      }
    }
    if (st.wait) await frames(st.wait);
  }
  const rep = V.effectMeterReport();
  V.effectMeter(false);
  const rows = rep.recs.filter(r => r.when !== 'shell' && (!spec.want || spec.want.includes(r.key)))
    .map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict, clips: Object.keys(r.clips).slice(0, 3), nodraw: r.nodraw }));
  const missing = (spec.want || []).filter(k => !rep.recs.some(r => r.key === k));
  out.push([missing.length === 0, 'PROBE ' + MON, JSON.stringify({ log, rows, missing })]);
  return out;
}
export const pageCheck = probe;
export const args = [[JSON.parse((typeof process !== 'undefined' && process.env.PROBE) || '{"id":"em001_00","steps":[]}')]];
