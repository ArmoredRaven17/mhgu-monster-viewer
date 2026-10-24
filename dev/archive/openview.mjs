// Every monster's opening clip after a fresh pick (state.list / state.clip as buildLists / buildClips leave them)
async function openView(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  const ids = V.MON.monsters.filter(m => !m.small).map(m => m.id);
  const bad = [], tally = {};
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main, 600);
    const got = V.state.list + '|' + V.state.clip;
    tally[got] = (tally[got] || 0) + 1;
    if (!/^0\|Motion\[1\](_loop|_start)?$/.test(got)) bad.push(MON + ' ' + got);
  }
  out.push([bad.length === 0, ids.length + ' large monsters open on L0 M1', JSON.stringify({ tally, notL0M1: bad })]);
  return out;
}
export const pageCheck = openView;
