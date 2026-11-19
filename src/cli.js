#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCatalog } = require('./catalog');
const { loadConfig, CONFIG_FILE, wrap, stackMatches, normSkill, providerRequired } = require('./config');
const { runAudit, TRIGGER_PHRASE } = require('./engine');
const { renderMarkdown } = require('./report');
const { runInit } = require('./init');
const { Repo } = require('./repo');
const { detectStack } = require('./stack');
const { indexSkills } = require('./skills');
const local = require('./local');
const semver = require('./semver');
const tools = require('./tools');

const SKILL_DIR = path.resolve(__dirname, '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, 'package.json'), 'utf8')).version;
const VALUE_FLAGS = new Set(['root', 'format', 'tools', 'stack', 'require', 'off', 'skill', 'project-skill', 'describe', 'mode', 'mcp', 'project-mcp', 'ignore']);
const REPEAT_FLAGS = new Set(['skill', 'project-skill', 'describe', 'mcp', 'project-mcp', 'ignore']);

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x.startsWith('--')) {
      const eq = x.indexOf('=');
      const k = eq < 0 ? x.slice(2) : x.slice(2, eq);
      const inline = eq < 0 ? undefined : x.slice(eq + 1);
      if (VALUE_FLAGS.has(k)) {
        const v = inline !== undefined ? inline : argv[++i];
        if (REPEAT_FLAGS.has(k)) (a[k] = a[k] || []).push(v); else a[k] = v;
      } else a[k] = true;
    } else a._.push(x);
  }
  return a;
}

const HELP = `ai-sdlc-onboarding v${VERSION}: is this project ready for AI-assisted development?

Usage: node <skill-folder>/scripts/ai-sdlc-onboarding.cjs <command> [options]

Commands
  init                 Onboard / create or update .ai-sdlc.yaml (scans the repo, asks with recommendations)
  audit                Check the project against .ai-sdlc.yaml, print the report, save it to .ai-sdlc/reports/
  list                 Show every check/skill slug with its current state
  explain <slug>       Show what a check or skill means, how it is detected and how to fix it
  map <slug>=<name>    Remember which skill YOU use for a "custom" skill (personal, not committed)
  map <slug> --remove  Forget that mapping

Common options
  --root <dir>         Project folder (default: current folder)
  --ci                 audit: CI mode, configuration only (also when CI=true or CI=1). On init, sets ci: true in the config instead.
  --format json        Machine-readable output (audit, list, init --plan)
  --no-save            audit: do not write .ai-sdlc/reports/
  --all                audit: also evaluate optional checks still unset. They do not affect the score or verdict. off stays skipped.

init options (for scripts and agents; skip the questions)
  --yes                Do not ask questions; keep existing answers, mark new items "unset"
  --plan               Print the question plan (use with --format json for chat onboarding)
  --accept-recommended Apply every recommendation from the scan without asking
  --interactive        Ask questions even when not attached to a terminal
  --tools a,b          cursor, claude-code
  --stack a,b          node, typescript, react, python, django
  --require slug,slug  Mark optional checks as required
  --off slug,slug      Mark optional checks as not used
  --mcp cat=provider[,provider]|off|unset   (repeatable)
  --project-mcp name=match   Require an unknown MCP server (repeatable)
  --skill slug=value   value: y | n | custom | off | <skill-name>   (repeatable)
  --project-skill slug=value   Add a project-specific skill (repeatable); describe it with
  --describe slug=text
  --ignore slug=reason Mark a check as intentionally skipped
  --ci                 Set ci: true (this project runs the audit in CI). This is not audit's CI mode.
  --force              Rewrite a config that has errors

Exit codes: 0 ready, 1 not ready, 2 usage/config problem.
`;

function cliHint(root) {
  const bundle = process.argv[1] ? path.resolve(process.argv[1]) : path.join(SKILL_DIR, 'scripts', 'ai-sdlc-onboarding.cjs');
  const rel = path.relative(root, bundle);
  return `node ${rel.startsWith('..') ? bundle : rel}`;
}

function out(s) { process.stdout.write(s + '\n'); }
function err(s) { process.stderr.write(s + '\n'); }

