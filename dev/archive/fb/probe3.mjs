// probe3.mjs (run-check; P3='["em025_00","2","Motion[45]",3,90]'): at each frame of one play, the floor the shells get (rockInput's
// floorY), joint g's world point as the shells see it, the owner position -- around the spawn frame
async function probe3(MON, list, clip, g, nf){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = k => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, k = 600) => { for (let i = 0; i < k; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  V.state.loop = true;
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value.replace(/_(start|loop)$/, '') === clip);
  clipSel.value = o.value; await clipSel.onchange();
  const rows = [];
  for (let k = 0; k < nf; k++){
    await frames(1);
    const rt = M.effectRuntimeInstance(), sc = rt && rt.schedule;
    if (!sc || !sc.shells) continue;
    const ri = sc.rockInput ? sc.rockInput() : null, J = sc.shells.joints, m = J ? J(g) : null, P = rt.parent && rt.parent.position;
    const c = sc.clip;
    rows.push([c ? Math.round(c.frame) : null, ri ? Math.round(ri.floorY) : null, m ? [Math.round(m[12]), Math.round(m[13]), Math.round(m[14])] : null, P ? P.map(Math.round) : null]);
  }
  out.push([false, 'P3 ' + MON, JSON.stringify(rows.filter((r, i) => i % 5 === 0 || (r[0] >= 66 && r[0] <= 74)))]);
  return out;
}
export const pageCheck = probe3;
export const args = (typeof process !== 'undefined' && process.env.P3) ? [JSON.parse(process.env.P3)] : [];
