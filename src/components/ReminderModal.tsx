import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import DateTimePicker from './DateTimePicker';
import type { Reminder } from '../types';

interface Props {
  visible: boolean;
  taskText: string;
  reminders: Reminder[];
  onClose: () => void;
  onAdd: (timestamp: Date) => void;
  onRemove: (reminderId: string) => void;
}

export default function ReminderModal({
  visible,
  taskText,
  reminders,
  onClose,
  onAdd,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleSetReminder = () => {
    if (pickerDate <= new Date()) {
      onAdd(new Date(Date.now() + 3600000)); // 1 hour from now
    } else {
      onAdd(pickerDate);
    }
  };

  const formatDate = (d: Date) => {
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr} at ${timeStr}`;
  };

  const sheetMaxWidth = Math.min(width * 0.88, 480);

  const s = themedStyles(colors, sheetMaxWidth);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={s.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity style={s.sheet} activeOpacity={1}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>
              Set Reminder for{'\n'}"{taskText}"
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Existing reminders */}
          {reminders.length > 0 && (
            <View style={s.existingSection}>
              <Text style={s.sectionLabel}>Existing Reminders</Text>
              {reminders.map((r) => (
                <View key={r.id} style={s.reminderRow}>
                  <Text style={s.reminderIcon}>⏰</Text>
                  <Text style={s.reminderText}>
                    {formatDate(r.timestamp)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onRemove(r.id)}
                    activeOpacity={0.6}
                  >
                    <Text style={s.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Date Picker */}
          <View style={s.pickerSection}>
            <Text style={s.sectionLabel}>Select Date & Time</Text>

            {/* Web: show HTML5 picker inline */}
            {Platform.OS === 'web' ? (
              <View style={s.webPickerWrap}>
                <DateTimePicker
                  value={pickerDate}
                  onChange={(d) => setPickerDate(d)}
                  minimumDate={new Date()}
                  mode="datetime"
                  colors={colors}
                />
                <TouchableOpacity
                  style={s.setBtn}
                  onPress={handleSetReminder}
                  activeOpacity={0.7}
                >
                  <Text style={s.setBtnText}>SET REMINDER</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={s.dateButton}
                  onPress={() => setShowPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={s.dateButtonText}>
                    ⏰ {formatDate(pickerDate)}
                  </Text>
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={pickerDate}
                    onChange={(d) => {
                      if (Platform.OS === 'android') {
                        setShowPicker(false);
                        onAdd(d);
                      } else {
                        setPickerDate(d);
                      }
                    }}
                    minimumDate={new Date()}
                    mode="datetime"
                    colors={colors}
                  />
                )}

                {/* iOS confirm button */}
                {Platform.OS === 'ios' && showPicker && (
                  <TouchableOpacity
                    style={s.iosSetBtn}
                    onPress={() => {
                      setShowPicker(false);
                      handleSetReminder();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.iosSetBtnText}>Use This Time</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Android: tap to open native picker */}
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={s.setBtn}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={s.setBtnText}>SET REMINDER</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors'], sheetMaxWidth: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlayBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sheet: {
      width: sheetMaxWidth,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    closeBtn: {
      fontSize: 18,
      color: colors.placeholder,
      paddingLeft: 12,
    },
    existingSection: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 12,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      gap: 6,
    },
    reminderIcon: { fontSize: 14 },
    reminderText: { flex: 1, fontSize: 14, color: colors.text },
    removeBtn: {
      fontSize: 14,
      color: colors.danger,
      fontWeight: '700',
      padding: 4,
    },
    pickerSection: { marginBottom: 16 },
    webPickerWrap: { gap: 12 },
    dateButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.muted,
    },
    dateButtonText: { fontSize: 15, color: colors.text },
    iosSetBtn: {
      marginTop: 8,
      paddingVertical: 10,
      backgroundColor: colors.primary + '20',
      borderRadius: 8,
      alignItems: 'center',
    },
    iosSetBtnText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    setBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    setBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
