'use strict';

// AI tools a team can declare in `tools:`. File locations are best-effort and can change as
// the tools evolve; extra skill folders can be added with `skill_locations` in .ai-sdlc.yaml.
const TOOLS = {
  cursor: {
    label: 'Cursor',
    repoSkillDirs: ['.cursor/skills', '.cursor/rules'],
    userSkillDirs: ['.cursor/skills', '.cursor/rules'],
    mcpFiles: ['.cursor/mcp.json'],
  },
  'claude-code': {
    label: 'Claude Code',
    repoSkillDirs: ['.claude/skills', '.claude/commands'],
    userSkillDirs: ['.claude/skills', '.claude/commands'],
    mcpFiles: ['.mcp.json'],
  },
};

// Locations used by several tools.
const SHARED = {
  repoSkillDirs: ['.agents/skills', '.github/prompts'],
  userSkillDirs: ['.agents/skills'],
  mcpFiles: ['.vscode/mcp.json'],
};

const KNOWN_TOOLS = Object.keys(TOOLS);

// When `tools` is empty, every known tool is considered.
function activeTools(config) {
  const t = config && config.tools && config.tools.length ? config.tools : KNOWN_TOOLS;
  return t.filter((x) => TOOLS[x]);
}

function collect(config, key) {
  const out = [];
  for (const t of activeTools(config)) out.push(...TOOLS[t][key]);
  out.push(...SHARED[key]);
  return [...new Set(out)];
}

module.exports = {
  KNOWN_TOOLS,
  TOOLS,
  activeTools,
  repoSkillDirs: (c) => collect(c, 'repoSkillDirs'),
  userSkillDirs: (c) => collect(c, 'userSkillDirs'),
  mcpFiles: (c) => collect(c, 'mcpFiles'),
};
