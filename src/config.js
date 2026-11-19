'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { KNOWN_STACK } = require('./stack');
const { KNOWN_TOOLS } = require('./tools');

const CONFIG_FILE = '.ai-sdlc.yaml';
const SOURCE = 'github.com/parthbt-yorkie/ai-sdlc-onboarding';

const LEGACY_MCP = {
  github: { category: 'code-host', key: 'github' },
  'gerrit-mcp': { category: 'code-host', key: 'gerrit' },
  'jira-mcp': { category: 'issue-tracker', key: 'jira' },
  'figma-mcp': { category: 'design', key: 'figma' },
  'sentry-mcp': { category: 'errors', key: 'sentry' },
};

function normOptional(v) {
  if (v === true) return 'required';
  if (v === false) return 'off';
  if (v == null) return 'unset';
  const s = String(v).trim().toLowerCase();
  if (['required', 'y', 'yes', 'true', 'on'].includes(s)) return 'required';
  if (['off', 'n', 'no', 'false', 'skip'].includes(s)) return 'off';
  if (['unset', 'undecided', '?', ''].includes(s)) return 'unset';
  return null;
}

function normSkill(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const inner = normSkill(v.skill !== undefined ? v.skill : v.value);
    return Object.assign({}, inner, {
      description: v.description ? String(v.description) : '',
      source: v.source ? String(v.source) : '',
      path: v.path ? String(v.path) : '',
      match: v.match ? String(v.match) : '',
    });
  }
  if (v === true) return { mode: 'custom' };
  if (v === false) return { mode: 'off' };
  if (v == null) return { mode: 'unset' };
  const s = String(v).trim();
  const l = s.toLowerCase();
  if (['custom', 'y', 'yes', 'any', 'true'].includes(l)) return { mode: 'custom' };
  if (['off', 'n', 'no', 'false', 'skip'].includes(l)) return { mode: 'off' };
  if (['unset', 'undecided', '?', ''].includes(l)) return { mode: 'unset' };
  return { mode: 'named', name: s };
}

function listOf(v) {
  if (v == null) return [];
  return (Array.isArray(v) ? v : String(v).split(',')).map((x) => String(x).trim()).filter(Boolean);
}

function normMcpValue(v) {
  if (v == null) return { mode: 'unset', providers: [] };
  if (typeof v === 'string') {
    const l = v.trim().toLowerCase();
    if (['off', 'n', 'no', 'false'].includes(l)) return { mode: 'off', providers: [] };
    if (['unset', 'undecided', '?', ''].includes(l)) return { mode: 'unset', providers: [] };
    return { mode: 'providers', providers: listOf(v) };
  }
  if (Array.isArray(v)) {
    const providers = v.map(String).map((x) => x.trim()).filter(Boolean);
    return providers.length ? { mode: 'providers', providers } : { mode: 'unset', providers: [] };
  }
  return { mode: 'unset', providers: [] };
}

function migrateLegacyMcp(optional, mcp) {
  const out = Object.assign({}, mcp);
  const leftover = Object.assign({}, optional);
  for (const [slug, map] of Object.entries(LEGACY_MCP)) {
    if (!(slug in leftover)) continue;
    const state = leftover[slug];
    delete leftover[slug];
    if (out[map.category] && out[map.category].mode !== 'unset') continue;
    if (state === 'required') out[map.category] = { mode: 'providers', providers: [map.key] };
    else if (state === 'off') out[map.category] = { mode: 'off', providers: [] };
    else out[map.category] = { mode: 'unset', providers: [] };
  }
  return { optional: leftover, mcp: out };
}

