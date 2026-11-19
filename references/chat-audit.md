# Chat audit details

Read this when running Flow B in SKILL.md and an item needs more than the CLI output.

## Matching a `custom` skill

Inputs from `CLI audit --format json`:

- `toVerify[]` items with `status: needs-chat` and, for skills, `candidates[]` (name, scope, path) ranked by keyword overlap.
- `chat.skillIndex[]`: every skill/rule/command found in the project and the user's skill folders for the tools in use
  (`scope: repo` or `user`, `committed`, `wellFormed`).

Procedure per skill slug:

1. Read the capability's title and description from the item (`title`, `why`).
2. Pick candidates whose name and description do that job. A skill that only partly covers it is not a match.
3. Exactly one convincing candidate: ask "Is `<name>` what you use for <title>?".
4. Several: list them and ask which one the person uses.
5. None: say so and show the fix (create or install one). Do not map something unrelated to get a pass.
6. After the user confirms: `CLI map <slug>=<name>`; then re-run `CLI audit --format json` to confirm it resolves.

Different people may use different skills for the same capability. That is intended. The mapping is personal
and stored in `.ai-sdlc/local.yaml` (never committed).

## Portability note

If the matched skill is `scope: user` (not committed in the repo), it satisfies `custom`, but add one line:
"personal install, others need their own". For named skills (exact name required) the CLI already warns when a
skill exists only in one person's folder and no `source` is declared.

## MCP authentication

Applies to checks named `*-authenticated`. Only do this for servers the project requires.

1. Is the server's toolset visible in this session? If not: "cannot verify: <server> tools are not available in this
   session. Enable the server in your AI tool, restart it, and re-run."
2. If visible, ask permission, then make one read-only call that has no side effects (for example list projects, who am I).
3. Pass: the call worked. Fail: auth error or timeout; give the setup guide path from the item's fix text.
4. Never echo tokens, headers or full responses; summarise ("returned 3 projects").

## Hybrid findings (`reviewInChat`)

These are heuristic detections (for example formatting rules restated in agent files, long duplicated instruction
files, example env values that look real). The item's `detail` says what triggered it. Open only the file(s) named
there. Say "real problem: <why>" or "false positive: <why>". A false positive can be waived in `ignored_checks`
with a reason (done by the user). The same list can skip any gating check: a must-have, a required optional
item, or a required skill.

## Unknown configs

The audit JSON may include `unknown` (path to `.ai-sdlc/unknown-configs.json`, counts, samples). Mention the
count in the final response. Do not invent support for those tools; they are a backlog for the next skill version.

## What not to do

- Do not edit `.ai-sdlc.yaml` by hand; use `CLI init` flags. Ignoring checks is a manual, reasoned edit by the user
  (`--ignore slug=reason` or `ignored_checks`).
- Do not run project tests, linters or installs.
- Do not claim the project is ready if the CLI exit code was 1.
