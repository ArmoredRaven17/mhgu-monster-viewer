// PROBE: Ahtal-Ka's silk balls (shell00, L2 M26 under 7:0x0f / 7:0x15) and the arena silk lines (shell01, L2 M33) live.
const V = window.__view;
const THREE = await import('three');
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = { log: [] };
const id = 'em088_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
const RT = M.effectRuntimeInstance();
RT.schedule.entries = RT.schedule.entries.filter(e => e.when === 'shell' && e.def.record && [90, 91].includes(e.def.record.key));
RT.failed = null;
const S = () => M.effectRuntimeInstance().schedule;
const T0 = V.controls.target.clone();
const shells = () => (S().shells && S().shells.state ? S().shells.state.shells : []);
async function play(list, base){
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options].map(o => o.value);
  clipSel.value = opts.find(v => v === base) || opts.find(v => v === base + '_start') || opts.find(v => v === base + '_loop');
  await clipSel.onchange();
}
function cam(far){
  const pts = [T0.clone()].concat(shells().filter(s => s.state === 1 && s.position).map(s => new THREE.Vector3(s.position[0] * 0.01, s.position[1] * 0.01, s.position[2] * 0.01)));
  const box = new THREE.Box3().setFromPoints(pts);
  const c = box.getCenter(new THREE.Vector3()), size = Math.max(far || 18, box.getSize(new THREE.Vector3()).length() * 1.5);
  V.controls.target.copy(c);
  V.camera.position.set(c.x + size * 0.8, c.y + size * 0.5, c.z + size * 0.6);
  V.camera.near = 0.05; V.camera.far = size * 30; V.camera.updateProjectionMatrix(); V.controls.update();
}
async function shotNow(name, far){
  cam(far);
  const r = await V.shot('em088-silk', name, V.pose.action.time); V.pose.action.timeScale = 1;
  out.log.push({ name, clip: V.pose.action.getClip().name, shells: shells().map(s => [s.shell, s.modeIndex, s.state, (s.position || []).map(v => Math.round(v))]),
                 starts: S().starts, failed: RT.failed ? String(RT.failed) : null, saved: r && r.saved && r.saved.split(/[\\/]/).pop() });
}
for (let k = 0; k < 0; k++){
  await play('2', 'Motion[1]'); await wait(200);
  await play('2', 'Motion[26]');
  await until(() => shells().some(s => s.shell === 'shell00' && s.state === 1), 600);
  await wait(250); await shotNow('L2M26_play' + k + '_ball');
  await until(() => shells().some(s => s.shell === 'shell00' && s.modeIndex === 1), 400);
  await wait(200); await shotNow('L2M26_play' + k + '_split');
}
for (let k = 0; k < 3; k++){
  await play('2', 'Motion[1]'); await wait(200);
  await play('2', 'Motion[33]');
  await until(() => shells().some(s => s.shell === 'shell01' && s.state === 1), 400);
  await wait(600); await shotNow('L2M33_play' + k + '_lines', 60);
}
return out;
