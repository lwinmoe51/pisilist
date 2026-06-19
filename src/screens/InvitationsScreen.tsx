import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useInvitations } from '../contexts/InvitationsContext';
import { acceptInvitation, declineInvitation } from '../services/invitations';
import type { Invitation } from '../types';

interface Props {
  navigation: any;
}

export default function InvitationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { invitations, loading } = useInvitations();
  const insets = useSafeAreaInsets();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleAccept = async (inv: Invitation) => {
    if (!user) return;
    setProcessingIds((prev) => new Set(prev).add(inv.id));
    try {
      await acceptInvitation(inv.id, user.uid, inv.cardId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept invitation.');
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(inv.id);
      return next;
    });
  };

  const handleDecline = async (inv: Invitation) => {
    setProcessingIds((prev) => new Set(prev).add(inv.id));
    try {
      await declineInvitation(inv.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to decline invitation.');
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(inv.id);
      return next;
    });
  };

  const renderItem = ({ item }: { item: Invitation }) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View style={styles.inviteRow}>
        <View style={styles.inviteInfo}>
          <Text style={styles.fromLabel}>From: {item.fromEmail}</Text>
          <Text style={styles.cardLabel}>Card: "{item.cardTitle}"</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.acceptBtn, isProcessing && styles.btnDisabled]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.acceptText}>ACCEPT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.declineBtn, isProcessing && styles.btnDisabled]}
            onPress={() => handleDecline(item)}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.declineText}>DECLINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pending Invitations</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : invitations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No pending invitations</Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backArrow: {
    fontSize: 24,
    color: '#1a73e8',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  closeBtn: {
    fontSize: 18,
    color: '#999',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
  listContent: {
    padding: 16,
  },
  inviteRow: {
    paddingVertical: 14,
  },
  inviteInfo: {
    marginBottom: 12,
  },
  fromLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  acceptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineBtn: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  declineText: {
    color: '#e53935',
    fontSize: 14,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});
