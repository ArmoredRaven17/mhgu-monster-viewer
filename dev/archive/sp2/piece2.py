"""Second pieces (uEnemyOption slot 1, kind 2) of Barroth / Crystalbeard under the ROM's own option code (tail_emu
harness, read-only), compared step by step with CutTail's closed form (tail-option.js tables).
usage: python piece2.py <lmt> <em hex> <variant> <kind> <jointbyte> <rows json: [[h, speed], ...]> [S]"""
import sys, json, re, math, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\tail-scratch')
import tail_emu as TE
LMT, EM, VAR, KIND, JB = sys.argv[1], int(sys.argv[2], 16), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5], 0)
ROWS = json.loads(sys.argv[6]); S = float(sys.argv[7]) if len(sys.argv) > 7 else 1.0
TE.LMT = LMT
class T(TE.TailEmu):
    def build(self):
        super().build()
        X, O = self.OPT, self.O
        self.p8(O + 0xb5f4, EM); self.p8(O + 0xb5f5, VAR)
        self.p8(X + 0x1474, KIND)
        jidx = self.u32(O + 0x498)
        for g in range(0x100): self.p8(jidx + g, 0xff)
        self.p8(jidx + JB, 0)
        dtp = self.u32(O + 0x75f0)
        self.p8(dtp + 0x91, len(ROWS))
        if ROWS:
            rb = self.malloc(0x20 * len(ROWS))
            for i, (h, sp) in enumerate(ROWS):
                for k in range(8): self.p32(rb + 0x20 * i + 4 * k, 0)
                self.pf(rb + 0x20 * i + 0x10, sp); self.pf(rb + 0x20 * i + 0x14, h)
            self.p32(dtp + 0x78, rb)
    def sever(self):
        super().sever()
        self.p8(self.OPT + 0x1477, JB)
    def _owner_370(self):
        from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1
        mask = self.e.uc.reg_read(UC_ARM_REG_R1)
        bit = {1: 1, 2: 2, 3: 8}[KIND]
        self.e.uc.reg_write(UC_ARM_REG_R0, 1 if (self.severed and (mask & bit)) else 0)
TE.TailEmu = T
J = [float(v) for v in (sys.argv[8].split(",") if len(sys.argv) > 8 else ("100", "400", "-300"))]
cfg = {"owner_pos": [0.0, 0.0, 0.0], "joint142": J, "size_a": S, "size_b": S, "owner_yaw_u16": 0, "floor_y": 0.0, "dt": 1.0}
t, out = TE.run(cfg, frames=80)
# CutTail closed form
src = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\tail-option.js').read()
def arr(name):
    m = re.search(r'const %s = \[(.*?)\];' % name, src, re.S)
    return [float(x) for x in re.findall(r'-?[\d.]+(?:e-?\d+)?', m.group(1))]
TY, TZ, Q = arr('T_Y'), arr('T_Z'), arr('Q')
landing = [l for l in t.log if l[0] == 'landing 0x703b8']
G = out[-1][1]['target']
print('motion', out[-1][1]['motion'], 'speed', out[-1][1]['speed'], 'G', [round(v, 3) for v in G], 'landing', landing)
dx, dz = G[0] - J[0], G[2] - J[2]; dist = math.hypot(dx, dz); s = dist / TZ[54]; d = (dx / dist, dz / dist)
r = math.sqrt(2 * (1 + d[1])); qa = (0, d[0] / r, 0, r / 2)
def qmul(a, b):
    return (a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1], a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
            a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3], a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2])
yb = J[1]; worst = (0, None); worstq = (0, None)
for k, st in out:
    if k < 0: continue
    if k >= 1:
        c = k + 1
        if 11 <= c <= 42: tt = (c - 10) / 32; yb += tt * tt * (G[1] - yb)
    if k >= 53: p = G; qq = qmul(qa, Q[4*54:4*54+4])
    else:
        p = (J[0] + s * TZ[k] * d[0], s * TY[k] + yb, J[2] + s * TZ[k] * d[1]); qq = qmul(qa, Q[4*k:4*k+4])
    e = max(abs(a - b) for a, b in zip(p, st['pos']))
    sg = 1 if sum(a*b for a, b in zip(qq, st['quat'])) >= 0 else -1
    eq = max(abs(sg*a - b) for a, b in zip(qq, st['quat']))
    if e > worst[0]: worst = (e, k)
    if eq > worstq[0]: worstq = (eq, k)
    if k % 6 == 0 or k in (41, 42, 43, 52, 53, 54):
        print(k, 'ph', st['phase'], 'f %.1f' % st['frame'], 'end', st['ended'], 'rom (%.2f, %.2f, %.2f)' % tuple(st['pos']),
              'cut (%.2f, %.2f, %.2f)' % tuple(p), 'q (%.4f %.4f %.4f %.4f)' % tuple(st['quat']))
print('max |pos - CutTail| %.4f at k %s ; max |quat - CutTail| %.5f at k %s' % (worst + worstq))
