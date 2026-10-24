p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-congalala-check.mjs'
s = open(p, encoding='utf8').read()
a = s.index('import { writeFileSync')
head = r'''// Congalala's (em021_00) shells in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers (the Zinogre harness's machine), the getters answered with em021_00.arc's shell files (the cmn FUP of shell04 by
//      its type, efx/shellef.py load_typed). The setups are the class's OWN CODE run on the ROM at the row's frame (the frame test
//      0xb0974 answering 1 for that frame alone): the cloud spawners 0xdcfe40 (L0 M20), 0xdd4900 (L2 M5), 0xdd5f10 (L5 M14), the dung
//      throw 0xdd52a0(e, k) (L2 M12), the splat 0xdd3738 (L5 M12), the breaths 0xdd4b00(e, which, gas) (L2 M7 / M16, through the remap
//      vt+0x1fc 0xdcee10), the pit's 0x6fe88 (L3 M14). Each shell is flown from the setup the ROM built (the class DTI's `new`, the
//      base's init with the class's reader, the move), and every shell a move makes (a dung landing's shell01 2) from the setup the
//      ROM built for it; every init / move / effect start compared bit for bit (float32) to the end.
//   2. The contract: the pick lists, the gas gate and remap, the pit's once-a-pit gate.
//   3. CONTROLS: a wrong target, a wrong facing, a wrong joint, a moved floor must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): L0 M20 / L2 M7 / L2 M12 / L2 M16 spawn their shells on the
//      body's runtime and start their records; every exported shell record (u 0, 100, 130..160, 200..220, 300..330) starts and runs
//      out with no refusal.
//
//   node dev/shells-congalala-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-congalala-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
'''
s = head + s[a:]
b = s.index('export const args = [];')
page = r'''export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Congalala shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em021_00';
  const open = async () => {
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    return until(() => body() && body().monsterId === MON && body().schedule);
  };
  const OLD = new Set();
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start') ||
              [...clipSel.options].find(x => x.value === name + '_loop');
    if (!o){ check(false, 'list ' + list + ' has ' + name, [...clipSel.options].slice(0, 5).map(x => x.value)); return false; }
    OLD.clear();
    const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
    for (const s of (st ? st.shells : [])) OLD.add(s.id);
    clipSel.value = o.value; await clipSel.onchange();
    return true;
  };
  const watch = async (n, stop) => {
    const seen = new Map();
    for (let i = 0; i < n; i++){
      await frames(1);
      const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
      for (const s of (st ? st.shells : [])){
        if (seen.has(s.id) || OLD.has(s.id)) continue;
        seen.set(s.id, { shell: s.shell, mode: s.modeIndex, key: s.start && s.start.key, req: !!s.request, child: s.creator != null });
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  check(await open(), 'his runtime is up');
  {
    await pick('0', 'Motion[20]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.mode === 10 && x.key === 0 && x.req), 'L0 M20: the gas cloud, shell00 10, u 0 started', w);
  }
  {
    await pick('2', 'Motion[7]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell04'));
    check(w.some(x => x.shell === 'shell04' && x.mode === 0 && x.key === 100 && x.req), 'L2 M7: the gas-less breath, shell04 0, u 100 started', w);
  }
  {
    await pick('2', 'Motion[12]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && [0, 1, 3].includes(x.mode) && x.key === 200 && x.req), 'L2 M12: a dung throw, shell00 0 / 1 / 3, u 200 started', w);
  }
  {
    // L2 M16: each play the next gas (CLIP_ACTIONS `gas` 1..4) -- the remap's modes 1 / 3 / 2 / 4 (u 130 / 150 / 140 / 160)
    const got = [];
    for (let play = 0; play < 4; play++){
      await pick('2', 'Motion[16]');
      const w = await watch(260, x => x.some(y => y.shell === 'shell04'));
      const b = w.find(x => x.shell === 'shell04');
      got.push(b ? b.mode + ':' + b.key + (b.req ? '' : '!') : '-');
    }
    const want = ['1:130', '3:150', '2:140', '4:160'];
    const rot = want.findIndex(x => x === got[0]);
    check(rot >= 0 && got.every((g, i) => g === want[(rot + i) % 4]), 'L2 M16: four plays, the four gases in turn (shell04 1 / 3 / 2 / 4)', got);
  }
  for (const key of [0, 100, 130, 140, 150, 160, 200, 210, 220, 300, 310, 320, 330]){
    const S = body().schedule, e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em021_00u' && x.def.record.key === key);
    if (!e){ check(false, 'u ' + key + ' exported as a shell record'); continue; }
    let started = 0, maxRun = 0;
    for (let rep = 0; rep < 2; rep++){
      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }
      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
    }
    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
    if (body().failed) await open();
  }
  return out;
}
'''
s = s[:b] + page
open(p, 'w', encoding='utf8').write(s)
print('ok')
