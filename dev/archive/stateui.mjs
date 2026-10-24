// The State dropdown across monster kinds: its options, what each choice sets, and that the old rows are not displayed
async function stateUi(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), sel = document.getElementById('monState');
  const shown = id => { const el = document.getElementById(id); return !!el && getComputedStyle(el).display !== 'none' && !el.hidden; };
  const pick = async v => { sel.value = v; await sel.onchange({ target: sel }); await frames(3); };
  for (const MON of ['em001_00', 'em071_00', 'em007_04', 'em063_05', 'em082_00', 'em081_04', 'em033_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    await frames(5);
    const opts = [...sel.options].map(o => o.value + '=' + o.textContent);
    const rows = { state: shown('monStateRow'), rage: shown('monRageRow'), tired: shown('monTiredRow'), ladder: shown('monRageLevelRow'), level: shown('monLevelRow') };
    const after = [];
    if (shown('monStateRow')) for (const o of [...sel.options].map(x => x.value).concat(['normal'])){
      await pick(o);
      after.push(o + '->' + JSON.stringify({ rage: V.state.rage, tired: V.state.tired, lv: V.state.rageLevel | 0, sel: sel.value }));
    }
    out.push([false, MON, JSON.stringify({ opts, rows, after })]);
  }
  return out;
}
export const pageCheck = stateUi;
