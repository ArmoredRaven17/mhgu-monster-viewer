cd "$(dirname "$0")"
for f in reach_*.json; do m=${f#reach_}; m=${m%.json}
  if [ $m = em058_00 ]; then FB_PHASEAT=0x15e1 python cen3.py $m 2>&1; else python cen3.py $m 2>&1; fi
done
