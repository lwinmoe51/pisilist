import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    // On Android, the picker auto-dismisses; on iOS it stays open
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (date && _event.type === 'set') {
        setPickerDate(date);
        onAdd(date);
      }
    } else {
      if (date) setPickerDate(date);
    }
  };

  const handleSetReminder = () => {
    if (pickerDate <= new Date()) {
      // future date required
      const future = new Date(Date.now() + 3600000); // 1 hour from now
      onAdd(future);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Set Reminder for{'\n'}"{taskText}"
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Existing reminders */}
          {reminders.length > 0 && (
            <View style={styles.existingSection}>
              <Text style={styles.sectionLabel}>Existing Reminders</Text>
              {reminders.map((r) => (
                <View key={r.id} style={styles.reminderRow}>
                  <Text style={styles.reminderIcon}>⏰</Text>
                  <Text style={styles.reminderText}>
                    {formatDate(r.timestamp)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onRemove(r.id)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Date Picker */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionLabel}>Select Date & Time</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateButtonText}>
                ⏰ {formatDate(pickerDate)}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={pickerDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
            )}

            {/* iOS confirm button (picker stays open, user taps "Set") */}
            {Platform.OS === 'ios' && showPicker && (
              <TouchableOpacity
                style={styles.iosSetBtn}
                onPress={() => {
                  setShowPicker(false);
                  handleSetReminder();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.iosSetBtnText}>Use This Time</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Set Reminder Button (Android — picker auto-dismissed) */}
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={styles.setBtn}
              onPress={() => {
                setShowPicker(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.setBtnText}>SET REMINDER</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '88%',
    backgroundColor: '#fff',
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
    color: '#1a1a2e',
    flex: 1,
  },
  closeBtn: {
    fontSize: 18,
    color: '#999',
    paddingLeft: 12,
  },
  existingSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  reminderIcon: {
    fontSize: 14,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
  },
  removeBtn: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: '700',
    padding: 4,
  },
  pickerSection: {
    marginBottom: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1a1a2e',
  },
  picker: {
    marginTop: 8,
  },
  iosSetBtn: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    alignItems: 'center',
  },
  iosSetBtnText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
  setBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  setBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
