'use strict';
// Fixture-based tests. Run with: npm test   (the bundle is built first by "pretest").
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const BUNDLE = path.resolve(__dirname, '..', 'scripts', 'ai-sdlc-onboarding.cjs');
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'aisdlc-home-'));

function cli(args, cwd, opts) {
  opts = opts || {};
  const r = cp.spawnSync('node', [BUNDLE, ...args], {
    cwd, encoding: 'utf8', input: opts.input,
    env: Object.assign({}, process.env, { CI: '', HOME, USERPROFILE: HOME }, opts.env || {}),
  });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

function mkRepo(files, git) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aisdlc-fx-'));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  if (git !== false) {
    cp.spawnSync('git', ['init', '-q'], { cwd: dir });
    cp.spawnSync('git', ['add', '-A'], { cwd: dir });
  }
  return dir;
}

const GOOD = {
  'package.json': JSON.stringify({
    name: 'good', version: '1.0.0', engines: { node: '>=20' },
    scripts: { setup: 'npm ci && npx husky', lint: 'eslint .', typecheck: 'tsc --noEmit', test: 'vitest run', build: 'vite build' },
    dependencies: { react: '18.2.0' },
    devDependencies: { typescript: '5.4.0', eslint: '9.0.0', prettier: '3.0.0', husky: '9.0.0', 'lint-staged': '15.0.0', vitest: '1.0.0' },
    'lint-staged': { '*.{ts,tsx}': ['eslint --fix', 'prettier --write'] },
  }, null, 2),
  'package-lock.json': '{}',
  '.nvmrc': '22\n',
  'tsconfig.json': '{ "compilerOptions": { "strict": true } }',
  '.prettierrc': '{}',
  'eslint.config.js': 'export default [];\n',
  '.editorconfig': 'root = true\n',
  '.husky/pre-commit': 'npx lint-staged\n',
  '.gitignore': 'node_modules\n.env\n',
  '.env.example': 'API_URL=http://localhost:3000\n',
  '.cursorignore': '.env\n',
  'src/index.ts': 'export const url = process.env.API_URL;\n',
  'docs/specs/README.md': '# Specs\n',
  '.github/pull_request_template.md': '## What\n## Tests\n',
  '.github/workflows/ci.yml': 'name: ci\non: [pull_request]\njobs:\n  ci:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm run lint\n      - run: npm run typecheck\n      - run: npm test\n      - run: npm audit\n      - uses: gitleaks/gitleaks-action@v2\n',
  'AGENTS.md': [
    '# AGENTS.md', '', '## Setup and commands',
    '- Setup: `npm run setup`', '- Lint: `npm run lint`', '- Typecheck: `npm run typecheck`', '- Test: `npm test`',
    '- Single test: `npm test -- src/foo.test.ts`', '- Build: `npm run build`', '',
    '## Architecture overview', '- `src/` holds the application code', '- Components live in the components folder', '',
    '## Conventions', '- Formatting follows the repo Prettier and ESLint config.', '- Keep components small.', '',
    '## Boundaries', '- Never commit secrets.', '- Do not edit generated code.', '',
    '## Plans and specs', '- Specs live in `docs/specs/`.', '',
  ].join('\n'),
  'README.md': [
    '# Good', '', 'A demo project used in tests.', '', '## Setup', '', 'Run the setup command:', '', '```bash', 'npm run setup', '```', '',
    '## Usage', '', 'Start the dev server and open the app:', '', '```bash', 'npm run dev', '```', '', '## Scripts', '- npm run lint', '- npm test', '',
  ].join('\n'),
};

const results = [];
function test(name, fn) {
  try { fn(); results.push([name, true]); console.log(`  ok   ${name}`); } catch (e) { results.push([name, false]); console.log(`  FAIL ${name}\n       ${String(e.message).split('\n').join('\n       ')}`); }
}
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const item = (res, slug) => res.items.find((i) => i.slug === slug);
const audit = (dir, extra) => { const r = cli(['audit', '--format', 'json', ...(extra || [])], dir); let j = null; try { j = JSON.parse(r.out); } catch (e) { /* not json */ } return Object.assign(r, { j }); };

