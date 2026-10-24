# watchdog.ps1: kill a shells-agent meter job (run-check.mjs ... shellmeter.mjs) older than 40 minutes -- `timeout` in git bash does
# not reach the node child on Windows. Runs until the round-3 loop prints ALL DONE.
$out = 'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\tasks\bd4pb9yfm.output'
while ($true) {
  $now = Get-Date
  Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -like '*shellmeter.mjs*' } | ForEach-Object {
    if (($now - $_.CreationDate).TotalMinutes -gt 40) { Write-Output ("killed " + $_.ProcessId + " at " + $now.ToString('HH:mm')); Stop-Process -Id $_.ProcessId -Force }
  }
  if ((Test-Path $out) -and (Select-String -Path $out -Pattern 'ALL DONE' -Quiet)) { break }
  Start-Sleep -Seconds 60
}
