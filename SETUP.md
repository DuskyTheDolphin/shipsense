# Deploying ShipSense to Jira

You run these once with your own (free) Atlassian developer account. All the app code is already written.

## 0. Prerequisites
- **Node 22.x or 24.x** (`node --version`)
- **Forge CLI** — latest (the Rovo MCP module needs CLI ≥ 13.3.0):
  ```
  npm install -g @forge/cli@latest
  ```
- An **Atlassian API token** with the "Forge" scope: https://id.atlassian.com/manage-profile/security/api-tokens
  ```
  forge login      # paste your Atlassian email + the API token
  ```

## 1. Install dependencies
```
cd shipsense
npm install
```

## 2. Register + deploy
```
forge register           # creates the app and writes its id into manifest.yml
forge deploy
```

## 3. Install onto a Rovo-enabled demo site  (IMPORTANT)
Rovo does **not** run on a plain free dev site. Use a free 90-day demo site that includes Rovo:
```
forge install --demo-site
```
Open the link it prints (your demo site is seeded with Jira data). In any project, a **ShipSense** tab appears in the project nav.

## 4. Try the Rovo agent
In the demo site open Rovo (chat) and ask: *"Is the current release ready to ship?"*
> Agent / prompt / manifest changes need a full `forge deploy` each time — `forge tunnel` does **not** work for Rovo agents.

## 5. Share an install link for judges
```
forge deploy -e production
```
Then in https://developer.atlassian.com/console/myapps/ → your app → **Distribution** → enable **Sharing**, and copy the installation link.

---

## Notes & known items
- **Teamwork Graph** (`src/lib/twg.js`): ✅ **done and live** — ShipSense queries `atlassianUserGoalsAndProjects` and shows the workspace's active initiatives/OKRs under the verdict. It needs the `read:graph:user:atlassian` scope (already in the manifest). Adding a scope triggers a major-version bump, so after editing scopes: `forge deploy --approve MAJOR_VERSION_RULE`, then `forge install --upgrade` to re-grant on the demo site.
- **MCP bonus**: the `rovo:mcp` module is wired. To test it from an external client, an admin enables the app's tools per site (Admin → Apps → … → Connected apps → Tools), then register `https://mcp.atlassian.com/forge/<appId>`.
- **UI component names** (`src/frontend/index.jsx`): written against @forge/react UI Kit; if deploy flags an unknown component or prop, check the installed @forge/react version's component list and adjust.
- If `forge deploy` complains about ESM / `"type": "module"` or package versions, run:
  ```
  npm install @forge/api@latest @forge/resolver@latest @forge/bridge@latest @forge/react@latest
  ```
