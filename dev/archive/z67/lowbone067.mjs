// Zamtrios: which bones are lowest on a few clips (name, y rel. origin in game units), and the skinned mesh's lowest vertex
async function lowProbe(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const MON = 'em067_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange(); await frames(5);
  const THREE = await import('/vendor/three.module.js').catch(() => null);
  for (const [list, clip, fs] of [['0', 'Motion[1]_loop', [0, 150]], ['4', 'Motion[1]_loop', [0, 150]], ['4', 'Motion[2]', [0, 100, 200, 280]], ['3', 'Motion[100]', [0, 60]], ['4', 'Motion[12]', [0, 100, 215]], ['0', 'Motion[16]_start', [0]], ['3', 'Motion[29]', [5]]]){
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); await frames(3); }
    clipSel.value = clip; await clipSel.onchange(); await frames(3);
    const act = V.pose.action, cr = V.pose.mixer.getRoot();
    const ws = V.world.scale.y || 1, wy = V.world.position.y;
    for (const f of fs){
      act.paused = true; act.time = f / 60; V.pose.mixer.update(0); await frames(2);
      V.scene.updateMatrixWorld(true);
      const bones = [];
      cr.traverse(n => { if (n.isBone || n.type === 'Bone' || n.isObject3D){ const e = n.matrixWorld.elements; bones.push([n.name, ((e[13] - wy) / ws - cr.position.y) * 100]); } });
      bones.sort((a, b) => a[1] - b[1]);
      // the drawn model's mesh: lowest vertex over visible skinned meshes (world), via Box3.setFromObject (precise)
      let meshLow = null;
      const root = V.mounted.main;
      if (root){
        let lo = Infinity;
        root.traverse(o => { if (o.isMesh && o.visible){ o.updateWorldMatrix(true, false);
          const pos = o.geometry.attributes.position; const v = { x: 0, y: 0, z: 0 };
          if (o.isSkinnedMesh && o.getVertexPosition){ const t = new o.matrixWorld.elements.constructor(3);
            const vec = o.position.clone(); for (let i = 0; i < pos.count; i += 3){ o.getVertexPosition(i, vec); vec.applyMatrix4(o.matrixWorld); if (vec.y < lo) lo = vec.y; } } } });
        meshLow = ((lo - wy) / ws - cr.position.y) * 100;
      }
      out.push([false, list + '|' + clip + ' f' + f, JSON.stringify({ lowestBones: bones.slice(0, 5).map(b => [b[0], +b[1].toFixed(1)]), meshLowest: meshLow && +meshLow.toFixed(1), crY: cr.position.y, ws, rootName: cr.name, mainIsCr: V.mounted.main === cr })]);
      act.paused = false;
    }
  }
  return out;
}
export const pageCheck = lowProbe;
