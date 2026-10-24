"""base60 / base61 sub-states 2 / 3 under unicorn: sh88/emu60.py's Run (ctor, init, move native with the base60/61 band
0x435b40..0x43a78c and the engine's pure math; every other call a logged stub), plus the anchor calls the action start makes:
  cls 60: at frame `reaimAt` (before that frame's move) 0x4380e4(S, P + 0x1d0) -- (7, 0x2c / 0x2f / 0x31 / 0x36)'s vt+0x204
          0x10b4d38 (the d420 anchors' re-aim, the target block +0x1d0);
  cls 61: at frame `orbitAt` 0x43a374(S) -- (7, 0x34)'s 0x10b57f0 (the d450 anchors' orbit-on).
The sound call 0x4a1430 is logged as ('sound', r1). Snapshots add the clock / timer fields.
python emu60x.py cases.json out.json"""
import sys, os, json, struct
sys.path.insert(0, r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/sh88')
import emu60 as E60
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_LR, UC_ARM_REG_PC

S, P = E60.S, E60.P


class RunX(E60.Run):
    def _hook(self, uc, addr, size, ud):
        if addr == 0x4a1430:
            self.log.append(('sound', uc.reg_read(UC_ARM_REG_R1)))
            uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
        return E60.Run._hook(self, uc, addr, size, ud)

    def snap(self):
        d = E60.Run.snap(self)
        if self.c['cls'] == 60:
            d['timer'] = self.f(S + 0x1664); d['vib'] = self.f(S + 0x1690); d['ang'] = self.f(S + 0x1694)
            d['T'] = [self.f(S + 0x16a0 + 4 * i) for i in range(3)]
            d['b7'] = self.mu.mem_read(S + 7, 1)[0]
        else:
            d['clock'] = self.f(S + 0x1680); d['theta'] = self.f(S + 0x16a8); d['wd'] = self.f(S + 0x16ac); d['wo'] = self.f(S + 0x16d0)
            d['rx'] = self.f(S + 0x16a0); d['rz'] = self.f(S + 0x16a4); d['yoff'] = self.f(S + 0x16f4)
        return d

    def run(self):
        self.call(self.cfg['init'], S, E60.SET)
        out = [dict(self.snap(), frame=-1)]
        for fr in range(self.c.get('frames', 400)):
            self.log = []
            if fr == self.c.get('releaseAt', -1): self.mu.mem_write(S + self.cfg['rel'], b'\x01')
            if fr == self.c.get('reaimAt', -1): self.call(0x4380e4, S, P + 0x1d0)
            if fr == self.c.get('orbitAt', -1): self.call(0x43a374, S)
            if self.mu.mem_read(S + 4, 1)[0] == 0xff: break
            self.call(self.cfg['move'], S)
            out.append(dict(self.snap(), frame=fr))
            if out[-1]['state'] == 0xfe: break
        return out


if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    json.dump({c['name']: RunX(c).run() for c in cases}, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
