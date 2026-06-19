import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import DateTimePickerNative, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import type { AppColors } from '../theme/colors';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
  colors: AppColors;
}

/**
 * Platform-aware DateTimePicker.
 * - Android/iOS: native spinner/compact picker via @react-native-community/datetimepicker
 * - Web: HTML5 <input type="date"> + <input type="time">
 */
export default function DateTimePicker({
  value,
  onChange,
  minimumDate,
  mode = 'datetime',
  colors,
}: Props) {
  // ── Web path ───────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <WebDateTimePicker
        value={value}
        onChange={onChange}
        minimumDate={minimumDate}
        mode={mode}
        colors={colors}
      />
    );
  }

  // ── Native path (Android / iOS) ─────────────────────────────────
  return (
    <NativePicker
      value={value}
      onChange={onChange}
      minimumDate={minimumDate}
      mode={mode}
    />
  );
}

// ── Native implementation ──────────────────────────────────────────

function NativePicker({
  value,
  onChange,
  minimumDate,
  mode,
}: Omit<Props, 'colors'>) {
  const handleChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (date) onChange(date);
    },
    [onChange],
  );

  return (
    <DateTimePickerNative
      value={value}
      mode={mode}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={handleChange}
      minimumDate={minimumDate}
    />
  );
}

// ── Web implementation ─────────────────────────────────────────────
// Uses HTML5 native date/time inputs via react-native-web's DOM interop.

function WebDateTimePicker({
  value,
  onChange,
  minimumDate,
  mode,
  colors,
}: Props) {
  const pad = (n: number) => String(n).padStart(2, '0');

  const dateStr = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const timeStr = `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  const minDateStr = minimumDate
    ? `${minimumDate.getFullYear()}-${pad(minimumDate.getMonth() + 1)}-${pad(minimumDate.getDate())}`
    : undefined;

  const handleDateChange = useCallback(
    (e: any) => {
      const v: string = e.target?.value ?? '';
      if (!v) return;
      const parts = v.split('-').map(Number);
      const next = new Date(value);
      next.setFullYear(parts[0], parts[1] - 1, parts[2]);
      onChange(next);
    },
    [onChange, value],
  );

  const handleTimeChange = useCallback(
    (e: any) => {
      const v: string = e.target?.value ?? '';
      if (!v) return;
      const [h, m] = v.split(':').map(Number);
      const next = new Date(value);
      next.setHours(h, m, 0, 0);
      onChange(next);
    },
    [onChange, value],
  );

  const showDate = mode === 'date' || mode === 'datetime';
  const showTime = mode === 'time' || mode === 'datetime';

  const inputStyle: any = {
    padding: '10px 12px',
    fontSize: '15px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle: any = {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
    textTransform: 'uppercase',
    marginBottom: 4,
  };

  // react-native-web handles <div> and <input> natively in web builds
  const Div: any = 'div';
  const Input: any = 'input';
  const Label: any = 'label';

  return (
    <Div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {showDate && (
        <Div>
          <Label style={labelStyle}>Date</Label>
          <Input
            type="date"
            value={dateStr}
            min={minDateStr}
            onChange={handleDateChange}
            style={inputStyle}
          />
        </Div>
      )}
      {showTime && (
        <Div>
          <Label style={labelStyle}>Time</Label>
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            style={inputStyle}
          />
        </Div>
      )}
    </Div>
  );
}
