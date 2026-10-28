#!/bin/sh
# laneA4/joint1/run_where.sh: j1where over every monster with joint -1 clip records, in chunks of 12, through the slot-2 lock
D='C:/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneA4/joint1'
cd /c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneA4/joint1
python -c "
ids=open('where_ids.txt').read().split(',')
for i in range(0,len(ids),12): print(','.join(ids[i:i+12]))
" > where_chunks.txt
n=0
while read -r ch; do
  n=$((n+1)); [ -s where_$n.out ] && grep -q 'passed' where_$n.out && continue
  sh run.sh "$D/j1where.mjs" "$D/where_$n.out" "{\"ids\":[$ch]}"
  echo "chunk $n $(date +%H:%M:%S)" >> where_progress.txt
done < where_chunks.txt
echo DONE >> where_progress.txt
