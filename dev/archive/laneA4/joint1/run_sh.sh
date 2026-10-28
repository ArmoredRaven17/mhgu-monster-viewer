#!/bin/sh
# laneA4/joint1/run_sh.sh: every joint -1 clip record with the spawn-height test (payload +0x40), metered under each rule
D='C:/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneA4/joint1'
IDS='"em002_00","em002_02","em002_04","em003_00","em008_00","em009_00","em013_00","em013_01","em013_02","em018_00","em018_04","em027_00","em032_00","em032_04","em037_00","em037_04","em042_00","em049_00","em050_00","em065_00","em069_00","em071_00","em071_05","em072_00","em077_00","em079_00","em079_04","em081_00","em081_04","em083_00","em083_04"'
cd /c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneA4/joint1
sh run.sh "$D/j1meter.mjs" "$D/sh_cur.out" "{\"ids\":[$IDS],\"rule\":\"cur\",\"sh\":true}"
sh run.sh "$D/j1meter.mjs" "$D/sh_unit.out" "{\"ids\":[$IDS],\"rule\":\"unit\",\"sh\":true}"
sh run.sh "$D/j1meter.mjs" "$D/sh_unitfl.out" "{\"ids\":[$IDS],\"rule\":\"unit\",\"floorAtUnit\":true,\"sh\":true}"
:  run.sh "$D/j1meter.mjs" "$D/sh_root.out" "{\"ids\":[$IDS],\"rule\":\"root\",\"sh\":true}"
echo DONE > sh_done.txt