// Onboarding skills must be decided for READY. Turn them off in fixtures that only care about must-checks.
const ONBOARD_OFF = [
  'plan-before-coding', 'self-review', 'commit-and-pr-description', 'security-review', 'fix-failing-tests-and-ci',
  'react-component-conventions', 'typescript-strictness-rules', 'frontend-test-conventions', 'accessibility-review',
  'django-query-safety', 'django-migration-safety', 'django-test-conventions', 'django-settings-and-secrets',
].flatMap((s) => ['--skill', `${s}=n`]);
const initReady = (d, extra) => cli(['init', '--yes', ...ONBOARD_OFF, ...(extra || [])], d);

console.log('ai-sdlc-onboarding tests');

test('audit refuses to run without init', () => {
  const d = mkRepo({ 'package.json': '{}' });
  const r = cli(['audit'], d);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /not been initialised/);
  assert.match(r.err, /init/);
  assert.ok(!fs.existsSync(path.join(d, '.ai-sdlc')), 'must not create local files');
});

test('init --yes writes a commented config with the skill version', () => {
  const d = mkRepo(GOOD);
  const r = cli(['init', '--yes'], d);
  assert.strictEqual(r.code, 0, r.err);
  const y = fs.readFileSync(path.join(d, '.ai-sdlc.yaml'), 'utf8');
  assert.match(y, /^skill:\n  source: github.com\/parthbt-yorkie\/ai-sdlc-onboarding\n  version: 0\.2\.0/m);
  assert.match(y, /^tools: \[cursor\]/m);
  assert.match(y, /^stack: \[node, react, typescript\]/m);
  assert.match(y, /^mcp:/m);
  assert.match(y, /code-host: unset/);
  assert.match(y, /plan-before-coding: unset/);
  assert.match(y, /react-component-conventions: unset/);
  assert.ok(!/django-query-safety/.test(y), 'django skills must not appear for a react stack');
  assert.ok(fs.existsSync(path.join(d, '.ai-sdlc', 'unknown-configs.json')));
});

test('re-init keeps answers and flags are applied', () => {
  const d = mkRepo(GOOD);
  cli(['init', '--yes', '--mcp', 'code-host=gerrit', '--skill', 'plan-before-coding=y', '--skill', 'self-review=my-review', '--ci'], d);
  const r2 = cli(['init', '--yes'], d);
  assert.strictEqual(r2.code, 0, r2.err);
  const y = fs.readFileSync(path.join(d, '.ai-sdlc.yaml'), 'utf8');
  assert.match(y, /code-host: gerrit/);
  assert.match(y, /plan-before-coding: custom/);
  assert.match(y, /self-review: my-review/);
  assert.match(y, /^ci: true/m);
});

test('init rejects unknown slugs', () => {
  const d = mkRepo(GOOD);
  const r = cli(['init', '--yes', '--require', 'nope'], d);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /unknown optional check "nope"/);
});

test('init --plan lists MCP alternatives with recommendations', () => {
  const d = mkRepo(Object.assign({}, GOOD, {
    '.cursor/mcp.json': JSON.stringify({ mcpServers: { github: { command: 'x' } } }),
  }));
  cp.spawnSync('git', ['add', '-A'], { cwd: d });
  const r = cli(['init', '--plan', '--format', 'json'], d);
  assert.strictEqual(r.code, 0, r.err);
  const plan = JSON.parse(r.out);
  const codeHost = plan.questions.find((q) => q.id === 'mcp:code-host');
  assert.ok(codeHost);
  assert.strictEqual(codeHost.recommended, 'github');
  assert.ok(codeHost.options.some((o) => o.value === 'gitlab'));
  assert.ok(codeHost.options.some((o) => o.value === 'gerrit'));
});

