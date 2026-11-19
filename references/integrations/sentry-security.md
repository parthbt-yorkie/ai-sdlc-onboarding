# Sentry security baseline

Used by the optional item `sentry-security`. It applies only when Sentry is detected (an `@sentry/*` or
`sentry-sdk` dependency). It checks outcomes, not how each project set Sentry up, so different approaches are fine.

| Check | Level | What it looks for |
|---|---|---|
| `sentry-no-auth-tokens-committed` | must pass | Sentry auth tokens in tracked files (values never shown) |
| `sentry-pii-handling-explicit` | warning | `sendDefaultPii` / `send_default_pii` set explicitly in code |
| `sentry-environment-set` | warning | `environment` passed to init, or `SENTRY_ENVIRONMENT` used |
| `sentry-release-tracked` | warning | `release` set, `SENTRY_RELEASE`, or release creation in CI |

## Fixing

1. Auth tokens: remove from the repo, rotate in Sentry, provide through CI secrets or the environment.
   The DSN is generally treated as public, but confirm with your security team.
2. PII: set the option explicitly and add scrubbing (`beforeSend` / `before_send`) where user data could appear.
3. Environment and release: set them per deployment so errors map to the right environment and commit.

## Important

These checks are a starting point. Have your security owner confirm the baseline (for example source map
exposure and sampling rates are not checked here) before treating a pass as sufficient.

## Waiving a check

A project with a good reason can ignore a check with a reason and an expiry date in `.ai-sdlc.yaml`:

```yaml
ignored_checks:
  - slug: sentry-pii-handling-explicit
    reason: Internal tool, no user data is captured.
    expires: 2027-03-01
```
