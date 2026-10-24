export const args = [];
export async function pageCheck(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em036_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange(); await V.effects(false); await V.effects(true);
  await until(() => body() && body().monsterId === MON && body().schedule);
  const yawOf = m => Math.atan2(m[8], m[10]) * 180 / Math.PI;     // the joint's z axis, x/z
  const probe = async (list, clip, nf) => {
    listSel.value = list; await listSel.onchange();
    clipSel.value = clip; await clipSel.onchange();
    const rows = [];
    for (let i = 0; i < nf; i++){
      await frames(1);
      const S = body().schedule.shells, J = S && S.joints;
      const j0 = J && J(0), j1 = J && J(1), j2 = J && J(2);
      const ex = V.shellExtra ? V.shellExtra() : {};
      const st = S && S.state;
      const sh = st ? st.shells.filter(s => s.shell === 'shell00' && (s.modeIndex >= 5 && s.modeIndex <= 7)).map(s => [s.modeIndex, s.angles && (s.angles[1] & 0xffff), s.velocity && s.velocity.map(v => +v.toFixed(1))]) : [];
      if (i % 10 === 0 || sh.length) rows.push({ i, yaw0: j0 && +yawOf(j0).toFixed(1), head: j2 && j0 && +(Math.atan2(j2[12] - j0[12], j2[14] - j0[14]) * 180 / Math.PI).toFixed(1), sh });
      if (sh.length) break;
    }
    out.push([false, list + '|' + clip, JSON.stringify(rows.slice(-6))]);
  };
  await probe('2', 'Motion[10]', 30);
  await probe('2', 'Motion[12]', 20);
  out.push([false, 'owner', JSON.stringify(V.shellExtra && V.shellExtra().ownerPos)]);
  return out;
}
