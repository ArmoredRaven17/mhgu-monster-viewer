import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b'## Monsters (`MHGU-Monster-Viewer`'
i = b.index(anchor)
eol = b.index(b'\n', i) + 1
note = ("- [ ] (bug, 2026-10-22) **A user reported \"Error creating WebGL Context.\"** Raven recalls hitting it with too many "
        "processes up. three r169 is WebGL2-only and throws that message when getContext fails (too many live contexts / GPU "
        "process overloaded, hardware acceleration off, blocklisted GPU). stage.js creates the renderer with no try/catch and "
        "no webglcontextlost handling, so the page just fails. Proposed: a plain on-page message with the likely causes "
        "(close other 3D tabs, turn on hardware acceleration) and context-lost recovery; shared base, so all viewers.\n").encode('utf-8')
b = b[:eol] + note + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
