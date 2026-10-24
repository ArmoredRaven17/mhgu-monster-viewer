// probe024.mjs (run-check): Kushala L2 M9 with the Wind Aura at 3 -- per play: the pick, the inputs the shells get, the shells made
async function probe(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em024_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  V.state.loop = true;
  const cc = document.getElementById('monClassCtl');
  out.push([false, 'classCtl options', JSON.stringify([...cc.options].map(o => o.value + ':' + o.textContent))]);
  cc.value = '3'; cc.onchange({ target: cc }); await frames(3);
  listSel.value = '2'; await listSel.onchange();
  const o = [...clipSel.options].find(x => x.value.replace(/_(start|loop)$/, '') === 'Motion[9]');
  clipSel.value = o.value; await clipSel.onchange();
  const rows = []; let last = null;
  for (let k = 0; k < 2400; k++){
    await frames(1);
    const rt = M.effectRuntimeInstance(), sc = rt && rt.schedule;
    if (!sc || !sc.shells) continue;
    const ri = sc.rockInput ? sc.rockInput() : null;
    const st = sc.shells.state;
    const v = ri && ri.rock && ri.rock.variant;
    if (v !== last){ rows.push('play ' + v + ' aura ' + (ri && ri.windAura024) + ' snow ' + (ri && ri.snow) + ' rage ' + (ri && ri.rage) + ' keys ' + Object.keys(ri || {}).slice(0, 12).join(',')); last = v; }
    for (const S of (st.shells || [])) if (!S.__seen){ S.__seen = 1; rows.push('  made ' + S.shell + ' m' + S.modeIndex + ' (' + v + ')'); }
  }
  out.push([false, 'P024', rows.join(' | ').slice(0, 6000)]);
  return out;
}
export const pageCheck = probe;
