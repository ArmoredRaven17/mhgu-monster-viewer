p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
anchor = "  // ---- THE PAIRS: his clip and his frame against hers"
assert s.count(anchor) == 1
NEW = r"""  // ---- HER RECORDS ON THE COMBINED LIST: every consumer keyed on list|clip reads a combined entry as the clip of hers it
  // plays (index.html seqMotionNow / partnerMotionNow). Each case is played raw and as its combined entry, and what the
  // schedule, the PSL word, the state table and her parts show is compared, at fixed frames and over a run from frame 0
  {
    const MS_ = await import('/render/motion-states.js');
    if (!M.effectRuntimeInstance()){ await V.effects(true); await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule, 300); }
    const RT = M.effectRuntimeInstance(), SS = RT && RT.schedule;
    check(!!SS && RT.monsterId === MON, 'her effect runtime is up for the routing cases', RT && RT.monsterId);
    if (SS){
      const started = [];
      const st0 = SS.start.bind(SS);
      SS.start = e => { started.push(e.def && e.def.record ? e.def.record.pel + ':' + e.def.record.key : String(e.when)); return st0(e); };
      const herParts = () => { const d = V.mounted.main.userData.partsDrawn; return d ? JSON.stringify([...d].sort((a, b) => a[0] - b[0])) : null; };
      const snap = async f => {
        V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3);
        const ms = V.motionStates(), c = SS.clip || {};
        return { key: c.key, frame: Math.round(c.frame || 0), motion: c.motion ? Object.keys(c.motion).length + ':' + (c.motion.frames || '') : null,
                 mask: c.mask, msKey: ms.cur && ms.cur.key, sets: ms.cur && JSON.stringify(ms.cur.sets), rage: ms.cur && ms.cur.rage,
                 parts: herParts() };
      };
      const run = async n => {
        V.pose.action.paused = true; V.pose.action.time = 0; await frames(2);
        started.length = 0; V.pose.action.paused = false; await frames(n); V.pose.action.paused = true;
        return [...new Set(started)].sort();
      };
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const L = duoList();
      const cases = [];
      // an L4 clip of hers that requests an effect from its PSL (a required entry), and her state-table rows (free entries)
      const fxReq = L.clips.find(c => c.group === 'required' && M.clipEffectsFor(MON, c.her.clip.replace(/_(start|loop)$/, ''), c.her.list));
      if (fxReq){
        const b = M.clipEffectsFor(MON, fxReq.her.clip.replace(/_(start|loop)$/, ''), fxReq.her.list).bits[0].on[0][0];
        cases.push({ c: fxReq, at: [0, b + 2], n: b + 12, why: 'a PSL effect bit from frame ' + b });
      }
      for (const c of L.clips.filter(c => (c.group === 'free' || c.group === 'leaves') &&
                                         (row => row && !row.cycle && !row.levels)((MS_.MOTION_STATES[MON] || {})[c.her.list + '|' + c.her.clip.replace(/_(start|loop)$/, '')])).slice(0, 4))
        cases.push({ c, at: [0, 30], n: 100, why: 'MOTION_STATES ' + c.her.list + '|' + c.her.clip });
      check(cases.length >= 3 && !!fxReq, 'routing cases: an effect clip and her state rows on the combined list', cases.map(x => x.c.clip));
      for (const k of cases){
        await playRaw('4', 'Motion[36]');
        await playRaw(k.c.her.list, k.c.her.clip);
        const raw = []; for (const f of k.at) raw.push(await snap(f));
        const rawRun = await run(k.n);
        await playRaw('4', 'Motion[36]');                 // a clip between, so both plays start fresh
        await pickOn(DUO, k.c.clip);
        const duo = []; for (const f of k.at) duo.push(await snap(f));
        const duoRun = await run(k.n);
        const q = await P();
        check(same(raw, duo) && same(rawRun, duoRun) && raw[0].key === MON + '|' + k.c.her.list + '|' + k.c.her.clip.replace(/_(start|loop)$/, ''),
              k.c.clip + ' fires as raw L' + k.c.her.list + ' ' + k.c.her.clip + ' (' + k.why + '): schedule key, frame, PSL word, state row, parts and the records started',
              { raw, duo, rawRun, duoRun, routed: q.routed });
      }
      // a rage row: L0 M5 ({ rage: true }) shows rage on the combined entry as on the raw clip
      const rg = L.clips.find(c => c.her && c.her.list === '0' && /^Motion\[5\]/.test(c.her.clip));
      if (rg){
        await playRaw('4', 'Motion[36]'); await playRaw('0', rg.her.clip); const a = await snap(20);
        await playRaw('4', 'Motion[36]'); await pickOn(DUO, rg.clip); const b = await snap(20);
        check(a.rage === true && b.rage === true && a.msKey === b.msKey, 'her rage row (L0 M5): rage shown on ' + rg.clip + ' as on the raw clip', { raw: a, duo: b });
      } else check(false, 'L0 M5 is on the combined list');
      // the joined entry, per piece: inside her M77 the schedule is on L4 M77 at M77's own frame
      {
        const J = L.clips.find(c => c.group === 'joined');
        await pickOn(DUO, J.clip);
        const pre = J.pieces.slice(0, 2).reduce((n, p) => n + Math.round(p.dur * 60), 0);
        const a = await snap(pre + 20), b = await snap(pre + Math.round(J.pieces[2].dur * 60) + 10);
        const q = await P();
        check(a.key === MON + '|4|Motion[77]' && Math.abs(a.frame - 20) <= 1 && b.key === MON + '|4|Motion[78]',
              'the joined S. Motion[76]-[79] fires per piece: L4 M77 at its own frame 20, then L4 M78', { a, b, routed: q.routed });
      }
      // his entry: her side is her L0 M1 loop, and her records are that clip's
      {
        await pickOn(DUO, 'Seltas Motion[31]');
        const a = await snap(40);
        check(a.key === MON + '|0|Motion[1]', 'his entry Seltas Motion[31]: her schedule runs on her L0 M1 (the clip under him)', a);
      }
      SS.start = st0;
      V.pose.action.paused = false;
    }
    // HIS SIDE: the clips he plays on the combined list are his list 4's; MOTION_STATES.em076_00 has no list-4 row, so no
    // state record of his applies there; his PSL bits (L4 M31..M34) need his own effect runtime, which is not up (the one
    // runtime is hers)
    {
      const his = MS_.MOTION_STATES.em076_00 || {};
      check(!Object.keys(his).some(k => /^4\|/.test(k)), 'his state table has no list-4 row: nothing of his to route on the combined list', Object.keys(his));
      check(!RT || RT.monsterId === MON, 'the effect runtime is hers: his PSL bits (L4 M31..M34) do not fire', RT && RT.monsterId);
    }
    // NOTHING ELSE KEYED ON THE LIST BREAKS ON 'duo': the hit-zone panel holds and gives back a combined entry, the saved view
    // records it, and the hit-zone mode reads the clip of hers
    {
      const name = 'Queen L4 Motion[6]';
      await pickOn(DUO, name);
      let saved = null; try { saved = JSON.parse(localStorage.getItem('mhgu-monster-viewer') || 'null'); } catch (_) {}
      check(saved && saved.list === DUO && saved.clip === name, 'the saved view records the combined list and entry', saved && { list: saved.list, clip: saved.clip });
      const hz = document.getElementById('hitZonesPanel');
      hz.dataset.open = 'true'; hz.dispatchEvent(new Event('panelopen'));
      await until(() => V.state.list !== DUO, 300); await frames(4);
      const inside = { list: V.state.list, clip: V.state.clip };
      hz.dataset.open = 'false'; hz.dispatchEvent(new Event('panelclose'));
      await until(async () => V.state.list === DUO && V.state.clip === name && (await P()).mounted, 400); await frames(4);
      r = await P();
      check(inside.list !== DUO && V.state.list === DUO && V.state.clip === name && r.mounted && r.local && r.local.clip === 'Motion[6]',
            'the Hit Zones panel holds her idle and gives the combined entry back, him mounted on his pair', { inside, list: V.state.list, clip: V.state.clip, local: r.local });
    }
  }

"""
s = s.replace(anchor, NEW + anchor)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
