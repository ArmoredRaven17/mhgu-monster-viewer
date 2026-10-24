import sys
sys.argv = ['emu_fb.py']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
exec(compile(src, 'emu_fb.py', 'exec'))
for sid in [int(x, 0) for x in sys.argv_ids]:
    pass
