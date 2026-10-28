// liftprobe.mjs (run-check.mjs): the re-entry entry's hand-off frame by frame (entry frames 296..310): Neset's partner clip key @ frame
// as his effect runtime holds it, his shells' pick variant (schedule.rockInput), the action clock (actNow / actRow), and the (1, 8) lift.
async function liftProbe(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), EM = await import('/render/rom/effect-mounts.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em088_00')) monSel.add(new Option('em088_00', 'em088_00'));
  monSel.value = 'em088_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em088_00', 900);
  const L = (V.MON.monsters.find(m => m.id === 'em088_00').lists || []).find(l => l.id === 'neset');
  const c = L.clips.find(x => /re-enters/.test(x.clip));
  V.state.loop = false;
  listSel.value = 'neset'; await listSel.onchange();
  clipSel.value = c.clip; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === c.clip, 600);
  await until(() => V.mounted.em087_00, 600);
  const rows = [];
  for (let i = 0; i < 2000; i++){
    await raf();
    const t = V.pose.action ? +(V.pose.action.time * 60).toFixed(2) : -1;
    if (t < 298 || (t > 306 && t < 408)) continue;
    const prt = EM.partnerEffectRuntime(), sc = prt && prt.schedule, pc = sc && sc.clip, ss = sc && sc.shells && sc.shells.state;
    const ri = sc && sc.rockInput ? sc.rockInput() : null;
    const lift = ss ? ss.shells.filter(s => s.base === 'base57' && s.modeIndex === 0x19).map(s => s.id + ':' + s.state).join(',') : '';
    rows.push({ t, clip: pc && pc.key ? pc.key.split('|').slice(1).join('|') + '@' + (+pc.frame).toFixed(2) : null, variant: ri && ri.variant,
                actNow: ss ? ss.actNow : null, act: ss && ss.actRow ? ss.actRow.variant : null, steps: prt && prt.stats ? prt.stats.steps : null, lift });
    if (t > 418) break;
  }
  out.push([false, 'PROBE re-entry', JSON.stringify(rows)]);
  return out;
}
export const pageCheck = liftProbe;
export const args = [[]];
