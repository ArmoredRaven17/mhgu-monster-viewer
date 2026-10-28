// shellmeter.mjs (run-check.mjs; SM_IDS=em005_00,... picks the monsters): THE DRAW METER (__view.effectMeter, the effects agent's,
// render/rom/effect/live.js METER) over the plays smplan.mjs found to reach each SHELL record: every menu entry of the clip (its
// copies '#B' ... included), played once per pick of the clip (each play takes the next pick), on the Ground the plan names. Camera
// pulled back 2.5x as the effects agent's survey. One REPORT line per monster with the meter's rows for when == 'shell'.
async function shellMeter(MON, plays, pre, sweep){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const t0 = performance.now();
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  const up = await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  if (!up){ out.push([false, 'REPORT ' + MON, JSON.stringify({ error: 'no runtime' })]); return out; }
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  // the clip loop ON, the page's default: with it off the frame handler's shells (Kut-Ku's L0 M24 dust, Diablos's L0 M33) never start
  V.state.loop = true;
  // the State dropdown's enraged option, else the Enraged switch (the effects agent's metersurvey setRage)
  const setRage = async on => {
    const st = document.getElementById('monState'), opts = st ? [...st.options] : [];
    const o = on ? (opts.find(x => x.value === 'rage') || opts.find(x => /^(rung|lv):/.test(x.value) && x.value !== 'lv:0'))
                 : (opts.find(x => x.value === 'normal') || opts.find(x => x.value === 'lv:0'));
    const row = document.getElementById('monStateRow');
    if (o && row && !row.hidden){ st.value = o.value; st.onchange({ target: st }); }
    else { const b = document.getElementById('monRage'); if (b){ b.checked = on; b.onchange({ target: b }); } }
    await frames(2);
  };
  // pre: the Parts panel rows to set first ([{ row: '2,3', text: 'Broken' }], the em005_00 check's pick); { rage: true } the
  // enraged state (kept through the plays); { wait: n } n frames
  // pre: the Parts panel rows to set first ([{ row: '2,3', text: 'Broken' }], the em005_00 check's pick)
  for (const q of (pre || [])){
    if (q.rage != null){ await setRage(!!q.rage); continue; }
    if (q.wait){ await frames(q.wait); continue; }
    if (q.slimeHit != null){ if (window.__slime063) window.__slime063.hit(q.slimeHit); await frames(2); continue; }   // Raging's slime hit (index.html __slime063)
    if (q.hunter){ if (window.__hunter) window.__hunter.set(q.hunter[0], q.hunter[1], q.hunter[2]); await frames(3); continue; }   // the Hunter control (dist, side, body)
    if (q.quest){ if (window.__quest) window.__quest.set(q.quest[0], q.quest[1]); await frames(3); continue; }   // the Quest Rank / Level (rank, level)
    if (q.select){ const el = document.getElementById(q.select); if (el){ el.value = q.value; el.onchange({ target: el }); await frames(2); } else out.push([false, 'PRE ' + q.select, 'no such control']); continue; }
    const fr = q.rowName ? [...document.querySelectorAll('[data-row]')].find(x => x.textContent.includes(q.rowName)) : document.querySelector('[data-row="' + q.row + '"]'), sel = fr && fr.querySelector('select');   // rowName: by the row's label (an attached body's)
    const o = sel && [...sel.options].find(x => x.textContent.trim() === q.text);
    if (!o){ out.push([false, 'PRE ' + q.row + ' ' + q.text, 'no such row / option']); continue; }
    sel.value = o.value; sel.dispatchEvent(new Event('change')); await frames(2);
  }
  V.effectMeter(true, { every: 3 });
  const missing = []; let played = 0;
  const runPlays = async list => { for (const p of list){
    if (window.__ground) window.__ground.set(p.ground || 'plain');
    if (p.rage) await setRage(true);
    if (V.state.list !== p.list){ listSel.value = p.list; await listSel.onchange(); }
    const base = p.clip;
    const opts = [...clipSel.options].map(o => o.value).filter(v => { const b = v.replace(/#.*$/, '').replace(/_(start|loop)$/, ''); return b === base; });
    // EVERY menu entry: each copy, and both halves of a split clip -- the page plays one half at a time (trap 120: a _loop pick
    // runs the frames after its _start's length, so shells timed past the _start only start on the _loop pick)
    const entries = opts.slice();
    if (!entries.length){ missing.push(p.list + '|' + base); continue; }
    // EACH PICK IS ONE PLAY, AND A LOOP'S WRAP IS A NEW PLAY (index.html rockInput: rockPlays.n advances on a wrap and on a new
    // selection): so a clip is selected ONCE and left to wrap n times -- selecting it again after a wrap advanced the pick twice and a
    // two-pick clip only ever showed its first (the meter's own artefact, found 2026-10-20)
    // (a _loop piece's wrap CONTINUES the play -- rockInput's goesOn -- so there each pick is a fresh selection, as before)
    // A SPLIT CLIP AS ITS PLAYS (2026-10-21): the pick advances on a _start selection or wrap, and a _loop selection CONTINUES the
    // play before it (rockInput's goesOn) -- so each play is a _start then its _loop, n times; the _loop alone only ever showed the
    // last _start's pick (Kushala's L2 M9 (7, 0x2d), the probe: every _loop selection kept 7:0x41)
    const st0 = entries.find(v => /_start$/.test(v)), lp0 = entries.find(v => /_loop$/.test(v));
    if (st0 && lp0 && !p.loopOnly){
      for (let i = 0; i < p.n; i++){
        clipSel.value = st0; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip(), 100);
        const ls = Math.max(1, Math.round(((V.pose.action && V.pose.action.getClip().duration) || 0) * 60));
        await frames(Math.max(1, ls - 1));
        clipSel.value = lp0; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip(), 100);
        await frames(p.frames); played++;
      }
      entries.splice(entries.indexOf(st0), 1); entries.splice(entries.indexOf(lp0), 1);
    }
    for (const val of entries){
      if (/_loop$/.test(val)){
        for (let i = 0; i < p.n; i++){
          clipSel.value = val; await clipSel.onchange();
          await until(() => V.pose.action && V.pose.action.getClip(), 100);
          await frames(p.frames); played++;
        }
        continue;
      }
      clipSel.value = val; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip(), 100);
      const len = Math.max(1, Math.round(((V.pose.action && V.pose.action.getClip().duration) || 0) * 60));
      await frames(Math.min(4000, p.n * len + Math.max(60, p.frames - len))); played += p.n;
    }
    // a beam row's partner clips (its action runs on into them): each played once after
    for (const pc of (p.partners || [])){
      const o = [...clipSel.options].find(x => x.value === pc) || [...clipSel.options].find(x => x.value === pc + '_start') || [...clipSel.options].find(x => x.value === pc + '_loop');
      if (!o) continue;
      clipSel.value = o.value; await clipSel.onchange(); await frames(Math.min(400, p.frames)); played++;
    }
    if (p.rage) await setRage(false);
  } };
  await runPlays(plays);
  // THE STATE SWEEP (sweep.plays): every state control the page shows for him -- the State dropdown, the class controls, Carrying,
  // Stance, Boulder, Level, each class toggle -- set to each other option in turn, the plays run again, then put back
  const swept = [];
  if (sweep && sweep.plays && sweep.plays.length){
    // (shown = not inside a [hidden] row: a control in a collapsed panel still works, and offsetParent is null there)
    const shown = el => el && !el.closest('[hidden]');
    for (const id of ['monState', 'monClassCtl', 'monClassCtl2', 'monCarry', 'monStance', 'monBoulder', 'monLevel', 'monRageLevel']){
      const el = document.getElementById(id);
      if (!shown(el) || el.options.length < 2) continue;
      const orig = el.value;
      for (const o of [...el.options]){
        if (o.value === orig) continue;
        el.value = o.value; (el.onchange || (() => {}))({ target: el }); await frames(3);
        swept.push(id + '=' + o.value); await runPlays(sweep.plays);
      }
      el.value = orig; (el.onchange || (() => {}))({ target: el }); await frames(3);
    }
    // the Parts panel's rows (sweep.parts): each row's every other option, the plays again, then put back
    if (sweep.parts) for (const fr of [...document.querySelectorAll('[data-row]')]){
      const sel = fr.querySelector('select');
      if (!sel || sel.options.length < 2) continue;
      const orig = sel.value;
      for (const o of [...sel.options]){
        if (o.value === orig) continue;
        sel.value = o.value; sel.dispatchEvent(new Event('change')); await frames(3);
        swept.push('part ' + fr.getAttribute('data-row') + '=' + o.textContent.trim()); await runPlays(sweep.plays);
      }
      sel.value = orig; sel.dispatchEvent(new Event('change')); await frames(3);
    }
    // the Quest Rank (window.__quest, the effects agent's control: 0x3a8430's 5 / 3 / 1 / 0), the level left at its default
    if (window.__quest && window.__quest.set){
      const q0 = window.__quest.now ? window.__quest.now() : null;
      for (const r of [3, 1]){
        window.__quest.set(r, q0 && q0.level != null ? q0.level : 10); await frames(3);
        swept.push('rank=' + r); await runPlays(sweep.plays);
      }
      window.__quest.set(q0 && q0.rank != null ? q0.rank : 5, q0 && q0.level != null ? q0.level : 10); await frames(3);
    }
    for (const box of [...document.querySelectorAll('#monClassToggles input[type=checkbox]')]){
      if (!shown(box)) continue;
      const orig = box.checked;
      box.checked = !orig; box.onchange({ target: box }); await frames(3);
      swept.push((box.parentElement && box.parentElement.id) + '=' + box.checked); await runPlays(sweep.plays);
      box.checked = orig; box.onchange({ target: box }); await frames(3);
    }
  }
  if (window.__ground) window.__ground.set('plain');
  const rep = V.effectMeterReport();
  V.effectMeter(false);
  // the shell rows, and any OTHER row on a pel / key the plan's shells start (a shell request resolved to a same-key clip entry would
  // show there, with the clip record's .efl)
  const want = new Set(plays.flatMap(p => p.recs.map(x => x.replace(':', '|'))));
  const recs = rep.recs.filter(r => r.monster === MON && (r.when === 'shell' || want.has(r.key.split('|').slice(1, 3).join('|'))));
  out.push([false, 'REPORT ' + MON, JSON.stringify({ played, missing, swept, secs: Math.round((performance.now() - t0) / 1000),
    recs: recs.map(r => ({ k: r.key, efl: r.efl, st: r.starts, df: r.drawFrames, vf: r.visibleFrames, d: r.draws, s: r.samples, lit: r.litSamples,
      aimed: r.aimedLit, px: r.pixMax, verdict: r.verdict, hid: r.hidden, nodraw: r.nodraw })) })]);
  return out;
}
export const pageCheck = shellMeter;
let PLAN = {};
if (typeof process !== 'undefined'){
  const fs = await import('node:fs');
  PLAN = JSON.parse(fs.readFileSync(new URL(process.env.SM_PLAN || './smplan.json', import.meta.url), 'utf8'));
}
export const args = (typeof process !== 'undefined' && process.env.SM_CUSTOM) ? JSON.parse(process.env.SM_CUSTOM)
  : ((typeof process !== 'undefined' && process.env.SM_IDS) ? process.env.SM_IDS.split(',') : []).map(id => [id, PLAN[id] || []]);
