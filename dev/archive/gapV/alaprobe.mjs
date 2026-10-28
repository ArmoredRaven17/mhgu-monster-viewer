// alaprobe.mjs (run-check.mjs): Alatreon's (7, 0x19) meteors (L2 M21, three sp_41 0 held 2000 above him) on the page, one play, loop
// off: every 10 effect steps each shell41's state / sub / timer / y / landing, its live handles and whether their requests are alive,
// the stage floor the shells test (host.stageFloorY, rockInput floorY), the owner position, until 700 steps.
async function alaProbe(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em050_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  V.state.loop = false;
  listSel.value = '2'; await listSel.onchange();
  const o = [...clipSel.options].find(x => x.value === 'Motion[21]') || [...clipSel.options].find(x => x.value.startsWith('Motion[21]'));
  clipSel.value = o.value; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  const rt = M.effectRuntimeInstance(), sc = rt.schedule, s0 = rt.stats.steps;
  const m = rt.host.m;
  const reqAlive = q => !!(q && (((m.u32(q.core + 0xc) & 7) - 1) >>> 0) < 2);
  const rows = []; let lastK = -10;
  for (let i = 0; i < 30000; i++){
    await raf();
    const k = rt.stats.steps - s0;
    if (k >= lastK + 10){
      lastK = k;
      const ri = sc.rockInput ? sc.rockInput() : null;
      const sh = (sc.shells ? sc.shells.state.shells : []).filter(S => S.base === 'base41').map(S => ({ id: S.id, st: S.state, sub: S.sub, t: Math.round(S.timer),
        y: Math.round(S.position[1]), x: Math.round(S.position[0]), z: Math.round(S.position[2]),
        live: Object.entries(S.live041 || {}).filter(([, h]) => h).map(([b, h]) => b + ':' + h.key + (S.handles && S.handles[b] ? (reqAlive(S.handles[b]) ? '+' : '-') : '?')).join(','),
        hits: (S.events || []).filter(e => e.ev === 'hit').map(e => e.type + '@' + e.point.map(Math.round).join('/')).join(' ') }));
      rows.push({ k, clipT: Math.round(V.pose.action.time * 60), floor: rt.host.stageFloorY, riFloor: ri && ri.floorY, owner: sc.parent && sc.parent.position ? sc.parent.position.map(Math.round) : null, sh });
    }
    if (k > 700) break;
  }
  out.push([false, 'ALA L2 M21', JSON.stringify(rows)]);
  return out;
}
export const pageCheck = alaProbe;
export const args = [[]];
