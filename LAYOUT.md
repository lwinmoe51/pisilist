# LAYOUT.md

This document illustrates the text-based ASCII structure layouts representing the core views of the `pisilist` cross-platform application interface.

## 1. Authentication View

```text
+-----------------------------------------------------+
|                      PISILIST                       |
|             "Simplicity in Team Tasks"              |
+-----------------------------------------------------+
|                                                     |
|   [ Email Address                     ]             |
|   [ Password                          ]             |
|                                                     |
|   +---------------------------------------------+   |
|   |                   LOG IN                    |   |
|   +---------------------------------------------+   |
|                                                     |
|   Don't have an account? Sign Up                    |
|   Forgot Password? Reset Here                       |
|                                                     |
+-----------------------------------------------------+
```

## 2. Main Dashboard (Google Keep Style Grid)

```text
+-----------------------------------------------------+
|  =  Search your lists...                    (User)  |
+-----------------------------------------------------+
|  [Pinned]                                           |
|  +---------------------+   +---------------------+  |
|  | Project Ideas   [X] |   | Groceries       [X] |  |
|  | [ ] Design App UI   |   | [x] Fresh Milk      |  |
|  | [ ] Code Firestore  |   | [ ] Apples          |  |
|  | (Collab: @A, @B)    |   +---------------------+  |
|  +---------------------+                            |
|                                                     |
|  [Others]                                           |
|  +---------------------+   +---------------------+  |
|  | Personal Gym Plan[X]|   | Pisilist Bootcamp[X]|  |
|  | [ ] 5K Run          |   | [ ] Setup MCP       |  |
|  | [ ] Pushups         |   | [ ] Write Docs      |  |
|  +---------------------+   +---------------------+  |
+-----------------------------------------------------+
|                                              +---+  |
|                                              | + |  |
+----------------------------------------------+---+--+
```

## 3. Card Detail & Multi-Assignment View

```text
+-----------------------------------------------------+
|  <-  Project Ideas                      [DELETE CARD] |
+-----------------------------------------------------+
|  Collaborators: (@Owner) (@UserA) (@UserB) [+]      |
|  -------------------------------------------------  |
|                                                     |
|  [ ] Design App UI                        [DELETE]  |
|      Assignee: [@UserA]                             |
|      Reminders:                                     |
|        (⏰ 2026-06-20 09:00 AM) [X]                 |
|        (⏰ 2026-06-20 02:00 PM) [X]                 |
|        [+ Add Reminder]                             |
|                                                     |
|  [ ] Code Firestore Sync                  [DELETE]  |
|      Assignee: [Unassigned  v]                      |
|      Reminders:                                     |
|        [+ Add Reminder]                             |
|                                                     |
|  [+ Add Task Item...                      ] [ADD]   |
|  -------------------------------------------------  |
|  [v] Checked Items (1)                              |
|    [x] Completed Task Item Example         [DELETE]  |
+-----------------------------------------------------+
```

## 4. Collaboration Invitations Management Drawer

```text
+-----------------------------------------------------+
|  [X]   Pending Invitations                          |
+-----------------------------------------------------+
|                                                     |
|  From: manager@bootcamp.com                         |
|  Card: "Vibecode Final Submission"                  |
|  [ ACCEPT ]           [ DECLINE ]                   |
|  -------------------------------------------------  |
|                                                     |
|  From: peer@developer.net                           |
|  Card: "Debug Session Bugfix"                       |
|  [ ACCEPT ]           [ DECLINE ]                   |
|                                                     |
+-----------------------------------------------------+
```

## 5. Reminder Scheduling Modal

```text
+-----------------------------------------------------+
|  [X] Close   Set Reminder for "Design App UI"       |
+-----------------------------------------------------+
|                                                     |
|  [⏰] Select Date & Time: [2026-06-20 09:00 AM]     |
|                                                     |
|  +-----------------------------------------------+  |
|  |                 SET REMINDER                  |  |
|  +-----------------------------------------------+  |
|                                                     |
+-----------------------------------------------------+
```

## 6. User Profile & Settings View

```text
+-----------------------------------------------------+
|  <-  User Profile                            [SAVE] |
+-----------------------------------------------------+
|                                                     |
|   [ Avatar Picture ]                                |
|                                                     |
|   Name:     [ John Doe                  ]           |
|   Email:    [ john.doe@example.com      ]           |
|   Password: [ ******** ]           |
|                                                     |
|   +---------------------------------------------+   |
|   |               CHANGE PASSWORD               |   |
|   +---------------------------------------------+   |
|                                                     |
+-----------------------------------------------------+
```
