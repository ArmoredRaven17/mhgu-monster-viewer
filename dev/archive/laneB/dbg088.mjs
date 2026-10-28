async function dbg(){
  const V = window.__view, M = await import('/render/monster.js'), CT = await import('/render/class-threads.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === 'em088_00')) monSel.add(new Option('em088_00', 'em088_00'));
  monSel.value = 'em088_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 600 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule); i++) await frames(1);
  const T = CT.CLASS_THREADS.em088_00, at0 = T.at; const seen = {};
  T.at = (a) => { const r = at0(a); const m = a.motion ? a.motion.list + '|' + a.motion.slot : '-';
    const k = m + ' ' + JSON.stringify(a.action) + ' d420 ' + (a.anchors ? a.anchors.d420.map(A => A ? A.state : '-').join('') : 'none') + ' d450 ' + (a.anchors ? a.anchors.d450.map(A => A ? A.state : '-').join('') : 'none') + ' on ' + r.on.map(o => o.key + '/' + o.slot).join(',');
    seen[k] = (seen[k] || 0) + 1; return r; };
  const play = async (l, c, n, loop) => { if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); } V.state.loop = !!loop; clipSel.value = c; await clipSel.onchange(); await frames(n); V.state.loop = false; };
  await play('2', 'Motion[30]_loop', 300, true); await play('2', 'Motion[1]', 60); await play('2', 'Motion[30]_loop', 300, true);
  await play('2', 'Motion[35]', 280);
  return [[true, 'DBG', JSON.stringify(Object.entries(seen).filter(([k]) => /\|30 |\|35 /.test(k)).slice(0, 40))]];
}
export const pageCheck = dbg;
export const args = [[]];
