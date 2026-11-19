'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const YAML = require('yaml');
const tools = require('./tools');

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text || '');
  if (!m) return null;
  try { const v = YAML.parse(m[1]); return v && typeof v === 'object' ? v : null; } catch (e) { return null; }
}

function describeFile(file, fallbackName, isSkillMd) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return null; }
  const fm = frontmatter(text) || {};
  const name = (typeof fm.name === 'string' && fm.name.trim()) || fallbackName;
  const description = typeof fm.description === 'string' ? fm.description.trim().replace(/\s+/g, ' ') : '';
  const issues = [];
  if (isSkillMd) {
    if (!fm.name) issues.push('frontmatter is missing "name"');
    if (!description) issues.push('frontmatter is missing "description"');
  } else if (/\.mdc$/.test(file)) {
    if (!description && fm.globs === undefined && fm.alwaysApply === undefined) issues.push('rule has no description, globs or alwaysApply');
  }
  if (!text.trim()) issues.push('file is empty');
  return { name, description, wellFormed: issues.length === 0, issues };
}

function scanDir(abs, scope, repo, out) {
  let entries;
  try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch (e) { return; }
  for (const d of entries) {
    const p = path.join(abs, d.name);
    let info = null;
    if (d.isDirectory() || d.isSymbolicLink()) {
      const sm = path.join(p, 'SKILL.md');
      if (fs.existsSync(sm)) info = Object.assign({ file: sm }, describeFile(sm, d.name, true));
    } else if (/\.(md|mdc)$/i.test(d.name) && !/^readme/i.test(d.name)) {
      info = Object.assign({ file: p }, describeFile(p, d.name.replace(/\.(prompt\.)?(md|mdc)$/i, ''), false));
    }
    if (!info || !info.name) continue;
    const entry = { name: info.name, description: info.description, scope, wellFormed: info.wellFormed, issues: info.issues };
    if (scope === 'repo') {
      const rel = path.relative(repo.root, info.file).split(path.sep).join('/');
      entry.path = rel;
      entry.committed = repo.isCommitted(rel);
      entry.ignored = repo.isIgnored(rel);
    } else {
      entry.path = info.file.replace(os.homedir(), '~');
    }
    out.push(entry);
  }
}

// Everything that looks like a skill, rule or command in the project and (best effort) in the
// current user's home. Used to resolve named skills and to give the chat audit a candidate list.
function indexSkills(repo, config) {
  const out = [];
  for (const d of tools.repoSkillDirs(config)) scanDir(path.join(repo.root, d), 'repo', repo, out);
  for (const d of tools.userSkillDirs(config)) scanDir(path.join(os.homedir(), d), 'user', repo, out);
  for (const extra of (config && config.skillLocations) || []) {
    const abs = extra.startsWith('~') ? path.join(os.homedir(), extra.slice(1)) : path.resolve(repo.root, extra);
    scanDir(abs, abs.startsWith(repo.root + path.sep) ? 'repo' : 'user', repo, out);
  }
  return out;
}

module.exports = { frontmatter, indexSkills };
