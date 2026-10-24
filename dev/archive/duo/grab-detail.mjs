// grab-detail: per-frame pincer -> his root distance on the grab clips, and the held M78 pose against his M79 played solo
async function pageGrabDetail(){
  const out = [];
  const V = window.__view;
  const SK = await import('/render/skeleton.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const pick = async (mon, list, clip) => {
    if (V.state.id !== mon){ if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon)); monSel.value = mon; await monSel.onchange(); }
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    clipSel.value = clip; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === clip, 300); await frames(2);
  };
  const gb = (root, gid) => { const b = SK.gidBonesOf(root).find(x => x.gid === gid); return b && b.node; };
  const wp = n => { n.updateWorldMatrix(true, false); return new (V.scene.position.constructor)().setFromMatrixPosition(n.matrixWorld); };
  await pick('em069_00', '4', 'Motion[36]');
  await V.partner(true);
  for (const [list, clip] of [['4', 'Motion[27]_start'], ['4', 'Motion[27]_loop'], ['4', 'Motion[28]'], ['4', 'Motion[76]_start'], ['4', 'Motion[76]_loop'],
                               ['4', 'Motion[77]'], ['4', 'Motion[78]_loop'], ['4', 'Motion[79]'], ['4', 'Motion[96]']]){
    await pick('em069_00', list, clip);
    V.pose.action.paused = true;
    const F = Math.round(V.pose.action.getClip().duration * 60), prof = [];
    for (let f = 0; f <= F; f += 4){
      V.pose.action.time = Math.min(f, F - 0.01) / 60; await frames(2); await V.partner();
      const m = V.mounted.main, pc = wp(gb(m, 160)).add(wp(gb(m, 161))).multiplyScalar(0.5);
      const s = V.mounted.em076_00;
      prof.push(s ? +pc.distanceTo(wp(gb(s, 0))).toFixed(2) : null);
    }
    V.pose.action.paused = false;
    out.push([false, 'profile ' + list + '|' + clip, JSON.stringify({ step: 4, prof })]);
  }
  // the held pose: his local bone rotations under her M78 (frozen) vs his M79 loop solo on Seltas at frames 3, 4, 5
  await pick('em069_00', '4', 'Motion[78]_loop');
  V.pose.action.paused = true; V.pose.action.time = 40 / 60; await frames(2); const pr = await V.partner();
  const held = {}; V.mounted.em076_00.traverse(o => { if (o.isBone) held[o.name] = o.quaternion.clone(); });
  const mounted = { clip: pr.clip, local: pr.local, hold: pr.hold };
  V.pose.action.paused = false;
  const solo = {};
  await pick('em076_00', '4', 'Motion[79]_loop');
  V.pose.action.paused = true;
  for (const f of [0, 2, 3, 4, 5, 6, 10, 30]){
    V.pose.action.time = f / 60; await frames(3);
    const q = {}; V.mounted.main.traverse(o => { if (o.isBone) q[o.name] = o.quaternion.clone(); });
    let m = 0, n = 0;
    for (const k of Object.keys(held)) if (q[k]){ n++; m = Math.max(m, 2 * Math.acos(Math.min(1, Math.abs(held[k].dot(q[k]))))); }
    solo[f] = { bones: n, maxDiff: +m.toFixed(4) };
  }
  out.push([false, 'held M78 pose vs his M79 loop solo', JSON.stringify({ mounted, solo })]);
  // and the pose at frame 4 against his ride M35 frame 0: which bones are furthest from a resting pose
  await pick('em076_00', '4', 'Motion[35]_loop'); V.pose.action.paused = true; V.pose.action.time = 0; await frames(3);
  const rest = {}; V.mounted.main.traverse(o => { if (o.isBone) rest[o.name] = o.quaternion.clone(); });
  const far = Object.keys(held).filter(k => rest[k]).map(k => [k, +(2 * Math.acos(Math.min(1, Math.abs(held[k].dot(rest[k]))))).toFixed(2)]).sort((a, b) => b[1] - a[1]).slice(0, 12);
  out.push([false, 'held pose vs his ride frame 0, furthest bones', JSON.stringify(far)]);
  V.pose.action.paused = false;
  return out;
}
export const pageCheck = pageGrabDetail;
