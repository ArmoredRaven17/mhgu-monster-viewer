# rec_classreq.py: record the class requests whose blocks the class fills itself (effects lane, 2026-10-20) -- Teostra u 2 / u 3
# (+0x14 bit 5, root joint 3: 0xe11204..0xe112dc) and Nerscylla's C+0xb5 requests (+0x1c |= 1 with the joint's position, +0x14 bit 5
# with the joint, +0x14 bit 0 with the offset on L4 M30: 0xf9c260..0xf9c3f8) -- REQUESTER_JSON (vecdrawsched.py -> proofunit.py);
# adds the sets to lift-effects.sh's V (no lift here).
import os, sys, re, json, subprocess
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX); os.chdir(EFX)
import add_effects as A
J1, J144 = [0.0, -1.799999959766865, 209.69999313354495], [0.0, 0.0, -373.49998712539673]   # joints/em070_00_viewer_rest.json
SETS = [
    ('em027_00', 'em027_00u', 2, 'add_em027_00_u2_rj3', {'rootJoint': 3}),
    ('em027_00', 'em027_00u', 3, 'add_em027_00_u3_rj3', {'rootJoint': 3}),
    ('em070_00', 'em070_00u', 30, 'add_em070_00_u30_b5', {'position': J1, 'flags1c': 1, 'positionOnly': True, 'rootJoint': 1}),
    ('em070_00', 'em070_00u', 31, 'add_em070_00_u31_b5', None),
    ('em070_00', 'em070_00u', 32, 'add_em070_00_u32_b5', {'position': J144, 'flags1c': 1, 'positionOnly': True, 'rootJoint': 144}),
    ('em070_00', 'em070_00u', 32, 'add_em070_00_u32_b5off', {'position': J144, 'flags1c': 1, 'positionOnly': True, 'rootJoint': 144, 'offset': [0.0, 0.0, -80.0]}),
    ('em070_00', 'em070_00u', 33, 'add_em070_00_u33_b5', {'position': J144, 'flags1c': 1, 'positionOnly': True, 'rootJoint': 144}),
    ('em070_00', 'em070_00u', 34, 'add_em070_00_u34_b5', {'position': J1, 'flags1c': 1, 'positionOnly': True, 'rootJoint': 1}),
]
done = []
for mon, pel, key, name, req in SETS:
    d = A.existing_def(mon)
    e = next(x for x in d['effects'] if x.get('when') == 'event' and x['record']['pel'] == pel and x['record']['key'] == key)
    efl = A.T.efl_path(e['efl'].split('/')[-1][:-4]).replace(os.sep, '/')
    spec = '0:%s:%s:%d:UNIQUE' % (efl, pel, key)
    env = dict(os.environ, PARENT_JOINTS='joints/%s_viewer_rest.json' % mon, MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', GPU_DRAW_ROM='1')
    env.pop('CAMERA_AT', None); env.pop('REQUESTER_JSON', None)
    if req: env['REQUESTER_JSON'] = json.dumps(req)
    cmd = [sys.executable, 'vecdrawsched.py', name, '600', str(A.size_of(mon)), spec]
    print(' '.join(cmd), env.get('REQUESTER_JSON', ''), flush=True)
    p = subprocess.run(cmd, cwd=EFX, env=env, stdout=open(os.path.join(EFX, 'logs', name + '.log'), 'w'), stderr=subprocess.STDOUT)
    ok = p.returncode == 0 and os.path.exists(os.path.join(EFX, 'vectors', name, 'draw.json'))
    print('  ', name, 'recorded' if ok else 'FAILED', flush=True)
    if ok: done.append(name)
if done:
    with A.shared_lock('lift'):
        sh = os.path.join(EFX, 'lift-effects.sh')
        text = open(sh, newline='').read()
        m = re.search(r'^V=(\S+)$', text, re.M)
        have = set(m.group(1).split(','))
        add = [v for v in ('vectors/' + n for n in done) if v not in have]
        if add:
            text = text[:m.end(1)] + ',' + ','.join(add) + text[m.end(1):]
            open(sh, 'w', newline='').write(text)
        print('lift-effects.sh: %d sets added' % len(add))
