// laneB3/tiredrage-debug.mjs (lane B3, 2026-10-27): Raven -- "Make Tired (with Rage) a Debug option for now, until I know what it
// entails". For every monster whose CLASS_TOGGLES carries the tiredRage toggle (the Rath line): it is NOT in #monClassToggles, it IS in
// #monDebugToggles inside the hidden #debugPanel; the other class toggles stay where they were (control: Ahtal-Neset's point toggles,
// Begins Burrowed on Diablos). Then the panel unhidden: switching it on writes state.toggles.tiredRage and restarts the play (as
// before); hidden again, resetHiddenDebug puts it back to off.
async function check(){
  const out = [];
  const V = window.__view, MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const $ = id => document.getElementById(id), monSel = $('monSel');
  const ids = Object.entries(MS.CLASS_TOGGLES).filter(([, v]) => v.some(t => t.key === 'tiredRage')).map(([k]) => k);
  const rows = [], log = [];
  for (const MON of [...ids, 'em087_00', 'em004_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange(); await frames(5);
    rows.push({ MON, normal: [...$('monClassToggles').querySelectorAll('label')].map(l => l.id),
                debug: [...$('monDebugToggles').querySelectorAll('label')].map(l => l.id), debugHidden: $('debugPanel').hidden });
  }
  const okPlace = rows.every(r => ids.includes(r.MON) ? (!r.normal.includes('monTog_tiredRage') && r.debug.includes('monTog_tiredRage') && r.debugHidden)
                                                    : (r.normal.length > 0 && !r.debug.length));
  // unhide, switch on (Rathian), hide again -> reset
  monSel.value = 'em001_00'; await monSel.onchange(); await frames(120);   // the mount settles (a late resetMonsterState wipes earlier inputs)
  // the behaviour (ROM note: with Enraged on, the play reads tired too -- L2 M1 loses bits 24-26): Enraged, L2 M1, the play's mask
  const M = await import('/render/monster.js');
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 600 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em001_00'); i++) await frames(1);
  const st = $('monState'); const ro = [...st.options].find(o => /^(rage|rung:|lv:)/.test(o.value) && !/Normal|Exhausted/.test(o.textContent)); st.value = ro ? ro.value : 'rage'; st.onchange({ target: st }); await frames(3); log.push('state option ' + st.value + ', rage ' + V.state.rage);
  if ($('monList').value !== '2'){ $('monList').value = '2'; await $('monList').onchange(); }
  const clipSel = $('monClip'), m1 = [...clipSel.options].find(o => o.value.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === 'Motion[1]');
  clipSel.value = m1.value; await clipSel.onchange(); await frames(20);
  const maskOf = () => { const c = M.effectRuntimeInstance().schedule.clip; return c && c.mask != null ? (c.mask >>> 0).toString(16) : String(c && c.mask); };
  const maskOff = maskOf();
  $('debugPanel').hidden = false;
  const b = $('monTog_tiredRage').querySelector('input');
  b.checked = true; b.onchange({ target: b }); await frames(20);
  const on = !!(V.state.toggles && V.state.toggles.tiredRage);
  const maskOn = maskOf();
  $('debugPanel').hidden = true;
  const t = window.__debugReset();
  const offAfter = !t.tiredRage && !$('monTog_tiredRage').querySelector('input').checked;
  const keep = 'not run (the check stays on em001_00)';
  out.push([okPlace && on && offAfter, 'TIRED-RAGE-DEBUG', JSON.stringify({ ids, rows, switchedOn: on, rageState: V.state.rage, maskL2M1: { tiredRageOff: maskOff, tiredRageOn: maskOn }, offAfterHiddenReset: offAfter, normalToggleKept: keep, log })]);
  return out;
}
export const pageCheck = check;
export const args = [[]];
