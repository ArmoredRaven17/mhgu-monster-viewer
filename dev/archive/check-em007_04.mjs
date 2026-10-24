// Bloodbath Diablos (em007_04): the sever pairs u 900 / 905 (tail) and u 901 / 906 (horn piece), the rage puff off the
// Enraged toggle (not the Bloodbath State ladder), the enable word's rage group, the horn piece's shed option.
// (dev/em007_04-undriven-spec.md; scratch probe, run with run-check.mjs)
export async function pageCheck(MON = 'em007_04'){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, MON + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const TO = await import('/render/tail-option.js');
  const SK = await import('/render/skeleton.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  const fired = [], landings = [], masks = [];
  const f0 = S.fire.bind(S); S.fire = (pel, key) => { fired.push(key); return f0(pel, key); };
  const fa0 = fx.fireAt.bind(fx);
  fx.fireAt = (pel, key, pos) => { const ct = V.cutTail(); landings.push({ key, k: ct ? ct.k : -1, piece: ct && ct.piece, pos }); return fa0(pel, key, pos); };
  const sc0 = S.setClip.bind(S);
  S.setClip = (...a) => { masks.push(a[4]); return sc0(...a); };
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => { if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame }); return s0(e); };
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  check(byWhen.ragePuff === 2, 'the schedule holds the two puff records', byWhen);
  const evKeys = S.entries.filter(e => e.when === 'event').map(e => e.def.record && e.def.record.key);
  check([900, 901, 905, 906].every(k => evKeys.includes(k)), 'the schedule holds u 900 / 901 / 905 / 906 as events', evKeys.filter(k => k >= 900 && k < 1000));
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const pick = async (row, text) => {
    const f = document.querySelector('[data-row="' + row + '"]');
    const sel = f && f.querySelector('select');
    const o = sel && [...sel.options].find(x => x.textContent.trim() === text);
    if (!o) return false;
    sel.value = o.value; sel.dispatchEvent(new Event('change'));
    await frames(2);
    return true;
  };
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipTo = async f => until(() => clipFrame() >= f, 80 * f + 600);
  const wp = o => o.getWorldPosition(new V.camera.position.constructor());
  const bone = gid => (SK.gidBonesOf(V.mounted.main).find(x => x.gid === gid) || {}).node;
  const REST = ['0', 'Motion[2]'];
  V.state.loop = true;

  // THE CONTROLS: the ladder renamed Bloodbath State, the Enraged toggle beside it
  const lvRow = document.getElementById('monRageLevelRow'), lvSel = document.getElementById('monRageLevel');
  const rageRow = document.getElementById('monRageRow'), rageBox = document.getElementById('monRage');
  const lvLabel = document.querySelector('label[for="monRageLevel"]').textContent;
  const rageText = [...rageRow.childNodes].reverse().find(n => n.nodeType === 3);
  check(!lvRow.hidden && lvLabel === 'Bloodbath State', 'the ladder shows, labelled Bloodbath State', { hidden: lvRow.hidden, lvLabel });
  check([...lvSel.options].map(o => o.textContent).join('/') === 'Calm/Building/Full', 'its rungs unchanged: Calm / Building / Full', [...lvSel.options].map(o => o.textContent));
  check(!rageRow.hidden && rageText && rageText.textContent.trim() === 'Enraged', 'the Enraged toggle shows beside it, labelled Enraged', { hidden: rageRow.hidden, text: rageText && rageText.textContent });

  await play(...REST); await frames(3);
  // THE LADDER DOES NOT ENRAGE: Full, toggle off -> no rage, no puff
  const replay = async () => { await play('0', 'Motion[3]'); await frames(2); await play(...REST); await frames(2); };
  lvSel.value = '2'; lvSel.onchange({ target: lvSel }); await frames(2);
  await replay();
  masks.length = 0; puffs.length = 0;
  await steps(95);
  const maskFullCalm = masks.filter(m => m != null).slice(-1)[0];
  check(V.state.rageLevel === 2 && V.state.rage === false && S.rage === false && puffs.length === 0,
        'Bloodbath State Full, Enraged off: no rage, no puff', { rageLevel: V.state.rageLevel, rage: V.state.rage, S: S.rage, puffs: puffs.length });
  lvSel.value = '0'; lvSel.onchange({ target: lvSel }); await frames(2);
  await replay();
  masks.length = 0;
  await steps(10);
  const maskCalm = masks.filter(m => m != null).slice(-1)[0];
  check(maskCalm === maskFullCalm, 'the enable word is the same at Calm and at Full (the ladder is not its rage)', { maskCalm, maskFullCalm });
  // THE TOGGLE ENRAGES: the puff every 30 steps, the word's enraged group
  rageBox.checked = true; rageBox.onchange({ target: rageBox }); await frames(2);
  await replay();
  masks.length = 0; puffs.length = 0;
  await steps(95);
  const maskRage = masks.filter(m => m != null).slice(-1)[0];
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(V.state.rage === true && S.rage === true && V.state.rageLevel === 0, 'Enraged on: rage, the ladder untouched', { rage: V.state.rage, S: S.rage, lv: V.state.rageLevel });
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1120 || p.key === 1121), 'the puff (u 1120 / 1121) at once, then every 30 steps', { puffs, gaps });
  check(maskRage != null && (maskRage & 0xe00) === 0xe00 && (maskCalm & 0xe00) === 0 && (maskCalm & 0x1c0) === 0x1c0, 'the enable word changes with the toggle (its enraged group)', { maskCalm: maskCalm && maskCalm.toString(16), maskRage: maskRage && maskRage.toString(16) });
  rageBox.checked = false; rageBox.onchange({ target: rageBox }); await frames(2);
  puffs.length = 0; await steps(40);
  check(S.rage === false, 'Enraged off: rage off', S.rage);
  // THE RAGE ROAR L0 M22 shows rage while it plays
  puffs.length = 0;
  await play('0', 'Motion[22]'); await steps(40);
  check(S.rage === true && puffs.length >= 1, 'L0 Motion[22]: rage shown, the puff runs', { S: S.rage, n: puffs.length });
  await play(...REST); await frames(3);

  // THE HORN PIECE AS A SHED OPTION: Both Horns Broken only
  const head = V.mounted['em007_04_head'], tail = V.mounted['em007_04_tail'];
  check(head && tail, 'both pieces are mounted', Object.keys(V.mounted));
  check(await pick('2,32,102+3,33,103', 'One Horn Broken'), 'Horns: One Horn Broken');
  check(head && head.visible === false, 'One Horn Broken: no horn piece', head && head.visible);
  check(await pick('2,32,102+3,33,103', 'Both Horns Broken'), 'Horns: Both Horns Broken');
  check(head && head.visible === true, 'Both Horns Broken: the horn piece shows', head && head.visible);
  await pick('2,32,102+3,33,103', 'Intact');
  check(head && head.visible === false, 'Intact: no horn piece', head && head.visible);

  // THE TAIL SEVER, L3 M15: u 900, set 11, the tail from joint 145, u 905 at k 42
  await play('3', 'Motion[1]'); await frames(2);
  fired.length = 0; landings.length = 0;
  await play('3', 'Motion[15]'); await frames(3);
  const ct0 = V.cutTail(), b145 = bone(145);
  check(fired.filter(k => k === 900).length === 1 && isSet(drawn(), 11), 'L3 Motion[15]: u 900, the tail severed (set 11)', { fired, d: drawn() });
  check(ct0 && ct0.piece === 'em007_04_tail' && tail.visible, 'the cut tail flies', ct0 && ct0.piece);
  const bJ = b145 && wp(b145);
  check(ct0 && bJ && Math.hypot(ct0.J[0] * 0.01 - bJ.x, ct0.J[2] * 0.01 - bJ.z) < 0.25, 'J is joint 145', { J: ct0 && ct0.J, bone: bJ && [bJ.x / 0.01, bJ.y / 0.01, bJ.z / 0.01] });
  await clipTo(60);
  const ct1 = V.cutTail(), pt = wp(tail);
  check(ct1 && ct1.k >= 53 && Math.hypot(ct1.G[0] * 0.01 - pt.x, ct1.G[1] * 0.01 - pt.y, ct1.G[2] * 0.01 - pt.z) < 1e-3, 'at rest on G from k 53', { k: ct1 && ct1.k });
  check(ct1 && Math.abs(ct1.G[1] * 0.01 - (ct1.floor + 0.2 * (V.world.scale.x || 1))) < 1e-4, 'G is 20 S above the floor', { Gy: ct1 && ct1.G[1], floor: ct1 && ct1.floor });
  check(landings.length === 1 && landings[0].key === 905 && Math.abs(landings[0].k - 42) <= 1, 'u 905 once, at k 42', landings);
  await play(...REST); await frames(3);
  check(!V.cutTail() && tail.visible === false, 'another motion: the cut tail goes back to the Parts panel (intact)', tail.visible);

  // THE HORN SEVER, L9 M17: u 901, sets 5 + 7, the horn piece from joint 3 on HornPiece007, u 906 at k 48, G at k 71
  await play('9', 'Motion[16]'); await frames(2);
  fired.length = 0; landings.length = 0;
  await play('9', 'Motion[17]');
  const b3 = bone(3), b3s = [];
  for (let i = 0; i < 4; i++){ b3s.push(wp(b3)); await frames(1); }
  const h0 = V.cutTail();
  const dh = drawn();
  check(fired.filter(k => k === 901).length === 1 && isSet(dh, 5) && isSet(dh, 7), 'L9 Motion[17]: u 901, both horns broken (sets 5 + 7)', { fired, d: dh });
  check(h0 && h0.piece === 'em007_04_head' && head.visible, 'the horn piece flies', h0 && h0.piece);
  const jd = h0 ? Math.min(...b3s.map(b => Math.hypot(h0.J[0] * 0.01 - b.x, h0.J[1] * 0.01 - b.y, h0.J[2] * 0.01 - b.z))) : -1;
  check(jd >= 0 && jd < 1e-3, 'J is joint 3 (on the drop frame)', { J: h0 && h0.J, jd, bones: b3s.map(b => [b.x / 0.01, b.y / 0.01, b.z / 0.01]) });
  check(h0 && Math.abs(h0.G[1] * 0.01 - (h0.floor - 0.2)) < 1e-4, 'G is 20 BELOW the floor, unscaled', { Gy: h0 && h0.G[1], floor: h0 && h0.floor, S: V.world.scale.x });
  const ph0 = wp(head);
  const pErr = h0 ? Math.hypot(h0.pose.position[0] * 0.01 - ph0.x, h0.pose.position[1] * 0.01 - ph0.y, h0.pose.position[2] * 0.01 - ph0.z) : -1;
  check(pErr >= 0 && pErr < 1e-3, 'drawn where HornPiece007 puts it', { k: h0 && h0.k, pErr });
  await clipTo(50);
  const hm = V.cutTail();
  check(hm && hm.pose.position[1] > hm.G[1] + 100, 'mid-flight (k ' + (hm && hm.k) + ') it is still in the air', hm && { y: hm.pose.position[1], Gy: hm.G[1] });
  await clipTo(76);
  const h1 = V.cutTail(), ph1 = wp(head);
  check(h1 && h1.k >= 71 && Math.hypot(h1.G[0] * 0.01 - ph1.x, h1.G[1] * 0.01 - ph1.y, h1.G[2] * 0.01 - ph1.z) < 1e-3, 'at rest on G from k 71', { k: h1 && h1.k });
  check(landings.length === 1 && landings[0].key === 906 && landings[0].piece === 'em007_04_head' && Math.abs(landings[0].k - 48) <= 1, 'u 906 once, at k 48, at G', landings);
  await play(...REST); await frames(3);
  check(!V.cutTail() && head.visible === false, 'another motion: the horn piece goes back to the Parts panel (intact)', head.visible);
  return out;
}
