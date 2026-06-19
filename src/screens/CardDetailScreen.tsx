import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { onSnapshot, doc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import {
  updateCard,
  deleteCard,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  updateTaskReminders,
  addCollaborator,
  tasksQuery,
  docToCard,
  docToTask,
} from '../services/cards';
import { sendInvitation } from '../services/invitations';
import { getUsersByUids } from '../services/users';
import { scheduleReminder, cancelReminder } from '../services/notifications';
import { db } from '../config/firebase';
import AssigneePicker from '../components/AssigneePicker';
import ReminderModal from '../components/ReminderModal';
import type { Card, Task, Reminder } from '../types';

interface Props {
  navigation: any;
  route: any;
}

/** Maximum content width for web readability. */
const MAX_CONTENT_WIDTH = 768;

export default function CardDetailScreen({ navigation, route }: Props) {
  const { cardId } = route.params as { cardId: string };
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const [card, setCard] = useState<Card | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [checkedOpen, setCheckedOpen] = useState(true);

  const [inviteVisible, setInviteVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [assigneeTask, setAssigneeTask] = useState<Task | null>(null);
  const [reminderTask, setReminderTask] = useState<Task | null>(null);

  const [collabProfiles, setCollabProfiles] = useState<
    Map<string, { email: string; displayName: string }>
  >(new Map());

  const contentMaxW = isWeb ? Math.min(width, MAX_CONTENT_WIDTH) : width;

  // ── Card listener ──────────────────────────────────────────────
  useEffect(() => {
    const cardRef = doc(db, 'cards', cardId);
    const unsubscribe = onSnapshot(
      cardRef,
      (snap) => {
        if (!snap.exists()) {
          Alert.alert('Card deleted', 'This card no longer exists.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        setCard(docToCard(snap.id, snap.data()));
      },
      (err) => Alert.alert('Error', err.message),
    );
    return unsubscribe;
  }, [cardId, navigation]);

  // ── Tasks listener ─────────────────────────────────────────────
  useEffect(() => {
    const q = tasksQuery(cardId);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const taskList = snapshot.docs.map((d) => docToTask(d.id, d.data()));
        setTasks(taskList);
        setLoading(false);
      },
      (err) => {
        Alert.alert('Error', err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [cardId]);

  // ── Collaborator profiles ──────────────────────────────────────
  useEffect(() => {
    if (!card) return;
    const uids = [...new Set([card.ownerId, ...(card.collaborators ?? [])])];
    getUsersByUids(uids).then(setCollabProfiles);
  }, [card?.ownerId, card?.collaborators?.join(',')]);

  // ── Card actions ───────────────────────────────────────────────
  const handleTitleEdit = async () => {
    const newTitle = titleDraft.trim();
    if (newTitle && newTitle !== card?.title) {
      try {
        await updateCard(cardId, { title: newTitle });
      } catch (err: any) {
        Alert.alert('Error', err.message);
      }
    }
    setEditingTitle(false);
  };

  const handleDeleteCard = () => {
    Alert.alert('Delete Card', 'This will permanently delete the card and all its tasks.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(cardId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleToggle = async (task: Task) => {
    try {
      await toggleTask(cardId, task.id, !task.completed);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert('Delete Task', `Delete "${task.text}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(cardId, task.id, task.completed);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleAddTask = async () => {
    const text = newTaskText.trim();
    if (!text) return;
    setAddingTask(true);
    try {
      await createTask(cardId, text);
      setNewTaskText('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setAddingTask(false);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || !user?.email || !card) return;
    setInviting(true);
    try {
      await sendInvitation(user.uid, user.email, {
        toEmail: email,
        cardId,
        cardTitle: card.title,
      });
      setInviteVisible(false);
      setInviteEmail('');
      Alert.alert('Sent', `Invitation sent to ${email}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setInviting(false);
  };

  const handleAssign = async (uid: string | null) => {
    if (!assigneeTask) return;
    const assigneeEmail = uid ? collabProfiles.get(uid)?.email ?? null : null;
    try {
      await updateTask(cardId, assigneeTask.id, { assignee: assigneeEmail });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setAssigneeTask(null);
  };

  const handleAddReminder = async (timestamp: Date) => {
    if (!reminderTask || !card) return;
    const reminder: Reminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
    };
    const notifId = await scheduleReminder(reminderTask.id, card.title, reminderTask.text, timestamp);
    const savedReminder = { ...reminder, notificationId: notifId };
    const updated = [...reminderTask.reminders, savedReminder];
    try {
      await updateTaskReminders(cardId, reminderTask.id, updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemoveReminder = async (reminderId: string) => {
    if (!reminderTask) return;
    const target = reminderTask.reminders.find((r) => r.id === reminderId);
    if (target) {
      await cancelReminder((target as any).notificationId ?? '');
    }
    const updated = reminderTask.reminders.filter((r) => r.id !== reminderId);
    try {
      await updateTaskReminders(cardId, reminderTask.id, updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const collabLabel = (uid: string) => {
    const p = collabProfiles.get(uid);
    return p ? p.displayName || p.email : uid.slice(0, 8);
  };

  const isOwner = card?.ownerId === user?.uid;
  const unchecked = tasks.filter((t) => !t.completed);
  const checked = tasks.filter((t) => t.completed);

  const s = themedStyles(colors, contentMaxW);

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>

        {editingTitle ? (
          <TextInput
            style={s.titleInput}
            value={titleDraft}
            onChangeText={setTitleDraft}
            onBlur={handleTitleEdit}
            onSubmitEditing={handleTitleEdit}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            style={s.titleWrap}
            onPress={() => {
              setTitleDraft(card?.title ?? '');
              setEditingTitle(true);
            }}
          >
            <Text style={s.title} numberOfLines={1}>
              {card?.title ?? ''}
            </Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <TouchableOpacity onPress={handleDeleteCard} activeOpacity={0.7}>
            <Text style={s.deleteBtn}>DELETE CARD</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Collaborators row */}
      <View style={s.collabRow}>
        <View style={s.collabAvatars}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {collabLabel(card?.ownerId ?? '')[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          {card?.collaborators?.map((uid) => (
            <View key={uid} style={s.avatar}>
              <Text style={s.avatarText}>
                {collabLabel(uid)[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          ))}
          {isOwner && (
            <TouchableOpacity
              style={s.avatarAdd}
              onPress={() => setInviteVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={s.avatarAddText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Centered body on web */}
      <View style={isWeb ? { alignSelf: 'center' as any, width: '100%', maxWidth: contentMaxW } : undefined}>
        <KeyboardAvoidingView
          style={s.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            data={unchecked}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.taskList}
            ListHeaderComponent={
              unchecked.length === 0 && checked.length === 0 ? (
                <Text style={s.empty}>No tasks yet. Add one below.</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <TaskRow
                task={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDeleteTask(item)}
                onAssign={() => setAssigneeTask(item)}
                onReminders={() => setReminderTask(item)}
                colors={colors}
              />
            )}
            ListFooterComponent={
              <>
                {checked.length > 0 && (
                  <View style={s.checkedSection}>
                    <TouchableOpacity
                      style={s.checkedHeader}
                      onPress={() => setCheckedOpen(!checkedOpen)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.checkedArrow}>{checkedOpen ? '▼' : '▶'}</Text>
                      <Text style={s.checkedLabel}>
                        Checked Items ({checked.length})
                      </Text>
                    </TouchableOpacity>
                    {checkedOpen &&
                      checked.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          checked
                          onToggle={() => handleToggle(task)}
                          onDelete={() => handleDeleteTask(task)}
                          onAssign={() => setAssigneeTask(task)}
                          onReminders={() => setReminderTask(task)}
                          colors={colors}
                        />
                      ))}
                  </View>
                )}

                <View style={s.addRow}>
                  <TextInput
                    style={s.addInput}
                    placeholder="+ Add Task Item..."
                    placeholderTextColor={colors.placeholder}
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                    editable={!addingTask}
                  />
                  <TouchableOpacity
                    style={[s.addBtn, addingTask && { opacity: 0.6 }]}
                    onPress={handleAddTask}
                    disabled={addingTask}
                  >
                    <Text style={s.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </>
            }
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </View>

      {/* Invite Modal */}
      <Modal visible={inviteVisible} transparent animationType="fade" onRequestClose={() => setInviteVisible(false)}>
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.inviteSheet, { width: Math.min(width - 64, 420) }]}>
            <Text style={s.inviteTitle}>Invite Collaborator</Text>
            <TextInput
              style={s.inviteInput}
              placeholder="Enter email address"
              placeholderTextColor={colors.placeholder}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <View style={s.inviteButtons}>
              <TouchableOpacity
                style={s.inviteCancelBtn}
                onPress={() => {
                  setInviteVisible(false);
                  setInviteEmail('');
                }}
              >
                <Text style={s.inviteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.inviteSendBtn, inviting && { opacity: 0.6 }]}
                onPress={handleInvite}
                disabled={inviting}
              >
                <Text style={s.inviteSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AssigneePicker
        visible={!!assigneeTask}
        onClose={() => setAssigneeTask(null)}
        onAssign={handleAssign}
        collaborators={card?.collaborators ?? []}
        currentAssignee={assigneeTask?.assignee ?? null}
        ownerId={card?.ownerId ?? ''}
      />

      <ReminderModal
        visible={!!reminderTask}
        taskText={reminderTask?.text ?? ''}
        reminders={reminderTask?.reminders ?? []}
        onClose={() => setReminderTask(null)}
        onAdd={handleAddReminder}
        onRemove={handleRemoveReminder}
      />
    </View>
  );
}

// ── Task Row ──────────────────────────────────────────────────────

function TaskRow({
  task,
  checked: _checked = false,
  onToggle,
  onDelete,
  onAssign,
  onReminders,
  colors,
}: {
  task: Task;
  checked?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onReminders: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const s = taskStyles(colors);

  return (
    <View style={[s.taskRow, task.completed && s.taskRowChecked]}>
      <TouchableOpacity
        style={[s.checkbox, task.completed && s.checkboxChecked]}
        onPress={onToggle}
        activeOpacity={0.6}
      >
        {task.completed && <Text style={s.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={s.taskBody}>
        <Text style={[s.taskText, task.completed && s.taskTextChecked]} numberOfLines={3}>
          {task.text}
        </Text>

        <View style={s.taskMeta}>
          <TouchableOpacity onPress={onAssign} activeOpacity={0.6}>
            <Text style={[s.assignee, !task.assignee && s.assigneeEmpty]}>
              {task.assignee ? `@${task.assignee.split('@')[0]}` : 'Unassigned ▾'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onReminders} activeOpacity={0.6} style={s.reminderWrap}>
            <Text style={s.reminderBadge}>
              ⏰ {task.reminders.length > 0 ? task.reminders.length : '+'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} activeOpacity={0.6}>
        <Text style={s.taskDelete}>DELETE</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const themedStyles = (colors: ReturnType<typeof useTheme>['colors'], contentMaxW: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBg,
      gap: 8,
    },
    backArrow: { fontSize: 24, color: colors.primary, paddingRight: 4 },
    titleWrap: { flex: 1 },
    title: { fontSize: 18, fontWeight: '600', color: colors.text },
    titleInput: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingVertical: 2,
    },
    deleteBtn: {
      fontSize: 12,
      color: colors.danger,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    collabRow: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    collabAvatars: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    avatarAdd: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarAddText: { color: colors.primary, fontSize: 18, fontWeight: '600' },
    body: { flex: 1 },
    taskList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    empty: {
      fontSize: 14,
      color: colors.placeholder,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 32,
    },
    checkedSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    checkedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    checkedArrow: { fontSize: 12, color: colors.subtext },
    checkedLabel: { fontSize: 14, fontWeight: '500', color: colors.subtext },
    addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
    addInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.inputBg,
      borderStyle: 'dashed',
    },
    addBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    addBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inviteSheet: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 24,
    },
    inviteTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    inviteInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.inputBg,
      marginBottom: 16,
    },
    inviteButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    inviteCancelBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    inviteCancelText: { fontSize: 15, color: colors.subtext },
    inviteSendBtn: {
      paddingVertical: 10,
      paddingHorizontal: 24,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    inviteSendText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  });

const taskStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    taskRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    taskRowChecked: { opacity: 0.6 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.placeholder,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
    taskBody: { flex: 1 },
    taskText: { fontSize: 15, color: colors.text, lineHeight: 21 },
    taskTextChecked: { textDecorationLine: 'line-through', color: colors.placeholder },
    taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 },
    assignee: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    assigneeEmpty: { color: colors.placeholder },
    reminderWrap: {},
    reminderBadge: { fontSize: 12, color: colors.warning, fontWeight: '500' },
    taskDelete: { fontSize: 11, color: colors.danger, fontWeight: '600' },
  });
