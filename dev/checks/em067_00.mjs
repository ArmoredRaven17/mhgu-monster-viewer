// Zamtrios's page check (em067_00), loaded by dev/motion-states-check.mjs from dev/checks/. dev/em067_00-effects-spec.md: the
// enable word 0xf772ec, the swim turns' depth, and his class request u 60 (0xf692a0).
async function pageCheckZamtrios(){
  const out = [];
  const MON = 'em067_00';
  const check = (ok, label, detail) => out.push([!!ok, 'Zamtrios: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
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
  const at = [];                       // fireAt: a record requested at a point (u 60 ahead of him, open-items 65)
  const a0 = S.fireAt.bind(S); S.fireAt = (pel, key, p) => { const r = a0(pel, key, p); fired.push(key); at.push([key, p, r.length]); return r; };
  const sel = async (list, v) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === v);
    if (!o){ check(false, 'the Clip menu offers ' + list + '|' + v); return false; }
    clipSel.value = v; await clipSel.onchange(); return true;
  };
  const mask = () => S.clip && S.clip.mask != null ? S.clip.mask >>> 0 : null;
  const W = (l, n, st) => PM.pslMask(MON, String(l), n, null, st || {});
  check(PM.PSL_MASK_MONSTERS.includes(MON) && W(0, 7) === 0x380001ff && W(0, 7, { sunk: true }) === 0x1ff &&
        W(4, 31, { posture: 4 }) === 0x381ff && W(4, 31, { posture: 4, sunk: true }) === 0x1ff && W(4, 31, {}) === 0x1ff,
        'the word: L0 M7 unless sunk, L4 M31 only posture 4 and not deep (0x81d18)');
  V.state.loop = true;
  const ms = [];
  for (const v of ['Motion[31]', 'Motion[31]#B']){ await sel('0', 'Motion[1]_loop'); await frames(2); if (await sel('4', v)){ await frames(6); ms.push(mask()); } }
  check(ms[0] === 0x381ff && ms[1] === 0x1ff, 'L4 M31 in the page: A the shallow turn (6, 5) bits 15-17, B the deep ones none',
        ms.map(w => w == null ? null : '0x' + w.toString(16)));
  // u 60 at L4 M20 f120 under (1, 0x43) -- copy B; copy A ((7, 0xc / 0xd)) none
  for (const [v, want] of [['Motion[20]', false], ['Motion[20]#B', true]]){
    await sel('0', 'Motion[1]_loop'); await frames(2); fired.length = 0;
    if (await sel('4', v)){
      await until(() => V.pose.action && V.pose.action.time * 60 >= 130, 900);
      check(fired.includes(60) === want, 'L4 M20 ' + (want ? 'B ((1, 0x43)): u 60 as it passes frame 120' : 'A ((7, 0xc / 0xd)): no u 60'), fired);
      if (want){
        // at the ROM's point: 530 x his scale ahead of the unit on his facing (0xf695e4..0xf696ac), and a request made there
        const hit = at.find(x => x[0] === 60), main = V.mounted.main;
        const U = main.getWorldPosition(new main.position.constructor()).multiplyScalar(100), F = main.getWorldDirection(new main.position.constructor());
        const S = (V.world && V.world.scale.x) || main.parent.scale.x || 1;
        const dx = hit ? hit[1][0] - U.x : NaN, dz = hit ? hit[1][2] - U.z : NaN, dist = Math.hypot(dx, dz);
        check(hit && hit[2] > 0 && Math.abs(dist - 530 * S) < 530 * S * 0.25 && (dx * F.x + dz * F.z) > 0,
              'L4 M20 B: u 60 requested at a point ~530 x scale ahead of him (fireAt)', hit && { dist, want: 530 * S, made: hit[2] });
      }
    }
  }
  await sel('0', 'Motion[1]_loop'); await frames(3);
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}
export const pageCheck = pageCheckZamtrios;
