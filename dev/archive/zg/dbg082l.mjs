// debug: which Soulseer class record (u 310 / 320 / 321 / 330 UNIQUE) runs into an unrecorded path
async function dbg(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em082_04';
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  const listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON);
  const rt = M.effectRuntimeInstance();
  const res = [];
  const sel = async (list, v, n) => { if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === v) || [...clipSel.options].find(x => x.value === v + '_loop'); if (o) v = o.value; if (!o){ res.push('no ' + v); return; }
    clipSel.value = v; await clipSel.onchange(); await frames(n); res.push(v + ': ' + (rt.failed || 'ok')); };
  const rageBox = document.getElementById('monRage');
  const sel2 = async (l, v) => { if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === v) || [...clipSel.options].find(x => x.value === v + '_loop'); clipSel.value = o.value; await clipSel.onchange(); };
  const MS = await import('/render/motion-states.js'), PM = await import('/render/psl-mask.js');
  const row = MS.MOTION_STATES.em082_04['9|Motion[5]'], ca = PM.CLIP_ACTIONS.em082_04['9|Motion[5]'];
  MS.MOTION_STATES.em082_04['9|Motion[5]'] = undefined;
  const CPU = await import('/render/rom/effect/cpu.js');
  const seq = []; const add0 = CPU.lifted(0xb99750), fl0 = CPU.lifted(0xb978cc), w0 = CPU.lifted(0xb9a5f0), log = []; let wlr = null;
  CPU.registerNative(0xb9a5f0, (m, c) => { wlr = '0x' + ((c.r[14] - 4) >>> 0).toString(16); w0(m, c); });
  let adds = [], tag = '';
  CPU.registerNative(0xb99750, (m, c) => { const fp = c.r[1] >>> 0, w = m.u16(fp + 0x10), ec = m.u32((c.r[0] + 0xec) >>> 0);
    adds.push(w + (ec ? '' : '!ec')); add0(m, c); });
  CPU.registerNative(0xb978cc, (m, c) => { const sb = c.r[0] >>> 0, f8 = m.u32(sb + 0xf8), st = m.u32(sb + 0x20);
    seq.push((f8 === 0 ? 'FLUSH0 ' : 'flush ') + (sb >>> 0).toString(16) + ' adds ' + adds.length + ' f8 ' + f8 + ' ' + tag);
    if (f8 === 0) log.push({ tag, wlr, r1: c.r[1] >>> 0, r2: c.r[2] >>> 0, lr: '0x' + ((c.r[14] - 4) >>> 0).toString(16), f8, st20: st, f4: m.u32(sb + 0xf4), ec: m.u32(sb + 0xec), adds: adds.slice(-12) });
    adds = []; fl0(m, c); });
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON);
  const r2 = M.effectRuntimeInstance();
  const h0 = r2.holdEvent.bind(r2); r2.holdEvent = (p, k, on) => { seq.push('HOLD ' + k + ' ' + on + ' ' + tag); return h0(p, k, on); };
  const sst = r2.schedule.step.bind(r2.schedule); r2.schedule.step = (...a) => { seq.push('STEP ' + tag); return sst(...a); };
  const fr0 = r2.frameUnsafe.bind(r2); r2.frameUnsafe = (...a) => { seq.push('render ' + tag + ' adv ' + r2.advance + ' acc ' + (r2.acc || 0).toFixed(4)); return fr0(...a); };
  await sel2('9', 'Motion[5]_loop'); r2.holdEvent('em082_04u', 310, true);
  for (let k = 0; k < 6; k++){ tag = 'held f' + k; await frames(1); }
  tag = 'stop'; await sel2('9', 'Motion[2]'); r2.holdEvent('em082_04u', 310, false);
  for (let k = 0; k < 10; k++){ tag = 'after f' + k; await frames(1); }
  res.push({ failed: r2.failed || 'ok', seq: seq.slice(-40) });
  CPU.registerNative(0xb99750, add0); CPU.registerNative(0xb978cc, fl0); CPU.registerNative(0xb9a5f0, w0);
  MS.MOTION_STATES.em082_04['9|Motion[5]'] = row; PM.CLIP_ACTIONS.em082_04['9|Motion[5]'] = ca;
  check(false, 'debug', res);
  return out;
}
export const pageCheck = dbg;
