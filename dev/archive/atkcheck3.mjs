// atkcheck3.mjs: the Attack Hitboxes row in the ANIMATION panel (moved 2026-10-23): the row's place, the overlay stepping while a clip
// plays with the Animation panel open (Hit Zones closed), the hover pick, a PIXEL check (the frame rendered with the overlay group
// shown vs hidden: pixels that change), and what a switch to the Hit Zones panel does
async function atkCheck3(){
  const out = [];
  const mon = 'em001_00', list = '4', clip = 'Motion[6]';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await until(() => !!V.mounted.main, 900);
  const row = document.getElementById('monAtkBoxRow');
  const sec = row.closest('section'), head = sec && sec.querySelector('.panel-head');
  const ground = document.getElementById('monGroundRow');
  out.push([head && /Animation/.test(head.textContent) && !document.getElementById('hitZonesPanel').contains(row),
    'the Attack Hitboxes row is in the Animation panel', head ? head.textContent.trim() : 'no panel']);
  // (2026-10-27, atkfix lane) the "Effects drawn before" row (monFxPassRow) now sits between Ground and Attack Hitboxes: accepted
  const fxPass = document.getElementById('monFxPassRow');
  out.push([!!ground && (ground.nextElementSibling === row || (!!fxPass && ground.nextElementSibling === fxPass && fxPass.nextElementSibling === row)),
    'it sits after the Ground row (directly, or with only the Effects drawn before row between)', row.previousElementSibling && row.previousElementSibling.id]);
  // open the Animation panel (the accordion: Hit Zones closed)
  if (sec.dataset.open !== 'true') head.click();
  await frames(5);
  out.push([sec.dataset.open === 'true' && document.getElementById('hitZonesPanel').dataset.open !== 'true' && !row.hidden,
    'Animation panel open, Hit Zones closed, the row shown (Rathian has data)', JSON.stringify({ anim: sec.dataset.open, hz: document.getElementById('hitZonesPanel').dataset.open, hidden: row.hidden })]);
  const sel = document.getElementById('monAtkBox');
  sel.value = 'armed'; sel.dispatchEvent(new Event('change'));
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value.startsWith(clip));
  clipSel.value = o.value; await clipSel.onchange();
  V.state.loop = true;
  // the overlay steps while the clip plays
  const seen = new Set(); let maxArmed = 0, frameAt = null;
  for (let i = 0; i < 200; i++){
    await frames(1);
    const st = V.attackBoxes && V.attackBoxes();
    if (!st) continue;
    seen.add(Math.round(st.frame));
    if (st.armed > maxArmed){ maxArmed = st.armed; frameAt = st.frame; }
    if (st.armed >= 2 && i > 40) break;
  }
  out.push([maxArmed > 0 && seen.size > 10, 'the overlay steps with the playing clip (frames seen, the most armed at once)', JSON.stringify({ frames: seen.size, maxArmed, frameAt })]);
  // freeze here and measure pixels: the frame with the overlay group vs without
  const pauseBtn = document.getElementById('animPlay'); if (pauseBtn && /Pause/.test(pauseBtn.textContent)) pauseBtn.click();
  await frames(3);
  const grp = V.scene.children.find(c => c.name === 'attack-hitboxes');
  const gl = V.renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const grab = () => { V.renderer.render(V.scene, V.camera); const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  let changed = 0, redish = 0;
  if (grp){
    const on = grab(); grp.visible = false; const offPx = grab(); grp.visible = true;
    for (let k = 0; k < on.length; k += 4){
      const d = Math.abs(on[k] - offPx[k]) + Math.abs(on[k + 1] - offPx[k + 1]) + Math.abs(on[k + 2] - offPx[k + 2]);
      if (d > 12){ changed++; if (on[k] > on[k + 2] + 20) redish++; }
    }
  }
  const st = V.attackBoxes();
  out.push([!!grp && changed > 500, 'PIXELS: the attack shapes draw (pixels that change with the overlay group shown vs hidden, of them red-leaning)',
    JSON.stringify({ group: !!grp, changed, redish, of: w * h, armed: st && st.armed, frame: st && Math.round(st.frame) })]);
  // the hover pick over a drawn shape: project an armed shape's point, ask the pick
  let picked = null;
  if (grp && st){
    const r = V.renderer.domElement.getBoundingClientRect();
    // scan a coarse grid for the first point the pick answers
    for (let y = 10; y < r.height && !picked; y += 12) for (let x = 10; x < r.width && !picked; x += 12){
      const hit = grp.userData.pick(x, y, V.camera, r.width, r.height); if (hit) picked = { x, y, text: hit.text.split(String.fromCharCode(10))[0] };
    }
  }
  out.push([!!picked, 'the hover pick answers over a drawn shape in the Animation panel', JSON.stringify(picked)]);
  // a switch to the Hit Zones panel: what happens
  document.getElementById('hitZonesPanel').querySelector('.panel-head').click();
  await frames(30);
  const st2 = V.attackBoxes();
  out.push([true, 'switch to Hit Zones: the clip and the overlay', JSON.stringify({ clip: V.state.list + '|' + V.state.clip, overlay: sel.value, armed: st2 && st2.armed, rows: st2 && st2.rows.length, groupVisible: grp && grp.visible })]);
  head.click(); await frames(30);
  const st3 = V.attackBoxes();
  out.push([true, 'back to Animation: the clip and the overlay', JSON.stringify({ clip: V.state.list + '|' + V.state.clip, overlay: sel.value, armed: st3 && st3.armed, rows: st3 && st3.rows.length })]);
  if (pauseBtn && /Play/.test(pauseBtn.textContent)) pauseBtn.click();
  sel.value = 'off'; sel.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = atkCheck3;
export const args = [];
