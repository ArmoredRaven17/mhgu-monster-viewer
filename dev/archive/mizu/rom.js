const V = window.__view;
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip'), lvSel = document.getElementById('monLevel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const RUN = 'mizu-colours-rom';
const out = {};
const r3 = a => a.map(x => +x.toFixed(3));
async function level(n){ lvSel.value = String(n); await lvSel.onchange({ target: lvSel }); }
async function clip(list, value){
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  clipSel.value = value; await clipSel.onchange();
}
function mat(){
  const v = {}; let col = null;
  V.mounted.main.traverse(o => { if (o.material && /m01_angry/.test(o.material.name)){ v[o.userData.part] = o.visible;
    if (!col) col = { c: r3(o.material.color.toArray()), e: r3(o.material.emissive.toArray()) }; } });
  return { ov: v, ...col, shown: V.motionStates().mat.shown };
}
async function snap(id, name, at){
  const act = V.pose.action, t = at === undefined ? (act ? act.time : 0) : at;
  const info = mat();
  V.state.matAnim = false;
  try { await V.shot(RUN, id + '_' + name, t); } finally { V.state.matAnim = true; }
  if (act){ act.timeScale = 1; }
  (out[id] = out[id] || {})[name] = info;
}
async function trace(id, name, times){
  const t0 = performance.now(), rows = [];
  for (const t of times){ await wait(t * 1000 - (performance.now() - t0)); rows.push([t, mat()]); }
  (out[id] = out[id] || {})[name] = rows.map(([t, m]) => [t, m.c, m.e, m.shown]);
}
for (const id of ['em082_00', 'em082_04']){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2000);
  await V.effects(false);
  V.state.loop = true;
  await level(0); await clip('0', 'Motion[1]_loop'); await wait(800);
  await snap(id, 'normal_spawn', 0.5);
  await level(2); await wait(1200); await snap(id, 'rung_exhausted', 0.5);
  // leaving exhaustion: tired_End, then its last frame held
  await level(0); await trace(id, 'exhausted_to_normal', [0.05, 0.17, 0.3, 0.6]);
  await snap(id, 'normal_after_exhausted', 0.5);
  await clip('0', 'Motion[9]_loop'); await wait(1200); await snap(id, 'normal_L0M9_row');
  await clip('0', 'Motion[1]_loop');
  // enraged straight to exhausted: angry_End first, then tired_Change
  await level(1); await wait(1000);
  await level(2); await trace(id, 'enraged_to_exhausted', [0.05, 0.17, 0.3, 0.45, 0.6, 0.9]);
  // death at the Enraged rung, played once
  await level(1); await wait(1000);
  V.state.loop = false;
  await clip('3', 'Motion[12]'); await wait(150); await snap(id, 'enraged_death_early');
  const act = V.pose.action; act.timeScale = 1;
  await wait(1); for (let i = 0; i < 900 && !(V.pose.action.time >= V.pose.action.getClip().duration - 1e-3); i++) await wait(16);
  await wait(100); await snap(id, 'enraged_death_end');
  // death at the Exhausted rung: tired keeps the overlay
  await level(2); await clip('0', 'Motion[1]_loop'); await wait(800);
  await clip('3', 'Motion[12]'); for (let i = 0; i < 900 && !(V.pose.action.time >= V.pose.action.getClip().duration - 1e-3); i++) await wait(16);
  await wait(100); await snap(id, 'exhausted_death_end');
  V.state.loop = true; await level(0);
}
return out;
