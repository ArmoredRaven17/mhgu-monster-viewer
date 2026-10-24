const V = window.__view;
const monSel = document.getElementById('monSel');
monSel.value = 'em084_00'; await monSel.onchange();
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
await wait(800);
document.getElementById('hitZonesPanel').dataset.open = 'true';
const sel = document.getElementById('monZoneCap');
const out = { options: [...sel.options].map(o => o.value + '=' + o.textContent).filter(t => /arm/.test(t)) };
const THREE_box = (root) => { const b = { min: [1e9,1e9,1e9], max: [-1e9,-1e9,-1e9] }; root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isMesh && o.geometry){ o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    for (let k = 0; k < 3; k++){ const a = ['x','y','z'][k]; b.min[k] = Math.min(b.min[k], bb.min[a]); b.max[k] = Math.max(b.max[k], bb.max[a]); } } }); return b; };
out.boxes = {};
for (const n of ['main', 'em084_00_left', 'em084_00_right']) if (V.mounted[n]) out.boxes[n] = THREE_box(V.mounted[n]);
for (const sl of [0, 1, 2]){
  const z = V.zones('arm', sl);
  out['slot' + sl] = { menu: z.menu, placed: z.drawn && z.drawn.placed, skipped: z.drawn && z.drawn.skipped,
                       A: z.drawn ? z.drawn.capsules.map(c => c.A.map(v => +v.toFixed(2))) : null };
}
V.zones('arm', 2); V.zones('arm', 2);   // toggle off
return out;
