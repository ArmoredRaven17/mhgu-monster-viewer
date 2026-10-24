p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
anchor = "    // a linked entry still follows her joint, as a control for the same readback\n    await play('4', 'Motion[36]');"
assert s.count(anchor) == 1
NEW = r"""    // HIS EFFECTS FOLLOW THE UNLINKED PIECES (his own runtime, render/rom/effect-mounts.js partnerEffectRuntime; index.html
    // partnerFxClip): the schedule is keyed on the piece's own list -- L3 M11 on landing, whose PSL bit 0 (cm202_020 key 121,
    // on frames 1..2) starts there -- and his unit is the unlinked frame
    {
      const FX = await import('/render/rom/effect-mounts.js');
      if (!M.effectRuntimeInstance()){ await V.effects(true); }
      await until(() => FX.partnerEffectRuntime() && FX.partnerEffectRuntime().schedule, 600);
      const PR = FX.partnerEffectRuntime(), PS = PR && PR.schedule;
      check(!!PS && PR.monsterId === 'em076_00', 'his effect runtime is up', PR && PR.monsterId);
      if (PS){
        const got = [];
        const st0 = PS.start.bind(PS);
        PS.start = e => { if (e.def && e.def.record) got.push(e.def.record.key); return st0(e); };
        await pickOn(DUO, 'Seltas Motion[77] drop off her (1:0x22)');
        const n0 = (await at(0)).unl.tLand;
        const k1 = (await at(n0 + 1), PS.clip && { key: PS.clip.key, frame: Math.round(PS.clip.frame) });
        V.pose.action.time = Math.max(0, n0 - 2) / 60; got.length = 0; V.pose.action.paused = false; await frames(8); V.pose.action.paused = true;
        check(k1 && k1.key === 'em076_00|3|Motion[11]' && k1.frame === 1 && got.includes(121),
              'drop: on landing his schedule runs L3 M11 at its own frame and starts its PSL record (cm202_020 key 121)', { k1, got });
        await pickOn(DUO, 'Queen L4 Motion[68]_loop + Seltas leaves');
        await at(80);
        const k2 = PS.clip && { key: PS.clip.key, frame: Math.round(PS.clip.frame) };
        const u = (await P()).frameAt, um = PR.unit ? null : null;
        check(k2 && k2.key === 'em076_00|1|Motion[1]', 'leave: in the hover his schedule runs on his list 1 (L1 M1)', k2);
        PS.start = st0;
      }
      V.pose.action.paused = false;
    }
"""
s = s.replace(anchor, NEW + anchor)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
