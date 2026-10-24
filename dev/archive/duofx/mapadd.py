p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8').read()
a1 = '| VIEWER (implemented) | ROM_PARTNER_BODY.em069_00 `classes` (re-read solos)'
rows1 = [
 "| rage / tired across the duo (`0x81670` enraged = `P+0x518` == 1, `0x81688`, `0x81614` / `0x81634` tired) | **his class never tests rage or tiredness at all**: no `bl` to any of the four and no `#0x518` / `#0x505` operand in his band `0xfc40ec..0xfd963c`; hers calls `0x81670` at `0xf8a214` / `0xf966a0` and `0x81614` at `0xf8a434` / `0xf8e558`, each with r0 = HERSELF (`mov r8, r0` / r4). So neither reads or writes the other's rage: his is the shared anger system's (hits, NR here), not hers | uEm076_00 / uEm069_00 | R (static, linear sweep with skipdata; control `0xca170` finds `0xca190` / `0xca19c`) | `<scratchpad>\\duofx\\ragescan.py`; index.html drivePartnerEffects comment |",
 "| VIEWER (implemented, effects agent 2026-10-17) | HIS OWN EFFECT RUNTIME while mounted: render/rom/effect-mounts.js `attachPartnerEffects` / `detachPartnerEffects` / `partnerEffectRuntime` (a second LiveEffects on his model, `unitSource` = his attach frame, live.js `unitMatrix`), index.html `drivePartnerEffects` / `partnerFxClip` (his clip + frame from `partnerLocalAt`, key `em076_00|4|Motion[N]`, his word `pslMask(em076_00)` = base `0xca170` calm 0x1ff, a new layout piece / pick = a new motion start); live.js: `depthPasses` (a runtime's driver does nothing inside another's sceneDepth) and an unhook that never cuts another runtime's onAfterRender out. effectRuntimeInstance() stays the body's. Check em069_00 duo block: his L4 M31 fires u 362 at f66 as solo Seltas's (records, frames, walker key / word / frame equal), his free M32 the same records as solo, held M79 f6 passes nothing, released M46 followed, switch / drop / monster change dispose it | viewer | R (transcribed) | spec §9.4 |",
]
i = s.index(a1); j = s.index('\n', i) + 1
s = s[:j] + '\n'.join(rows1) + '\n' + s[j:]
a2 = '| `<scratchpad>\\duo\\j200.py` |'
row2 = "| `<scratchpad>\\duofx\\ragescan.py` (effects agent, 2026-10-17) | in a code band: every `bl` to the shared rage / tired tests (`0x81670`, `0x81688`, `0x81614`, `0x81634`) with r0's last write, and every `#0x518` / `#0x505` memory operand | `0xca170` (the base PSL word) shows its `0x81670` / `0x81614` calls on r4 | linear (capstone skipdata), so a call reached only through a register or a table is not seen; the r0 backwalk is 12 instructions and misses a `mov rX, r0` alias (read the site) |"
i = s.index(a2); j = s.index('\n', i) + 1
s = s[:j] + row2 + '\n' + s[j:]
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
