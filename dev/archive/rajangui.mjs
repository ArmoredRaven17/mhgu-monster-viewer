// Rajang / Furious Rajang: the one State dropdown -- its options, what each choice sets, and that the level row is folded
async function rajangUi(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), sel = document.getElementById('monState');
  const shown = id => { const el = document.getElementById(id); return !!el && !el.hidden && getComputedStyle(el).display !== 'none'; };
  for (const MON of ['em023_00', 'em023_05', 'em082_00', 'em001_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    await frames(5);
    const res = { opts: [...sel.options].map(o => o.textContent), shown: { state: shown('monStateRow'), level: shown('monLevelRow'), rage: shown('monRageRow'), tired: shown('monTiredRow') }, picks: [] };
    if (shown('monStateRow')) for (const o of [...sel.options].map(x => x.value).concat([sel.options[0].value])){
      sel.value = o; await sel.onchange({ target: sel }); await frames(3);
      res.picks.push(o + ' -> ' + JSON.stringify({ level: V.state.level, rage: V.state.rage, tired: V.state.tired, shows: sel.selectedOptions[0].textContent }));
    }
    out.push([false, MON, JSON.stringify(res)]);
  }
  return out;
}
export const pageCheck = rajangUi;
