p='air/emu_takeoff.py'; s=open(p).read()
s=s.replace("""            self.wf(E + 0x500, self.frame)
            self.log.append(('setMotion'""","""            self.wf(E + 0x500, self.frame); self.fresh = True
            self.log.append(('setMotion'""")
s=s.replace("""        self.wf(E + 0x500, self.frame)
        for o in""","""        self.wf(E + 0x500, self.frame)
        fresh = getattr(self, 'fresh', False); self.fresh = False
        self.wf(E + 0x13ac, self.frame if fresh else self.frame - 1.0); self.wf(E + 0x13b4, 0.0 if fresh else 1.0)
        for o in""")
open(p,'w').write(s)
