// endmeter.mjs (run-check.mjs): shells that outlive a ONE-SHOT clip (loop off), played once. Per case: the clip's length, the shells
// alive at its end, how many steps the effect runtime ran after the end, the frame the last shell ended (or still alive), each
// record's starts / draws in the meter (the whole play + 400 frames after); then the same play with the user's hold (the scrubber,
// seekTo) right after the end: nothing may step.
async function endMeter(cases){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const scrub = document.getElementById('animScrub');
  for (const [MON, list, clip, recs, after, extra] of cases){
    try {
      if (V.state.id !== MON){ if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON)); monSel.value = MON; await monSel.onchange(); }
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
      if (extra && extra.rage){ const b = document.getElementById('monRage'); if (b && !b.checked){ b.checked = true; b.onchange({ target: b }); } }
      V.state.loop = false;
      for (const hold of [false, true]){
        V.effectMeter(true, { every: 3 });
        if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
        const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value.replace(/_(start|loop)$/, '') === clip);
        clipSel.value = o.value; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
        const rt = M.effectRuntimeInstance(), act = V.pose.action, len = Math.round(act.getClip().duration * 60);
        await until(() => act.paused && act.time >= act.getClip().duration - 2e-3, 6000);
        const sh = () => (rt.schedule.shells ? rt.schedule.shells.state.shells : []);
        const atEnd = sh().length, steps0 = rt.stats.steps;
        const ys = [];
        if (hold){
          // the user's hold: the scrubber on the last frame (seekTo -> act.userHeld)
          scrub.value = String(Math.round(act.time * 60)); scrub.oninput();
        }
        let lastAlive = 0;
        // after the end the runtime runs on the WALL clock (animAdvance: null), so wait for that many effect STEPS (held: that many frames)
        let lastStep = 0;
        for (let i = 0; i < 20000 && (hold ? i < (after || 400) : rt.stats.steps - steps0 < (after || 400)); i++){
          await raf();
          const k = rt.stats.steps - steps0;
          if (sh().length) lastAlive = hold ? i + 1 : k;
          if (k >= lastStep + 50 || (hold && i % 50 === 0)){ lastStep = k; ys.push(sh().map(S => (S.shell || S.base) + ':' + (S.position ? Math.round(S.position[1]) : '?')).slice(0, 4).join(' ')); }
        }
        const rep = V.effectMeterReport().recs.filter(r => r.monster === MON && (!recs || recs.some(k => r.key.includes('|' + k + '|'))))
          .map(r => ({ k: r.key.split('|').slice(1).join('|'), st: r.starts, lit: r.litSamples + '/' + r.samples, v: r.verdict }));
        out.push([false, (hold ? 'HELD ' : 'END ') + MON + ' ' + list + ' ' + clip, JSON.stringify({ len, aliveAtEnd: atEnd, stepsAfterEnd: rt.stats.steps - steps0,
          aliveAfter: sh().length, lastAliveFrame: lastAlive, ys, meter: rep })]);
        V.effectMeter(false);
        if (hold){ act.userHeld = false; }
      }
    } catch (e){ out.push([false, 'ERR ' + MON, String(e && e.stack || e).slice(0, 300)]); }
  }
  return out;
}
export const pageCheck = endMeter;
const C = [
  ['em084_00', '0', 'Motion[63]', [3], 500],
  ['em063_00', '2', 'Motion[28]', [0, 1], 420],
  ['em043_05', '2', 'Motion[24]', [0, 10, 20], 300],
  ['em012_00', '2', 'Motion[3]', null, 300],
  ['em050_00', '2', 'Motion[21]', null, 300],
];
export const args = [[C]];
