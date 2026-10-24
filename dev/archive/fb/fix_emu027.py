p = 'emu_fb.py'
s = open(p, encoding='utf8').read()
a = "'cSetupParamEm012_13': 0x1638}"
assert s.count(a) == 1
s = s.replace(a, "'cSetupParamEm012_13': 0x1638, 'cSetupParamEmBase20': 0x15f0, 'cSetupParamEmBase21': 0x1618}")
a = "        # a case's POKES: owner bytes written before frame k's move"
assert s.count(a) == 1
s = s.replace(a, """        # a case's `actionAt` {at, before, action} (2026-10-18): the owner's action e+0x73e0 / +0x73e1 before each move of a depth-0 shell
        # -- `action` from the step whose frame (the creating step's frame + k - 1) reaches `at`, `before` until then (Teostra's leading
        # powder waits for (7, 0x2d) / (7, 0x2e): the play's next action)
        aa = ANS.get('actionAt')
        if aa and DEPTH[0] == 0 and ANS.get('curFrame') is not None:
            uc.mem_write(OWNER + 0x73e0, bytes(aa['action'] if ANS['curFrame'] + k - 1 >= aa['at'] else aa['before']))
""" + a)
a = "    for sh in shells:\n        sh['run'] = fly_tree("
assert s.count(a) == 1
s = s.replace(a, "    ANS['actionAt'] = c.get('actionAt')\n    for sh in shells:\n        ANS['curFrame'] = sh['frame']\n        sh['run'] = fly_tree(")
open(p, 'w', encoding='utf8').write(s)
print('ok')
