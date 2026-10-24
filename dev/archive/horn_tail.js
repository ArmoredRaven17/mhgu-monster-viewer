
// BLOODBATH DIABLOS's HORN PIECE (CUT_TAIL.em007_04.horn): em 7's kind-2 option flies on 0x74910, not CutTail's
// 0x73cd8 (0x73a08: em +0xb5f4 == 7 and kind 2 -> 0x74910 via 0x73d78). Phase 2 samples em007_04_option Motion[2]'s
// root at the frame and the frame before (0x74be0 x2, the ROM evaluator 0xafb70c), adds the delta turned by the aim yaw
// +0x1454 and scaled by +0x14e0..+0x14e8, and over f in (10, 48] (literals 0x74bd8 48.0, 0x74bdc 38.0) eases the base
// height to G; f > 48 once -> 0x703b8(owner, kind 2, &G) = u 906; the motion's end (73 frames) -> position G.
// The tables are that code RUN (the tail_emu harness on the option's own ctor, reset, activation, both passes and
// 0x74910; dev/em007_04-undriven-spec.md 2.2, session table ng/head_table.json), per step k = 0..71, in the canonical
// frame J (0, 400, -300), G (0, -20, 0), facing +Z (qa = identity). Two runs with different J, owner, yaw and S agree
// with the closed form HornPiece007 uses:
//   pos.xz = J.xz + HEAD_F[k] (G.xz - J.xz)   -- the fraction depends on neither the distance nor S
//   pos.y  = yb + HEAD_H[k]                   -- the root height, UNSCALED; yb from J.y, for each c = k + 1 in 11..48:
//                                                yb += ((c - 10) / 38)^2 (G.y - yb)
//   quat   = qa x HEAD_Q[k]                   -- qa CutTail's yaw toward G
//   k = 48: u 906 at G; k >= 71: pos G, quat qa x HEAD_Q[71], held (H(70) = 115: the piece sits 115 above G until the
//   motion ends and is then placed at G -- the ROM's own snap).
// STAND-INS the harness names: a flat floor (the stage probe 0x180fd4 answered by the viewer's floor) and the model with
// no joints. The writer of +0x1454 / +0x14e0..e8 in the activation is not opened (the harness reads them as the J -> G
// yaw, |G - J| / 1484.6 and 1.0). One game frame per step, as CutTail. The viewer's em007_04_option.glb runs a frame
// late against the ROM evaluator, so the table, not the glb, is the source.
__TABLES__
const qh = k => HEAD_Q.slice(4 * k, 4 * k + 4);

export class HornPiece007 {
  // J, G: game units, as CutTail's; G.y is the floor - 20 (unscaled, 0x740d0 vmov s2,#-20 for kind 2 on em 7)
  constructor(J, G){
    this.J = J; this.G = G; this.k = 0; this.yb = J[1];
    const dx = G[0] - J[0], dz = G[2] - J[2], dist = Math.hypot(dx, dz);
    const d = dist >= 2 ** -23 ? [dx / dist, dz / dist] : [0, 0];
    const dot = d[1];
    if (dot >= -0.999){ const r = Math.sqrt(2 * (1 + dot)); this.qa = [0, d[0] / r, 0, r / 2]; }
    else this.qa = [0, 1, 0, -4.37114e-8];
  }
  // on to step k (never back); true when the landing step (48) is passed on the way
  advance(k){
    let landed = false;
    for (let n = this.k + 1; n <= k; n++){
      const c = n + 1;
      if (c >= 11 && c <= 48){ const t = (c - 10) / 38; this.yb += t * t * (this.G[1] - this.yb); }
      if (n === 48) landed = true;
    }
    if (k > this.k) this.k = k;
    return landed;
  }
  pose(){
    if (this.k >= 71) return { position: this.G.slice(), quaternion: qmul(this.qa, qh(71)) };
    const k = this.k, f = HEAD_F[k];
    return { position: [this.J[0] + f * (this.G[0] - this.J[0]), this.yb + HEAD_H[k], this.J[2] + f * (this.G[2] - this.J[2])],
             quaternion: qmul(this.qa, qh(k)) };
  }
}

// a CUT_TAIL piece's `flight` names its class; a piece without one flies on CutTail
export const FLIGHTS = { em007_04_horn: HornPiece007 };
