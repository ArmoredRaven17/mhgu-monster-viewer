// The opening clip of the monsters with a part-review `opening`
async function openCheck(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  const got = [];
  for (const MON of ['em056_00', 'em010_00', 'em032_00', 'em032_04', 'em037_00', 'em037_04', 'em001_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    got.push(MON + ' ' + V.state.list + '|' + V.state.clip);
  }
  out.push([false, 'openings', JSON.stringify(got)]);
  return out;
}
export const pageCheck = openCheck;
