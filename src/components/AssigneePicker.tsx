import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getUsersByUids } from '../services/users';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAssign: (uid: string | null) => void;
  collaborators: string[];
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
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
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
    ...(!collaborators.includes(ownerId)
      ? [{ uid: ownerId, label: labelFor(ownerId) }]
      : []),
  ];

  const sheetMaxWidth = Math.min(width, 480);
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
        <View style={s.sheet}>
          <Text style={s.title}>Assign Task To</Text>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
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
                    style={[s.option, isSelected && s.optionSelected]}
                    onPress={() => {
                      onAssign(item.uid);
                      onClose();
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>
                        {item.uid
                          ? (profiles.get(item.uid)?.displayName ??
                              item.uid)[0].toUpperCase()
                          : '—'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        s.optionText,
                        isSelected && s.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Text style={s.check}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              style={s.list}
            />
          )}

          <TouchableOpacity
            style={s.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={s.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors'], sheetMaxWidth: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlayBg,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    sheet: {
      width: sheetMaxWidth,
      backgroundColor: colors.surface,
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
      color: colors.text,
      marginBottom: 12,
    },
    list: { maxHeight: 300 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      gap: 10,
    },
    optionSelected: {
      backgroundColor: colors.primary + '20',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    optionText: { flex: 1, fontSize: 15, color: colors.text },
    optionTextSelected: { fontWeight: '600', color: colors.primary },
    check: { fontSize: 18, color: colors.primary, fontWeight: '700' },
    closeBtn: {
      marginTop: 16,
      paddingVertical: 10,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    closeText: { fontSize: 15, color: colors.subtext },
  });
