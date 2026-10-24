p='air/emu_takeoff.py'; s=open(p).read()
s=s.replace("""        if addr == 0xb09c8:""","""        if addr in (0xb0968, 0xb09a4, 0xb09b0, 0xb0974, 0xb098c) and FRAMETEST[0]:
            F = self.sf(UC_ARM_REG_S0); mode = {0xb0974: 0, 0xb098c: 1, 0xb09b0: 0}.get(addr, mu.reg_read(UC_ARM_REG_R1))
            cur = self.frame; prev = cur - 1.0 if not getattr(self, 'fresh_now', False) else cur
            ok = (cur >= F) if mode == 1 else (prev < F <= cur or (prev == cur == F))
            return self.ret(1 if ok else 0)
        if addr == 0xb09c8:""")
s=s.replace("ARGS = []","ARGS = []\nFRAMETEST = [False]")
s=s.replace("        fresh = getattr(self, 'fresh', False); self.fresh = False","        fresh = getattr(self, 'fresh', False); self.fresh = False; self.fresh_now = fresh")
s=s.replace("        if a.startswith('args='):","        if a == 'ftest': FRAMETEST[0] = True; continue\n        if a.startswith('args='):")
open(p,'w').write(s)
