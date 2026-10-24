// probe7.mjs (run-check; P7='{"mon":..,"pre":[..],"list":..,"clip":..,"frames":N,"rage":bool}'): ONE play on the page, and what the
// shells module saw -- each frame's pick (rockInput().variant) as it changes, the shell inputs that matter, the shells made and the
// refusals the schedule tallies (shellTally.refused) -- to find why a record the node replay starts does not start on the page
async function probe(C){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === C.mon)) monSel.add(new Option(C.mon, C.mon));
  monSel.value = C.mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === C.mon, 900);
  V.state.loop = true;
  for (const q of (C.pre || [])){
    if (q.quest){ window.__quest.set(q.quest[0], q.quest[1]); await frames(3); continue; }
    if (q.hunter){ window.__hunter.set(q.hunter[0], q.hunter[1], q.hunter[2]); await frames(3); continue; }
    const el = document.getElementById(q.select);
    out.push([false, 'PRE ' + q.select, el ? JSON.stringify([...el.options].map(o => o.value)) : 'no such control']);
    if (el){ el.value = q.value; el.onchange({ target: el }); await frames(3); }
  }
  if (C.rage){
    const st = document.getElementById('monState'), row = document.getElementById('monStateRow');
    const o = st && [...st.options].find(x => x.value === 'rage');
    if (o && row && !row.hidden){ st.value = 'rage'; st.onchange({ target: st }); }
    else { const b = document.getElementById('monRage'); if (b){ b.checked = true; b.onchange({ target: b }); } }
    await frames(3);
  }
  if (V.state.list !== C.list){ listSel.value = C.list; await listSel.onchange(); }
  const opts = [...clipSel.options].map(o => o.value).filter(v => v.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === C.clip);
  out.push([false, 'ENTRIES', JSON.stringify(opts)]);
  const rows = [];
  for (const val of opts){
    clipSel.value = val; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip(), 100);
    const rt0 = M.effectRuntimeInstance(), sc0 = rt0 && rt0.schedule;
    const T0 = sc0 && sc0.shellTally ? sc0.shellTally.spawned : 0, R0 = sc0 && sc0.shellTally ? sc0.shellTally.refused.length : 0;
    let last = null;
    for (let k = 0; k < (C.frames || 600); k++){
      await frames(1);
      const rt = M.effectRuntimeInstance(), sc = rt && rt.schedule;
      if (!sc) continue;
      const ri = sc.rockInput ? sc.rockInput() : null, ex = sc.shellExtra ? sc.shellExtra() : {};
      const v = (ri && ri.variant) + '|act ' + JSON.stringify(ex.action) + '|' + (C.keys || []).map(k2 => k2 + '=' + JSON.stringify(ex[k2])).join(',') + '|rage ' + sc.rage;
      if (C.snap && k % C.snap === 0 && sc.shells && sc.shells.state) rows.push(val + ' f' + k + ' clipF ' + Math.round((sc.clip && sc.clip.frame) || 0) + ' T ' + JSON.stringify(sc.rockInput && sc.rockInput() && sc.rockInput().rock ? sc.rockInput().rock.target : (sc.rockInput && sc.rockInput() ? sc.rockInput().target : null)) + ' SH ' + (sc.shells.state.shells || []).map(S => S.shell + 'm' + S.modeIndex + 's' + S.state + (S.position ? '@' + S.position.map(Math.round).join(',') : '') + (S.hunterHit ? ' HIT' : '') + ' sl' + ((S.slots || S.hslots || []).map(x => (x.on ? 1 : 0) + ':' + Math.round(x.delay) + '/' + Math.round(x.duration)).join(','))).join(' '));
      if (v !== last){ if (rows.length < (C.maxRows || 400)) rows.push(val + ' f' + k + ' clipF ' + Math.round((sc.clip && sc.clip.frame) || 0) + ' ' + v); last = v; }
    }
    const sc = M.effectRuntimeInstance().schedule, T = sc.shellTally || { spawned: 0, refused: [] };
    rows.push(val + ' spawned ' + (T.spawned - T0) + ' refused ' + JSON.stringify(T.refused.slice(R0).slice(-6)).slice(0, 900));
    const st = sc.shells && sc.shells.state;
    if (st) rows.push(val + ' shells now ' + (st.shells || []).map(S => S.shell + ' m' + S.modeIndex).join(' ').slice(0, 300));
  }
  for (let i = 0; i < rows.length; i += 25) out.push([false, 'P7 ' + i, rows.slice(i, i + 25).join(' || ').slice(0, 6000)]);
  return out;
}
export const pageCheck = probe;
export const args = (typeof process !== 'undefined' && process.env.P7) ? [[JSON.parse(process.env.P7)]] : [];
