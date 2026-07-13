---
marp: true
paginate: true
transition: fade
---

<!-- slide 1 -->

# PisiList — AI-Driven Dev Stack

Tech stack · Agents · Skills · Methodology

---

<!-- slide 2 -->

# Frontend

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.85.3 | Core mobile framework |
| React | 19.2.3 | UI library |
| Expo SDK | 56 | Build toolchain + APIs |
| TypeScript | 6.0.3 | Type safety |

---

<!-- slide 3 -->

# Web Support

| Technology | Version | Purpose |
|---|---|---|
| react-native-web | 0.21.2 | RN components → browser DOM |
| react-dom | 19.2.3 | React web renderer |
| PWA | Service Worker | Offline shell + install prompt |
| Firebase Hosting | — | Static deployment |

---

<!-- slide 4 -->

# Backend — Firebase 11

| Service | Purpose |
|---|---|
| Firestore | Real-time database (cards, tasks, invitations) |
| Firebase Auth | Email/password authentication |
| Firebase Hosting | PWA deployment at pisilist-app.web.app |
| Security Rules | Owner/collaborator access control |

---

<!-- slide 5 -->

# Navigation & UI

| Library | Version | Purpose |
|---|---|---|
| React Navigation | 7.17 | Native stack navigator |
| @react-native-community/datetimepicker | 9.1 | Reminder date/time picker |
| react-native-safe-area-context | 5.7 | Safe area insets |
| react-native-screens | 4.25 | Native screen containers |

---

<!-- slide 6 -->

# State & Real-Time

| Pattern | Implementation |
|---|---|
| Auth state | `onAuthStateChanged` listener |
| Cards | Dual `onSnapshot` (owned + collaborated) |
| Invitations | Real-time pending listener |
| Notifications | Firestore snapshots → local re-schedule |
| Theme | AsyncStorage persistence |

---

<!-- slide 7 -->

# Notifications — Dual Platform

| Platform | Mechanism |
|---|---|
| Android/iOS | `expo-notifications` — local scheduling |
| Web | `setTimeout` + Browser Notification API |
| Multi-device | NotificationSyncProvider re-schedules on Firestore changes |

---

<!-- slide 8 -->

# Testing

| Tool | Version | Purpose |
|---|---|---|
| Jest | 29.7 | Test runner |
| jest-expo | 56 | Expo-compatible Jest preset |
| @testing-library/react-native | 14 | Component testing |
| Firebase mocks | Custom | `moduleNameMapper` for auth/firestore |

**185 tests** across **18 suites** — all passing

---

<!-- slide 9 -->

# DevOps & Tooling

| Tool | Purpose |
|---|---|
| Expo CLI | Dev server, build, export |
| Firebase CLI | Deploy rules, hosting |
| inject-pwa-meta.js | Post-build PWA injection |
| EAS Project | 77ca051b-8e1a-429b-a6ec-32d7d616146b |

---

<!-- slide 10 -->

# Full Dependency Map

```
pisilist
├── react-native 0.85.3 + react 19.2
├── expo 56 (sdk + notifications + status-bar)
├── firebase 11 (app + auth + firestore)
├── @react-navigation/native-stack 7
├── @react-native-async-storage/async-storage
├── @react-native-community/datetimepicker
├── react-native-web 0.21 (web target)
├── typescript 6
└── jest 29 + @testing-library/react-native
```

---

<!-- slide 11 -->

# AI Agents

| Agent | MCP Server | What It Does |
|---|---|---|
| `test_manager` | firebase | Writes/runs Jest tests, validates Firestore rules |
| `wiki_manager` | context7, firebase | Updates wiki/report.md, state.md, code_flowchart.md |
| `git_manager` | github | Creates branches, commits, opens PRs |

---

<!-- slide 12 -->

# Agent — test_manager

- **Trigger:** After every meaningful code change
- **Command:** `! claude --agent test_manager`
- **MCP Tools:** `firebase_validate_security_rules`, `firebase_get_security_rules`
- **Output:** Pass/fail counts, coverage %, appends to `wiki/report.md`

---

<!-- slide 13 -->

# Agent — wiki_manager

- **Trigger:** After tests pass + code review complete
- **Command:** `! claude --agent wiki_manager`
- **MCP Tools:** `context7` (API docs), `firebase` (Firestore data shapes)
- **Output:** Updates `wiki/report.md`, `wiki/state.md`, `wiki/code_flowchart.md`

