
// ---- 4. IN THE VIEWER: run by run-check.mjs, serialised with .toString() and evaluated IN THE PAGE (closes over nothing here) ----
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Seltas shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const open = async MON => {
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    return until(() => body() && body().monsterId === MON && body().schedule);
  };
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start') ||
              [...clipSel.options].find(x => x.value === name + '_loop');
    if (!o){ check(false, 'list ' + list + ' has ' + name, [...clipSel.options].slice(0, 5).map(x => x.value)); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    await frames(2);
    return true;
  };
  // every shell a runtime's schedule steps, as first seen (its init's point, its action, its record), over n frames
  const watch = async (rts, n, stop) => {
    const seen = new Map();
    for (let i = 0; i < n; i++){
      await frames(1);
      for (const R of rts()){
        const st = R && R.schedule && R.schedule.shells && R.schedule.shells.state;
        for (const s of (st ? st.shells : [])){
          const k = R.monsterId + ':' + s.id;
          if (seen.has(k)) continue;
          const J = R.gameJoints && R.gameJoints.get(144);
          seen.set(k, { mon: R.monsterId, shell: s.shell, mode: s.modeIndex, action: s.action ? s.action.map(x => x.toString(16)).join(':') : null,
                        at: (s.launch && (s.launch.position || s.launch.point)) || s.position, key: s.start && s.start.key,
                        j144: J ? [J[12], J[13], J[14]] : null, partner: !!R.partner });
        }
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  const started = (R, key) => R.schedule.entries.filter(e => e.when === 'shell' && e.def.record && e.def.record.key === key)
                                                .reduce((n, e) => n + e.requests.length, 0);
  const dist = (a, b) => a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : Infinity;

  // SOLO SELTAS
  check(await open('em076_00'), 'solo Seltas: his runtime is up');
  {
    await pick('2', 'Motion[17]');
    const w = await watch(() => [body()], 200, x => x.length >= 6);
    const lobs = w.filter(x => x.shell === 'shell37');
    check(lobs.length === 3 && lobs.map(x => x.mode).join() === '3,4,5' && lobs.every(x => x.action === '7:2'),
          'L2 M17 (7, 0x02): three shell37 3 / 4 / 5 (the lobs, u 0)', w);
    check(started(body(), 0) >= 3, 'u 0 started on each lob', started(body(), 0));
    check(w.some(x => x.shell === 'shell01' && x.mode === 0), 'a lob on the floor leaves shell01 0 (u 10)', w.filter(x => x.shell === 'shell01'));
  }
  {
    await pick('4', 'Motion[33]');
    const w = await watch(() => [body()], 140, x => x.filter(y => y.shell !== 'shell01').length >= 3);
    const sh = w.filter(x => x.shell !== 'shell01');
    check(sh.length === 3 && (sh.every(x => x.shell === 'shell00' && x.action === '7:34') || sh.every(x => x.shell === 'shell37' && x.action === '7:39')),
          'L4 M33: his pick (7, 0x34) three spits or (7, 0x39) three lobs', sh);
    check(sh.length && sh.every(x => dist(x.at, x.j144) < 400), 'each from his joint 144', sh.map(x => [x.at, x.j144]));
  }
  {
    await pick('4', 'Motion[34]');
    const w = await watch(() => [body()], 140, x => x.filter(y => y.shell === 'shell37').length >= 3);
    const sh = w.filter(x => x.shell === 'shell37');
    check(sh.length === 3 && sh.map(x => x.mode).join() === '6,7,8' && started(body(), 1) >= 3, 'L4 M34 (7, 0x3a): shell37 6 / 7 / 8, u 1', w);
  }
  // SOLO QUEEN
  check(await open('em069_00'), 'solo Queen: her runtime is up');
  {
    await pick('4', 'Motion[42]');
    const w = await watch(() => [body()], 200, x => x.filter(y => y.shell === 'shell00').length >= 3);
    const sh = w.filter(x => x.shell === 'shell00');
    check(sh.length === 3 && sh.map(x => x.mode).join() === '0,1,2' && started(body(), 10) >= 3, 'L4 M42 (7, 0x09): her three spits, u 10', w);
  }
  {
    await pick('4', 'Motion[20]');
    const w = await watch(() => [body()], 120);
    check(w.length === 0, 'raw L4 M20 (7, 0x38): no spit -- she is alone (the link bit is clear)', w);
  }
  {
    await pick('4', 'Motion[26]');
    const w = await watch(() => [body()], 30, x => x.length >= 1);
    check(w.length === 1 && w[0].shell === 'shell01' && w[0].mode === 4 && started(body(), 31) >= 1, 'L4 M26 (7, 0x36): shell01 4, c 31', w);
  }
  // THE COMBINED LIST: his 7:0x3f (two spits a crossing) from HIS runtime and joints; her 7:0x4f spits after his flag; her linked M20
  {
    const P = () => V.partnerEffectRuntimeObj ? V.partnerEffectRuntimeObj() : null;
    await pick('duo', 'Seltas Motion[33] with her 7:0x4e');
    check(await until(() => P() && P().schedule && P().monsterId === 'em076_00', 300), 'duo: his own runtime is up');
    const w = await watch(() => [body(), P()], 420, x => x.filter(y => !y.partner && y.shell === 'shell00').length >= 3 &&
                                                          x.filter(y => y.partner && y.shell === 'shell00').length >= 6);
    const his = w.filter(x => x.partner && x.shell === 'shell00'), hers = w.filter(x => !x.partner && x.shell === 'shell00');
    check(his.length === 6 && his.every(x => x.mode === 3 && x.action === '7:3f'), 'his 7:0x3f: six shell00 3 (two a crossing), on his runtime', his);
    check(his.length && his.every(x => dist(x.at, x.j144) < 400), 'from HIS joint 144', his.map(x => [x.at, x.j144]));
    check(P() && started(P(), 1) >= 6, 'his u 1 started on his runtime', P() && started(P(), 1));
    check(hers.length === 3 && hers.map(x => x.mode).join() === '0,1,2', 'her 7:0x4f (L4 M42 from 90): her three spits after his flag, on hers', hers);
  }
  {
    await pick('duo', 'Queen L4 Motion[20] + Seltas free');
    const w = await watch(() => [body()], 160, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.mode === 3 && x.action === '7:38'), 'duo L4 M20 (7, 0x38): her linked spit, shell00 3', w);
  }
  return out;
}
