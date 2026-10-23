// The Elder Dragon walk's page check (2026-10-18), loaded by dev/motion-states-check.mjs from dev/checks/: one function, run once
// per monster (`args`). The specs: dev/em011_00- (Kirin has his own file), em012_00-, em013-, em024_00-, em025_00-, em027_00-,
// em050_00-, em058_00-, em071-em072-, em084_00-, em086_00-effects-spec.md. Each run asserts the enable word as transcribed (the
// emulated cases), that every state row names a clip he carries and a record his schedule holds, that a break row fires its
// record, that the rage entry shows rage, the class timers / controls where he has them, and that the runtime never stopped.
// The function is serialised with .toString() and evaluated in the page, so it must not close over anything in this module.
async function pageCheckElder(MON, NAME, WORDS, BREAK, RAGE, EXTRA){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, NAME + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
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
  const fired = [];
  const f0 = S.fire.bind(S); S.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  // (a class request with its own block goes through placeEvent: Teostra's u 1 / u 2 / u 3, root joint 3 -- 2026-10-22)
  const p0 = S.placeEvent.bind(S); S.placeEvent = (pel, key, reqs) => { const r = p0(pel, key, reqs); fired.push(key); return r; };
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const evKeys = new Set(S.entries.filter(e => e.def.record && e.when === 'event').map(e => e.def.record.pel + '|' + e.def.record.key));
  // THE WORD
  for (const [l, n, a, st, want] of WORDS){
    const got = PM.pslMask(MON, String(l), n, a, st || {});
    check(got === want, 'the word: L' + l + ' M' + n + ' ' + JSON.stringify(a) + ' ' + JSON.stringify(st || {}) + ' = 0x' + want.toString(16), got == null ? null : '0x' + got.toString(16));
  }
  // EVERY ROW: a clip he carries, every record it names in his schedule
  const T = MS.MOTION_STATES[MON] || {};
  const recs = [];
  const walk = v => { if (Array.isArray(v) && v.length >= 2 && typeof v[0] === 'string' && typeof v[1] === 'number') recs.push(v[0] + '|' + v[1]);
                      else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x); };
  for (const [k, row] of Object.entries(T)){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
    walk(row);
  }
  const missing = [...new Set(recs)].filter(r => !evKeys.has(r));
  check(missing.length === 0, 'every record his rows name is an event record in his schedule', missing);
  // A BREAK ROW fires its record on its clip
  if (BREAK){
    const [list, clip, key] = BREAK;
    const l0 = MONSTER.lists.find(l => /^\d+$/.test(l.id) && l.id !== '3') || MONSTER.lists[0];
    await play(l0.id, l0.clips[0].clip.replace(/_(start|loop)$/, '')); await frames(3);
    fired.length = 0;
    await play(list, clip); await frames(4);
    check(fired.includes(key), 'L' + list + ' ' + clip + ': the break record u ' + key + ' at once', fired);
  }
  // THE RAGE ENTRY
  if (RAGE){
    await play(RAGE[0], RAGE[1]); await frames(4);
    check(S.rage === true, 'L' + RAGE[0] + ' ' + RAGE[1] + ': the rage entry shows rage', { rage: S.rage });
  }
  // THE EXTRAS: a class control / a class hold
  for (const x of EXTRA || []){
    if (x.control != null){
      const sel = document.getElementById('monClassCtl');
      check(!document.getElementById('monClassCtlRow').hidden && [...sel.options].map(o => +o.value).join() === x.options,
            'the ' + x.label + ' row is shown with ' + x.options, [...sel.options].map(o => o.value));
      sel.value = String(x.control); sel.onchange({ target: sel }); await frames(2);
      check(V.state.classCtl === x.control, 'the ' + x.label + ' control sets the class byte', V.state.classCtl);
      const liveKey = k => S.entries.filter(e => e.when === 'event' && e.def.record && e.def.record.key === k).some(e => e.requests.some(q => !q.stopped));
      if (x.onHold){                       // a record the class holds while the control is on (and lets go when it is off)
        await play(x.onHold[0], x.onHold[1]); await frames(4);
        check(liveKey(x.onHold[2]), x.label + ' on: the class holds u ' + x.onHold[2], liveKey(x.onHold[2]));
        fired.length = 0;
      }
      sel.value = String(x.reset); sel.onchange({ target: sel }); await frames(2);
      if (x.onHold){
        await play(x.onHold[0], x.onHold[1]); await frames(4);
        check(!liveKey(x.onHold[2]), x.label + ' off: u ' + x.onHold[2] + ' is let go', liveKey(x.onHold[2]));
        if (x.offFire != null) check(fired.includes(x.offFire), x.label + ' off: u ' + x.offFire + ' once as it goes out', fired);
      }
    }
    // the SECOND class byte (CLASS_CONTROLS2): with the first control at x.with, the class holds x.swap[1] in place of x.swap[0]
    // while it is set (Teostra's Size Type 1: u 10 for u 0, 0xe11120), and goes back when it is cleared
    if (x.control2 != null){
      const sel1 = document.getElementById('monClassCtl'), sel = document.getElementById('monClassCtl2');
      check(!document.getElementById('monClassCtl2Row').hidden && [...sel.options].map(o => +o.value).join() === x.options,
            'the ' + x.label + ' row is shown with ' + x.options, [...sel.options].map(o => o.value));
      const live = k => S.entries.filter(e => e.when === 'event' && e.def.record && e.def.record.key === k).some(e => e.requests.some(q => !q.stopped));
      sel1.value = String(x.with); sel1.onchange({ target: sel1 }); await frames(2);
      sel.value = String(x.control2); sel.onchange({ target: sel }); await frames(2);
      check(V.state.classCtl2 === x.control2, 'the ' + x.label + ' control sets the second class byte', V.state.classCtl2);
      await play(x.at[0], x.at[1]); await frames(4);
      check(live(x.swap[1]) && !live(x.swap[0]), x.label + ' ' + x.control2 + ': u ' + x.swap[1] + ' held, not u ' + x.swap[0], [live(x.swap[0]), live(x.swap[1])]);
      sel.value = String(x.reset); sel.onchange({ target: sel }); await frames(2);
      await play(x.at[0], x.at[1]); await frames(4);
      check(live(x.swap[0]) && !live(x.swap[1]), x.label + ' ' + x.reset + ': back to u ' + x.swap[0], [live(x.swap[0]), live(x.swap[1])]);
      sel1.value = '0'; sel1.onchange({ target: sel1 }); await frames(2);
    }
    // ON A SNOW MAP (the Snow Variants list, snowNow): the class holds x.snowHold[1] in place of x.snowHold[2] (Kushala's barrier,
    // ids 1004 / 1005 for 1006 / 1007 -- vt+0x208 0xdeffc4 with ctl+0x2d set), and back off the list
    // CHAMELEOS's INVISIBLE (CLASS_CONTROLS em025_00, ctl+0xc): the Invisible row; On -> the eyes off (set 9), body / wing on
    // stealth_start_S, after 30 frames the model not drawn, and the PSL gate refusing starts; Off -> drawn, the gate open
    if (x.cloak){
      const sel = document.getElementById('monClassCtl');
      check(!document.getElementById('monClassCtlRow').hidden && [...sel.options].map(o => +o.value).join() === '0,1', 'the Invisible row is shown with 0,1 (Off / On; breaks live, 2026-10-22)', [...sel.options].map(o => o.value));
      await play(x.cloak[0], x.cloak[1]); await frames(4);
      sel.value = '1'; sel.onchange({ target: sel }); await frames(4);
      const d1 = V.mounted.main.userData.partsDrawn;
      check(d1 && d1.get(1) === false && d1.get(6) === false, 'Invisible: the eyes go (set 9: groups 1 and 6 off)', d1 && [d1.get(1), d1.get(6)]);
      const st = V.mounted.main.userData.romStage, mats = st && st.list && st.list[0];
      check(!!mats && mats.clip === 'stealth_start_S', 'and the body / wing machine plays stealth_start_S', mats && mats.clip);
      // the model's meshes (buildMesh's `prim`) are not drawn -- the root stays, the effect runtime keeps stepping
      const modelShown = () => { let n = 0; V.mounted.main.traverse(o => { if (o.isMesh && o.userData.prim !== undefined && o.visible && o.material && o.material.visible) n++; }); return n; };
      const f0 = S.frame; await frames(45);
      check(modelShown() === 0 && S.pslRefuse === true && S.frame > f0 + 20, 'after 30 frames the model is not drawn, no PSL record starts, and the effects keep stepping', { shown: modelShown(), refuse: S.pslRefuse, steps: S.frame - f0 });
      sel.value = '0'; sel.onchange({ target: sel }); await frames(12);
      // the full uncloak (vt+0x210 phase 0, 0xe01764): the stealth materials swapped in, the model drawn TRANSLUCENT on its way back
      const matsUp = [];
      V.mounted.main.traverse(o => { if (o.isMesh && o.material && o.visible) matsUp.push(o.material); });
      const swapped = matsUp.some(m => m.name === '#a525c570'), tr = matsUp.filter(m => m.userData && m.userData.cloakA).length;
      check(modelShown() > 0 && S.pslRefuse === false && swapped && tr > 0, 'Off: drawn again at once, translucent (the 60-frame alpha), stealth01 in slot 1, the gate open', { shown: modelShown(), refuse: S.pslRefuse, swapped, translucent: tr });
      await frames(110);
      const d0 = V.mounted.main.userData.partsDrawn, mats2 = [];
      V.mounted.main.traverse(o => { if (o.isMesh && o.material && o.visible) mats2.push(o.material); });
      check(d0 && (d0.get(1) !== false || d0.get(6) !== false) && !mats2.some(m => m.name === '#a525c570') && !mats2.some(m => m.userData && m.userData.cloakA),
            'and after the uncloak: the eyes back (phase 4), the body material back, opaque', { eyes: d0 && [d0.get(1), d0.get(6)] });
      // THE HIT ZONES while cloaked (0xbaafc(e, k, k), k 0..6): slots 0-6 on table-1 rows; the Damage Table follows the control
      {
        const HZ = await (await fetch('/hitzones.json')).json(), rec = HZ.monsters && HZ.monsters[MON];
        const t0 = M.meatTableFor(MON, rec.tables, { ctl: 0 }), t1 = M.meatTableFor(MON, rec.tables, { ctl: 1 });
        const rows = t => (t && (t.rows || t)) || [];
        check(M.meatAxisOf(MON) === 'ctl' && JSON.stringify(rows(t1)[0]) === JSON.stringify(rec.tables[1][0]) && JSON.stringify(rows(t0)[0]) === JSON.stringify(rec.tables[0][0]) && JSON.stringify(rows(t1)[7]) === JSON.stringify(rec.tables[0][7]),
              'the damage table on the Invisible byte: slots 0-6 on table 1 while cloaked, slot 7 unchanged', { t1: rows(t1).slice(0, 1), axis: M.meatAxisOf(MON) });
      }
      // THE SHIMMER (horn broken, ctl+0x13 1): stealth01 / stealth02 into slots 1 / 3 at 30 frames, the model stays drawn, PSL open
      {
        const fields = [...document.querySelectorAll('#monGroups .field')];
        let hornSel = null, hornWas = null;
        for (const fl of fields){
          const sl = fl.querySelector('select'); if (!sl) continue;
          for (const o of [...sl.options]){
            const was = sl.value; sl.value = o.value; sl.dispatchEvent(new Event('change')); await frames(2);
            const d = V.mounted.main.userData.partsDrawn;
            if (d && d.get(5) === false && d.get(2) === true){ hornSel = sl; hornWas = was; break; }
            sl.value = was; sl.dispatchEvent(new Event('change')); await frames(1);
          }
          if (hornSel) break;
        }
        check(!!hornSel, 'a Parts row draws the broken horn (set 4: group 5 off, group 2 on)');
        if (hornSel){
          sel.value = '1'; sel.onchange({ target: sel }); await frames(50);
          const shown = []; V.mounted.main.traverse(o => { if (o.isMesh && o.userData.prim !== undefined && o.visible && o.material && o.material.visible) shown.push(o.material.name); });
          check(shown.includes('#a525c570') && shown.includes('#15178149') && S.pslRefuse === false,
                'horn broken, Invisible: the shimmer -- stealth01 / stealth02 drawn in place of the body / wing, the PSL gate open', { mats: [...new Set(shown)], refuse: S.pslRefuse });
          sel.value = '0'; sel.onchange({ target: sel }); await frames(110);
          hornSel.value = hornWas; hornSel.dispatchEvent(new Event('change')); await frames(2);
        }
      }
    }
    if (x.snowHold){
      const live = k => S.entries.filter(e => e.when === 'event' && e.def.record && e.def.record.key === k).some(e => e.requests.some(q => !q.stopped));
      // (a routed entry plays the clip underneath under its own name: the list's own option is what is checked)
      if (V.state.list !== 'snow'){ listSel.value = 'snow'; await listSel.onchange(); }
      const so = [...clipSel.options].find(o => o.value === x.snowHold[0]), ok = !!so;
      if (so){ clipSel.value = so.value; await clipSel.onchange(); }
      await frames(8);
      check(ok && live(x.snowHold[1]) && !live(x.snowHold[2]), 'Snow Variants ' + x.snowHold[0] + ': u ' + x.snowHold[1] + ' held, not u ' + x.snowHold[2], [ok, live(x.snowHold[1]), live(x.snowHold[2])]);
      const l0 = MONSTER.lists.find(l => l.id === '0');
      await play('0', l0.clips[0].clip.replace(/_(start|loop)$/, '')); await frames(6);
      check(live(x.snowHold[2]) && !live(x.snowHold[1]), 'off the snow list: back to u ' + x.snowHold[2], [live(x.snowHold[1]), live(x.snowHold[2])]);
    }
    if (x.hold){
      await play(x.hold[0], x.hold[1]); await frames(4);
      const live = S.entries.filter(e => e.when === 'event' && e.def.record && e.def.record.key === x.hold[2]).some(e => e.requests.some(q => !q.stopped));
      check(live, 'the class holds u ' + x.hold[2] + ' on L' + x.hold[0] + ' ' + x.hold[1], live);
    }
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckElder;
export const args = [
  ['em012_00', 'Lao-Shan Lung', [[0, 1, null, {}, 0x7ff81ff], [2, 5, [7, 1], {}, 0x7ff81ff]], ['3', 'Motion[1]', 1000], null, []],
  ['em013_00', 'Fatalis', [[2, 5, [7, 0x3b], {}, 0x1ff], [0, 5, [1, 3], {}, 0xe001ff], [0, 5, [3, 0xe], {}, 0x1ff]], ['3', 'Motion[1]', 1000], ['0', 'Motion[5]'], []],
  ['em013_01', 'Crimson Fatalis', [[2, 5, [7, 0x3b], {}, 0x381ff], [2, 6, [7, 0x13], {}, 0x1ff]], ['3', 'Motion[1]', 1000], ['0', 'Motion[5]'], []],
  ['em013_02', 'Old Fatalis', [[2, 5, [7, 0x00], {}, 0x1c01ff], [2, 5, [7, 0x3b], {}, 0x1ff]], ['3', 'Motion[1]', 1000], ['0', 'Motion[5]'], []],
  ['em024_00', 'Kushala Daora', [[0, 1, null, { windAura: 0 }, 0x381ff], [0, 1, null, { windAura: 3 }, 0xe001ff], [0, 1, null, { windAura: 5 }, 0x1ff]],
   ['3', 'Motion[1]', 1025], ['2', 'Motion[18]'],
   [{ control: 3, reset: 0, label: 'Wind Aura', options: '0,1,2,3' }, { hold: ['0', 'Motion[1]', 230] }, { snowHold: ['L2 Motion[7]', 210, 230] }]],
  ['em025_00', 'Chameleos', [[0, 1, null, {}, 0x1ff]], ['3', 'Motion[3]', 1000], ['4', 'Motion[1]'], [{ cloak: ['0', 'Motion[1]'] }]],
  ['em027_00', 'Teostra', [[2, 1, [7, 10], {}, 0x70001ff], [0, 1, null, { fireAura: 1 }, 0x381ff], [4, 6, null, { fireAura: 1 }, 0x3803f]],
   null, ['0', 'Motion[5]'], [{ control: 1, reset: 0, label: 'Fire Aura', options: '0,1', onHold: ['0', 'Motion[1]', 0], offFire: 1 },
    { control2: 1, reset: 0, with: 1, label: 'Size Type', options: '0,1', at: ['0', 'Motion[1]'], swap: [0, 10] },
    { hold: ['4', 'Motion[9]', 160] }]],   // the nova's charge (0xe17ce8 selector 0, (7, 5)): u 160 held on L4 M9 (open-items 80)
  ['em050_00', 'Alatreon', [[2, 5, [7, 0x18], { severed: true }, 0x380001ff], [2, 7, [7, 0x38], {}, 0x70001ff], [0, 9, [7, 0x22], {}, 0x381ff]], null, null, []],
  ['em058_00', 'Amatsu', [[0, 1, null, {}, 0x1ff]], ['3', 'Motion[1]', 1005], ['1', 'Motion[9]'],
   [{ control: 1, reset: 0, label: 'HP State', options: '0,1' }, { hold: ['1', 'Motion[1]', 0] }, { hold: ['1', 'Motion[1]', 100] }]],
  ['em071_00', 'Gore Magala', [[2, 7, [7, 0x58], {}, 0x381bf], [2, 7, [7, 0x60], {}, 0x1c01bf]], ['3', 'Motion[2]', 1000], ['0', 'Motion[5]'], []],
  ['em071_05', 'Chaotic Gore Magala', [[2, 7, [7, 0x58], {}, 0x381bf]], ['3', 'Motion[2]', 1000], ['0', 'Motion[5]'], []],
  ['em072_00', 'Shagaru Magala', [[2, 7, [7, 0x60], {}, 0x1c01bf]], ['3', 'Motion[2]', 1000], ['4', 'Motion[2]'], []],
  ['em084_00', 'Nakarkos', [], null, null, []],
  ['em086_00', 'Valstrax', [[0, 1, null, {}, 0x1ff]], ['3', 'Motion[1]', 1000], ['0', 'Motion[5]'], [{ hold: ['1', 'Motion[1]', 200] }]],
  // Soulseer's Soul Flame control (not an Elder Dragon: his class's own held flame u 300, CLASS_TIMERS em082_04)
  ['em082_04', 'Soulseer Mizutsune', [], null, null, [{ control: 1, reset: 0, label: 'Soul Flame', options: '0,1', onHold: ['0', 'Motion[1]', 300] }]],
  ['em087_00', 'Ahtal-Neset', [[0, 1, null, {}, 0xff81ff]], ['3', 'Motion[6]', 1015], null, []],
];
