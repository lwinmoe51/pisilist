import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { getUsersByUids } from '../services/users';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAssign: (uid: string | null) => void; // null = unassign
  collaborators: string[]; // user IDs
  currentAssignee: string | null;
  ownerId: string;
}

export default function AssigneePicker({
  visible,
  onClose,
  onAssign,
  collaborators,
  currentAssignee,
  ownerId,
}: Props) {
  const [profiles, setProfiles] = useState<
    Map<string, { email: string; displayName: string }>
  >(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    const allUids = [...new Set([ownerId, ...collaborators])];
    getUsersByUids(allUids).then((map) => {
      setProfiles(map);
      setLoading(false);
    });
  }, [visible, ownerId, collaborators.join(',')]);

  const labelFor = (uid: string) => {
    const p = profiles.get(uid);
    return p ? `${p.displayName} (${p.email})` : uid;
  };

  const items = [
    { uid: null as string | null, label: 'Unassigned' },
    ...collaborators.map((uid) => ({ uid, label: labelFor(uid) })),
    // owner is always available even if not in collaborators list
    ...(!collaborators.includes(ownerId)
      ? [{ uid: ownerId, label: labelFor(ownerId) }]
      : []),
  ];

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
        <View style={styles.sheet}>
          <Text style={styles.title}>Assign Task To</Text>

          {loading ? (
            <ActivityIndicator
              size="small"
              color="#1a73e8"
              style={{ marginVertical: 20 }}
            />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.uid ?? 'unassigned'}
              renderItem={({ item }) => {
                const isSelected =
                  (item.uid === null && !currentAssignee) ||
                  item.uid === currentAssignee;

                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => {
                      onAssign(item.uid);
                      onClose();
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.uid
                          ? (profiles.get(item.uid)?.displayName ??
                              item.uid)[0].toUpperCase()
                          : '—'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Text style={styles.check}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.list}
            />
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '60%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  list: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  optionSelected: {
    backgroundColor: '#e8f0fe',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a2e',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#1a73e8',
  },
  check: {
    fontSize: 18,
    color: '#1a73e8',
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeText: {
    fontSize: 15,
    color: '#666',
  },
});
