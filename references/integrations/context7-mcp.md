# ucontext7 MCP

Used by the MCP provider `context7` (checks use the `context7-mcp` slug prefix).

- `context7-mcp-configured`: a matching server is in the project MCP config (committed).
- `context7-mcp-env-declared`: every environment variable the server config references is listed in `.env.example`.
- `context7-mcp-env-set` (local only): those variables are set on this machine (names only are reported).
- `context7-mcp-authenticated` (chat only): the connection works; validated by one harmless read-only call.

## Configure (once per project, then commit)

1. Find the server's start command or URL in the vendor's documentation.
2. Add it to the project MCP config (Cursor: `.cursor/mcp.json`, Claude Code: `.mcp.json`):

```json
{
  "mcpServers": {
    "context7-mcp": {
      "command": "<command from the vendor docs>",
      "args": ["<args>"],
      "env": {
        "EXAMPLE_TOKEN": "${env:EXAMPLE_TOKEN}"
      }
    }
  }
}
```

   The snippet shows the shape only; command, arguments and variable names depend on the server you use.
3. Use environment-variable references for every credential.
4. List every referenced variable name in `.env.example` (names and placeholders only).
5. Document the server in AGENTS.md or README.md.

## On each machine

1. Set the variables in your shell or an uncommitted `.env`.
2. Restart your AI tool so it picks up the MCP config.
3. Authenticate if the server asks you to.

## Verify

Run the chat audit ("Run the AI SDLC onboarding (full)").
