const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = {};
for (const id of ['em082_04', 'em032_04', 'em081_04', 'em001_00']){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(800);
  const st = getComputedStyle(document.documentElement);
  out[id] = ['--bg', '--accent', '--accent-hover', '--cta'].map(k => k + ' ' + st.getPropertyValue(k).trim()).join(' | ');
}
return out;
