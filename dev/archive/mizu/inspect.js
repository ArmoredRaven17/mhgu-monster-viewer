const V = window.__view;
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const id = 'em082_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(2000);
const out = { keys: Object.keys(V).slice(0, 200) };
const ov = [];
V.mounted.main.traverse(o => { if (o.material && /m01_angry/.test(o.material.name)) {
  const m = o.material;
  ov.push({ part: o.userData.part, vis: o.visible, name: m.name, type: m.type, color: m.color && m.color.toArray(), em: m.emissive && m.emissive.toArray(),
    op: m.opacity, tr: m.transparent, bl: m.blending, dw: m.depthWrite, rom: m.userData.rom && { feat: m.userData.rom.feat, glob: m.userData.rom.glob, cbm: m.userData.rom.cbm, s: m.userData.rom.s, fb: m.userData.rom.fb } });
}});
out.ov = ov;
out.lists = [...listSel.options].map(o => o.value);
out.state = { list: V.state.list, clip: V.state.clip, level: V.state.level, rage: V.state.rage, tired: V.state.tired };
out.clips = [...clipSel.options].slice(0, 12).map(o => o.value);
out.ms = V.motionStates();
return out;
