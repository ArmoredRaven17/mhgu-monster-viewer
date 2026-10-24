// Savage's joints 200 / 201 on the first frames after he is mounted, and Deviljho's (calm, then enraged) for contrast
async function savage(){
  const out = [];
  const V = window.__view;
  const SK = await import('/render/skeleton.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel');
  for (const MON of ['em043_05', 'em043_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    const bone = gid => (SK.gidBonesOf(V.mounted.main).find(x => x.gid === gid) || {}).node;
    const read = () => { const a = bone(200), b = bone(201); return a && b ? [a.scale.x, a.scale.y, b.scale.x, b.scale.y].map(v => +v.toFixed(3)) : null; };
    const seen = [];
    for (let i = 0; i < 4; i++){ await frames(1); seen.push(read()); }
    out.push([false, MON + ' first frames (200 x/y, 201 x/y)', JSON.stringify(seen)]);
  }
  return out;
}
export const pageCheck = savage;
