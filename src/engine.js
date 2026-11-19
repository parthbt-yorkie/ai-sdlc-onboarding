'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Repo } = require('./repo');
const { detectStack } = require('./stack');
const { evalExpr } = require('./detect');
const { indexSkills } = require('./skills');
const { stackMatches, providerRequired } = require('./config');
const { projectMcpChecks } = require('./catalog');
const local = require('./local');
const semver = require('./semver');
const customs = require('./customs');
const tools = require('./tools');

const TRIGGER_PHRASE = 'Run the AI SDLC onboarding (full)';
const ONBOARDING_SINCE = '0.2.0';

function base(c) {
  return {
    slug: c.slug, title: c.title, section: c.section, level: c.level, group: c.group || null, tier: c.tier, scope: c.scope,
    why: c.why || '', fix: c.fix || '', setup: c.setup || null, status: 'pass', detail: '', chatReview: false, gating: false,
  };
}

function evaluateCheck(c, ctx) {
  const out = base(c);
  if (!stackMatches(c.stack, [...ctx.stack])) { out.status = 'na'; out.detail = 'not applicable to this stack'; return out; }
  if (c.applies) {
    const a = evalExpr(c.applies, ctx);
    if (a.status !== 'pass') { out.status = 'na'; out.detail = a.detail || 'not applicable'; return out; }
  }
  if (c.scope === 'local' && ctx.mode === 'ci') { out.status = 'cannot-verify'; out.detail = 'needs this machine; skipped in CI'; return out; }
  if (c.tier === 'chat') { out.status = 'needs-chat'; out.detail = c.chat_note || 'validate in chat'; return out; }
  const r = evalExpr(c.detect, ctx);
  out.status = r.status;
  out.detail = r.detail;
  if (out.status === 'fail' && c.soft) out.status = 'warn';
  out.chatReview = c.tier === 'hybrid';
  return out;
}

function expandPath(p, root) {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return path.resolve(root, p);
}

function skillFix(def, spec, cliHint) {
  const where = '.cursor/skills/<name>/SKILL.md (Cursor) or .claude/skills/<name>/SKILL.md (Claude Code)';
  if (spec.mode === 'named') {
    return `Make the skill "${spec.name}" available: put it in ${where}, commit it if it should be shared, or add \`source:\` in .ai-sdlc.yaml so others know where to get it.\nIf the name changed, update it in .ai-sdlc.yaml.`;
  }
  return `Create or install a skill/rule for "${def.title}"${def.description ? ` (${def.description})` : ''} in ${where}.\nThen match it: run the chat audit ("${TRIGGER_PHRASE}"), or run: ${cliHint} map ${def.slug}=<your-skill-name>`;
}

