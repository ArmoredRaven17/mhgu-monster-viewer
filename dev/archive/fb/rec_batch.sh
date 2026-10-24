L=$1; : > $L
while read m k; do echo "== $m $(date +%H:%M)" >> $L; python rec_shellrec.py $m $k >> $L 2>&1 || echo "FAIL $m" >> $L; done < rec_args.txt
echo "ALL DONE $(date +%H:%M)" >> $L
