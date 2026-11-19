'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { Repo } = require('./repo');
const { detectStack } = require('./stack');
const { indexSkills } = require('./skills');
const tools = require('./tools');

function loadKnown(skillDir) {
  try {
    return YAML.parse(fs.readFileSync(path.join(skillDir, 'references', 'known-configs.yaml'), 'utf8')) || {};
  } catch (e) {
    return { paths: [], patterns: [], kinds: [] };
  }
}

function guessKind(file, kinds) {
  for (const k of kinds || []) {
    if (new RegExp(k.pattern, 'i').test(file)) return k.kind;
  }
  return 'other';
}

function collectCatalogPaths(catalog) {
  const out = new Set();
  const walk = (e) => {
    if (!e || typeof e !== 'object') return;
    if (Array.isArray(e.paths)) for (const p of e.paths) out.add(p);
    if (e.of) for (const x of e.of) walk(x);
    for (const k of Object.keys(e)) {
      if (k === 'paths' || k === 'of' || k === 'type' || k === 'pattern' || k === 'flags' || k === 'name' || k === 'match' || k === 'require' || k === 'only' || k === 'tags' || k === 'names') continue;
      if (typeof e[k] === 'object') walk(e[k]);
    }
  };
  for (const c of catalog.checks) {
    walk(c.detect);
    walk(c.applies);
  }
  return out;
}

function isCovered(file, known, catalogPaths, repo) {
  const pool = [...(known.paths || []), ...(known.patterns || []), ...catalogPaths];
  for (const g of pool) {
    if (repo.match([g]).includes(file)) return true;
    // exact / prefix match for directory globs already handled by match; also check simple equality
    if (g === file) return true;
  }
  // .env* real files are intentionally ignored as unknown (handled by must checks)
  if (/(^|\/)\.env(\.|$)/.test(file) && !/\.(example|sample|template|dist)$/i.test(file)) return true;
  // lockfiles and binary-ish
  if (/\.(lock|lockb)$/i.test(file) || file.endsWith('package-lock.json')) return true;
  return false;
}

