#!/bin/sh
# hyperaudit/runall.sh: pageaudit.mjs over the 44 hyper monsters in four chunks, G only (a fresh page per chunk: the r3 pass's burst clip leaves the monster displaced, so the r5 in-scene pixels of runall.sh are not comparable) -> pageG_<n>.out
H=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/hyperaudit
cd $H
AUDIT_RANKS=5 AUDIT_IDS=em001_00,em001_02,em002_00,em002_02,em003_00,em004_00,em005_00,em007_00,em008_00,em009_00,em010_00 AUDIT_SHOTS=hyperaudit sh run.sh pageaudit.mjs pageG_1.out
AUDIT_RANKS=5 AUDIT_IDS=em018_00,em019_00,em020_00,em021_00,em022_00,em023_00,em032_00,em036_00,em037_00,em042_00,em043_00 AUDIT_SHOTS=hyperaudit sh run.sh pageaudit.mjs pageG_2.out
AUDIT_RANKS=5 AUDIT_IDS=em044_00,em045_00,em046_00,em047_00,em049_00,em055_00,em056_00,em057_00,em063_00,em065_00,em066_00 AUDIT_SHOTS=hyperaudit sh run.sh pageaudit.mjs pageG_3.out
AUDIT_RANKS=5 AUDIT_IDS=em067_00,em068_00,em069_00,em070_00,em071_00,em077_00,em079_00,em080_00,em081_00,em082_00,em083_00 AUDIT_SHOTS=hyperaudit sh run.sh pageaudit.mjs pageG_4.out
