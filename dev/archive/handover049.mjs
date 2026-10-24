// Agnaktor: Heated off; the head lava's opacity and the head region's clip every frame, to see maguma_End hand over to
// cool_Loop -- which should start at 0 and rise 0.1 per 60 frames (cool_Loop from frame 0)
async function handover(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em049_00';
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.mounted.main && V.state.id === MON);
  await frames(30);
  let head = null;
  V.mounted.main.traverse(o => { if (head || !(o.isMesh || o.isSkinnedMesh)) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.name === 'XfB_0__m04_lav04') head = m; });
  const el = document.getElementById('monHeated');
  for (let rep = 0; rep < 1; rep++){
    if (!el.checked){ el.checked = true; await el.onchange({ target: el }); await frames(200); }
    el.checked = false; await el.onchange({ target: el });
    const trace = [];
    for (let i = 0; i < 1800; i++){ await frames(1); trace.push([V.heat().regions.head.clip || '-', +head.opacity.toFixed(3)]); }
    const k = trace.findIndex((t, i) => i > 0 && trace[i - 1][0] !== '-' && t[0] === '-');
    out.push([false, 'rep ' + rep + ' handover at ' + k, JSON.stringify(k >= 0 ? trace.slice(Math.max(0, k - 3), k + 25).map(t => t.join(':')) : trace.slice(0, 10))]);
    await frames(37);
  }
  return out;
}
export const pageCheck = handover;
