// flashmeter.mjs (Flashed state, 2026-10-25): the Flashed switch on every monster the viewer has effects for, the draw meter on.
// Per monster: the switch must be offered exactly where shared-states.js FLASH_BLIND lists it (and the c 1103 record exists);
// then List 0's second clip loops, the meter starts, Flashed goes on for 90 frames, the clip changes to the third (the state must
// persist: still ONE request, never restarted), 90 more frames, Flashed off, 20 frames -- and the c 1103 record's starts / draw
// frames / lit samples / verdict are reported, with the request still running after the off (it must be stopped).
// Immune monsters (FLASH_IMMUNE): the switch must be hidden; the record is then held by force (rt.holdEvent, a meter-only path,
// labelled FORCED) to say whether it would draw -- the ROM never requests it there.
//   node dev/archive/run-check-detail.mjs dev/archive/flashed/flashmeter.mjs --url http://localhost:<port>   (METER_IDS=a,b,..)
async function flashMeter(ids){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const S = await import('/render/rom/effect/shared-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (!ids || !ids.length) ids = [...monSel.options].map(o => o.value).filter(v => /^em\d{3}_\d{2}$/.test(v));
  for (const MON of ids){
    try {
      if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
      monSel.value = MON; await monSel.onchange();
      await V.effects(false); await V.effects(true);
      const ok = await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
      if (!ok){ out.push([false, 'FLASH ' + MON, JSON.stringify({ error: 'no effect runtime' })]); continue; }
      const rt = M.effectRuntimeInstance();
      await frames(5); if (window.__refreshSharedRow) window.__refreshSharedRow();
      const rec = (rt.def.effects || []).find(x => x.when === 'event' && x.record && x.record.key === 1103 && /c$/.test(x.record.pel));
      const pel = rec ? rec.record.pel : null;
      const want = S.flashable(MON) && !!pel;
      const row = $('monFlashedRow'), shown = !!row && !row.hidden && !$('monSharedRow').hidden;
      const C = V.controls, cam = V.camera;
      cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
      if (listSel.value !== '0'){ listSel.value = '0'; await listSel.onchange(); }
      const pick = i => { clipSel.value = clipSel.options[Math.min(i, clipSel.options.length - 1)].value; return clipSel.onchange(); };
      await pick(1);
      V.state.loop = true;
      V.effectMeter(true, { every: 5 });
      const box = $('monFlashed');
      const forced = !want && !!pel;
      if (want){ box.checked = true; box.dispatchEvent(new Event('change')); }
      else if (forced) rt.holdEvent(pel, 1103, true);
      await frames(90);
      const mid = window.__flashed ? window.__flashed.now() : null;
      await pick(2);
      await frames(90);
      if (want){ box.checked = false; box.dispatchEvent(new Event('change')); }
      else if (forced) rt.holdEvent(pel, 1103, false);
      await frames(20);
      const entry = rt.schedule.entries.find(e => e.when === 'event' && e.def.record && e.def.record.pel === pel && e.def.record.key === 1103);
      const liveAfter = entry ? entry.requests.filter(q => !q.stopped).length : null;
      const rep = V.effectMeterReport();
      V.effectMeter(false);
      V.state.loop = false;
      const rows = rep.recs.filter(r => r.key.split('|')[2] === '1103')
        .map(r => ({ k: r.key, st: r.starts, drawFrames: r.drawFrames, lit: r.litSamples, s: r.samples, verdict: r.verdict, clips: r.clips, nodraw: r.nodraw }));
      const r0 = rows[0];
      const offerOk = shown === want;
      const pass = offerOk && (pel ? (!!r0 && r0.st === 1 && r0.verdict === 'draws' && liveAfter === 0) : true);
      out.push([pass, 'FLASH ' + MON + (forced ? ' FORCED (immune)' : want ? '' : ' (no record)'),
                JSON.stringify({ offered: shown, flashable: S.flashable(MON), pel, mid, liveAfter, rows })]);
    } catch (e){ out.push([false, 'FLASH ' + MON, JSON.stringify({ error: String(e && e.stack || e) })]); }
  }
  return out;
}
export const pageCheck = flashMeter;
export const args = ((typeof process !== 'undefined' && process.env.METER_IDS) ? [process.env.METER_IDS.split(',')] : [[]]).map(a => [a]);
