import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Card } from '../types';

interface Props {
  card: Card;
  taskCount?: number;
  completedCount?: number;
  currentUserId?: string;
  cardWidth: number;
  onPress: () => void;
}

export default function CardPreview({
  card,
  taskCount = 0,
  completedCount = 0,
  currentUserId,
  cardWidth,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const uncheckedCount = Math.max(0, taskCount - completedCount);
  const isShared = currentUserId && card.ownerId !== currentUserId;

  const s = themedStyles(colors, cardWidth);

  return (
    <TouchableOpacity
      style={[s.card, isShared && s.cardShared]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={s.header}>
        <Text style={s.title} numberOfLines={2}>
          {card.title}
        </Text>
        {card.pinned && <Text style={s.pin}>📌</Text>}
      </View>

      {isShared && <Text style={s.sharedLabel}>↗ Shared with you</Text>}

      {uncheckedCount > 0 && (
        <View style={s.taskPreview}>
          <Text style={s.unchecked}>
            {uncheckedCount} {uncheckedCount === 1 ? 'task' : 'tasks'} remaining
          </Text>
        </View>
      )}

      {completedCount > 0 && (
        <Text style={s.completed}>{completedCount} checked</Text>
      )}

      {taskCount === 0 && (
        <Text style={s.empty}>No tasks yet</Text>
      )}

      {card.collaborators.length > 0 && (
        <View style={s.collabRow}>
          <Text style={s.collabText}>
            👥 {card.collaborators.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors'], cardWidth: number) =>
  StyleSheet.create({
    card: {
      width: cardWidth,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      elevation: 2,
    },
    cardShared: {
      borderColor: colors.cardSharedBorder,
      borderWidth: 1.5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    pin: {
      fontSize: 12,
      marginLeft: 6,
    },
    sharedLabel: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '500',
      marginBottom: 6,
    },
    taskPreview: {
      marginBottom: 4,
    },
    unchecked: {
      fontSize: 13,
      color: colors.danger,
      fontWeight: '500',
    },
    completed: {
      fontSize: 12,
      color: colors.subtext,
    },
    empty: {
      fontSize: 13,
      color: colors.placeholder,
      fontStyle: 'italic',
    },
    collabRow: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    collabText: {
      fontSize: 12,
      color: colors.subtext,
    },
  });
