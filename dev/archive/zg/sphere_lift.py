import sys
p = r'C:\MHGU-Extract\efx\lift-effects.sh'
t = open(p, newline='').read()
assert t.count(' 0x881d94') == 1
t = t.replace(' 0x881d94', '')
open(p, 'w', newline='').write(t)
print('ok')
