const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
if (![...monSel.options].some(o => o.value === 'em063_00')) monSel.add(new Option('em063_00', 'em063_00'));
monSel.value = 'em063_00'; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === 'em063_00' && M.effectRuntimeInstance().schedule);
const out = {};
async function punch(level, name){
  M.setArmSlimeLevel(V.mounted.main, 1, level);      // the right arm (slot 1)
  const S = M.effectRuntimeInstance().schedule, fired = [];
  const f0 = S.fire.bind(S); S.fire = (p, k) => { fired.push('fire ' + k); return f0(p, k); };
  const s0 = S.start.bind(S); S.start = e => { fired.push((e.when || '') + ' ' + (e.def && e.def.record ? e.def.record.key : '?')); return s0(e); };
  if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
  clipSel.value = 'Motion[5]'; await clipSel.onchange(); await wait(300);   // another clip first, so M8 starts a fresh play
  fired.length = 0;
  clipSel.value = 'Motion[8]'; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === 'Motion[8]');
  await until(() => V.pose.action.time * 60 >= 16, 300);
  const t = V.pose.action.time;
  const shot = await V.shot('brachy-punch', name, t);
  S.fire = f0; S.start = s0;
  out[name] = { level, levels: M.armSlimeLevels(V.mounted.main), mask: V.plays ? V.plays.mask : undefined, fired: fired.slice(), atFrame: Math.round(t * 60), shot: shot && shot.saved };
}
await punch(0, 'right_arm_level0');
await punch(2, 'right_arm_level2');
M.setArmSlimeLevel(V.mounted.main, null, 2);
return out;
