# IDEA.md

## 1. Project Overview

**Project Name:** pisilist

**Description:** A collaborative, cross-platform mobile-first To-Do List application inspired by the staggered card layout of Google Keep. Unlike traditional note-taking apps, _pisilist_ focuses purely on task checklists within cards, introducing granular item-level task delegation and complex multi-reminder push notifications without relying on standard backend cron jobs.

---

## 2. Technical Stack & Infrastructure

- **Frontend Framework:** React Native + Expo (Targeting Web and Android APK output)
- **Backend & Database:** Firebase (Authentication, Firestore for real-time sync)
- **Push Notifications:** Expo Notifications (Local scheduling) or Firebase Cloud Functions (Firestore-triggered delayed execution) to avoid persistent cron job services.
- **State Management / Real-time Sync:** Firestore listener snapshots for instant collaboration updates.

---

## 3. Detailed User Journeys

### 3.1 Authentication Flow

1.  **Sign Up / Login:** User enters email and password. Upon validation, they are routed to the dashboard.
2.  **Password Reset:** User requests a reset link/code. The backend generates a 6-digit verification token, fires it to the user's email, validates the token on input, and permits a password update.

### 3.2 Card & Task Management

1.  **Creation:** Users instantiate a new Card, defining a Card Title. Inside the card, they dynamically append list items (Tasks).
2.  **Interaction:** Checkboxes toggle task completion states instantly. Checked items move down into a collapsed "Checked Items" group.
3.  **Real-Time Manipulation:** Changes to titles, items, or execution order are mirrored instantly to all connected viewers.

### 3.3 Collaboration & Granular Assignment

1.  **Inviting Collaborators:** A card owner generates an invitation by inputting another user's email. An invite document is written to Firestore.
2.  **Accepting Invitations:** The recipient views pending invites on their dashboard, accepts, and gets added to the card's `collaborators` list.
3.  **Granular Task Assignment:** Inside a shared card, tapping a specific task item opens an assignment menu displaying avatars of all accepted collaborators. The chosen individual is assigned strictly to _that single line item_.

### 3.4 Advanced Multi-Reminder System (No Cron App)

1.  **Setting Reminders:** For any specific task line item, a user can append multiple distinct alarm timestamps (e.g., Alert 1: 2 hours before, Alert 2: 10 minutes before) or custom with modern date/time picker UI.
2.  **Execution Architecture:** Since the application utilizes an Expo wrapper, scheduled push alerts are configured locally on the OS via the `expo-notifications` scheduler when the card data updates, or queued up via Firestore document-driven background events—bypassing the need for a dedicated, long-running server cron daemon.

---

## 4. Boot Camp Requirement: AI Framework Configuration

The repository structure requires dedicated directories validating the usage of automated agents, operational skills, and Model Context Protocol (MCP) tooling specs.

### 4.1 Folder Structure Layout

```text
pisilist/
├── CLAUDE.md
├── wiki/
│   ├── report.md
│   ├── state.md
│   ├── code_flowchart.md
├── .mcp.json
├── .claude/
│   ├── agents/
│   │   ├── <agent_name>.md
│   └── skills/
│       ├── <skill_name>/
│       │   └── SKILL.md
│
```

- **report.md** : for project documentation and updates when every AI job done, every error, every code change, every test result, etc.
- **state.md** : for recording the current state of the project, including pending tasks, ongoing work, and any blockers. Updated after every AI job done, every code change, every test result, etc.
- **code_flowchart.md** : for visual representation of the code structure, data flow, and architecture. Updated as the codebase evolves.Every detail deep dive into files and code line.

I will manually install context7 mcp and firebase mcp as cluade plugin in project level. Claude responsible is to create agent, skill and mcp at least one before implement the real code. They should be small md file not large.
My draft idea are -

- Agents
    - wiki_manager.md: Responsible for managing the wiki directory, ensuring all documentation is up-to-date in every AI job done and properly formatted.
    - git_manager.md: Responsible for managing git commits, branches, and pull requests, ensuring that all code changes are properly documented and integrated.
    - test_manager.md: Responsible for managing the testing framework, ensuring that all code changes are properly tested and that test coverage is maintained.
- Skills
    - code_review/
        - SKILL.md: Responsible for reviewing code changes, providing feedback, and ensuring that all code adheres to the project's coding standards and best practices.
    - documentation/
        - SKILL.md: Responsible for creating and maintaining project documentation, ensuring that all information is accurate, clear, and accessible to all team members.

- MCP
    - project_management.mcp.json: Defines the interactions between the agents and skills, outlining the workflow for managing the project, including code changes, documentation updates, and testing procedures.
