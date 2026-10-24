const V = window.__view;
const monSel = document.getElementById('monSel');
monSel.value = 'em033_00'; await monSel.onchange();
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const mats = {};
V.mounted.main.traverse(o => { if (o.isMesh && o.material) mats[o.material.name] = o.material; });
const nm = t => t && t.source && t.source.data ? String(t.source.data.src).split('/').pop().split('?')[0].slice(0, 6) : String(t);
const col = { bb455a: 'GREEN', '751344': 'ORANGE' };
const snap = () => ({ eye: col[nm(mats['XfB__m02_eye'].map)] || nm(mats['XfB__m02_eye'].map),
                      body: nm(mats['XfB_N__E0__m01_body'].map),
                      stage: (V.mounted.main.userData.romStage || { list: [] }).list.map(s => s.stage + ':' + s.clip).join(',') });
const rage = document.getElementById('monRage'), out = {};
await wait(500); out.calm0 = snap();
rage.checked = true; rage.dispatchEvent(new Event('change'));
await wait(300); out.enr_0_3s = snap();
await wait(1500); out.enr_1_8s = snap();
rage.checked = false; rage.dispatchEvent(new Event('change'));
await wait(300); out.calm_0_3s = snap();
await wait(1500); out.calm_1_8s = snap();
rage.checked = true; rage.dispatchEvent(new Event('change'));
await wait(1800); out.enr2 = snap();
rage.checked = false; rage.dispatchEvent(new Event('change'));
await wait(1800); out.calm2 = snap();
return out;
