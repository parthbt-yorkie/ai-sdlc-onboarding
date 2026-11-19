'use strict';

const ICON = { fail: 'FAIL', warn: 'WARN', 'needs-chat': 'CHAT', 'cannot-verify': 'SKIP', ignored: 'IGNORED', pass: 'PASS', na: 'N/A' };

function indentBlock(t, n) {
  return String(t).split('\n').map((l) => ' '.repeat(n) + l).join('\n');
}

function renderMarkdown(res, opts) {
  const skillDir = (opts && opts.skillDir) || '<skill folder>';
  const fill = (t) => String(t || '').replace(/\{\{skill_dir\}\}/g, skillDir);
  const L = [];
  const c = res.counts;

  L.push(`# AI SDLC onboarding: ${res.project}`);
  L.push('');
  L.push(`**Verdict: ${res.verdict.label}**`);
  let scoreLine = res.score === null ? 'Score: n/a (nothing could be evaluated)' : `Score: **${res.score}%** (${c.pass} passing, ${c.fail} failing, ${c.warn} warning)`;
  if (res.previous && res.previous.score != null && res.score !== null) {
    const d = res.score - res.previous.score;
    scoreLine += `, ${d === 0 ? 'unchanged' : (d > 0 ? '+' : '') + d + ' points'} since ${res.previous.generatedAt.slice(0, 10)}`;
  }
  L.push(scoreLine);
  L.push(`Mode: ${res.mode === 'ci' ? 'CI (configuration only)' : 'local'} | skill v${res.skillVersion} | config v${res.configVersion} | tools: ${res.tools.join(', ') || 'none'} | stack: ${res.stack.join(', ') || 'unknown'}`);
  if (c.totalMust) L.push(`Must-have checks ignored: ${c.ignoredMust} of ${c.totalMust}`);
  if (res.verdict.ready && (c.needsChat || c.cannotVerify)) {
    L.push(`Not yet covered: ${c.needsChat + c.cannotVerify} item(s) need chat or a local run, so this verdict is **${res.verdict.scope}** only.`);
  }
  L.push('');

  if (res.steps.length) {
    L.push(`## Path to 100% (${res.steps.length} step${res.steps.length === 1 ? '' : 's'})`);
    L.push('');
    res.steps.forEach((s, i) => {
      L.push(`${i + 1}. **[${ICON[s.status]}] \`${s.slug}\`**: ${s.title}`);
      if (s.detail) L.push(`   - Found: ${s.detail}`);
      if (s.why) L.push(`   - Why it matters: ${s.why}`);
      if (s.fix) { L.push('   - Fix:'); L.push(indentBlock(fill(s.fix).trim(), 7)); }
      L.push('');
    });
  } else {
    L.push('## Path to 100%');
    L.push('');
    L.push('Nothing left to fix among the checks that could be evaluated here.');
    L.push('');
  }

  if (res.toVerify.length) {
    L.push(`## Still to verify (${res.toVerify.length})`);
    L.push('');
    for (const v of res.toVerify) {
      L.push(`- **[${ICON[v.status]}] \`${v.slug}\`**: ${v.title}: ${v.detail}`);
      if (v.candidates && v.candidates.length) L.push(`  - Candidates found: ${v.candidates.map((x) => `${x.name} (${x.scope})`).join(', ')}`);
    }
    L.push('');
  }

  const ignored = res.items.filter((r) => r.gating && r.status === 'ignored');
  if (ignored.length) {
    L.push(`## Ignored (${ignored.length})`);
    L.push('');
    for (const r of ignored) L.push(`- \`${r.slug}\`: ${r.detail}`);
    L.push('');
  }

  if (res.undecided.length) {
    L.push(`## Undecided (${res.undecided.length}): not affecting the verdict`);
    L.push('');
    L.push('Run `init` (or edit `.ai-sdlc.yaml`) to set these to required/off or custom/off/skill name:');
    for (const u of res.undecided.slice(0, 12)) L.push(`- \`${u.slug}\`: ${u.title}`);
    if (res.undecided.length > 12) L.push(`- ... and ${res.undecided.length - 12} more`);
    L.push('');
  }

  if (res.warnings.length) {
    L.push('## Notices');
    L.push('');
    for (const w of res.warnings) L.push(`- ${w}`);
    L.push('');
  }

  if (res.unknown && (res.unknown.files || res.unknown.mcpServers)) {
    L.push('## Not covered by this skill version');
    L.push('');
    L.push(`${res.unknown.files} config file(s) and ${res.unknown.mcpServers} MCP server(s) are not recognised yet.`);
    L.push(`Logged to \`${res.unknown.path}\` (local, not committed) so you can extend the skill.`);
    if (res.unknown.sample && res.unknown.sample.length) L.push(`Examples: ${res.unknown.sample.join(', ')}`);
    if (res.unknown.mcpSample && res.unknown.mcpSample.length) L.push(`Unknown MCP: ${res.unknown.mcpSample.join(', ')}`);
    L.push('');
  }

  const passed = res.items.filter((r) => r.gating && r.status === 'pass').map((r) => `\`${r.slug}\``);
  if (passed.length) { L.push(`## Passed (${passed.length})`); L.push(''); L.push(passed.join(', ')); L.push(''); }

  if (c.needsChat || res.chat.reviewInChat.length) {
    L.push('---');
    L.push(`For the detailed report, run this in chat: "${res.chat.triggerPhrase}"`);
  }
  if (opts && opts.savedTo) L.push(`Result saved to ${opts.savedTo} (not committed).`);
  return L.join('\n') + '\n';
}

module.exports = { renderMarkdown };
