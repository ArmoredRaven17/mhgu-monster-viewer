cd "$(dirname "$0")"
for m in em010_00 em011_00 em012_00 em013_00 em013_01 em013_02 em017_00 em019_00 em019_04 em020_00 em020_04 em021_00 em022_00 em023_00 em023_05 em024_00 em025_00 em027_00 em030_00 em036_00 em046_00 em047_00 em049_00 em050_00 em056_00 em058_00 em060_00 em060_04 em061_00 em061_04 em065_00 em066_00 em066_04 em067_00 em068_00 em070_00 em082_00 em082_04 em083_00 em083_04; do
  if [ $m = em058_00 ]; then FB_PHASEAT=0x15e1 python chainx.py $m 2>&1 | grep -v "^  edges"; else python chainx.py $m 2>&1 | grep -v "^  edges"; fi
done
