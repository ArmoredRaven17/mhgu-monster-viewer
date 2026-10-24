const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = {};
monSel.add(new Option('em079_00', 'em079_00')); monSel.value = 'em079_00'; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true); await wait(500);
for (const [l, v] of [['1', 'Motion[27]'], ['2', 'Motion[43]_start'], ['2', 'Motion[42]_start']]){
  listSel.value = l; await listSel.onchange();
  out['opts' + l] = [...clipSel.options].map(o => o.value + '|' + o.textContent.slice(0, 30)).filter(x => /\[(2[67]|4[123])\]/.test(x));
  clipSel.value = v; await clipSel.onchange();
  const tr = [];
  for (let i = 0; i < 8; i++){ await wait(150); const a = V.pose.action, S = M.effectRuntimeInstance().schedule;
    tr.push([clipSel.value, a && a.getClip().name, a && +a.time.toFixed(2), a && a.paused, a && a.timeScale, S.clip && S.clip.key, S.clip && Math.round(S.clip.frame), V.state.clip]); }
  out[l + v] = tr;
}
return out;
