# ShipSense — Demo Video Script (Codegeist 2026)

**Length:** under 5:00 — judges aren't required to watch past 3:00, so put the strongest material first.
**Upload:** YouTube, set to Public. No copyrighted music.
**Goal:** show ShipSense answering "is this release ready to ship?" end-to-end in Jira, hitting all five judging criteria (Tech, Design, Impact, Innovation, Presentation — 20% each).

---

## The scenario is already staged on your demo site
You don't need to set anything up — the demo data is live in project **MSD (Marketing Software Development)**, release **Launch 1.0**:
- 🔴 **Cross-team blocker:** MSD-1 *is blocked by* **MOBL-17 "Add security to mobile devices"** (the **Mobile Dev** team — still open).
- 🔴 **High-priority bug:** **MSD-19 "Checkout returns 500 error on Safari"** (Highest priority, open).
- 🟡 **Past due:** Launch 1.0's release date is 2026-10-20 (in the past) with open work.
- 🟡 **Open scope:** MSD-1 still open.
- 🎯 **Teamwork Graph initiatives:** the workspace's live OKRs — notably **"Mobile experience usage boost to 50% of MAU"**, **"Best in Class Mobile Apps"**, **"Become market leader in the mobile app space."**

Result: ShipSense scores Launch 1.0 as a clear **No-Go, 46/100** — and the top strategic goals are all about *mobile*, the exact team blocking the release. That tie-in is the heart of the story.

*(To re-stage from scratch if ever needed: create a version, set a past release date, add a Bug (Highest priority) on it, and link one of its issues "is blocked by" an open issue in another project.)*

## Recording setup
- 1080p screen capture, clean browser (hide the bookmarks bar), page zoom ~110% for legibility.
- Tabs ready: the **ShipSense** project tab (MSD → **More → ShipSense**) and **Rovo** chat.
- Write your voiceover out and read it — don't improvise; it keeps you under time.

---

## Shot list (target ~3:30)

**0:00–0:25 · The hook**
- On screen: the MSD board with a pile of mixed issues.
- VO: "Before every release, someone has to answer one question — is this actually ready to ship? Today that means chasing bugs, blockers, and other teams across a dozen tabs. ShipSense answers it in one click."

**0:25–1:40 · The verdict (core)**
- Open **MSD → More → ShipSense** → select **Launch 1.0**.
- Panel shows **NO-GO · 46/100 · confidence high**, and the signal list.
- VO: "ShipSense pulls the release's connected context and gives a clear Go, Caution, or No-Go. Here it's a No-Go — and it says exactly why: a high-priority bug still open, and a cross-team dependency on the Mobile team that isn't done."
- Click **MOBL-17** → the real Jira issue opens. VO: "Every reason links straight to the source — nothing to take on faith."

**1:40–2:30 · Ask the agent (Rovo)**
- Open Rovo. Ask: *"Is Launch 1.0 ready to ship?"* → agent returns the verdict + reasons.
- Follow up: *"What's still blocking it?"* → agent lists the blockers.
- VO: "Same intelligence, as a conversation. Ask Rovo in plain language — it calls ShipSense and answers with the real data. No dashboard to hunt through."

**2:30–3:10 · Cross-team + Teamwork Graph (the money shot)**
- Point at the **cross-team dependency** line (MOBL-17, Mobile team), then **scroll to the Initiatives** section.
- VO: "The part most tools miss is other teams' work — ShipSense caught that this release is blocked by the Mobile team. And straight from Atlassian's Teamwork Graph, it shows the strategic initiatives this release serves: the top goals are all about mobile. So the thing blocking you is the thing that matters most. That's what shipping with confidence means — seeing exactly what's at stake."

**3:10–3:30 · Close + bonuses**
- VO: "ShipSense turns Jira's connected context into a decision you can trust. It's a Rovo agent, it reads live goals from the Teamwork Graph, and it's exposed as an MCP server so any agent can ask too. Ship with confidence."

---

## Keep these visible while filming (that's how the criteria get scored)
- **Tech:** the Forge app working live — panel, Rovo agent, linked Jira data, live Teamwork Graph, MCP.
- **Design:** the clean verdict panel and the conversational agent.
- **Impact:** a universal dev-team decision, de-risked, for a specific audience.
- **Innovation:** a context-driven Go/No-Go that connects release risk to org goals.
- **Presentation:** tight, sourced, end-to-end, under time.

## Optional 20-sec MCP add-on (for the MCP bonus)
If you enable the app's MCP tools (see SETUP.md), show a quick clip of an external agent asking "is Launch 1.0 ready?" and getting ShipSense's answer over MCP. Even a few seconds strengthens the MCP bonus entry.
