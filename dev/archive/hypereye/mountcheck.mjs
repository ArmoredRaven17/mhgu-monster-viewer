// hypereye/mountcheck.mjs: the page mounts headless (the runner waits for __view.renderer / motionStates), the "Effects drawn before"
// input is there with its default, and the runtime's host carries the pass it sets.
async function check(){
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const M = await import('/render/monster.js');
  await window.__view.effects(true); await frames(60);
  const rt = M.effectRuntimeInstance(), sel = document.getElementById('monFxPass');
  return [[!!(window.__view && window.__view.renderer), 'MOUNT', String(window.__view.state.id)],
          [!!sel, 'FXPASS INPUT', sel ? sel.value : 'missing'],
          [!!(rt && rt.host && rt.host.framePass === 0x15), 'FXPASS APPLIED (default none = 0x15)', String(rt && rt.host && rt.host.framePass)]];
}
export const pageCheck = check;
export const args = [[]];
