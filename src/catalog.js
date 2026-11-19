'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

function combineApplies(a, b) {
  if (a && b) return { type: 'all', of: [a, b] };
  return a || b || null;
}

function normCheck(c, section, group, groupDef) {
  return Object.assign({
    level: section.level,
    tier: 'script',
    scope: 'repo',
    stack: ['any'],
    since: '0.1.0',
    soft: false,
    why: '',
    fix: '',
  }, c, {
    section: section.key,
    group: group || null,
    setup: (groupDef && groupDef.setup) || null,
    applies: combineApplies(groupDef && groupDef.applies, c.applies),
  });
}

function mcpChecks(g) {
  const label = g.title;
  const slug = g.slug;
  const configured = { type: 'custom', name: 'mcp-server', match: g.match, require: 'present' };
  return [
    {
      slug: `${slug}-configured`,
      title: `${label} is configured in the project MCP config`,
      why: `Everyone working on this project needs the same ${label} connection, defined in a committed project-level file.`,
      detect: configured,
      fix: `Add a server for ${label} to the project MCP config (Cursor: .cursor/mcp.json, Claude Code: .mcp.json) and commit it.\nUse environment-variable references for credentials, never literal values.\nSetup guide: {{skill_dir}}/${g.setup}`,
    },
    {
      slug: `${slug}-env-declared`,
      title: `${label} environment variables are declared`,
      why: 'A new machine cannot connect if nobody knows which variables the MCP server needs.',
      applies: configured,
      detect: { type: 'custom', name: 'mcp-server', match: g.match, require: 'env-declared' },
      fix: `List every environment variable referenced by the ${label} server config in .env.example (names only, no values).`,
    },
    {
      slug: `${slug}-env-set`,
      title: `${label} environment variables are set on this machine`,
      why: 'The MCP server cannot start without its variables.',
      scope: 'local',
      applies: configured,
      detect: { type: 'custom', name: 'mcp-env-set', match: g.match },
      fix: `Set the missing variables in your shell or in an uncommitted .env file. Setup guide: {{skill_dir}}/${g.setup}`,
    },
    {
      slug: `${slug}-authenticated`,
      title: `${label} connection works and is authenticated`,
      why: 'Configured is not the same as working: tokens expire and logins differ per person.',
      scope: 'local',
      tier: 'chat',
      applies: configured,
      chat_note: `Validate in chat: confirm the ${label} tools are available in this session and make one harmless read-only call.`,
      fix: `Authenticate the ${label} MCP server in your AI tool (setup guide: {{skill_dir}}/${g.setup}), then re-run the chat audit.`,
    },
  ];
}

function projectMcpChecks(name, entry) {
  const label = entry.description || name;
  const match = entry.match || name;
  const g = { slug: `project-mcp-${name}`, title: label, match, setup: 'references/integrations/project-mcp.md' };
  return mcpChecks(g).map((c) => {
    // authenticated stays chat; keep as-is
    return c;
  });
}

function loadCatalog(skillDir) {
  const doc = YAML.parse(fs.readFileSync(path.join(skillDir, 'references', 'catalog.yaml'), 'utf8'));
  const sections = [];
  const checks = [];
  const items = [];
  const skills = [];
  const mcpCategories = [];
  const mcpProviders = [];

  for (const [key, sec] of Object.entries(doc.sections || {})) {
    const section = { key, title: sec.title || key, description: sec.description || '', level: sec.level || 'must', kind: sec.skills ? 'skills' : 'checks' };
    sections.push(section);

    if (sec.skills) {
      for (const s of sec.skills) {
        skills.push(Object.assign({ stack: ['any'], kind: 'skill', group: 'General', onboarding: false }, s, { section: key }));
      }
      continue;
    }

    if (sec.mcp_categories) {
      for (const [catKey, cat] of Object.entries(sec.mcp_categories)) {
        const category = {
          key: catKey,
          title: cat.title || catKey,
          description: cat.description || '',
          defaultOff: cat.default_off_unless_stack || null,
          providers: [],
        };
        for (const p of cat.providers || []) {
          const provider = {
            key: p.key,
            slug: p.slug || p.key,
            title: p.title || p.key,
            description: p.description || '',
            match: p.match || p.key,
            setup: p.setup || null,
            category: catKey,
            stack: p.stack || ['any'],
            template: p.template || null,
          };
          category.providers.push(provider);
          mcpProviders.push(provider);

          const groupDef = {
            slug: provider.slug,
            title: provider.title,
            description: provider.description,
            setup: provider.setup,
            match: provider.match,
            applies: p.applies || null,
            stack: provider.stack,
          };
          const defs = [];
          if (p.template === 'mcp') defs.push(...mcpChecks(groupDef));
          defs.push(...(p.checks || []));
          const normed = defs.map((c) => normCheck(c, section, provider.slug, groupDef));
          checks.push(...normed);
          items.push({
            slug: provider.slug,
            key: provider.key,
            title: provider.title,
            description: provider.description,
            section: key,
            category: catKey,
            stack: provider.stack,
            checks: normed.map((c) => c.slug),
            setup: provider.setup,
            kind: 'mcp-provider',
            mcp: true,
          });
        }
        mcpCategories.push(category);
      }
    }

    for (const c of sec.checks || []) {
      const check = normCheck(c, section, section.level === 'optional' ? c.slug : null, null);
      checks.push(check);
      if (section.level === 'optional') {
        items.push({ slug: c.slug, title: c.title, description: c.why, section: key, stack: c.stack || ['any'], checks: [c.slug], kind: 'check' });
      }
    }
    for (const g of sec.groups || []) {
      const defs = [];
      if (g.template === 'mcp') defs.push(...mcpChecks(g));
      defs.push(...(g.checks || []));
      const normed = defs.map((c) => normCheck(c, section, g.slug, g));
      checks.push(...normed);
      items.push({
        slug: g.slug,
        key: g.key || g.slug,
        title: g.title,
        description: g.description,
        section: key,
        stack: g.stack || ['any'],
        checks: normed.map((c) => c.slug),
        setup: g.setup || null,
        kind: 'group',
      });
    }
  }

  const seen = new Map();
  const claim = (slug, what) => {
    if (seen.has(slug) && !(seen.get(slug) === 'check' && what === 'item-check')) throw new Error(`Duplicate slug in catalog: ${slug}`);
    seen.set(slug, what);
  };
  for (const c of checks) claim(c.slug, 'check');
  for (const i of items) if (i.kind === 'group' || i.kind === 'mcp-provider') claim(i.slug, i.kind);
  for (const s of skills) claim(s.slug, 'skill');

  return { version: doc.version || 1, sections, checks, items, skills, mcpCategories, mcpProviders, projectMcpChecks };
}

module.exports = { loadCatalog, projectMcpChecks, mcpChecks };
