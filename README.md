# ShipSense

A **release-readiness Rovo agent for Jira** — Atlassian Codegeist 2026 entry.

Ask "is this release ready to ship?" and ShipSense assembles the connected context —
open blockers, unresolved bugs, incomplete **cross-team dependencies** (via Teamwork Graph),
and linked incidents — then returns a **Go / Caution / No-Go** call with a numeric readiness
score and a *sourced* rationale you can click into.

## Status
- ✅ **Core readiness engine** — deterministic scoring, explainable signals, verdict + rationale. Runnable now.
- ✅ **Local demo + unit tests** — no Atlassian account needed.
- ✅ **Forge app** — Rovo agent (`src/index.js`), Jira project panel (`src/frontend`), Jira + Teamwork Graph data providers (`src/lib`), MCP server. See [`SETUP.md`](SETUP.md) to deploy to a Jira site.

## Try it locally (no Atlassian account needed)
Requires Node 18+.

```
npm run demo    # prints Go/Caution/No-Go reports for three sample releases
npm test        # runs the engine's unit tests
```

## How it's built
- `src/core/model.js` — domain model + constants (pure).
- `src/core/scoring.js` — the readiness engine: `assessReadiness(releaseContext)` → verdict, score, signals, rationale.
- `src/core/scoring.test.js` — unit tests (`node:test`, zero dependencies).
- `src/context/provider.js` — the `ContextProvider` contract + Jira REST normalizers.
- `src/context/mock-provider.js` — sample releases for the local demo/tests.
- `src/demo.js` — CLI that runs the engine against the samples.
- `src/lib/` — Forge data layer (Jira REST + Teamwork Graph) and context assembly.
- `src/index.js` — Rovo action handlers · `src/resolver.js` — panel backend · `src/frontend/` — UI Kit panel.
- `manifest.yml` — Forge modules: Rovo agent, MCP server, Jira project page, scopes.

The engine depends only on a plain `ReleaseContext` shape — not on Forge or Jira — so the exact
same logic runs in a Forge function, a Rovo action, an MCP tool, or this CLI.

See [`SETUP.md`](SETUP.md) to deploy, and [`../SPEC.md`](../SPEC.md) for the full entry plan.

## License
MIT
