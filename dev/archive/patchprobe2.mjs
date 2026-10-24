// patchprobe.mjs: Deviljho c 30 (em043_00c 30, cm202_000) -- which payload field freezes its particle. The record's payload is patched
// in the schedule entry before each replay of L2 M1 (one field set back to its Diablos-c-30 twin's value), and after 60 frames the
// model draw's globalTransparency and the particle's word 5 (it counts on Diablos's) are read.
async function probe(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const mon = 'em043_00';
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const fx = M.effectRuntimeInstance(), S = fx.schedule, m = fx.host.m;
  const E = S.entries.find(e => e.def.record && e.def.record.pel === 'em043_00c' && e.def.record.key === 30 && e.when === 'clip');
  const orig = E.def.record.payload;
  const setByte = (hex, off, v) => hex.slice(0, 2 * off) + v.toString(16).padStart(2, '0') + hex.slice(2 * off + 2);
  const ob = fx.originBone, ri0 = fx.schedule.rockInput;
  const variants = [
    ['original', h => h, () => {}],
    ['A: joint -1 at the mounted root (no origin bone)', h => h, () => { fx.originBone = null; }],
    ['B: ground ray floor +700', h => h, () => { fx.schedule.rockInput = () => Object.assign({}, ri0 ? ri0() : {}, { floorY: 700 }); }],
    ['C: both', h => h, () => { fx.originBone = null; fx.schedule.rockInput = () => Object.assign({}, ri0 ? ri0() : {}, { floorY: 700 }); }],
  ];
  if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
  for (const [name, f, setup] of variants){
    fx.originBone = ob; fx.schedule.rockInput = ri0; setup();
    E.def.record.payload = f(orig);
    clipSel.value = 'Motion[2]'; await clipSel.onchange(); await frames(5);
    const o = [...clipSel.options].find(x => x.value === 'Motion[1]') || [...clipSel.options].find(x => x.value === 'Motion[1]_loop');
    clipSel.value = o.value; await clipSel.onchange();
    await frames(60);
    const q = [...E.requests].reverse().find(q => q.effects().length); const nreq = E.requests.length;
    let gt = null, age = null, w0c = null;
    if (q){
      const u = q.effects()[0], g = m.u32(u + 0x1f0) >>> 0, p = g ? m.u32(g + 0xb0) >>> 0 : 0;
      age = p ? m.u32(p + 0x14) >>> 0 : null; w0c = (m.u32(u + 0xc) >>> 0).toString(16);
      const d = fx.host.drawFrame(q.effects()); gt = d.models.map(x => +x.globalTransparency.toFixed(4));
      var py = p ? +m.f32(p + 0x24).toFixed(1) : null;
    }
    out.push([false, 'PATCH ' + name, JSON.stringify({ live: !!q, nreq, gt, age, w0c, py, floor: fx.host.stageFloorY })]);
  }
  E.def.record.payload = orig; fx.originBone = ob; fx.schedule.rockInput = ri0;
  return out;
}
export const pageCheck = probe;
