# Project MCP (custom server)

Used when init finds an MCP server that is not in the catalog and you accept it as `project_mcp`.

Checks (slugs `project-mcp-<name>-*`):

- configured in the project MCP config (committed)
- environment variables declared in `.env.example`
- environment variables set on this machine (local)
- authenticated (chat only)

The server is also logged in `.ai-sdlc/unknown-configs.json` so a later skill version can add first-class support.

## Configure

1. Keep the server in the project MCP config (`.cursor/mcp.json` or `.mcp.json`) and commit it.
2. Use environment-variable references for credentials.
3. List every referenced variable name in `.env.example`.
4. Document the server in AGENTS.md.

## Verify

Run the chat audit ("Run the AI SDLC onboarding (full)") and make one harmless read-only call.
