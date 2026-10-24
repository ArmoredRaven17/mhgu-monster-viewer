p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\emu_fb.py'
s = open(p, encoding='utf8').read()
old = """        E.call(move, (SHELL,)); assert E.fault is None, (k, E.fault)
        # a case's CONVERT: the monster's own call on a held, landed shell (Rustrum's sp_24: 0xf34a20(shell, mode) -> sp_19,
        # 0xf34b4c(shell) -> sp_13), made `after` moves after its +0x1631 (landed) is set
        cv = ANS.get('convert')
        if cv and DEPTH[0] == 0 and int(cv['id'], 0) == sid and r8(SHELL + 0x1631) == 1 and r8(SHELL + 4) == 1:
            CONV[0] += 1
            if CONV[0] == cv.get('after', 1):
                E.call(int(cv['fn'], 16), tuple([SHELL] + cv.get('args', []))); assert E.fault is None, ('convert', E.fault)
"""
new = """        # a case's CONVERT: the monster's own call on a held, landed shell (Rustrum's sp_24: 0xf34a20(shell, mode) -> sp_19,
        # 0xf34b4c(shell) -> sp_13) -- the enemy's line 4, so BEFORE frame k's move: made on the `after`-th frame that starts with
        # the shell landed (+0x1631) and in state 1
        cv = ANS.get('convert')
        if cv and DEPTH[0] == 0 and int(cv['id'], 0) == sid and r8(SHELL + 0x1631) == 1 and r8(SHELL + 4) == 1:
            CONV[0] += 1
            if CONV[0] == cv.get('after', 1):
                E.call(int(cv['fn'], 16), tuple([SHELL] + cv.get('args', []))); assert E.fault is None, ('convert', E.fault)
        E.call(move, (SHELL,)); assert E.fault is None, (k, E.fault)
"""
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w', encoding='utf8').write(s)
print('ok')
