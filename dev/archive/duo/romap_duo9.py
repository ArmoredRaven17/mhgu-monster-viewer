p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
old = "| `0x7db70` (arm a hit record), linked attacker | with the attacker linked (`0xc210c`), the record's byte +0xa gains the partner's `+0xfec` + `P+0x54` (bits 8..15): his attacks on her back take her facing. Whether a record can hit the PARTNER (her 0x2b on him) is the collision side's -- NOT READ | shared | R (the arm) / NR (the target filter) | spec §18 |"
assert s.count(old) == 1
new = nl.join([
"| `0x7db70` (arm a hit record), linked attacker | with the attacker linked (`0xc210c`), the record's byte +0xa gains the partner's `+0xfec` + `P+0x54` (bits 8..15): his attacks on her back take her facing. The hit object (`0x16877c`, at `P+0x998 + k x 0xb8`): owner `+0xc`, owner kind `+0x10` (1 = enemy), owner's area `+7`, and the TARGET MASK `+8` = 0x17 by default (0x10 with flag 0x40, 2 with 0x100, 5 with 0x200, 8 with 0x4000; or'd 0x20 / 8 / 0x20 from flags 0x80 / 0x1000 / record +0xc bit 0x100000) (`0x7dd44..0x7ddb0`) | shared | R | spec §19 |",
"| `0x16acf0` (the hit manager's pair pass; attackers `mgr+0x2020`, registered `0x16b450`) | per attack object: (1) the 4 hunters (`0x276290`) when mask bit 0; (2) the 10 ENEMIES (`0x5cdf8`, slots `+0x1c + 4 i`) when mask bit 1, if the target's `e+0xb5f9` != 0, `e+0x7652` == 1, `P+0x1a0` != 0, `0x81958` (its `P+0x5ac` == 0, posture / kind rules for kinds 8 / 9 / 0x45, vt+0x344), no hit history (`0x16b5e0`), the same area, not its own owner (`0x168ee4`), NOT EXCLUDED BY `0x168f20`, the shapes meet (`0x16940c`) -> `0x16bc54`; (3) 4 more (`0x258b44`, mask bit 2); (4) attack vs attack (`0x16b2d4..`) | shared | R | spec §19 |",
"| `0x168f20` (the partner exclusion) | the attack's owner (`+0xc`, or `+0x70` for kind `+0x6e` 1) and the target: EXCLUDED when the owner is linked and its link target `P+0x5c30` is the target (`0x168f6c..0x168f90`), or when the TARGET is linked and its link target is the owner (`0x168f94..0x168fc8`) -- so her records cannot hit the male while he is linked to her, nor his her; then em `0x63` / `0x54` pair rules on `e+0xb5f4` / `+0xb5f7`; flags `+0x30` & 0xc0 skip it all. Control: the hunter pass (1) has no such call, so her 0x2b (mask 0x17, bit 0) hits hunters | shared | R | spec §19 |",
])
s = s.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
old = "## 10. Not read" + nl
new = """## 19. Can her attacks hit the male? (the hit system, 2026-10-17)

* **Read to the instruction** (rom-map `0x7db70`, `0x16acf0`, `0x168f20`): every enemy attack is a hit object with an owner,
  the owner's area and a target mask (0x17 by default: bits 0, 1, 2, 4). The hit manager's pair pass (`0x16acf0`) tests it
  against the hunters (bit 0), the ENEMIES (bit 1), a third set (bit 2) and other attacks. On the enemy pass, besides area,
  history and the target's own flags (`e+0xb5f9`, `e+0x7652`, `P+0x1a0`, `0x81958`), it calls `0x168f20`, which EXCLUDES a
  target that is linked to the attack's owner (`0x168f94..0x168fc8`: the target linked and its link target `P+0x5c30` is
  the owner), and an owner linked to the target.
* **So her attacks cannot hit him while he is linked to her** -- through the whole tail grab (his 1:0x20 struggle and his
  1:0x21 freeze keep the link) her 0x2b in M78 passes over him. Positive control: the hunter pass has no such call, so the
  same record (mask 0x17) hits a hunter. Unlinked (after his drop, or after he leaves), the exclusion no longer holds and her
  attacks can reach him if his own flags allow (`e+0xb5f9` etc., per instance -- not read for him).
* **The answer to "left on the ground for the Queen to consume"**: the ROM's smash does not hurt him. Her eat (g1 s46,
  selector 4) runs right after the grab chain and needs him dead; he is frozen and linked then, alive, for 1200 frames. He
  dies there only from a HUNTER's damage (the hunter pass has no partner exclusion) -- a fight the viewer has no hunter for.
  So the smash -> death -> eat chain is not built; the ROM differs from Raven's account on the smash killing him.

## 10. Not read
"""
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(s)

P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
old = "      - [ ] (read) the shared hit system: can a monster's attack record hit its partner (her 0x2b on the male)?\n"
assert b.count(old) == 1
b = b.replace(old, "      - **HIT SYSTEM 2026-10-17** READ: the pair pass 0x16acf0 tests enemy attacks against enemies too, but 0x168f20 excludes\n        a target linked to the attack's owner -- her records cannot hit the male while he is linked (the whole tail grab).\n        Her eat needs him dead right after the grab; only a hunter can kill him there. Smash -> death -> eat NOT built (the\n        ROM differs from Raven). Spec §19.\n")
open(P, 'wb').write(b.encode('utf-8', 'surrogateescape'))
print('ok')
