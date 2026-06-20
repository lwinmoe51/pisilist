import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Card } from '../types';

interface Props {
  card: Card;
  taskCount?: number;
  completedCount?: number;
  reminderCount?: number;
  currentUserId?: string;
  cardWidth: number;
  onPress: () => void;
}

export default function CardPreview({
  card,
  taskCount = 0,
  completedCount = 0,
  reminderCount = 0,
  currentUserId,
  cardWidth,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const uncheckedCount = Math.max(0, taskCount - completedCount);
  const isShared = currentUserId && card.ownerId !== currentUserId;
  const s = themedStyles(colors, cardWidth);

  // Build decorative preview items showing checked/unchecked state
  const previewItems = buildPreview(taskCount, completedCount);

  return (
    <TouchableOpacity
      style={[s.card, isShared && s.cardShared]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Title + Pin */}
      <View style={s.titleRow}>
        <Text style={s.title} numberOfLines={2}>
          {card.title}
        </Text>
        {card.pinned && <Text style={s.pin}>📌</Text>}
      </View>

      {isShared && <Text style={s.sharedLabel}>↗ Shared with you</Text>}

      {/* Task preview items — real checkboxes */}
      {taskCount > 0 && (
        <View style={s.previewSection}>
          {previewItems.map((item, i) => (
            <View key={i} style={s.previewRow}>
              <View style={[s.miniCheckbox, item.checked && s.miniCheckboxChecked]}>
                {item.checked && <Text style={s.miniCheckmark}>✓</Text>}
              </View>
              <Text style={[s.previewText, item.checked && s.previewTextChecked]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
          {taskCount > 3 && (
            <Text style={s.moreItems}>+{taskCount - 3} more items</Text>
          )}
        </View>
      )}

      {taskCount === 0 && (
        <Text style={s.empty}>No tasks yet</Text>
      )}

      {/* Bottom row — collab count · reminder count · progress */}
      <View style={s.bottomRow}>
        <View style={s.bottomLeft}>
          {card.collaborators.length > 0 && (
            <Text style={s.badge}>👥 {card.collaborators.length}</Text>
          )}
          {reminderCount > 0 && (
            <Text style={[s.badge, s.reminderBadge]}>⏰ {reminderCount}</Text>
          )}
        </View>
        {taskCount > 0 && (
          <Text style={s.progress}>{completedCount}/{taskCount} done</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/** Build decorative preview items from counts. */
function buildPreview(
  total: number,
  completed: number,
): { label: string; checked: boolean }[] {
  const count = Math.min(total, 3);
  // First show completed items, then unchecked
  const items: { label: string; checked: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      label: i < completed ? `Completed item ${i + 1}` : `Task item ${i - completed + 1}`,
      checked: i < completed,
    });
  }
  return items;
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors'], cardWidth: number) =>
  StyleSheet.create({
    card: {
      width: cardWidth,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
      borderWidth: 0,
      boxShadow: colors.cardShadow,
      elevation: 2,
    },
    cardShared: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    pin: {
      fontSize: 13,
      marginLeft: 6,
    },
    sharedLabel: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 8,
    },
    previewSection: {
      marginBottom: 10,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    miniCheckbox: {
      width: 16,
      height: 16,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: colors.checkboxBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    miniCheckboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    miniCheckmark: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
    },
    previewText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
    },
    previewTextChecked: {
      textDecorationLine: 'line-through',
      color: colors.placeholder,
    },
    moreItems: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 2,
      marginLeft: 24,
    },
    empty: {
      fontSize: 13,
      color: colors.placeholder,
      fontStyle: 'italic',
      marginBottom: 6,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    bottomLeft: {
      flexDirection: 'row',
      gap: 6,
      flex: 1,
    },
    badge: {
      fontSize: 12,
      color: colors.subtext,
    },
    reminderBadge: {
      color: colors.warning,
      fontWeight: '600',
    },
    progress: {
      fontSize: 12,
      color: colors.subtext,
      fontWeight: '500',
    },
  });
