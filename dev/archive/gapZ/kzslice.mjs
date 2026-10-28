// kzslice.mjs (run-check.mjs): Khezu's (7, 0x4d) on its Special entry 'S. Motion 3 (7:0x4d)' (L2 M3 to 200, again from 40, then L2 M13),
// Hyper Off and holding 1 / 2, the Attack Hitboxes overlay on (armed): TOP-DOWN grabs at the chain frames `at`, the live sp_03 (mode,
// unit, position), the overlay's shell hit shapes (window.__view.shellHits) and the effect meter's shell rows.
async function kzSlice(c){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const hySel = document.getElementById('monHyper'), atk = document.getElementById('monAtkBox');
  if (V.state.id !== c.mon){ monSel.value = c.mon; await monSel.onchange(); }
  const grab = () => { V.renderer.render(V.scene, V.camera); try { return V.renderer.domElement.toDataURL('image/png'); } catch (e){ return 'ERR ' + e; } };
  for (const pass of ['off', 'on']){
    await raf();
    const opts = [...hySel.options].map(o => o.value);
    const want = pass === 'off' ? '' : (opts.find(o => o && o.split(',').map(Number).includes(1)) || '');
    hySel.value = want; hySel.onchange({ target: hySel });
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === c.mon, 900);
    const rt = M.effectRuntimeInstance(), sc = rt.schedule;
    V.state.loop = false;
    atk.value = 'armed'; atk.onchange({ target: atk });
    V.effectMeter(true, { every: 2 });
    if (V.state.list !== 'Special'){ listSel.value = 'Special'; await listSel.onchange(); }
    await until(() => [...clipSel.options].some(x => x.value === c.clip), 600);
    const o = [...clipSel.options].find(x => x.value === c.clip);
    if (!o){ out.push([false, 'NOCLIP', JSON.stringify([...clipSel.options].map(x => x.value))]); return out; }
    clipSel.value = o.value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip() && V.pose.action.getClip().name === c.clip, 300);
    const act = V.pose.action;
    const seen = new Map(); const shots = {};
    for (let i = 0; i < 8000; i++){
      await raf();
      const t = Math.round(act.time * 60);
      for (const S of sc.shells.state.shells) if (S.shell === 'shell03' && !seen.has(S.id))
        seen.set(S.id, { t, mode: S.modeIndex, wave: S.wave || 1, unit: S.unitScale == null ? null : +(+S.unitScale).toFixed(3), hyper: S.hyper ? S.hyper.id : null });
      for (const at of c.at) if (!shots[at] && t >= at){
        // top-down over the monster: the camera straight above the effects' parent (the unit), looking down, +Z up the frame
        const P = rt.parent && rt.parent.position, C = V.controls, cam = V.camera;
        const cx = P ? P[0] * 0.01 : 0, cz = P ? P[2] * 0.01 : 0;
        C.target.set(cx, 0, cz + c.ahead); cam.position.set(cx, c.height, cz + c.ahead + 0.01); cam.up.set(0, 1, 0); C.update();
        const live = sc.shells.state.shells.filter(S => S.shell === 'shell03' && S.position).map(S => ({ mode: S.modeIndex, wave: S.wave || 1, unit: S.unitScale == null ? null : +(+S.unitScale).toFixed(2),
                                                                                                  pos: S.position.map(x => Math.round(x)), moves: S.moves }));
        const hits = V.shellHits ? V.shellHits() : null;
        const seq = V.seqMotion ? V.seqMotion() : null;
        out.push([false, 'AT ' + pass + ' ' + at, JSON.stringify({ t, owner: P ? P.map(x => Math.round(x)) : null, live,
          hits: (hits || []).map(h => ({ mode: h.mode, r: h.shapes[0] && h.shapes[0].r, p0: h.shapes[0] && h.shapes[0].p0.map(Math.round), p1: h.shapes[0] && h.shapes[0].p1.map(Math.round) })) })]);
        shots[at] = grab();
      }
      if (act.paused && act.time >= act.getClip().duration - 2e-3) break;
    }
    const s0 = rt.stats.steps; await until(() => rt.stats.steps - s0 >= 60, 3000);
    const rep = V.effectMeterReport().recs.filter(r => r.monster === c.mon && r.when === 'shell' && r.starts > 0)
      .map(r => ({ k: r.key.split('|').slice(1).join('|'), st: r.starts, lit: r.litSamples + '/' + r.samples, px: r.pixMax, v: r.verdict }));
    V.effectMeter(false);
    out.push([false, 'PASS ' + pass, JSON.stringify({ hyper: want, made: [...seen.values()], meter: rep, refused: sc.shellTally ? sc.shellTally.refused.slice(-5) : null })]);
    for (const [at, x] of Object.entries(shots)) out.push([false, 'SHOT ' + pass + at + ' ' + c.mon, x]);
  }
  hySel.value = ''; hySel.onchange({ target: hySel }); atk.value = 'off'; atk.onchange({ target: atk });
  return out;
}
export const pageCheck = kzSlice;
export const args = [[{ mon: 'em003_00', clip: 'S. Motion 3 (7:0x4d)', at: [230, 372], height: 75, ahead: 14 }]];
