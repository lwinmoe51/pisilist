import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { Card } from '../types';

interface Props {
  card: Card;
  taskCount?: number;
  completedCount?: number;
  currentUserId?: string;
  onPress: () => void;
}

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2; // 2 cols + gap

export default function CardPreview({
  card,
  taskCount = 0,
  completedCount = 0,
  currentUserId,
  onPress,
}: Props) {
  const uncheckedCount = Math.max(0, taskCount - completedCount);
  const isShared = currentUserId && card.ownerId !== currentUserId;

  return (
    <TouchableOpacity
      style={[styles.card, isShared && styles.cardShared]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {card.title}
        </Text>
        {card.pinned && <Text style={styles.pin}>📌</Text>}
      </View>

      {isShared && <Text style={styles.sharedLabel}>↗ Shared with you</Text>}

      {uncheckedCount > 0 && (
        <View style={styles.taskPreview}>
          <Text style={styles.unchecked}>
            {uncheckedCount} {uncheckedCount === 1 ? 'task' : 'tasks'} remaining
          </Text>
        </View>
      )}

      {completedCount > 0 && (
        <Text style={styles.completed}>{completedCount} checked</Text>
      )}

      {taskCount === 0 && (
        <Text style={styles.empty}>No tasks yet</Text>
      )}

      {card.collaborators.length > 0 && (
        <View style={styles.collabRow}>
          <Text style={styles.collabText}>
            👥 {card.collaborators.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardShared: {
    borderColor: '#a8c8fa',
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
    color: '#1a1a2e',
  },
  pin: {
    fontSize: 12,
    marginLeft: 6,
  },
  sharedLabel: {
    fontSize: 10,
    color: '#1a73e8',
    fontWeight: '500',
    marginBottom: 6,
  },
  taskPreview: {
    marginBottom: 4,
  },
  unchecked: {
    fontSize: 13,
    color: '#e53935',
    fontWeight: '500',
  },
  completed: {
    fontSize: 12,
    color: '#888',
  },
  empty: {
    fontSize: 13,
    color: '#bbb',
    fontStyle: 'italic',
  },
  collabRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  collabText: {
    fontSize: 12,
    color: '#666',
  },
});
