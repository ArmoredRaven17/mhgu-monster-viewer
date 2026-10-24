cd "$(dirname "$0")"
P=$(python -c "import json; print(json.load(open('gorepokes.json'))['em071_00'])"); python rungen11k.py uEm071_00 em071_00 0 gore0 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15 "$P" '{}'
P=$(python -c "import json; print(json.load(open('gorepokes.json'))['em071_05'])"); python rungen11k.py uEm071_00 em071_05 5 gore5 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15 "$P" '{}'
P=$(python -c "import json; print(json.load(open('gorepokes.json'))['em072_00'])"); FB_EM=72 python rungen11k.py uEm071_00 em072_00 0 shag 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15 "$P" '{}'
