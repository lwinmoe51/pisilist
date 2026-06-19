# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory Development Workflow

Every code change must follow this cycle. Never skip a step.

```
┌──────────────────────────────────────────────────────────┐
│  1. WRITE CODE                                           │
│     ↓                                                    │
│  2. TEST  (npm test)                                     │
│     ├── PASS → 3a. UPDATE wiki/report.md (success entry) │
│     │           → 4. COMMIT via git_manager agent        │
│     │                                                    │
│     └── FAIL → 3b. UPDATE wiki/report.md (error entry)   │
│                 → REFACTOR code to fix                   │
│                 → Go back to step 2 (TEST)               │
│                     ↓                                    │
│                 PASS → UPDATE wiki/report.md (fixed)      │
│                       → 4. COMMIT via git_manager agent  │
└──────────────────────────────────────────────────────────┘
```

### Step details

**Step 2 — Test:** Run `npm test` after every meaningful code change. If a new feature was added, write a corresponding test first or in the same turn. Tests pass → proceed to commit. Tests fail → go to error handling.

**Step 3a — Report success:** Append to `wiki/report.md` with what was done, files changed, tests passing.

**Step 3b — Report error + refactor:** Append the failure to `wiki/report.md` (exact error output, which test failed). Fix the code. Run tests again. When they pass, append a "fixed" entry.

**Step 4 — Commit via git_manager agent:** After tests pass and wiki is updated, invoke the `git_manager` agent by its name. The agent handles branch creation, commit, and PR. Do NOT run raw `git` commands — use the agent. Every feature must be committed before starting the next one.

## Project Overview

**pisilist** — A collaborative, cross-platform mobile-first To-Do List app with a Google Keep–style staggered card layout. Focuses on granular item-level task delegation and multi-reminder push notifications without backend cron jobs.

See `IDEA.md` for full specification and user journeys. See `LAYOUT.md` for ASCII UI mockups of all core views.

## Tech Stack

- **Frontend:** React Native 0.85.3 + Expo SDK 56 (targeting Web and Android APK)
- **Backend/Database:** Firebase project `pisilist-app` (Authentication + Firestore)
- **Push Notifications:** Expo Notifications (local scheduling)
- **State/Real-time:** Firestore listener snapshots for live collaboration updates
- **Testing:** Jest with jest-expo preset, Firebase mocked via `moduleNameMapper`

> **Expo SDK 56:** Always consult versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo code. See `AGENTS.md` for SDK version details.

## Key Commands

```bash
npm start               # Expo dev server
npm run web             # Web target
npm test                # Run Jest (22 tests, 4 suites)
npm run test:coverage   # Jest + coverage report
npx tsc --noEmit        # TypeScript type-check
```

## Installed Plugins (MCP Tools)

Four Claude Code plugins are installed and enabled in `.claude/settings.json`. Agents, skills, and the `.mcp.json` config are designed to leverage them:

### 1. Firebase (`firebase@claude-plugins-official`)

Directly powers pisilist's backend. Agents and skills should use Firebase MCP tools for:

- **Authentication** — create/manage user accounts, password reset flows, email verification tokens
- **Firestore** — read/write cards, tasks, collaborators, invitations, and reminders in real time
- **Cloud Functions** — deploy Firestore-triggered background functions for delayed push notification execution (the "no-cron" reminder architecture)
- **Security Rules** — define and deploy Firestore security rules scoped to card ownership and collaborator access

### 2. GitHub (`github@claude-plugins-official`)

Used by the `git_manager` agent for:

- Repository management (create/push branches, commits, PRs)
- Issue tracking linked to wiki `state.md` blockers
- Automated PR descriptions summarizing changes from `wiki/report.md`

### 3. Context7 (`context7@claude-plugins-official`)

Used by the `wiki_manager` agent for:

- Maintaining persistent project context across sessions
- Resolving context when documentation in `wiki/` becomes stale
- Providing up-to-date library/API documentation (React Native, Expo, Firebase SDK) during implementation

### 4. Expo (`expo@claude-plugins-official`)

Used for:

- Expo SDK 56 documentation and best practices
- Build and deployment guidance

## Agent Responsibilities

| Agent          | Trigger                                                               | Uses            |
| -------------- | --------------------------------------------------------------------- | --------------- |
| `git_manager`  | After every completed feature (tests pass, wiki updated)              | github plugin   |
| `wiki_manager` | Use context7 for library docs; wiki files updated inline per workflow | context7 plugin |
| `test_manager` | Write tests alongside new code; run `npm test` per workflow           | Jest            |

