#!/bin/bash
# the beams on their own monsters: one soak per (monster, pick, state), sequential (one headless Edge at a time)
cd /c/MHGU-Extract/MHGU-Monster-Viewer
LOG="$1"; : > "$LOG"
run(){ echo "=== $*" >> "$LOG"; node dev/effect-live-soak.mjs "$@" >> "$LOG" 2>&1; echo "exit $?" >> "$LOG"; }
BS_TIRED='{"tired":true}'; BS_RAGE='{"rage":true}'; BS_LOW='{"rank":4}'
# Plesioth (G rank: the viewer's rank 5)
run em010_00 "L2 Motion[10]" "L2 Motion[12]" "L2 Motion[11]" "L2 Motion[6]" "L2 Motion[14]" "L2 Motion[15]" "L2 Motion[13]"
for v in 7:0x0f 7:0x10 7:0x15 7:0x16; do run em010_00 "L2 Motion[7]" --rock $v; done
run em010_00 "L2 Motion[6]" "L2 Motion[10]" "L2 Motion[15]" --beam-state "$BS_LOW"
# Fatalis / Crimson
for v in 7:0x32 7:0x3e; do run em013_00 "L2 Motion[46]" --rock $v; done
for v in 7:0x33 7:0x3f; do run em013_00 "L2 Motion[47]" --rock $v; done
for v in 7:0x32 7:0x3e; do run em013_01 "L2 Motion[46]" --rock $v; done
# Daimyo / Stonefist
run em019_00 "L2 Motion[18]" "L2 Motion[54]"
run em019_00 "L2 Motion[57]" "L2 Motion[55]" --beam-state "$BS_TIRED"
run em019_04 "L2 Motion[18]" "L2 Motion[54]"
run em019_04 "L2 Motion[57]" --beam-state "$BS_TIRED"
# Shogun / Rustrazor
run em020_00 "L2 Motion[27]" --beam-state '{"parts":{"skull":true}}'
run em020_04 "L9 Motion[31]" "L9 Motion[33]" "L2 Motion[74]"
for v in 7:0xdf 7:0xe2; do run em020_04 "L9 Motion[20]" --rock $v; done
# Rajang / Furious
for v in 7:0x06 7:0x0a; do run em023_00 "L2 Motion[8]" --rock $v; done
run em023_00 "L2 Motion[20]" "L2 Motion[21]"
run em023_05 "L2 Motion[8]" --rock 7:0x06
# Kushala
run em024_00 "L2 Motion[8]" "L2 Motion[27]"
run em024_00 "L2 Motion[8]" "L2 Motion[27]" --beam-state "$BS_RAGE" --rock "7:0x15 stage"
# Akantor
run em033_00 "L2 Motion[5]" "L2 Motion[14]" "L2 Motion[31]"
# Agnaktor
for v in 7:0x1f 7:0x04; do run em049_00 "L2 Motion[4]" --rock $v; done
run em049_00 "L2 Motion[28]" "L2 Motion[27]" "L2 Motion[11]" "L2 Motion[30]"
# Alatreon, Nibelsnarf, Amatsu, Zamtrios
run em050_00 "L2 Motion[11]"
run em056_00 "L2 Motion[17]" "L2 Motion[35]"
run em058_00 "L2 Motion[18]"
run em067_00 "L4 Motion[59]" "L4 Motion[60]" "L4 Motion[57]" "L4 Motion[58]"
# Boltreaver, Mizutsune, Soulseer
run em081_04 "L9 Motion[1]" "L9 Motion[2]" "L9 Motion[21]" "L9 Motion[22]"
run em082_00 "L2 Motion[75]" "L2 Motion[81]"
run em082_04 "L2 Motion[75]" "L2 Motion[81]"
# Gravios: the class path (M27) and the base02g rows (M24, L4 M59)
for v in 7:0x0e 7:0x32; do run em005_00 "L2 Motion[27]" --rock $v; done
run em005_00 "L2 Motion[27]" --rock 7:0x0e --beam-state '{"parts":{"headBroken":true}}'
run em005_00 "L2 Motion[24]" "L4 Motion[59]"
run em005_00 "L2 Motion[24]" --beam-state "$BS_RAGE"
run em005_00 "L2 Motion[24]" "L4 Motion[59]" --beam-state '{"parts":{"headBroken":true}}'
echo "ALL DONE" >> "$LOG"
