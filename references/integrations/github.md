# GitHub (gh CLI and/or GitHub MCP)

Used by the optional item `github`. Which checks run:

- `github-usage-documented`: AGENTS.md/README says how GitHub is accessed, or a GitHub MCP server is configured.
- `github-cli-authenticated` (local only): `gh` is installed and `gh auth status` succeeds.
- `github-mcp-authenticated` (chat only): the GitHub MCP tools work in your AI tool session.

## Option A: gh CLI

1. Install the GitHub CLI: https://cli.github.com
2. Run `gh auth login` and choose your host and login method.
3. Verify: `gh auth status` reports a logged-in account.
4. Document in AGENTS.md which `gh` commands agents should use (for example `gh pr view`, `gh pr checks`).

## Option B: GitHub MCP server

1. Add a GitHub server to the project MCP config and commit it
   (Cursor: `.cursor/mcp.json`, Claude Code: `.mcp.json`). Take the exact server command or URL from the
   vendor documentation; the snippet below shows the shape only.
2. Reference the token by environment variable, never a literal value.
3. List the variable name in `.env.example`.
4. Document the server (purpose and how to authenticate) in AGENTS.md or README.md.

```json
{
  "mcpServers": {
    "github": {
      "command": "<command from the GitHub MCP server docs>",
      "args": ["<args>"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_PERSONAL_ACCESS_TOKEN}" }
    }
  }
}
```

Variable interpolation syntax differs per tool (`${env:NAME}` in Cursor, `${NAME}` in Claude Code as far as
this skill knows). Check your tool's documentation.

## Verify

Run the chat audit ("Run the AI SDLC onboarding (full)"). It will confirm the tools are present and make one
harmless read-only call.

## Troubleshooting

- `gh auth status` says not logged in: run `gh auth login` again; for SSO organisations authorise the token.
- MCP tools missing in chat: restart the AI tool after editing the MCP config, and check the server shows as running.
