const V = window.__view;
const M = await import('/render/monster.js');
const A = await import('/render/assets.js');
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const info = () => ({ tex: V.renderer.info.memory.textures, texCache: A.texCache.size, glbCache: A.glbCache.size, poseCache: A.poseCache.size,
                      fx: (() => { const fx = M.effectRuntimeInstance && M.effectRuntimeInstance(); return fx ? { textures: fx.textures ? fx.textures.size : null } : null; })() });
const out = { start: info() };
for (const id of ['em002_04', 'em081_04', 'em084_00', 'em050_00']){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(3000);
  out[id] = info();
}
await V.effects(false); await wait(1500); out.effectsOff = info();
// textures still referenced by the scene graph (materials of anything in the scene)
const seen = new Set();
V.scene.traverse(o => { const mats = Array.isArray(o.material) ? o.material : [o.material]; for (const m of mats){ if (!m) continue;
  for (const k in m) if (m[k] && m[k].isTexture) seen.add(m[k]); if (m.uniforms) for (const k in m.uniforms){ const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) seen.add(v); } } });
out.sceneTextures = seen.size;
return out;