function candidatesFor(def, index) {
  const kws = (def.keywords || []).concat(String(def.slug).split('-')).map((k) => k.toLowerCase()).filter((k) => k.length > 2);
  return index.map((s) => {
    const hay = `${s.name} ${s.description}`.toLowerCase();
    return { s, score: kws.filter((k) => hay.includes(k)).length };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)
    .map((x) => ({ name: x.s.name, scope: x.s.scope, path: x.s.path }));
}

function evalSkill(def, spec, ctx, index, mapping, cliHint) {
  const out = {
    slug: def.slug, title: def.title || def.slug, description: def.description || '', section: 'skills', kind: 'skill', level: 'optional',
    tier: 'chat', scope: 'local', mode: spec.mode, name: spec.name || null, status: 'pass', detail: '', why: def.description || '',
    fix: '', chatReview: false, gating: true, project: Boolean(def.project), setup: null, group: null, since: def.since || '0.1.0',
  };
  const byName = (n) => index.filter((s) => s.name.toLowerCase() === String(n).toLowerCase());

  if (spec.mode === 'named') {
    let found = byName(spec.name);
    if (spec.path) {
      const abs = expandPath(spec.path, ctx.repo.root);
      if (fs.existsSync(abs)) {
        const inRepo = abs.startsWith(ctx.repo.root + path.sep);
        const rel = path.relative(ctx.repo.root, abs).split(path.sep).join('/');
        found = found.concat([{ name: spec.name, scope: inRepo ? 'repo' : 'user', path: spec.path, wellFormed: true, issues: [], committed: inRepo ? ctx.repo.isCommitted(rel) : false, ignored: false }]);
      }
    }
    const shared = found.find((f) => f.scope === 'repo' && f.committed && !f.ignored);
    const inRepo = found.find((f) => f.scope === 'repo');
    const personal = found.find((f) => f.scope === 'user');
    if (shared) {
      if (!shared.wellFormed) { out.status = 'fail'; out.detail = `"${spec.name}" found at ${shared.path} but is malformed: ${shared.issues.join('; ')}`; } else out.detail = `"${spec.name}" is shared in the repo (${shared.path})`;
    } else if (ctx.mode === 'ci') {
      out.status = 'cannot-verify';
      out.detail = `"${spec.name}" is not committed in the repo; user-level installs cannot be seen in CI`;
    } else if (inRepo) {
      out.status = spec.source ? 'pass' : 'warn';
      out.detail = `"${spec.name}" exists at ${inRepo.path} but is not committed${spec.source ? `; others get it from ${spec.source}` : ' (others cannot get it): commit it or add `source`'}`;
    } else if (personal) {
      out.status = spec.source ? 'pass' : 'warn';
      out.detail = `"${spec.name}" is installed in your user folder (${personal.path})${spec.source ? `; others get it from ${spec.source}` : ' only: add `source` so others can install it'}`;
    } else {
      out.status = 'fail';
      out.detail = `named skill "${spec.name}" not found in the project or user skill folders${spec.source ? `; get it from ${spec.source}` : ''}`;
    }
  } else if (ctx.mode === 'ci') {
    out.status = 'cannot-verify';
    out.detail = 'any relevant skill is required; this depends on each person\'s setup (check locally or in chat)';
  } else {
    const mapped = mapping[def.slug];
    const found = mapped ? byName(mapped) : [];
    if (found.length) {
      const best = found.find((f) => f.scope === 'repo' && f.committed) || found[0];
      out.detail = `mapped to "${mapped}" (${best.scope === 'repo' && best.committed ? 'shared in the repo' : 'personal install'})`;
      out.portable = best.scope === 'repo' && best.committed;
    } else {
      out.status = 'needs-chat';
      out.detail = mapped ? `your mapping "${mapped}" no longer resolves to an installed skill` : 'any relevant skill is required; match yours in chat';
      out.candidates = candidatesFor(def, index);
    }
  }
  if (out.status !== 'pass') out.fix = skillFix(def, spec, cliHint);
  return out;
}

function unsetSkillResult(def) {
  return {
    slug: def.slug, title: def.title || def.slug, description: def.description || '', section: 'skills', kind: 'skill', level: 'optional',
    tier: 'chat', scope: 'local', mode: 'unset', name: null, status: 'fail', detail: 'not decided yet: set to custom, a skill name, or off',
    why: def.description || 'Onboarding requires a decision for this skill.',
    fix: `In .ai-sdlc.yaml set skills.${def.slug} to custom (any relevant skill), a specific skill name, or off.\nOr re-run init and answer the question.`,
    chatReview: false, gating: true, project: Boolean(def.project), setup: null, group: null, since: ONBOARDING_SINCE, onboardingUnset: true,
  };
}

function isCheckGating(c, config, catalog) {
  if (c.level === 'must') return true;
  if (!c.group) return false;
  if (providerRequired(config, catalog, c.group)) return true;
  if ((config.optional[c.group] || 'unset') === 'required') return true;
  // project mcp groups look like project-mcp-<name>
  const m = /^project-mcp-(.+)$/.exec(c.group);
  if (m && config.projectMcp[m[1]] && config.projectMcp[m[1]].mode === 'required') return true;
  return false;
}

function runAudit(opts) {
  const { root, config, catalog, mode, skillVersion, skillDir, all, cliHint } = opts;
  const now = opts.now || new Date();
  const repo = new Repo(root);
  const stackArr = config.stack.length ? config.stack : detectStack(repo);
  const ctx = { repo, stack: new Set(stackArr), mode, config, skillDir };
  const mapping = local.readLocal(root).skill_mappings;
  const index = indexSkills(repo, config);
  const ignoredBy = new Map(config.ignored.map((i) => [i.slug, i]));
  const warnings = config.warnings.slice();

  const projectMcpCheckList = [];
  for (const [name, entry] of Object.entries(config.projectMcp || {})) {
    if (entry.mode === 'off') continue;
    for (const c of projectMcpChecks(name, entry)) {
      projectMcpCheckList.push(Object.assign(normProjectCheck(c, name), { group: `project-mcp-${name}` }));
    }
  }

  const knownSlugs = new Set([
    ...catalog.checks.map((c) => c.slug),
    ...catalog.skills.map((s) => s.slug),
    ...Object.keys(config.projectSkills),
    ...projectMcpCheckList.map((c) => c.slug),
    'ai-sdlc-ci-workflow',
  ]);
  for (const i of config.ignored) if (!knownSlugs.has(i.slug)) warnings.push(`ignored_checks: unknown slug "${i.slug}"`);
  for (const slug of Object.keys(config.optional)) {
    if (!catalog.items.some((i) => i.slug === slug) && !/^gerrit-mcp|jira-mcp|figma-mcp|sentry-mcp|github$/.test(slug)) {
      warnings.push(`optional_checks: unknown slug "${slug}"`);
    }
  }
  for (const i of config.ignored) if (i.expiresSoon) warnings.push(`ignored_checks: "${i.slug}" expires on ${i.expires} (within 30 days)`);

  const results = [];
  const undecided = [];
  const optState = (slug) => config.optional[slug] || 'unset';

  const allChecks = catalog.checks.concat(projectMcpCheckList);
  for (const c of allChecks) {
    const gating = isCheckGating(c, config, catalog);
    if (!gating && !all) continue;
    if (!gating && c.group && optState(c.group) === 'off') continue;
    let r;
    const ign = ignoredBy.get(c.slug);
    if (gating && ign && !ign.expired) {
      r = Object.assign(base(c), { status: 'ignored', detail: ign.reason + (ign.expires ? ` (until ${ign.expires})` : '') });
    } else {
      r = evaluateCheck(c, ctx);
      if (ign && ign.expired) r.detail += ` [ignore expired on ${ign.expires}]`;
      if (gating && r.status === 'fail' && config.version && semver.cmp(c.since || '0.1.0', config.version) === 1) {
        r.status = 'warn';
        r.pendingNew = true;
        r.detail = `new in skill v${c.since}; warning until you re-run init (does not block READY): ${r.detail}`;
      }
    }
    r.gating = gating;
    results.push(r);
  }

  for (const it of catalog.items) {
    if (it.kind === 'mcp-provider') {
      const cat = it.category;
      const state = config.mcp[cat];
      if (!state || state.mode === 'unset') {
        if (stackMatches(it.stack, stackArr)) undecided.push({ slug: `${cat}:${it.key}`, title: `${it.title} (${cat})`, kind: 'mcp', description: it.description });
      }
      continue;
    }
    if (stackMatches(it.stack, stackArr) && optState(it.slug) === 'unset') {
      undecided.push({ slug: it.slug, title: it.title, kind: it.kind, description: it.description });
    }
  }
  for (const cat of catalog.mcpCategories || []) {
    if (!config.mcp[cat.key] || config.mcp[cat.key].mode === 'unset') {
      undecided.push({ slug: cat.key, title: cat.title, kind: 'mcp-category', description: cat.description });
    }
  }

  for (const def of catalog.skills) {
    if (!stackMatches(def.stack, stackArr)) continue;
    if (def.applies_dep && !repo.hasDep(def.applies_dep)) continue;
    const spec = config.skills[def.slug] || { mode: 'unset' };
    if (spec.mode === 'off') continue;
    if (spec.mode === 'unset') {
      undecided.push({ slug: def.slug, title: def.title, kind: 'skill', description: def.description, onboarding: Boolean(def.onboarding) });
      if (def.onboarding) {
        let r = unsetSkillResult(def);
        const ign = ignoredBy.get(def.slug);
        if (ign && !ign.expired) {
          r = Object.assign(r, { status: 'ignored', detail: ign.reason });
        } else if (config.version && semver.cmp(ONBOARDING_SINCE, config.version) === 1) {
          r.status = 'warn';
          r.pendingNew = true;
          r.detail = `new in skill v${ONBOARDING_SINCE}; warning until you re-run init (does not block READY): ${r.detail}`;
        }
        r.gating = true;
        results.push(r);
      }
      continue;
    }
    const ign = ignoredBy.get(def.slug);
    if (ign && !ign.expired) { results.push(Object.assign(evalSkillStub(def, spec), { status: 'ignored', detail: ign.reason })); continue; }
    results.push(evalSkill(def, spec, ctx, index, mapping, cliHint));
  }
  for (const [slug, spec] of Object.entries(config.projectSkills)) {
    if (spec.mode === 'off') continue;
    const def = { slug, title: slug, description: spec.description || '', keywords: (spec.description || '').split(/\W+/), project: true, onboarding: true };
    if (spec.mode === 'unset') {
      undecided.push({ slug, title: slug, kind: 'project-skill', description: spec.description || '', onboarding: true });
      let r = unsetSkillResult(def);
      if (config.version && semver.cmp(ONBOARDING_SINCE, config.version) === 1) {
        r.status = 'warn';
        r.pendingNew = true;
        r.detail = `new in skill v${ONBOARDING_SINCE}; warning until you re-run init (does not block READY): ${r.detail}`;
      }
      r.gating = true;
      results.push(r);
      continue;
    }
    results.push(evalSkill(def, spec, ctx, index, mapping, cliHint));
  }

  const gating = results.filter((r) => r.gating);
  const by = (s) => gating.filter((r) => r.status === s);
  const pass = by('pass').length;
  const fail = by('fail').length;
  const warn = by('warn').length;
  const decisive = pass + fail + warn;
  const mustApplicable = gating.filter((r) => r.level === 'must' && r.status !== 'na');
  const ready = fail === 0;
  const scopeLabel = mode === 'ci' ? 'config only' : 'config + local config';

  const rank = { fail: 0, warn: 1 };
  const steps = gating.filter((r) => r.status === 'fail' || r.status === 'warn')
    .map((r, i) => ({ r, i })).sort((a, b) => rank[a.r.status] - rank[b.r.status] || a.i - b.i).map((x) => x.r);
  const toVerify = gating.filter((r) => r.status === 'needs-chat' || r.status === 'cannot-verify');

  let unknown = null;
  try {
    const { runScan, writeUnknownLog } = require('./scan');
    const scan = runScan({ root, catalog, skillDir, config });
    const saved = writeUnknownLog(root, scan, skillVersion, now);
    unknown = {
      path: saved,
      files: (scan.unknownFiles || []).length,
      mcpServers: (scan.unknownMcp || []).length,
      sample: (scan.unknownFiles || []).slice(0, 5).map((f) => f.path),
      mcpSample: (scan.unknownMcp || []).slice(0, 5).map((s) => s.name),
    };
  } catch (e) {
    warnings.push(`could not write unknown-configs log: ${e.message}`);
  }

  const prev = local.readLatest(root);
  return {
    tool: 'ai-sdlc-onboarding',
    generatedAt: now.toISOString(),
    project: path.basename(root),
    mode,
    skillVersion,
    configVersion: config.version,
    tools: tools.activeTools(config),
    stack: stackArr,
    verdict: { ready, label: ready ? `READY (${scopeLabel})` : 'NOT READY', scope: scopeLabel },
    score: decisive ? Math.round((100 * pass) / decisive) : null,
    counts: {
      pass, warn, fail, needsChat: by('needs-chat').length, cannotVerify: by('cannot-verify').length, ignored: by('ignored').length,
      notApplicable: by('na').length, ignoredMust: mustApplicable.filter((r) => r.status === 'ignored').length, totalMust: mustApplicable.length,
      undecided: undecided.length, pendingNew: gating.filter((r) => r.pendingNew).length,
    },
    previous: prev ? { generatedAt: prev.generatedAt, score: prev.score, verdict: prev.verdict && prev.verdict.label } : null,
    steps: steps.map((r) => ({ slug: r.slug, title: r.title, status: r.status, section: r.section, detail: r.detail, why: r.why, fix: r.fix, setup: r.setup })),
    toVerify: toVerify.map((r) => ({ slug: r.slug, title: r.title, status: r.status, detail: r.detail, fix: r.fix, candidates: r.candidates || undefined })),
    items: results,
    undecided,
    warnings,
    unknown,
    chat: {
      triggerPhrase: TRIGGER_PHRASE,
      needsChat: gating.filter((r) => r.status === 'needs-chat').map((r) => r.slug),
      reviewInChat: gating.filter((r) => r.chatReview && r.status !== 'na').map((r) => r.slug),
      skillIndex: index.map((s) => ({ name: s.name, description: s.description, scope: s.scope, path: s.path, committed: s.committed, wellFormed: s.wellFormed })),
      mcpServers: Object.keys(customs._findServers(ctx, '.*').reduce((a, s) => { a[s.name] = 1; return a; }, {})),
    },
  };
}

function normProjectCheck(c, name) {
  return Object.assign({
    level: 'optional',
    tier: 'script',
    scope: 'repo',
    stack: ['any'],
    since: ONBOARDING_SINCE,
    soft: false,
    why: '',
    fix: '',
    section: 'integrations',
    setup: 'references/integrations/project-mcp.md',
  }, c, { group: `project-mcp-${name}` });
}

function evalSkillStub(def, spec) {
  return {
    slug: def.slug, title: def.title, description: def.description, section: 'skills', kind: 'skill', level: 'optional', tier: 'chat', scope: 'local',
    mode: spec.mode, name: spec.name || null, status: 'pass', detail: '', why: def.description, fix: '', chatReview: false, gating: true, setup: null, group: null,
  };
}

module.exports = { runAudit, TRIGGER_PHRASE, evaluateCheck, ONBOARDING_SINCE };
