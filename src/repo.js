'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.venv', 'venv', 'env', '__pycache__', 'dist', 'build', '.next',
  '.tox', '.mypy_cache', '.pytest_cache', 'coverage', '.turbo', '.cache',
]);

function run(cmd, args, opts) {
  try {
    return cp.execFileSync(cmd, args, Object.assign({
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 128 * 1024 * 1024, timeout: 20000,
    }, opts || {}));
  } catch (e) {
    return null;
  }
}

function status(cmd, args, opts) {
  const r = cp.spawnSync(cmd, args, Object.assign({ encoding: 'utf8', timeout: 20000 }, opts || {}));
  if (r.error) return { error: r.error, status: null, stdout: '', stderr: '' };
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function walk(root, rel, out) {
  out = out || [];
  let entries;
  try { entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch (e) { return out; }
  for (const d of entries) {
    if (d.isSymbolicLink()) continue;
    const r = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) {
      if (!SKIP_DIRS.has(d.name)) walk(root, r, out);
    } else if (d.isFile()) {
      out.push(r);
    }
  }
  return out;
}

function expandBraces(g) {
  const m = /\{([^{}]*)\}/.exec(g);
  if (!m) return [g];
  return m[1].split(',').flatMap((opt) => expandBraces(g.slice(0, m.index) + opt + g.slice(m.index + m[0].length)));
}

// A glob without "/" matches at any depth; a glob with "/" is anchored at the repo root.
function globToRegex(g) {
  const anchored = g.includes('/');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') { i++; re += '(?:.*/)?'; } else { re += '.*'; }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp((anchored ? '^' : '^(?:.*/)?') + re + '$');
}

function stripJsonc(s) {
  let out = '';
  let i = 0;
  let inStr = false;
  while (i < s.length) {
    const c = s[i];
    const n = s[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\') { out += n || ''; i += 2; continue; }
      if (c === '"') inStr = false;
      i++;
      continue;
    }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
    out += c;
    i++;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

class Repo {
  constructor(root) {
    this.root = path.resolve(root);
    this.isGit = (run('git', ['-C', this.root, 'rev-parse', '--is-inside-work-tree']) || '').trim() === 'true';
    this._files = null;
    this._tracked = null;
    this._text = new Map();
    this._json = new Map();
    this._re = new Map();
  }

  // Files present in the working tree and not git-ignored (tracked + new untracked).
  files() {
    if (this._files) return this._files;
    let list = null;
    if (this.isGit) {
      const out = run('git', ['-C', this.root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard']);
      if (out !== null) list = out.split('\0').filter(Boolean);
    }
    if (!list) list = walk(this.root, '');
    list = [...new Set(list)].filter((f) => fs.existsSync(path.join(this.root, f)));
    this._files = list.sort();
    return this._files;
  }

  // Committed files only (empty set when not a git repo).
  tracked() {
    if (this._tracked) return this._tracked;
    let set = new Set();
    if (this.isGit) {
      const out = run('git', ['-C', this.root, 'ls-files', '-z']);
      if (out) set = new Set(out.split('\0').filter(Boolean));
    }
    this._tracked = set;
    return set;
  }

  isCommitted(rel) {
    return this.isGit ? this.tracked().has(rel) : fs.existsSync(path.join(this.root, rel));
  }

  isIgnored(rel) {
    if (!this.isGit) return false;
    return status('git', ['-C', this.root, 'check-ignore', '-q', '--', rel]).status === 0;
  }

  onDisk(rel) { return fs.existsSync(path.join(this.root, rel)); }

  compile(g) {
    if (!this._re.has(g)) this._re.set(g, expandBraces(g).map(globToRegex));
    return this._re.get(g);
  }

  match(globs) {
    const res = [].concat(globs).flatMap((g) => this.compile(g));
    return this.files().filter((f) => res.some((r) => r.test(f)));
  }

  has(rel) { return this.files().includes(rel); }

  read(rel) {
    if (this._text.has(rel)) return this._text.get(rel);
    let t = '';
    try {
      const p = path.join(this.root, rel);
      if (fs.statSync(p).size <= 1024 * 1024) t = fs.readFileSync(p, 'utf8');
    } catch (e) { t = ''; }
    this._text.set(rel, t);
    return t;
  }

  json(rel) {
    if (this._json.has(rel)) return this._json.get(rel);
    let v = null;
    if (this.onDisk(rel)) {
      try { v = JSON.parse(stripJsonc(this.read(rel))); } catch (e) { v = null; }
    }
    this._json.set(rel, v);
    return v;
  }

  hasDep(names) {
    const pkg = this.json('package.json');
    if (pkg) {
      const keys = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies));
      for (const n of names) {
        if (n.endsWith('*') ? keys.some((k) => k.startsWith(n.slice(0, -1))) : keys.includes(n)) return true;
      }
    }
    const pyFiles = this.match(['requirements*.txt', 'requirements/*.txt', 'pyproject.toml', 'Pipfile', 'setup.py', 'setup.cfg']);
    for (const f of pyFiles) {
      const t = this.read(f);
      for (const n of names) {
        const base = n.replace(/\*$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp('(^|[^A-Za-z0-9_.-])' + base + '([^A-Za-z0-9_.-]|$)', 'im').test(t)) return true;
      }
    }
    return false;
  }
}

module.exports = { Repo, run, status, stripJsonc };
