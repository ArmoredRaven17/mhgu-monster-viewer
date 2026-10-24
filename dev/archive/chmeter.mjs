// chmeter.mjs: CHAMELEOS's invisibility -- Invisible 0..3 x horn intact / broken x tail intact / severed: what the model shows 15 / 45 /
// 90 frames after the control is set (the model's drawn meshes and their opacity, the stealth swap, the clips, the eyes, PSL refused)
async function chMeter(horn, tail){
  const out = [];
  const mon = 'em025_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const cs = document.getElementById('monClassCtl');
  const setRow = async (part, on) => {
    for (const f of document.querySelectorAll('[data-row]')){
      if (!f.dataset.row.split(',').includes(String(part))) continue;
      const sel = f.querySelector('select'); if (!sel) continue;
      for (const o of sel.options){ sel.value = o.value; sel.dispatchEvent(new Event('change')); await frames(2);
        const d = V.mounted.main.userData.partsDrawn; if (d && (d.get(part) === true) === on) return f.dataset.row + ' = ' + o.textContent.trim(); }
    }
    return null;
  };
  // horn broken = set 4 (part 2 drawn, 5 hidden); tail severed = set 8 (part 3 drawn, 101 hidden)
  const hr = await setRow(2, horn), tr = await setRow(3, tail);
  const look = () => {
    const root = V.mounted.main; let n = 0, vis = 0, op = 0;
    root.traverse(o => { if (!(o.isMesh || o.isSkinnedMesh) || o.userData.prim === undefined) return;
      for (const m of [].concat(o.material)){ n++; if (m.visible !== false){ vis++; op += m.opacity; } } });
    const mc = root.userData.manualClips || {};
    return { drawn: vis + '/' + n, opacity: vis ? +(op / vis).toFixed(2) : 0, swap: root.userData.matSwapState || null,
             clips: Object.fromEntries(Object.entries(mc).map(([k, v]) => [k, v && v[0]])), eyesOff: V.mounted.main.userData.partsDrawn ? null : null };
  };
  for (const mode of [0, 1, 2, 3]){
    cs.value = '0'; cs.dispatchEvent(new Event('change')); await frames(150);
    cs.value = String(mode); cs.dispatchEvent(new Event('change'));
    const at = {};
    await frames(15); at.f15 = look();
    await frames(30); at.f45 = look();
    await frames(45); at.f90 = look();
    out.push([true, 'horn ' + (horn ? 'broken' : 'intact') + ', tail ' + (tail ? 'severed' : 'intact') + ', Invisible ' + mode, JSON.stringify({ rows: [hr, tr], at })]);
  }
  // THE SEVER WITH THE HORN BROKEN, while cloaked (0xdffd1c): the cloak ends
  if (horn && !tail){
    cs.value = '1'; cs.dispatchEvent(new Event('change')); await frames(60);
    const before = look();
    await setRow(3, true); await frames(100);
    out.push([true, 'horn broken, cloaked (Invisible 1), then the tail severed', JSON.stringify({ before, after: look() })]);
  }
  cs.value = '0'; cs.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = chMeter;
export const args = [[false, false], [true, false], [false, true], [true, true]];
