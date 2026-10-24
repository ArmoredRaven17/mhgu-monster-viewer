// Agnaktor: in the death clip L3 M12 with every region cooled, which lava overlay meshes still draw (0xec1cec: the
// cooled groups, rock alone), and the cool_Loop phase at the moment maguma_End hands over (slot time zeroed in the ROM).
async function deathCooled(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 900) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const MON = 'em049_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.mounted.main && V.state.id === MON);
  await frames(30);
  const el = document.getElementById('monHeated');
  // handover phase, three times: Heated on (settle molten), off, sample the opacity the first frames after End
  const root = V.mounted.main;
  let head = null;
  root.traverse(o => { if (head || !(o.isMesh || o.isSkinnedMesh)) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.name === 'XfB_0__m04_lav04') head = m; });
  for (let rep = 0; rep < 3; rep++){
    if (!el.checked){ el.checked = true; await el.onchange({ target: el }); await frames(150); }
    el.checked = false; await el.onchange({ target: el });
    let prev = null, seen = null;
    for (let i = 0; i < 900; i++){
      await frames(1);
      const c = V.heat().regions.head.clip;
      if (prev === 'maguma_End' && c === null){ seen = { opAtHandover: +head.opacity.toFixed(4), coolPhaseFrame: +((performance.now() / 1000 * 60) % 120).toFixed(1) }; break; }
      prev = c;
    }
    out.push([false, 'handover ' + rep, JSON.stringify(seen)]);
    await frames(17 * (rep + 1));
  }
  // the death clip with all regions cooled
  { const t = performance.now(); while (performance.now() - t < 500) await frames(5); }
  const visibleUp = o => { for (let x = o; x; x = x.parent) if (x.visible === false) return false; return true; };
  const lavaDrawn = () => { const r = []; root.traverse(o => { if (!(o.isMesh || o.isSkinnedMesh)) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    if (ms.some(m => m && /lav0/.test(m.name)) && visibleUp(o)) r.push(o.userData.part); }); return r; };
  out.push([false, 'idle, cooled: lava parts drawn', JSON.stringify(lavaDrawn())]);
  if (V.state.list !== '3'){ listSel.value = '3'; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === 'Motion[12]');
  if (!o){ out.push([false, 'no L3 Motion[12]', [...clipSel.options].map(x => x.value).join(',')]); return out; }
  clipSel.value = o.value; await clipSel.onchange(); await frames(20);
  out.push([false, 'L3 M12, cooled: coolDraw / lava parts drawn', JSON.stringify({ coolDraw: V.heat().coolDraw, lava: lavaDrawn(), groups: (V.state.groups || []).slice ? null : null })]);
  return out;
}
export const pageCheck = deathCooled;
