import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useCards } from '../contexts/CardsContext';
import { useInvitations } from '../contexts/InvitationsContext';
import { logOut } from '../services/auth';
import { createCard } from '../services/cards';
import CardPreview from '../components/CardPreview';
import type { Card } from '../types';

interface Props {
  navigation: any;
}

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cards, loading, error } = useCards();
  const { invitations } = useInvitations();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const pinned = cards.filter((c) => c.pinned);
  const others = cards.filter((c) => !c.pinned);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logOut();
        },
      },
    ]);
  };

  const handleCreateCard = async () => {
    const title = newTitle.trim();
    if (!title) {
      setModalVisible(false);
      setNewTitle('');
      return;
    }
    if (!user) return;

    setCreating(true);
    try {
      await createCard(user.uid, title);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create card.');
    }
    setCreating(false);
    setModalVisible(false);
    setNewTitle('');
  };

  const handleCardPress = useCallback(
    (cardId: string) => {
      navigation.navigate('CardDetail', { cardId });
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }: { item: any }) => {
      // CardPreview reads taskCount/completedCount from the Firestore doc data
      const data = item as Card & { taskCount?: number; completedCount?: number };
      return (
        <CardPreview
          card={data}
          taskCount={(data as any).taskCount ?? 0}
          completedCount={(data as any).completedCount ?? 0}
          currentUserId={user?.uid}
          onPress={() => handleCardPress(data.id)}
        />
      );
    },
    [handleCardPress],
  );

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const allData: Array<{ type: 'pinned' } | { type: 'others' } | Card> = [];
  if (pinned.length > 0) {
    allData.push({ type: 'pinned' } as any);
    allData.push(...pinned);
  }
  if (others.length > 0) {
    allData.push({ type: 'others' } as any);
    allData.push(...others);
  }

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === 'pinned') return renderSectionHeader('📌 Pinned');
      if (item.type === 'others') return renderSectionHeader('Others');
      return renderCard({ item });
    },
    [renderCard],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>PisiList</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Invitations')}
            activeOpacity={0.7}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {invitations.length > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {invitations.length > 9 ? '9+' : invitations.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={styles.signOut}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>
          Welcome, {user?.displayName || user?.email}
        </Text>
      </View>

      {/* Card Grid */}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : cards.length === 0 && !loading ? (
        <View style={styles.center}>
          <Text style={styles.placeholderIcon}>📋</Text>
          <Text style={styles.placeholderTitle}>No Cards Yet</Text>
          <Text style={styles.placeholderSubtitle}>
            Tap the + button to create your first task list.
          </Text>
        </View>
      ) : (
        <FlatList
          data={allData}
          renderItem={renderItem}
          keyExtractor={(item: any) =>
            item.type ? `section-${item.type}` : item.id
          }
          numColumns={2}
          columnWrapperStyle={
            allData.some((d: any) => d.type === 'pinned' || d.type === 'others')
              ? undefined
              : styles.gridRow
          }
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl refreshing={loading} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}>
                <Text style={styles.loadingText}>Loading cards...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Card Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setNewTitle('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Card</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Card Title"
              placeholderTextColor="#999"
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              onSubmitEditing={handleCreateCard}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setModalVisible(false);
                  setNewTitle('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalCreate,
                  creating && { opacity: 0.6 },
                ]}
                onPress={handleCreateCard}
                disabled={creating}
              >
                <Text style={styles.modalCreateText}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  bellIcon: {
    fontSize: 20,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#e53935',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  signOut: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: '500',
  },
  greetingRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    width: '100%',
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(26,115,232,0.35)',
    elevation: 6,
  },
  fabIcon: {
    fontSize: 30,
    color: '#fff',
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width - 64,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a2e',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#666',
  },
  modalCreate: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
  },
  modalCreateText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
