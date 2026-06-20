import React, { useEffect, useState, useCallback } from 'react';
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
  ScrollView,
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
import DateTimePicker from '../components/DateTimePicker';
import ConfirmModal from '../components/ConfirmModal';
import type { Card, Task, Reminder } from '../types';

interface Props {
  navigation: any;
  route: any;
}

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

  // Confirm modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Per-task inline state
  const [expandAssign, setExpandAssign] = useState<string | null>(null); // task id
  const [expandReminder, setExpandReminder] = useState<string | null>(null); // task id
  const [reminderDate, setReminderDate] = useState<Date>(new Date());

  const [collabProfiles, setCollabProfiles] = useState<
    Map<string, { email: string; displayName: string }>
  >(new Map());

  const contentMaxW = isWeb ? Math.min(width, MAX_CONTENT_WIDTH) : width;

  // ── Card listener ──────────────────────────────────────────────
  useEffect(() => {
    const cardRef = doc(db, 'cards', cardId);
    const unsub = onSnapshot(
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
    return unsub;
  }, [cardId, navigation]);

  // ── Tasks listener ─────────────────────────────────────────────
  useEffect(() => {
    const q = tasksQuery(cardId);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => docToTask(d.id, d.data()));
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        Alert.alert('Error', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [cardId]);

  // ── Collaborator profiles ──────────────────────────────────────
  useEffect(() => {
    if (!card) return;
    const uids = [...new Set([card.ownerId, ...(card.collaborators ?? [])])];
    getUsersByUids(uids).then(setCollabProfiles);
  }, [card?.ownerId, card?.collaborators?.join(',')]);

  // ── Confirm modal helper ─────────────────────────────────────
  const showConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    confirmAction?.();
    setConfirmAction(null);
  };

  const handleConfirmCancel = () => {
    setConfirmVisible(false);
    setConfirmAction(null);
  };

  // ── Card actions ───────────────────────────────────────────────
  const handleTitleEdit = async () => {
    const t = titleDraft.trim();
    console.log('[UI] handleTitleEdit:', { cardId, newTitle: t, oldTitle: card?.title });
    if (t && t !== card?.title) {
      try { await updateCard(cardId, { title: t }); } catch (err: any) {
        console.error('[UI] handleTitleEdit FAILED:', err);
        Alert.alert('Error', err.message || String(err));
      }
    }
    setEditingTitle(false);
  };

  const handleDeleteCard = () => {
    console.log('[UI] handleDeleteCard clicked, cardId:', cardId);
    showConfirm(
      'Delete Card',
      'This will permanently delete the card and all its tasks.',
      async () => {
        try {
          console.log('[UI] handleDeleteCard calling deleteCard...');
          await deleteCard(cardId);
          console.log('[UI] handleDeleteCard SUCCESS, navigating back');
          navigation.goBack();
        } catch (err: any) {
          console.error('[UI] handleDeleteCard FAILED:', err);
          Alert.alert('Error', err.message || String(err));
        }
      },
    );
  };

  const handleToggle = async (task: Task) => {
    console.log('[UI] handleToggle:', { taskId: task.id, taskText: task.text, currentCompleted: task.completed, newCompleted: !task.completed });
    try { await toggleTask(cardId, task.id, !task.completed); } catch (err: any) {
      console.error('[UI] handleToggle FAILED:', err);
      Alert.alert('Error', err.message || String(err));
    }
  };

  const handleDeleteTask = (task: Task) => {
    console.log('[UI] handleDeleteTask clicked, taskId:', task.id, 'taskText:', task.text);
    showConfirm(
      'Delete Task',
      `Delete "${task.text}"?`,
      async () => {
        try {
          console.log('[UI] handleDeleteTask calling deleteTask...');
          await deleteTask(cardId, task.id, task.completed);
          console.log('[UI] handleDeleteTask SUCCESS');
        } catch (err: any) {
          console.error('[UI] handleDeleteTask FAILED:', err);
          Alert.alert('Error', err.message || String(err));
        }
      },
    );
  };

  const handleAddTask = async () => {
    const text = newTaskText.trim();
    if (!text) return;
    console.log('[UI] handleAddTask:', { cardId, text });
    setAddingTask(true);
    try { await createTask(cardId, text); console.log('[UI] handleAddTask SUCCESS'); setNewTaskText(''); } catch (err: any) {
      console.error('[UI] handleAddTask FAILED:', err);
      Alert.alert('Error', err.message || String(err));
    }
    setAddingTask(false);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || !user?.email || !card) return;
    console.log('[UI] handleInvite:', { email, fromUser: user.email, cardId });
    setInviting(true);
    try {
      await sendInvitation(user.uid, user.email, { toEmail: email, cardId, cardTitle: card.title });
      console.log('[UI] handleInvite SUCCESS');
      setInviteVisible(false); setInviteEmail('');
      Alert.alert('Sent', `Invitation sent to ${email}.`);
    } catch (err: any) {
      console.error('[UI] handleInvite FAILED:', err);
      Alert.alert('Error', err.message || String(err));
    }
    setInviting(false);
  };

  // ── Inline assign ──────────────────────────────────────────────
  const handleAssign = async (task: Task, uid: string | null) => {
    const email = uid ? collabProfiles.get(uid)?.email ?? null : null;
    console.log('[UI] handleAssign:', { taskId: task.id, uid, email });
    try { await updateTask(cardId, task.id, { assignee: email }); } catch (err: any) {
      console.error('[UI] handleAssign FAILED:', err);
      Alert.alert('Error', err.message || String(err));
    }
    setExpandAssign(null);
  };

  // ── Inline reminder add ────────────────────────────────────────
  const handleAddReminder = async (task: Task, ts: Date) => {
    if (!card) return;
    console.log('[UI] handleAddReminder:', { taskId: task.id, timestamp: ts.toISOString() });
    const reminder: Reminder = { id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, timestamp: ts };
    const notifId = await scheduleReminder(task.id, card.title, task.text, ts);
    const saved = { ...reminder, notificationId: notifId };
    const updated = [...task.reminders, saved];
    try { await updateTaskReminders(cardId, task.id, updated); } catch (err: any) {
      console.error('[UI] handleAddReminder FAILED:', err);
      Alert.alert('Error', err.message || String(err));
    }
    setExpandReminder(null);
  };

  const handleRemoveReminder = async (task: Task, reminderId: string) => {
    console.log('[UI] handleRemoveReminder:', { taskId: task.id, reminderId });
    const target = task.reminders.find((r) => r.id === reminderId);
    if (target) await cancelReminder((target as any).notificationId ?? '');
    const updated = task.reminders.filter((r) => r.id !== reminderId);
    try { await updateTaskReminders(cardId, task.id, updated); } catch (err: any) {
      console.error('[UI] handleRemoveReminder FAILED:', err);
      Alert.alert('Error', err.message || String(err));
    }
  };

  // ── Helpers ────────────────────────────────────────────────────
  const collabLabel = (uid: string) => {
    const p = collabProfiles.get(uid);
    return p ? p.displayName || p.email : uid.slice(0, 8);
  };

  const collabEmail = (uid: string) => {
    const p = collabProfiles.get(uid);
    return p ? p.email : null;
  };

  const formatDate = (d: Date) => {
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  };

  const isOwner = card?.ownerId === user?.uid;
  const unchecked = tasks.filter((t) => !t.completed);
  const checked = tasks.filter((t) => t.completed);

  const s = themedStyles(colors);

  // Build collaborator options for inline dropdown
  const collabOptions = [
    { uid: null as string | null, label: 'Unassigned' },
    ...(card?.collaborators ?? []).map((uid) => ({ uid, label: collabLabel(uid) })),
    ...(!(card?.collaborators ?? []).includes(card?.ownerId ?? '') ? [{ uid: card?.ownerId ?? '', label: collabLabel(card?.ownerId ?? '') }] : []),
  ];

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
            onPress={() => { setTitleDraft(card?.title ?? ''); setEditingTitle(true); }}
          >
            <Text style={s.title} numberOfLines={1}>{card?.title ?? ''}</Text>
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
            <Text style={s.avatarText}>{collabLabel(card?.ownerId ?? '')[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          {card?.collaborators?.map((uid) => (
            <View key={uid} style={s.avatar}>
              <Text style={s.avatarText}>{collabLabel(uid)[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          ))}
          {isOwner && (
            <TouchableOpacity style={s.avatarAdd} onPress={() => setInviteVisible(true)} activeOpacity={0.7}>
              <Text style={s.avatarAddText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tasks list — centered on web */}
      <View style={isWeb ? { alignSelf: 'center' as any, width: '100%', maxWidth: contentMaxW } : undefined}>
        <KeyboardAvoidingView style={s.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={unchecked}
            keyExtractor={(t) => t.id}
            contentContainerStyle={s.taskList}
            ListHeaderComponent={
              unchecked.length === 0 && checked.length === 0 ? (
                <Text style={s.empty}>No tasks yet. Add one below.</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <TaskRow
                task={item}
                colors={colors}
                collabProfiles={collabProfiles}
                collabOptions={collabOptions}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDeleteTask(item)}
                onAssign={(uid) => handleAssign(item, uid)}
                onAddReminder={(ts) => handleAddReminder(item, ts)}
                onRemoveReminder={(rid) => handleRemoveReminder(item, rid)}
                expandAssign={expandAssign}
                expandReminder={expandReminder}
                reminderDate={reminderDate}
                onToggleAssign={(tid) => setExpandAssign(expandAssign === tid ? null : tid)}
                onToggleReminder={(tid) => {
                  setExpandReminder(expandReminder === tid ? null : tid);
                  setReminderDate(new Date());
                }}
                onReminderDateChange={setReminderDate}
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
                      <Text style={s.checkedLabel}>Checked Items ({checked.length})</Text>
                    </TouchableOpacity>
                    {checkedOpen &&
                      checked.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          checked
                          colors={colors}
                          collabProfiles={collabProfiles}
                          collabOptions={collabOptions}
                          onToggle={() => handleToggle(task)}
                          onDelete={() => handleDeleteTask(task)}
                          onAssign={(uid) => handleAssign(task, uid)}
                          onAddReminder={(ts) => handleAddReminder(task, ts)}
                          onRemoveReminder={(rid) => handleRemoveReminder(task, rid)}
                          expandAssign={expandAssign}
                          expandReminder={expandReminder}
                          reminderDate={reminderDate}
                          onToggleAssign={(tid) => setExpandAssign(expandAssign === tid ? null : tid)}
                          onToggleReminder={(tid) => {
                            setExpandReminder(expandReminder === tid ? null : tid);
                            setReminderDate(new Date());
                          }}
                          onReminderDateChange={setReminderDate}
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
                  <TouchableOpacity style={[s.addBtn, addingTask && { opacity: 0.6 }]} onPress={handleAddTask} disabled={addingTask}>
                    <Text style={s.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </>
            }
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </View>

      {/* Invite Modal (only modal that stays) */}
      <Modal visible={inviteVisible} transparent animationType="fade" onRequestClose={() => setInviteVisible(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <TouchableOpacity style={s.inviteCancelBtn} onPress={() => { setInviteVisible(false); setInviteEmail(''); }}>
                <Text style={s.inviteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.inviteSendBtn, inviting && { opacity: 0.6 }]} onPress={handleInvite} disabled={inviting}>
                <Text style={s.inviteSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
      />
    </View>
  );
}

// ── Task Row ──────────────────────────────────────────────────────

function TaskRow({
  task,
  checked: _checked = false,
  colors,
  collabProfiles,
  collabOptions,
  onToggle,
  onDelete,
  onAssign,
  onAddReminder,
  onRemoveReminder,
  expandAssign,
  expandReminder,
  reminderDate,
  onToggleAssign,
  onToggleReminder,
  onReminderDateChange,
}: {
  task: Task;
  checked?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  collabProfiles: Map<string, { email: string; displayName: string }>;
  collabOptions: { uid: string | null; label: string }[];
  onToggle: () => void;
  onDelete: () => void;
  onAssign: (uid: string | null) => void;
  onAddReminder: (ts: Date) => void;
  onRemoveReminder: (reminderId: string) => void;
  expandAssign: string | null;
  expandReminder: string | null;
  reminderDate: Date;
  onToggleAssign: (taskId: string) => void;
  onToggleReminder: (taskId: string) => void;
  onReminderDateChange: (d: Date) => void;
}) {
  const s = taskStyles(colors);
  const isExpandAssign = expandAssign === task.id;
  const isExpandReminder = expandReminder === task.id;

  const assigneeLabel = task.assignee
    ? `@${task.assignee.split('@')[0]}`
    : 'Unassigned ▾';

  const currentAssigneeOption = collabOptions.find(
    (o) => (o.uid === null && !task.assignee) || (o.uid && collabProfiles.get(o.uid)?.email === task.assignee),
  );

  return (
    <View style={[s.taskRow, task.completed && s.taskRowChecked]}>
      {/* Checkbox */}
      <TouchableOpacity style={[s.checkbox, task.completed && s.checkboxChecked]} onPress={onToggle} activeOpacity={0.6}>
        {task.completed && <Text style={s.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Body */}
      <View style={s.taskBody}>
        <Text style={[s.taskText, task.completed && s.taskTextChecked]} numberOfLines={3}>
          {task.text}
        </Text>

        {/* ── Inline Assignee ── */}
        <TouchableOpacity onPress={() => onToggleAssign(task.id)} activeOpacity={0.6} style={s.assigneeWrap}>
          <Text style={[s.assignee, !task.assignee && s.assigneeEmpty]}>{assigneeLabel}</Text>
        </TouchableOpacity>

        {isExpandAssign && (
          <View style={s.inlineDropdown}>
            {collabOptions.map((opt) => {
              const isSel = (opt.uid === null && !task.assignee) ||
                (opt.uid && collabProfiles.get(opt.uid)?.email === task.assignee);
              return (
                <TouchableOpacity
                  key={opt.uid ?? 'unassigned'}
                  style={[s.dropdownItem, isSel && s.dropdownItemSel]}
                  onPress={() => onAssign(opt.uid)}
                  activeOpacity={0.6}
                >
                  <Text style={[s.dropdownItemText, isSel && s.dropdownItemTextSel]}>{opt.label}</Text>
                  {isSel && <Text style={s.dropdownCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Inline Reminders ── */}
        <View style={s.reminderSection}>
          {task.reminders.map((r) => (
            <View key={r.id} style={s.reminderRow}>
              <Text style={s.reminderIcon}>⏰</Text>
              <Text style={s.reminderText}>
                {r.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}
                {r.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
              <TouchableOpacity onPress={() => onRemoveReminder(r.id)} activeOpacity={0.6}>
                <Text style={s.reminderRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {isExpandReminder ? (
            <View style={s.reminderPickerWrap}>
              <DateTimePicker
                value={reminderDate}
                onChange={onReminderDateChange}
                minimumDate={new Date()}
                mode="datetime"
                colors={colors}
              />
              <View style={s.reminderActions}>
                <TouchableOpacity style={s.reminderCancelBtn} onPress={() => onToggleReminder(task.id)} activeOpacity={0.7}>
                  <Text style={s.reminderCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.reminderSetBtn}
                  onPress={() => onAddReminder(reminderDate)}
                  activeOpacity={0.7}
                >
                  <Text style={s.reminderSetText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.reminderAddBtn} onPress={() => onToggleReminder(task.id)} activeOpacity={0.6}>
              <Text style={s.reminderAddText}>+ Add Reminder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity onPress={onDelete} activeOpacity={0.6}>
        <Text style={s.taskDelete}>DELETE</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const themedStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.headerBg,
      boxShadow: colors.headerShadow,
      gap: 8,
    },
    backArrow: { fontSize: 24, color: colors.primary, paddingRight: 4 },
    titleWrap: { flex: 1 },
    title: { fontSize: 18, fontWeight: '600', color: colors.text },
    titleInput: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.text, borderBottomWidth: 2, borderBottomColor: colors.primary, paddingVertical: 2 },
    deleteBtn: { fontSize: 12, color: colors.danger, fontWeight: '700', letterSpacing: 0.5 },
    collabRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
    collabAvatars: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    avatarAdd: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    avatarAddText: { color: colors.primary, fontSize: 18, fontWeight: '600' },
    body: { flex: 1 },
    taskList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    empty: { fontSize: 14, color: colors.placeholder, fontStyle: 'italic', textAlign: 'center', marginTop: 32 },
    checkedSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    checkedHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
    checkedArrow: { fontSize: 12, color: colors.subtext },
    checkedLabel: { fontSize: 14, fontWeight: '500', color: colors.subtext },
    addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
    addInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg, borderStyle: 'dashed' },
    addBtn: { paddingVertical: 10, paddingHorizontal: 18, backgroundColor: colors.primary, borderRadius: 8 },
    addBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: colors.modalBg, justifyContent: 'center', alignItems: 'center' },
    inviteSheet: { backgroundColor: colors.surface, borderRadius: 14, padding: 24 },
    inviteTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    inviteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text, backgroundColor: colors.inputBg, marginBottom: 16 },
    inviteButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    inviteCancelBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    inviteCancelText: { fontSize: 15, color: colors.subtext },
    inviteSendBtn: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 8 },
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
    checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.checkboxBorder, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
    taskBody: { flex: 1 },
    taskText: { fontSize: 15, color: colors.text, lineHeight: 21 },
    taskTextChecked: { textDecorationLine: 'line-through', color: colors.placeholder },
    // Assignee
    assigneeWrap: { marginTop: 4 },
    assignee: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    assigneeEmpty: { color: colors.placeholder },
    // Inline dropdown
    inlineDropdown: {
      marginTop: 6,
      marginLeft: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, gap: 8 },
    dropdownItemSel: { backgroundColor: colors.primary + '18' },
    dropdownItemText: { flex: 1, fontSize: 13, color: colors.text },
    dropdownItemTextSel: { fontWeight: '600', color: colors.primary },
    dropdownCheck: { fontSize: 14, color: colors.primary, fontWeight: '700' },
    // Reminders
    reminderSection: { marginTop: 6 },
    reminderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, gap: 4, borderRadius: 12, backgroundColor: colors.chipBg, alignSelf: 'flex-start', marginTop: 4 },
    reminderIcon: { fontSize: 12 },
    reminderText: { fontSize: 12, color: colors.subtext, flex: 1 },
    reminderRemove: { fontSize: 12, color: colors.danger, fontWeight: '700', padding: 2 },
    reminderAddBtn: { marginTop: 4 },
    reminderAddText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    reminderPickerWrap: { marginTop: 8 },
    reminderActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
    reminderCancelBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
    reminderCancelText: { fontSize: 13, color: colors.subtext },
    reminderSetBtn: { paddingVertical: 6, paddingHorizontal: 18, backgroundColor: colors.primary, borderRadius: 6 },
    reminderSetText: { fontSize: 13, color: '#fff', fontWeight: '600' },
    taskDelete: { fontSize: 11, color: colors.danger, fontWeight: '600' },
  });
