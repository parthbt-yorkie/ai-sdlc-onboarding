'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {
  loadConfig, renderConfig, CONFIG_FILE, wrap, stackMatches, normSkill, normOptional, normMcpValue, listOf, LEGACY_MCP,
} = require('./config');
const { detectStack, KNOWN_STACK } = require('./stack');
const { KNOWN_TOOLS } = require('./tools');
const { Repo } = require('./repo');
const { runScan, writeUnknownLog } = require('./scan');

function makeAsk() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const queue = [];
  let waiter = null;
  let closed = false;
  rl.on('line', (l) => {
    if (waiter) { const w = waiter; waiter = null; w(l.trim()); } else queue.push(l.trim());
  });
  rl.on('close', () => {
    closed = true;
    if (waiter) { const w = waiter; waiter = null; w(''); }
  });
  const ask = (q) => {
    rl.setPrompt(q);
    rl.prompt();
    if (queue.length) return Promise.resolve(queue.shift());
    if (closed) return Promise.resolve('');
    return new Promise((res) => { waiter = res; });
  };
  return { ask, close: () => rl.close() };
}

function pairs(list) {
  return (list || []).map((s) => {
    const i = String(s).indexOf('=');
    return i < 0 ? [String(s), ''] : [String(s).slice(0, i), String(s).slice(i + 1)];
  });
}

function emptyModel(existing, detected) {
  return {
    source: existing.source,
    tools: existing.tools.length ? existing.tools.slice() : ['cursor'],
    stack: existing.stack.length ? existing.stack.slice() : detected,
    ci: existing.ci,
    optional: Object.assign({}, existing.optional),
    skills: Object.assign({}, existing.skills),
    projectSkills: Object.assign({}, existing.projectSkills),
    mcp: Object.assign({}, existing.mcp),
    projectMcp: Object.assign({}, existing.projectMcp),
    ignored: existing.errors.length ? [] : existing.ignored.map((e) => ({ slug: e.slug, reason: e.reason, expires: e.expires })),
    skillLocations: existing.skillLocations,
    extras: existing.extras,
  };
}

function applyMigration(model) {
  // Move any leftover legacy optional MCP keys into mcp
  for (const [slug, map] of Object.entries(LEGACY_MCP)) {
    if (!(slug in model.optional)) continue;
    const state = model.optional[slug];
    delete model.optional[slug];
    if (model.mcp[map.category] && model.mcp[map.category].mode !== 'unset') continue;
    if (state === 'required') model.mcp[map.category] = { mode: 'providers', providers: [map.key] };
    else if (state === 'off') model.mcp[map.category] = { mode: 'off', providers: [] };
    else model.mcp[map.category] = { mode: 'unset', providers: [] };
  }
}