function loadConfig(root, now) {
  const file = path.join(root, CONFIG_FILE);
  const out = {
    exists: false, path: file, errors: [], warnings: [], version: null, source: SOURCE,
    tools: [], stack: [], ci: false, optional: {}, skills: {}, projectSkills: {},
    mcp: {}, projectMcp: {}, ignored: [], skillLocations: [], extras: {},
  };
  if (!fs.existsSync(file)) return out;
  out.exists = true;

  let raw;
  try { raw = YAML.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
    out.errors.push(`${CONFIG_FILE} is not valid YAML: ${String(e.message).split('\n')[0]}`);
    return out;
  }
  if (raw == null) raw = {};
  if (typeof raw !== 'object' || Array.isArray(raw)) { out.errors.push(`${CONFIG_FILE} must be a YAML mapping`); return out; }

  const known = new Set(['skill', 'tools', 'stack', 'ci', 'optional_checks', 'skills', 'project_skills', 'ignored_checks', 'skill_locations', 'mcp', 'project_mcp']);
  for (const k of Object.keys(raw)) if (!known.has(k)) { out.extras[k] = raw[k]; out.warnings.push(`unknown top-level key "${k}" in ${CONFIG_FILE}`); }

  const skill = raw.skill && typeof raw.skill === 'object' ? raw.skill : {};
  out.version = skill.version ? String(skill.version) : null;
  if (skill.source) out.source = String(skill.source);

  out.tools = listOf(raw.tools);
  for (const t of out.tools) if (!KNOWN_TOOLS.includes(t)) out.warnings.push(`unknown tool "${t}" in tools (known: ${KNOWN_TOOLS.join(', ')})`);
  out.stack = listOf(raw.stack);
  for (const t of out.stack) if (!KNOWN_STACK.includes(t)) out.warnings.push(`unknown stack tag "${t}" (known: ${KNOWN_STACK.join(', ')})`);
  out.ci = raw.ci === true || String(raw.ci).toLowerCase() === 'true';
  out.skillLocations = listOf(raw.skill_locations);

  const optional = {};
  for (const [slug, v] of Object.entries(raw.optional_checks || {})) {
    const n = normOptional(v);
    if (n === null) { out.warnings.push(`optional_checks.${slug}: "${v}" is not required/off/unset; treated as unset`); optional[slug] = 'unset'; }
    else optional[slug] = n;
  }

  const mcp = {};
  for (const [cat, v] of Object.entries(raw.mcp || {})) mcp[cat] = normMcpValue(v);
  const migrated = migrateLegacyMcp(optional, mcp);
  out.optional = migrated.optional;
  out.mcp = migrated.mcp;
  if (Object.keys(raw.optional_checks || {}).some((k) => LEGACY_MCP[k]) && !raw.mcp) {
    out.warnings.push('legacy optional_checks MCP entries are still supported; re-run init to move them into mcp:');
  }

  for (const [slug, v] of Object.entries(raw.skills || {})) out.skills[slug] = normSkill(v);
  for (const [slug, v] of Object.entries(raw.project_skills || {})) out.projectSkills[slug] = normSkill(v);
  for (const [slug, v] of Object.entries(raw.project_mcp || {})) {
    if (v && typeof v === 'object') {
      out.projectMcp[slug] = {
        match: String(v.match || slug),
        description: v.description ? String(v.description) : '',
        mode: v.off === true || v.mode === 'off' ? 'off' : 'required',
      };
    } else if (v === false || String(v).toLowerCase() === 'off') {
      out.projectMcp[slug] = { match: slug, description: '', mode: 'off' };
    } else {
      out.projectMcp[slug] = { match: String(v || slug), description: '', mode: 'required' };
    }
  }

  const nowMs = (now || new Date()).getTime();
  for (const e of Array.isArray(raw.ignored_checks) ? raw.ignored_checks : []) {
    const slug = e && (e.slug || e.id);
    if (!slug) { out.errors.push('ignored_checks: every entry needs a "slug"'); continue; }
    const reason = e.reason ? String(e.reason).trim() : '';
    if (!reason) { out.errors.push(`ignored_checks: "${slug}" needs a "reason" (why is it safe to skip?)`); continue; }
    const entry = { slug: String(slug), reason, expires: e.expires ? String(e.expires) : null, expired: false, expiresSoon: false };
    if (entry.expires) {
      const end = Date.parse(entry.expires + (entry.expires.length === 10 ? 'T23:59:59Z' : ''));
      if (Number.isNaN(end)) out.errors.push(`ignored_checks: "${slug}" has an invalid expires date "${entry.expires}" (use YYYY-MM-DD)`);
      else { entry.expired = nowMs > end; entry.expiresSoon = !entry.expired && end - nowMs < 30 * 86400000; }
    }
    out.ignored.push(entry);
  }
  return out;
}