function handshake(configVersion, installed) {
  const c = semver.cmp(installed, configVersion);
  if (c === null) return { ok: false, msg: `Cannot compare skill version "${installed}" with config version "${configVersion}".` };
  if (c === 0) return { ok: true };
  const upd = `git -C ${SKILL_DIR} fetch --tags && git -C ${SKILL_DIR} checkout v${configVersion}`;
  if (c < 0) return { ok: false, msg: `${CONFIG_FILE} was created with skill v${configVersion} but v${installed} is installed.\nUpdate the skill to match:\n  ${upd}` };
  if (semver.parse(installed)[0] !== semver.parse(configVersion)[0]) {
    return { ok: false, msg: `${CONFIG_FILE} was created with skill v${configVersion}; installed v${installed} is a new major version.\nRun init to migrate the config (your answers are kept).` };
  }
  return { ok: true, newer: true };
}

function pickMode(args) {
  if (args.mode === 'ci' || args.mode === 'local') return args.mode;
  if (args.ci) return 'ci';
  return /^(true|1)$/i.test(process.env.CI || '') ? 'ci' : 'local';
}

function stateOf(config, slug) { return config.optional[slug] || 'unset'; }

function skillState(config, slug) {
  const s = config.skills[slug] || config.projectSkills[slug];
  if (!s) return 'unset';
  return s.mode === 'named' ? s.name : s.mode;
}

function mcpState(config, cat) {
  const v = config.mcp[cat];
  if (!v) return 'unset';
  if (v.mode === 'providers') return v.providers.join(',');
  return v.mode;
}