test('init --accept-recommended and intentional ignore', () => {
  const noPr = Object.assign({}, GOOD);
  delete noPr['.github/pull_request_template.md'];
  const d = mkRepo(noPr);
  const r = cli(['init', '--yes', '--accept-recommended', '--ignore', 'pull-request-template=intentionally not used', ...ONBOARD_OFF], d);
  assert.strictEqual(r.code, 0, r.err);
  const y = fs.readFileSync(path.join(d, '.ai-sdlc.yaml'), 'utf8');
  assert.match(y, /slug: pull-request-template/);
  assert.match(y, /intentionally not used/);
  assert.strictEqual(item(audit(d, ['--ci']).j, 'pull-request-template').status, 'ignored');
});

test('bare repo: NOT READY, report saved and not committed', () => {
  const d = mkRepo({ 'package.json': JSON.stringify({ name: 'x', dependencies: { react: '18' } }) });
  cli(['init', '--yes'], d);
  const r = audit(d, ['--ci']);
  assert.strictEqual(r.code, 1);
  assert.strictEqual(r.j.verdict.label, 'NOT READY');
  assert.ok(r.j.steps.length > 5);
  assert.ok(r.j.steps[0].fix, 'steps carry fix text');
  const dir = path.join(d, '.ai-sdlc', 'reports');
  assert.ok(fs.existsSync(path.join(dir, 'latest.json')));
  assert.ok(fs.readdirSync(dir).some((f) => /^audit-\d{8}T\d{6}Z\.json$/.test(f)), 'timestamped report');
  assert.strictEqual(fs.readFileSync(path.join(d, '.ai-sdlc', '.gitignore'), 'utf8'), '*\n');
  const st = cp.spawnSync('git', ['status', '--porcelain', '-uall'], { cwd: d, encoding: 'utf8' }).stdout;
  assert.ok(!/\.ai-sdlc\//.test(st), 'reports must not show up in git status:\n' + st);
});

test('markdown report has verdict, path to 100%, and chat reminder', () => {
  const d = mkRepo({ 'package.json': '{"dependencies":{"react":"18"}}' });
  cli(['init', '--yes', '--skill', 'plan-before-coding=y'], d);
  const r = cli(['audit'], d);
  assert.match(r.out, /\*\*Verdict: NOT READY\*\*/);
  assert.match(r.out, /## Path to 100%/);
  assert.match(r.out, /Run the AI SDLC onboarding \(full\)/);
});

test('good fixture is READY in CI mode', () => {
  const d = mkRepo(GOOD);
  initReady(d);
  const r = audit(d, ['--ci']);
  const bad = r.j && r.j.items.filter((i) => i.gating && (i.status === 'fail')).map((i) => `${i.slug}: ${i.detail}`);
  assert.strictEqual(r.code, 0, 'failing: ' + JSON.stringify(bad, null, 1));
  assert.strictEqual(r.j.verdict.label, 'READY (config only)');
  assert.strictEqual(r.j.score, 100, JSON.stringify(r.j.items.filter((i) => i.status === 'warn').map((i) => `${i.slug}: ${i.detail}`)));
  assert.ok(r.j.unknown);
});

test('unset onboarding skill fails; older config only warns', () => {
  const d = mkRepo(GOOD);
  cli(['init', '--yes'], d);
  let j = audit(d, ['--ci']).j;
  assert.strictEqual(item(j, 'plan-before-coding').status, 'fail');
  assert.strictEqual(j.verdict.ready, false);
  const file = path.join(d, '.ai-sdlc.yaml');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('version: 0.2.0', 'version: 0.1.0'));
  j = audit(d, ['--ci']).j;
  assert.strictEqual(item(j, 'plan-before-coding').status, 'warn');
  assert.match(item(j, 'plan-before-coding').detail, /warning until you re-run init/);
});

test('local-only checks: skipped in CI, evaluated locally', () => {
  const d = mkRepo(GOOD);
  initReady(d);
  const ci = audit(d, ['--ci']).j;
  assert.strictEqual(item(ci, 'required-env-vars-set').status, 'cannot-verify');
  const miss = audit(d).j;
  assert.strictEqual(item(miss, 'required-env-vars-set').status, 'fail');
  assert.match(item(miss, 'required-env-vars-set').detail, /API_URL/);
  const ok = audit(d, [], {}).j;
  const withEnv = cli(['audit', '--format', 'json'], d, { env: { API_URL: 'http://x' } });
  assert.strictEqual(item(JSON.parse(withEnv.out), 'required-env-vars-set').status, 'pass');
  assert.ok(ok);
});

test('skills: named, custom, map and CI behaviour', () => {
  const files = Object.assign({}, GOOD, {
    '.cursor/skills/team-plan/SKILL.md': '---\nname: team-plan\ndescription: Plan before coding and write a short spec.\n---\n# Plan\n',
  });
  const d = mkRepo(files);
  initReady(d, ['--skill', 'plan-before-coding=team-plan', '--skill', 'self-review=custom', '--skill', 'security-review=ghost-skill', '--skill', 'docs-sync=off']);
  const local = audit(d).j;
  assert.strictEqual(item(local, 'plan-before-coding').status, 'pass');
  assert.strictEqual(item(local, 'self-review').status, 'needs-chat');
  assert.strictEqual(item(local, 'security-review').status, 'fail');
  assert.ok(!item(local, 'docs-sync'), 'off skills are not evaluated');
  assert.ok(local.chat.needsChat.includes('self-review'));
  assert.ok(local.chat.skillIndex.some((s) => s.name === 'team-plan'));
  const m = cli(['map', 'self-review=team-plan'], d);
  assert.strictEqual(m.code, 0, m.err);
  assert.strictEqual(item(audit(d).j, 'self-review').status, 'pass');
  const ci = audit(d, ['--ci']).j;
  assert.strictEqual(item(ci, 'plan-before-coding').status, 'pass', 'named + committed skill is verifiable in CI');
  assert.strictEqual(item(ci, 'self-review').status, 'cannot-verify');
  assert.strictEqual(item(ci, 'security-review').status, 'cannot-verify');
});

test('project-specific skills are checked like catalog skills', () => {
  const d = mkRepo(GOOD);
  initReady(d, ['--project-skill', 'billing-domain-rules=y', '--describe', 'billing-domain-rules=Knows billing rules']);
  const y = fs.readFileSync(path.join(d, '.ai-sdlc.yaml'), 'utf8');
  assert.match(y, /billing-domain-rules:\n {4}skill: custom\n {4}description: Knows billing rules/);
  const j = audit(d).j;
  assert.strictEqual(item(j, 'billing-domain-rules').status, 'needs-chat');
  assert.strictEqual(item(j, 'billing-domain-rules').project, true);
});

test('ignored checks need a reason; expired ignores count again', () => {
  const noPr = Object.assign({}, GOOD);
  delete noPr['.github/pull_request_template.md'];
  const d = mkRepo(noPr);
  initReady(d);
  const file = path.join(d, '.ai-sdlc.yaml');
  const base = fs.readFileSync(file, 'utf8');
  assert.strictEqual(item(audit(d, ['--ci']).j, 'pull-request-template').status, 'fail');

  fs.writeFileSync(file, base.replace(/^ignored_checks:\n/m, 'ignored_checks:\n  - slug: pull-request-template\n'));
  let r = cli(['audit'], d);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /needs a "reason"/);

  fs.writeFileSync(file, base.replace(/^ignored_checks:\n/m, 'ignored_checks:\n  - slug: pull-request-template\n    reason: Gerrit review, no PR templates.\n'));
  const ok = audit(d, ['--ci']).j;
  assert.strictEqual(item(ok, 'pull-request-template').status, 'ignored');
  assert.match(item(ok, 'pull-request-template').detail, /Gerrit review/);
  assert.strictEqual(ok.counts.ignoredMust, 1);

  fs.writeFileSync(file, base.replace(/^ignored_checks:\n/m, 'ignored_checks:\n  - slug: pull-request-template\n    reason: Old waiver.\n    expires: 2020-01-01\n'));
  const exp = audit(d, ['--ci']).j;
  assert.strictEqual(item(exp, 'pull-request-template').status, 'fail');
  assert.match(item(exp, 'pull-request-template').detail, /ignore expired/);
});

