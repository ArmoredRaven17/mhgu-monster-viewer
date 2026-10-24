const V = window.__view;
const monSel = document.getElementById('monSel'), lvSel = document.getElementById('monLevel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = {};
const force = on => V.mounted.main.traverse(o => { if (o.material && /m01_angry/.test(o.material.name)) o.visible = on; });
async function snap(name){
  await wait(700);
  const act = V.pose.action;
  V.state.matAnim = false;
  try { out[name] = (await V.shot('mizu-colours', name, 0.5)); } finally { V.state.matAnim = true; }
  if (act){ act.timeScale = 1; }
}
for (const id of ['em082_00', 'em082_04']){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2000);
  // pose fixed at 0.5 s of the idle
  await snap(id + '_calm_overlay_off');
  force(true); await snap(id + '_calm_overlay_authored');
  lvSel.value = '1'; await lvSel.onchange({ target: lvSel }); await wait(1000);
  lvSel.value = '0'; await lvSel.onchange({ target: lvSel }); await wait(1000);
  force(true); await snap(id + '_calm_overlay_after_angryEnd');
  force(false);
}
return Object.keys(out);
