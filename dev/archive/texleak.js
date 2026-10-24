const V = window.__view;
const THREE = await import('three');
const live = new Map();
const proto = THREE.Texture.prototype;
const desc = Object.getOwnPropertyDescriptor(proto, 'needsUpdate');
Object.defineProperty(proto, 'needsUpdate', { configurable: true, set(v){ if (v && !live.has(this)) live.set(this, (new Error().stack || '').split('\n').slice(2, 7).map(l => l.trim().replace(/https?:\/\/[^/]+\//, '')).join(' < ')); desc.set.call(this, v); } });
const disp = proto.dispose;
proto.dispose = function(){ live.delete(this); return disp.call(this); };
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
for (const id of ['em002_04', 'em081_04', 'em084_00', 'em050_00', 'em001_00']){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2500);
}
const inScene = new Set();
V.scene.traverse(o => { const mats = Array.isArray(o.material) ? o.material : [o.material]; for (const m of mats){ if (!m) continue;
  for (const k in m) if (m[k] && m[k].isTexture) inScene.add(m[k]); if (m.uniforms) for (const k in m.uniforms){ const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) inScene.add(v); } } });
const bySite = new Map();
for (const [t, site] of live){ if (inScene.has(t)) continue; bySite.set(site, (bySite.get(site) || 0) + 1); }
return { tracked: live.size, inScene: inScene.size, gpu: V.renderer.info.memory.textures,
         orphanSites: [...bySite.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8) };
