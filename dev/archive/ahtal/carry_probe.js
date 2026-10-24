// PROBE: Ahtal-Ka's Carrying control, the held piece on joint 130, the words per carry value, u 120 / u 130.
const V = window.__view;
const THREE = await import('three');
const SK = await import('/render/skeleton.js');
const M = await import('/render/monster.js');
const PM = await import('/render/psl-mask.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = {};
const id = 'em088_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
const fx = M.effectRuntimeInstance(), S = fx.schedule;
const row = document.getElementById('monCarryRow'), sel = document.getElementById('monCarry');
out.row = { hidden: row.hidden, options: [...sel.options].map(o => [o.value, o.textContent]), value: sel.value, state: V.state.carry };
const bones = SK.gidBonesOf(V.mounted.main);
const j130 = bones.find(b => b.gid === 130).node;
const prop = () => V.world.children.find(o => o.userData && o.userData.heldProp) || null;
const setCarry = async v => { sel.value = String(v); await sel.onchange({ target: sel }); await wait(300); };
const play = async (list, clip) => {
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options];
  const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
  if (!o) return null;
  clipSel.value = o.value; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  await wait(200);
  return o.value;
};
const f2 = v => v.toArray().map(x => +x.toFixed(2));
async function shoot(name, frame){
  const p = prop();
  V.pose.action.time = frame / 60; V.pose.action.paused = true;
  await wait(120);
  V.world.updateMatrixWorld(true);
  const bb = new THREE.Box3();
  for (const b of bones) bb.expandByPoint(new THREE.Vector3().setFromMatrixPosition(b.node.matrixWorld));
  const bg = new THREE.Box3();
  if (p && p.visible) p.traverse(o => { if (o.isSkinnedMesh && o.visible){ o.skeleton.update(); o.computeBoundingBox(); bg.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const all = bb.clone(); if (!bg.isEmpty()) all.union(bg);
  const c = all.getCenter(new THREE.Vector3()), size = all.getSize(new THREE.Vector3()).length();
  const side = new THREE.Vector3(1, 0, 0.35).normalize();
  V.controls.target.copy(c);
  V.camera.position.copy(c).addScaledVector(side, size * 0.95).addScaledVector(new THREE.Vector3(0, 1, 0), size * 0.5);
  V.camera.near = Math.max(0.01, size / 500); V.camera.far = size * 40; V.camera.updateProjectionMatrix(); V.controls.update();
  const r = await V.shot('em088-carry', name, frame / 60);
  const jp = new THREE.Vector3().setFromMatrixPosition(j130.matrixWorld);
  const pp = p ? new THREE.Vector3().setFromMatrixPosition(p.matrixWorld) : null;
  return { saved: r && r.saved, clip: V.pose.action.getClip().name, frame, prop: p ? p.name : null, visible: !!(p && p.visible),
           joint130: f2(jp), propOrigin: pp ? f2(pp) : null, dist: pp ? +pp.distanceTo(jp).toFixed(3) : null,
           propBox: bg.isEmpty() ? null : [f2(bg.min), f2(bg.max)], body: [f2(bb.min), f2(bb.max)], mask: S.clip && S.clip.mask != null ? '0x' + (S.clip.mask >>> 0).toString(16) : null };
}
out.shots = {};
const names = { 0: 'pole', 1: 'wheel', 2: 'frame', 4: 'nothing' };
for (const v of [0, 1, 2]){
  await setCarry(v);
  for (const [clip, frame] of [['Motion[4]', 140], ['Motion[14]', 200], ['Motion[36]', 250]]){
    await play('2', clip);
    out.shots[names[v] + '_' + clip] = await shoot('L2' + clip.replace(/\D+/g, 'M').replace(/M$/, '') + '_f' + frame + '_' + names[v], frame);
  }
}
await setCarry(4);
await play('2', 'Motion[4]');
out.shots.nothing_M4 = await shoot('L2M4_f140_nothing', 140);
// an ailment row (L3 M14, paralysis (10, 0x1f)) and a reaction that keeps it (L3 M2, (10, 7))
await setCarry(0);
await play('3', 'Motion[14]');
out.shots.pole_L3M14 = await shoot('L3M14_f30_pole_paralysis', 30);
await play('3', 'Motion[2]');
out.shots.pole_L3M2 = await shoot('L3M2_f30_pole_reaction', 30);
await play('0', 'Motion[13]');
out.shots.pole_L0M13 = await shoot('L0M13_f30_pole_tired', 30);
await play('3', 'Motion[19]');
out.shots.pole_L3M19 = await shoot('L3M19_f30_pole_death', 30);
await play('2', 'Motion[4]');
out.shots.pole_back_M4 = await shoot('L2M4_f140_pole_back', 140);
// the words per carry value (pslMask as playNow calls it), and live on L2 M4
out.words = {};
for (const v of [4, 0, 1, 2]){
  out.words['carry ' + v] = {
    L2M4: '0x' + PM.pslMask(id, '2', 4, null, { rage: false, tired: false, carry: PM.em088CarryAt(null, v) }).toString(16),
    L2M30_1c: '0x' + PM.pslMask(id, '2', 30, [1, 0x1c], { carry: PM.em088CarryAt([1, 0x1c], v) }).toString(16),
    L2M30_1e: '0x' + PM.pslMask(id, '2', 30, [1, 0x1e], { carry: PM.em088CarryAt([1, 0x1e], v) }).toString(16),
    L3M3_af: '0x' + PM.pslMask(id, '3', 3, [10, 0xaf], { carry: PM.em088CarryAt([10, 0xaf], v) }).toString(16),
    L3M2_07: '0x' + PM.pslMask(id, '3', 2, [10, 7], { carry: PM.em088CarryAt([10, 7], v) }).toString(16),
    L2M17_2f: '0x' + PM.pslMask(id, '2', 17, [2, 0xf], { carry: PM.em088CarryAt([2, 0xf], v) }).toString(16),
    L2M17_7_10: '0x' + PM.pslMask(id, '2', 17, [7, 0x10], { carry: PM.em088CarryAt([7, 0x10], v) }).toString(16),
  };
}
out.liveWords = {};
for (const v of [4, 0, 1, 2]){
  await setCarry(v);
  await play('2', 'Motion[6]'); V.pose.action.paused = false; await wait(400);
  out.liveWords['carry ' + v + ' L2M6'] = S.clip && S.clip.mask != null ? '0x' + (S.clip.mask >>> 0).toString(16) : null;
}
// u 120 / u 130
const live = key => S.entries.filter(e => e.def.record && e.def.record.key === key && (e.when === 'always' || e.when === 'rage'))
  .map(e => e.when + ':' + e.requests.filter(q => !q.stopped).length + '/' + e.requests.length).join(',');
await setCarry(4);
await play('0', 'Motion[1]'); V.pose.action.paused = false; await wait(300);
out.holds = { calm_L0M1: { u120: live(120), u130: live(130), rage: S.rage } };
const rageBox = document.getElementById('monRage');
rageBox.checked = true; rageBox.dispatchEvent(new Event('change')); await wait(500);
out.holds.enraged_L0M1 = { u120: live(120), u130: live(130), rage: S.rage };
await play('2', 'Motion[28]'); V.pose.action.paused = false; await wait(400);
out.holds.enraged_L2M28 = { u120: live(120), u130: live(130), rage: S.rage };
await play('0', 'Motion[1]'); V.pose.action.paused = false; await wait(400);
out.holds.enraged_back_L0M1 = { u120: live(120), u130: live(130), rage: S.rage };
await play('3', 'Motion[19]'); V.pose.action.paused = false; await wait(400);
out.holds.death = { u120: live(120), u130: live(130), rage: S.rage };
await play('0', 'Motion[1]'); V.pose.action.paused = false; await wait(400);
out.holds.after_death = { u120: live(120), u130: live(130), rage: S.rage };
rageBox.checked = false; rageBox.dispatchEvent(new Event('change')); await wait(500);
out.holds.calm_again = { u120: live(120), u130: live(130), rage: S.rage };
out.failed = fx.failed || null;
out.errors = (window.__errors || []).slice(-5);
return out;
