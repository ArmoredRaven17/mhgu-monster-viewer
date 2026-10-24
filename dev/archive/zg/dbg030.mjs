// debug: what the first L0 M5 play after L0 M1 takes on Bulldrome, and who requests u 1400
async function dbg(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em030_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON);
  const rt = M.effectRuntimeInstance(), S = rt.schedule;
  const log = [];
  const h0 = rt.holdEvent.bind(rt);
  rt.holdEvent = (pel, key, on) => { if (key === 1400) log.push({ on, clip: V.pose.action && V.pose.action.getClip().name, ms: V.motionStates(), st: new Error().stack.split('\n').slice(2, 5).join(' / ') }); return h0(pel, key, on); };
  const evReq = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const pl = async (list, clip) => { if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip || x.value === clip + '_loop' || x.value === clip + '_start');
    clipSel.value = o.value; await clipSel.onchange(); await frames(6); return o.value; };
  const opts = [...clipSel.options].map(o => o.value).filter(v => /Motion\[5\]/.test(v));
  await pl('0', 'Motion[1]');
  const c1 = await pl('0', 'Motion[5]');
  const first = evReq(1400);
  check(false, 'debug', { opts, c1, first, log: log.map(l => ({ on: l.on, clip: l.clip, ms: l.ms, st: l.st })) });
  return out;
}
export const pageCheck = dbg;
