# spec_ctl.py: the control-block re-check's findings, appended to each spec (2026-10-19)
import io
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
HEAD = "## Control block re-check (2026-10-19, trap 117's follow-up; rom-map \"the control block [e+0xcac0] SET NON-ZERO\")"
NOTES = {
 'em021_00-effects-spec.md': [
  "* **The word: stands.** It moves only with ctl+0 / +1, and both are already inputs of the transcription.",
  "* **A class request the viewer does not drive: u 500** (vt+0x1d0 id 1001; cm103_100, joint 2).",
  "  * Read: `0xdd0568`, the eating handler, at phase 0 on L0 M43. When `(ctl+1 - 2) & 0xff >= 3` it calls 0x9a6fc(e, max HP x 0.02),",
  "    then requests id 1001.",
  "  * In the game: the type-1 eating actions (1, 0x35 / 0x40) and gas 0 get it; types 2..4 do not.",
  "  * states-em021_00.md 3.5 named it 'to be wired by hand'. It was never exported. Build item.",
 ],
 'em071-em072-effects-spec.md': [
  "* **Class requests the viewer does not drive** (all three monsters):",
  "  * `0xfaf318(e, k)`: id 1002 (key 30), placed at control-block slot k's point (C + 0x40k + 0x10..; handle at +0x38).",
  "  * `0xfc05ec`: id 1001 (key 31), at ray points, from many action functions.",
  "  * Both are gated by the slot bytes C+0x40 / +0x80 / +0x81, whose writers are NOT READ.",
  "  * Keys 30 / 31 are in the json only as clip bits and shell records.",
 ],
 'em027_00-effects-spec.md': [
  "* **A frame-handler request pair the viewer does not drive.** vt+0x208 `0xe11204..0xe112dc` runs an edge latch on ctl+0x26:",
  "  * on: id 1004; off: id 1005; both on root joint 3.",
  "  * ctl+0x26's writer is NOT READ.",
 ],
 'em023-effects-spec.md': [
  "* **A frame-handler request the viewer does not drive** (Rajang and Furious). vt+0x208 `0xde2760..0xde27c4`:",
  "  * C+0x16 bit 1 is set while C+4 != 0 and the motion is not L2 M24;",
  "  * then c id 1002 (vt+0x1cc) is requested once.",
  "  * C+4's writer is NOT READ.",
 ],
 'em070_00-effects-spec.md': [
  "* **Frame-handler requests the viewer does not drive.** vt+0x208 `0xf9c2a0..0xf9c3bc` uses a table on C+0xb5 to pick ids",
  "  1001 / 1003 / 1004 / 1005. C+0xb5's writer is NOT READ.",
 ],
}
for f, ls in NOTES.items():
    p = D + '\\' + f
    t = io.open(p, encoding='utf8', newline='').read()
    nl = '\r\n' if '\r\n' in t else '\n'
    t = t.rstrip() + nl + nl + HEAD + nl + nl + nl.join(ls) + nl
    io.open(p, 'w', encoding='utf8', newline='').write(t)
    print('ok', f)