---

<!-- slide 14 -->

# Agent — git_manager

- **Trigger:** After wiki is updated — final step
- **Command:** `! claude --agent git_manager`
- **MCP Tools:** `github` (branches, commits, PRs)
- **Output:** Feature branch + commit + PR with summary from `wiki/report.md`

---

<!-- slide 15 -->

# AI Skills

| Skill | Scope | What It Does |
|---|---|---|
| `code_review` | All code changes | Reviews for correctness, API validation, security |
| `documentation` | Project docs | Generates component/API/flow documentation |
| `pisilist:frontend-design` | All .tsx work | UI/UX design patterns, accessibility, theming |

---

<!-- slide 16 -->

# Skill — code_review

- **Trigger:** After tests pass, before wiki update
- **Command:** `/code_review`
- **MCP Tools:** `context7` (API correctness), `firebase` (security rules)
- **Checks:** API correctness, project patterns, security, architecture
- **Output:** ✅ Pass / ⚠️ Warning / ❌ Fail per item

---

<!-- slide 17 -->

# Skill — documentation

- **Trigger:** When generating/maintaining project docs
- **Command:** `/documentation`
- **MCP Tools:** `context7` (API refs), `firebase` (data shapes), `frontend-design` (UI docs)
- **Output:** Component docs, data model docs, hook docs, flow diagrams

---

<!-- slide 18 -->

# Skill — frontend-design

- **Trigger:** **MANDATORY** before any .tsx, StyleSheet, colors, spacing change
- **Command:** `/pisilist:frontend-design`
- **Source:** Plugin skill from `frontend-design@claude-plugins-official`
- **Provides:** Design system patterns, responsive layout, accessibility, dark mode

---

<!-- slide 19 -->

# Methodology — Orchestration Pipeline

```
1. WRITE CODE (main conversation)
       ↓
2. TEST (test_manager agent)
       ↓
3. REVIEW (code_review skill)
       ↓
4. UPDATE WIKI (wiki_manager agent)
       ↓
5. COMMIT (git_manager agent)
```

Every feature flows through all 5 steps. No skipping.

---

<!-- slide 20 -->

# Pipeline — Agent Order

```
test_manager  →  code_review  →  wiki_manager  →  git_manager
      ↑                                              │
      └──────── if tests fail: fix & re-run ─────────┘
```

| Step | Gates On |
|---|---|
| test_manager | Must pass before review |
| code_review | Must pass before wiki update |
| wiki_manager | Must complete before commit |
| git_manager | Runs last, opens PR |

---

<!-- slide 21 -->

# MCP Servers

| Server | Type | Used By |
|---|---|---|
| firebase | Plugin | test_manager, wiki_manager, code_review, documentation |
| github | Plugin | git_manager |
| context7 | Standalone (`npx @upstash/context7-mcp`) | wiki_manager, code_review, documentation |
| expo | Plugin | All agents (SDK 56 docs) |
| frontend-design | Plugin | documentation, frontend-design skill |

---

<!-- slide 22 -->

# Trigger Cheat Sheet

| What | When | Command |
|---|---|---|
| Write tests | Every code change | `test_manager` agent |
| Review code | After tests pass | `/code_review` |
| Update docs | After review | `wiki_manager` agent |
| Commit & PR | After wiki updated | `git_manager` agent |
| UI/UX work | Before any .tsx change | `/pisilist:frontend-design` |
| API doc lookup | During documentation | `/documentation` |

---

<!-- slide 23 -->

# Wiki System

| File | Purpose | Updated By |
|---|---|---|
| `wiki/report.md` | Job-by-job log (success/failure) | wiki_manager |
| `wiki/state.md` | Current project snapshot | wiki_manager |
| `wiki/code_flowchart.md` | Architecture diagrams | wiki_manager |

**Report** is the source of truth for git_manager PR descriptions.

---

<!-- slide 24 -->

# Summary

| Category | Count |
|---|---|
| AI Agents | 3 (test, wiki, git) |
| AI Skills | 3 (review, docs, design) |
| MCP Servers | 5 (firebase, github, context7, expo, frontend-design) |
| Pipeline Steps | 5 (write → test → review → wiki → commit) |
| Test Suites | 18 (185 tests, all passing) |
