// How many textures each monster's mount loads, their decoded size, and the time the switch spends between the model
// file and the textures' end (the decode wait).
async function texCount(){
  const out = [];
  const V = window.__view;
  const A = await import('/render/assets.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  await V.effects(false);
  const monSel = document.getElementById('monSel');
  for (const MON of ['em088_00', 'em077_00', 'em001_00', 'em007_00', 'em043_00', 'em084_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    A.texCache.clear();
    const t0 = performance.now();
    monSel.value = MON; await monSel.onchange();
    const t1 = performance.now();
    await until(() => V.state.id === MON && V.mounted.main);
    let mp = 0, n = 0, big = 0;
    const sizes = [];
    for (const [k, v] of A.texCache){
      const t = await v; const im = t && t.image; if (!im) continue;
      n++; const px = im.width * im.height; mp += px; if (px >= 2048 * 2048) big++;
      sizes.push(im.width + 'x' + im.height);
    }
    const hist = {}; for (const s of sizes) hist[s] = (hist[s] || 0) + 1;
    const top = Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, c]) => s + ' x' + c).join(', ');
    const res = performance.getEntriesByType('resource').filter(r => r.startTime >= t0 && /\/tex\//.test(r.name));
    const kb = res.reduce((s, r) => s + (r.encodedBodySize || 0), 0) / 1024;
    out.push([false, MON, JSON.stringify({ textures: n, megapixels: +(mp / 1e6).toFixed(1), at2048plus: big, texMB: +(kb / 1024).toFixed(1), switchMs: Math.round(t1 - t0), sizes: top })]);
  }
  return out;
}
export const pageCheck = texCount;
