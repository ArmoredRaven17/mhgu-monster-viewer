async function dbg(){
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === 'em069_00')) monSel.add(new Option('em069_00', 'em069_00'));
  monSel.value = 'em069_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 600 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule); i++) await frames(1);
  const T = MS.CLASS_TIMERS.em069_00, s0 = T.step; let last = null, calls = 0;
  T.step = (t, c) => { calls++; const r = s0(t, c); last = { lv: t.lv, n: t.n, dt: c.dt, fresh: c.fresh, list: c.list, slot: c.slot, frame: c.frame, act: c.action, rank: c.rank }; return r; };
  const log = [];
  const play = async (l, c, n, loop) => { if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); } clipSel.value = c; await clipSel.onchange(); V.state.loop = !!loop; await frames(n); V.state.loop = false;
    log.push(c + ' calls ' + calls + ' ' + JSON.stringify(last)); };
  await play('4', 'Motion[66]', 180);
  await play('0', 'Motion[1]_loop', 400, true);
  await play('0', 'Motion[1]_loop', 400, true);
  log.push('opts ' + [...clipSel.options].map(o => o.value).filter(v => /Motion\[1\]_/.test(v)).join(','));
  return [[true, 'DBG', JSON.stringify(log)]];
}
export const pageCheck = dbg;
export const args = [[]];
