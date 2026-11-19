'use strict';
const fs = require('fs');
const path = require('path');
const tools = require('./tools');
const { frontmatter } = require('./skills');
const { run, status: sh } = require('./repo');

const R = (status, detail) => ({ status, detail: detail || '' });
const cap = (arr, n) => arr.slice(0, n || 3).join(', ') + (arr.length > (n || 3) ? ` (+${arr.length - (n || 3)} more)` : '');

const DOC_GLOBS = ['AGENTS.md', 'README.md', 'CONTRIBUTING.md', 'docs/**/*.md'];
const CI_GLOBS = [
  '.github/workflows/*.{yml,yaml}', '.gitlab-ci.yml', '.gitlab/ci/*.yml', 'Jenkinsfile', '.circleci/config.yml',
  'azure-pipelines.yml', 'bitbucket-pipelines.yml', '.drone.yml', '.travis.yml', '.zuul.yaml', '.zuul.d/*.yaml',
  'zuul.d/*.yaml', '.buildkite/*.{yml,yaml}',
];
const ENV_EXAMPLES = ['.env.example', '.env.sample', '.env.template', 'env.example', '.env.dist', '**/.env.example'];

const text = (ctx, globs) => ctx.repo.match(globs).map((f) => ctx.repo.read(f)).join('\n');
const docs = (ctx) => text(ctx, DOC_GLOBS);
const lines = (t) => t.split(/\r?\n/);
const nonEmpty = (t) => lines(t).filter((l) => l.trim());

