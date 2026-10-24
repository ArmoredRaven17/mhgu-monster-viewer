import json
W='NO WALL / HUNTER'
R={
 'em004_00:em004_00u:162':[W,'his landing 0xd3066c (READ; shells.js landing04): type 0 -> ef 2, type 2 -> ef 1, both u 162; the floor (type 1) starts no ef and makes shell01 u 161'],
 'em008_00:em008_00u:2':[W,'ef 1 / ef 3 of sp_00 (base00) and sp_13 (base13): the type-0 / type-2 contacts; the floor landing starts ef 2 (measured)'],
 'em009_00:em009_00u:2':[W,'ef 1 / ef 3 of sp_00 / sp_13: the type-0 / type-2 contacts; the floor ef 2 is the file\'s (999, -1), nothing'],
 'em016_00:em016_00u:90':[W,'ef 1 / ef 3 of sp_00 / sp_13: the type-0 / type-2 contacts; the floor landing starts ef 2 (measured)'],
 'em034_00:em034_00u:20':[W,'ef 1 / ef 3 of sp_00 / sp_13: the type-0 / type-2 contacts; the floor landing starts ef 2 (measured)'],
 'em025_00:em025_00u:2':[W,'ef 1 / ef 3 of sp_00 / sp_13: the type-0 / type-2 contacts; the floor landing starts ef 2 (sp_13\'s is (999, -1))'],
 'em065_00:em065_00u:2':[W,'ef 1 / ef 3 of sp_13 and sp_23: the type-0 / type-2 contacts; the floor landing starts ef 2 (measured)'],
 'em066_00:em066_00u:2':[W,'ef 1 of sp_13 (base13): the type-0 (wall) contact; the floor landing starts ef 2 (measured)'],
 'em066_04:em066_04u:2':[W,'ef 1 of sp_13 (base13): the type-0 (wall) contact; the floor landing starts ef 2 (measured)'],
 'em037_04:em037_04u:2':[W,'ef 1 of sp_00 (base00): the type-0 (wall) contact; the floor landing starts ef 2 (measured)'],
 'em037_04:em037_04u:3':[W,'ef 3 of sp_00 (base00): the type-2 (hunter) contact; the floor landing starts ef 2 (measured)'],
 'em050_00:em050_00u:2':[W,'sp_00 reader 0xecf594 / landing 0xecf6e4 (READ): ef 1 = type 0 (wall), ef 2 = type 2 (hunter); the floor starts ef 3 (u 3) and sp_01'],
 'em069_00:em069_00u:21':[W,'sp_00 reader 0xf9a8ac swaps the floor to ef 3 ((999, -1), nothing); u 21 is ef 1 / ef 2, the wall / type-2 landings (landing069s00)'],
 'em076_00:em076_00u:11':[W,'sp_37 landing 0x41ae14 (READ): type 1 -> ef 3 ((999, -1)), type 0 -> ef 1, type 2 -> ef 2; u 11 is ef 1 / ef 2'],
 'em076_00:em076_00u:21':[W,'sp_00 landing 0xfd9918: u 21 is the wall / type-2 landings (ef 1 / ef 2); the floor makes shell01 2 / 3 instead'],
 'em070_00:em070_00u:1':['ROM GIVES NOTHING','sp_00 reader 0xfac410 puts ef 1 / ef 2 at +0x15d4 / +0x15cc, but its landing 0xfac5e8 (READ whole) replaces base00\'s and starts no contact ef: only sp_01 children'],
}
json.dump(R,open('reasons_me.json','w'),indent=1)
print(len(R))
