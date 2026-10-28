// laneA/heat080dbg.mjs (effects lane A, 2026-10-25): Hellblade / Glavenus -- which heat key index.html stepHeat080 holds under each
// Parts row option (rt.holdEvent wrapped; the row label and option shown with each change).
async function dbg(mon){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon)); monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === mon, 900);
  await frames(30);
  const rt = M.effectRuntimeInstance(); const log = [];
  const oh = rt.holdEvent.bind(rt);
  rt.holdEvent = (p, k, on, b) => { if (k >= 200 && k <= 204){ const last = log[log.length - 1]; const s = (on ? '+' : '-') + k; if (!last || last[last.length - 1] !== s) log.push([s]); } return oh(p, k, on, b); };
  await frames(10);
  log.push(['clips', [...$('monClip').options].slice(0, 4).map(o => o.value).join(',')]);
  const rows = [...document.querySelectorAll('[data-row]')].filter(f => { const s = f.querySelector('select'); return s && s.options.length > 1; });
  for (const f of rows){
    const s = f.querySelector('select'), v0 = s.value;
    for (const o of [...s.options]){
      s.value = o.value; s.dispatchEvent(new Event('change')); await frames(20);
      log.push(['row', (f.textContent || '').trim().slice(0, 30), o.textContent.trim()]);
    }
    s.value = v0; s.dispatchEvent(new Event('change')); await frames(10);
  }
  return [[true, 'HEAT ' + mon, JSON.stringify(log)]];
}
export const pageCheck = dbg;
export const args = [['em080_04'], ['em080_00']];
