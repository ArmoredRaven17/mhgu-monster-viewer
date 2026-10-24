// PROBE ONLY (nothing here ships): load Ahtal-Neset's three rubble glbs (the same rModel resources 0x8679..0x867b that
// Ahtal-Ka loads into E+0xcb00..+0xcb08, 0x10a40f4), put one on Ahtal-Ka's joint 130 (the uEm088_Rubble unit's
// uCoord parent: +0x30 the owner, +0x34 = 0x82, 0x10af348 / 0x457c8) with an identity local transform, and shoot the
// rubble clips -- to check the joint-130 placement dev/em088-shells-props-spec.md proposes. Untextured (a flat colour),
// because the probe does not run the viewer's material build.
const V = window.__view;
const THREE = await import('three');
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const SK = await import('/render/skeleton.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = {};
const id = 'em088_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(2500);
const main = V.mounted.main;
const bones = SK.gidBonesOf(main);
const j130 = (bones.find(b => b.gid === 130) || {}).node;
out.joint130 = j130 ? j130.name : null;
const loader = new GLTFLoader();
const COL = { em087_00_rubble_01: 0xc0392b, em087_00_rubble_02: 0x2e86c1, em087_00_rubble_03: 0x27ae60 };
const pieces = {};
for (const k of Object.keys(COL)){
  const gl = await loader.loadAsync('/models/monsters/' + k + '.glb');
  const g = gl.scene;
  g.traverse(o => { if (o.isMesh){ o.frustumCulled = false; o.material = new THREE.MeshLambertMaterial({ color: COL[k], side: THREE.DoubleSide }); } });
  g.matrixAutoUpdate = false;
  pieces[k] = g;
}
let cur = null;
const marker = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff00ff, depthTest: false }));
marker.renderOrder = 999; marker.matrixAutoUpdate = false; V.scene.add(marker);
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
function follow(){
  if (!cur) return;
  j130.updateWorldMatrix(true, false);
  j130.matrixWorld.decompose(_p, _q, _s);
  cur.matrix.compose(_p, _q, new THREE.Vector3(1, 1, 1).multiplyScalar(V.world.scale.x || 1));
  cur.matrixWorld.copy(cur.matrix);
  for (const c of cur.children) c.updateMatrixWorld(true);
  marker.matrix.makeTranslation(_p.x, _p.y, _p.z); marker.matrixWorld.copy(marker.matrix);
}
const render0 = V.renderer.render.bind(V.renderer);
V.renderer.render = (sc, cam) => { follow(); return render0(sc, cam); };
async function shoot(piece, list, clip, frame, name, top){
  if (cur) V.scene.remove(cur);
  cur = pieces[piece]; V.scene.add(cur);
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  clipSel.value = clip; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(clip));
  V.pose.action.time = frame / 60; V.pose.action.paused = true;
  await wait(150);
  V.world.updateMatrixWorld(true); follow();
  const bb = new THREE.Box3();
  for (const b of bones) bb.expandByPoint(new THREE.Vector3().setFromMatrixPosition(b.node.matrixWorld));
  const bg = new THREE.Box3();
  cur.traverse(o => { if (o.isSkinnedMesh){ o.skeleton.update(); o.computeBoundingBox(); bg.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const all = bb.clone().union(bg), c = all.getCenter(new THREE.Vector3()), size = all.getSize(new THREE.Vector3()).length();
  // a camera to the side of the body-to-prop line, looking across both
  const away = bg.getCenter(new THREE.Vector3()).sub(bb.getCenter(new THREE.Vector3())); away.y = 0;
  if (away.lengthSq() < 1e-6) away.set(1, 0, 1);
  away.normalize();
  const side = new THREE.Vector3(-away.z, 0, away.x);
  V.controls.target.copy(c);
  if (top) V.camera.position.set(c.x + 0.01, c.y + size * 1.3, c.z + 0.01);
  else V.camera.position.copy(c).addScaledVector(side, size * 0.95).addScaledVector(new THREE.Vector3(0, 1, 0), size * 0.55);
  V.camera.near = Math.max(0.01, size / 500); V.camera.far = size * 40; V.camera.updateProjectionMatrix(); V.controls.update();
  const r = await V.shot('em088-rubble', name, frame / 60);
  const f2 = v => v.toArray().map(x => +x.toFixed(2));
  return { saved: r && r.saved, clip: V.pose.action.getClip().name, frame, body: [f2(bb.min), f2(bb.max)], prop: [f2(bg.min), f2(bg.max)],
           joint130: f2(new THREE.Vector3().setFromMatrixPosition(j130.matrixWorld)), cam: f2(V.camera.position), target: f2(V.controls.target) };
}
out.m4_pole = await shoot('em087_00_rubble_01', '2', 'Motion[4]', 140, 'L2M4_f140_rubble01');
out.m4_pole_top = await shoot('em087_00_rubble_01', '2', 'Motion[4]', 140, 'L2M4_f140_rubble01_top', true);
out.m4_wheel = await shoot('em087_00_rubble_02', '2', 'Motion[4]', 140, 'L2M4_f140_rubble02');
out.m4_frame = await shoot('em087_00_rubble_03', '2', 'Motion[4]', 140, 'L2M4_f140_rubble03');
out.m14 = await shoot('em087_00_rubble_01', '2', 'Motion[14]', 200, 'L2M14_f200_rubble01');
out.m20 = await shoot('em087_00_rubble_02', '2', 'Motion[20]', 120, 'L2M20_f120_rubble02');
out.m36 = await shoot('em087_00_rubble_03', '2', 'Motion[36]', 250, 'L2M36_f250_rubble03');
return out;
