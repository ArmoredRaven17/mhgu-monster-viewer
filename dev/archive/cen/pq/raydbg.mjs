async function rd(){
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === 'em063_05')) monSel.add(new Option('em063_05', 'em063_05'));
  monSel.value = 'em063_05'; await monSel.onchange(); await until(() => V.mounted.main, 900); await frames(30);
  const SK = await import('/render/skeleton.js'); const gb = SK.gidBonesOf(V.mounted.main);
  const e = gb.find(x => x.gid === 3), b = e.leaf || e.node;
  const C = V.camera.position.constructor;
  const w = b.getWorldPosition(new C());
  const dir = w.clone().sub(V.camera.position).normalize();
  const out = { cam: V.camera.position.toArray(), bone: w.toArray(), worldScale: V.world.scale.toArray() };
  // a raycaster from three's module the page uses
  const T = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
  const ray = new T.Raycaster(V.camera.position.clone(), dir);
  const hits = ray.intersectObject(V.mounted.main, true);
  out.hits = hits.slice(0, 8).map(h => ({ name: h.object.name, type: h.object.type, prim: h.object.userData.prim, vis: h.object.visible, dist: +h.distance.toFixed(2), proxy: !!h.object.userData.proxy, face: h.face && h.face.a }));
  const ms = []; V.mounted.main.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && ms.length < 4){ o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; const sc = new C(); o.getWorldScale(sc); ms.push({ name: o.name, type: o.type, prim: o.userData.prim, vis: o.visible, mat: o.material && o.material.type, bb: [bb.min.toArray().map(v => +v.toFixed(1)), bb.max.toArray().map(v => +v.toFixed(1))], sc: sc.toArray().map(v => +v.toFixed(3)), bs: o.boundingSphere ? [o.boundingSphere.center.toArray().map(v => +v.toFixed(2)), +o.boundingSphere.radius.toFixed(2)] : null, frust: o.frustumCulled }); } });
  out.ms = ms;
  out.boneDist = +w.distanceTo(V.camera.position).toFixed(2);
  return [[false, 'RAYDBG', JSON.stringify(out)]];
}
export const pageCheck = rd;
export const args = [[]];