function wrap(text, width, prefix) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width - prefix.length) { lines.push(prefix + cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(prefix + cur);
  return lines;
}

function indent(text, n) {
  return text.split('\n').filter((l, i, a) => !(i === a.length - 1 && l === '')).map((l) => ' '.repeat(n) + l).join('\n');
}

const flow = (list) => `[${list.join(', ')}]`;
const val = (s) => YAML.stringify(String(s)).trim();

function stackMatches(itemStack, stack) {
  return !itemStack || itemStack.includes('any') || itemStack.some((t) => stack.includes(t));
}

function mcpRenderValue(v) {
  if (!v || v.mode === 'unset') return 'unset';
  if (v.mode === 'off') return 'off';
  return v.providers.length === 1 ? v.providers[0] : flow(v.providers);
}

function providerRequired(config, catalog, providerSlugOrKey) {
  for (const [cat, v] of Object.entries(config.mcp || {})) {
    if (!v || v.mode !== 'providers') continue;
    const catDef = (catalog.mcpCategories || []).find((c) => c.key === cat);
    for (const key of v.providers) {
      const p = (catDef && catDef.providers.find((x) => x.key === key || x.slug === key))
        || (catalog.mcpProviders || []).find((x) => x.key === key || x.slug === key);
      if (!p) continue;
      if (p.slug === providerSlugOrKey || p.key === providerSlugOrKey) return true;
    }
  }
  // legacy optional_checks
  if (config.optional[providerSlugOrKey] === 'required') return true;
  for (const [legacy, map] of Object.entries(LEGACY_MCP)) {
    if (map.key === providerSlugOrKey && config.optional[legacy] === 'required') return true;
  }
  return false;
}

function renderConfig(model, catalog, version) {
  const L = [];
  const push = (...x) => L.push(...x);
  push(
    '# =============================================================================',
    '# AI SDLC onboarding configuration  (commit this file)',
    '# =============================================================================',
    '# What this is: this project\'s answers about what "AI SDLC ready" means here.',
    '# Anyone who runs the audit (CLI, CI or chat) is checked against these answers.',
    '# You can edit it by hand. Run `audit` to validate. Re-run `init` after updating the',
    '# skill: it keeps your answers and only asks about newly added items.',
    '#',
    '# Install the onboarding skill at the pinned version below (any skills folder works; add it',
    '# to .gitignore if you do not want to commit it):',
    `#   git clone --branch v${version} https://github.com/parthbt-yorkie/ai-sdlc-onboarding.git .cursor/skills/ai-sdlc-onboarding`,
    '# Run:',
    '#   node .cursor/skills/ai-sdlc-onboarding/scripts/ai-sdlc-onboarding.cjs audit',
    '# =============================================================================',
    '',
    'skill:',
    `  source: ${model.source || SOURCE}`,
    `  version: ${version}   # the skill version this file was created with (changed by init)`,
    '',
    '# AI tools your team uses: cursor, claude-code. Decides which skill, rule and MCP',
    '# locations are inspected. Leave empty to inspect every known tool. Shared folders',
    '# are always included (.agents/skills, .github/prompts, .vscode/mcp.json).',
    '# Add more folders with skill_locations.',
    `tools: ${flow(model.tools)}`,
    '',
    '# Detected technology stack: node, typescript, react, python, django. Decides which checks apply.',
    `stack: ${flow(model.stack)}`,
    '',
    '# true = this project runs the audit in CI (see assets/ci-github-actions.yml in the skill).',
    '# CI checks configuration only; authentication is validated on a developer machine or in chat.',
    `ci: ${model.ci ? 'true' : 'false'}`,
    '',
    '# -----------------------------------------------------------------------------',
    '# MCP providers by category. Value: a provider key, a list, off, or unset.',
    '# Alternatives in the same category (e.g. github vs gitlab) are offered at init.',
    '# -----------------------------------------------------------------------------',
    'mcp:'
  );
  for (const cat of catalog.mcpCategories || []) {
    push(...wrap(`${cat.title}: ${cat.description}`, 100, '  # '));
    const keys = cat.providers.map((p) => p.key).join(', ');
    push(`  # providers: ${keys}`);
    const cur = (model.mcp && model.mcp[cat.key]) || { mode: 'unset', providers: [] };
    push(`  ${cat.key}: ${mcpRenderValue(cur)}`);
  }

  push(
    '',
    '# Project-specific MCP servers not in the catalog (accepted during init from unknown servers).',
    'project_mcp:'
  );
  const pm = Object.entries(model.projectMcp || {});
  if (pm.length) {
    const obj = {};
    for (const [slug, v] of pm) {
      if (v.mode === 'off') obj[slug] = 'off';
      else {
        obj[slug] = { match: v.match || slug };
        if (v.description) obj[slug].description = v.description;
      }
    }
    push(indent(YAML.stringify(obj), 2));
  }

  push(
    '',
    '# -----------------------------------------------------------------------------',
    '# Optional checks',
    '#   required = must pass for the project to be READY',
    '#   off      = this project does not use it, do not check',
    '#   unset    = not decided yet (shown as a reminder, does not affect the verdict)',
    '# Must-have checks always run. ignored_checks can skip a gating check with a reason.',
    '# -----------------------------------------------------------------------------',
    'optional_checks:'
  );
  const optSections = catalog.sections.filter((s) => s.level === 'optional' && s.kind === 'checks');
  const mcpSlugs = new Set((catalog.items || []).filter((i) => i.kind === 'mcp-provider').map((i) => i.slug));
  for (const sec of optSections) {
    const its = catalog.items.filter((i) => i.section === sec.key && i.kind !== 'mcp-provider' && stackMatches(i.stack, model.stack));
    if (!its.length) continue;
    push(`  # ---- ${sec.title} ----`);
    for (const i of its) {
      push(...wrap(`${i.title}: ${i.description}`, 100, '  # '));
      push(`  ${i.slug}: ${model.optional[i.slug] || 'unset'}`);
    }
  }
  const knownOpt = new Set(catalog.items.filter((i) => i.kind !== 'mcp-provider').map((i) => i.slug));
  for (const [slug, v] of Object.entries(model.optional || {})) {
    if (!knownOpt.has(slug) && !mcpSlugs.has(slug) && !LEGACY_MCP[slug]) push(`  ${slug}: ${v}   # not in this skill version's catalog`);
  }

  push(
    '',
    '# -----------------------------------------------------------------------------',
    '# Skills, rules and workflows. For each capability choose one:',
    '#   custom       = everyone needs SOME relevant skill/rule for this; which one is their choice',
    '#   <skill-name> = this exact skill must exist in everyone\'s setup',
    '#   off          = do not check',
    '#   unset        = not decided yet',
    '# Skills marked onboarding in the catalog must be decided (not unset) for READY.',
    '# -----------------------------------------------------------------------------',
    'skills:'
  );
  let lastGroup = null;
  for (const s of catalog.skills.filter((x) => stackMatches(x.stack, model.stack))) {
    if (s.group !== lastGroup) { push(`  # ---- ${s.group}${s.onboarding ? ' (onboarding)' : ''} ----`); lastGroup = s.group; }
    push(...wrap(`${s.title}: ${s.description}`, 100, '  # '));
    const cur = model.skills[s.slug];
    push(`  ${s.slug}: ${cur ? skillValue(cur) : 'unset'}`);
  }
  const knownSkills = new Set(catalog.skills.map((s) => s.slug));
  for (const [slug, v] of Object.entries(model.skills || {})) {
    if (!knownSkills.has(slug)) push(`  ${slug}: ${skillValue(v)}   # not in this skill version's catalog (use project_skills for your own)`);
  }

  push(
    '',
    '# -----------------------------------------------------------------------------',
    '# Project-specific skills: required for THIS project but not part of the catalog.',
    '# Same rules as above. Add `description` so the chat audit can recognise a match.',
    '# -----------------------------------------------------------------------------',
    'project_skills:'
  );
  const ps = Object.entries(model.projectSkills || {});
  if (ps.length) {
    const obj = {};
    for (const [slug, v] of ps) {
      if (v.description || v.source || v.path) {
        obj[slug] = { skill: skillValue(v) };
        if (v.description) obj[slug].description = v.description;
        if (v.source) obj[slug].source = v.source;
        if (v.path) obj[slug].path = v.path;
      } else obj[slug] = skillValue(v);
    }
    push(indent(YAML.stringify(obj), 2));
  }

  push(
    '',
    '# -----------------------------------------------------------------------------',
    '# Ignored checks: skip a gating check. A reason is required.',
    '# `expires` (YYYY-MM-DD) is optional. Active ignores are listed in the audit report.',
    '# -----------------------------------------------------------------------------',
    'ignored_checks:'
  );
  if (model.ignored && model.ignored.length) {
    push(indent(YAML.stringify(model.ignored.map((e) => {
      const o = { slug: e.slug, reason: e.reason };
      if (e.expires) o.expires = e.expires;
      return o;
    })), 2));
  }

  if (model.skillLocations && model.skillLocations.length) {
    push('', '# Extra folders to look for skills/rules in (relative to the repo, or ~ for your home folder).', 'skill_locations:');
    for (const s of model.skillLocations) push(`  - ${val(s)}`);
  }
  if (model.extras && Object.keys(model.extras).length) {
    push('', '# Other settings preserved from the previous file', YAML.stringify(model.extras).trimEnd());
  }
  return L.join('\n') + '\n';
}

function skillValue(v) {
  if (v.mode === 'named') return val(v.name);
  return v.mode;
}

module.exports = {
  CONFIG_FILE, SOURCE, LEGACY_MCP, loadConfig, renderConfig, normSkill, normOptional, normMcpValue,
  stackMatches, wrap, providerRequired, migrateLegacyMcp, listOf,
};
