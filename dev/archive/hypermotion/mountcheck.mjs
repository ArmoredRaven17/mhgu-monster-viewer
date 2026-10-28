// hypermotion/mountcheck.mjs: the page mounts headless, the Hyper motion table loads, and stepHyperMotion runs (Hyper Off: no change).
async function check(){
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  await frames(30);
  const t = await (await fetch('/hyper-motion.json')).json();
  return [[!!(window.__view && window.__view.renderer), 'MOUNT', String(window.__view.state.id)],
          [!!(t && t.em001_00 && t.em001_00.normal.hooks['1,2']), 'TABLE', Object.keys(t).length + ' keys'],
          ['__hyperMotion' in window && window.__hyperMotion === null, 'STEP RUNS (Hyper Off = null)', String(window.__hyperMotion)],
          [!(window.__view.pose.action) || window.__view.pose.action.timeScale === 1, 'TIMESCALE 1 (Off)', String(window.__view.pose.action && window.__view.pose.action.timeScale)]];
}
export const pageCheck = check;
export const args = [[]];
