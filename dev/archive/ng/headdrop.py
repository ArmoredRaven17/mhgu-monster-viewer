"""Bloodbath's two option slots under the ROM's own uEnemyOption code (tail_emu harness, read-only):
kind 1 (tail, slot 0, joint byte 0x91) and kind 2 (head, slot 1, joint byte 3), em 7 variant 4,
em007_04_option.lmt. Prints per-frame position and the landing frame (0x703b8 kind -> id 5 / 6)."""
import sys, json
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\tail-scratch')
import tail_emu as TE
TE.LMT = r'C:\MHGU-Extract\scratch-em\em007_04\enemy\em_option\mot\em007_04_option.lmt'
KIND = int(sys.argv[1]); JB = int(sys.argv[2], 0); EM = int(sys.argv[3]) if len(sys.argv) > 3 else 7
class T(TE.TailEmu):
    def build(self):
        super().build()
        X, O = self.OPT, self.O
        self.p8(O + 0xb5f4, EM); self.p8(O + 0xb5f5, 4)
        self.p8(X + 0x1474, KIND)
        jidx = self.u32(O + 0x498)
        for g in range(0x100): self.p8(jidx + g, 0xff)
        self.p8(jidx + JB, 0)
    def sever(self):
        super().sever()
        self.p8(self.OPT + 0x1477, JB)
    def _owner_370(self):
        from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1
        mask = self.e.uc.reg_read(UC_ARM_REG_R1)
        bit = {1: 1, 2: 2, 3: 8}[KIND]
        self.e.uc.reg_write(UC_ARM_REG_R0, 1 if (self.severed and (mask & bit)) else 0)
TE.TailEmu = T
cfg = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {"owner_pos": [0.0, 0.0, 0.0], "joint142": [0.0, 400.0, 300.0]}
cfg.setdefault("size_a", 1.0); cfg.setdefault("size_b", 1.0); cfg.setdefault("owner_yaw_u16", 0); cfg.setdefault("floor_y", 0.0); cfg.setdefault("dt", 1.0)

t, out = TE.run(cfg, frames=90)
for k, s in out:
    if k < 0 or k % 6 == 0 or 40 <= k <= 50 or 70 <= k <= 76:
        print(k, 'ph', s['phase'], 'f %.1f' % s['frame'], 'end', s['ended'], 'vis', s['bit11'], 'motion', s['motion'],
              'pos (%.2f, %.2f, %.2f)' % tuple(s['pos']), 'q (%.4f %.4f %.4f %.4f)' % tuple(s['quat']), 'yb %.2f' % s['y1464'])
last = out[-1][1]
print('target', last['target'], 'speed', last['speed'], 'scale', last['scale'], 'end', last['end'])
for l in t.log:
    if l[0] not in ('owner_vcall',): print('LOG', l)
