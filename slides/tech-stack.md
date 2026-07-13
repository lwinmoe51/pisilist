---
marp: true
paginate: true
transition: fade
---

<!-- slide 1 -->

# PisiList — Tech Stack

A collaborative to-do list built with **React Native**, **Expo**, and **Firebase**

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
