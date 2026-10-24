#!/bin/bash
# pass 2: every run with the viewer's own target (--viewer-inputs) and the beam state PINNED (the soak never steps the
# viewer's motion-state machine, so its own tired / rage read stale)
cd /c/MHGU-Extract/MHGU-Monster-Viewer
LOG="$1"; : > "$LOG"
run(){ echo "=== $*" >> "$LOG"; node dev/effect-live-soak.mjs "$@" --viewer-inputs >> "$LOG" 2>&1; echo "exit $?" >> "$LOG"; }
CALM='{"tired":false,"rage":false,"rank":5,"parts":{"headBroken":false,"skull":false}}'
TIRED='{"tired":true,"rage":false,"rank":5}'
RAGE='{"tired":false,"rage":true,"rank":5,"parts":{"headBroken":false}}'
LOW='{"tired":false,"rage":false,"rank":4}'
# Plesioth
run em010_00 "L2 Motion[10]" "L2 Motion[12]" "L2 Motion[11]" "L2 Motion[6]" "L2 Motion[14]" "L2 Motion[15]" "L2 Motion[13]" --beam-state "$CALM"
for v in 7:0x0f 7:0x10 7:0x15 7:0x16; do run em010_00 "L2 Motion[7]" --rock $v --beam-state "$CALM"; done
run em010_00 "L2 Motion[6]" "L2 Motion[10]" "L2 Motion[15]" "L2 Motion[13]" --beam-state "$LOW"
# Fatalis / Crimson
for v in 7:0x32 7:0x3e; do run em013_00 "L2 Motion[46]" --rock $v --beam-state "$CALM"; done
for v in 7:0x33 7:0x3f; do run em013_00 "L2 Motion[47]" --rock $v --beam-state "$CALM"; done
for v in 7:0x32 7:0x3e; do run em013_01 "L2 Motion[46]" --rock $v --beam-state "$CALM"; done
# Daimyo / Stonefist
run em019_00 "L2 Motion[18]" "L2 Motion[54]" --beam-state "$CALM"
run em019_00 "L2 Motion[18]" "L2 Motion[54]" --beam-state "$LOW"
run em019_00 "L2 Motion[57]" "L2 Motion[55]" --beam-state "$TIRED"
run em019_00 "L2 Motion[18]" "L2 Motion[54]" --beam-state "$TIRED"
run em019_04 "L2 Motion[18]" "L2 Motion[54]" --beam-state "$CALM"
run em019_04 "L2 Motion[57]" "L2 Motion[55]" --beam-state "$TIRED"
# Shogun / Rustrazor
run em020_00 "L2 Motion[27]" --beam-state '{"tired":false,"rage":false,"rank":5,"parts":{"skull":true}}'
run em020_00 "L2 Motion[27]" --beam-state "$CALM"
run em020_04 "L9 Motion[31]" "L9 Motion[33]" "L2 Motion[74]" --beam-state "$CALM"
for v in 7:0xdf 7:0xe2; do run em020_04 "L9 Motion[20]" --rock $v --beam-state "$CALM"; done
# Rajang / Furious
for v in 7:0x06 7:0x0a; do run em023_00 "L2 Motion[8]" --rock $v --beam-state "$CALM"; done
run em023_00 "L2 Motion[20]" "L2 Motion[21]" --beam-state "$CALM"
run em023_00 "L2 Motion[20]" --beam-state "$TIRED"
for v in 7:0x06 7:0x0a; do run em023_05 "L2 Motion[8]" --rock $v --beam-state "$CALM"; done
run em023_05 "L2 Motion[20]" "L2 Motion[21]" --beam-state "$CALM"
# Kushala
run em024_00 "L2 Motion[8]" "L2 Motion[27]" --beam-state "$CALM"
for v in "7:0x15" "7:0x15 stage"; do run em024_00 "L2 Motion[8]" --rock "$v" --beam-state "$RAGE"; done
for v in "7:0x1a" "7:0x1a stage"; do run em024_00 "L2 Motion[27]" --rock "$v" --beam-state "$RAGE"; done
# Akantor
run em033_00 "L2 Motion[5]" "L2 Motion[14]" "L2 Motion[31]" --beam-state "$CALM"
run em033_00 "L2 Motion[14]" --beam-state "$LOW"
# Ukanlos (pass 1 of the morning had no target)
for v in 7:0x09 7:0x08 7:0x0a; do run em038_00 "L2 Motion[5]" --rock $v --beam-state "$CALM"; done
run em038_00 "L2 Motion[41]" --beam-state "$CALM"
for v in 7:0x0c 7:0x0d; do run em038_00 "L2 Motion[34]" --rock $v --beam-state "$CALM"; done
# Agnaktor
for v in 7:0x1f 7:0x04; do run em049_00 "L2 Motion[4]" --rock $v --beam-state "$CALM"; done
run em049_00 "L2 Motion[28]" "L2 Motion[27]" "L2 Motion[11]" "L2 Motion[30]" --beam-state "$CALM"
run em049_00 "L2 Motion[4]" "L2 Motion[30]" "L2 Motion[11]" --beam-state "$TIRED"
# Alatreon, Nibelsnarf, Amatsu, Zamtrios
run em050_00 "L2 Motion[11]" --beam-state "$CALM"
run em056_00 "L2 Motion[17]" "L2 Motion[35]" --beam-state "$CALM"
run em058_00 "L2 Motion[18]" --beam-state "$CALM"
run em067_00 "L4 Motion[59]" "L4 Motion[60]" "L4 Motion[57]" "L4 Motion[58]" --beam-state "$CALM"
# Boltreaver, Mizutsune, Soulseer
run em081_04 "L9 Motion[1]" "L9 Motion[2]" "L9 Motion[21]" "L9 Motion[22]" --beam-state "$CALM"
run em082_00 "L2 Motion[75]" "L2 Motion[81]" --beam-state "$CALM"
run em082_04 "L2 Motion[75]" "L2 Motion[81]" --beam-state "$CALM"
# Gravios: the class path (M27) and the base02g rows (M24, L4 M59)
for v in 7:0x0e 7:0x32 7:0x0d; do run em005_00 "L2 Motion[27]" --rock $v --beam-state "$CALM"; done
run em005_00 "L2 Motion[27]" --rock 7:0x0e --beam-state '{"tired":false,"rage":false,"rank":5,"parts":{"headBroken":true}}'
run em005_00 "L2 Motion[24]" "L4 Motion[59]" --beam-state "$CALM"
run em005_00 "L2 Motion[24]" --beam-state "$RAGE"
run em005_00 "L2 Motion[24]" "L4 Motion[59]" --beam-state '{"tired":false,"rage":false,"rank":5,"parts":{"headBroken":true}}'
run em005_00 "L2 Motion[24]" --beam-state '{"tired":false,"rage":true,"rank":5,"parts":{"headBroken":true}}'
# Nakarkos: the body's own beam and the both-arms beam on body L2 M86
run em084_00 "L0 Motion[63]" --beam-state "$CALM"
for v in 7:0x44 7:0x4a; do run em084_00 "L2 Motion[86]" --rock $v --beam-state "$CALM"; done
run em084_00 "L2 Motion[86]" --rock 7:0x44 --beam-state "$LOW"
echo "ALL DONE" >> "$LOG"