async function main(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0] || (args.version ? 'version' : 'help');
  const root = path.resolve(args.root || process.cwd());
  const hint = cliHint(root);

  if (cmd === 'help' || args.help) { out(HELP); return 0; }
  if (cmd === 'version' || args.version) { out(VERSION); return 0; }
  if (!fs.existsSync(root)) { err(`Folder not found: ${root}`); return 2; }

  const catalog = loadCatalog(SKILL_DIR);

  if (cmd === 'init') {
    const interactive = Boolean(args.interactive) || (!args.yes && !args.plan && !args['accept-recommended'] && process.stdin.isTTY && process.stdout.isTTY);
    const res = await runInit({ root, catalog, version: VERSION, flags: args, interactive, log: out, skillDir: SKILL_DIR });
    if (res.error) { err(res.error); return 2; }
    if (args.plan) {
      if (args.format === 'json') out(JSON.stringify(res.plan, null, 2));
      else {
        out(`Init plan (${res.plan.questions.length} questions)`);
        for (const q of res.plan.questions) {
          if (q.skipInteractive) continue;
          out(`- ${q.id}: ${q.prompt}  [rec: ${q.recommended}]`);
        }
      }
      return 0;
    }
    const c = loadConfig(root);
    const req = Object.values(c.optional).filter((v) => v === 'required').length;
    const sk = Object.values(Object.assign({}, c.skills, c.projectSkills)).filter((v) => v.mode === 'custom' || v.mode === 'named').length;
    const mcpOn = Object.values(c.mcp).filter((v) => v.mode === 'providers').length;
    out('');
    out(`${res.existed ? 'Updated' : 'Created'} ${CONFIG_FILE} (skill v${VERSION}).`);
    out(`  stack: ${c.stack.join(', ') || 'none'} | tools: ${c.tools.join(', ') || 'all'} | CI: ${c.ci ? 'yes' : 'no'}`);
    out(`  mcp categories set: ${mcpOn} | optional checks required: ${req} | skills required: ${sk}`);
    if (res.scan && (res.scan.unknownFiles.length || res.scan.unknownMcp.length)) {
      out(`  unknown configs logged: ${res.scan.unknownFiles.length} file(s), ${res.scan.unknownMcp.length} MCP server(s) → .ai-sdlc/unknown-configs.json`);
    }
    out('');
    out('Next:');
    out(`  1. Review ${CONFIG_FILE}; it is commented and safe to edit by hand.`);
    out(`  2. Commit it. It is what other machines and CI are checked against.`);
    out(`  3. Run the audit: ${hint} audit`);
    if (c.ci) out('  4. CI: copy assets/ci-github-actions.yml from the skill into .github/workflows/');
    return 0;
  }

  if (cmd === 'map') {
    const target = args._[1];
    if (!target) { err('Usage: map <slug>=<skill-name>   or   map <slug> --remove'); return 2; }
    const eq = target.indexOf('=');
    const slug = eq < 0 ? target : target.slice(0, eq);
    const name = eq < 0 ? '' : target.slice(eq + 1);
    const known = new Set([...catalog.skills.map((s) => s.slug), ...Object.keys(loadConfig(root).projectSkills)]);
    if (!known.has(slug)) { err(`Unknown skill slug "${slug}". Run "list" to see valid slugs.`); return 2; }
    if (!args.remove && !name) { err('Usage: map <slug>=<skill-name>'); return 2; }
    local.setMapping(root, slug, args.remove ? null : name);
    out(args.remove ? `Removed mapping for ${slug}.` : `Mapped ${slug} -> ${name} (stored in .ai-sdlc/local.yaml, not committed).`);
    return 0;
  }

  if (cmd === 'explain') {
    const slug = args._[1];
    const chk = catalog.checks.find((c) => c.slug === slug);
    const item = catalog.items.find((i) => i.slug === slug || i.key === slug);
    const sk = catalog.skills.find((s) => s.slug === slug);
    const cat = (catalog.mcpCategories || []).find((c) => c.key === slug);
    if (!chk && !item && !sk && !cat) { err(`Unknown slug "${slug}". Run "list".`); return 2; }
    const fill = (t) => String(t || '').replace(/\{\{skill_dir\}\}/g, SKILL_DIR);
    if (chk) {
      out(`${chk.slug}: ${chk.title}`);
      out(`  section: ${chk.section} | level: ${chk.level} | tier: ${chk.tier} | scope: ${chk.scope}${chk.soft ? ' | heuristic (warns only)' : ''} | since v${chk.since}`);
      if (chk.group) out(`  part of optional item: ${chk.group}`);
      out(`  why: ${chk.why}`);
      out(`  detection: ${chk.tier === 'chat' ? 'chat only: ' + (chk.chat_note || '') : JSON.stringify(chk.detect)}`);
      out('  fix:'); out(fill(chk.fix).trim().split('\n').map((l) => '    ' + l).join('\n'));
    } else if (cat) {
      out(`${cat.key}: ${cat.title} (MCP category)`);
      out(`  ${cat.description}`);
      out(`  providers: ${cat.providers.map((p) => p.key).join(', ')}`);
    } else if (item) {
      out(`${item.slug}: ${item.title} (${item.kind}, section ${item.section})`);
      out(`  ${item.description}`);
      out(`  includes checks: ${item.checks.join(', ')}`);
      if (item.setup) out(`  setup guide: ${path.join(SKILL_DIR, item.setup)}`);
    } else {
      out(`${sk.slug}: ${sk.title} (skill, ${sk.group}${sk.onboarding ? ', onboarding' : ''})`);
      out(`  ${sk.description}`);
      out('  values in .ai-sdlc.yaml: custom (any relevant skill) | <skill-name> | off | unset');
    }
    return 0;
  }

  if (cmd === 'list') {
    const config = loadConfig(root);
    const repo = new Repo(root);
    const detected = detectStack(repo);
    const stack = config.stack.length ? config.stack : detected;
    if (args.format === 'json') {
      out(JSON.stringify({
        skillVersion: VERSION, skillDir: SKILL_DIR, cli: hint, triggerPhrase: TRIGGER_PHRASE,
        configExists: config.exists, configVersion: config.version, detectedStack: detected, stack, tools: config.tools, ci: config.ci,
        mcp: Object.fromEntries((catalog.mcpCategories || []).map((c) => [c.key, mcpState(config, c.key)])),
        projectMcp: config.projectMcp,
        optionalItems: catalog.items.filter((i) => i.kind !== 'mcp-provider').map((i) => ({ slug: i.slug, title: i.title, description: i.description, section: i.section, applicable: stackMatches(i.stack, stack), state: stateOf(config, i.slug) })),
        mcpProviders: (catalog.mcpProviders || []).map((p) => ({ key: p.key, slug: p.slug, category: p.category, title: p.title, required: providerRequired(config, catalog, p.slug) })),
        skills: catalog.skills.map((s) => ({ slug: s.slug, title: s.title, description: s.description, group: s.group, onboarding: Boolean(s.onboarding), applicable: stackMatches(s.stack, stack), state: skillState(config, s.slug) })),
        projectSkills: Object.entries(config.projectSkills).map(([slug, v]) => ({ slug, description: v.description, state: skillState(config, slug) })),
        mustChecks: catalog.checks.filter((c) => c.level === 'must').map((c) => ({ slug: c.slug, title: c.title, section: c.section, tier: c.tier, scope: c.scope })),
        skillIndex: indexSkills(repo, config),
        localMappings: local.readLocal(root).skill_mappings,
      }, null, 2));
      return 0;
    }
    for (const sec of catalog.sections) {
      out(`\n${sec.title}  [${sec.level === 'must' ? 'always checked' : 'optional'}]`);
      if (sec.kind === 'skills') {
        for (const s of catalog.skills.filter((x) => x.section === sec.key)) out(`  ${s.slug.padEnd(34)} ${skillState(config, s.slug).padEnd(10)} ${s.title}${s.onboarding ? ' *' : ''}`);
      } else if (sec.key === 'integrations') {
        for (const c of catalog.mcpCategories || []) out(`  mcp.${c.key.padEnd(28)} ${mcpState(config, c.key).padEnd(10)} ${c.title}`);
        for (const i of catalog.items.filter((x) => x.section === sec.key && x.kind !== 'mcp-provider')) out(`  ${i.slug.padEnd(34)} ${stateOf(config, i.slug).padEnd(10)} ${i.title}`);
      } else if (sec.level === 'optional') {
        for (const i of catalog.items.filter((x) => x.section === sec.key)) out(`  ${i.slug.padEnd(34)} ${stateOf(config, i.slug).padEnd(10)} ${i.title}`);
      } else {
        for (const c of catalog.checks.filter((x) => x.section === sec.key)) out(`  ${c.slug.padEnd(34)} ${(c.scope === 'local' ? 'local' : c.tier).padEnd(10)} ${c.title}`);
      }
    }
    return 0;
  }

  if (cmd === 'audit') {
    const config = loadConfig(root);
    if (!config.exists) {
      err(`This project has not been initialised: ${CONFIG_FILE} was not found.\nRun init first:\n  ${hint} init`);
      return 2;
    }
    if (config.errors.length) { err(`${CONFIG_FILE} has problems:\n  - ${config.errors.join('\n  - ')}\nFix them, or run: ${hint} init --force`); return 2; }
    if (!config.version) { err(`${CONFIG_FILE} has no skill.version, so it was not created by init.\nRun: ${hint} init   (your existing answers are kept)`); return 2; }
    const hs = handshake(config.version, VERSION);
    if (!hs.ok) { err(hs.msg); return 2; }

    const mode = pickMode(args);
    const now = new Date();
    const res = runAudit({ root, config, catalog, mode, skillVersion: VERSION, skillDir: SKILL_DIR, all: Boolean(args.all), now, cliHint: hint });
    if (hs.newer) res.warnings.push(`skill v${VERSION} is newer than config v${config.version}: checks whose since version is newer warn instead of fail until you re-run init.`);
    if (mode === 'ci' && !config.ci) res.warnings.push('running in CI mode although "ci" is false in .ai-sdlc.yaml');
    let savedTo = null;
    if (!args['no-save']) {
      try { savedTo = local.saveReport(root, res, now); } catch (e) { res.warnings.push(`could not save the report: ${e.message}`); }
    }
    if (args.format === 'json') out(JSON.stringify(Object.assign({ savedTo }, res), null, 2));
    else process.stdout.write(renderMarkdown(res, { skillDir: SKILL_DIR, savedTo }));
    return res.verdict.ready ? 0 : 1;
  }

  err(`Unknown command "${cmd}".\n`);
  err(HELP);
  return 2;
}

main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { err(`Unexpected error: ${e && e.stack ? e.stack : e}`); process.exitCode = 2; });
