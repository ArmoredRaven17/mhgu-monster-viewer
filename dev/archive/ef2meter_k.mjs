// ef2meter: the base01 second init starts (mode-4, camera-attached: Kushala c 33 / 34 / 35, Teostra c 34) through the draw meter,
// with the viewer's hunter stand-in where it is (2100 ahead) and at the monster (the range test 0x328d9c's positive control)
async function meter(mon, ctl, plays, keys, near){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, mon + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  const cs = document.getElementById('monClassCtl');
  if (ctl != null && cs){ cs.value = String(ctl); cs.dispatchEvent(new Event('change')); }
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const rt = M.effectRuntimeInstance(), host = rt.schedule.host;
  if (near){ const g0 = host.setGameCamera.bind(host);
    host.setGameCamera = o => { const P = rt.parent && rt.parent.position; return g0(Object.assign({}, o, P ? { hunter: [P[0], P[1] + 100, P[2] + 300] } : {})); }; }
  V.effectMeter(true, { every: 5 });
  for (const [list, clip, n] of plays){
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip);
    if (!o){ check(false, 'the list has ' + list + '|' + clip); continue; }
    clipSel.value = o.value; await clipSel.onchange();
    await frames(n || 400);
  }
  const rep = V.effectMeterReport();
  for (const k of keys){
    const s = rep.recs.find(r => r.key === mon + '|' + k + '|shell');
    check(s && s.starts > 0 && s.litSamples > 0, (near ? 'hunter at him: ' : 'hunter 2100 ahead: ') + k + ' starts and lights',
          s ? { starts: s.starts, lit: s.litSamples + '/' + s.samples, verdict: s.verdict, clips: s.clips } : 'no start');
  }
  V.effectMeter(false);
  if (ctl != null && cs){ cs.value = '0'; cs.dispatchEvent(new Event('change')); }
  return out;
}
export const pageCheck = meter;
const T = ['em027_00', null, [['0', 'Motion[5]', 420], ['0', 'Motion[5]#B', 420]], ['em027_00c|34', 'em027_00c|31']];
const K = ['em024_00', 3, [['0', 'Motion[8]', 400], ['1', 'Motion[16]', 400], ['2', 'Motion[18]', 300], ['0', 'Motion[5]', 300]],
           ['em024_00c|30', 'em024_00c|31', 'em024_00c|32', 'em024_00c|33', 'em024_00c|34', 'em024_00c|35']];
export const args = [['em024_00', 3, [['1', 'Motion[16]', 420]], ['em024_00c|30', 'em024_00c|33'], true]];
