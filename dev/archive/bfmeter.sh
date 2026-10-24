#!/bin/sh
# bfmeter.sh new|ctl : the draw meter over each burrower's moved clips (deepclips.txt), current floor rule or the control server
S=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $S
while read mon seq; do
  U=""; [ "$1" = ctl ] && U="--url http://127.0.0.1:5677"
  M1_MON=$mon M1_SEQ="$seq" M1_FRAMES=150 M1_KEYS='*' timeout 1500 node run-check-long.mjs meter1all.mjs $U > bfm_${1}_$mon.out 2>&1
done < deepclips.txt
