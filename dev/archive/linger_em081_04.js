window.__MON = 'em081_04';
const MON = window.__MON || 'em081_04';
const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
monSel.value = MON; await monSel.onchange();
V.renderer.setAnimationLoop(null);
V.state.loop = true;
await V.effects(false); await V.effects(true);
let fx = M.effectRuntimeInstance();
if (V.rockInput) fx.schedule.rockInput = () => V.rockInput();
if (V.shellExtra) fx.schedule.shellExtra = V.shellExtra;
const pose = V.pose; pose.clock.getDelta = () => 1 / 60;
const entry = V.MON.monsters.find(e => e.id === MON);
const yieldTask = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
const live = () => {
  const s = fx.schedule, out = [];
  for (const e of s.entries){
    const n = e.def.record ? e.requests.filter(q => !q.stopped).length : 1;
    if (e.def.record && n) out.push(e.def.record.pel + ':' + e.def.record.key + '(' + e.when + ')x' + n);
    if (!e.def.record) out.push('plain:' + (e.def.name || e.def.file || '?'));
  }
  const sh = s.shells && s.shells.state ? s.shells.state.shells : [];
  for (const x of sh) out.push('shell:' + (x.name || x.cls || x.id) + ' m' + x.mode);
  return out;
};
const stepOne = (clipKey, frame, motion, start, loopSeg) => {
  pose.step([V.mounted.main]);
  fx.schedule.setClip(clipKey, frame, motion, start, null, null, loopSeg);
  fx.last = null; fx.acc = 1 / 60 + 1e-9;
  V.renderer.render(V.scene, V.camera);
};
const res = { baseline: null, motions: {} };
// baseline: no clip at all, 10 s
for (let f = 0; f < 600; f++){ stepOne(null, 0, null, 0, false); if ((f & 31) === 31) await yieldTask(); }
res.baseline = live();
const keys = window.__KEYS || Object.keys(M.CLIP_EFFECTS[MON] || {});
for (const key of keys){
  const m = /^L(\S+) (Motion\[\d+\])$/.exec(key);
  if (!m) continue;
  const list = entry.lists.find(l => l.id === m[1]);
  const base = m[2];
  if (!list) continue;
  const parts = list.clips.some(c => c.clip === base) ? [[base, 2]]
              : [[base + '_start', 1], [base + '_loop', 2]].filter(([n]) => list.clips.some(c => c.clip === n));
  if (!parts.length) continue;
  if (V.state.list !== list.id){ listSel.value = list.id; await listSel.onchange(); }
  for (const [clipName, passes] of parts){
    clipSel.value = clipName; await clipSel.onchange();
    const dur60 = list.clips.find(x => x.clip === clipName).dur * 60;
    const n = clipName.endsWith('_start') ? Math.max(1, Math.ceil(dur60 - 1e-6) - 1) : Math.round(dur60) * passes;
    let splitOffset = 0;
    if (clipName.endsWith('_loop')){ const sib = list.clips.find(x => x.clip === base + '_start'); if (sib) splitOffset = Math.round(sib.dur * 60); }
    for (let f = 0; f < n; f++){
      const act = pose.action, nm = act && act.getClip ? act.getClip().name : null, b = nm ? nm.replace(/_(start|loop)$/, '') : null;
      stepOne(act ? V.state.id + '|' + V.state.list + '|' + b : null, act ? act.time * 60 + splitOffset : 0,
              b ? M.clipEffectsFor(V.state.id, b, V.state.list) : null, splitOffset, !!(nm && nm.endsWith('_loop')));
      if ((f & 31) === 31) await yieldTask();
    }
  }
  // the clip stops: 10 s with no clip
  for (let f = 0; f < 600; f++){ stepOne(null, 0, null, 0, false); if ((f & 31) === 31) await yieldTask(); }
  const after = live().filter(x => !res.baseline.includes(x));
  if (after.length) res.motions[key] = after;
  if (fx.failed){ res.failed = key + ': ' + fx.failed; break; }
}
return res;
