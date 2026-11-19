# AGENTS.md

Instructions for AI coding agents (and new teammates) working in this repository.

## Setup and commands

- Setup: `<one command, e.g. npm run setup>`
- Lint: `<e.g. npm run lint>`
- Typecheck: `<e.g. npm run typecheck>`
- Test (all): `<e.g. npm test>`
- Test (one file): `<e.g. npm test -- path/to/file>`
- Build: `<e.g. npm run build>`

## Architecture overview

- `<src/...>`: what lives here and how it is layered
- Key flows: `<request -> handler -> service -> database>`
- External services: `<database, cache, third-party APIs>`

## Conventions

- Formatting and linting follow the repo config (`<.prettierrc / eslint.config.js / ruff.toml>`); do not restate style rules here.
- Naming, file layout and testing patterns: `<link to docs or examples>`
- Generated files (do not edit by hand): `<paths>`; regenerate with `<command>`

## Boundaries

- Never commit secrets or `.env` files.
- Do not change `<migrations / generated code / vendored paths>` without approval.
- Ask before adding dependencies.

## Plans and specs

- Plans and specs live in `<docs/specs/ or tracker link>`.