function skillRec(scan, slug) {
  const def = (scan.onboardingSkills || []).find((s) => s.slug === slug)
    || (scan.skillIndex && null);
  const kws = String(slug).split('-').filter((k) => k.length > 2);
  const hits = (scan.skillIndex || []).map((s) => {
    const hay = `${s.name} ${s.description}`.toLowerCase();
    return { s, score: kws.filter((k) => hay.includes(k)).length };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const committed = hits.find((x) => x.s.scope === 'repo' && x.s.committed);
  if (committed) return { value: committed.s.name, mode: 'named', evidence: `found committed skill "${committed.s.name}"` };
  const personal = hits.find((x) => x.s.scope === 'user');
  if (personal) return { value: 'custom', mode: 'custom', mapTo: personal.s.name, evidence: `found personal skill "${personal.s.name}"` };
  return { value: 'custom', mode: 'custom', evidence: null };
}

function buildPlan(opts) {
  const { catalog, model, scan } = opts;
  const questions = [];
  const push = (q) => questions.push(q);

  push({
    id: 'tools',
    kind: 'tools',
    prompt: 'Which AI tools does this team use?',
    options: KNOWN_TOOLS.map((t) => ({ value: t, label: t })),
    multi: true,
    recommended: scan.tools,
    evidence: scan.tools.length ? `detected: ${scan.tools.join(', ')}` : null,
    current: model.tools,
  });
  push({
    id: 'stack',
    kind: 'stack',
    prompt: 'Technology stack for this project?',
    options: KNOWN_STACK.map((t) => ({ value: t, label: t })),
    multi: true,
    recommended: scan.stack,
    evidence: scan.stack.length ? `detected: ${scan.stack.join(', ')}` : null,
    current: model.stack,
  });
  push({
    id: 'ci',
    kind: 'ci',
    prompt: 'Will this project run the audit in CI?',
    options: [{ value: 'yes', label: 'yes' }, { value: 'no', label: 'no' }],
    recommended: scan.ciPresent || model.ci ? 'yes' : 'no',
    evidence: scan.ciPresent ? 'CI config found in the repo' : null,
    current: model.ci ? 'yes' : 'no',
  });

  for (const cat of catalog.mcpCategories || []) {
    const found = (scan.mcpByCategory[cat.key] && scan.mcpByCategory[cat.key].found) || [];
    const cur = model.mcp[cat.key] || { mode: 'unset', providers: [] };
    let recommended = 'unset';
    if (found.length) recommended = found.join(',');
    else if (cat.defaultOff && !cat.defaultOff.some((t) => model.stack.includes(t) || scan.stack.includes(t))) recommended = 'off';
    const askAgain = cur.mode === 'off' && found.length;
    if (cur.mode === 'providers' || (cur.mode === 'off' && !askAgain) || (cur.mode === 'unset' && false)) {
      // still include unset and contradictions; skip only when already decided and no contradiction
    }
    if ((cur.mode === 'providers' || (cur.mode === 'off' && !askAgain)) && !askAgain) {
      // keep decided answers out of interactive unless contradiction
      if (!askAgain) {
        // still expose in plan JSON for chat visibility as decided
        push({
          id: `mcp:${cat.key}`,
          kind: 'mcp',
          category: cat.key,
          prompt: `${cat.title}: which provider(s)?`,
          options: [
            ...cat.providers.map((p) => ({ value: p.key, label: p.title })),
            { value: 'off', label: 'off (not used)' },
            { value: 'unset', label: 'unset (decide later)' },
          ],
          multi: true,
          recommended,
          evidence: found.length ? `configured in repo: ${found.join(', ')}` : null,
          current: cur.mode === 'providers' ? cur.providers.join(',') : cur.mode,
          decided: true,
          skipInteractive: !askAgain,
        });
        continue;
      }
    }
    push({
      id: `mcp:${cat.key}`,
      kind: 'mcp',
      category: cat.key,
      prompt: `${cat.title}: which provider(s)? (${cat.description})`,
      options: [
        ...cat.providers.map((p) => ({ value: p.key, label: `${p.title}${found.includes(p.key) ? ' (found)' : ''}` })),
        { value: 'off', label: 'off (not used)' },
        { value: 'unset', label: 'unset (decide later)' },
      ],
      multi: true,
      recommended,
      evidence: found.length ? `configured in repo: ${found.join(', ')}` : (askAgain ? `was off, but now found: ${found.join(', ')}` : null),
      current: cur.mode === 'providers' ? cur.providers.join(',') : cur.mode,
      contradiction: askAgain,
    });
  }

  for (const u of scan.unknownMcp || []) {
    const slug = u.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'custom-mcp';
    if (model.projectMcp[slug] && model.projectMcp[slug].mode !== 'unset') continue;
    push({
      id: `project-mcp:${slug}`,
      kind: 'project-mcp',
      name: slug,
      prompt: `Unknown MCP server "${u.name}" in ${u.file}. Require it as a project MCP?`,
      options: [{ value: 'yes', label: 'yes, add as project_mcp' }, { value: 'no', label: 'no, only log it' }],
      recommended: u.committed ? 'yes' : 'no',
      evidence: `server "${u.name}" (${u.command || u.url || 'no command'})`,
      match: u.name,
      description: `Project MCP server ${u.name}`,
    });
  }

  const coverageSections = ['quality', 'coding-standards', 'process-standards', 'code-review', 'tooling', 'best-practices', 'agent-setup', 'integrations'];
  for (const sec of catalog.sections.filter((s) => s.level === 'optional' && coverageSections.includes(s.key))) {
    for (const it of catalog.items.filter((i) => i.section === sec.key && i.kind !== 'mcp-provider' && stackMatches(i.stack, model.stack))) {
      const cur = model.optional[it.slug] || 'unset';
      const ev = (scan.evidence || []).find((e) => e.slug === it.slug);
      const askAgain = cur === 'off' && ev;
      if (cur === 'required' || (cur === 'off' && !askAgain)) {
        push({
          id: `optional:${it.slug}`,
          kind: 'optional',
          slug: it.slug,
          prompt: `${it.title}?`,
          options: [{ value: 'required', label: 'required' }, { value: 'off', label: 'off' }, { value: 'unset', label: 'unset' }],
          recommended: ev ? 'required' : 'unset',
          evidence: ev ? ev.detail : null,
          current: cur,
          decided: true,
          skipInteractive: !askAgain,
          section: sec.key,
        });
        continue;
      }
      push({
        id: `optional:${it.slug}`,
        kind: 'optional',
        slug: it.slug,
        prompt: `${it.title}: ${it.description}`,
        options: [{ value: 'required', label: 'required' }, { value: 'off', label: 'off' }, { value: 'unset', label: 'unset' }],
        recommended: ev ? 'required' : 'unset',
        evidence: ev ? ev.detail : (askAgain ? `was off, but evidence found: ${ev.detail}` : null),
        current: cur,
        contradiction: Boolean(askAgain),
        section: sec.key,
      });
    }
  }

  const onboard = catalog.skills.filter((s) => s.onboarding && stackMatches(s.stack, model.stack));
  for (const sk of onboard) {
    if (sk.applies_dep) {
      const repo = new Repo(opts.root);
      if (!repo.hasDep(sk.applies_dep)) continue;
    }
    const cur = model.skills[sk.slug];
    const curVal = cur ? (cur.mode === 'named' ? cur.name : cur.mode) : 'unset';
    if (cur && cur.mode !== 'unset') {
      push({
        id: `skill:${sk.slug}`,
        kind: 'skill',
        slug: sk.slug,
        prompt: `${sk.title}?`,
        options: [{ value: 'custom', label: 'any relevant skill' }, { value: 'off', label: 'off' }],
        recommended: skillRec(scan, sk.slug).value,
        evidence: null,
        current: curVal,
        decided: true,
        skipInteractive: true,
        onboarding: true,
      });
      continue;
    }
    const rec = skillRec(scan, sk.slug);
    push({
      id: `skill:${sk.slug}`,
      kind: 'skill',
      slug: sk.slug,
      prompt: `${sk.title}: ${sk.description}`,
      options: [
        { value: 'custom', label: 'any relevant skill (custom)' },
        { value: 'off', label: 'off' },
        { value: 'unset', label: 'unset' },
      ],
      recommended: rec.value,
      evidence: rec.evidence,
      mapTo: rec.mapTo || null,
      current: curVal,
      onboarding: true,
    });
  }

  push({
    id: 'project-skill-briefs',
    kind: 'signals',
    prompt: 'Chat: propose up to 3 project-specific skill briefs from these signals (or skip).',
    signals: scan.signals,
    recommended: null,
    skipInteractive: true,
  });

  for (const miss of scan.missingStandards || []) {
    if (model.ignored.some((i) => i.slug === miss.slug)) continue;
    push({
      id: `missing:${miss.slug}`,
      kind: 'missing',
      slug: miss.slug,
      prompt: `${miss.title} is missing (${miss.detail}). Is this intentional?`,
      options: [{ value: 'ignore', label: 'yes, intentionally missing (ignore in audit)' }, { value: 'keep', label: 'no, keep as an audit action item' }],
      recommended: 'keep',
      evidence: miss.detail,
      template: miss.template,
      fix: miss.fix,
      notACheck: miss.notACheck,
    });
  }

  return {
    skillVersion: opts.version,
    stack: scan.stack,
    tools: scan.tools,
    questions,
    unknown: { files: (scan.unknownFiles || []).length, mcpServers: (scan.unknownMcp || []).length },
    signals: scan.signals,
  };
}

function applyAnswer(model, q, answer) {
  if (q.kind === 'tools') model.tools = listOf(answer).filter((t) => KNOWN_TOOLS.includes(t));
  else if (q.kind === 'stack') model.stack = listOf(answer).filter((t) => KNOWN_STACK.includes(t));
  else if (q.kind === 'ci') model.ci = /^(y|yes|true|1)$/i.test(String(answer));
  else if (q.kind === 'mcp') {
    const raw = String(answer).trim();
    if (/^off$/i.test(raw)) model.mcp[q.category] = { mode: 'off', providers: [] };
    else if (/^unset$/i.test(raw) || raw === '') model.mcp[q.category] = { mode: 'unset', providers: [] };
    else model.mcp[q.category] = normMcpValue(raw);
  } else if (q.kind === 'project-mcp') {
    if (/^(y|yes)$/i.test(String(answer))) {
      model.projectMcp[q.name] = { match: q.match || q.name, description: q.description || '', mode: 'required' };
    }
  } else if (q.kind === 'optional') {
    const n = normOptional(answer);
    model.optional[q.slug] = n || 'unset';
  } else if (q.kind === 'skill') {
    model.skills[q.slug] = normSkill(answer);
  } else if (q.kind === 'missing') {
    if (/^ignore$/i.test(String(answer))) {
      if (!model.ignored.some((i) => i.slug === q.slug)) {
        model.ignored.push({ slug: q.slug, reason: 'intentionally not used', expires: null });
      }
    }
  }
}

function applyRecommended(model, plan) {
  for (const q of plan.questions) {
    if (q.skipInteractive && !q.contradiction) continue;
    if (q.recommended == null || q.kind === 'signals') continue;
    applyAnswer(model, q, q.recommended);
  }
}

async function askPlan(model, plan, log) {
  const { ask, close } = makeAsk();
  const maps = [];
  try {
    log('');
    log('AI SDLC onboarding (init). Press Enter to accept the recommendation in [brackets].');
    for (const q of plan.questions) {
      if (q.skipInteractive && !q.contradiction) continue;
      if (q.kind === 'signals') continue;
      log('');
      log(`== ${q.id} ==`);
      log(q.prompt);
      if (q.evidence) log(`    Evidence: ${q.evidence}`);
      for (const l of wrap(`Options: ${q.options.map((o) => o.label).join(' | ')}`, 96, '    ')) log(l);
      const rec = q.recommended == null ? (q.current || '') : q.recommended;
      const a = await ask(`    Answer [${rec}]: `);
      const value = a === '' ? rec : a;
      applyAnswer(model, q, value);
      if (q.kind === 'skill' && q.mapTo && (value === 'custom' || value === 'y' || value === '')) {
        maps.push({ slug: q.slug, name: q.mapTo });
      }
    }
  } finally { close(); }
  return maps;
}

async function runInit(opts) {
  const { root, catalog, version, flags, interactive, log } = opts;
  const existing = loadConfig(root);
  if (existing.exists && existing.errors.length && !flags.force) {
    return { error: `${CONFIG_FILE} has problems; fix them by hand or re-run with --force to rewrite it:\n  - ${existing.errors.join('\n  - ')}` };
  }
  const repo = new Repo(root);
  const detected = detectStack(repo);
  const model = emptyModel(existing, detected);
  applyMigration(model);
  const problems = [];

  // Ensure mcp categories exist on the model
  for (const cat of catalog.mcpCategories || []) {
    if (!model.mcp[cat.key]) model.mcp[cat.key] = { mode: 'unset', providers: [] };
  }

  const scan = runScan({ root, catalog, skillDir: opts.skillDir || path.resolve(__dirname, '..'), config: Object.assign({}, existing, model) });
  writeUnknownLog(root, scan, version);

  if (flags.plan) {
    const plan = buildPlan({ catalog, model, scan, version, root });
    return { plan, scan, model, existed: existing.exists };
  }

  // flags
  if (flags.tools !== undefined) {
    model.tools = listOf(flags.tools);
    for (const t of model.tools) if (!KNOWN_TOOLS.includes(t)) problems.push(`unknown tool "${t}" (known: ${KNOWN_TOOLS.join(', ')})`);
  } else if (!existing.tools.length) {
    model.tools = scan.tools.slice();
  }
  if (flags.stack !== undefined) {
    model.stack = listOf(flags.stack);
    for (const t of model.stack) if (!KNOWN_STACK.includes(t)) problems.push(`unknown stack tag "${t}" (known: ${KNOWN_STACK.join(', ')})`);
  } else if (!existing.stack.length) {
    model.stack = scan.stack.slice();
  }
  if (flags.ci) model.ci = true;

  const itemSlugs = new Set(catalog.items.filter((i) => i.kind !== 'mcp-provider').map((i) => i.slug));
  for (const s of listOf(flags.require)) {
    if (itemSlugs.has(s)) model.optional[s] = 'required';
    else problems.push(`--require: unknown optional check "${s}"`);
  }
  for (const s of listOf(flags.off)) {
    if (itemSlugs.has(s)) model.optional[s] = 'off';
    else problems.push(`--off: unknown optional check "${s}"`);
  }
  const skillSlugs = new Set(catalog.skills.map((s) => s.slug));
  for (const [slug, v] of pairs(flags.skill)) {
    if (skillSlugs.has(slug)) model.skills[slug] = normSkill(v === '' ? 'unset' : v);
    else problems.push(`--skill: unknown skill "${slug}" (for your own skills use --project-skill)`);
  }
  for (const [slug, v] of pairs(flags['project-skill'])) {
    model.projectSkills[slug] = Object.assign({}, model.projectSkills[slug] || {}, normSkill(v === '' ? 'custom' : v));
  }
  for (const [slug, v] of pairs(flags.describe)) {
    if (model.projectSkills[slug]) model.projectSkills[slug].description = v;
    else problems.push(`--describe: "${slug}" is not a project skill (add it with --project-skill first)`);
  }
  for (const [cat, v] of pairs(flags.mcp)) {
    if (!(catalog.mcpCategories || []).some((c) => c.key === cat)) problems.push(`--mcp: unknown category "${cat}"`);
    else model.mcp[cat] = normMcpValue(v);
  }
  for (const [name, v] of pairs(flags['project-mcp'])) {
    if (v === 'off' || v === 'n') model.projectMcp[name] = { match: name, description: '', mode: 'off' };
    else model.projectMcp[name] = { match: v || name, description: '', mode: 'required' };
  }
  for (const [slug, reason] of pairs(flags.ignore)) {
    const r = reason || 'intentionally not used';
    const existingIgn = model.ignored.find((i) => i.slug === slug);
    if (existingIgn) existingIgn.reason = r;
    else model.ignored.push({ slug, reason: r, expires: null });
  }

  const plan = buildPlan({ catalog, model, scan, version, root });

  if (flags['accept-recommended']) applyRecommended(model, plan);

  if (problems.length) return { error: problems.join('\n') };

  let maps = [];
  if (interactive && !flags['accept-recommended']) {
    maps = await askPlan(model, plan, log);
  } else if (!flags.yes && !flags['accept-recommended'] && !Object.keys(flags).some((k) => ['tools', 'stack', 'require', 'off', 'skill', 'mcp', 'project-mcp', 'project-skill', 'ignore', 'ci'].includes(k))) {
    // non-interactive without answers: keep existing / unset for new items
  }

  // Fill missing mcp categories as unset explicitly
  for (const cat of catalog.mcpCategories || []) {
    if (!model.mcp[cat.key]) model.mcp[cat.key] = { mode: 'unset', providers: [] };
  }

  fs.writeFileSync(path.join(root, CONFIG_FILE), renderConfig(model, catalog, version));
  writeUnknownLog(root, scan, version);

  for (const m of maps) {
    try { localSetMapping(root, m.slug, m.name); } catch (e) { /* ignore */ }
  }

  return {
    model, existed: existing.exists, hadVersion: Boolean(existing.version), previousVersion: existing.version,
    detected, scan, plan, maps,
  };
}

function localSetMapping(root, slug, name) {
  const local = require('./local');
  local.setMapping(root, slug, name);
}

module.exports = { runInit, buildPlan, applyRecommended };
