// u605c.mjs (effects lane, 2026-10-25): Boltreaver L9 M22 -- what the ground ray answers u 605 and where its core ends. Logs every
// 0x18154c call (the floor it was given, A.y / B.y), per frame f20..f40 the u 605 requests' core state (+0xc & 7), the floor the
// viewer hands the effects (host.stageFloorY, monsterFloorY), the unit (rt.parent.position) and the air height (window.__air if any).
async function u605c(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const MON = 'em081_04', monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const rt = M.effectRuntimeInstance(), S = rt.schedule, H = rt.host, m = H.m;
  const rays = []; const orig = m.svc.stageRay;
  m.svc.stageRay = (a) => { const fl = orig(a); rays.push({ f: S.walker && S.walker.last, floor: fl, Ay: m.f32(a[1] + 4), By: m.f32(a[2] + 4), Bx: m.f32(a[2]), Bz: m.f32(a[2] + 8) }); return fl; };
  listSel.value = '9'; await listSel.onchange();
  clipSel.value = 'Motion[22]'; await clipSel.onchange();
  const log = [];
  const ent = () => S.entries.filter(e => e.def.record && e.def.record.key === 605);
  for (let f = 0; f < 45; f++){
    await frames(1);
    const wf = S.walker && S.walker.last;
    if (wf < 20 || wf > 40) continue;
    log.push({ wf, floorY: H.stageFloorY, unit: rt.parent && rt.parent.position && rt.parent.position.map(Math.round),
               q: ent().map(e => e.requests.map(q => { let st = null, u = null; try { st = m.u32(q.core + 0xc) & 7; u = q.effects().length; } catch (x) { st = 'err ' + x.message; } return { st, u, stopped: !!q.stopped }; })) });
  }
  return [[false, 'U605C', JSON.stringify({ rays: rays.slice(0, 20), log })]];
}
export const pageCheck = u605c;
export const args = [[]];
