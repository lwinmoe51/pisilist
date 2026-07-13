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
npm test                # Run Jest (185 tests, 18 suites)
npm run test:coverage   # Jest + coverage report
npx tsc --noEmit        # TypeScript type-check
```

## Installed Plugins (MCP Tools)

Five Claude Code plugins are installed and enabled in `.claude/settings.json`. Agents, skills, and the `.mcp.json` config are designed to leverage them:

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

### 5. Frontend Design (`frontend-design@claude-plugins-official`)

MANDATORY for all UI/UX work. Whenever writing or modifying any component, screen, style, or layout, invoke the `pisilist:frontend-design` skill FIRST — before writing code. This skill provides:

- Production-grade UI/UX patterns and design system thinking
- Responsive design guidance (mobile-first, breakpoints)
- Accessibility best practices
- Dark mode / theming patterns
- Component composition and layout architecture

> **Rule:** Any task involving `.tsx` files, `StyleSheet`, colors, spacing, or user-facing layout MUST use the `frontend-design` skill before implementation.

## Agent Responsibilities

| Agent          | Trigger                                                               | MCP Servers          |
| -------------- | --------------------------------------------------------------------- | -------------------- |
| `test_manager` | Write tests alongside new code; run `npm test` per workflow           | firebase             |
| `wiki_manager` | Update wiki/ docs after every job; verify data shapes against firebase | context7, firebase   |
| `git_manager`  | After every completed feature (tests pass, wiki updated)              | github               |

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
│   └── settings.json                  # Enabled plugins: firebase, github, context7, expo, frontend-design
├── wiki/
│   ├── report.md                      # Job-by-job log: errors, changes, test results
│   ├── state.md                       # Current project state: pending tasks, blockers
│   └── code_flowchart.md              # Visual code structure and data flow diagrams
```

### Agent Descriptions

- **test_manager.md** — Uses `firebase` MCP for Firestore security rule validation (`firebase_validate_security_rules`) and emulator testing. Writes and runs Jest tests, tracks coverage, and appends results to `wiki/report.md`. Must run before wiki_manager and git_manager.
- **wiki_manager.md** — Uses `context7` for library API docs and `firebase` for reading deployed Firestore data structures, security rules, and project config. Updates `wiki/report.md`, `wiki/state.md`, and `wiki/code_flowchart.md` after every AI job. Verifies data model docs match deployed firebase state.
- **git_manager.md** — Uses `github` plugin for all git operations: creating feature branches, committing changes with meaningful messages, opening PRs with summaries drawn from `wiki/report.md`, and linking issues to `wiki/state.md` blockers. Must be invoked after every feature is complete, tested, and wiki-updated.

### Skill Descriptions

- **code_review/SKILL.md** — Reviews code changes before they land. Uses `context7` to validate API correctness and `firebase` to validate Firestore security rules and data model consistency. Checks adherence to project coding standards.
- **documentation/SKILL.md** — Generates and maintains project documentation. Uses `context7` for API references, `firebase` for verifying deployed Firestore data shapes and rules, and `frontend-design` for UI component documentation patterns.
- **frontend-design (plugin skill)** — MUST be invoked before any UI/UX code change. Provides production-grade design patterns, responsive layout guidance, accessibility checks, dark mode patterns, and component composition architecture. Scoped to the pisilist project as `pisilist:frontend-design`.

## Orchestration Pipeline

Every feature follows this agent pipeline. Each step must complete before the next begins.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. WRITE CODE (main conversation)                                          │
│     ↓                                                                       │
│  2. TEST (test_manager agent)                                               │
│     ├── npm test passes → continue                                          │
│     └── npm test fails → fix code, re-run test_manager                      │
│     ↓                                                                       │
│  3. REVIEW (code_review skill)                                              │
│     ├── API correctness via context7                                        │
│     ├── Firebase rules validation via firebase MCP                          │
│     └── Project pattern adherence                                           │
│     ↓                                                                       │
│  4. UPDATE WIKI (wiki_manager agent)                                        │
│     ├── Append success/failure to wiki/report.md                            │
│     ├── Overwrite wiki/state.md with current snapshot                       │
│     └── Update wiki/code_flowchart.md if structure changed                  │
│     ↓                                                                       │
│  5. COMMIT (git_manager agent)                                              │
│     ├── Create feature/<name> branch                                        │
│     ├── Commit with descriptive message                                     │
│     └── Open PR with summary from wiki/report.md                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Invocation Order

```
test_manager  →  wiki_manager  →  git_manager
     ↑                                    │
     └──── code_review (before commit) ───┘
```

- **test_manager** runs first — gates all downstream work on passing tests
- **code_review** runs after tests pass — validates code quality before wiki update
- **wiki_manager** runs after review — logs the final state (success or fixed)
- **git_manager** runs last — commits and opens PR only after wiki is current

### When to Invoke Each

| Step | Trigger | Skip Condition |
|------|---------|----------------|
| test_manager | Every code change | Never skip |
| code_review | Every code change | Never skip |
| wiki_manager | Every completed job | Never skip |
| git_manager | Tests pass + wiki updated | Only if user says "don't commit" |

### .mcp.json Configuration

The `.mcp.json` file declares:

**MCP Servers (3):**
1. `firebase` — Plugin-based. Firestore, Auth, Cloud Functions, Security Rules operations
2. `github` — Plugin-based. Repository operations (branches, commits, PRs, issues)
3. `context7` — Standalone (`npx @upstash/context7-mcp`). Library/API documentation lookups

**Plugins (2, declared for agent awareness):**
1. `expo` — Expo SDK 56 docs, build/deploy guidance
2. `frontend-design` — UI/UX design system patterns, mandatory for all .tsx work

**Agent → MCP Server Mapping:**
| Agent | MCP Servers |
|-------|-------------|
| `test_manager` | firebase |
| `wiki_manager` | context7, firebase |
| `git_manager` | github |

**Skill → MCP Server Mapping:**
| Skill | MCP Servers |
|-------|-------------|
| `code_review` | context7, firebase |
| `documentation` | context7, firebase |

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
