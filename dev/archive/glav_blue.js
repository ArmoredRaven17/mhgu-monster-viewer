const V = window.__view;
const SP = await import('/render/rom/specular.js');
const monSel = document.getElementById('monSel');
const lvSel = document.getElementById('monLevel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const id = 'em080_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(1500);
await V.effects(false);
const rung = async text => { const o = [...lvSel.options].find(x => x.textContent === text); lvSel.value = o.value; lvSel.dispatchEvent(new Event('change')); await wait(400); };
const v3 = v => v ? [v.x, v.y, v.z].map(n => +n.toFixed(3)) : null;
const mats = () => { const r = []; V.mounted.main.traverse(o => { if (!o.isMesh || !o.visible) return; for (const m of [].concat(o.material)){
  if (!m || !/m03_tail|m04_tail/.test(m.name || '')) continue;
  const u = m.userData.u || {}; const t = (m.uniforms && m.uniforms.tAlbedoMap && m.uniforms.tAlbedoMap.value) || m.map;
  r.push({ mat: m.name, map: t && t.image && String(t.image.src || t.image.currentSrc || '').split('/').pop().split('?')[0], colorSpace: t && t.colorSpace,
           color: m.color ? m.color.toArray().map(n => +n.toFixed(3)) : null, specRGB: v3(u.uSpecRGB && u.uSpecRGB.value), specTint: u.uSpecTint && u.uSpecTint.value,
           reflRGB: v3(u.uReflRGB && u.uReflRGB.value), opacity: m.opacity }); } }); return r; };
// same camera for every shot
V.frameAll();
const T = V.camera.position.constructor;
const t = V.controls.target.clone(), p = V.camera.position.clone().sub(t);
p.applyAxisAngle(new T(0, 1, 0), Math.PI * 0.8); p.multiplyScalar(0.75); p.y += p.length() * 0.35;
V.camera.position.copy(t).add(p); V.camera.lookAt(t); V.controls.update();
const out = { cam: V.camera.position.toArray() };
for (const [r, name] of [['Sharpened', 'blue_sharpened'], ['Dulled', 'blue_dulled']]){
  await rung(r); await wait(300);
  out[name] = { mats: mats() };
  out[name].shot = (await V.shot('glav_blue', name, 0)).saved;
}
SP.setGlobalReflection(false);
for (const [r, name] of [['Sharpened', 'blue_sharpened_norefl'], ['Dulled', 'blue_dulled_norefl']]){
  await rung(r); await wait(300);
  out[name] = (await V.shot('glav_blue', name, 0)).saved;
}
SP.setGlobalReflection(true);
out.cam2 = V.camera.position.toArray();
return out;
