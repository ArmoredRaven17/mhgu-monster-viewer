// laneB2/dbg084.mjs (lane B2, 2026-10-25): Nakarkos's arm effect runtimes -- are they made, what clip each is fed, what its schedule holds
async function dbg(){
  const out = [], V = window.__view, EM = await import('/render/rom/effect-mounts.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === 'em084_00')) monSel.add(new Option('em084_00', 'em084_00'));
  monSel.value = 'em084_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await frames(120);
  const snap = tag => {
    const keys = EM.sideEffectKeys ? EM.sideEffectKeys() : null;
    const rows = (keys || []).map(k => { const rt = EM.sideEffectRuntime(k); const s = rt && rt.schedule;
      return { k, sched: !!s, clip: s && s.clip ? s.clip.key : null, frame: s && s.clip ? Math.round(s.clip.frame) : null, mask: s && s.clip ? s.clip.mask : null,
               entries: s ? s.entries.length : 0, clipEntries: s ? s.entries.filter(e => e.when === 'clip').length : 0, running: s ? s.running : 0, failed: rt && rt.failed ? String(rt.failed) : null }; });
    out.push([true, 'ARM ' + tag, JSON.stringify({ keys, rows, pending: ['em084_00_left', 'em084_00_right'].map(k => EM.sideEffectsPending(k)) })]);
  };
  snap('idle');
  listSel.value = '2'; await listSel.onchange();
  const vals = [...clipSel.options].map(o => o.value).slice(0, 6);
  for (const v of vals){ clipSel.value = v; await clipSel.onchange(); await frames(90); snap('after ' + v); }
  return out;
}
export const pageCheck = dbg;
export const args = [[]];
