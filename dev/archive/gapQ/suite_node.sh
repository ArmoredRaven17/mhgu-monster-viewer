#!/bin/sh
# node half of every dev/shells-*-check.mjs (no page), one line per check: exit code, PASS / FAIL counts
cd /c/MHGU-Extract/MHGU-Monster-Viewer || exit 1
OUT="$1"
: > "$OUT"
for f in dev/shells-*-check.mjs; do
  log=$(timeout 900 node "$f" 2>&1); rc=$?
  p=$(printf '%s\n' "$log" | grep -c '^PASS'); q=$(printf '%s\n' "$log" | grep -c '^FAIL')
  echo "$rc $p $q $f" >> "$OUT"
  if [ "$q" != "0" ] || [ "$rc" != "0" ]; then printf '%s\n' "$log" | grep -E '^FAIL|Error' | head -8 | sed 's/^/    /' >> "$OUT"; fi
done
echo DONE >> "$OUT"
