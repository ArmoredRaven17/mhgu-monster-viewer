// cgmeter.mjs: CONGALALA's Gas Type x Charges -- L2 M16 (the gas breath) and L2 M7 (the gas-less one) through the draw meter, per
// combination; the breath records (u 100, u 130..160, u 300..330) and the L2 M16 colour records (u 200..203) by starts / lit
async function cgMeter(gas, chargeV){
  const out = [];
  const mon = 'em021_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  const cs = document.getElementById('monClassCtl'), c2 = document.getElementById('monClassCtl2');
  cs.value = String(gas); cs.dispatchEvent(new Event('change'));
  c2.value = String(chargeV); c2.dispatchEvent(new Event('change'));
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const rt = M.effectRuntimeInstance();
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  V.state.loop = false;
  V.effectMeter(true, { every: 5 });
  for (const clip of ['Motion[16]', 'Motion[7]']){
    if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip);
    if (!o){ out.push([false, 'the list has 2|' + clip, '']); continue; }
    clipSel.value = o.value; await clipSel.onchange();
    await frames(clip === 'Motion[16]' ? 320 : 260);
  }
  const rep = V.effectMeterReport();
  V.effectMeter(false);
  const want = [100, 130, 140, 150, 160, 300, 310, 320, 330, 200, 201, 202, 203];
  const rows = {};
  for (const r of rep.recs){
    const m = /\|em021_00u\|(\d+)\|/.exec(r.key);
    if (m && want.includes(+m[1])) rows['u ' + m[1] + ' ' + r.when] = r.starts + ' st, ' + r.litSamples + '/' + r.samples + ' lit';
  }
  out.push([true, 'gas ' + gas + ', charges ' + (5 - chargeV) + ': ' + JSON.stringify(rows), rt.failed ? 'FAILED ' + rt.failed : '']);
  cs.value = '0'; cs.dispatchEvent(new Event('change')); c2.value = '0'; c2.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = cgMeter;
export const args = [0, 1, 2, 3, 4].flatMap(g => [[g, 0], [g, 3], [g, 4], [g, 5]]);