function needsTypecheck(ctx) {
  if (ctx.stack.has('typescript')) return true;
  if (!ctx.stack.has('python')) return false;
  return ctx.repo.match(['mypy.ini', '.mypy.ini', 'pyrightconfig.json']).length > 0 || /^\[tool\.(mypy|pyright)/m.test(ctx.repo.read('pyproject.toml'));
}
const needsBuild = (ctx) => ctx.stack.has('react');

// ------------------------------------------------------------------ commands

function commandSurface(ctx) {
  const pkg = new Set();
  const make = new Set();
  let bodies = '';
  const j = ctx.repo.json('package.json');
  if (j && j.scripts) for (const [k, v] of Object.entries(j.scripts)) { pkg.add(k); bodies += `${k} ${v}\n`; }
  for (const f of ctx.repo.match(['Makefile', 'makefile', 'GNUmakefile'])) {
    const t = ctx.repo.read(f);
    for (const m of t.matchAll(/^([A-Za-z0-9_.-]+)\s*:(?!=)/gm)) make.add(m[1]);
    bodies += t + '\n';
  }
  for (const f of ctx.repo.match(['justfile', 'Justfile'])) {
    const t = ctx.repo.read(f);
    for (const m of t.matchAll(/^([A-Za-z0-9_-]+)[^\n:]*:/gm)) make.add(m[1]);
    bodies += t + '\n';
  }
  for (const f of ctx.repo.match(['tox.ini', 'noxfile.py'])) bodies += ctx.repo.read(f) + '\n';
  return { pkg, make, names: new Set([...pkg, ...make]), bodies };
}

const CAT = {
  lint: { name: /^(lint|eslint|ruff|flake8|pylint|check|verify)([:_-]|$)/i, cmd: /(eslint|\bruff\b|flake8|pylint|biome (check|lint)|(npm|pnpm|yarn)( run)? lint|make lint)/i },
  test: { name: /^(test|tests|pytest|jest|vitest|unit|spec)([:_-]|$)/i, cmd: /(pytest|\bjest\b|vitest|manage\.py test|(npm|pnpm|yarn)( run)? test|make test|\btox\b|\bnox\b)/i },
  typecheck: { name: /^(typecheck|type-check|types|tsc|mypy|pyright|check-types)([:_-]|$)/i, cmd: /(\btsc\b|\bmypy\b|pyright|typecheck|type-check)/i },
  build: { name: /^build([:_-]|$)/i, cmd: /((npm|pnpm|yarn)( run)? build|make build|vite build|next build)/i },
};

function canonicalCommands(ctx) {
  const { names, bodies } = commandSurface(ctx);
  const doc = docs(ctx);
  const need = ['lint', 'test'];
  if (needsTypecheck(ctx)) need.push('typecheck');
  if (needsBuild(ctx)) need.push('build');
  const missing = [];
  const found = [];
  for (const c of need) {
    const ok = [...names].some((n) => CAT[c].name.test(n)) || CAT[c].cmd.test(bodies) || CAT[c].cmd.test(doc);
    (ok ? found : missing).push(c);
  }
  return missing.length
    ? R('fail', `no script, target or documented command for: ${missing.join(', ')}`)
    : R('pass', `found: ${found.join(', ')}`);
}

function agentDocsCommandsValid(ctx) {
  if (!ctx.repo.has('AGENTS.md')) return R('na', 'AGENTS.md is missing (see agents-md-complete)');
  const t = ctx.repo.read('AGENTS.md');
  const { pkg, make } = commandSurface(ctx);
  const refs = new Set();
  const missing = [];
  for (const m of t.matchAll(/\b(?:npm|pnpm|yarn|bun)\s+run\s+([A-Za-z0-9:_-]+)/g)) { refs.add(m[0]); if (!pkg.has(m[1])) missing.push(m[0]); }
  for (const m of t.matchAll(/\b(?:npm|pnpm|yarn|bun)\s+(test|lint|build|dev|format|typecheck)\b/g)) { refs.add(m[0]); if (!pkg.has(m[1])) missing.push(m[0]); }
  for (const m of t.matchAll(/\bmake\s+([A-Za-z0-9_-]+)/g)) { refs.add(m[0]); if (!make.has(m[1])) missing.push(m[0]); }
  const others = /\b(pytest|python manage\.py \w+|ruff|mypy|uv run|poetry run|tox|nox)\b/.test(t);
  if (!refs.size && !others) return R('fail', 'AGENTS.md documents no runnable commands');
  if (missing.length) return R('fail', `AGENTS.md references commands that do not exist: ${cap([...new Set(missing)], 4)}`);
  return R('pass', `${refs.size} documented command(s) exist`);
}

function singleTestDocumented(ctx) {
  const t = docs(ctx);
  const re = /(pytest\s+[\w./:-]+|-k\s+["']?\w+|\bjest\s+[\w./-]+|vitest\s+(run\s+)?[\w./-]+|testPathPattern|single test|specific test|one test|run a (single|specific)|test:file|manage\.py test [\w.]+)/i;
  return re.test(t) ? R('pass', 'documented') : R('fail', 'no example of running a single test or test file');
}

function ciRuns(ctx) {
  const files = ctx.repo.match(CI_GLOBS);
  if (!files.length) return R('fail', 'no CI configuration found');
  const t = files.map((f) => ctx.repo.read(f)).join('\n');
  const rules = { lint: /(lint|eslint|ruff|flake8|pylint|biome)/i, test: /(\btest|pytest|jest|vitest)/i, typecheck: /(\btsc\b|typecheck|type-check|mypy|pyright)/i };
  const need = ['lint', 'test'];
  if (needsTypecheck(ctx)) need.push('typecheck');
  const missing = need.filter((c) => !rules[c].test(t));
  return missing.length ? R('fail', `CI does not appear to run: ${missing.join(', ')}`) : R('pass', `CI config: ${cap(files, 2)}`);
}

function ciUsesRepoScripts(ctx) {
  const files = ctx.repo.match(CI_GLOBS);
  if (!files.length) return R('na', 'no CI configuration');
  const t = files.map((f) => ctx.repo.read(f)).join('\n');
  const re = /((npm|pnpm|yarn)( run)? (lint|test|build|typecheck)|make (lint|test|check|build)|\bjust \w+|\btox\b|\bnox\b|poetry run|uv run|pre-commit run)/i;
  return re.test(t) ? R('pass', 'CI calls repo scripts') : R('fail', 'CI seems to call raw tools instead of the repo scripts, so CI and local can drift');
}

function typescriptStrict(ctx) {
  let cfgs = ctx.repo.match(['tsconfig.json', 'tsconfig.*.json']).filter((f) => !f.includes('/'));
  if (!cfgs.length) cfgs = ctx.repo.match(['**/tsconfig.json']);
  if (!cfgs.length) return R('fail', 'no tsconfig.json found');
  let unresolved = false;
  const strictOf = (rel, depth) => {
    const j = ctx.repo.json(rel);
    if (!j) return null;
    const co = j.compilerOptions || {};
    if (co.strict === true) return true;
    if (co.strict === false) return false;
    if (j.extends && depth < 4) {
      for (const e of [].concat(j.extends)) {
        if (String(e).startsWith('.')) {
          let p = path.posix.normalize(path.posix.join(path.posix.dirname(rel), e));
          if (!p.endsWith('.json')) p += '.json';
          if (strictOf(p, depth + 1) === true) return true;
        } else unresolved = true;
      }
    }
    return null;
  };
  if (cfgs.some((f) => strictOf(f, 0) === true)) return R('pass', 'strict enabled');
  if (unresolved) return R('cannot-verify', 'tsconfig extends an external preset; confirm "strict" is enabled');
  return R('fail', '"strict" is not enabled in tsconfig');
}

// ------------------------------------------------------------------ environment

function noTrackedEnv(ctx) {
  const pool = ctx.repo.isGit ? [...ctx.repo.tracked()] : ctx.repo.files();
  const bad = pool.filter((f) => /(^|\/)\.env(\.[^/]+)?$/.test(f) && !/\.(example|sample|template|dist|defaults)$/i.test(f));
  return bad.length ? R('fail', `real env file(s) are committed: ${cap(bad)}`) : R('pass', '');
}

function envExampleApplies(ctx) {
  if (ctx.repo.match(['.env', '.env.*']).length) return R('pass', '');
  const re = /(process\.env|import\.meta\.env|os\.environ|os\.getenv|environ\.get|dotenv|django-environ|decouple)/;
  const hit = ctx.repo.match(['**/*.{js,jsx,ts,tsx,mjs,cjs,py}', 'package.json', 'requirements*.txt', 'pyproject.toml']).some((f) => re.test(ctx.repo.read(f)));
  return hit ? R('pass', '') : R('na', 'no environment variables used');
}

function localServices(ctx) {
  const composeGlobs = ['docker-compose*.y*ml', 'compose*.y*ml', '.devcontainer/**', 'devbox.json'];
  const compose = ctx.repo.match(composeGlobs);
  const uses = compose.length > 0 || ctx.repo.hasDep(['psycopg2', 'psycopg2-binary', 'psycopg', 'mysqlclient', 'pymysql', 'pg', 'mysql2', 'redis', 'ioredis', 'pymongo', 'mongoose', 'celery', 'kafkajs', 'amqplib', 'kombu', 'sqlalchemy', 'prisma', 'typeorm', 'sequelize']);
  if (!uses) return R('na', 'no external services detected');
  if (compose.length) return R('pass', 'found ' + cap(compose, 2));
  if (/(docker|compose|postgres|redis|mysql|mongo|database|migrate|seed)/i.test(docs(ctx))) return R('pass', 'services are documented in README/AGENTS.md');
  return R('fail', 'external services detected but no compose file or documented setup');
}

function bootstrapCommand(ctx) {
  const { pkg, make } = commandSurface(ctx);
  const hit = [...pkg].filter((n) => /^(setup|bootstrap|init|dev:setup|install:all|first-run)$/i.test(n)).map((n) => `package.json script "${n}"`)
    .concat([...make].filter((n) => /^(setup|bootstrap|install|init|dev-setup)$/i.test(n)).map((n) => `make ${n}`))
    .concat(ctx.repo.match(['scripts/{setup,bootstrap,install,init}*', 'setup.sh', 'bootstrap.sh']));
  if (hit.length) return R('pass', cap(hit, 2));
  for (const f of ctx.repo.match(['README.md', 'AGENTS.md', 'CONTRIBUTING.md'])) {
    const ls = lines(ctx.repo.read(f));
    for (let i = 0; i < ls.length; i++) {
      if (/^#{1,4}\s+.*(setup|getting started|installation|quick start|install)/i.test(ls[i]) && ls.slice(i + 1, i + 15).some((l) => /^```/.test(l))) return R('pass', `documented in ${f}`);
    }
  }
  return R('fail', 'no setup script or target and no documented setup commands');
}

// ------------------------------------------------------------------ agent context

function agentsMdComplete(ctx) {
  if (!ctx.repo.has('AGENTS.md')) return R('fail', 'AGENTS.md not found');
  const t = ctx.repo.read('AGENTS.md');
  if (nonEmpty(t).length < 12) return R('fail', 'AGENTS.md is almost empty');
  const heads = lines(t).filter((l) => /^#{1,6}\s/.test(l)).join('\n');
  const cats = {
    'commands (setup/build/test)': /(command|setup|install|build|test|run|script)/i,
    'architecture': /(architecture|structure|overview|layout|codebase|directory|folder|project)/i,
    'conventions': /(convention|style|guideline|standard|pattern|practice|rule)/i,
    'boundaries (what not to do)': /(boundar|off-limits|do not|don't|never|avoid|restrict|forbidden|safety|careful)/i,
  };
  const missing = Object.entries(cats).filter(([k, re]) => !(re.test(heads) || (k.startsWith('boundaries') && re.test(t)))).map(([k]) => k);
  if (missing.length > 1) return R('fail', `AGENTS.md is missing sections for: ${missing.join(', ')}`);
  return R('pass', missing.length ? `consider adding: ${missing[0]}` : 'all key sections present');
}

function agentDocsPathsValid(ctx) {
  const files = ctx.repo.match(['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.cursor/rules/*.{md,mdc}', '.github/copilot-instructions.md']);
  if (!files.length) return R('na', 'no agent instruction files');
  const base = new Set(ctx.repo.files().map((f) => f.split('/').pop()));
  const missing = new Set();
  for (const f of files) {
    for (const m of ctx.repo.read(f).matchAll(/`([^`\n]+)`/g)) {
      let tok = m[1].trim();
      if (/\s|:\/\/|[*?{}<>|=()$~@]/.test(tok) || tok.includes('...')) continue;
      tok = tok.replace(/^\.\//, '').replace(/[#:]\d.*$/, '').replace(/[,.;:]+$/, '');
      const isPath = (tok.includes('/') && (/\.[A-Za-z0-9]+$/.test(tok) || tok.endsWith('/'))) || /^[\w.-]+\.(md|mdc|json|ts|tsx|js|jsx|py|ya?ml|toml|cfg|ini|sh)$/.test(tok);
      if (!isPath || tok.startsWith('/')) continue;
      if (ctx.repo.onDisk(tok.replace(/\/$/, ''))) continue;
      if (!tok.includes('/') && base.has(tok)) continue;
      missing.add(tok);
    }
  }
  return missing.size ? R('fail', `referenced paths not found: ${cap([...missing], 5)}`) : R('pass', '');
}

function agentFilesNotDuplicated(ctx) {
  const others = ctx.repo.match(['CLAUDE.md', 'GEMINI.md', '.github/copilot-instructions.md', '.cursorrules']);
  if (!others.length) return R('na', 'no tool-specific instruction files');
  if (!ctx.repo.has('AGENTS.md')) return R('fail', 'tool-specific instruction files exist but there is no AGENTS.md baseline');
  const dup = others.filter((f) => nonEmpty(ctx.repo.read(f)).length > 30 && !/AGENTS\.md/.test(ctx.repo.read(f)));
  return dup.length ? R('fail', `long tool-specific files that do not point to AGENTS.md (possible duplication): ${cap(dup)}`) : R('pass', '');
}

function agentContextSize(ctx) {
  const a = ctx.repo.has('AGENTS.md') ? nonEmpty(ctx.repo.read('AGENTS.md')).length : 0;
  let always = 0;
  for (const f of ctx.repo.match(['.cursor/rules/*.mdc'])) {
    const t = ctx.repo.read(f);
    const fm = frontmatter(t);
    if (fm && fm.alwaysApply === true) always += nonEmpty(t).length;
  }
  if (!a && !always) return R('na', 'no always-on agent context found');
  const probs = [];
  if (a > 400) probs.push(`AGENTS.md has ${a} lines`);
  if (always > 600) probs.push(`always-applied rules total ${always} lines`);
  return probs.length ? R('fail', probs.join('; ') + ' (large always-on context dilutes instructions)') : R('pass', `AGENTS.md ${a} lines, always-on rules ${always} lines`);
}

function agentRulesReferenceConfig(ctx) {
  const files = ctx.repo.match(['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.cursorrules', '.cursor/rules/*.{md,mdc}', '.github/copilot-instructions.md']);
  if (!files.length) return R('na', 'no agent instruction files');
  const restating = /(semicolon|trailing comma|single quote|double quote|indent(ation)? (of )?\d|\b[24][- ]space|tabs? (for|instead)|line length|max-line|print width)/i;
  const referencing = /(prettier|eslint|ruff|\bblack\b|biome|\.editorconfig|lint config|formatter config)/i;
  const flagged = files.filter((f) => restating.test(ctx.repo.read(f)) && !referencing.test(ctx.repo.read(f)));
  return flagged.length ? R('fail', `restates formatting rules without pointing at the shared config: ${cap(flagged)}`) : R('pass', '');
}

function agentIgnoreFile(ctx) {
  const missing = [];
  for (const t of tools.activeTools(ctx.config)) {
    if (t === 'cursor' && !ctx.repo.match(['.cursorignore', '.cursorindexingignore']).length) missing.push('cursor (.cursorignore)');
    if (t === 'claude-code' && !/"deny"\s*:/.test(ctx.repo.read('.claude/settings.json'))) missing.push('claude-code (permissions.deny in .claude/settings.json)');
  }
  return missing.length ? R('fail', `no ignore/deny rules for: ${missing.join(', ')}`) : R('pass', '');
}

// ------------------------------------------------------------------ security

const SPECIFIC = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Stripe live key', /\bsk_live_[A-Za-z0-9]{20,}/],
  ['Sentry auth token', /\bsntry[su]_[A-Za-z0-9+/=_-]{20,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
];
const SENTRY_RULES = [SPECIFIC[6], ['Sentry auth token assignment', /SENTRY_AUTH_TOKEN\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{20,}/]];
const GENERIC = /(?:api[_-]?key|secret|passwd|password|token)\s*[:=]\s*["'][A-Za-z0-9/+_=-]{24,}["']/i;
const GENERIC_SKIP_LINE = /(process\.env|os\.environ|getenv|example|placeholder|your[_-]|changeme|xxxx|<[^>]+>|\$\{)/i;
const SKIP_FILE = /(\.(png|jpe?g|gif|ico|pdf|zip|gz|woff2?|ttf|eot|mp[34]|webp|lock|map)$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|poetry\.lock)$|\.min\.)/i;
const TESTISH = /((^|\/)(tests?|__tests__|fixtures|mocks?|examples?|docs)\/|\.(test|spec)\.|\.(example|sample|template)$|\.md$)/i;

function lineOf(t, re) {
  const ls = lines(t);
  for (let i = 0; i < ls.length; i++) if (re.test(ls[i])) return i + 1;
  return 1;
}

function secretScan(ctx, args) {
  const rules = args.only === 'sentry' ? SENTRY_RULES : SPECIFIC;
  const hits = [];
  for (const f of ctx.repo.files()) {
    if (SKIP_FILE.test(f)) continue;
    const t = ctx.repo.read(f);
    if (!t) continue;
    for (const [kind, re] of rules) if (re.test(t)) hits.push({ kind, file: f, line: lineOf(t, re), generic: false });
    if (!args.only && !TESTISH.test(f) && GENERIC.test(t)) {
      const ls = lines(t);
      const i = ls.findIndex((l) => GENERIC.test(l) && !GENERIC_SKIP_LINE.test(l));
      if (i >= 0) hits.push({ kind: 'possible hard-coded secret', file: f, line: i + 1, generic: true });
    }
  }
  const specific = hits.filter((h) => !h.generic);
  const fmt = (arr) => cap(arr.map((h) => `${h.kind} in ${h.file}:${h.line}`), 4);
  if (specific.length) return R('fail', `${specific.length} credential(s) found (values not shown): ${fmt(specific)}`);
  if (hits.length) return R('warn', `possible hard-coded secret(s), please review (values not shown): ${fmt(hits)}`);
  return R('pass', '');
}

function exampleEnvValues(ctx) {
  const f = ctx.repo.match(ENV_EXAMPLES)[0];
  if (!f) return R('na', 'no .env.example');
  const bad = [];
  for (const l of lines(ctx.repo.read(f))) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(l);
    if (!m) continue;
    const v = m[2].replace(/^["']|["']$/g, '');
    if (/(prod|production)/i.test(v) && /(https?:|@|\.)/.test(v)) bad.push(m[1] + ' (production-looking value)');
    else if (v.length >= 24 && /[A-Za-z]/.test(v) && /\d/.test(v) && !/(example|placeholder|your|change|xxx|<)/i.test(v) && !/[:/]/.test(v)) bad.push(m[1] + ' (looks like a real secret)');
  }
  return bad.length ? R('fail', `${f}: ${cap(bad, 4)}`) : R('pass', '');
}

// ------------------------------------------------------------------ MCP

const REF = /\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*|%[A-Z_][A-Z0-9_]*%|\{\{[^}]+\}\}/;
const SECRETKEY = /(token|secret|password|passwd|api[_-]?key|apikey|auth|bearer|credential)/i;

function readMcp(ctx) {
  const out = [];
  for (const f of tools.mcpFiles(ctx.config)) {
    if (!ctx.repo.onDisk(f)) continue;
    const j = ctx.repo.json(f);
    out.push({ file: f, committed: ctx.repo.isCommitted(f), servers: (j && (j.mcpServers || j.servers)) || {} });
  }
  return out;
}

function mcpConfigCommitted(ctx) {
  const cfgs = readMcp(ctx);
  const mentioned = /\bMCP\b/.test(docs(ctx));
  if (!cfgs.length && !mentioned) return R('na', 'MCP is not used in this project');
  if (!cfgs.length) return R('fail', `MCP is mentioned in the docs but no project-level MCP config was found (${tools.mcpFiles(ctx.config).join(', ')})`);
  const ok = cfgs.filter((c) => c.committed);
  if (!ok.length) return R('fail', `MCP config exists locally but is not committed: ${cfgs.map((c) => c.file).join(', ')}`);
  return R('pass', 'committed: ' + ok.map((c) => c.file).join(', '));
}

function mcpServersDocumented(ctx) {
  const names = [...new Set(readMcp(ctx).flatMap((c) => Object.keys(c.servers)))];
  if (!names.length) return R('na', 'no MCP servers configured');
  const d = docs(ctx).toLowerCase();
  const missing = names.filter((n) => !d.includes(n.toLowerCase()));
  return missing.length ? R('fail', `MCP server(s) not mentioned in README/AGENTS.md/docs: ${missing.join(', ')}`) : R('pass', `${names.length} server(s) documented`);
}

function mcpNoInlineSecrets(ctx) {
  const cfgs = readMcp(ctx);
  if (!cfgs.length) return R('na', 'no project MCP config');
  const bad = [];
  for (const c of cfgs) {
    for (const [name, s] of Object.entries(c.servers)) {
      for (const sect of ['env', 'headers']) {
        for (const [k, v] of Object.entries((s && s[sect]) || {})) {
          if (typeof v === 'string' && v && !REF.test(v) && SECRETKEY.test(k)) bad.push(`${name}.${sect}.${k}`);
        }
      }
      const args = ((s && s.args) || []).map(String);
      args.forEach((a, i) => {
        const m = /^--?([A-Za-z-]*(?:token|secret|password|key|auth)[A-Za-z-]*)(?:=(.+))?$/i.exec(a);
        if (!m) return;
        const v = m[2] !== undefined ? m[2] : args[i + 1];
        if (v && !REF.test(v) && !/^-/.test(v)) bad.push(`${name}.args ${m[1]}`);
      });
      if (s && typeof s.url === 'string' && /[?&](token|key|api_?key|apikey|secret|access_token)=[^&$]+/i.test(s.url) && !REF.test(s.url)) bad.push(`${name}.url query credential`);
    }
  }
  return bad.length ? R('fail', `literal credential(s) in MCP config (values not shown): ${cap(bad, 5)}`) : R('pass', '');
}

function findServers(ctx, match) {
  const re = new RegExp(match, 'i');
  const out = [];
  for (const c of readMcp(ctx)) {
    for (const [name, s] of Object.entries(c.servers)) {
      if (re.test(name) || re.test(JSON.stringify([s && s.command, s && s.args, s && s.url]))) out.push({ file: c.file, name, cfg: s || {} });
    }
  }
  return out;
}

function refNames(servers) {
  const names = new Set();
  for (const s of servers) {
    for (const m of JSON.stringify(s.cfg).matchAll(/\$\{(?:env:)?([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g)) names.add(m[1] || m[2]);
  }
  return [...names];
}

function envNamesIn(t) {
  const m = new Map();
  for (const l of lines(t)) {
    const x = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(l);
    if (x && !/^\s*#/.test(l)) m.set(x[1], x[2].replace(/^["']|["']$/g, ''));
  }
  return m;
}

function mcpServer(ctx, args) {
  const found = findServers(ctx, args.match);
  if (args.require === 'present') {
    return found.length ? R('pass', `server "${found[0].name}" in ${found[0].file}`) : R('fail', `no MCP server matching /${args.match}/ in ${tools.mcpFiles(ctx.config).join(', ')}`);
  }
  if (!found.length) return R('na', 'server not configured');
  const names = refNames(found);
  if (!names.length) return R('pass', 'no environment variables referenced');
  const declared = new Set();
  for (const f of ctx.repo.match(ENV_EXAMPLES)) for (const k of envNamesIn(ctx.repo.read(f)).keys()) declared.add(k);
  const missing = names.filter((n) => !declared.has(n));
  return missing.length ? R('fail', `not declared in .env.example: ${missing.join(', ')}`) : R('pass', `declared: ${names.join(', ')}`);
}

function isSet(ctx, name) {
  if (process.env[name]) return true;
  const v = ctx.repo.onDisk('.env') ? envNamesIn(ctx.repo.read('.env')).get(name) : undefined;
  return Boolean(v);
}

function mcpEnvSet(ctx, args) {
  const names = refNames(findServers(ctx, args.match));
  if (!names.length) return R('na', 'no environment variables referenced');
  const missing = names.filter((n) => !isSet(ctx, n));
  return missing.length ? R('fail', `not set on this machine: ${missing.join(', ')}`) : R('pass', `set: ${names.join(', ')} (values not shown)`);
}

// ------------------------------------------------------------------ conventions, local, misc

function readmeSetupAndRun(ctx) {
  const f = ctx.repo.match(['README.md', 'README', 'README.rst', 'readme.md'])[0];
  if (!f) return R('fail', 'README not found');
  const t = ctx.repo.read(f);
  if (nonEmpty(t).length < 15) return R('fail', 'README is very short');
  const heads = lines(t).filter((l) => /^#{1,6}\s/.test(l)).join('\n');
  const miss = [];
  if (!/(setup|install|getting started|quick start|prerequisite)/i.test(heads)) miss.push('setup/installation');
  if (!/(run|usage|development|start|scripts|commands|build|test)/i.test(heads)) miss.push('how to run');
  return miss.length ? R('fail', `README has no section for: ${miss.join(', ')}`) : R('pass', '');
}

function envVarsSet(ctx) {
  const f = ctx.repo.match(ENV_EXAMPLES)[0];
  if (!f) return R('na', 'no .env.example');
  const names = [...envNamesIn(ctx.repo.read(f)).keys()];
  if (!names.length) return R('na', 'no variables listed');
  const missing = names.filter((n) => !isSet(ctx, n));
  return missing.length ? R('fail', `not set on this machine: ${cap(missing, 6)}`) : R('pass', 'all set (values not shown)');
}

function toolchainMatches(ctx) {
  const problems = [];
  let checked = 0;
  const rangeOk = (pin, cur) => {
    const m = /^\s*(>=|\^|~)?\s*v?(\d+)/.exec(pin);
    if (!m) return true;
    return m[1] === '>=' ? cur >= Number(m[2]) : cur === Number(m[2]);
  };
  if (ctx.stack.has('node')) {
    let pin = null;
    for (const f of ['.nvmrc', '.node-version']) if (ctx.repo.onDisk(f)) { pin = ctx.repo.read(f).trim(); break; }
    if (!pin) { const j = ctx.repo.json('package.json'); pin = (j && j.engines && j.engines.node) || null; }
    if (pin) { checked++; if (!rangeOk(pin, Number(process.versions.node.split('.')[0]))) problems.push(`node: pinned ${pin}, running ${process.versions.node}`); }
  }
  if (ctx.stack.has('python') && ctx.repo.onDisk('.python-version')) {
    const pin = /(\d+)\.(\d+)/.exec(ctx.repo.read('.python-version'));
    const out = run('python3', ['--version']) || run('python', ['--version']);
    const cur = out && /(\d+)\.(\d+)/.exec(out);
    if (pin && cur) { checked++; if (pin[1] !== cur[1] || pin[2] !== cur[2]) problems.push(`python: pinned ${pin[0]}, running ${cur[0]}`); }
    else if (pin && !cur) problems.push('python: not found on PATH');
  }
  if (!checked && !problems.length) return R('na', 'no pinned runtime to compare');
  return problems.length ? R('fail', problems.join('; ')) : R('pass', 'matches pinned versions');
}

function hooksInstalled(ctx) {
  if (!ctx.repo.isGit) return R('na', 'not a git repository');
  const configured = ctx.repo.match(['.husky/*', 'lefthook*.y*ml', '.lefthook*.y*ml', '.pre-commit-config.y*ml', '.githooks/*']).length > 0
    || /"(lint-staged|simple-git-hooks|husky)"\s*:/.test(ctx.repo.read('package.json'));
  if (!configured) return R('na', 'no hook tool configured (see pre-commit-configured)');
  const hp = (run('git', ['-C', ctx.repo.root, 'config', '--get', 'core.hooksPath']) || '').trim();
  const dir = hp ? path.resolve(ctx.repo.root, hp) : path.resolve(ctx.repo.root, (run('git', ['-C', ctx.repo.root, 'rev-parse', '--git-path', 'hooks']) || '.git/hooks').trim());
  return fs.existsSync(path.join(dir, 'pre-commit')) ? R('pass', 'pre-commit hook is installed') : R('fail', 'hooks are configured in the repo but not installed in this clone');
}

function ghCliAuth() {
  const v = sh('gh', ['--version']);
  if (v.error || v.status !== 0) return R('fail', 'gh CLI is not installed');
  return sh('gh', ['auth', 'status']).status === 0 ? R('pass', 'gh is authenticated') : R('fail', 'gh is not authenticated');
}

function nestedAgentDocs(ctx) {
  const j = ctx.repo.json('package.json');
  const mono = ctx.repo.match(['pnpm-workspace.yaml', 'lerna.json', 'nx.json', 'turbo.json', 'rush.json']).length > 0 || Boolean(j && j.workspaces);
  if (!mono) return R('na', 'not a monorepo');
  const nested = ctx.repo.match(['**/AGENTS.md']).filter((f) => f !== 'AGENTS.md');
  return nested.length ? R('pass', 'found ' + cap(nested, 2)) : R('fail', 'monorepo detected but no per-package AGENTS.md');
}

function testsAvoidNetwork(ctx) {
  return ctx.repo.hasDep(['msw', 'nock', 'responses', 'requests-mock', 'vcrpy', 'pytest-httpx', 'pytest-socket', 'respx', 'httpretty', 'jest-fetch-mock', 'fetch-mock', '@pollyjs/*'])
    ? R('pass', 'HTTP mocking library found')
    : R('fail', 'no HTTP mocking or network-blocking library found; tests may hit real services');
}

function branchProtectionReviews(ctx) {
  if (ctx.mode === 'ci') return R('cannot-verify', 'branch protection needs gh on a developer machine; skipped in CI');
  const v = sh('gh', ['--version']);
  if (v.error || v.status !== 0) return R('cannot-verify', 'gh CLI is not installed');
  const repo = sh('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { cwd: ctx.repo.root });
  if (repo.status !== 0 || !repo.stdout.trim()) return R('cannot-verify', 'could not resolve the GitHub repo with gh');
  const name = repo.stdout.trim();
  const def = sh('gh', ['api', `repos/${name}`, '--jq', '.default_branch']);
  if (def.status !== 0) return R('cannot-verify', 'could not read the default branch');
  const branch = def.stdout.trim() || 'main';
  const prot = sh('gh', ['api', `repos/${name}/branches/${branch}/protection/required_pull_request_reviews`]);
  if (prot.status === 0) return R('pass', `required reviews on ${branch}`);
  if (/404/.test(prot.stderr || '') || /Not Found/.test(prot.stderr || '')) return R('fail', `no required pull request reviews on ${branch}`);
  return R('cannot-verify', 'could not read branch protection (need admin:repo scope or the repo is private without access)');
}

function skillsWellFormed(ctx) {
  const { indexSkills } = require('./skills');
  const index = indexSkills(ctx.repo, ctx.config);
  const repoSkills = index.filter((s) => s.scope === 'repo' && s.committed && /SKILL\.md$/i.test(s.path || ''));
  if (!repoSkills.length) return R('na', 'no committed SKILL.md files');
  const bad = repoSkills.filter((s) => !s.wellFormed);
  return bad.length
    ? R('fail', `malformed skill(s): ${cap(bad.map((s) => `${s.name} (${(s.issues || []).join('; ')})`))}`)
    : R('pass', `${repoSkills.length} committed skill(s) well-formed`);
}

module.exports = {
  'canonical-commands': canonicalCommands,
  'agent-docs-commands-valid': agentDocsCommandsValid,
  'single-test-documented': singleTestDocumented,
  'ci-runs-quality-gates': ciRuns,
  'ci-uses-repo-scripts': ciUsesRepoScripts,
  'typescript-strict': typescriptStrict,
  'no-tracked-env': noTrackedEnv,
  'env-example-applies': envExampleApplies,
  'local-services': localServices,
  'bootstrap-command': bootstrapCommand,
  'agents-md-complete': agentsMdComplete,
  'agent-docs-paths-valid': agentDocsPathsValid,
  'agent-files-not-duplicated': agentFilesNotDuplicated,
  'agent-context-size': agentContextSize,
  'agent-rules-reference-config': agentRulesReferenceConfig,
  'agent-ignore-file': agentIgnoreFile,
  'secret-scan': secretScan,
  'example-env-values': exampleEnvValues,
  'mcp-config-committed': mcpConfigCommitted,
  'mcp-servers-documented': mcpServersDocumented,
  'mcp-no-inline-secrets': mcpNoInlineSecrets,
  'mcp-server': mcpServer,
  'mcp-env-set': mcpEnvSet,
  'readme-setup-and-run': readmeSetupAndRun,
  'env-vars-set': envVarsSet,
  'toolchain-matches': toolchainMatches,
  'hooks-installed': hooksInstalled,
  'gh-cli-auth': ghCliAuth,
  'nested-agent-docs': nestedAgentDocs,
  'tests-avoid-network': testsAvoidNetwork,
  'branch-protection-reviews': branchProtectionReviews,
  'skills-well-formed': skillsWellFormed,
  // exported for the engine / skill index
  _refNames: refNames,
  _findServers: findServers,
};
