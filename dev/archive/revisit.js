const V = window.__view;
const errs = []; window.addEventListener('error', e => errs.push(String(e.message)));
const el = document.getElementById('setTexCache'); el.value = '0'; el.dispatchEvent(new Event('input'));
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const pick = async id => { if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id)); monSel.value = id; await monSel.onchange(); await wait(2500); };
const albedos = () => { let n = 0, ok = 0; V.mounted.main.traverse(o => { if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
  const m = o.material, u = m.userData && m.userData.u, t = (u && u.tAlbedoMap && u.tAlbedoMap.value) || m.map;
  if (!t) return; n++; if (t.image && (t.image.width || t.image.naturalWidth)) ok++; }); return { withMap: n, imageReady: ok }; };
await pick('em001_00'); const first = albedos();
await pick('em081_04'); await pick('em084_00');
await pick('em001_00'); const again = albedos();
// a frame rendered: the renderer re-uploads anything it needs
V.renderer.render(V.scene, V.camera);
return { first, again, gpuTextures: V.renderer.info.memory.textures, cache: window.__texCache, errs };
