p='air/emu_takeoff.py'; s=open(p).read()
s=s.replace("""    def call(self, fn, r0=E):
        mu = self.mu
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, r0)""","""    def call(self, fn, r0=E, args=()):
        mu = self.mu
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, r0)
        for reg, v in zip((UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args): mu.reg_write(reg, v)""")
s=s.replace("""        self.call(self.handler)          # the action (the class's +0x24 pass)
        self.call(0xbf284)""","""        for o in (0x1380, 0x1384, 0x1388, 0x138c): self.w(E + o, 0)     # 0xa50dc's reset (the zero vector)
        self.call(self.handler, args=ARGS)          # the action (the class's +0x24 pass)
        self.call(0xa5db8)               # posture 3 / P+0x5c -> the drawn offset e+0x1384 (0xae0d8)
        self.call(0xbf284)""")
s=s.replace("DEFLEN = [10 ** 9]","DEFLEN = [10 ** 9]\nARGS = []\nINIT = {}")
s=s.replace("        if a.startswith('deflen='):","        if a.startswith('args='): ARGS.extend(int(x, 0) for x in a[5:].split(',')); continue\n        if a.startswith('y0='): INIT['y0'] = float(a[3:]); continue\n        if a.startswith('post='): INIT['posture'] = int(a[5:]); continue\n        if a.startswith('deflen='):")
s=s.replace("    R = Run(h, ph, fo, sz, lens=lens)","    R = Run(h, ph, fo, sz, lens=lens, **INIT)\n    R.wf(DTB + 0x64, 1.0)")
s=s.replace("""  vy %7.2f' % (""","""  vy %7.2f  e1384 %8.2f  P5c %8.2f  drawn %8.2f' % (""")
s=s.replace("""y - R.rf(P + 0x5b4), R.rf(P + 0x14)))""","""y - R.rf(P + 0x5b4), R.rf(P + 0x14), R.rf(E + 0x1384), R.rf(P + 0x5c), y + R.rf(E + 0x1384) - R.rf(P + 0x5b4)))""")
open(p,'w').write(s)
