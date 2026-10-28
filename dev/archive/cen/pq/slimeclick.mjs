// pq/slimeclick.mjs (2026-10-25): the real click path -- for every pixel of a coarse grid over the viewport, a synthetic pointerdown /
// pointerup (no move) on #viewport with Red Slime on; which slots each click armed (the fuse set), and that a 20 px drag arms nothing
async function sc(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const MON = 'em063_05', monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.mounted.main, 900);
  V.state.loop = true;
  const rage = $('monRage'); rage.checked = true; rage.dispatchEvent(new Event('change'));
  await frames(40);
  const vp = $('viewport'), r = vp.getBoundingClientRect();
  const fire = async (x, y, dx = 0) => {
    vp.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, button: 0, bubbles: true }));
    vp.dispatchEvent(new PointerEvent('pointerup', { clientX: x + dx, clientY: y, button: 0, bubbles: true }));
    await frames(3);
  };
  const armed = () => (window.__slime063.state() || []).map(s => s.fuse > 0 || s.col === 3 || (s.col === 0 && s.cd < 100) ? 1 : 0);
  const hits = {};
  const picks = [];
  for (let gy = 0.15; gy < 0.9; gy += 0.1) for (let gx = 0.1; gx < 0.9; gx += 0.1) picks.push(await window.__slime063.pick(r.left + r.width * gx, r.top + r.height * gy));
  let nmesh = 0, nprim = 0; V.mounted.main.traverse(o => { if (o.isMesh || o.isSkinnedMesh){ nmesh++; if (o.userData.prim !== undefined) nprim++; } });
  // a drag first: must arm nothing
  await fire(r.left + r.width / 2, r.top + r.height / 2, 20); await frames(3);
  const afterDrag = armed();
  // the four warning joints (u 200..203: 7 / 10 / 3 / 143), projected to the screen, and a ring of points around each
  const SK = await import('/render/skeleton.js'); const gb = SK.gidBonesOf(V.mounted.main); const bones = {}; for (const g of [7, 10, 3, 143]){ const e = gb.find(x => x.gid === g); bones[g] = e && (e.leaf || e.node); }
  const proj = b => { const v = b.getWorldPosition(new V.camera.position.constructor()); v.project(V.camera); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; };
  const tried = [];
  for (const [k, g] of [[0, 7], [1, 10], [2, 3], [3, 143]]){
    const b = bones[g]; if (!b){ tried.push([k, 'no bone ' + g]); continue; }
    const [x, y] = proj(b);
    for (const [ox, oy] of [[0, 0], [6, 0], [-6, 0], [0, 6], [0, -6], [12, 0], [-12, 0], [0, 12], [0, -12]]){
      const p = await window.__slime063.pick(x + ox, y + oy);
      tried.push([k, g, Math.round(x + ox), Math.round(y + oy), p]);
      if ({ 0: 2, 2: 1, 3: 0, 6: 3 }[p] === k){
        const before = window.__slime063.state()[k].fuse;
        await fire(x + ox, y + oy);
        if (window.__slime063.state()[k].fuse > 0 && !(before > 0)) hits[k] = (hits[k] || 0) + 1;
        break;
      }
    }
  }
  return [[false, 'SLIMECLICK', JSON.stringify({ tried, nmesh, nprim, rect: [r.left, r.top, r.width, r.height], afterDrag, hits, state: window.__slime063.state() })]];
}
export const pageCheck = sc;
export const args = [[]];
