// dupaudit.mjs: every monster's panel -- the visible controls' labels (switches, selects, checkboxes), with any label shown twice
async function dupAudit(process_ids){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  const vis = el => { for (let e = el; e && e !== document.body; e = e.parentElement){ if (e.hidden) return false; if (e.style && e.style.display === 'none') return false; if (e.classList && e.classList.contains('folded')) return false; } return true; };
  const panel = document.body;
  // a hidden ancestor that is a collapsed PANEL (not a control row) does not count: the dev page may have its panels folded

  for (const e of V.MON.monsters.filter(x => !process_ids || process_ids.includes(x.id))){
    if (e.small) continue;
    if (![...monSel.options].some(o => o.value === e.id)) monSel.add(new Option(e.id, e.id));
    monSel.value = e.id; await monSel.onchange();
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === e.id, 300);
    await frames(10);
    if (window.__refreshSharedRow) window.__refreshSharedRow();
    const labels = [];
    for (const el of panel.querySelectorAll('label')){
      if (!vis(el)) continue;
      const ctl = el.querySelector('input, select') || (el.htmlFor && document.getElementById(el.htmlFor));
      if (!ctl) continue;
      const t = el.textContent.trim().replace(/\s+/g, ' ');
      if (t) labels.push(t);
    }
    const seen = {}, dup = [];
    for (const t of labels){ const k = t.toLowerCase(); seen[k] = (seen[k] || 0) + 1; if (seen[k] === 2) dup.push(t); }
    out.push([dup.length === 0, e.id + ' ' + e.name + (dup.length ? ': DUPLICATE ' + dup.join(', ') : ''), JSON.stringify(labels)]);
  }
  return out;
}
export const pageCheck = dupAudit;
export const args = [[(typeof process !== 'undefined' && process.env.DUP_IDS) ? process.env.DUP_IDS.split(',') : null]];

