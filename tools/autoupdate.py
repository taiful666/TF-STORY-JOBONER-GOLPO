#!/usr/bin/env python3
"""Keeps Claude's notes up to date after every push (run by .github/workflows/docs-sync.yml, also safe locally).

  python3 tools/autoupdate.py [BEFORE_SHA]

1. CODEMAP.md       — rebuilt (tools/codemap.py).
2. CHANGELOG.md     — every new commit since BEFORE_SHA is added at the top (date · message · files),
                      skipping bot commits and commits already listed.
3. CLAUDE.md        — the block between <!-- AUTO:START --> and <!-- AUTO:END --> is rewritten:
                      versions, file sizes, last changes. The rest of CLAUDE.md is never touched.
"""
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
BOT = 'tf-docs-bot'


def git(*a):
    return subprocess.run(['git', *a], capture_output=True, text=True).stdout.strip()


def read(p):
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''


def write(p, s):
    open(p, 'w', encoding='utf-8').write(s)


# 1. code map
subprocess.run([sys.executable, 'tools/codemap.py'], check=True)

# 2. changelog
before = sys.argv[1] if len(sys.argv) > 1 else ''
if not before or set(before) == {'0'} or not git('cat-file', '-t', before):
    rng = ['-n', '20']
else:
    rng = [f'{before}..HEAD']
log = git('log', '--reverse', '--no-merges', '--format=%H%x1f%ad%x1f%an%x1f%s', '--date=short', *rng)
cl = read('CHANGELOG.md')
head, _, rest = cl.partition('\n')
if not head.startswith('#'):
    head, rest = '# CHANGELOG — newest first (auto: one line per commit · date · message · files)', cl
new = []
for row in filter(None, log.split('\n')):
    sha, date, author, subj = row.split('\x1f')
    if author == BOT or sha[:7] in cl or 'docs-sync' in subj:
        continue
    files = [f for f in git('show', '--name-only', '--format=', sha).split('\n')
             if f and f not in ('CODEMAP.md', 'CHANGELOG.md', 'CLAUDE.md')]
    fl = ', '.join(files[:6]) + (f' +{len(files) - 6}' if len(files) > 6 else '')
    new.append(f'- {date} · {subj} · {fl or "docs"} · `{sha[:7]}`')
if new:
    write('CHANGELOG.md', head + '\n\n' + '\n'.join(reversed(new)) + '\n' + rest.lstrip('\n').rstrip('\n') + '\n')

# 3. CLAUDE.md auto block
def grab(path, pat):
    m = re.search(pat, read(path))
    return m.group(1) if m else '?'

def lines(p):
    return read(p).count('\n') + 1 if os.path.exists(p) else 0

files = ['index.html', 'home.html', 'islamic/index.html', 'islamic/story.js', 'islamic/art.js', 'islamic/art2.js',
         'explainer/part.js', 'explainer/paper.js', 'long-visuals.js', 'long-library.js', 'fx/motion.js', 'fx/shadow.js',
         'cloud-core.js']
extra = sorted(set(git('ls-files', '*.html', '*.js').split('\n')) - set(files) - {''})
extra = [f for f in extra if not f.startswith(('vendor/', 'android/')) and 'mp4-muxer' not in f and 'stories-' not in f and f != 'sw.js']
recent = [l for l in read('CHANGELOG.md').split('\n') if l.startswith('- ')][:10]
block = '\n'.join([
    '<!-- AUTO:START — rewritten by tools/autoupdate.py on every push; do not edit by hand -->',
    '## Current state (auto)',
    f'- Updated: {git("log", "-1", "--format=%ad", "--date=format:%Y-%m-%d %H:%M")} · commit `{git("rev-parse", "--short", "HEAD")}`',
    f'- APK version: {grab(".github/workflows/android.yml", r"TF_VERSION_NAME:\s*.([0-9.]+)")}.<build> · '
    f'APP_VERSION {grab("index.html", r"APP_VERSION\s*=\s*.([0-9.]+)")} · sw cache {grab("sw.js", r"CACHE\s*=\s*.([^\x27\x22]+)")}',
    '- File sizes (lines): ' + ' · '.join(f'{f} {lines(f)}' for f in files if os.path.exists(f)),
    *([f'- Other web files (new? add to CLAUDE.md tables): ' + ', '.join(extra)] if extra else []),
    '- Latest changes (full list: CHANGELOG.md) — read these before starting; newer facts here win over older text above:',
    *[f'  {l}' for l in recent],
    '<!-- AUTO:END -->',
])
c = read('CLAUDE.md')
if '<!-- AUTO:START' in c:
    c = re.sub(r'<!-- AUTO:START.*?<!-- AUTO:END -->', lambda _: block, c, flags=re.S)
else:
    c = c.rstrip('\n') + '\n\n' + block + '\n'
write('CLAUDE.md', c)
print('autoupdate done:', len(new), 'new changelog line(s)')
