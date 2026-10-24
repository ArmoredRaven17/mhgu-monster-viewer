// probe: what action / list / slot Kirin's class timer sees while the roar copy A plays
async function pageCheckKirinProbe(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em011_00')) monSel.add(new Option('em011_00', 'em011_00'));
  monSel.value = 'em011_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule);
  const MS = await import('/render/motion-states.js'), T = MS.CLASS_TIMERS.em011_00, seen = [];
  const s0 = T.step;
  T.step = (t, c) => { const r = s0(t, c); seen.push([c.list, c.slot, Math.round(c.frame), JSON.stringify(c.action), c.rage, r.map(x => x[1]).join()]); return r; };
  const rb = document.getElementById('monRage'); if (rb && !rb.checked){ rb.checked = true; await rb.onchange({ target: rb }); await frames(3); }
  listSel.value = '4'; await listSel.onchange();
  const roar = [...clipSel.options].find(x => x.value === 'Motion[7]');
  clipSel.value = roar.value; await clipSel.onchange(); await frames(20);
  out.push([true, 'opts ' + [...clipSel.options].filter(x => x.value.startsWith('Motion[7]')).map(x => x.value).join(' ') + ' variant=' + V.state.clipVariant, '']);
  out.push([true, 'seen ' + JSON.stringify(seen.slice(0, 6)) + ' ... ' + JSON.stringify(seen.slice(-3)), '']);
  return out;
}
export const pageCheck = pageCheckKirinProbe;
