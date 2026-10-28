// khezuaoe/tiredgate.mjs (Khezu AoE lane, 2026-10-27): the Hyper -> never Exhausted gate on the page (index.html paintTired /
// hyperTiredRung; rom-map "P+0x1a8 bit 19"). Per monster: Exhausted offered with Hyper Off (the positive control), set; then a Hyper
// pair picked -> state.tired false, the toggle row hidden, no 'tired' in the State dropdown; Hyper Off again -> offered again.
// Mizutsune (em082_00, a State rung named Exhausted): the rung is disabled while held and a play on it moves to rung 0.
async function gate(mons){
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const $ = id => document.getElementById(id), monSel = $('monSel'), hy = $('monHyper');
  const out = [];
  for (const mon of mons){
    if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
    monSel.value = mon; await monSel.onchange(); await frames(30);
    const pair = [...hy.options].map(o => o.value).find(v => v);
    if (!pair){ out.push([false, mon + ' no Hyper option', '']); continue; }
    const stateOpts = () => [...$('monState').options].map(o => o.value);
    const lvSel = $('monLevel'), rungTired = () => [...lvSel.options].filter(o => o.disabled).map(o => o.value);
    const offRow = !$('monTiredRow').hidden, offOpts = stateOpts();
    let setTired = false;
    if (offRow){ $('monTired').checked = true; $('monTired').dispatchEvent(new Event('change')); await frames(2); setTired = !!V.state.tired; }
    const lvOn = mon === 'em082_00' ? [...lvSel.options].findIndex(o => /xhaust/i.test(o.textContent)) : -1;
    if (lvOn >= 0){ lvSel.value = String(lvOn); lvSel.onchange({ target: lvSel }); await frames(2); }
    const lvBefore = V.state.level | 0;
    hy.value = pair; hy.dispatchEvent(new Event('change')); await frames(3);
    const onRow = !$('monTiredRow').hidden, onTired = !!V.state.tired, onOpts = stateOpts(), lvHeld = V.state.level | 0, dis = rungTired();
    hy.value = ''; hy.dispatchEvent(new Event('change')); await frames(3);
    const backRow = !$('monTiredRow').hidden, backDis = rungTired();
    const ok = mon === 'em082_00'
      ? (lvOn >= 0 && lvBefore === lvOn && lvHeld === 0 && dis.includes(String(lvOn)) && !backDis.length)
      : (offRow && setTired && !onRow && !onTired && !onOpts.includes('tired') && backRow);
    out.push([ok, mon + ' Hyper ' + pair, JSON.stringify({ offRow, offOpts, setTired, onRow, onTired, onOpts, backRow, lvOn, lvBefore, lvHeld, dis, backDis })]);
  }
  return out;
}
// THE CLIP MENU (coordinator follow-up, 2026-10-27): per [monster, list, tired clip]: with Hyper Off the clip plays tired (the row's
// force, the positive control: motionStates.tired()); with a pair held its option is disabled, the play moved off it, and a play put
// back on it programmatically is NOT tired (the row's force gated in playNow / MotionStates.tired); Off again re-enables it. Rows the
// audit withdrew (Plesioth L0 M1, Barioth L0 M2) play untired with Hyper Off; Hellblade offers no Exhausted.
async function clipGate(cases, untired, noTired){
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const $ = id => document.getElementById(id), monSel = $('monSel'), hy = $('monHyper'), listSel = $('monList'), clipSel = $('monClip');
  const mount = async mon => { if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon)); monSel.value = mon; await monSel.onchange(); await frames(30); };
  const pickClip = async clip => { const v = [...clipSel.options].map(o => o.value).find(x => x === clip) || [...clipSel.options].map(o => o.value).find(x => x.startsWith(clip + '_')); clipSel.value = v; await clipSel.onchange(); await frames(12); return v; };
  const out = [];
  for (const [mon, list, clip] of cases){
    await mount(mon);
    listSel.value = list; await listSel.onchange(); await frames(3);
    const v = await pickClip(clip);
    const offTired = V.motionStates().tired;
    const pair = [...hy.options].map(o => o.value).find(x => x);
    hy.value = pair; hy.dispatchEvent(new Event('change')); await frames(12);
    const opt = [...clipSel.options].find(o => o.value === v);
    const disabled = !!(opt && opt.disabled), movedTo = clipSel.value, disabledN = [...clipSel.options].filter(o => o.disabled).length;
    await pickClip(clip);                                  // put back on it by hand: the row must not force tired
    const heldTired = V.motionStates().tired;
    hy.value = ''; hy.dispatchEvent(new Event('change')); await frames(6);
    const back = !(opt && opt.disabled);
    const ok = offTired && disabled && movedTo !== v && !heldTired && back;
    out.push([ok, `${mon} ${list}|${clip} clip gate`, JSON.stringify({ offTired, disabled, disabledN, movedTo, heldTired, back })]);
  }
  for (const [mon, list, clip] of untired){
    await mount(mon); listSel.value = list; await listSel.onchange(); await frames(3);
    await pickClip(clip);
    const t = V.motionStates().tired;
    out.push([!t, `${mon} ${list}|${clip} plays untired (row withdrawn)`, JSON.stringify({ tired: t })]);
  }
  for (const mon of noTired){
    await mount(mon);
    const row = !$('monTiredRow').hidden, opts = [...$('monState').options].map(o => o.value);
    out.push([!row && !opts.includes('tired'), `${mon} offers no Exhausted (never tires)`, JSON.stringify({ row, opts })]);
  }
  return out;
}
// rcd.mjs sends pageCheck's own source to the page: both checks are put inside it
export const pageCheck = new Function('mons', 'cases', 'untired', 'noTired',
  'const gate = ' + gate.toString() + '; const clipGate = ' + clipGate.toString() + ';' +
  ' return (async () => [...await gate(mons), ...await clipGate(cases, untired, noTired)])();');
export const args = [[['em003_00', 'em001_00', 'em043_00', 'em082_00'],
  [['em003_00', '0', 'Motion[15]'], ['em001_00', '0', 'Motion[14]'], ['em043_00', '0', 'Motion[15]'], ['em057_00', '0', 'Motion[10]'], ['em071_00', '3', 'Motion[23]']],
  [['em010_00', '0', 'Motion[1]'], ['em042_00', '0', 'Motion[2]']], ['em080_04']]];
