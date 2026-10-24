window.__MON = 'em007_04';
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

const res = {};
const runClip = async (lid, clipName, n, stopOnFail) => {
  const list = entry.lists.find(l => l.id === lid);
  if (V.state.list !== lid){ listSel.value = lid; await listSel.onchange(); }
  clipSel.value = clipName; await clipSel.onchange();
  for (let f = 0; f < n; f++){
    const act = pose.action, nm = act && act.getClip ? act.getClip().name : null, b = nm ? nm.replace(/_(start|loop)$/, '') : null;
    stepOne(act ? V.state.id + '|' + V.state.list + '|' + b : null, act ? act.time * 60 : 0,
            b ? M.clipEffectsFor(V.state.id, b, V.state.list) : null, 0, false);
    if (fx.failed){
      const P = fx.parent;
      res.failedAt = clipName + ' f' + f + ': ' + fx.failed;
      res.file = { source: 'viewer joints at ' + MON + ' L' + lid + ' ' + clipName + ' frame ' + f + ' (after L9 Motion[26] x2), where ' + fx.failed,
                   jointList: [...fx.gameJoints.keys()].sort((a, b) => a - b),
                   joints: Object.fromEntries([...fx.gameJoints.entries()].map(([j, el]) => [String(j), el])),
                   unit: { position: P && P.position ? Array.from(P.position) : [0, 0, 0], quaternion: P && P.quaternion ? Array.from(P.quaternion) : [0, 0, 0, 1],
                           scale: P && P.scale != null ? P.scale : 1 } };
      return true;
    }
    if ((f & 31) === 31) await yieldTask();
  }
  return false;
};
const d26 = Math.round(entry.lists.find(l => l.id === '9').clips.find(c => c.clip === 'Motion[26]').dur * 60);
if (!(await runClip('9', 'Motion[26]', d26 * 2))) await runClip('9', 'Motion[27]', 200);
res.jointCount = res.file ? res.file.jointList.length : 0;
return res;
