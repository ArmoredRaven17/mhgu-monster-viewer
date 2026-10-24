// ef2probe: does a base01 shell's second init start (startEf2) reach the page's runtime? (Teostra c 34, Kushala c 33..35)
async function probe(mon, list, clip, keys, near, ctl){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, mon + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  const cs = document.getElementById('monClassCtl'); if (ctl != null && cs){ cs.value = String(ctl); cs.dispatchEvent(new Event('change')); }
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const sch = M.effectRuntimeInstance().schedule, host = sch.host;
  const reqs = [];
  // the hunter at the monster when asked (the mode-4 range test 0x328d9c measures from it): a positive control for the range
  if (near){ const rt = M.effectRuntimeInstance(), g0 = host.setGameCamera.bind(host);
    host.setGameCamera = o => { const P = rt.parent && rt.parent.position; return g0(Object.assign({}, o, P ? { hunter: [P[0], P[1] + 100, P[2] + 300] } : {})); }; }
  const r0 = host.requestEffect.bind(host);
  host.requestEffect = (owner, parent, record, area, requester) => {
    const q = r0(owner, parent, record, area, requester);
    reqs.push({ key: record.key, idx: record.index, q, max: 0, frames: 0, parentSame: null, t: performance.now() });
    return q;
  };
  // the shells' own out.started, by wrapping the step's consumer: count started keys
  const startedKeys = [];
  const st0 = sch.stepShellsOut;
  const opts = [...(listSel.options)].map(o => o.value);
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const copies = [...clipSel.options].filter(o => o.value === clip || o.value.startsWith(clip + '#') || o.value === clip + '_loop' || o.value === clip + '_start').map(o => o.value);
  const plays = [], trace = [];
  for (const v of copies.length ? copies : [clip]){
    clipSel.value = v; await clipSel.onchange();
    for (let i = 0; i < 420; i++){
      await frames(1);
      if (i % 20 === 0){ const rt = M.effectRuntimeInstance(), m = host.m, H = host.HUNTER;

        trace.push({ i, P: rt.parent && rt.parent.position.map(Math.round), hunter: H ? [0, 4, 8].map(o => Math.round(host.m.f32(H + 0x40 + o))) : null,
                     sh: (sch.shells && sch.shells.state ? sch.shells.state.shells : []).map(x => ({ m: x.modeIndex, p: x.position && x.position.map(Math.round), st: x.state, j: x.k && x.k.joint, fl: x.k && x.k.flags, J: x.k && rt.gameJoints.get(x.k.joint) ? [12, 13, 14].map(i => Math.round(rt.gameJoints.get(x.k.joint)[i])) : null, J0: rt.gameJoints.get(0) ? [12, 13, 14].map(i => Math.round(rt.gameJoints.get(0)[i])) : null })) }); }
      for (const r of reqs){ let n = 0; try { n = r.q.effects().length; } catch (e) { n = -1; } r.max = Math.max(r.max, n); if (n > 0) r.frames++; }
    }
    plays.push(v);
  }
  const by = {};
  for (const r of reqs){ const k = r.key; by[k] = by[k] || { n: 0, max: 0, live: 0 }; by[k].n++; by[k].max = Math.max(by[k].max, r.max); by[k].live += r.frames; }
  check(true, (near ? 'hunter near: ' : 'hunter 2100 ahead: ') + 'requests by key on ' + list + '|' + clip + ' (' + plays.join(', ') + ')', by);
  const shells = sch.shells && sch.shells.state ? sch.shells.state.shells.map(s => ({ shell: s.shell, mode: s.modeIndex, starts: s.starts.map(x => x.key), e2: s.effect2 && { key: s.effect2.key, req: !!s.effect2.request } })) : null;
  check(true, 'shells now', shells);
  check(true, 'trace', trace.slice(0, 22));
  check(true, 'tally refused', sch.shellTally && sch.shellTally.refused.slice(-10));
  check(!M.effectRuntimeInstance().failed, 'the runtime did not fail', M.effectRuntimeInstance().failed || null);
  for (const k of keys) check(by[k] && by[k].n > 0, 'key ' + k + ' requested', by[k]);
  return out;
}
export const pageCheck = probe;
export const args = [['em024_00', '0', 'Motion[8]', [31, 34], true, 3]];
