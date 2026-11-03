# Notes for Claude

## The user's machine: Windows, VS Code, PowerShell

The user works on **Windows** and runs commands in **VS Code's integrated terminal**, which
on Windows opens **Windows PowerShell 5.1** unless they say otherwise. Cloud sessions run on
Linux, but any command written *for the user to run* must work there:

- Write commands in PowerShell, in ```powershell fenced blocks. Never give bash-only commands
  (`grep`, `ls -la`, `cat`, `rm -rf`, `export`, `~/...`, `$(...)`, `2>/dev/null`).
- Stick to syntax that PowerShell 5.1 understands: no `&&` or `||` between commands (those
  need PowerShell 7); run them one per line or join them with `;`.
- Common swaps: `grep` → `Select-String`; `ls` → `Get-ChildItem`; `cat` → `Get-Content`;
  `rm -rf x` → `Remove-Item -Recurse -Force x`; `~` → `$env:USERPROFILE`;
  `export X=1` → `$env:X = "1"`; `2>/dev/null` → `-ErrorAction SilentlyContinue`.
- Use Windows paths (`C:\...`, backslashes); quote paths that contain spaces.
- `python` (not `python3`) and `node` are the commands to call.