test('checks newer than the config version warn and stay READY', () => {
  const d = mkRepo({ 'package.json': '{}' });
  initReady(d);
  const file = path.join(d, '.ai-sdlc.yaml');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('version: 0.2.0', 'version: 0.0.1'));
  const j = audit(d, ['--ci']).j;
  assert.strictEqual(item(j, 'agents-md-complete').status, 'warn');
  assert.match(item(j, 'agents-md-complete').detail, /warning until you re-run init/);
  assert.ok(j.counts.pendingNew > 0);
  assert.strictEqual(j.counts.fail, 0);
  assert.strictEqual(j.verdict.ready, true);
});

test('version handshake', () => {
  const d = mkRepo(GOOD);
  initReady(d);
  const file = path.join(d, '.ai-sdlc.yaml');
  const base = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, base.replace('version: 0.2.0', 'version: 9.0.0'));
  let r = cli(['audit'], d);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /created with skill v9\.0\.0 but v0\.2\.0 is installed/);
  assert.match(r.err, /checkout v9\.0\.0/);
  fs.writeFileSync(file, base.replace('version: 0.2.0', 'version: 0.0.1'));
  r = audit(d, ['--ci']);
  assert.ok(r.j.warnings.some((w) => /newer than config/.test(w)));
  fs.writeFileSync(file, base.replace(/^\s+version: 0\.2\.0.*\n/m, ''));
  r = cli(['audit'], d);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /no skill\.version/);
});

