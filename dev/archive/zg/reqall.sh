#!/bin/sh
cd "$(dirname "$0")"
for mon in em001_00 em001_02 em001_04 em002_00 em002_02 em002_04 em003_00 em004_00 em005_00 em007_00 em007_04 em032_00 em032_04 em033_00 em037_00 em037_04 em038_00 em042_00 em077_00 em081_00 em081_04 em043_00 em043_05 em044_00 em045_00 em045_04 em055_00 em063_00 em063_05 em080_00 em080_04 em008_00 em009_00 em014_00 em015_00 em016_00 em018_00 em018_04 em034_00 em079_00 em079_04 em085_00; do
  n=${mon#em}; n=${n%_*}; v=${mon#*_}; cls=$n
  case $n in 002) cls=001;; 005) cls=004;; 015|016|034) cls=014;; esac
  CLS=uEm${cls}_00 EM=$((10#$n)) python reqtrace.py $((10#$v)) > req/$mon.txt 2> req/$mon.err
  echo "$mon $(grep -vc '^#' req/$mon.txt)"
done
echo ALLDONE
