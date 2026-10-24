const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const started = keys => { const fx = M.effectRuntimeInstance(); const out = {}; if (!fx) return out;
  for (const e of fx.schedule.entries) if (e.def.record && keys.includes(e.def.record.key)) out[e.def.record.key] = Math.max(out[e.def.record.key] || 0, e.requests.length); return out; };
if (![...monSel.options].some(o => o.value === 'em004_00')) monSel.add(new Option('em004_00', 'em004_00'));
monSel.value = 'em004_00'; await monSel.onchange(); await wait(1500);
const res = {};
for (const m of ['Motion[15]', 'Motion[9]']){
  listSel.value = '3'; await listSel.onchange();
  const clip = [...clipSel.options].map(o => o.value).find(v => v === m || v.startsWith(m + '_')); clipSel.value = clip; await clipSel.onchange();
  const seen = {};
  for (let i = 0; i < 25; i++){ await wait(300); for (const [k, v] of Object.entries(started([900, 905, 1105]))) seen[k] = Math.max(seen[k] || 0, v); }
  res['L3 ' + clip] = { seen, failed: M.effectRuntimeInstance().failed || null };
}
return res;
