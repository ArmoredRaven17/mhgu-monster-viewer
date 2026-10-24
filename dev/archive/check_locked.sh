#!/bin/sh
# check_locked.sh <check.mjs> <out.log>: one page check through slot 1 of the shared soak lock
SP="$(cd "$(dirname "$0")" && pwd)"
CHK="$1"; OUT="$2"
while :; do
  L="$SP/soak.slot1"
  if mkdir "$L" 2>/dev/null; then
    echo "chk $$" > "$L/owner"
    cd /c/MHGU-Extract/MHGU-Monster-Viewer
    timeout 1500 node "$(cygpath -w "$SP/run-check.mjs")" "$(cygpath -w "$CHK")" > "$OUT" 2>&1
    rc=$?
    rm -rf "$L"
    exit $rc
  fi
  find "$SP" -maxdepth 1 -name "soak.slot1" -mmin +45 -exec rm -rf {} + 2>/dev/null
  sleep 15
done
