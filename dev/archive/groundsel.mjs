// dev/checks/ground-control.mjs (effects lane, 2026-10-20; run by dev/motion-states-check.mjs): the Ground select in the Animation panel -- a change mid-play replays the clip on the new ground.
// Tigrex L0 M76 (c 25) and L2 M5 (shell00 modes by ctl+0x29), plain -> Ground B by the select; the meter on c 25; the lowest-bone checkbox.
async function groundSel(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const ok = (c, msg, d = '') => out.push([!!c, msg, d]);
  V.pose.clock.getDelta = () => 1 / 60;
  const mon = 'em032_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const gs = document.getElementById('monGroundType');
  ok(gs && gs.tagName === 'SELECT', 'the Ground select exists (#monGroundType)');
  ok(gs && gs.closest('section') && /Animation/.test(gs.closest('section').querySelector('.panel-head').textContent), 'it sits in the Animation panel');
  ok(gs && gs.options.length === 7, 'seven types', gs && [...gs.options].map(o => o.textContent).join(' / '));
  const cb = document.getElementById('monGround');
  ok(cb && cb.type === 'checkbox', 'Ground Lowest Bone keeps its own id (no clash)');
  const pick = async (l, c) => { if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); } const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => x.value.startsWith(c)); clipSel.value = o.value; await clipSel.onchange(); };
  // c 25 on L0 M76: plain first, then Ground B through the select, mid-play
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  window.__ground.set('plain');
  await pick('0', 'Motion[76]');
  V.effectMeter(true, { every: 5 });
  await frames(160);
  const r0 = V.effectMeterReport().recs.find(r => r.key === mon + '|em032_00c|25|clip');
  V.effectMeter(false);
  ok(r0 && r0.starts > 0 && r0.verdict === 'live, no draw', 'plain: c 25 starts and draws nothing', JSON.stringify(r0 && { s: r0.starts, v: r0.verdict, lit: r0.litSamples + '/' + r0.samples }));
  const t0 = V.pose.action.time;
  gs.value = 'g8'; gs.onchange();
  await frames(2);
  ok(V.pose.action.time < 0.2 && t0 > 1, 'a change replays the clip from its start', 't before ' + t0.toFixed(2) + ' after ' + V.pose.action.time.toFixed(2));
  ok(window.__ground.now().key === 'g8', '__ground.now() follows the select');
  V.effectMeter(true, { every: 5 });
  await frames(160);
  const r1 = V.effectMeterReport().recs.find(r => r.key === mon + '|em032_00c|25|clip');
  V.effectMeter(false);
  ok(r1 && r1.starts > 0 && r1.verdict === 'draws', 'Ground B: c 25 DRAWS', JSON.stringify(r1 && { s: r1.starts, v: r1.verdict, lit: r1.litSamples + '/' + r1.samples, px: r1.pixMax }));
  // L2 M5: the shells' floor input follows the select
  const S = M.effectRuntimeInstance().schedule;
  const modes = async key => {
    gs.value = key; gs.onchange(); await pick('2', 'Motion[5]'); const n0 = (S.shellTally && S.shellTally.spawned) || 0;
    const seen = []; const st = S.shells && S.shells.state; const old = new Set(((st && st.shells) || []).map(sh => sh.id));
    for (let i = 0; i < 200; i++){ await frames(1); for (const sh of (st && st.shells) || []) if (sh.shell === 'shell00' && !old.has(sh.id) && !seen.includes(sh.modeIndex)) seen.push(sh.modeIndex); }
    return seen.sort((a, b) => a - b).join('/');
  };
  const mp = await modes('plain'), mb = await modes('g8'), me = await modes('a2'), mf = await modes('g40');
  ok(mp === '0/1/2' && mb === '0/1/2' && me === '3/4/5' && mf === '9/10/11', 'L2 M5 shell00 modes per ground (ctl+0x29: plain / B 0..2, E 3..5, F 9..11)', 'plain ' + mp + '; B ' + mb + '; E ' + me + '; F ' + mf);
  // the lowest-bone checkbox drives its own state again
  const before = !!V.state.groundLock; cb.checked = !before; await cb.onchange({ target: cb });
  ok(!!V.state.groundLock === !before, 'Ground Lowest Bone toggles state.groundLock');
  cb.checked = before; await cb.onchange({ target: cb });
  return out;
}
export const pageCheck = groundSel;
