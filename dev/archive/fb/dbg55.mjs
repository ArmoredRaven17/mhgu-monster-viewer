export const args = [];
export async function pageCheck(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em082_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => body() && body().monsterId === MON && body().schedule);
  listSel.value = '2'; await listSel.onchange();
  clipSel.value = 'Motion[55]'; await clipSel.onchange();
  const log = [];
  for (let i = 0; i < 600; i++){
    await frames(1);
    const S = body().schedule, st = S.shells && S.shells.state;
    const live = (st ? st.shells : []).map(s => s.shell + ':' + s.modeIndex + ':' + s.state + (s.request ? 'R' : ''));
    const reqs = S.entries.filter(e => e.when === 'shell').map(e => e.def.record.key + 'x' + e.requests.length).filter(x => !x.endsWith('x0'));
    if (i % 25 === 0 || body().failed) log.push([i, live.join(' '), reqs.join(' ')]);
    if (body().failed){ log.push(['FAILED', String(body().failed)]); break; }
  }
  out.push([false, 'log', JSON.stringify(log)]);
  return out;
}
