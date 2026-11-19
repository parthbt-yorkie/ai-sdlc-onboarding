# ai-sdlc-onboarding

Onboards a project for AI-assisted development (AI SDLC) and audits whether it stays ready:
reproducible environment, shared tooling, committed agent context, MCP servers and skills.

| Where | Command | Decides |
|---|---|---|
| Terminal / chat | `init` | Scans the repo, asks with recommendations, writes `.ai-sdlc.yaml` |
| Terminal | `audit` | Everything decidable from files and this machine |
| CI | `audit --ci` | Configuration only (no machine or login checks) |
| AI chat | "Run the AI SDLC onboarding (full)" | Skill matching, MCP authentication, judgement calls |

**Only `.ai-sdlc.yaml` is committed.** Reports and `unknown-configs.json` live in `.ai-sdlc/` (its own
`.gitignore` with `*`). The audit runs only when that file is valid and records `skill.version`.
Needs Node 18+ (no `npm install` required; the CLI is a single bundled file).

## Install into a project

```bash
# from the project root
git clone --branch v0.2.0 https://github.com/parthbt-yorkie/ai-sdlc-onboarding.git .cursor/skills/ai-sdlc-onboarding
echo ".cursor/skills/ai-sdlc-onboarding/" >> .gitignore   # optional: do not commit the skill itself
CLI="node .cursor/skills/ai-sdlc-onboarding/scripts/ai-sdlc-onboarding.cjs"
```

## Workflow

```text
new project → install skill → init (scan + questions) → commit .ai-sdlc.yaml → audit → score + Path to 100%
```

### 1. Init (onboarding)

```bash
$CLI init                         # interactive: scan + recommended answers
$CLI init --plan --format json    # question plan for chat / agents
$CLI init --yes --accept-recommended   # apply every recommendation without asking
```

`init` scans the repo (stack, tools, committed MCP configs, skills, missing standard files). It asks:

1. Tools and stack (auto-detected)
2. Whether the project runs the audit in CI
3. MCP providers by category, with alternatives (e.g. GitHub vs GitLab vs Gerrit). Recommends **yes** when
   that server is already configured in the repo
4. Unknown MCP servers → optional `project_mcp` entries (also logged for later skill versions)
5. Coverage areas (coding / process / code review / tooling / best practices / agent setup / quality)
6. Onboarding skills (must be decided: custom, a name, or off)
7. Missing standard files: intentional? → `ignored_checks` with a reason; otherwise left as audit actions

Unrecognised config files are written to `.ai-sdlc/unknown-configs.json` (local) so you can extend the skill.

Flags for scripts and chat:

```bash
$CLI init --yes --tools cursor --stack node,react,typescript \
  --mcp code-host=github,gerrit --mcp design=figma --mcp chat=off \
  --require codeowners,contributing-guide --skill plan-before-coding=y \
  --skill self-review=my-review-skill \
  --project-mcp internal-search=internal-search \
  --ignore pull-request-template="intentionally not used" --ci
```

### 2. Audit

```bash
$CLI audit
$CLI audit --ci
$CLI audit --format json
```

Exit codes: `0` ready, `1` not ready, `2` setup problem.

Verdict labels: `READY (config only)` in CI, `READY (config + local config)` locally, `READY (full)` only
after the chat audit. Score = pass / (pass + fail + warn) over gating checks. Only status **fail** blocks READY.
Onboarding skills left `unset` fail the audit (since skill v0.2.0).

### 3. Chat

> Onboard this project for AI SDLC

or

> Run the AI SDLC onboarding (full)

## `.ai-sdlc.yaml`

```yaml
skill:
  source: github.com/parthbt-yorkie/ai-sdlc-onboarding
  version: 0.2.0
tools: [cursor]
stack: [node, typescript, react]
ci: true

mcp:
  code-host: [gerrit, github]   # alternatives in one category
  issue-tracker: jira
  design: figma
  chat: off
  library-docs: unset

project_mcp:
  internal-search:
    match: internal-search
    description: Company code search

optional_checks:
  sentry-security: required
  codeowners: required
  contributing-guide: unset

skills:
  plan-before-coding: custom
  self-review: my-review-skill

ignored_checks:
  - slug: pull-request-template
    reason: intentionally not used
```

- MCP categories: `code-host`, `issue-tracker`, `docs`, `design`, `errors`, `chat`, `browser`, `database`, `library-docs`
- Legacy `optional_checks` keys (`gerrit-mcp`, `jira-mcp`, …) still load; re-run `init` to move them into `mcp:`

## Files

| File | Committed? | Purpose |
|---|---|---|
| `.ai-sdlc.yaml` | yes | Project requirements (source of truth) |
| `.ai-sdlc/reports/` | no | Saved audit results (last 20 + `latest.json`) |
| `.ai-sdlc/local.yaml` | no | Personal skill mappings |
| `.ai-sdlc/unknown-configs.json` | no | Configs / MCP servers this skill version does not cover |

## Coverage

Always-on (must): environment, verification, enforcement, agent context, security, conventions, MCP hygiene.

Optional (yaml toggles): quality guardrails, coding standards, process standards, code review, tooling,
best practices, agent setup, integrations (MCP + Sentry security), and skills.

## Updating the skill

```bash
git -C .cursor/skills/ai-sdlc-onboarding fetch --tags
git -C .cursor/skills/ai-sdlc-onboarding checkout v0.2.0
$CLI init        # keeps answers, migrates MCP, adds new items as unset
```

- Installed skill older than `skill.version`: stop and print the checkout command.
- Newer major: stop and run `init`.
- Newer same major: run; checks with a newer `since` warn until you re-run `init`.

## Development

```bash
npm install
npm run build
npm test
```

Release: bump `version` in `package.json`, `npm run build`, commit, tag `v<version>`.
