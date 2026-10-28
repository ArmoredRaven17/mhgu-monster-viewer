#!/bin/sh
# cen3a/run.sh (effects lane A, 2026-10-25): census3.mjs over lane A's groups (Brute .. Leviathan), list order, through the slot-2 lock;
# outputs into cen3/<id>.out (cenreport.py reads them there), progress in cen3a/_progress.txt
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
echo "pid $$" > cen3a/_pid.txt
while IFS="$(printf '\t')" read -r id keys; do
  if [ -s cen3/$id.out ] && grep -q '^FAIL REPORT' cen3/$id.out && [ cen3/$id.out -nt cen3a/todo.txt ]; then continue; fi
  OPEN_KEYS="$keys" METER_IDS=$id sh slot2_rcd3.sh census3.mjs cen3/$id.out
  echo "$id $(date +%H:%M:%S)" >> cen3a/_progress.txt
  sleep 25   # yield the slot-2 lock to queued probes
done < cen3a/todo.txt
echo ALLDONE >> cen3a/_progress.txt
