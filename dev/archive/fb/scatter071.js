// THE SCATTER (READ: dev/gore-line-shells-spec.md 2.4; built 2026-10-19). Started by vt+0x204 0xfadfa0 when the status-7 action (7, 0x53)
// begins (0xfae188: Shagaru's L4 M2 -> M11 -> M12, the Special entry 'S. Motion 2 Scatter'), ticked by vt+0x1dc 0xfae824 every move
// (before the action main; the start's frame ticks too: INFERRED order):
//   start: C+0xd4 = 1, the life C+0xf4 = 7200.0, the centre C+0xe0.. = his block point, the seed C+0xf0 = e+0x73e8 (the action setter's
//     draw: H73E8_STANDIN), the count C+0xf2 = 0, the wait C+0xf8 = 240.0;
//   another action's start while it runs (0xfae000..0xfae06c, before that action's own arm): C+0xd4 = 2 for status 10 / 11 (r1 & 0xfe
//     == 0xa), else 1; the centre = his point again; the seed = e+0x5fc0 (H5FC0_STANDIN; the count kept);
//   C+0xd4 == 1: the wait (0x7206c -> 0x539d5c at rate 1) out -> one sp_01 (e+0xcac8) 1: x = c.x + (((f0 f2 37) mod 3000) - 1500),
//     z = c.z + ((((13 f2 + 39) f0) mod 3000) - 1500) (u32), y = c.y + 1000; at quest rank >= 5 with f2 & 3 == 0, 0xfaf54c: hunter
//     (e+0x73e8 & 3)'s x / z in his area, else (no hunter: the viewer) the same two values NOT added to the centre, y 1000; the ray
//     0x183664 down, block +0x44 - h < 1000 -> the shell at (x, h, z), words and +0x20 the GOT zeros; f2 + 1; the wait = 90.0;
//   C+0xd4 1 or 2: the life (the same countdown) out -> C+0xd4 = 0 (0xfaf188..0xfaf1fc)
const H5FC0_STANDIN = 0;          // e+0x5fc0 (a halfword the reseed reads): its writer NOT READ -- a named stand-in, as e+0x73e8's
const cd071 = (t, dt) => { if (!(t > 0)) return [0, true]; const u = f(t - dt); return u <= 0 ? [0, true] : [u, false]; };   // 0x539d5c
function scatter071(state, D, ctx, input, out, fresh, a){
  const own = ctx.own001;
  let s = state.sc071;
  if (fresh){
    const chain = s && s.chain, clip = String(input.clip || '').replace(/_(start|loop)$/, ''), list = String(input.list);
    // the Special entry's next motion is the same action (no action start): L4 M2 -> M11 -> M12
    const next = chain && s.st && list === '4' && clip === chain[s.ci + 1];
    if (next) s.ci++;
    else {
      if (s && s.st && own.ownerPos){
        const st = a && a.action ? a.action[0] : 7;
        s.st = (st & 0xfe) === 0xa ? 2 : 1;
        s.c = own.ownerPos.slice(); s.f0 = H5FC0_STANDIN & 0xffff; s.chain = null;
      }
      if (a && a.scatter071 && own.ownerPos){
        s = state.sc071 = { st: 1, life: f(7200.0), c: own.ownerPos.slice(), f0: H73E8_STANDIN & 0xffff, f2: 0, wait: f(240.0),
                            chain: ['Motion[2]', 'Motion[11]', 'Motion[12]'], ci: 0 };
      }
    }
  }
  if (!s || !s.st) return;
  if (s.st === 1){
    const [w, fired] = cd071(s.wait, ctx.dt);
    s.wait = w;
    if (fired){
      const f0 = s.f0 >>> 0, f2 = s.f2 & 0xff;
      const ox = ((Math.imul(Math.imul(f0, f2), 37) >>> 0) % 3000) - 1500, oz = ((Math.imul((f2 * 13 + 39) >>> 0, f0) >>> 0) % 3000) - 1500;
      let p;
      if (own.rank >= 5 && (f2 & 3) === 0) p = [f(ox), f(1000.0), f(oz)];        // 0xfaf54c with no hunter (0xfaf5f8..)
      else p = [f(s.c[0] + f(ox)), f(s.c[1] + f(1000.0)), f(s.c[2] + f(oz))];
      const h = ground022(p, ctx.stage);
      if (h != null && own.ownerPos && f(own.ownerPos[1] - h) < f(1000.0) && D.shells.shell01.modes[1]){
        const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 1, position: [p[0], h, p[2]], angles: [0, 0, 0], action: [7, 0x53], frame: null },
                          own, state.prevJoints || ctx.J, ctx, null);
        if (S){ state.shells.push(S); out.spawned.push(S); }
      }
      s.f2 = (f2 + 1) & 0xff;
      s.wait = f(90.0);
    }
  }
  const [l, out2] = cd071(s.life, ctx.dt);
  s.life = l;
  if (out2) s.st = 0;
}
