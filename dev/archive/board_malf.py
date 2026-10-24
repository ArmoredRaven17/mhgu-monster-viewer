import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "- [ ] **Ahtal-Ka (em088_00) individual pass, 2026-10-15**"
assert t.count(a) == 1
t = t.replace(a, """- [ ] **Malfestio / Nightcloak SHELLS, 2026-10-15** (Raven: "Review Malfestio, I notice some attacks lack some of their
      effects" -- every exported record was driven; his whole shell layer was missing). DONE (dev/em079-shells-spec.md):
      shell31 beam (base31; L2 M17 f20 / M18 f52 sweep), shell01 enraged shockwaves + landing dust (base01, new params079s01;
      enraged forms only while Enraged -- pickVariantsFor op1c), shell40 whirlwind (cSetupParamEmBase40 -- BASE40 IS NEW,
      implemented in shells.js: ctor / init / move / push / end; L2 M23; pushed along his facing), Nightcloak's shell00 blades
      (base00, new params079s00; L1 M27 f8, L9 M4 f74). Records exported (em079_00 7, em079_04 11). Recording queued for u 10
      (refused at 0xa942c8 on L2 M23). Not modelled: Nightcloak's cloak (dust gate assumes uncloaked).
""" + a)
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
