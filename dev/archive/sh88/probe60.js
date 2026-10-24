// PROBE: Ahtal-Ka's web anchors (shell60 / shell61) in the live viewer: L2 M30's plays (picks 1:0x1c / 1:0x1e / 1:0x22 / 1:0x24),
// the anchors made at each play's wrap, their flight to the web point, the hang, webAnchors088; then an L3 clip's release.
const V = window.__view;
const THREE = await import('three');
const M = await import('/render/monster.js');
const SH = await import('/render/shells.js');
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
RT.schedule.entries = RT.schedule.entries.filter(e => e.when === 'shell');   // his unrecorded clip effects stop the runtime
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
function cam(){
  const pts = [T0.clone()].concat(shells().filter(s => s.base === 'base60' || s.base === 'base61').map(s => new THREE.Vector3(s.position[0] * 0.01, s.position[1] * 0.01, s.position[2] * 0.01)));
  const box = new THREE.Box3().setFromPoints(pts);
  const c = box.getCenter(new THREE.Vector3()), size = Math.max(16, box.getSize(new THREE.Vector3()).length() * 1.5);
  V.controls.target.copy(c);
  V.camera.position.set(c.x + size * 0.8, c.y + size * 0.45, c.z + size * 0.6);
  V.camera.near = 0.05; V.camera.far = size * 20; V.camera.updateProjectionMatrix(); V.controls.update();
}
const snap = () => shells().filter(s => s.base === 'base60' || s.base === 'base61').map(s => ({ id: s.id, sh: s.shell, mode: s.modeIndex, st: s.state, sub: s.sub,
  ph: s.phase, pos: s.position.map(v => Math.round(v)), stream: s.stream || null }));
async function shotNow(name){
  cam();
  const r = await V.shot('em088-webs', name, V.pose.action.time); V.pose.action.timeScale = 1;
  out.log.push({ name, clip: V.pose.action.getClip().name, shells: snap(), anchors: SH.webAnchors088(S().shells.state),
                 starts: S().starts, refused: (S().shellTally || {}).refused, saved: r && r.saved && r.saved.split(/[\\/]/).pop() });
}
for (let k = 0; k < 4; k++){
  await play('2', 'Motion[1]'); await wait(200);
  await play('2', 'Motion[30]');
  const n0 = shells().filter(s => s.base === 'base60' || s.base === 'base61').length;
  await until(() => (S().shellTally || {}).spawned > 0 && shells().some(s => (s.base === 'base60' || s.base === 'base61') && s.id > (out.lastId || 0)), 900);
  out.lastId = Math.max(0, ...shells().map(s => s.id));
  await wait(1500); await shotNow('L2M30_play' + k + '_planted');
  await until(() => shells().some(s => (s.base === 'base60' || s.base === 'base61') && s.state === 1 && s.phase === 2), 600);
  await wait(250); await shotNow('L2M30_play' + k + '_flight');
  await until(() => shells().filter(s => (s.base === 'base60' || s.base === 'base61') && s.state === 1).every(s => s.sub === 1), 900);
  await wait(700); await shotNow('L2M30_play' + k + '_hang');
}
await play('3', 'Motion[2]');
await wait(600);
await shotNow('L3M2_released');
out.failed = RT.failed ? String(RT.failed) : null;
return out;
