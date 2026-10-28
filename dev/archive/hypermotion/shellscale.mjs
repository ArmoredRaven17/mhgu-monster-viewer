// hypermotion/shellscale.mjs: Khezu's L2 M3 bolts (sp_03) with Hyper off and with 1,2 held -- every live shell's name, mode, unitScale
// and S.hyper (render/shells.js hyperShellElement) from the schedule's shell state, sampled each frame from f170 to f240.
async function check(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  monSel.value = 'em003_00'; await monSel.onchange();
  const out = [];
  for (const [hv, noHS] of (globalThis.__SEQ || [['', 0], ['1,2', 0], ['1,2', 1], ['1,2', 0], ['', 0], ['1,2', 0]])){
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === 'em003_00', 900);
    listSel.value = '2'; await listSel.onchange(); await frames(2);
    await until(() => [...sel.options].some(o => o.value === hv), 300);
    sel.value = hv; sel.dispatchEvent(new Event('change')); await frames(2);
    V.state.loop = false;
    const c = [...clipSel.options].map(o => o.value).find(v => v === 'Motion[3]' || v.startsWith('Motion[3]_'));
    clipSel.value = c; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name.startsWith('Motion[3]'), 300);
    const rt = M.effectRuntimeInstance();
    if (noHS){ const se = rt.schedule.shellExtra; rt.schedule.shellExtra = () => { const o = se ? se() : {}; delete o.hyperShells; return o; }; }
    const errs = []; { const ss = rt.schedule.stepShells.bind(rt.schedule); rt.schedule.stepShells = () => { try { return ss(); } catch (e){ errs.push(String(e && e.stack || e).slice(0, 400)); } }; }
    const ce = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 300)); ce(...a); };
    let seen = {}, maxN = 0, firstAt = null, clipNow = '';
    for (let k = 0; k < 900; k++){
      await frames(1);
      const S = rt.schedule && rt.schedule.shells, st = S && S.state, sh = (st && st.shells) || [];
      const fr = V.pose.action ? V.pose.action.time * 60 : 0; clipNow = V.pose.action && V.pose.action.getClip().name;
      if (sh.length && firstAt == null) firstAt = clipNow + ' f' + Math.round(fr);
      maxN = Math.max(maxN, sh.length);
      for (const s of sh) seen[(s.shell || s.base) + ' m' + s.modeIndex] = { unitScale: s.unitScale, hyper: s.hyper || null };
      if (clipNow.endsWith('_loop') && fr > 260 || (V.pose.action.paused && k > 5)) break;
    }
    out.push([true, 'Khezu L2 M3 shells, Hyper ' + (hv || 'off') + (noHS ? ' (hyperShells withheld)' : ''), JSON.stringify({ errs: errs.slice(0, 3), tally: rt.schedule.shellTally ? { spawned: rt.schedule.shellTally.spawned, refused: rt.schedule.shellTally.refused.slice(-3) } : null, firstAt, maxN, seen, pick: V.state.clipVariant || null })]);
  }
  sel.value = ''; sel.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = check;
export const args = [[]];
