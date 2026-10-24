#!/bin/sh
# The eight words with an extra input axis, on grids split so each stays under ~15M runs: the full motion x action grid with
# the extra input at a few values, then the extra input in full on the statuses its arm reads. One output per run in ws2/.
cd "$(dirname "$0")"
mkdir -p ws2
M() { python -c "import wordsweep as W; print(','.join('%x' % m for m in W.motions('$1')))"; }
ALL=0,1,2,4,6,7,10,12,13
run(){ name=$1; shift; env "$@" > ws2/$name.out 2>&1; }
A16=$(python -c "print(','.join(map(str,range(16))))"); A32=$(python -c "print(','.join(map(str,range(32))))")
(
run em063_00_A EM=63 VAR=0 AXIS=arms CHG=0,5,12 SEV=1 MOGURI=-1000 DEPTHS=0,-1000 RANKS=5 python jscheckpd.py 17d92c4 em063_00 $(M em063_00) 0,2,6,7,10
run em063_00_B EM=63 VAR=0 AXIS=arms CHG=$A16 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 17d92c4 em063_00 $(M em063_00) 7
run em063_00_C EM=63 VAR=0 AXIS=arms CHG=0,5 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 17d92c4 em063_00 $(M em063_00) 0,7 em033_00
) &
(
run em063_05_A EM=63 VAR=5 AXIS=arms CHG=0,5,12 SEV=1 MOGURI=-1000 DEPTHS=0,-1000 RANKS=5 python jscheckpd.py 17d92c4 em063_05 $(M em063_05) 0,2,6,7,10
run em063_05_C EM=63 VAR=5 AXIS=arms CHG=0,5 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 17d92c4 em063_05 $(M em063_05) 0,7 em033_00
) &
(
run em080_00_A EM=80 VAR=0 AXIS=heat CHG=0,1,2,4,8,16,31 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 17eac74 em080_00 $(M em080_00) 0,2,7,10
run em080_00_B EM=80 VAR=0 AXIS=heat CHG=$A32 MOGURI=-1000 DEPTHS=0 RANKS=3,5 python jscheckpd.py 17eac74 em080_00 201,20d,20e,30a 0,7
run em080_00_C EM=80 VAR=0 AXIS=heat CHG=0,4 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 17eac74 em080_00 $(M em080_00) 0,7 em033_00
run em080_04_A EM=80 VAR=4 AXIS=heat CHG=0,1,2,4,8,16,31 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 17eac74 em080_04 $(M em080_04) 0,2,7,10
run em080_04_B EM=80 VAR=4 AXIS=heat CHG=$A32 MOGURI=-1000 DEPTHS=0 RANKS=3,5 python jscheckpd.py 17eac74 em080_04 201,20d,20e,30a 0,7
) &
(
run em005_00_A EM=5 VAR=0 LV=0,5,6 LVLS=0,2 MOGURI=-1000 DEPTHS=0,-1000 RANKS=5 python jscheckpd.py 1797c8c em005_00 $(M em005_00) 0,2,6,7,10
run em005_00_B EM=5 VAR=0 LV=0,5,6 LVLS=0,1,2,3 MOGURI=-1000 DEPTHS=0 python jscheckpd.py 1797c8c em005_00 203,204,21e,21f,220,218,221,43b,7,202,205 7
run em005_00_C EM=5 VAR=0 LV=0,5,6 LVLS=0,2 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 1797c8c em005_00 $(M em005_00) 0,7 em033_00
) &
(
run em001_04_A EM=1 VAR=4 IDW=0x401 LV=7 LVLS=0,2 SEV=1 MOGURI=-1000 DEPTHS=0,-1000 RANKS=5 python jscheckpd.py 1793c28 em001_04 $(M em001_04) 0,1,2,7,9,10
run em001_04_B EM=1 VAR=4 IDW=0x401 LV=7 LVLS=0,1,2,3 SEV=1 MOGURI=-1000 DEPTHS=0 python jscheckpd.py 1793c28 em001_04 203,204,406,432,434,437,441,902,906,201 0,7
run em001_04_C EM=1 VAR=4 IDW=0x401 LV=7 LVLS=0,2 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 1793c28 em001_04 $(M em001_04) 0,7 em033_00
) &
(
run em002_04_A EM=2 VAR=4 IDW=0x402 LV=7 LVLS=0,2 SEV=1 MOGURI=-1000 DEPTHS=0,-1000 RANKS=5 python jscheckpd.py 1793c28 em002_04 $(M em002_04) 0,1,2,7,9,10
run em002_04_B EM=2 VAR=4 IDW=0x402 LV=7 LVLS=0,1,2,3 SEV=1 MOGURI=-1000 DEPTHS=0 python jscheckpd.py 1793c28 em002_04 203,204,420,426,201 0,7
run em002_04_C EM=2 VAR=4 IDW=0x402 LV=7 LVLS=0,2 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 1793c28 em002_04 $(M em002_04) 0,7 em033_00
) &
(
run em018_04_A EM=18 VAR=4 LV=7 LVLS=0,2 SEV=1 MOGURI=-1000 DEPTHS=0,-1000 RANKS=5 python jscheckpd.py 17abb38 em018_04 $(M em018_04) 0,1,2,7,10,11
run em018_04_B EM=18 VAR=4 LV=7 LVLS=0,1,2,3 SEV=1 MOGURI=-1000 DEPTHS=0 python jscheckpd.py 17abb38 em018_04 7,168,202,20c,441,44d 0,7
run em018_04_C EM=18 VAR=4 LV=7 LVLS=0,2 MOGURI=-1000 DEPTHS=0 RANKS=5 python jscheckpd.py 17abb38 em018_04 $(M em018_04) 0,7 em033_00
) &
wait
echo HEAVY_DONE