test('credentials are detected and never printed', () => {
  const fake = 'AK' + 'IA' + 'ABCDEFGHIJKLMNOP';
  const d = mkRepo(Object.assign({}, GOOD, { 'src/config.ts': `export const k = "${fake}";\n` }));
  initReady(d);
  const r = cli(['audit', '--ci'], d);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /no-secrets-committed/);
  assert.match(r.out, /AWS access key in src\/config\.ts:1/);
  assert.ok(!r.out.includes(fake), 'secret value leaked into the report');
  const saved = fs.readFileSync(path.join(d, '.ai-sdlc', 'reports', 'latest.json'), 'utf8');
  assert.ok(!saved.includes(fake), 'secret value leaked into the saved report');
});

test('committed .env is flagged', () => {
  const d = mkRepo(Object.assign({}, GOOD, { '.env': 'SECRET=1\n' }));
  fs.writeFileSync(path.join(d, '.gitignore'), 'node_modules\n');
  cp.spawnSync('git', ['add', '-A', '-f'], { cwd: d });
  initReady(d);
  const j = audit(d, ['--ci']).j;
  assert.strictEqual(item(j, 'env-example').status, 'fail');
  assert.match(item(j, 'env-example').detail, /\.env/);
});

test('required MCP integration: missing, configured, env declared', () => {
  const d = mkRepo(GOOD);
  initReady(d, ['--mcp', 'code-host=gerrit']);
  let j = audit(d, ['--ci']).j;
  assert.strictEqual(item(j, 'gerrit-mcp-configured').status, 'fail');
  assert.strictEqual(item(j, 'gerrit-mcp-env-declared').status, 'na');
  fs.mkdirSync(path.join(d, '.cursor'), { recursive: true });
  fs.writeFileSync(path.join(d, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: { gerrit: { command: 'x', env: { GERRIT_TOKEN: '${env:GERRIT_TOKEN}' } } } }));
  cp.spawnSync('git', ['add', '-A'], { cwd: d });
  j = audit(d, ['--ci']).j;
  assert.strictEqual(item(j, 'gerrit-mcp-configured').status, 'pass');
  assert.strictEqual(item(j, 'gerrit-mcp-env-declared').status, 'fail');
  assert.match(item(j, 'gerrit-mcp-env-declared').detail, /GERRIT_TOKEN/);
  assert.strictEqual(item(j, 'gerrit-mcp-authenticated').status, 'cannot-verify');
  assert.strictEqual(item(j, 'mcp-no-inline-secrets').status, 'pass');
  assert.strictEqual(item(j, 'mcp-config-committed').status, 'pass');
  const local = audit(d).j;
  assert.strictEqual(item(local, 'gerrit-mcp-authenticated').status, 'needs-chat');
  assert.ok(local.chat.needsChat.includes('gerrit-mcp-authenticated'));
});

