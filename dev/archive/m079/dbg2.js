const V = window.__view;
const M = await import('/render/monster.js');
const SH = await import('/render/shells.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = {};
monSel.add(new Option('em079_00', 'em079_00')); monSel.value = 'em079_00'; await monSel.onchange(); await wait(2000);
await V.effects(false); await V.effects(true); await wait(500);
const S = M.effectRuntimeInstance().schedule;
const log = [];
const ex0 = S.rockInput;
for (const [l, v] of [['2', 'Motion[43]_start'], ['1', 'Motion[27]']]){
  listSel.value = l; await listSel.onchange();
  clipSel.value = v; await clipSel.onchange();
  log.length = 0;
  for (let i = 0; i < 12; i++){
    await wait(60);
    const st = S.shells && S.shells.state;
    const r = S.rockInput ? S.rockInput() : null;
    log.push({ clip: S.clip && S.clip.key, f: S.clip && Math.round(S.clip.frame), start: S.clip && S.clip.start, loop: S.clip && S.clip.loop,
               variant: r && r.variant, hist: st && st.hist, motion: st && st.motion, action: st && st.action && st.action.variant,
               nShells: st && st.shells.length, tally: S.shellTally && S.shellTally.spawned, refused: S.shellTally && S.shellTally.refused.slice(-2),
               va: r && r.variant ? !!SH.variantActionFor('em079_00', l, v.replace(/_(start|loop)$/, ''), r.variant) : null,
               af: !!SH.actionFor('em079_00', l, v.replace(/_(start|loop)$/, ''), false) });
  }
  out[l + v] = log.slice();
}
return out;
