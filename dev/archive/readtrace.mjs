// readtrace.mjs: who reads Deviljho c 30's effect unit +0x2a0..+0x2a3 (the flag payload +0x43 lands in) and who writes its +0x100
// (the speed): the emulated memory's onRead / onWrite hooks, a JS stack at each hit -- the lifted functions are named L_<address>.
async function probe(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const mon = 'em043_00';
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const fx = M.effectRuntimeInstance(), S = fx.schedule, m = fx.host.m;
  const E = S.entries.find(e => e.def.record && e.def.record.pel === 'em043_00c' && e.def.record.key === 30 && e.when === 'clip');
  // watch the next unit this entry's request makes: hook start
  const hits = new Map();
  const stackKey = () => (new Error().stack.match(/L_[0-9a-f]+/g) || []).slice(0, 5).join(' < ');
  let unit = 0;
  const r0 = m.onRead, w0 = m.onWrite;
  m.onRead = (a, size) => { if (unit && a >= unit + 0x2a0 && a < unit + 0x2a4){ const k = 'READ +' + (a - unit).toString(16) + '/' + size + ' ' + stackKey(); hits.set(k, (hits.get(k) || 0) + 1); } if (r0) r0(a, size); };
  m.onWrite = (a, size, b) => { if (unit && a >= unit + 0x100 && a < unit + 0x104){ const k = 'WRITE +100 ' + JSON.stringify(Array.from(b)) + ' ' + stackKey(); hits.set(k, (hits.get(k) || 0) + 1); }
                                 if (unit && a >= unit + 0x2a0 && a < unit + 0x2a4){ const k = 'WRITE +' + (a - unit).toString(16) + ' ' + JSON.stringify(Array.from(b)) + ' ' + stackKey(); hits.set(k, (hits.get(k) || 0) + 1); }
                                 if (w0) w0(a, size, b); };
  // the unit is made inside the start: watch the core's +0x150 array after each step until it appears
  if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === 'Motion[1]') || [...clipSel.options].find(x => x.value === 'Motion[1]_loop');
  clipSel.value = o.value; await clipSel.onchange();
  // the unit address repeats across plays (the heap recycles): take the first request's first unit, then replay to catch its creation
  await until(() => E.requests.some(q => q.effects().length), 400);
  unit = (E.requests.find(q => q.effects().length).effects()[0]) >>> 0;
  clipSel.value = 'Motion[2]'; await clipSel.onchange(); await frames(5);
  clipSel.value = o.value; await clipSel.onchange();
  await frames(80);
  m.onRead = r0; m.onWrite = w0;
  out.push([false, 'TRACE unit 0x' + unit.toString(16), JSON.stringify([...hits.entries()].slice(0, 30))]);
  return out;
}
export const pageCheck = probe;
