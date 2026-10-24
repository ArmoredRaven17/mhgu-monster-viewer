// Agnaktor (em049_00): what draws the soft glow on the COOLED lava -- meshes, materials, the clip each lava material
// runs, its per-frame opacity / colour / emissive, and the pixels the overlay adds (lava visible vs hidden).
async function cooledProbe(){
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
  const setChk = async (id, v) => { const el = document.getElementById(id); if (el.checked !== v){ el.checked = v; await el.onchange({ target: el }); } };
  out.push([false, 'heat (as opened)', JSON.stringify(V.heat()) + ' heated=' + V.state.heated]);
  await setChk('monHeated', false); await setChk('monBeamHeated', false);
  { const t = performance.now(); while (performance.now() - t < 6600) await frames(10); }   // maguma_End is 360 f
  await frames(30);
  const root = V.mounted.main;
  const visibleUp = o => { for (let x = o; x; x = x.parent) if (x.visible === false) return false; return true; };
  const lava = [];
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach((m, i) => { if (m && /lav0/.test(m.name)) lava.push({ o, m, i }); });
  });
  const desc = ({ o, m }) => ({ mesh: o.name, part: o.userData.part, vis: visibleUp(o), mvis: m.visible,
    type: m.type, blending: m.blending, transparent: m.transparent, depthWrite: m.depthWrite,
    opacity: +m.opacity.toFixed(4), color: m.color && m.color.toArray().map(x => +x.toFixed(4)),
    emissive: m.emissive && m.emissive.toArray().map(x => +x.toFixed(4)), emissiveMap: !!m.emissiveMap,
    map: !!m.map, envAmt: m.userData.u && m.userData.u.uEnvAmt ? m.userData.u.uEnvAmt.value : null,
    specRGB: m.userData.u && m.userData.u.uSpecRGB ? m.userData.u.uSpecRGB.value.toArray() : null,
    reflRGB: m.userData.u && m.userData.u.uReflRGB ? m.userData.u.uReflRGB.value.toArray() : null,
    srcAlpha: m.userData.srcAlpha, alphaCut: m.userData.u && m.userData.u.uAlphaCut ? m.userData.u.uAlphaCut.value : null,
    renderOrder: o.renderOrder, polyOff: m.polygonOffset ? m.polygonOffsetUnits : 0 });
  out.push([false, 'heat (cooled)', JSON.stringify(V.heat())]);
  out.push([false, 'matAnim', String(V.state.matAnim) + ' clip=' + V.state.clip + ' list=' + V.state.list]);
  out.push([false, 'lava count', String(lava.length)]);
  for (const L of lava) out.push([false, 'lava ' + L.m.name, JSON.stringify(desc(L))]);
  // the stage machines
  const rs = root.userData.romStage;
  out.push([false, 'romStage', JSON.stringify(rs && rs.list.map(s => ({ mats: s.mats, heat: s.tbl.heat, stage: s.stage, clip: s.clip, rest: s.rest })))]);
  // per-frame opacity / colour of one drawn lava material per name over 2.2 s
  const byName = {};
  for (const L of lava) if (visibleUp(L.o) && !byName[L.m.name]) byName[L.m.name] = L;
  const series = {};
  const t0 = performance.now();
  while (performance.now() - t0 < 2300){
    await frames(1);
    const ts = performance.now() / 1000, f = (ts * 60) % 120;
    for (const [nm, L] of Object.entries(byName)){
      (series[nm] = series[nm] || []).push([+f.toFixed(1), +L.m.opacity.toFixed(4), +L.m.color.r.toFixed(4), +(L.m.emissive ? L.m.emissive.r : -1).toFixed(4)]);
    }
  }
  for (const [nm, s] of Object.entries(series)){
    const op = s.map(x => x[1]);
    out.push([false, 'series ' + nm, JSON.stringify({ n: s.length, opMin: Math.min(...op), opMax: Math.max(...op),
      sample: s.filter((_, i) => i % 12 === 0) })]);
  }
  // pixels: freeze the material clock at frame 60 of cool_Loop (peak) by rendering with the stepped values, compare lava on/off
  const gl = V.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const grab = () => { V.renderer.render(V.scene, V.camera); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const diff = (a, b) => { let n = 0, s = 0, mx = 0; for (let i = 0; i < a.length; i += 4){ const d = (a[i] - b[i]) + (a[i+1] - b[i+1]) + (a[i+2] - b[i+2]); if (d > 3){ n++; s += d; if (d > mx) mx = d; } } return { px: n, meanSumRGB: n ? +(s / n).toFixed(1) : 0, maxSumRGB: mx }; };
  V.frameAll && V.frameAll();
  await frames(5);
  V.state.matAnim = false;   // hold the materials where they are
  V.pose.action.paused = true;   // and the pose
  await frames(4);
  const drawn = Object.values(byName);
  const snap = drawn.map(L => ({ L, op: L.m.opacity, em: L.m.emissive && L.m.emissive.clone() }));
  const setAll = (op, emOn) => { for (const s of snap){ s.L.m.opacity = op === null ? s.op : op; if (s.L.m.emissive){ if (emOn) s.L.m.emissive.copy(s.em); else s.L.m.emissive.setRGB(0, 0, 0); } } };
  const hide = v => { for (const L of lava) L.m.visible = v; };
  hide(false); const off = grab(); hide(true);
  for (const op of [0.1, 0.05, 1.0]){
    setAll(op, true); const full = grab();
    setAll(op, false); const litOnly = grab();
    out.push([false, 'pixels opacity ' + op, JSON.stringify({ all: diff(full, off), litOnly: diff(litOnly, off), W, H })]);
  }
  // the cooled peak exactly as cool_Loop leaves it (op 0.1, colour 1, emission 1) vs the molten loop's (op 1, colour 0.383 -> 0.1213 decoded)
  const col = drawn.map(L => L.m.color.clone());
  for (const L of drawn) L.m.color.setRGB(1, 1, 1); setAll(0.1, true); const coolPeak = grab();
  for (const L of drawn) L.m.color.setRGB(0.1213, 0.1213, 0.1213); setAll(1.0, true); const molten = grab();
  out.push([false, 'pixels coolPeak vs molten', JSON.stringify({ coolPeak: diff(coolPeak, off), molten: diff(molten, off) })]);
  drawn.forEach((L, i) => L.m.color.copy(col[i]));
  setAll(null, true);
  V.pose.action.paused = false;
  V.state.matAnim = true;
  // molten for comparison
  await setChk('monHeated', true);
  await frames(200);
  out.push([false, 'heat (Heated on, +200f)', JSON.stringify(V.heat())]);
  for (const [nm, L] of Object.entries(byName)) out.push([false, 'molten ' + nm, JSON.stringify(desc(L))]);
  // cool down: Heated off, watch maguma_End -> cool_Loop
  await setChk('monHeated', false);
  const t1 = performance.now(); const cs = [];
  while (performance.now() - t1 < 7000){ await frames(15); const L = byName['XfB_0__m04_lav04']; cs.push([Math.round((performance.now() - t1) / 1000 * 60), +L.m.opacity.toFixed(3), +L.m.color.r.toFixed(3), V.heat().regions.head.clip]); }
  out.push([false, 'cooldown head', JSON.stringify(cs)]);
  // beam heated alone: head + chest hot, the others cooled
  await setChk('monBeamHeated', true);
  await frames(200);
  out.push([false, 'beam heated', JSON.stringify(V.heat())]);
  for (const [nm, L] of Object.entries(byName)) out.push([false, 'beam ' + nm, JSON.stringify({ op: +L.m.opacity.toFixed(3), col: +L.m.color.r.toFixed(3) })]);
  await setChk('monBeamHeated', false);
  return out;
}
export const pageCheck = cooledProbe;
