const V = window.__view;
const M = await import('/render/rom/effect-mounts.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const lvSel = document.getElementById('monLevel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 300) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = {};
const TAIL = '5,6,15,16,17,40,45,46,47,55,56,57,107';
const id = 'em080_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(1500);
await V.effects(false); await V.effects(true);
out.rt = await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
const tailSel = () => document.querySelector('[data-row="' + TAIL + '"] select');
out.control = { label: document.getElementById('monLevelLab').textContent, hidden: document.getElementById('monLevelRow').hidden,
                rungs: [...lvSel.options].map(o => o.textContent), value: lvSel.selectedOptions[0] && lvSel.selectedOptions[0].textContent };
out.tailOpts = [...tailSel().options].map(o => o.textContent);
out.tailDefault = tailSel().selectedOptions[0].textContent;
const rung = async text => { const o = [...lvSel.options].find(x => x.textContent === text); lvSel.value = o.value; lvSel.dispatchEvent(new Event('change')); await wait(400); };
const pick = async text => { const s = tailSel(); const o = [...s.options].find(x => x.textContent.trim() === text); s.value = o.value; s.dispatchEvent(new Event('change')); await wait(400); };
const m03 = () => { const r = []; V.mounted.main.traverse(o => { if (!o.isMesh || !o.visible) return; for (const m of [].concat(o.material)){
  if (!m || !/m03_tail/.test(m.name || '')) continue;
  const t = (m.uniforms && m.uniforms.tAlbedoMap && m.uniforms.tAlbedoMap.value) || m.map;
  r.push((t && (t.name || (t.image && (t.image.src || t.image.currentSrc)) || t.uuid)) || null); } }); return [...new Set(r.map(x => String(x).split('/').pop().split('?')[0]))]; };
const drawnOn = () => { const d = V.mounted.main.userData.partsDrawn; return [5, 6, 15, 16, 17, 40, 45, 46, 47, 55, 56, 57, 107].filter(p => d.get(p) === true).join(','); };
const tailBits = w => ({ normal: (w >>> 20) & 3, hot: (w >>> 18) & 3, dark: (w >>> 22) & 3 });
const play = async (list, clip) => {
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options];
  const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_start') || opts.find(x => x.value === clip + '_loop');
  clipSel.value = o.value; await clipSel.onchange(); await wait(500);
  const c = M.effectRuntimeInstance().schedule.clip;
  return c && c.mask != null ? '0x' + (c.mask >>> 0).toString(16) + ' ' + JSON.stringify(tailBits(c.mask)) : null;
};
const piece = () => !!(V.mounted.em080_00_tail && V.mounted.em080_00_tail.visible);
out.grid = {};
for (const r of ['Sharpened', 'Heated', 'Dulled']){
  await rung(r);
  for (const f of ['Intact', 'Cracked', 'Severed']){
    await pick(f);
    const row = { drawn: drawnOn(), m03: m03().join(','), shed: piece(), L2M13: await play('2', 'Motion[13]') };
    if (f === 'Intact') row.L2M14 = await play('2', 'Motion[14]');
    out.grid[r + ' / ' + f] = row;
  }
}
// hit-zone Tail switch at Dulled: on -> Severed, off -> Intact; the rung stays
await rung('Dulled'); await pick('Intact');
const zb = () => document.getElementById('monZoneBreaks').querySelector('input');
out.zoneBefore = zb() && zb().checked;
zb().checked = true; zb().onchange(); await wait(300);
out.zoneOn = { tail: tailSel().selectedOptions[0].textContent, rung: lvSel.selectedOptions[0].textContent, checked: zb().checked, drawn: drawnOn() };
zb().checked = false; zb().onchange(); await wait(300);
out.zoneOff = { tail: tailSel().selectedOptions[0].textContent, rung: lvSel.selectedOptions[0].textContent, checked: zb().checked };
// shots
await V.effects(false);
await pick('Intact');
V.frameAll();
const T = V.camera.position.constructor;
const t = V.controls.target.clone(), p = V.camera.position.clone().sub(t);
p.applyAxisAngle(new T(0, 1, 0), Math.PI * 0.8); p.multiplyScalar(0.75); p.y += p.length() * 0.35;
V.camera.position.copy(t).add(p); V.camera.lookAt(t); V.controls.update();
out.shots = {};
for (const [r, f, name] of [['Sharpened', 'Intact', 'state_sharpened'], ['Heated', 'Intact', 'state_heated'], ['Dulled', 'Intact', 'state_dulled'],
                            ['Dulled', 'Cracked', 'state_dulled_cracked'], ['Dulled', 'Severed', 'state_dulled_severed']]){
  await rung(r); await pick(f); await wait(300);
  const s = await V.shot('glav_state', name, 0);
  out.shots[name] = s && s.saved;
}
return out;
