// laneA/mud2dbg.mjs (effects lane A, 2026-10-25): Barroth L2 M12 / M13 -- the enable word the schedule holds (schedule.clip.mask) and
// the mud byte, per Parts state (default, Head Broken, Tail Severed), with the clip options the menu offers.
async function dbg(){
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === 'em044_00')) monSel.add(new Option('em044_00', 'em044_00')); monSel.value = 'em044_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === 'em044_00', 900);
  $('monList').value = '2'; await $('monList').onchange(); await frames(20);
  const log = [['opts', [...$('monClip').options].map(o => o.value).filter(v => /Motion\[1[23]\]/.test(v))]];
  const mud = () => MS.shellMudInput('em044_00', V.mounted.main && V.mounted.main.userData.partsDrawn);
  const setRow = async (row, idx) => { const f = [...document.querySelectorAll('[data-row]')].find(x => x.dataset.row === row); const s = f.querySelector('select'); s.value = s.options[idx].value; s.dispatchEvent(new Event('change')); await frames(10); };
  for (const [lab, row, idx] of [['default', null], ['head broken', '2,3', 1], ['tail severed', '8,101', 1]]){
    if (row){ await setRow('2,3', 0); await setRow('8,101', 0); await setRow(row, idx); }
    for (const c of ['Motion[12]_start', 'Motion[12]', 'Motion[13]']){
      const o = [...$('monClip').options].find(x => x.value === c); if (!o) continue;
      $('monClip').value = c; await $('monClip').onchange(); await frames(8);
      const rt = M.effectRuntimeInstance(); const cl = rt.schedule.clip;
      log.push([lab, c, mud(), cl && cl.mask != null ? (cl.mask >>> 0).toString(16) : null, cl && cl.key]);
    }
  }
  return [[true, 'MUD2', JSON.stringify(log)]];
}
export const pageCheck = dbg; export const args = [[]];
