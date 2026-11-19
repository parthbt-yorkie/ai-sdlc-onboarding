'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

// Per-person, never committed. The folder carries its own .gitignore ("*") so the project's
// .gitignore is never touched.
const DIR = '.ai-sdlc';
const KEEP_REPORTS = 20;

function dirPath(root) { return path.join(root, DIR); }

function ensureDir(root) {
  const d = dirPath(root);
  fs.mkdirSync(path.join(d, 'reports'), { recursive: true });
  const gi = path.join(d, '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, '*\n');
  return d;
}

function readLocal(root) {
  const f = path.join(dirPath(root), 'local.yaml');
  try {
    const v = YAML.parse(fs.readFileSync(f, 'utf8')) || {};
    return { skill_mappings: v.skill_mappings && typeof v.skill_mappings === 'object' ? v.skill_mappings : {} };
  } catch (e) {
    return { skill_mappings: {} };
  }
}

function writeLocal(root, data) {
  ensureDir(root);
  const header = '# Personal, uncommitted. Maps a "custom" skill slug to the skill YOU use for it.\n# Managed by: ai-sdlc-onboarding map <slug>=<skill-name>\n';
  fs.writeFileSync(path.join(dirPath(root), 'local.yaml'), header + YAML.stringify(data));
}

function setMapping(root, slug, name) {
  const d = readLocal(root);
  if (name) d.skill_mappings[slug] = name; else delete d.skill_mappings[slug];
  writeLocal(root, d);
}

function readLatest(root) {
  try { return JSON.parse(fs.readFileSync(path.join(dirPath(root), 'reports', 'latest.json'), 'utf8')); } catch (e) { return null; }
}

function saveReport(root, result, now) {
  ensureDir(root);
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const dir = path.join(dirPath(root), 'reports');
  const file = path.join(dir, `audit-${stamp}.json`);
  const body = JSON.stringify(result, null, 2) + '\n';
  fs.writeFileSync(file, body);
  fs.writeFileSync(path.join(dir, 'latest.json'), body);
  const old = fs.readdirSync(dir).filter((f) => /^audit-.*\.json$/.test(f)).sort();
  for (const f of old.slice(0, Math.max(0, old.length - KEEP_REPORTS))) fs.unlinkSync(path.join(dir, f));
  return path.relative(root, file).split(path.sep).join('/');
}

module.exports = { DIR, dirPath, readLocal, setMapping, readLatest, saveReport, ensureDir };
