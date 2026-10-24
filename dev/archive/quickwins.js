const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const pick = async id => { if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id)); monSel.value = id; await monSel.onchange(); await wait(1500); };
const started = keys => { const fx = M.effectRuntimeInstance(); if (!fx) return 'no runtime'; const out = {};
  for (const e of fx.schedule.entries) if (e.def.record && keys.includes(e.def.record.key)) out[e.def.record.key] = (out[e.def.record.key] || 0) + e.requests.length; return out; };
const res = {};
for (const id of ['em033_00', 'em038_00']){
  await pick(id);
  const rage = document.getElementById('monRage'); rage.checked = true; rage.dispatchEvent(new Event('change'));
  await wait(4000);
  res[id + ' enraged'] = started([1120, 1121]);
  rage.checked = false; rage.dispatchEvent(new Event('change'));
}
await pick('em042_00');
listSel.value = '3'; await listSel.onchange();
const clip = [...clipSel.options].map(o => o.value).find(v => /^Motion\[13\]/.test(v)); clipSel.value = clip; await clipSel.onchange();
const fx = M.effectRuntimeInstance(); const s0 = fx.schedule.starts;
const seen = {};
for (let i = 0; i < 30; i++){ await wait(300); for (const [k, v] of Object.entries(started([900, 905]))) seen[k] = Math.max(seen[k] || 0, v); }
res['em042_00 L3 M13 (' + clip + ')'] = { seen, starts: fx.schedule.starts - s0, failed: fx.failed || null };
return res;
