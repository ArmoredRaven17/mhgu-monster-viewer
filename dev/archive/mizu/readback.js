const V = window.__view; const THREE = await import('three');
const monSel = document.getElementById('monSel'), lvSel = document.getElementById('monLevel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const r3 = a => a.map(x => +x.toFixed(4));
const BL = { [THREE.SrcAlphaFactor]: 'SRC_ALPHA', [THREE.OneMinusSrcAlphaFactor]: 'INV_SRC_ALPHA', [THREE.OneFactor]: 'ONE', [THREE.ZeroFactor]: 'ZERO' };
const EQ = { [THREE.AddEquation]: 'ADD', [THREE.ReverseSubtractEquation]: 'REV_SUB' };
function read(){
  let m = null; V.mounted.main.traverse(o => { if (!m && o.material && /m01_angry/.test(o.material.name)) m = o.material; });
  const u = m.userData.u || {};
  const uv = {}; for (const k of Object.keys(u)) { const v = u[k].value; uv[k] = v && v.toArray ? r3(v.toArray()) : (typeof v === 'number' ? +v.toFixed(4) : (v && v.isTexture ? 'tex' : v === null ? null : typeof v)); }
  return { type: m.type, blending: m.blending, src: BL[m.blendSrc], dst: BL[m.blendDst], eq: EQ[m.blendEquation], srcA: BL[m.blendSrcAlpha], dstA: BL[m.blendDstAlpha],
    transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, depthTest: m.depthTest, alphaTest: m.alphaTest, polygonOffset: m.polygonOffset, pof: [m.polygonOffsetFactor, m.polygonOffsetUnits],
    color: r3(m.color.toArray()), emissive: r3(m.emissive.toArray()), emissiveIntensity: m.emissiveIntensity, roughness: m.roughness, metalness: m.metalness,
    map: !!m.map, mapCS: m.map && m.map.colorSpace, alphaMap: !!m.alphaMap, emissiveMap: !!m.emissiveMap, fromMap: m.userData.emissiveFromMap, renderOrder: m.userData.renderOrder, side: m.side, u: uv };
}
const out = {};
for (const id of ['em082_00', 'em082_04']){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2000);
  out[id] = {};
  for (const [n, nm] of [[0, 'normal'], [1, 'enraged'], [2, 'exhausted'], [0, 'normal_after']]){
    lvSel.value = String(n); await lvSel.onchange({ target: lvSel }); await wait(1200);
    out[id][nm] = read();
  }
}
return out;
