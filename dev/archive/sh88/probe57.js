// PROBE: Ahtal-Ka's shell57 in the live viewer -- the throw (L2 M17, 7:0x10 / 7:0x32 at 160), a drop (L3 M3 at its start, L2 M28
// 1:0x06), the pull (L2 M19 at 92, from the spot a throw's end left), the model each shell draws, the held piece's hiding.
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
const S = () => M.effectRuntimeInstance().schedule;
// HIS EFFECTS ARE NOT ALL RECORDED (the soak's 29 / 49 refusals): the first unrecorded one stops the whole runtime, shells with
// it. For this probe only, the runtime keeps the shells' entries alone (none of his shell records is exported yet), so the
// shells step; the models draw from the shells (index.html stepShellModels)
const RT = M.effectRuntimeInstance();
RT.schedule.entries = RT.schedule.entries.filter(e => e.when === 'shell');
RT.failed = null;
out.entriesKept = RT.schedule.entries.length;
const T0 = V.controls.target.clone();
const sel = document.getElementById('monCarry');
const setCarry = async v => { sel.value = String(v); await sel.onchange({ target: sel }); await wait(300); };
await setCarry(0);
const shells = () => (S().shells && S().shells.state ? S().shells.state.shells : []);
const held = () => V.world.children.find(o => o.userData && o.userData.heldProp) || null;
const smodel = () => V.world.children.filter(o => o.userData && o.userData.shellModel);
async function play(list, base){
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options].map(o => o.value);
  clipSel.value = opts.find(v => v === base) || opts.find(v => v === base + '_start') || opts.find(v => v === base + '_loop');
  await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(base), 300);
}
function cam(){
  // frame the monster (its opening target) and every live shell, from his side
  const pts = [T0.clone()].concat(shells().filter(s => s.base === 'base57' && s.drawn).map(s => new THREE.Vector3(s.position[0] * 0.01, s.position[1] * 0.01, s.position[2] * 0.01)));
  const box = new THREE.Box3().setFromPoints(pts);
  const c = box.getCenter(new THREE.Vector3()), size = Math.max(14, box.getSize(new THREE.Vector3()).length() * 1.6);
  V.controls.target.copy(c);
  V.camera.position.set(c.x + size * 0.9, c.y + size * 0.35, c.z + size * 0.35);
  V.camera.near = 0.05; V.camera.far = size * 20; V.camera.updateProjectionMatrix(); V.controls.update();
}
const snap = () => shells().filter(s => s.base === 'base57').map(s => ({ id: s.id, mode: s.modeIndex, b: s.behaviour, st: s.state, ph: s.phase,
  pos: s.position.map(v => Math.round(v)), words: s.angles.slice(), drawn: s.drawn, model: s.model && s.model.part }));
const frame = () => S().clip ? Math.round(S().clip.frame) : null;
async function shotNow(name){
  cam();
  const m = smodel();
  const r = await V.shot('em088-shell57', name, V.pose.action.time); V.pose.action.timeScale = 1;
  out.log.push({ name, frame: frame(), clip: V.pose.action.getClip().name, shells: snap(), models: m.map(o => ({ name: o.name, visible: o.visible,
    at: new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).toArray().map(v => +v.toFixed(2)) })),
    held: held() ? held().visible : null, refused: (S().shellTally || {}).refused, saved: r && r.saved && r.saved.split(/[\\/]/).pop() });
}
// THE THROW: plays of L2 M17 until one is a throw (the picks go 2:0x0f, 7:0x10, 7:0x32)
let thrown = false;
for (let k = 0; k < 4 && !thrown; k++){
  await play('2', 'Motion[17]');
  V.pose.action.timeScale = 1;
  const t0 = performance.now();
  await until(() => shells().some(s => s.base === 'base57') || (frame() != null && frame() > 200), 900);
  thrown = shells().some(s => s.base === 'base57');
  if (!thrown){ await play('2', 'Motion[1]'); await wait(200); }
}
out.thrown = thrown;
if (thrown){
  await shotNow('L2M17_throw_release');
  await wait(400); await shotNow('L2M17_throw_flight');
  await until(() => shells().some(s => s.base === 'base57' && s.phase === 3), 400);
  await shotNow('L2M17_throw_landed');
  await until(() => shells().some(s => s.base === 'base57' && s.phase === 3 && s.sub === 1), 400);
  await wait(150); await shotNow('L2M17_throw_settling');
  await until(() => shells().some(s => s.base === 'base57' && s.state === 0xfe) || !shells().some(s => s.base === 'base57'), 600);
  await wait(100); await shotNow('L2M17_throw_rest');
}
out.spots = JSON.parse(JSON.stringify(S().shells.state.spots088 || {}));
// THE PULL from that spot
await play('2', 'Motion[19]');
await until(() => shells().some(s => s.base === 'base57' && s.behaviour === 3), 600);
await wait(150); await shotNow('L2M19_pull_flight');
await until(() => !shells().some(s => s.base === 'base57' && s.behaviour === 3 && s.state === 2), 400);
await shotNow('L2M19_pull_arrived');
// A DROP at an action's start (L3 M3: every action drops) and (1, 6) on L2 M28
await play('3', 'Motion[3]');
await until(() => shells().some(s => s.base === 'base57' && s.behaviour === 2), 300);
await wait(300); await shotNow('L3M3_drop_flight');
await until(() => !shells().some(s => s.base === 'base57' && s.behaviour === 2 && s.state === 2), 400);
await shotNow('L3M3_drop_rest');
let dropped4 = false;
for (let k = 0; k < 3 && !dropped4; k++){
  await play('2', 'Motion[28]');
  await until(() => shells().some(s => s.base === 'base57' && s.behaviour === 4), 120);
  dropped4 = shells().some(s => s.base === 'base57' && s.behaviour === 4);
  if (!dropped4){ await play('2', 'Motion[1]'); await wait(200); }
}
if (dropped4){ await wait(400); await shotNow('L2M28_drop16_flight'); V.pose.action.paused = false; }
// the held piece on L2 M17 under the throw before 160: shown; L2 M19: hidden
out.carryNow = V.carryNow ? 'n/a' : 'n/a';
out.failed = M.effectRuntimeInstance().failed ? String(M.effectRuntimeInstance().failed) : null; out.starts = M.effectRuntimeInstance().schedule.starts; out.tally = M.effectRuntimeInstance().schedule.shellTally;
return out;
