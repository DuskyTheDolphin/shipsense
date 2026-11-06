/**
 * ShipSense — domain model & shared constants for the release-readiness engine.
 *
 * Pure data and enums: no I/O, no Forge SDK, no network. This keeps the scoring
 * engine fully unit-testable and portable — the same logic runs in a Forge function,
 * a Rovo action, an MCP tool, or a Node CLI.
 */

/** @typedef {'GO'|'CAUTION'|'NO_GO'} Verdict */
export const Verdict = Object.freeze({ GO: 'GO', CAUTION: 'CAUTION', NO_GO: 'NO_GO' });

/** @typedef {'block'|'warn'|'info'} Severity */
export const Severity = Object.freeze({ BLOCK: 'block', WARN: 'warn', INFO: 'info' });

/** @typedef {'todo'|'inprogress'|'done'} StatusCategory */
export const StatusCategory = Object.freeze({ TODO: 'todo', INPROGRESS: 'inprogress', DONE: 'done' });

/** Priority ranks (higher = more urgent). Mirrors Jira's default scheme. */
export const Priority = Object.freeze({ highest: 5, high: 4, medium: 3, low: 2, lowest: 1 });

/**
 * @typedef {Object} Issue
 * @property {string} key                e.g. "CHK-102"
 * @property {string} summary
 * @property {string} type               'bug' | 'story' | 'task' | ...
 * @property {StatusCategory} statusCategory
 * @property {boolean} resolved          whether the issue has a resolution set
 * @property {keyof typeof Priority} [priority]
 * @property {boolean} [flaggedBlocker]  explicitly flagged as blocking the release
 * @property {string|null} [assignee]
 * @property {string} [url]
 */

/**
 * @typedef {Object} Dependency   Cross-team work this release depends on (from Teamwork Graph).
 * @property {string} key
 * @property {string} summary
 * @property {string} [team]       owning team name
 * @property {StatusCategory} statusCategory
 * @property {boolean} resolved
 * @property {string} [url]
 */

/**
 * @typedef {Object} Incident
 * @property {string} key
 * @property {string} [summary]
 * @property {string} [severity]   'sev1' | 'sev2' | 'sev3' | ...
 * @property {string} [status]     'open' | 'resolved' | 'closed' | ...
 * @property {string} [url]
 */

/**
 * @typedef {Object} ReleaseContext
 * @property {string} versionId
 * @property {string} name
 * @property {string} [projectKey]
 * @property {string|null} [dueDate]  ISO date
 * @property {Issue[]} issues
 * @property {Dependency[]} [dependencies]
 * @property {Incident[]} [incidents]
 * @property {{jira?:boolean, teamworkGraph?:boolean, crossTeam?:boolean, incidents?:boolean}} [dataSources]
 * @property {{name:string, key?:string, url?:string, dueDate?:string}[]} [goals]  active initiatives from Teamwork Graph
 */

/**
 * @typedef {Object} Signal
 * @property {string} id
 * @property {string} label
 * @property {Severity} severity
 * @property {number} impact      points subtracted from the readiness score
 * @property {string} detail
 * @property {number} count
 * @property {{key:string, summary?:string, url?:string}[]} items
 */

/**
 * @typedef {Object} ReadinessResult
 * @property {Verdict} verdict
 * @property {number} score        0..100
 * @property {'high'|'medium'|'low'} confidence
 * @property {Signal[]} signals
 * @property {string} headline
 * @property {string} rationale
 * @property {string[]} hardStops
 * @property {object} dataSources
 * @property {object} release
 * @property {string} generatedAt
 */
