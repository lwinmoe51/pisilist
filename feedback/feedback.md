<!-- Feedback template. Copy to your repo (e.g. feedback/feedback.md), fill, link in report.md.
     Use ONE of: interview / feedback / open-issues. This one = written feedback you collected. -->

# User Feedback — pisilist

- **How collected:** Chat-based walkthrough — 1 user (myself) performing hands-on exploration of the live web app at pisilist-app.web.app
- **When:** 2026-07-14

## Raw feedback

<!-- Paste or summarize what people said. Keep their real words where you can. -->

1. Login page is clean and works well. Centered layout, clear branding ("PisiList — Simplicity in Team Tasks"), obvious LOG IN button, and helpful links for Sign Up and Forgot Password. No issues logging in with test credentials.
2. Dashboard empty state is clear. "No Cardseate your first task list." is goodonboarding copy. The + FAB is prominent and obvious. 3. Card creation dialog works smoothly. The es a title, and creates the card. Simple andfrictionless. 4. Dashboard card preview is stale / misleaduy milk", "Buy eggs") inside the "GroceryShopping" card, the dashboard still shows "No tasks yet" on the card preview. The taskCount / completedCount fielthe Firestore card document are not being up completed. This is a real bug — the usersees incorrect information at a glance. 5. Card detail view is functional but bare. itle, and DELETE CARD (in red). Collaboratoravatars show at the top. Task list with add input works. But there's no drag-to-reorder, no swipe gestures, no completion progress bar — it feels like a mied task list.
3. Assignee dropdown shows raw UID instead of display name. When clicking "Unassigned ▾" on a task, the dropdown yAUJ8X1T (a Firebase UID) instead of the colis is confusing — users won't know who"yAUJ8X1T" is. The users/{uid} collection likely has a displayName field that should be resolved and shown here. 7. Reminder modal works but the assignee dro Add Reminder" opens a date/time picker withsensible defaults (current date + time). Setting a reminder works and shows a nice chip ("📅 Jul 14, 2026 6:10 PMHowever, the assignee dropdown from the prevbehind it, creating visual clutter.
4. Dashboard card preview doesn't reflect task count or completion. Even after adding tasks, the card on the dashshows no count — no "2/2 tasks", no progresse same whether it has 0 tasks or 50.
5. Notification bell → Invitations page is clean. Shows "No pending invitations" with a back arrow and close buttThe mapping of 🔔 to "Invitations" is not imusually means notifications (reminders, taskassignments), not just collaboration invites. 10. Dark mode looks good. Settings page switith good contrast. Toggle works. The darkmode extends to the whole app (background goes dark, inputs get dark styling, text stays readable). 11. Settings page is simple. Name, email, Chle, Sign Out, version number (v1.0.0). Theemail field appears editable but changing it probably doesn't update Firebase Auth — this could confuse users. 12. The three-dot menu (⋮) on dashboard card on the card preview but clicking it wasn'texplored — there's no tooltip or hint about what it does (pin? delete? share?). Users might not discover these actions.
6. Search works. Typing "Grocery" in the search bar correctly filtered to show only the matching card. Real-timefiltering is responsive.
7. No confirmation before DELETE CARD. The "DELETE CARD" button in the card detail header is red and prominent, there's no confirmation dialog. One accident gone.

## Themes (what keeps coming up)

- Data staleness on the dashboard — Card presk counts, completion status, or collaborator info. The dashboard feels disconnected from the detail view. - Raw UIDs in the UI — Collaborator identifid of human-readable names. This breaks the"collaboration" promise. - Functional but minimal — Every feature woradd tasks, set reminders, toggle dark mode),but nothing feels polished or delightful. Missing progress indicators, empty state illustrations, animations, or micro-interactions.
- Unclear iconography — The 🔔 bell maps to Invitations (not reminders), the three-dot menu on cards has no visible purpose, and the collaborator "Y" avatar witined.
- No safety nets — Deleting a card has no confirmation. No undo. No trash/archive.

## Top 3 things to fix

- [ ] Bug: Dashboard card preview shows "No tasks yet" even after tasks are added. The taskCount field on the card
      document isn't being updated when tasks are d. This is the most visible bug — users seewrong information every time they open the app.
- [ ] UX: Assignee dropdown shows raw Firebathe collaborator's display name. Resolve theUID against the users/{uid} collection and show displayName or email. This is critical for the collaboration feature to feel usable.
- [ ] UX: No confirmation dialog before "DELETE CARD." A single accidental click permanently destroys a card and all its tasks. Add a confirmation modal ("Are yoocery Shopping'? This cannot be undone.").
