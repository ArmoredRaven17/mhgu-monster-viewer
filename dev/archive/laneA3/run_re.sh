#!/bin/sh
# laneA3/run_re.sh (lane A3, 2026-10-26): census3.mjs reruns for the monsters cen3a/run.sh left without a FAIL REPORT ("socket closed",
# "viewer never came up"), each with a per-monster timeout (T, default 3600 s; Lavasioth hung past "socket closed") and one retry
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
echo "pid $$" > laneA3/_re_pid.txt
for id in $IDS; do
  keys=$(grep "^$id	" cen3a/todo.txt | cut -f2)
  for t in 1 2; do
    OPEN_KEYS="$keys" METER_IDS=$id T=3600 sh laneA3/slot2_rcd3t.sh census3.mjs cen3/$id.out
    grep -q '^FAIL REPORT' cen3/$id.out && break
  done
  echo "$id $(date +%H:%M:%S) $(grep -c '^FAIL REPORT' cen3/$id.out)" >> laneA3/_re_progress.txt
  sleep 25
done
echo ALLDONE >> laneA3/_re_progress.txt
