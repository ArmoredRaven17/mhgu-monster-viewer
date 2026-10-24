async function probe(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em069_00')) monSel.add(new Option('em069_00', 'em069_00'));
  monSel.value = 'em069_00'; await monSel.onchange();
  listSel.value = 'duo'; await listSel.onchange();
  clipSel.value = 'Queen L4 Motion[68]_loop + Seltas leaves'; await clipSel.onchange();
  await until(async () => V.pose.action && (await V.partner()).mounted, 900); await frames(5);
  V.pose.action.paused = true;
  const rows = [];
  for (const f of [0, 29, 30, 31, 32, 40]){
    V.pose.action.time = f / 60; await frames(3);
    const q = await V.partner();
    const a = V.attached && V.attached.get ? null : null; rows.push({ f, frameAt: q.frameAt, joint200: q.bodyJointAt, root: q.partnerJoint0At, local: q.local, frameScale: q.frameScale, worldScale: q.worldScale });
  }
  out.push([false, 'units', JSON.stringify({ world: { s: V.world.scale.toArray(), p: V.world.position.toArray() }, rows })]);
  return out;
}
export const pageCheck = probe;
