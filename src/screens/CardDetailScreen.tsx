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
  Dimensions,
} from 'react-native';
import { onSnapshot, doc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
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
import {
  scheduleReminder,
  cancelReminder,
} from '../services/notifications';
import { db } from '../config/firebase';
import AssigneePicker from '../components/AssigneePicker';
import ReminderModal from '../components/ReminderModal';
import type { Card, Task, Reminder } from '../types';

interface Props {
  navigation: any;
  route: any;
}

export default function CardDetailScreen({ navigation, route }: Props) {
  const { cardId } = route.params as { cardId: string };
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [card, setCard] = useState<Card | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [checkedOpen, setCheckedOpen] = useState(true);

  // Modals
  const [inviteVisible, setInviteVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [assigneeTask, setAssigneeTask] = useState<Task | null>(null);
  const [reminderTask, setReminderTask] = useState<Task | null>(null);

  // Collaborator profiles cache
  const [collabProfiles, setCollabProfiles] = useState<
    Map<string, { email: string; displayName: string }>
  >(new Map());

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
        const taskList = snapshot.docs.map((d) =>
          docToTask(d.id, d.data()),
        );
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
    const uids = [
      ...new Set([card.ownerId, ...(card.collaborators ?? [])]),
    ];
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
    Alert.alert(
      'Delete Card',
      'This will permanently delete the card and all its tasks.',
      [
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
      ],
    );
  };

  // ── Task actions ───────────────────────────────────────────────
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

  // ── Invite ─────────────────────────────────────────────────────
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

  // ── Assign ─────────────────────────────────────────────────────
  const handleAssign = async (uid: string | null) => {
    if (!assigneeTask) return;
    const assigneeEmail = uid
      ? collabProfiles.get(uid)?.email ?? null
      : null;
    try {
      await updateTask(cardId, assigneeTask.id, { assignee: assigneeEmail });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setAssigneeTask(null);
  };

  // ── Reminders ──────────────────────────────────────────────────
  const handleAddReminder = async (timestamp: Date) => {
    if (!reminderTask || !card) return;

    const reminder: Reminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
    };

    // Schedule the push notification
    const notifId = await scheduleReminder(
      reminderTask.id,
      card.title,
      reminderTask.text,
      timestamp,
    );

    // Store the notification id inside the reminder for later cancellation
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

    const target = reminderTask.reminders.find(
      (r) => r.id === reminderId,
    );
    if (target) {
      await cancelReminder((target as any).notificationId ?? '');
    }

    const updated = reminderTask.reminders.filter(
      (r) => r.id !== reminderId,
    );
    try {
      await updateTaskReminders(cardId, reminderTask.id, updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────
  const collabLabel = (uid: string) => {
    const p = collabProfiles.get(uid);
    return p ? p.displayName || p.email : uid.slice(0, 8);
  };

  const isOwner = card?.ownerId === user?.uid;

  const unchecked = tasks.filter((t) => !t.completed);
  const checked = tasks.filter((t) => t.completed);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {editingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={titleDraft}
            onChangeText={setTitleDraft}
            onBlur={handleTitleEdit}
            onSubmitEditing={handleTitleEdit}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.titleWrap}
            onPress={() => {
              setTitleDraft(card?.title ?? '');
              setEditingTitle(true);
            }}
          >
            <Text style={styles.title} numberOfLines={1}>
              {card?.title ?? ''}
            </Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <TouchableOpacity onPress={handleDeleteCard} activeOpacity={0.7}>
            <Text style={styles.deleteBtn}>DELETE CARD</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Collaborators row */}
      <View style={styles.collabRow}>
        <View style={styles.collabAvatars}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {collabLabel(card?.ownerId ?? '')[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          {card?.collaborators?.map((uid) => (
            <View key={uid} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {collabLabel(uid)[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          ))}
          {isOwner && (
            <TouchableOpacity
              style={styles.avatarAdd}
              onPress={() => setInviteVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarAddText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={unchecked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.taskList}
          ListHeaderComponent={
            unchecked.length === 0 && checked.length === 0 ? (
              <Text style={styles.empty}>No tasks yet. Add one below.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onToggle={() => handleToggle(item)}
              onDelete={() => handleDeleteTask(item)}
              onAssign={() => setAssigneeTask(item)}
              onReminders={() => setReminderTask(item)}
            />
          )}
          ListFooterComponent={
            <>
              {checked.length > 0 && (
                <View style={styles.checkedSection}>
                  <TouchableOpacity
                    style={styles.checkedHeader}
                    onPress={() => setCheckedOpen(!checkedOpen)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.checkedArrow}>
                      {checkedOpen ? '▼' : '▶'}
                    </Text>
                    <Text style={styles.checkedLabel}>
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
                      />
                    ))}
                </View>
              )}

              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="+ Add Task Item..."
                  placeholderTextColor="#999"
                  value={newTaskText}
                  onChangeText={setNewTaskText}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                  editable={!addingTask}
                />
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    addingTask && { opacity: 0.6 },
                  ]}
                  onPress={handleAddTask}
                  disabled={addingTask}
                >
                  <Text style={styles.addBtnText}>ADD</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>

      {/* Invite Modal */}
      <Modal
        visible={inviteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.inviteSheet}>
            <Text style={styles.inviteTitle}>Invite Collaborator</Text>
            <TextInput
              style={styles.inviteInput}
              placeholder="Enter email address"
              placeholderTextColor="#999"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <View style={styles.inviteButtons}>
              <TouchableOpacity
                style={styles.inviteCancelBtn}
                onPress={() => {
                  setInviteVisible(false);
                  setInviteEmail('');
                }}
              >
                <Text style={styles.inviteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.inviteSendBtn,
                  inviting && { opacity: 0.6 },
                ]}
                onPress={handleInvite}
                disabled={inviting}
              >
                <Text style={styles.inviteSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Assignee Picker */}
      <AssigneePicker
        visible={!!assigneeTask}
        onClose={() => setAssigneeTask(null)}
        onAssign={handleAssign}
        collaborators={card?.collaborators ?? []}
        currentAssignee={assigneeTask?.assignee ?? null}
        ownerId={card?.ownerId ?? ''}
      />

      {/* Reminder Modal */}
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

// ── Task Row Component ────────────────────────────────────────────
function TaskRow({
  task,
  checked = false,
  onToggle,
  onDelete,
  onAssign,
  onReminders,
}: {
  task: Task;
  checked?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onReminders: () => void;
}) {
  return (
    <View style={[styles.taskRow, checked && styles.taskRowChecked]}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          task.completed && styles.checkboxChecked,
        ]}
        onPress={onToggle}
        activeOpacity={0.6}
      >
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.taskBody}>
        <Text
          style={[
            styles.taskText,
            task.completed && styles.taskTextChecked,
          ]}
          numberOfLines={3}
        >
          {task.text}
        </Text>

        <View style={styles.taskMeta}>
          {/* Tap assignee to open picker */}
          <TouchableOpacity onPress={onAssign} activeOpacity={0.6}>
            <Text
              style={[
                styles.assignee,
                !task.assignee && styles.assigneeEmpty,
              ]}
            >
              {task.assignee
                ? `@${task.assignee.split('@')[0]}`
                : 'Unassigned ▾'}
            </Text>
          </TouchableOpacity>

          {/* Tap reminders to open modal */}
          <TouchableOpacity
            onPress={onReminders}
            activeOpacity={0.6}
            style={styles.reminderWrap}
          >
            <Text style={styles.reminderBadge}>
              ⏰ {task.reminders.length > 0 ? task.reminders.length : '+'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} activeOpacity={0.6}>
        <Text style={styles.taskDelete}>DELETE</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  backArrow: { fontSize: 24, color: '#1a73e8', paddingRight: 4 },
  titleWrap: { flex: 1 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a2e' },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
    paddingVertical: 2,
  },
  deleteBtn: {
    fontSize: 12,
    color: '#e53935',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  collabRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  collabAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#1a73e8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAddText: {
    color: '#1a73e8',
    fontSize: 18,
    fontWeight: '600',
  },
  body: { flex: 1 },
  taskList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  empty: {
    fontSize: 14,
    color: '#bbb',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 10,
  },
  taskRowChecked: { opacity: 0.6 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  taskBody: { flex: 1 },
  taskText: { fontSize: 15, color: '#1a1a2e', lineHeight: 21 },
  taskTextChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  assignee: { fontSize: 12, color: '#1a73e8', fontWeight: '500' },
  assigneeEmpty: { color: '#bbb' },
  reminderWrap: {},
  reminderBadge: { fontSize: 12, color: '#f9a825', fontWeight: '500' },
  taskDelete: { fontSize: 11, color: '#e53935', fontWeight: '600' },
  checkedSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checkedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  checkedArrow: { fontSize: 12, color: '#666' },
  checkedLabel: { fontSize: 14, fontWeight: '500', color: '#666' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a2e',
    borderStyle: 'dashed',
  },
  addBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
  },
  addBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  // Invite modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteSheet: {
    width: Dimensions.get('window').width - 64,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  inviteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a2e',
    marginBottom: 16,
  },
  inviteButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  inviteCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  inviteCancelText: { fontSize: 15, color: '#666' },
  inviteSendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
  },
  inviteSendText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
