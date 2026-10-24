#!/bin/sh
# gmeter.sh <grounds...>: the floor-only records of Kecha / Barroth / Redhelm per ground
cd /c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
for g in "$@"; do
  M1_MON=em065_00 M1_SEQ="5|Motion[39];3|Motion[56];2|Motion[57];2|Motion[60]" M1_FRAMES=210 M1_KEYS='em065_00c|210|clip,em065_00c|220|clip,em065_00c|230|clip,em065_00c|240|clip' M1_GROUND=$g timeout 900 node run-check-long.mjs meter1all.mjs > gm_em065_$g.out 2>&1
  M1_MON=em044_00 M1_SEQ="4|Motion[3];4|Motion[6]" M1_FRAMES=180 M1_KEYS='em044_00c|130|clip,em044_00u|200|clip,em044_00u|210|clip' M1_GROUND=$g timeout 900 node run-check-long.mjs meter1all.mjs > gm_em044_$g.out 2>&1
  M1_MON=em060_04 M1_SEQ="0|Motion[22]" M1_FRAMES=260 M1_KEYS='em060_04u|120|clip' M1_GROUND=$g timeout 900 node run-check-long.mjs meter1all.mjs > gm_em060_$g.out 2>&1
done