### Required Project Structure

```
pisilist/
├── .mcp.json                          # MCP configuration declaring all MCP tools available to agents
├── .claude/
│   ├── agents/
│   │   ├── wiki_manager.md            # Uses context7 + file tools to keep wiki/ docs updated
│   │   ├── git_manager.md             # Uses github plugin for commits, branches, PRs
│   │   └── test_manager.md            # Manages test framework and coverage
│   └── skills/
│       ├── code_review/
│       │   └── SKILL.md               # Code review using context7 for up-to-date best practices
│       └── documentation/
│           └── SKILL.md               # Documentation generation using context7 for API references
├── wiki/
│   ├── report.md                      # Job-by-job log: errors, changes, test results
│   ├── state.md                       # Current project state: pending tasks, blockers
│   └── code_flowchart.md              # Visual code structure and data flow diagrams
```

### Agent Descriptions

- **wiki_manager.md** — Uses `context7` plugin to fetch up-to-date library docs and cross-reference against the codebase. Updates `wiki/report.md`, `wiki/state.md`, and `wiki/code_flowchart.md` after every AI job. Ensures documentation stays accurate as dependencies and code evolve.
- **git_manager.md** — Uses `github` plugin for all git operations: creating feature branches, committing changes with meaningful messages, opening PRs with summaries drawn from `wiki/report.md`, and linking issues to `wiki/state.md` blockers. Must be invoked after every feature is complete, tested, and wiki-updated.
- **test_manager.md** — Manages the testing framework. Writes and runs tests (Jest for React Native + Expo), tracks coverage, and appends results to `wiki/report.md`. Ensures Firebase security rules are tested.

### Skill Descriptions

- **code_review/SKILL.md** — Reviews code changes before they land. Uses `context7` to validate that React Native, Expo, and Firebase SDK APIs are used correctly and follow current best practices. Checks adherence to project coding standards.
- **documentation/SKILL.md** — Generates and maintains project documentation. Uses `context7` to pull accurate API references for React Native, Expo, and Firebase when documenting components and data flows.

### .mcp.json Configuration

The `.mcp.json` file declares:

1. The Firebase MCP server (from the firebase plugin) for Firestore, Auth, and Cloud Functions operations
2. The GitHub MCP server (from the github plugin) for repository operations
3. The Context7 MCP server (from the context7 plugin) for library documentation lookups
4. Project-level MCP tool definitions mapping these servers to the agents that use them (`wiki_manager`, `git_manager`, `test_manager`)

## Project Structure

```
pisilist/
├── App.tsx                         # SafeAreaProvider → Auth → Cards → Invitations → NavigationContainer
├── firebase.json                   # Firestore rules + indexes config
├── firestore.rules                 # Access rules: users, cards, tasks, invitations
├── firestore.indexes.json          # Composite indexes
├── jest.config.js                  # jest-expo preset + Firebase mocks
├── .mcp.json                       # MCP servers: firebase, github, context7
├── .claude/agents/                 # git_manager, wiki_manager, test_manager
├── .claude/skills/                 # code_review, documentation
├── src/
│   ├── config/firebase.ts          # Firebase init (pisilist-app)
│   ├── services/                   # auth, cards, users, invitations, notifications
│   ├── contexts/                   # AuthContext, CardsContext, InvitationsContext
│   ├── components/                 # CardPreview, AssigneePicker, ReminderModal
│   ├── screens/                    # Login, SignUp, ResetPassword, Dashboard, CardDetail, Invitations
│   ├── navigation/AppNavigator.tsx # Auth-gated stack navigator
│   └── types/index.ts              # Card, Task, Reminder, Invitation, AppUser
├── wiki/                           # report.md, state.md, code_flowchart.md
├── IDEA.md                         # Full specification
└── LAYOUT.md                       # ASCII UI mockups (all 6 views)
```

## Firestore Collections

```
users/{uid}           — email, displayName, uid, createdAt
cards/{cardId}        — title, ownerId, collaborators[], pinned, taskCount, completedCount
cards/{cardId}/tasks/ — text, completed, assignee, reminders[], order
invitations/{id}      — fromUserId, toEmail, cardId, cardTitle, status
```

## Wiki Files

- **report.md** — Append entry for every job: success with changes, or failures with exact error output, followed by a "fixed" entry after refactor. This is the source of truth for git_manager PR descriptions.
- **state.md** — Overwrite with current snapshot: Completed, Pending, In Progress, Blockers.
- **code_flowchart.md** — Architecture diagrams, data flow, file list. Updated as structure changes.
