# ShipSense — Devpost Submission (Codegeist 2026)

Paste these fields into the Devpost submission form. Keep it honest and specific — judges reward a working, non-trivial app over hype.

## Tagline
Ship with confidence — a Rovo agent that turns a Jira release's connected context into a clear **Go / Caution / No-Go**.

## Category
**Apps for Software Teams**

## Bonus prizes entered
- **Best Rovo / Assignable agent** — ShipSense is a `rovo:agent` with three actions (score readiness, list blockers, cross-team dependencies).
- **Best Teamwork Graph integration** — ShipSense queries the Teamwork Graph (`atlassianUserGoalsAndProjects`) to pull the workspace's active **initiatives / OKRs** and shows them under the verdict, framing the release against the goals it serves. *Live and working — confidence reads "high" when TWG responds.*
- **Best app with Atlassian MCP** — the same three actions are exposed through a `rovo:mcp` server, so other agents/tools can query release readiness. *(Module is wired; enable the app's tools per site to exercise it from an external MCP client — see SETUP.md.)*

## Inspiration
Every team ships on a gut feeling. "Is this release ready?" usually gets answered by one stressed person pinging five channels, scanning the board, and hoping nobody forgot the thing another team owed them. The signal is all there in Jira — open bugs, unfinished scope, blocked work, cross-team dependencies — it's just scattered. We wanted one honest answer, in the place teams already work.

## What it does
- **One-click release readiness.** Open a Jira version and ShipSense returns **Go / Caution / No-Go** with a 0–100 score and plain-English reasons.
- **Reads the connected context** for the release: open blockers, unresolved bugs (weighted by priority), unfinished scope, a past-due schedule, and **cross-team dependencies** — work in other projects/teams this release is "blocked by".
- **Frames the release against org goals** — it pulls the workspace's active **initiatives** from the **Teamwork Graph** and lists them under the verdict, so you see what's at stake if the release slips.
- **Three ways to ask:** a **Jira project panel**, a conversational **Rovo agent** ("is Launch 1.0 ready?"), and an **MCP server** so other agents can query it.
- **Every reason is sourced** — each signal and initiative links to the actual Jira issue / goal behind it.
- **Deterministic and explainable** — the verdict comes from transparent, testable scoring, not a black-box guess; the agent adds the conversation on top.

## How we built it
- An **Atlassian Forge** app. At its heart is a **pure, dependency-free scoring engine** (`assessReadiness`) with unit tests — the *same* engine powers the agent, the panel, and the MCP tools, so the logic can't drift between them.
- **Jira data** via `@forge/api`: project versions, the enhanced JQL search (`/rest/api/3/search/jql`), and issue links. Cross-team dependencies are derived from "is blocked by" links that point into other projects.
- **Teamwork Graph** via `api.asUser().requestTeamworkGraph` — the `atlassianUserGoalsAndProjects` query returns the viewer's active goals/OKRs (name, key, due date), which we render as the release's "initiatives served."
- A **`rovo:agent`** with three `action`s, a **UI Kit** (`@forge/react`) project panel backed by a resolver, and a **`rovo:mcp`** module exposing the same actions as MCP tools.

## How it meets the requirement
ShipSense is built on **Atlassian Forge** and integrates with **Jira** (versions, issues, issue links) and the **Teamwork Graph** (goals/initiatives), using that connected context to help teams *ship with confidence* — exactly the Codegeist challenge. It's a complete, working product experience (a panel plus a conversational agent), not a proof of concept.

## Challenges we ran into
- **Rovo isn't on free sites** — development and judging run on a `forge site provision` demo site that includes Rovo.
- **Teamwork Graph is a Preview API with sharp edges** — it rejects calls without an `X-Query-Context` site header, requires operation names shaped `[company]_[operation]`, and takes ARIs (not plain ids) for users. We worked these out against the live GraphQL endpoint, then wired the query through Forge's `requestTeamworkGraph` with the right `read:graph:*` scopes.
- **No hot-reload for Rovo agents** — every change is a full `forge deploy`, so we kept the engine pure and unit-tested to iterate fast off-platform.

## Accomplishments we're proud of
- One tested scoring engine, three surfaces (agent, panel, MCP) — zero logic duplication.
- A **live Teamwork Graph integration** that connects a release to the org's real goals.
- Answers are **sourced and auditable**, not a vibe — it catches the thing teams get burned by: **another team's unfinished work.**

## What's next
- Link release work items directly to goals (`jiraWorkItemGoals`) for release-specific goal impact.
- Pull linked incidents (JSM) and deployment / PR status into the score.
- Make the thresholds and weights configurable per team.
- Publish to the Atlassian Marketplace.

## Submission checklist (do these before you hit submit)
- [ ] **Public GitHub repo** URL — includes source + an open-source license (MIT, already in the repo).
- [ ] **Installation link** for judges — `forge deploy -e production`, then Developer Console → your app → Distribution → enable Sharing → copy the link.
- [ ] **Demo video** — under 5 min, uploaded to YouTube, public (see DEMO_SCRIPT.md).
- [ ] **Category** selected: Apps for Software Teams.
- [ ] **Bonus prizes** selected: Rovo agent, Teamwork Graph, and MCP.
- [ ] **"How it meets the requirement"** pasted into the form.
