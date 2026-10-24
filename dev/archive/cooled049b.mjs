// Agnaktor cooled lava: the overlay's pixel contribution split into its lit term and its emission term, at cool_Loop's
// peak (f60: fTransparency 0.1, fDiffuseColor 1) and at its trough (f0 / f120: 0), in whatever colour space the URL asks.
async function cooledSplit(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 900) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const MON = 'em049_00';
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.mounted.main && V.state.id === MON);
  await frames(30);
  const el = document.getElementById('monHeated'); if (el.checked){ el.checked = false; await el.onchange({ target: el }); }
  { const t = performance.now(); while (performance.now() - t < 6600) await frames(10); }
  out.push([false, 'stages', JSON.stringify(Object.fromEntries(Object.entries(V.heat().regions).map(([k, v]) => [k, v.stage])))]);
  out.push([false, 'space', location.search + ' colourManagement=' + (window.THREE ? 'n/a' : '?')]);
  const root = V.mounted.main, lava = [];
  root.traverse(o => { if (!(o.isMesh || o.isSkinnedMesh)) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && /lav0/.test(m.name) && lava.indexOf(m) < 0) lava.push(m); });
  V.frameAll && V.frameAll(); await frames(5);
  V.state.matAnim = false; V.pose.action.paused = true; await frames(4);
  const gl = V.renderer.getContext(); const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const grab = () => { V.renderer.render(V.scene, V.camera); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const diff = (a, b) => { let n = 0, s = 0, mx = 0; for (let i = 0; i < a.length; i += 4){ const d = (a[i] - b[i]) + (a[i+1] - b[i+1]) + (a[i+2] - b[i+2]); if (d > 3){ n++; s += d; if (d > mx) mx = d; } } return { px: n, meanSumRGB: n ? +(s / n).toFixed(1) : 0, maxSumRGB: mx }; };
  const keep = lava.map(m => ({ m, op: m.opacity, c: m.color.clone(), e: m.emissive.clone(), v: m.visible }));
  const set = (op, col, em) => { for (const k of keep){ k.m.opacity = op; k.m.color.setRGB(col, col, col); k.m.emissive.setRGB(em, em, em); k.m.visible = true; } };
  for (const k of keep) k.m.visible = false; const off = grab();
  set(0.1, 1, 1);   const both = grab();
  set(0.1, 1, 0);   const lit = grab();
  set(0.1, 0, 1);   const emis = grab();
  set(0.0, 1, 1);   const trough = grab();
  set(1.0, 0.1213, 1); const molten = grab();    // maguma_Loop f0: fTransparency 1, fDiffuseColor 0.383 (decoded 0.1213)
  out.push([false, 'cool peak (op 0.1)', JSON.stringify({ both: diff(both, off), litOnly: diff(lit, off), emissionOnly: diff(emis, off) })]);
  out.push([false, 'cool trough (op 0)', JSON.stringify(diff(trough, off))]);
  out.push([false, 'molten (op 1, col .383)', JSON.stringify(diff(molten, off))]);
  // base under the lava: mean sum RGB of the covered pixels with the overlay off
  { let n = 0, s = 0; for (let i = 0; i < off.length; i += 4){ const d = (both[i] - off[i]) + (both[i+1] - off[i+1]) + (both[i+2] - off[i+2]); if (d > 3){ n++; s += off[i] + off[i+1] + off[i+2]; } }
    out.push([false, 'rock under the overlay (off)', JSON.stringify({ px: n, meanSumRGB: n ? +(s / n).toFixed(1) : 0 })]); }
  for (const k of keep){ k.m.opacity = k.op; k.m.color.copy(k.c); k.m.emissive.copy(k.e); k.m.visible = k.v; }
  V.pose.action.paused = false; V.state.matAnim = true;
  return out;
}
export const pageCheck = cooledSplit;
