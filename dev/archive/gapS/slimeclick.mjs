// slimeclick.mjs (run-check.mjs): Raging Brachydios's eruption, one row per CLICK, the way Raven uses it -- a real click on the
// viewport (pointerdown / pointerup on the part __slime063.pick finds under the point), different parts in turn, the same part after
// its re-arm, while a clip plays, while paused / scrubbed, with Red Slime set mid-clip, on several clips, at two camera distances, and
// at three frame clocks (60 Hz, 144 Hz, a jittered 60). Per click: the part, the timer's burn-out seen (fuse > 0 -> 0), the shell made
// (a live shell with S.erupt063 = the slot), and the meter's u 210 starts / draws / lit in the click's own window.
//   SC_CASES=<json list of case names> picks cases (default: all)
async function slimeClick(caseNames, clocks, dists){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const MON = 'em063_05';
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const frames = async n => { for (let i = 0; i < n; i++) await raf(); };
  let delta = 1 / 60, clock = 'fixed60';
  const setClock = c => { clock = c; delta = c === '144' ? 1 / 144 : 1 / 60;
    V.pose.clock.getDelta = c === 'jitter' ? () => (0.35 + Math.random() * 1.3) / 60 : () => delta; };
  const game = async n => frames(Math.ceil(n * (1 / 60) / (clock === 'jitter' ? 1 / 60 : delta)));    // n game frames of clip time
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 900 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON); i++) await raf();
  const rt = M.effectRuntimeInstance();
  if (!rt || !rt.schedule){ out.push([false, 'runtime', 'no runtime']); return out; }
  V.state.loop = true;
  const vp = document.getElementById('viewport');
  const C = V.controls, cam = V.camera;
  const home = { p: cam.position.clone(), t: C.target.clone() };
  const setDist = k => { cam.position.copy(home.t.clone().add(home.p.clone().sub(home.t).multiplyScalar(k))); C.target.copy(home.t); C.update(); };
  const setRage = async on => {
    const st = document.getElementById('monState'), opts = st ? [...st.options] : [];
    const o = on ? (opts.find(x => x.value === 'rage') || opts.find(x => /^(rung|lv):/.test(x.value) && x.value !== 'lv:0'))
                 : (opts.find(x => x.value === 'normal') || opts.find(x => x.value === 'lv:0'));
    const row = document.getElementById('monStateRow');
    if (o && row && !row.hidden){ st.value = o.value; st.onchange({ target: st }); }
    else { const b = document.getElementById('monRage'); if (b){ b.checked = on; b.onchange({ target: b }); } }
    await raf();
  };
  const playClip = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === clip);
    if (o){ clipSel.value = o.value; await clipSel.onchange(); }
    await raf();
  };
  const PART_SLOT = { 0: 2, 2: 1, 3: 0, 6: 3 };
  // the screen point of a slime part: a grid over the viewport, the nearest-to-centre point whose pick is that part
  const pointFor = slot => {
    const r = vp.getBoundingClientRect(); let best = null;
    const x0 = r.left + r.width * 0.15, x1 = r.right - r.width * 0.15, y0 = r.top + r.height * 0.1, y1 = r.bottom - r.height * 0.1;
    for (let y = y0; y < y1; y += 14) for (let x = x0; x < x1; x += 14){
      const p = window.__slime063.pick(x, y);
      if (p == null || PART_SLOT[p] !== slot) continue;
      const d = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2);
      if (!best || d < best.d) best = { x, y, d };
    }
    return best;
  };
  const click = async slot => {
    const p = pointFor(slot);
    if (!p) return false;
    const o = { clientX: p.x, clientY: p.y, button: 0, buttons: 1, pointerId: 1, isPrimary: true, bubbles: true, pointerType: 'mouse' };
    vp.dispatchEvent(new PointerEvent('pointerdown', o));
    vp.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, o, { buttons: 0 })));
    return true;
  };
  // per frame: the timer's burn-outs and the eruption shells
  const seenShell = new Set(); let burns = [], shellsMade = [];
  let prevFuse = null;
  const poll = () => {
    const s = window.__slime063.state();
    if (s){ s.forEach((x, k) => { if (prevFuse && prevFuse[k] > 0 && x.fuse <= 0) burns.push(k); }); prevFuse = s.map(x => x.fuse); }
    const S = rt.schedule.shells && rt.schedule.shells.state;
    for (const sh of (S && S.shells) || []) if (sh.erupt063 != null && !seenShell.has(sh.id)){ seenShell.add(sh.id); shellsMade.push(sh.erupt063); }
  };
  let polling = true;
  (async () => { while (polling){ poll(); await raf(); } })();
  const rec = () => {
    const rep = V.effectMeterReport();
    const r = (rep.recs || []).find(x => x.key === MON + '|em063_05u|210|shell') || {};
    return { st: r.starts | 0, d: r.draws | 0, lit: r.litSamples | 0, s: r.samples | 0, v: r.verdict || '-' };
  };
  // one metered click: the meter on for the click's window (fuse 30 + the explosion ~21 game frames + margin)
  // slot -1: the first part the pick finds on screen (head, tail, left, right)
  const one = async (label, slot, win = 75, during) => {
    burns = []; shellsMade = [];
    // a part not hit in the last 130 game frames (a Yellow part, or one turning Red, does not erupt: 0xf36984 needs state 2), on screen
    if (slot < 0){ const st = window.__slime063.state() || []; slot = [2, 3, 0, 1].find(k => (st[k] || {}).col === 2 && pointFor(k)) ?? [2, 3, 0, 1].find(k => pointFor(k)) ?? 2; }
    const colAt = ((window.__slime063.state() || [])[slot] || {}).col;
    V.effectMeter(true, { every: 1 });
    const ok = await click(slot);
    if (during) await during(); else await game(win);
    const m = rec(); V.effectMeter(false);
    const row = { label: label + ' [slot ' + slot + ']', slot, colAtClick: colAt, clicked: ok, burn: burns.filter(k => k === slot).length, shell: shellsMade.filter(k => k === slot).length, ...m };
    out.push([false, 'CLICK ' + label, JSON.stringify(row)]);
    return row;
  };
  const CASES = {
    // A: playing L0 M1, each part in turn, then the left pounder again after its re-arm (30 + 15 + 60 + 15)
    play_parts: async () => { await playClip('0', 'Motion[1]'); await setRage(true); await game(30);
      for (const k of [2, 0, 1, 3]) await one('play L0 M1 slot ' + k, k);
      await game(60); await one('play L0 M1 slot 0 again after re-arm', 0); },
    // B: rapid -- four parts within a few frames (one window, four expected)
    rapid: async () => { await playClip('0', 'Motion[1]'); await setRage(true); await game(30);
      burns = []; shellsMade = []; V.effectMeter(true, { every: 1 });
      const clicked = [], st0 = window.__slime063.state();
      for (const k of [2, 0, 1, 3].filter(k => pointFor(k))){ clicked.push(k); await click(k); await raf(); }
      await game(80); const m = rec(); V.effectMeter(false);
      out.push([false, 'CLICK rapid', JSON.stringify({ label: 'rapid ' + clicked.length + ' parts on screen', expect: clicked.length, clicked, colsBefore: st0 && st0.map(x => x.col), burns: burns.slice(), shells: shellsMade.slice(), burn: burns.length, shell: shellsMade.length, ...m })]); },
    // C: paused -- click, wait paused, then play on
    paused: async () => { await playClip('0', 'Motion[1]'); await setRage(true); await game(30);
      await one('paused click, resumed after 60 rAF', 0, 0, async () => { V.pose.action.paused = true; await frames(60); V.pose.action.paused = false; await game(75); }); },
    // D: scrubbed back while the fuse burns
    scrub_back: async () => { await playClip('2', 'Motion[28]'); await setRage(true); await game(40);
      await one('scrub back during fuse', -1, 0, async () => { await game(10); const a = V.pose.action; a.paused = true; a.time = Math.max(0, a.time - 0.5); await frames(20); a.paused = false; await game(75); }); },
    // E: scrubbed forward
    scrub_fwd: async () => { await playClip('2', 'Motion[28]'); await setRage(true); await game(20);
      await one('scrub forward during fuse', -1, 0, async () => { await game(5); const a = V.pose.action; a.paused = true; a.time = a.time + 0.4; await frames(5); a.paused = false; await game(75); }); },
    // F: Red Slime set mid-clip, then a click (the part turns Red over 15 frames)
    rage_mid: async () => { await setRage(false); await playClip('2', 'Motion[3]'); await game(20); await setRage(true); await game(20);
      await one('Red Slime mid-clip then click', -1); },
    // G: on several clips, across a clip change
    clips: async () => { await setRage(true);
      for (const [l, c] of [['2', 'Motion[42]'], ['0', 'Motion[62]'], ['2', 'Motion[11]']]){ await playClip(l, c); await game(25); await one('clip ' + l + ' ' + c, -1); }
      await playClip('0', 'Motion[1]'); await game(25);
      await one('click then clip change at once', 0, 0, async () => { await game(12); await playClip('2', 'Motion[28]'); await game(75); }); },
    // H: the rule, not a miss -- a click on a part still Yellow after its eruption (0xf46f34: +180 to its wait, no eruption);
    // then Red Slime off / on (all four Red again) so the next case starts armed
    yellow: async () => { await playClip('0', 'Motion[1]'); await setRage(true); await game(30);
      await one('slot 0 erupts', 0); await game(5); await one('slot 0 again while Yellow (expected: no eruption)', 0);
      await setRage(false); await game(20); await setRage(true); await game(40); },
  };
  const names = caseNames && caseNames.length ? caseNames : Object.keys(CASES);
  for (const clockName of clocks){
    setClock(clockName);
    for (const dist of dists){
      setDist(dist);
      for (const n of names){ out.push([false, 'CASE', clockName + ' dist ' + dist + ' ' + n]); try { await CASES[n](); } catch (e) { out.push([false, 'ERR ' + n, String(e).slice(0, 200)]); } await game(130); }
    }
  }
  polling = false;
  return out;
}
export const pageCheck = slimeClick;
const CS = typeof process !== 'undefined' && process.env.SC_CASES ? JSON.parse(process.env.SC_CASES) : [];
export const args = [[CS, ['fixed60'], [1]], [CS, ['144'], [1]], [CS, ['jitter'], [1]], [CS, ['144'], [2.5]]];
