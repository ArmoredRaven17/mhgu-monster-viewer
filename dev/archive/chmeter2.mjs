// chmeter2.mjs: CHAMELEOS's Invisible (Off / On) with live breaks -- the draw measure (the model's drawn meshes, their opacity, the
// stealth swap, the clips, PSL refused): On -> horn -> tail; On -> tail -> horn; each break set before On (none / horn / tail / both)
async function chMeter2(){
  const out = [];
  const mon = 'em025_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const cs = document.getElementById('monClassCtl');
  out.push([cs && [...cs.options].map(o => o.textContent.trim()).join('/') === 'Off/On', 'the Invisible control is Off / On', cs ? [...cs.options].map(o => o.textContent.trim()).join(' / ') : 'no control']);
  const setRow = async (part, on) => {
    for (const f of document.querySelectorAll('[data-row]')){
      if (!f.dataset.row.split(',').includes(String(part))) continue;
      const sel = f.querySelector('select'); if (!sel) continue;
      for (const o of sel.options){ sel.value = o.value; sel.dispatchEvent(new Event('change')); await frames(2);
        const d = V.mounted.main.userData.partsDrawn; if (d && (d.get(part) === true) === on) return f.dataset.row + ' = ' + o.textContent.trim(); }
    }
    return null;
  };
  const look = () => {
    const root = V.mounted.main; let n = 0, vis = 0, op = 0;
    root.traverse(o => { if (!(o.isMesh || o.isSkinnedMesh) || o.userData.prim === undefined) return;
      for (const m of [].concat(o.material)){ n++; if (m.visible !== false){ vis++; op += m.opacity; } } });
    const mc = root.userData.manualClips || {}, rt = M.effectRuntimeInstance();
    return { drawn: vis + '/' + n, opacity: vis ? +(op / vis).toFixed(2) : 0, swap: root.userData.matSwapState || null, cloakOn: !!root.userData.cloakOn,
             psl: !!(rt && rt.schedule && rt.schedule.pslRefuse), clips: Object.fromEntries(Object.entries(mc).map(([k, v]) => [k, v && v[0]])) };
  };
  const set = async v => { cs.value = String(v); cs.dispatchEvent(new Event('change')); };
  const reset = async () => { await set(0); await setRow(2, false); await setRow(3, false); await frames(150); };
  const kind = l => !l.cloakOn ? (l.drawn.startsWith('0/') ? 'gone?' : 'visible/uncloaking') : l.drawn.startsWith('0/') ? 'FULL (not drawn)' : l.opacity < 0.9 ? 'FADING (opacity ' + l.opacity + ')' : l.swap === 'stealth' ? 'SEMI (stealth)' : 'cloaking';
  // sequences while cloaked
  for (const [name, first, second] of [['On -> horn -> tail', 2, 3], ['On -> tail -> horn', 3, 2]]){
    await reset();
    await set(1); await frames(60);
    const s = { on60: look() };
    await setRow(first, true); await frames(15); s.brk1_15 = look(); await frames(85); s.brk1_100 = look(); await frames(40); s.brk1_140 = look();
    await setRow(second, true); await frames(15); s.brk2_15 = look(); await frames(85); s.brk2_100 = look(); await frames(40); s.brk2_140 = look();
    out.push([true, name + ': ' + Object.entries(s).map(([k, v]) => k + ' ' + kind(v)).join(', '), JSON.stringify(s)]);
  }
  // RESTORES (viewer only: the game never repairs a part) mirror the breaks
  for (const [name, steps] of [['On -> horn break -> horn restore', [[2, true], [2, false]]], ['On -> tail -> tail restore', [[3, true], [3, false]]]]){
    await reset();
    await set(1); await frames(60);
    const s = { on60: look() };
    let k = 1;
    for (const [part, on] of steps){
      await setRow(part, on); await frames(15); s['s' + k + '_15'] = look(); await frames(85); s['s' + k + '_100'] = look(); await frames(40); s['s' + k + '_140'] = look(); k++;
    }
    out.push([true, name + ': ' + Object.entries(s).map(([k2, v]) => k2 + ' ' + kind(v)).join(', '), JSON.stringify(s)]);
  }
  {
    await reset();
    await setRow(2, true); await setRow(3, true); await frames(10);
    await set(1); await frames(60);
    const s = { both_on60: look() };
    await setRow(2, false); await frames(15); s.hornRestored_15 = look(); await frames(125); s.hornRestored_140 = look();
    await setRow(3, false); await frames(15); s.tailRestored_15 = look(); await frames(125); s.tailRestored_140 = look();
    out.push([true, 'both broken, On, restore the horn, then the tail: ' + Object.entries(s).map(([k2, v]) => k2 + ' ' + kind(v)).join(', '), JSON.stringify(s)]);
  }
  // breaks set before On
  for (const [name, h, t] of [['none', 0, 0], ['horn', 1, 0], ['tail', 0, 1], ['both', 1, 1]]){
    await reset();
    if (h) await setRow(2, true); if (t) await setRow(3, true); await frames(10);
    await set(1);
    const s = {}; await frames(15); s.f15 = look(); await frames(30); s.f45 = look(); await frames(45); s.f90 = look();
    out.push([true, 'breaks ' + name + ' then On: ' + Object.entries(s).map(([k, v]) => k + ' ' + kind(v)).join(', '), JSON.stringify(s)]);
  }
  await reset();
  return out;
}
export const pageCheck = chMeter2;
export const args = [];
