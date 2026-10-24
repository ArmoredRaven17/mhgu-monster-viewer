cd "$(dirname "$0")"
for spec in "uEm057_00 57 0 em057_00" "uEm057_00 57 4 em057_04" "uEm021_00 21 0 em021_00" "uEm022_00 22 0 em022_00" "uEm023_00 23 0 em023_00" "uEm023_00 23 5 em023_05" "uEm030_00 30 0 em030_00" "uEm060_00 60 0 em060_00" "uEm060_00 60 4 em060_04" "uEm060_00 62 0 em062_00" "uEm061_00 61 0 em061_00" "uEm061_00 61 4 em061_04" "uEm065_00 65 0 em065_00" "uEm083_00 83 0 em083_00" "uEm083_00 83 4 em083_04" "uEm010_00 10 0 em010_00" "uEm017_00 17 0 em017_00" "uEm036_00 36 0 em036_00" "uEm046_00 46 0 em046_00" "uEm047_00 47 0 em047_00" "uEm049_00 49 0 em049_00" "uEm056_00 56 0 em056_00" "uEm082_00 82 0 em082_00" "uEm082_00 82 4 em082_04" "uEm066_00 66 0 em066_00" "uEm066_00 66 4 em066_04" "uEm067_00 67 0 em067_00" "uEm068_00 68 0 em068_00" "uEm070_00 70 0 em070_00" "uEm019_00 19 0 em019_00" "uEm019_00 19 4 em019_04" "uEm020_00 20 0 em020_00" "uEm020_00 20 4 em020_04" "uEm069_00 69 0 em069_00" "uEm076_00 76 0 em076_00"; do
  set -- $spec
  CLS=$1 EM=$2 OLD=1 python sweepmot.py $3 > sweep/$4.old 2>&1
  CLS=$1 EM=$2 python sweepmot.py $3 > sweep/$4.new 2>&1
  a=$(diff sweep/$4.old sweep/$4.new | grep -c '^[<>]')
  echo "$4 old=$(wc -l < sweep/$4.old) new=$(wc -l < sweep/$4.new) difflines=$a"
done
echo SWEEP DONE
