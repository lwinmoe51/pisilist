# Plan: UI Rewrite Matching LAYOUT.md + Frontend-Design Standards

## Design Decisions (from frontend-design skill)

**Palette:** The 16-token theme system we built stays. It already matches the brief — neutral surfaces, blue primary, red danger, yellow warning. No change needed.

**Typography:** System native fonts (React Native default) — correct for cross-platform. The app should feel native on each OS, not branded with custom fonts that work against the platform feel.

**Signature element:** Each task row in CardDetail is a self-contained mini-dashboard — checkbox, text, inline assignee, inline reminders with timestamps and remove buttons, delete — all visible without a single tap. This makes the card detail immediately scannable.

**Layout concept:** Google Keep grid on Dashboard (information hub), action-focused list on CardDetail (action hub). Modals reserved for secondary flows only (invite collaborator, confirm delete).

## Gaps Between Current UI and LAYOUT.md

| View | LAYOUT.md Spec | Current | Fix |
|------|---------------|---------|-----|
| Dashboard | Search bar in header | Not present | Add search bar |
| Dashboard | User avatar "(User)" in header | "Sign Out" text link | Add avatar → navigates to Settings |
| Dashboard | No greeting row | "Welcome, ..." row | Remove greeting |
| Card Detail | Assignee inline per task | Modal picker | Inline dropdown per task row |
| Card Detail | Reminders inline per task with [X] | Modal | Inline badge list + add button per task row |
| Card Detail | Reminder times shown | Only ⏰ badge count | Show each reminder timestamp |
| Settings | User Profile + Settings view | Does not exist | Create new screen |
| Settings | Dark mode toggle | Does not exist | Add toggle |

## Implementation Plan

### 1. Dashboard Screen — Add search + avatar, remove greeting
- Replace "Sign Out" text with user avatar circle (first letter of displayName)
- Avatar tap → navigate to Settings
- Add search TextInput below header (filters cards client-side by title)
- Remove greeting row
- Bell icon + badge stays
- Sign out moved to Settings screen

### 2. Card Detail Screen — Inline assignee + reminders per task
- Each TaskRow gets inline elements:
  - Checkbox (existing)
  - Task text (existing)
  - Inline assignee: tappable text showing "@name" or "Unassigned ▾". Tapping opens a small inline dropdown (not modal) listing collaborators. Selecting one updates the task.
  - Inline reminders: if reminders exist, show each with "⏰ Jun 20, 9:00 AM [✕]" inline. A "+ Add" button at end opens inline DateTimePicker (not modal).
  - Delete button (existing)
- Remove AssigneePicker and ReminderModal imports (or keep as fallback for complex flows)
- Add a simple expand/collapse per task for the assignee dropdown and reminder picker

### 3. New: Settings Screen
LAYOUT.md view #6 plus dark mode toggle:
- Back arrow + "Settings" title
- Avatar circle (large, first letter)
- Name display (read-only)
- Email display (read-only)
- Dark mode toggle (Switch component using useTheme().setMode)
- Sign Out button (red, with confirmation)
- App version text at bottom

### 4. AppNavigator — Add Settings route

### Files to create:
- `src/screens/SettingsScreen.tsx`

### Files to modify:
- `src/screens/DashboardScreen.tsx` — search bar + avatar + remove greeting
- `src/screens/CardDetailScreen.tsx` — inline assignee dropdown + inline reminders per task
- `src/navigation/AppNavigator.tsx` — add Settings screen

### Files NOT touching (stable):
- `src/theme/` — palette stays
- `src/components/CardPreview.tsx` — already matches spec
- `src/components/ReminderModal.tsx` — keep as-is (still used)
- `src/components/AssigneePicker.tsx` — keep as-is (fallback picker)
- `src/components/DateTimePicker.tsx` — keep as-is
- All services — no changes
- `App.tsx` — no changes
