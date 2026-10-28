// laneB3/hypereye.mjs (lane B3, 2026-10-27): the GU Hyper HEAD aura on the page -- per monster (HYPER_IDS env, comma list): the Hyper
// dropdown set to the option holding the head aura (the docs/hyper-auras.json aura whose record is the monster's own emXXX_00_500
// effect, joint `joint`), the draw meter on (every 2nd frame), then the camera framed on that joint's bone (skeleton.js gidBonesOf) and
// a shot (dev/shots/laneB3_hypereye/<id>.png), plus one with Hyper Off for comparison. Prints the meter's row for the head aura.
async function check(ids){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), SK = await import('/render/skeleton.js');
  const HA = await (await fetch('/hyper-auras.json')).json();
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel');
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange(); await frames(120);
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    const file = HA[MON] && (HA[MON].normal || HA[MON].g);
    const head = file && file.auras.find(a => a.joint !== undefined && (a.part === 0 || a.part === 5 || a.part === 6) &&
                                          (M.effectRuntimeInstance().def.effects || []).some(e => e.record && e.record.key === a.key && /_500\.efl$/.test(e.efl)));
    if (!head){ out.push([false, 'HYPER-EYE ' + MON, 'no head aura with an _500 effect']); continue; }
    const sel = $('monHyper');
    const opt = [...sel.options].find(o => o.value && o.value.split(',').map(Number).includes(head.id));
    // frame the head joint
    const root = V.mounted && V.mounted.main;
    const bone = root && SK.gidBonesOf(root).find(b => b.gid === head.joint);
    const aim = async () => {
      if (!bone) return null;
      const p = bone.node.getWorldPosition(new V.camera.position.constructor());
      const C = V.controls, cam = V.camera, dir = cam.position.clone().sub(C.target).normalize();
      const dist = +(typeof process !== "undefined" && process.env.HYPER_DIST || 2.5);   // metres (the viewer world is in metres)
      C.target.copy(p); cam.position.copy(p.clone().add(dir.multiplyScalar(dist))); C.update(); await frames(2);
      return [p.x, p.y, p.z].map(Math.round);
    };
    V.state.loop = true;
    const at = await aim();
    let offShot = null; try { await V.shot('laneB3_hypereye', MON + '_off'); offShot = 'ok'; } catch (e){ offShot = 'failed ' + e.message; }
    if (V.pose.action) V.pose.action.timeScale = 1;
    V.effectMeter(true, { every: 2 });
    if (opt){ sel.value = opt.value; sel.onchange({ target: sel }); }
    await frames(90);
    await aim();
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    let onShot = null; try { await V.shot('laneB3_hypereye', MON + '_head'); onShot = 'ok'; } catch (e){ onShot = 'failed ' + e.message; }
    if (V.pose.action) V.pose.action.timeScale = 1;
    const rows = rep.recs.filter(r => r.key === MON + '|' + MON + 'u|' + head.key + '|event')
      .map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict }));
    sel.value = ''; sel.onchange({ target: sel });
    out.push([rows.length === 1 && rows[0].verdict === 'draws', 'HYPER-EYE ' + MON,
              JSON.stringify({ head, option: opt ? opt.textContent : null, bone: !!bone, at, offShot, onShot, rows })]);
  }
  return out;
}
export const pageCheck = check;
export const args = [[((typeof process !== 'undefined' && process.env.HYPER_IDS) || 'em023_00').split(',')]];
