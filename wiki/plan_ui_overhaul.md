# Plan: Responsive UI + Platform DateTimePicker + Dark Mode

## 1. Theme System (Dark Mode)

### New files
- `src/theme/colors.ts` — Light & dark palette:
  ```
  Light: bg #fff, surface #f5f5f5, text #1a1a2e, subtext #666, border #eee, primary #1a73e8
  Dark:  bg #121212, surface #1e1e1e, text #e0e0e0, subtext #aaa, border #333, primary #4da3ff
  ```
- `src/theme/ThemeContext.tsx` — ThemeProvider wrapping `useColorScheme()`, persisting choice to AsyncStorage, exposing `{ colors, isDark, toggle }` via `useTheme()` hook.
- Plug ThemeProvider into `App.tsx` (around everything).

### Modified files
Every screen and component — replace hardcoded color strings (`'#fff'`, `'#1a1a2e'`, etc.) with `colors.xxx` from `useTheme()`. Approach: read `colors` from context at top of each component, use in StyleSheet or inline styles.

## 2. Responsive Layout

### Strategy
- Use `useWindowDimensions()` in every screen (reactive, replaces static `Dimensions.get()`)
- On web > 768px: center content, cap `maxWidth: 768`
- Dashboard card grid: 2 columns mobile, 3 cols tablet, 4 cols desktop
- Modals: cap width at 480px on desktop
- Login/SignUp/ResetPassword: cap form width at 400px, center vertically

### Modified files
- `DashboardScreen.tsx` — responsive columns, max-width container
- `CardDetailScreen.tsx` — responsive header + task list, cap width
- `LoginScreen.tsx` — centered card with max-width
- `SignUpScreen.tsx` — same
- `ResetPasswordScreen.tsx` — same
- `InvitationsScreen.tsx` — cap content width

## 3. Platform-Aware DateTimePicker

### New file
- `src/components/DateTimePicker.tsx` — Unified picker:
  - **Android/iOS**: Uses `@react-native-community/datetimepicker` (existing behavior)
  - **Web**: Renders native HTML `<input type="date">` + `<input type="time">` via `Platform.OS === 'web'` path using react-native-web's HTML element support
  - Props: `value: Date`, `onChange: (date: Date) => void`, `minimumDate?: Date`

### Modified file
- `src/components/ReminderModal.tsx` — Replace direct DateTimePicker import with our new wrapper

## 4. Implementation Order
1. Create `src/theme/colors.ts`
2. Create `src/theme/ThemeContext.tsx`
3. Wire ThemeProvider into `App.tsx`
4. Create `src/components/DateTimePicker.tsx`
5. Update `ReminderModal.tsx` to use new DateTimePicker
6. Update all 5 screens + 2 components with theme colors & responsive layout
7. Test (55 tests must still pass)
8. Report → Commit via git_manager

## 5. Color Palette Detail

| Token | Light | Dark |
|-------|-------|------|
| background | #f5f5f5 | #121212 |
| surface | #ffffff | #1e1e1e |
| text | #1a1a2e | #e0e0e0 |
| subtext | #666666 | #aaaaaa |
| border | #e0e0e0 | #333333 |
| primary | #1a73e8 | #4da3ff |
| danger | #e53935 | #ef5350 |
| warning | #f9a825 | #ffd54f |
| muted | #f5f5f5 | #2a2a2a |
| placeholder | #999999 | #777777 |
