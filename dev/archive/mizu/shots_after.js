const V = window.__view;
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip'), lvSel = document.getElementById('monLevel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const RUN = 'mizu-colours-after';
const out = {};
async function mon(id){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2000);
}
async function level(n){ lvSel.value = String(n); await lvSel.onchange({ target: lvSel }); await wait(100); }
async function clip(list, value){
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  clipSel.value = value; await clipSel.onchange();
}
function overlay(){
  const v = {}; V.mounted.main.traverse(o => { if (o.material && /m01_angry/.test(o.material.name)) v[o.userData.part] = o.visible && o.parent.visible; });
  let col = null; V.mounted.main.traverse(o => { if (!col && o.material && /m01_angry/.test(o.material.name)) col = { c: o.material.color.toArray().map(x => +x.toFixed(3)), e: o.material.emissive.toArray().map(x => +x.toFixed(3)) }; });
  return { v, col };
}
async function snap(name, settle = 900){
  await wait(settle);
  const act = V.pose.action, at = act ? act.time : 0;
  const info = { ms: V.motionStates(), overlay: overlay(), clip: V.state.clip, level: V.state.level, rage: V.state.rage };
  V.state.matAnim = false;
  try { info.shot = (await V.shot(RUN, name, at)).path || null; } finally { V.state.matAnim = true; }
  if (act){ act.timeScale = 1; act.paused = false; }
  out[name] = info;
}
for (const id of (window.__IDS || ['em082_00', 'em082_04'])){
  await mon(id);
  await level(0); await clip('0', 'Motion[1]_loop'); await snap(id + '_normal_idle');
  await clip('3', 'Motion[2]'); await snap(id + '_normal_L3M2', 1500);
  await clip('2', 'Motion[14]'); await snap(id + '_normal_L2M14', 1200);
  await clip('0', 'Motion[9]_loop'); await snap(id + '_normal_L0M9', 1200);
  await clip('0', 'Motion[1]_loop');
  await level(1); await snap(id + '_rung_enraged', 1200);
  await level(2); await snap(id + '_rung_exhausted', 1200);
  await clip('2', 'Motion[14]'); await snap(id + '_exhausted_L2M14', 1200);
  await level(1); await clip('0', 'Motion[9]_loop'); await snap(id + '_enraged_L0M9', 1200);
  await clip('3', 'Motion[12]'); await snap(id + '_enraged_death_L3M12', 1500);
  await level(0); await clip('0', 'Motion[1]_loop'); await snap(id + '_back_normal', 1200);
}
return out;
