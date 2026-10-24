// Nakarkos's Stance control: its options, and where each pick puts the transport; Rathian for contrast (hidden)
async function stance(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), sel = document.getElementById('monStance');
  const res = {};
  for (const MON of ['em084_00', 'em001_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    await frames(3);
    const r = { shown: !document.getElementById('monStanceRow').hidden, label: document.getElementById('monStanceLab').textContent,
                options: [...sel.options].map(o => o.textContent), opens: V.state.list + '|' + V.state.clip, picks: [] };
    if (r.shown) for (const v of ['1', '0', '1']){
      sel.value = v; await sel.onchange({ target: sel }); await frames(5);
      r.picks.push(sel.selectedOptions[0].textContent + ' -> ' + V.state.list + '|' + V.state.clip + ' playing ' + (V.pose.action ? V.pose.action.getClip().name : null));
    }
    res[MON] = r;
  }
  out.push([false, 'stance', JSON.stringify(res)]);
  return out;
}
export const pageCheck = stance;