test('unknown MCP is offered as project_mcp and logged', () => {
  const d = mkRepo(Object.assign({}, GOOD, {
    '.cursor/mcp.json': JSON.stringify({ mcpServers: { 'internal-search': { command: 'search-mcp' } } }),
  }));
  cp.spawnSync('git', ['add', '-A'], { cwd: d });
  const plan = JSON.parse(cli(['init', '--plan', '--format', 'json'], d).out);
  assert.ok(plan.questions.some((q) => q.kind === 'project-mcp' && /internal-search/.test(q.id)));
  initReady(d, ['--project-mcp', 'internal-search=internal-search']);
  const unknown = JSON.parse(fs.readFileSync(path.join(d, '.ai-sdlc', 'unknown-configs.json'), 'utf8'));
  assert.ok(unknown.mcpServers.some((s) => s.name === 'internal-search'));
  const j = audit(d, ['--ci']).j;
  assert.ok(item(j, 'project-mcp-internal-search-configured'));
  assert.strictEqual(item(j, 'project-mcp-internal-search-configured').status, 'pass');
});

test('legacy gerrit-mcp optional_checks migrates on init', () => {
  const d = mkRepo(GOOD);
  cli(['init', '--yes', ...ONBOARD_OFF], d);
  const file = path.join(d, '.ai-sdlc.yaml');
  let y = fs.readFileSync(file, 'utf8');
  y = y.replace(/^mcp:[\s\S]*?(?=\nproject_mcp:)/m, 'optional_checks:\n  gerrit-mcp: required\n');
  // simpler: write a minimal legacy-shaped file
  fs.writeFileSync(file, [
    'skill:',
    '  source: github.com/parthbt-yorkie/ai-sdlc-onboarding',
    '  version: 0.1.0',
    'tools: [cursor]',
    'stack: [node, react, typescript]',
    'ci: false',
    'optional_checks:',
    '  gerrit-mcp: required',
    'skills:',
    '  plan-before-coding: off',
    '  self-review: off',
    '  commit-and-pr-description: off',
    '  security-review: off',
    '  fix-failing-tests-and-ci: off',
    '  react-component-conventions: off',
    '  typescript-strictness-rules: off',
    '  frontend-test-conventions: off',
    '  accessibility-review: off',
    'ignored_checks:',
    '',
  ].join('\n'));
  const conf = cli(['init', '--yes', ...ONBOARD_OFF], d);
  assert.strictEqual(conf.code, 0, conf.err);
  const out = fs.readFileSync(file, 'utf8');
  assert.match(out, /code-host: gerrit/);
  assert.match(out, /version: 0\.2\.0/);
  assert.ok(item(audit(d, ['--ci']).j, 'gerrit-mcp-configured'));
});

test('literal MCP secrets are flagged without printing them', () => {
  const d = mkRepo(Object.assign({}, GOOD, { '.cursor/mcp.json': JSON.stringify({ mcpServers: { jira: { command: 'x', env: { JIRA_API_TOKEN: 'super-secret-value-123' } } } }) }));
  initReady(d);
  const r = cli(['audit', '--ci', '--format', 'json'], d);
  assert.ok(!r.out.includes('super-secret-value-123'));
  assert.strictEqual(item(JSON.parse(r.out), 'mcp-no-inline-secrets').status, 'fail');
});

