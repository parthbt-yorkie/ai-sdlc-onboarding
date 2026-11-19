# Jira MCP

Used by the optional item `jira-mcp`. Checks:

- `jira-mcp-configured`: a server matching "Jira MCP" is in the project MCP config (committed).
- `jira-mcp-env-declared`: every environment variable the server config references is listed in `.env.example`.
- `jira-mcp-env-set` (local only): those variables are set on this machine (names only are reported).
- `jira-mcp-authenticated` (chat only): the connection works; validated by one harmless read-only call.

## Configure (once per project, then commit)

1. Find the server's start command or URL in the vendor's documentation.
2. Add it to the project MCP config (Cursor: `.cursor/mcp.json`, Claude Code: `.mcp.json`):

```json
{
  "mcpServers": {
    "jira-mcp": {
      "command": "<command from the vendor docs>",
      "args": ["<args>"],
      "env": {
        "JIRA_BASE_URL": "${env:JIRA_BASE_URL}",
        "JIRA_API_TOKEN": "${env:JIRA_API_TOKEN}"
      }
    }
  }
}
```

   The snippet shows the shape only; command, arguments and variable names depend on the server you use.
3. Use environment-variable references for every credential. Interpolation syntax differs per tool
   (`${env:NAME}` in Cursor, `${NAME}` in Claude Code as far as this skill knows): check your tool's docs.
4. List every referenced variable name in `.env.example` (names and placeholders only).
5. Document the server in AGENTS.md or README.md: what it is for, which variables it needs, how to authenticate.

## On each machine

1. Set the variables in your shell or an uncommitted `.env`; obtain values from your secret manager.
2. Restart your AI tool so it picks up the MCP config.
3. Authenticate if the server asks you to (browser login or token).

## Verify

Run the chat audit ("Run the AI SDLC onboarding (full)"). It confirms the Jira MCP tools are available in your
session and makes one harmless read-only call.

## Troubleshooting

- Server shows as failed: run its command in a terminal to see the error; usually a missing variable or wrong path.
- Works for one person only: their variables or login differ; compare with this guide.
- Tools missing after config change: restart the AI tool.
