const V = window.__view;
const M = await import('/render/rom/effect-mounts.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
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
out.tailOpts = [...tailSel().options].map(o => o.value + ':' + o.textContent);
out.tailDefault = tailSel().selectedOptions[0].textContent;
const pick = async text => { const s = tailSel(); const o = [...s.options].find(x => x.textContent.trim() === text); s.value = o.value; s.dispatchEvent(new Event('change')); await wait(400); };
const m03 = () => { const r = []; V.mounted.main.traverse(o => { if (!o.isMesh || !o.visible) return; for (const m of [].concat(o.material)){
  if (!m || !/m03_tail/.test(m.name || '')) continue;
  const t = (m.uniforms && m.uniforms.tAlbedoMap && m.uniforms.tAlbedoMap.value) || m.map;
  r.push((t && (t.name || (t.image && (t.image.src || t.image.currentSrc)) || t.uuid)) || null); } }); return [...new Set(r.map(x => String(x).split('/').pop()))]; };
const drawnOn = () => { const d = V.mounted.main.userData.partsDrawn; return [5, 6, 15, 16, 17, 40, 45, 47, 107].filter(p => d.get(p) === true); };
const fields = w => ({ tail_normal_20_21: (w >>> 20) & 3, tail_hot_18_19: (w >>> 18) & 3, tail_dark_22_23: (w >>> 22) & 3, tail_over_24_25: (w >>> 24) & 3 });
const play = async (list, clip) => {
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options];
  const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_start') || opts.find(x => x.value === clip + '_loop');
  clipSel.value = o.value; await clipSel.onchange(); await wait(500);
  const c = M.effectRuntimeInstance().schedule.clip;
  return { key: c && c.key, mask: c && c.mask != null ? '0x' + (c.mask >>> 0).toString(16) : null, ...(c && c.mask != null ? fields(c.mask) : {}) };
};
const zone = async on => { const i = document.getElementById('monZoneBreaks').querySelector('input'); if (!i) return 'no switch'; i.checked = on; i.onchange(); await wait(300); return tailSel().selectedOptions[0].textContent; };
for (const item of ['Intact', 'Intact, Heated', 'Intact, Dulled', 'Cracked, Dulled']){
  await pick(item);
  const r = { applied: tailSel().selectedOptions[0].textContent, drawn: drawnOn(), m03_albedo: m03() };
  r.L2M13 = await play('2', 'Motion[13]');
  r.L2M14 = await play('2', 'Motion[14]');
  r.zoneSwitch = [...document.getElementById('monZoneBreaks').querySelectorAll('label')].map(l => l.textContent + '=' + l.querySelector('input').checked).join(',');
  out[item] = r;
}
// the hit-zone Tail switch on the synth row: on -> Severed, off -> the first non-severed item
await pick('Intact, Dulled');
out.zoneOn = await zone(true);
out.zoneOnChecked = document.getElementById('monZoneBreaks').querySelector('input').checked;
out.zoneOff = await zone(false);
// shots: rest clip, side camera
await pick('Intact');
if (V.state.list !== '0'){ listSel.value = '0'; await listSel.onchange(); }
const o0 = [...clipSel.options][0]; clipSel.value = o0.value; await clipSel.onchange(); await wait(500);
out.restClip = clipSel.value;
const shots = {};
for (const [item, name] of [['Intact', 'tail_intact'], ['Intact, Heated', 'tail_heated'], ['Intact, Dulled', 'tail_dulled'], ['Cracked, Dulled', 'tail_cracked_dulled']]){
  await pick(item); await wait(300);
  const r = await V.shot('glav_dulled', name, 0);
  shots[name] = r && (r.path || r.file || r);
}
out.shots = shots;
return out;
