const V = window.__view;
const monSel = document.getElementById('monSel');
monSel.value = 'em033_00'; await monSel.onchange();
const step = async n => { for (let i = 0; i < n; i++){ await new Promise(r => requestAnimationFrame(r)); } };
const read = () => {
  const out = [];
  const root = V.mounted ? V.mounted.main : null;
  (root || V.scene).traverse(o => {
    if (!o.isMesh || !o.material) return;
    const m = o.material, nm = (o.userData.matOrig && o.userData.matOrig.name) || m.name;
    if (!/m02_eye|m03_sukima|m00_face/.test(nm)) return;
    const tex = (m.uniforms && m.uniforms.tAlbedoMap && m.uniforms.tAlbedoMap.value) || m.map;
    const src = tex && tex.source && tex.source.data && (tex.source.data.src || tex.source.data.currentSrc || '');
    const ud = m.userData || {};
    out.push({ mesh: o.name, mat: nm, visible: o.visible, tex: src ? String(src).split('/').pop() : (tex ? tex.uuid : null),
      romMap: ud.romMap && ud.romMap.source && ud.romMap.source.data ? String(ud.romMap.source.data.src || '').split('/').pop() : null,
      swaps: (ud.texSwap || []).map(t => t && t.source && t.source.data ? String(t.source.data.src || '').split('/').pop() : null),
      clip: ud.matClip || ud.clipName || ud.romClip || null, keys: Object.keys(ud) });
  });
  return out;
};
const res = {};
const rage = document.getElementById('monRage');
res.rageEl = !!rage;
await step(30);
res.calm = read();
if (rage){ rage.checked = true; rage.dispatchEvent(new Event('change')); }
await step(120);
res.enraged = read();
rage.checked = false; rage.dispatchEvent(new Event('change'));
await step(120);
res.calmAgain = read();
for (const k of ['calm','enraged','calmAgain']) res[k] = res[k].map(x => x.mat + ' ' + x.mesh + ' vis=' + x.visible + ' tex=' + String(x.tex).split('?')[0]);
return res;
