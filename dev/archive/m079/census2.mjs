// Malfestio / Nightcloak: every effect the LIVE viewer starts, per clip and per play (the page's own render loop:
// driveClipEffects, MotionStates, the shells). One evaluate per (monster, list, rage) chunk, each well under 120 s.
//   sh run_locked.sh <out> node run-check.mjs m079/census.mjs
const L = ['0', '1', '2', '3', '9'];
const ONLY = ['Motion[25]', 'Motion[27]', 'Motion[29]', 'Motion[35]', 'Motion[37]', 'Motion[42]', 'Motion[44]', 'Motion[46]', 'Motion[87]', 'Motion[89]', 'Motion[91]', 'Motion[93]', 'Motion[95]', 'Motion[97]', 'Motion[99]'];
export const args = [['em079_00', '2', false, 9, ONLY], ['em079_00', '2', true, 9, ONLY]];
for (const mon of [])
  for (const list of L){
    if (list === '9' && mon === 'em079_00') continue;
    args.push([mon, list, false, 0]);
    args.push([mon, list, false, 1]);
    if (list === '2' || list === '1' || list === '9') { args.push([mon, list, true, 0]); args.push([mon, list, true, 1]); }
  }
export async function pageCheck(MON, LIST, RAGE, HALF, ONLYB){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (f, n = 900) => { for (let i = 0; i < n; i++){ if (f()) return true; await raf(); } return false; };
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  V.pose.clock.getDelta = () => 1 / 60;
  V.state.loop = true;
  if (V.state.id !== MON){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    for (let i = 0; i < 30; i++) await raf();
  }
  const rb = document.getElementById('monRage');
  if (rb && rb.checked !== RAGE){ rb.checked = RAGE; if (rb.onchange) await rb.onchange({ target: rb }); }
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule);
  const rt = M.effectRuntimeInstance(), S = rt.schedule;
  let log = null;
  const rq0 = S.host.requestEffect;
  S.host.requestEffect = function(owner, parent, rec){
    const e = S.entries.find(x => x.owner === owner && x.def.record && x.def.record.key === rec.key) || S.entries.find(x => x.owner === owner);
    if (log) log.push((e && e.def.record ? e.def.record.pel.replace('em079_0', '') + ':' + e.def.record.key : '?' + rec.key) + '/' + (e ? e.when : '?') +
                      '@' + (S.clip ? Math.round(S.clip.frame) : '-'));
    return rq0.apply(this, arguments);
  };
  const entry = V.MON.monsters.find(e => e.id === MON);
  const list = entry.lists.find(l => l.id === LIST);
  if (!list){ out.push([false, MON + ' L' + LIST, 'no list']); return out; }
  if (V.state.list !== LIST){ listSel.value = LIST; await listSel.onchange(); }
  const bases = [...new Set(list.clips.map(c => c.clip.replace(/_(start|loop)$/, '')))];
  const mine = ONLYB ? bases.filter(b => ONLYB.includes(b)) : bases.filter((_, i) => (i % 2) === HALF);
  for (const base of mine){
    const pieces = list.clips.some(c => c.clip === base) ? [base] : [base + '_start', base + '_loop'].filter(n => list.clips.some(c => c.clip === n));
    for (let play = 0; play < 2; play++){
      log = [];
      S.shellTally = { spawned: 0, beams: [], refused: [] };
      const motionsBefore = V.motionStates && V.motionStates.cur ? 1 : 0;
      for (const p of pieces){
        const dur = Math.round(list.clips.find(c => c.clip === p).dur * 60);
        clipSel.value = p; await clipSel.onchange();
        V.pose.action.timeScale = 2;
        let last = -1, steps = 0;
        // to the clip's last frame (a _start piece), or one whole pass (whole / _loop)
        await until(() => { const t = V.pose.action.time * 60; steps++; const done = t >= dur - 2.5 || (t < last - 1 && steps > 3); last = t; return done; }, 4000);
      }
      const T = S.shellTally;
      out.push([false, MON + (RAGE ? ' R' : ' C') + ' L' + LIST + ' ' + base + ' p' + play,
                JSON.stringify({ fx: log, shells: T.spawned, refused: [...new Set(T.refused)], failed: rt.failed ? String(rt.failed).slice(0, 200) : null,
                                 action: null })]);
      if (rt.failed) break;
    }
    if (rt.failed) break;
  }
  log = null;
  S.host.requestEffect = rq0;
  clipSel.value = ''; if (clipSel.onchange) await clipSel.onchange();
  return out;
}
