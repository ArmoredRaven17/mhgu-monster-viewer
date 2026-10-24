cd "$(dirname "$0")"
for d in /c/MHGU-Extract/scratch-em/em0*; do
  m=$(basename $d); n=${m:2:3}
  [ -f $d/enemy/cmd_tbl/${m}_cmdtbl.emc ] || { echo "$m: no emc"; continue; }
  c=uEm${n}_00
  python -c "import sys; sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx'); import emclasses; sys.exit(0 if '$c' in emclasses.load() else 1)" || { echo "$m: no class $c in emclasses (not run)"; continue; }
  if [ $n = 058 ]; then FB_PHASEAT=0x15e1 timeout 600 python chainx.py $m $c 2>&1 | tail -40; else timeout 600 python chainx.py $m $c 2>&1 | tail -40; fi
done
