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
  for (const [name, fs] of [['Queen L4 Motion[68]_loop + Seltas leaves', [0, 20, 30, 31, 32, 50, 56, 57, 100]],
                            ['Seltas Motion[77] drop off her (1:0x22)', [0, 5, 10, 15, 20, 25, 30, 60, 120, 200, 320, 400]]]){
    clipSel.value = name; await clipSel.onchange();
    await until(async () => V.pose.action && (await V.partner()).mounted && (await V.partner()).unl, 900); await frames(5);
    V.pose.action.paused = true;
    const rows = [];
    for (const f of fs){
      V.pose.action.time = f / 60; await frames(3);
      const q = await V.partner();
      rows.push({ f, frameAt: q.frameAt, root: q.partnerJoint0At, local: q.local, wings: q.wingParts, yaw: q.frameYaw });
    }
    const q = await V.partner();
    out.push([false, name, JSON.stringify({ unl: q.unl, rows })]);
    V.pose.action.paused = false;
  }
  return out;
}
export const pageCheck = probe;