function looksLikeConfig(file) {
  const base = file.split('/').pop();
  if (base.startsWith('.') && !base.startsWith('.git')) return true;
  if (/\.config\.[^.]+$/i.test(base)) return true;
  if (/\.(toml|ini|yml|yaml|json|jsonc|mdc)$/i.test(base)) return true;
  if (/^(Dockerfile|Jenkinsfile|Makefile|makefile|Justfile|justfile)$/i.test(base)) return true;
  if (/^\.(cursor|claude|vscode|github|gitlab|devcontainer|agents|husky|circleci)\//.test(file)) return true;
  if (/^(docs|adr)\//.test(file) && /\.md$/i.test(file)) return false;
  return false;
}

function readMcpServers(repo, config) {
  const out = [];
  for (const f of tools.mcpFiles(config)) {
    if (!repo.onDisk(f)) continue;
    const j = repo.json(f);
    const servers = (j && (j.mcpServers || j.servers)) || {};
    for (const [name, cfg] of Object.entries(servers)) {
      out.push({
        name,
        file: f,
        command: cfg && cfg.command ? String(cfg.command) : null,
        url: cfg && cfg.url ? String(cfg.url) : null,
        committed: repo.isCommitted(f),
      });
    }
  }
  return out;
}

function matchProvider(server, providers) {
  const hay = `${server.name} ${server.command || ''} ${server.url || ''}`;
  for (const p of providers) {
    if (!p.match) continue;
    if (new RegExp(p.match, 'i').test(hay)) return p;
  }
  return null;
}

function detectTools(repo) {
  const found = [];
  if (repo.onDisk('.cursor') || repo.match(['.cursor/**']).length) found.push('cursor');
  if (repo.onDisk('.claude') || repo.match(['.claude/**', '.mcp.json']).length) found.push('claude-code');
  return found.length ? found : ['cursor'];
}

function detectCiPresent(repo) {
  return repo.match([
    '.github/workflows/*.{yml,yaml}', '.gitlab-ci.yml', '.gitlab/ci/*.yml', 'Jenkinsfile',
    '.circleci/config.yml', 'azure-pipelines.yml', 'bitbucket-pipelines.yml', '.drone.yml', '.travis.yml',
  ]).length > 0;
}

function signals(repo) {
  const readme = repo.match(['README.md', 'README', 'readme.md'])[0];
  const headings = [];
  if (readme) {
    for (const l of repo.read(readme).split(/\r?\n/)) {
      const m = /^(#{1,3})\s+(.+)$/.exec(l);
      if (m) headings.push(m[2].trim());
    }
  }
  let topDirs = [];
  try {
    topDirs = fs.readdirSync(repo.root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !['node_modules', 'dist', 'build', 'coverage', '__pycache__', 'venv'].includes(d.name))
      .map((d) => d.name)
      .slice(0, 20);
  } catch (e) { /* empty */ }
  const deps = [];
  const j = repo.json('package.json');
  if (j) {
    for (const k of Object.keys(Object.assign({}, j.dependencies || {}, j.devDependencies || {}))) deps.push(k);
  }
  const req = repo.match(['requirements.txt', 'requirements*.txt', 'pyproject.toml'])[0];
  if (req) {
    const t = repo.read(req);
    for (const m of t.matchAll(/^([A-Za-z0-9_.-]+)\s*[<=>~!]/gm)) deps.push(m[1]);
    for (const m of t.matchAll(/^\s*"([A-Za-z0-9_.-]+)"\s*=/gm)) deps.push(m[1]);
  }
  return { readmeHeadings: headings.slice(0, 30), topDirs, dependencies: [...new Set(deps)].slice(0, 40) };
}

function missingStandardFiles(repo, catalog, stack) {
  const { evaluateCheck } = require('./engine');
  const ctx = { repo, stack: new Set(stack), mode: 'ci', config: { tools: [] } };
  const interesting = new Set([
    'agents-md-complete', 'pull-request-template', 'env-example', 'pre-commit-configured',
    'formatter-config-committed', 'linter-config-committed', 'readme-setup-and-run',
  ]);
  const out = [];
  for (const c of catalog.checks) {
    if (c.level !== 'must' || !interesting.has(c.slug)) continue;
    if (c.stack && !c.stack.includes('any') && !c.stack.some((t) => stack.includes(t))) continue;
    const r = evaluateCheck(c, ctx);
    if (r.status === 'fail') {
      out.push({
        slug: c.slug,
        title: c.title,
        detail: r.detail,
        fix: c.fix || '',
        template: /Template:\s*\{\{skill_dir\}\}\/(\S+)/.exec(c.fix || '') ? RegExp.$1 : null,
      });
    }
  }
  // CI audit workflow specifically
  if (!repo.match(['.github/workflows/*ai-sdlc*']).length) {
    out.push({
      slug: 'ai-sdlc-ci-workflow',
      title: 'AI SDLC onboarding CI workflow',
      detail: 'no .github/workflows file for ai-sdlc-onboarding',
      fix: 'Copy assets/ci-github-actions.yml to .github/workflows/ai-sdlc-onboarding.yml',
      template: 'assets/ci-github-actions.yml',
      notACheck: true,
    });
  }
  return out;
}

function runScan(opts) {
  const { root, catalog, skillDir, config } = opts;
  const repo = new Repo(root);
  const stack = (config && config.stack && config.stack.length) ? config.stack : detectStack(repo);
  const cfg = config || { tools: [], stack, optional: {}, skills: {}, projectSkills: {}, mcp: {}, projectMcp: {}, ignored: [], warnings: [] };
  const toolsDetected = detectTools(repo);
  const activeCfg = Object.assign({}, cfg, { tools: cfg.tools && cfg.tools.length ? cfg.tools : toolsDetected });
  const skillIndex = indexSkills(repo, activeCfg);
  const known = loadKnown(skillDir);
  const catalogPaths = collectCatalogPaths(catalog);
  const providers = catalog.mcpProviders || [];
  const mcpServers = readMcpServers(repo, activeCfg);
  const matched = [];
  const unknownMcp = [];
  for (const s of mcpServers) {
    const p = matchProvider(s, providers);
    if (p) matched.push({ server: s, provider: p.key, category: p.category, slug: p.slug });
    else unknownMcp.push({
      name: s.name,
      file: s.file,
      command: s.command,
      url: s.url,
      committed: s.committed,
    });
  }

  const { evaluateCheck } = require('./engine');
  const ctx = { repo, stack: new Set(stack), mode: 'ci', config: activeCfg, skillDir };
  const evidence = [];
  for (const item of catalog.items) {
    if (item.kind === 'mcp-provider' || item.mcp) {
      const conf = catalog.checks.find((c) => c.slug === `${item.slug}-configured`
        || (item.checks && item.checks.includes(c.slug) && /configured$/.test(c.slug)));
      // GitHub: treat committed MCP match as evidence even without a *-configured check
      if (conf) {
        const r = evaluateCheck(conf, ctx);
        if (r.status === 'pass') evidence.push({ slug: item.key || item.slug, check: conf.slug, detail: r.detail, section: 'integrations', category: item.category });
      }
      continue;
    }
    const checks = catalog.checks.filter((c) => (c.group === item.slug || (item.checks || []).includes(c.slug)) && c.scope === 'repo' && c.tier !== 'chat');
    let anyPass = false;
    let detail = '';
    for (const c of checks) {
      const r = evaluateCheck(c, ctx);
      if (r.status === 'pass') { anyPass = true; detail = r.detail; break; }
    }
    if (anyPass) evidence.push({ slug: item.slug, detail, section: item.section });
  }
  // MCP provider evidence from matched servers (committed only)
  for (const m of matched) {
    if (!m.server.committed) continue;
    if (!evidence.some((e) => e.slug === m.provider)) {
      evidence.push({ slug: m.provider, check: `${m.slug}-configured`, detail: `server "${m.server.name}" in ${m.server.file}`, section: 'integrations', category: m.category });
    }
  }

  const unknownFiles = [];
  for (const f of repo.files()) {
    if (!looksLikeConfig(f)) continue;
    if (isCovered(f, known, catalogPaths, repo)) continue;
    // skip deep node_modules already skipped by walk
    if (f.split('/').length > 4 && !f.startsWith('.github/') && !f.startsWith('.cursor/') && !f.startsWith('.claude/')) continue;
    unknownFiles.push({
      path: f,
      kind: guessKind(f, known.kinds),
      why: 'config-looking file not covered by this skill version',
    });
  }

  const byCategory = {};
  for (const cat of catalog.mcpCategories || []) {
    const found = matched.filter((m) => m.category === cat.key).map((m) => m.provider);
    byCategory[cat.key] = {
      title: cat.title,
      providers: cat.providers.map((p) => p.key),
      found: [...new Set(found)],
      recommended: found.length ? [...new Set(found)] : (cat.defaultOff && !cat.defaultOff.some((t) => stack.includes(t)) ? null : null),
    };
  }

  return {
    stack,
    tools: toolsDetected,
    ciPresent: detectCiPresent(repo),
    skillIndex,
    mcpServers,
    mcpMatched: matched,
    mcpByCategory: byCategory,
    unknownMcp,
    unknownFiles: unknownFiles.slice(0, 100),
    evidence,
    missingStandards: missingStandardFiles(repo, catalog, stack),
    signals: signals(repo),
    onboardingSkills: (catalog.skills || []).filter((s) => s.onboarding),
  };
}

function writeUnknownLog(root, scan, skillVersion, now) {
  const local = require('./local');
  local.ensureDir(root);
  const body = {
    generatedAt: (now || new Date()).toISOString(),
    skillVersion,
    files: scan.unknownFiles || [],
    mcpServers: (scan.unknownMcp || []).map((s) => ({
      name: s.name,
      file: s.file,
      command: s.command || undefined,
      url: s.url || undefined,
    })),
  };
  const file = path.join(local.dirPath(root), 'unknown-configs.json');
  fs.writeFileSync(file, JSON.stringify(body, null, 2) + '\n');
  return path.relative(root, file).split(path.sep).join('/');
}

module.exports = {
  runScan,
  writeUnknownLog,
  detectTools,
  detectCiPresent,
  matchProvider,
  readMcpServers,
};
