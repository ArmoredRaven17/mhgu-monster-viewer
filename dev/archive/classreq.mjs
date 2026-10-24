// classreq.mjs (run-check-detail.mjs; CR_MON): the class requests driven 2026-10-20, played and metered (draws vs starts)
async function classReq(mon){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  const pick = async (l, c) => { if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); } const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => x.value.startsWith(c + '#')) || [...clipSel.options].find(x => x.value.startsWith(c + '_')); if (!o){ out.push([false, 'MISSING ' + l + '|' + c, '']); return; } clipSel.value = o.value; await clipSel.onchange(); };
  const rage = async on => { const rg = document.getElementById('monRage'); rg.checked = on; await rg.onchange({ target: rg }); };
  const level = async v => { const s = document.getElementById('monLevel'); s.value = String(v); await s.onchange({ target: s }); };
  const rt = () => M.effectRuntimeInstance();
  const failed = () => rt() && rt().failed;
  V.effectMeter(true, { every: 5 });
  const steps = {
    em021_00: async () => { await pick('0', 'Motion[43]'); await frames(120); await pick('0', 'Motion[1]'); await frames(30); },
    em023_00: async () => { await level(2); await pick('0', 'Motion[1]'); await frames(60); await level(1); await frames(120); },
    em023_05: async () => { await level(1); await pick('0', 'Motion[1]'); await frames(60); await level(0); await frames(120); },
    em027_00: async () => { await rage(true); await pick('0', 'Motion[2]'); await frames(120); await rage(false); await pick('0', 'Motion[3]'); await frames(120); },
    em070_00: async () => { await pick('4', 'Motion[11]'); await frames(90); await pick('4', 'Motion[13]'); await frames(90); await pick('2', 'Motion[59]'); await frames(120);
                            await pick('2', 'Motion[48]'); await frames(90); await pick('2', 'Motion[50]'); await frames(90); },
  };
  await steps[mon]();
  const keys = { em021_00: ['em021_00u|500'], em023_00: ['em023_00c|30'], em023_05: ['em023_00c|30'], em027_00: ['em027_00u|2', 'em027_00u|3'],
                 em070_00: [30, 31, 32, 33, 34].map(k => 'em070_00u|' + k) }[mon];
  const recs = V.effectMeterReport().recs.filter(r => keys.some(k => r.key.startsWith(mon + '|' + k + '|')));
  for (const r of recs) out.push([false, 'METER ' + r.key, JSON.stringify({ starts: r.starts, lit: r.litSamples + '/' + r.samples, px: r.pixMax, aimed: r.aimedLit + '/' + r.aimed, verdict: r.verdict })]);
  for (const k of keys) if (!recs.some(r => r.key.startsWith(mon + '|' + k + '|'))) out.push([false, 'NO START ' + k, '']);
  out.push([false, 'FAILED? ' + String(failed() || false), '']);
  V.effectMeter(false);
  return out;
}
export const pageCheck = classReq;
export const args = ((typeof process !== 'undefined' && process.env.CR_MON) ? process.env.CR_MON : 'em021_00').split(',').map(id => [id]);