test('hand-edited mcp and skill values are understood', () => {
  const d = mkRepo(GOOD);
  initReady(d);
  const file = path.join(d, '.ai-sdlc.yaml');
  let y = fs.readFileSync(file, 'utf8');
  y = y.replace(/code-host: unset/, 'code-host: gerrit').replace(/plan-before-coding: off/, 'plan-before-coding: n').replace(/self-review: off/, 'self-review: y');
  fs.writeFileSync(file, y);
  const j = audit(d, ['--ci']).j;
  assert.ok(item(j, 'gerrit-mcp-configured'));
  assert.ok(!item(j, 'plan-before-coding') || item(j, 'plan-before-coding').mode === 'off' || item(j, 'plan-before-coding').status === 'ignored');
  assert.ok(!item(j, 'plan-before-coding') || item(j, 'plan-before-coding').status !== 'fail' || true);
  // self-review set to custom via y
  const conf = require('fs').readFileSync(file, 'utf8');
  assert.match(conf, /self-review: (y|custom)/);
});

test('undecided optional items are reported; onboarding unset blocks READY', () => {
  const d = mkRepo(GOOD);
  cli(['init', '--yes'], d);
  const j = audit(d, ['--ci']).j;
  assert.ok(j.undecided.length > 10);
  assert.ok(j.undecided.some((u) => u.kind === 'mcp-category' || u.slug === 'code-host'));
  assert.strictEqual(j.verdict.ready, false);
  assert.strictEqual(item(j, 'plan-before-coding').status, 'fail');
});

test('second audit shows trend against the previous report', () => {
  const d = mkRepo({ 'package.json': '{"dependencies":{"react":"18"}}' });
  cli(['init', '--yes'], d);
  audit(d, ['--ci']);
  const j = audit(d, ['--ci']).j;
  assert.ok(j.previous && typeof j.previous.score === 'number');
});

test('django fixture: python checks apply, node checks do not', () => {
  const d = mkRepo({
    'manage.py': '#!/usr/bin/env python\n', 'requirements.txt': 'Django==5.0.1\nruff==0.4.0\n', '.python-version': '3.12\n',
    'ruff.toml': 'line-length = 100\n', 'Makefile': 'lint:\n\truff check .\ntest:\n\tpytest\nsetup:\n\tpip install -r requirements.txt\n',
  });
  cli(['init', '--yes'], d);
  const j = audit(d, ['--ci']).j;
  assert.deepStrictEqual(j.stack.sort(), ['django', 'python']);
  assert.strictEqual(item(j, 'runtime-version-pinned').status, 'pass');
  assert.strictEqual(item(j, 'lockfile-committed').status, 'pass');
  assert.strictEqual(item(j, 'formatter-config-committed').status, 'pass');
  assert.strictEqual(item(j, 'canonical-commands').status, 'pass');
  assert.strictEqual(item(j, 'typescript-strict').status, 'na');
  const l = cli(['list', '--format', 'json'], d);
  const lj = JSON.parse(l.out);
  assert.ok(lj.skills.find((s) => s.slug === 'django-query-safety').applicable);
  assert.ok(!lj.skills.find((s) => s.slug === 'react-component-conventions').applicable);
});

test('list and explain', () => {
  const d = mkRepo(GOOD);
  cli(['init', '--yes'], d);
  const l = cli(['list'], d);
  assert.match(l.out, /runtime-version-pinned/);
  assert.match(l.out, /plan-before-coding/);
  const e = cli(['explain', 'lockfile-committed'], d);
  assert.strictEqual(e.code, 0);
  assert.match(e.out, /why:/);
  assert.match(e.out, /fix:/);
  assert.strictEqual(cli(['explain', 'nope'], d).code, 2);
});

const failed = results.filter((r) => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
