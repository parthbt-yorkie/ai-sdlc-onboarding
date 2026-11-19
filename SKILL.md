---
name: ai-sdlc-onboarding
description: Audits and sets up whether a project is ready for AI-assisted development (AI SDLC). Use whenever the user says "Run the AI SDLC onboarding (full)", asks to init, re-init, onboard a project for AI SDLC, or run an AI SDLC / AI-readiness audit, wants to check project setup standards (formatter, linter, pre-commit, CI, AGENTS.md, MCP servers, skills, rules, env setup) for a repo, wants to know what a teammate or a new machine still needs before working on a project, or wants to add required skills, MCP integrations to the project's AI SDLC requirements. Covers the config file .ai-sdlc.yaml, the CLI audit, and the chat-only validation (skills, MCP authentication).
---

# AI SDLC onboarding

Checks that a project is set up so anyone, on any machine, can continue working on it with AI assistance:
shared tooling, reproducible environment, committed agent context, MCP/skill requirements.

How it is split:

| Part | Where it runs | What it decides |
|---|---|---|
| `.ai-sdlc.yaml` (committed) | n/a | The project's answers: MCP providers, optional checks and skills |
| CLI `init` | terminal, chat | Scans the repo, asks with recommendations, writes the yaml |
| CLI `audit` | terminal, CI | Everything decidable from files and this machine; saves a report |
| This skill (chat) | AI chat | Skill matching, MCP authentication, heuristic findings |

The skill folder is the folder that contains this SKILL.md. The CLI is
`node <skill folder>/scripts/ai-sdlc-onboarding.cjs` (Node 18+, no install step). Run it from the project root
(or pass `--root`). Below, `CLI` means that command.

Only `.ai-sdlc.yaml` is committed. Reports and `unknown-configs.json` live in `.ai-sdlc/` (gitignored).

## Ground rules

- Report only. Do not fix project files, run linters/tests, or search the codebase broadly unless the user asks.
  The only files this skill writes are `.ai-sdlc.yaml` (through `CLI init`) and `.ai-sdlc/local.yaml` (through `CLI map`).
- Never open, print or quote `.env` files or secret values. Variable names are fine.
- Run the CLI first and build on its output. Do not redo script checks by reading files yourself.
- Never state a pass without evidence (a file path, a command result, a tool response). If something cannot be
  seen from this session (for example a user-level skill folder or a tool without access), say "cannot verify".
- Keep output short: verdict first, then steps.

## Flow A: onboard / init ("init", "onboard this project", "set up the AI SDLC onboarding", "re-init")

1. Run `CLI init --plan --format json`. It returns the detected stack/tools, every question with options,
   the recommended answer, and evidence (committed config only). It also logs unrecognised configs to
   `.ai-sdlc/unknown-configs.json`.
2. Ask the user in batches (use tappable options if the tool supports it). Put the recommended option first.
   Typical order: tools and stack → CI → MCP categories (show alternatives; recommend providers already
   configured) → unknown MCP as project_mcp → coverage areas → onboarding skills → missing standard files
   ("intentionally missing?" → ignore with a reason, otherwise leave as an audit action).
3. From `signals` in the plan (README headings, top folders, dependencies), offer up to three project-skill
   briefs. Declined briefs: `--project-skill slug=off`. Accepted: `--project-skill slug=y --describe slug="..."`.
4. Write answers with one command, never by hand-editing:
   `CLI init --yes --tools cursor --stack node,react,typescript --mcp code-host=github --mcp design=figma --require codeowners,contributing-guide --skill plan-before-coding=y --skill self-review=my-review-skill --project-mcp internal-search=internal-search --ignore pull-request-template="intentionally not used" [--ci]`
   Or for scripts: `CLI init --yes --accept-recommended`.
5. Tell the user to review and commit `.ai-sdlc.yaml`. Ignoring a gating check is done with `--ignore` or by
   hand in `ignored_checks` and needs a reason.
6. Run Flow B (audit) and return the verdict, score and Path to 100%.

If `.ai-sdlc.yaml` already exists, the plan marks decided items; ask only about unset items, contradictions
(off but now found in the repo), and newly added catalog entries.

## Flow B: full audit in chat ("Run the AI SDLC onboarding (full)")

1. If `.ai-sdlc.yaml` is missing, say the project has not been initialised and offer Flow A.
2. Run `CLI audit --format json`. Exit code 2 means a config problem: show the message and stop.
   Exit 0/1 is ready/not ready.
3. Resolve what the CLI could not (`chat.needsChat` and `chat.reviewInChat` in the JSON; details in
   [references/chat-audit.md](references/chat-audit.md)):
   - Skills set to `custom`: match from `chat.skillIndex` / `candidates`, confirm, then `CLI map <slug>=<name>`.
   - Named skills that failed: say what was searched.
   - MCP authentication (`*-authenticated`): one harmless read-only call with permission.
   - Heuristic findings (`reviewInChat`): one line each, real problem or false positive.
4. Produce the final response (see format below). Mention the saved report path under `.ai-sdlc/reports/`.

### Final response format

```
Verdict: READY (full) | NOT READY        Score: NN% (+/- since last run)
Not covered: <anything you could not verify, or "nothing">

Path to 100%
1. <slug>: <what is wrong> -> <the fix steps, condensed>
2. ...

Resolved in chat: <skills matched, MCP connections confirmed>
Undecided: <count> optional items/skills (run init to decide)
Unknown configs: <count> (see .ai-sdlc/unknown-configs.json)
```

- "READY (full)" requires: no failing item from the CLI, and every `needs-chat` item resolved as pass.
- If any item is still unverified, keep the CLI label (`READY (config only)` or `READY (config + local config)`)
  or say "NOT READY", and list what is missing. Do not upgrade that to "READY (full)".
- The CLI may list missing environment variable names. Do not open `.env` to confirm them.
- Steps come from the CLI's `steps` list plus chat-resolved failures.

## Other commands

- `CLI list` shows every slug with its state; `CLI explain <slug>` explains one check.
- `CLI audit --ci` shows what CI would see. `CLI audit --all` also evaluates optional items that are not required.
- Setup guides: `references/integrations/<slug>.md` in this skill folder.
