// The approved controls of 2026-10-19 (dev/effects-open-items.md section 5; Raven approved all eight), loaded by
// dev/motion-states-check.mjs from dev/checks/: Begins Burrowed, Tired (with Rage), Poisoned (render/motion-states.js
// CLASS_TOGGLES), Congalala's Gas Type (CLASS_CONTROLS em021_00 -- asserted in em021_00.mjs), the class fades (CLASS_TIMERS
// `alpha`: Amatsu's aura, Valstrax's glow), Soulseer's L0 M4 copy D, Deadeye's L0 M7 copy B (`startFrame`). One function, run
// once per case (`args`); it is serialised with .toString() and evaluated in the page, so it closes over nothing here.
async function pageCheckToggles(MON, NAME, KIND){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, NAME + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const PM = await import('/render/psl-mask.js');
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
  const fired = [], tints = [];
  const f0 = S.fire.bind(S); S.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const a0 = S.alphaEvent.bind(S); S.alphaEvent = (pel, key, a) => { tints.push([key, a]); return a0(pel, key, a); };
  const sel = async (list, v) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const [vb, vk] = v.split('#'), tail = vk ? '#' + vk : '';
    const o = [...clipSel.options].find(x => x.value === v) || [...clipSel.options].find(x => x.value === vb + '_loop' + tail) || [...clipSel.options].find(x => x.value === vb + '_start' + tail);
    if (!o){ check(false, 'the Clip menu offers ' + list + '|' + v); return false; }
    clipSel.value = o.value; await clipSel.onchange(); return true;
  };
  const toggle = async (key, on) => {
    const box = document.querySelector('#monTog_' + key + ' input');
    if (!box){ check(false, 'the ' + key + ' switch is shown'); return false; }
    box.checked = on; box.onchange({ target: box }); await frames(2); return true;
  };
  const mask = () => S.clip && S.clip.mask != null ? S.clip.mask >>> 0 : null;
  const live = k => S.entries.filter(e => e.when === 'event' && e.def.record && e.def.record.key === k).some(e => e.requests.some(q => !q.stopped));
  const unit0 = k => {                     // the colour block of the live request's unit 0, as the class writes it
    const m = fx.host && fx.host.m;
    for (const e of S.entries) if (e.when === 'event' && e.def.record && e.def.record.key === k)
      for (const q of e.requests) if (!q.stopped && q.core){ const u = m.u32(q.core + 0x150); if (u) return m.f32(u + 0x180); }
    return null;
  };
  const MONSTER = V.MON.monsters.find(e => e.id === MON), L0 = MONSTER && (MONSTER.lists.find(l => l.id === '0') || MONSTER.lists.find(l => /^\d+$/.test(l.id)));
  const RL = L0 ? L0.id : '0';
  const REST = L0 && L0.clips.some(c => /^Motion\[1\](_loop|_start)?$/.test(c.clip)) ? 'Motion[1]' : (L0 ? L0.clips[0].clip.replace(/_(start|loop)$/, '') : 'Motion[1]');
  const rest = async () => { await sel(RL, REST); await frames(3); };
  // the State dropdown's enraged option (Enraged, a rage rung or a level that owns rage), else the Enraged switch
  const setRage = async on => {
    const st = document.getElementById('monState'), opts = st ? [...st.options] : [];
    const o = on ? (opts.find(x => x.value === 'rage') || opts.find(x => /^(rung|lv):/.test(x.value) && x.value !== 'lv:0'))
                 : (opts.find(x => x.value === 'normal') || opts.find(x => x.value === 'lv:0'));
    if (o && !document.getElementById('monStateRow').hidden){ st.value = o.value; st.onchange({ target: st }); }
    else { const b = document.getElementById('monRage'); b.checked = on; b.onchange({ target: b }); }
    await frames(2);
  };
  if (KIND === 'burrowed'){
    // Basarios's L0 M7 copy B (6, 3), posture 4: bits 27-28 from the surface, none when begun sunk (0x81d6c)
    check(!!document.querySelector('#monTog_burrowed'), 'the Begins Burrowed switch is shown');
    await rest(); if (await sel('0', 'Motion[7]#B')){ await frames(6); const w = mask();
      check(w != null && (w & 0x18000000) === 0x18000000, 'L0 M7 B, off: begun from the surface -- bits 27-28', w == null ? null : '0x' + w.toString(16)); }
    await toggle('burrowed', true);
    await rest(); if (await sel('0', 'Motion[7]#B')){ await frames(6); const w = mask();
      check(w != null && (w & 0x18000000) === 0, 'L0 M7 B, Begins Burrowed: sunk -- no bits 27-28', w == null ? null : '0x' + w.toString(16)); }
    await rest(); if (await sel('0', 'Motion[7]')){ await frames(6); const w = mask();
      check(w != null && (w & 0x18000000) === 0x18000000, 'L0 M7 A (posture 0) keeps bits 27-28 with the switch on', w == null ? null : '0x' + w.toString(16)); }
    await toggle('burrowed', false);
  }
  if (KIND === 'tiredRage'){
    // Rathian L2 M1 / Rathalos L2 M3: the tired test 0x81614 alone -- PM first, then the page with Enraged and the switch
    // Rathalos's L4 M32 arm (em 2): (7, 3 / 0x29 / ..) and NOT tired -> bits 27-29 (0x81614 alone)
    const w0 = PM.pslMask(MON, '4', 32, [7, 3], { rage: true, tired: false }), w1 = PM.pslMask(MON, '4', 32, [7, 3], { rage: true, tired: true });
    check(w0 != null && w1 != null && (w0 & 0x38000000) && !(w1 & 0x38000000), 'the word: L4 M32 (7, 3) enraged lights bits 27-29 unless tired', ['0x' + (w0 >>> 0).toString(16), '0x' + (w1 >>> 0).toString(16)]);
    check(!!document.querySelector('#monTog_tiredRage'), 'the Tired (with Rage) switch is shown');
    await setRage(true); await rest(); if (await sel('4', 'Motion[32]')){ await frames(6); }
    const a = mask();
    await toggle('tiredRage', true); await rest(); if (await sel('4', 'Motion[32]')){ await frames(6); }
    const b = mask();
    check(a != null && b != null && (a & 0x38000000) && !(b & 0x38000000), 'Enraged, L4 M32: bits 27-29 off with the switch on (the play reads tired)', [a, b].map(w => w == null ? null : '0x' + w.toString(16)));
    await toggle('tiredRage', false); await setRage(false);
  }
  if (KIND === 'poisoned'){
    check(!!document.querySelector('#monTog_poisoned'), 'the Poisoned switch is shown');
    await rest(); fired.length = 0;
    await toggle('poisoned', true); await frames(100);
    const n = fired.filter(k => k === 1100).length;
    check(n >= 1 && n <= 2, 'Poisoned: c 1100 at once and every 90 frames (0xa4518)', fired.filter(k => k === 1100).length);
    if (MON === 'em027_00'){
      const cs = document.getElementById('monClassCtl'); cs.value = '1'; cs.onchange({ target: cs }); await rest(); await frames(4);
      check(!live(0), 'Fire Aura on, Poisoned: u 0 is not held (0xe10f7c tests P+0x5e08 bit 1)', live(0));
      await toggle('poisoned', false); await rest(); await frames(4);
      check(live(0), 'Fire Aura on, not poisoned: u 0 held again', live(0));
      cs.value = '0'; cs.onchange({ target: cs });
    } else {
      const w3 = PM.pslMask(MON, '0', 1, null, { windAura: 3, aura5e08: true }), w3n = PM.pslMask(MON, '0', 1, null, { windAura: 3 });
      check(w3 !== w3n, 'Wind level 3: the word reads ctl+0x18 (poisoned) -- bits 15-17 for 21-23', ['0x' + (w3 >>> 0).toString(16), '0x' + (w3n >>> 0).toString(16)]);
      await toggle('poisoned', false);
    }
  }
  if (KIND === 'amatsu'){
    // the aura u 0 kept but drawn at 0 on a hidden status-7 action, back in by 0.02 a frame (0xf099cc)
    await rest(); await frames(70);
    check(live(0) && Math.abs((unit0(0) == null ? -1 : unit0(0)) - 1) < 1e-3, 'at rest: u 0 held, its colour block at 1.0', unit0(0));
    const hide = Object.keys(PM.CLIP_ACTIONS[MON] || {}).map(k => [k, PM.CLIP_ACTIONS[MON][k]]).find(([k, a]) => a.some(e => e.action && e.action[0] === 7 && e.action[1] !== 0xc));
    if (!hide){ check(false, 'a status-7 play to hide the aura on'); }
    else {
      const [l, c] = hide[0].split('|'); fired.length = 0;
      await sel(l, c); await frames(6);
      check(live(0) && unit0(0) === 0, 'L' + l + ' ' + c + ' (status 7): u 0 kept, drawn at 0', [live(0), unit0(0)]);
      check(fired.includes(3), '...and u 3 once as it hides', fired);
      await rest(); await frames(10);
      const a10 = unit0(0);
      check(a10 != null && a10 > 0.1 && a10 < 0.3, 'back at rest: the block rises 0.02 a frame (about 0.2 after 10 frames)', a10);
    }
  }
  if (KIND === 'valstrax'){
    // the glow u 1121 (enraged, e+0xcb10 0 / 1) fades out on a state-2 action (1/60 a frame), kept at 0 (0x109f080..)
    await setRage(true); await rest(); await frames(10);
    const hide = Object.keys(PM.CLIP_ACTIONS[MON] || {}).map(k => [k, PM.CLIP_ACTIONS[MON][k]]).find(([k, a]) => a.some(e => e.action && e.action[0] === 7 && e.action[1] <= 0x30 && ![0x13, 0x1f, 0x20, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29].includes(e.action[1])));
    check(V.state.rage && live(1121), 'enraged at rest: the glow u 1121 held', { rage: V.state.rage, held: live(1121) });
    if (hide){
      const [l, c] = hide[0].split('|');
      await sel(l, c); await frames(2);
      const a1 = unit0(1121), f1 = V.pose.action ? V.pose.action.time * 60 : 0;
      await frames(12);
      const a2 = unit0(1121), f2 = V.pose.action ? V.pose.action.time * 60 : 0;
      const rate = (a1 != null && a2 != null && f2 > f1) ? (a1 - a2) / (f2 - f1) : null;
      check(rate != null && Math.abs(rate - 1 / 60) < 0.004, 'L' + l + ' ' + c + ' (state 2): the glow fades 1/60 a frame', { a1, a2, frames: f2 - f1, rate });
    } else check(false, 'a state-2 play to fade the glow on');
    await setRage(false);
  }
  if (KIND === 'soulseerD'){
    await rest(); fired.length = 0;
    if (await sel('0', 'Motion[4]#D')){ await frames(8);
      check(fired.includes(330), 'L0 M4 D ((2, 0x36) repeated): u 330 as it starts', fired);
      check(live(310), '...and u 310 held, as copy C', live(310)); }
    await rest(); fired.length = 0;
    if (await sel('0', 'Motion[4]#C')){ await frames(8); check(!fired.includes(330), 'L0 M4 C (the first play): no u 330', fired); }
  }
  if (KIND === 'deadeyeB'){
    await rest();
    if (await sel('0', 'Motion[7]#B')){ await frames(1);
      const f = V.pose.action ? V.pose.action.time * 60 : -1;
      check(f >= 17.5 && f < 22, 'L0 M7 B ((7, 0xe3) / (7, 0xe5)): the clip starts at frame 18', f);
      fired.length = 0; await frames(4);
      const w = mask();
      check(w != null && (w & 0x38000000) === 0x38000000, '...with bits 27-29 (u 290, u 531)', w == null ? null : '0x' + w.toString(16)); }
    await rest();
    if (await sel('0', 'Motion[7]')){ await frames(1); const f = V.pose.action ? V.pose.action.time * 60 : -1;
      check(f < 3, 'L0 M7 A ((2, 2)): from frame 0', f); }
  }
  await rest();
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}
export const pageCheck = pageCheckToggles;
export const args = [
  ['em004_00', 'Basarios (Begins Burrowed)', 'burrowed'],
  ['em002_00', 'Rathalos (Tired with Rage)', 'tiredRage'],
  ['em024_00', 'Kushala (Poisoned)', 'poisoned'],
  ['em027_00', 'Teostra (Poisoned)', 'poisoned'],
  ['em058_00', 'Amatsu (aura fade)', 'amatsu'],
  ['em086_00', 'Valstrax (glow fade)', 'valstrax'],
  ['em082_04', 'Soulseer (L0 M4 D)', 'soulseerD'],
  ['em018_04', 'Deadeye (L0 M7 B)', 'deadeyeB'],
];
