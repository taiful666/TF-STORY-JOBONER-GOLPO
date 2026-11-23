#!/usr/bin/env python3
"""Quick syntax check for the whole web app (no browser needed).

  python3 tools/check.py

Every inline <script> in the HTML files and every .js file is checked with `node --check`.
Prints only problems (file + line in the ORIGINAL file), then "OK" or "FAILED".
"""
import os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = ['home.html', 'index.html', 'islamic/index.html']
JS = ['cloud-core.js', 'long-library.js', 'long-visuals.js', 'sw.js', 'fx/motion.js', 'fx/shadow.js',
      'explainer/paper.js', 'explainer/part.js', 'islamic/story.js', 'islamic/art.js', 'islamic/art2.js',
      'islamic/stories-1.js', 'islamic/stories-2.js', 'islamic/stories-3.js']


def node_check(code, label, line_offset=0):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(code); tmp = f.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
    os.unlink(tmp)
    if r.returncode == 0:
        return True
    m = re.search(r':(\d+)\n', r.stderr)
    ln = int(m.group(1)) + line_offset if m else '?'
    err = [l for l in r.stderr.splitlines() if 'Error' in l]
    print(f'✗ {label} line {ln}: {err[0] if err else r.stderr.strip()[:300]}')
    return False


def main():
    ok = True
    for rel in HTML:
        p = os.path.join(ROOT, rel)
        if not os.path.exists(p):
            continue
        txt = open(p, encoding='utf-8').read()
        for m in re.finditer(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', txt, re.S):
            if 'type=' in m.group(1) and 'module' not in m.group(1) and 'javascript' not in m.group(1):
                continue
            start_line = txt.count('\n', 0, m.start(2))
            ok &= node_check(m.group(2), rel, start_line)
    for rel in JS:
        p = os.path.join(ROOT, rel)
        if os.path.exists(p):
            ok &= node_check(open(p, encoding='utf-8').read(), rel)
    print('OK' if ok else 'FAILED')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
