import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { CARD_ACCENT_COLORS, CARD_ACCENT_COLORS_DARK } from '../theme/colors';
import type { Card } from '../types';

interface Props {
  card: Card;
  taskCount?: number;
  completedCount?: number;
  uncheckedTasks?: string[];
  reminderCount?: number;
  currentUserId?: string;
  cardWidth: number;
  onPress: () => void;
  onTogglePin?: (cardId: string) => void;
  onChangeColor?: (cardId: string, color: string | null) => void;
  onDeleteCard?: (cardId: string) => void;
}

export default function CardPreview({
  card,
  taskCount = 0,
  completedCount = 0,
  uncheckedTasks = [],
  reminderCount = 0,
  currentUserId,
  cardWidth,
  onPress,
  onTogglePin,
  onChangeColor,
  onDeleteCard,
}: Props) {
  const { colors, mode } = useTheme();
  const isShared = currentUserId && card.ownerId !== currentUserId;
  const [menuVisible, setMenuVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [cardLayout, setCardLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const s = themedStyles(colors, cardWidth);

  const accentColors = mode === 'dark' ? CARD_ACCENT_COLORS_DARK : CARD_ACCENT_COLORS;
  const cardBg = card.color || colors.surface;

  const previewTasks = uncheckedTasks.slice(0, 3);
  const overflow = Math.max(0, uncheckedTasks.length - 3);

  return (
    <View
      style={[s.cardWrapper, { width: cardWidth }]}
      onLayout={(e) => setCardLayout(e.nativeEvent.layout)}
    >
      <TouchableOpacity
        style={[s.card, { backgroundColor: cardBg }, isShared && s.cardShared]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Title row + ellipsis */}
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={2}>
            {card.title}
          </Text>
          <View style={s.titleActions}>
            {card.pinned && <Text style={s.pin}>📌</Text>}
            <TouchableOpacity
              style={s.ellipsisBtn}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.6}
            >
              <Text style={s.ellipsis}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isShared && <Text style={s.sharedLabel}>↗ Shared with you</Text>}

        {/* Task preview — actual uncompleted task names */}
        {uncheckedTasks.length > 0 && (
          <View style={s.previewSection}>
            {previewTasks.map((text, i) => (
              <View key={i} style={s.previewRow}>
                <View style={s.miniCheckbox} />
                <Text style={s.previewText} numberOfLines={1}>
                  {text}
                </Text>
              </View>
            ))}
            {overflow > 0 && (
              <Text style={s.moreItems}>+{overflow} more</Text>
            )}
          </View>
        )}

        {taskCount === 0 && (
          <Text style={s.empty}>No tasks yet</Text>
        )}

        {/* Bottom row — collab avatars · progress */}
        <View style={s.bottomRow}>
          <View style={s.collabAvatars}>
            {card.collaborators.length > 0 && (
              <Text style={s.badge}>👥 {card.collaborators.length}</Text>
            )}
            {reminderCount > 0 && (
              <Text style={[s.badge, s.reminderBadge]}>⏰ {reminderCount}</Text>
            )}
          </View>
          {taskCount > 0 && (
            <Text style={s.progress}>{completedCount}/{taskCount}</Text>
          )}
        </View>

        {/* Footer control strip */}
        <View style={s.footer}>
          <TouchableOpacity
            style={s.footerBtn}
            onPress={() => onTogglePin?.(card.id)}
            activeOpacity={0.6}
          >
            <Text style={s.footerBtnIcon}>{card.pinned ? '📌' : '📍'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.footerBtn}
            onPress={() => setColorPickerVisible(true)}
            activeOpacity={0.6}
          >
            <View style={[s.colorDot, { backgroundColor: card.color || colors.border }]} />
          </TouchableOpacity>

          <View style={s.footerSpacer} />

          <TouchableOpacity
            style={s.footerBtn}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.6}
          >
            <Text style={s.footerBtnIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Ellipsis dropdown — positioned relative to card */}
      {menuVisible && (
        <>
          <TouchableOpacity
            style={s.menuScrim}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={[s.menuDropdown, { top: 4, right: 4 }]}>
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onTogglePin?.(card.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={s.menuItemIcon}>{card.pinned ? '📍' : '📌'}</Text>
              <Text style={s.menuItemText}>{card.pinned ? 'Unpin' : 'Pin to top'}</Text>
            </TouchableOpacity>
            <View style={s.menuDivider} />
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onDeleteCard?.(card.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={s.menuItemIcon}>🗑</Text>
              <Text style={[s.menuItemText, s.menuItemDestructive]}>Delete Card</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Color picker overlay — centered modal */}
      <Modal
        visible={colorPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <TouchableOpacity
          style={s.colorOverlay}
          activeOpacity={1}
          onPress={() => setColorPickerVisible(false)}
        >
          <View style={[s.colorSheet, { width: Math.min(cardWidth + 40, 320) }]}>
            <Text style={s.colorTitle}>Card Color</Text>
            <View style={s.colorGrid}>
              {accentColors.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.colorSwatch,
                    { backgroundColor: c || colors.surface },
                    c === null && s.colorSwatchDefault,
                    card.color === c && s.colorSwatchSelected,
                  ]}
                  onPress={() => {
                    onChangeColor?.(card.id, c);
                    setColorPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                />
              ))}
            </View>
            <TouchableOpacity
              style={s.colorCancelBtn}
              onPress={() => setColorPickerVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={s.colorCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors'], cardWidth: number) =>
  StyleSheet.create({
    cardWrapper: {
      position: 'relative',
    },
    card: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    cardShared: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    titleActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 6,
    },
    pin: { fontSize: 12 },
    ellipsisBtn: {
      padding: 2,
    },
    ellipsis: {
      fontSize: 18,
      color: colors.subtext,
      fontWeight: '700',
    },
    sharedLabel: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 6,
    },
    previewSection: {
      marginBottom: 8,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
      gap: 6,
    },
    miniCheckbox: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: colors.checkboxBorder,
    },
    previewText: {
      flex: 1,
      fontSize: 12,
      color: colors.subtext,
    },
    moreItems: {
      fontSize: 11,
      color: colors.placeholder,
      marginTop: 2,
      marginLeft: 20,
    },
    empty: {
      fontSize: 12,
      color: colors.placeholder,
      fontStyle: 'italic',
      marginBottom: 6,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 6,
    },
    collabAvatars: {
      flexDirection: 'row',
      gap: 6,
    },
    badge: {
      fontSize: 11,
      color: colors.subtext,
    },
    reminderBadge: {
      color: colors.warning,
      fontWeight: '600',
    },
    progress: {
      fontSize: 11,
      color: colors.placeholder,
      fontWeight: '500',
    },
    // ── Footer strip ──
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
      marginTop: 4,
    },
    footerBtn: {
      padding: 4,
    },
    footerBtnIcon: {
      fontSize: 14,
    },
    footerSpacer: {
      flex: 1,
    },
    colorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
    },
    // ── Menu (absolute within cardWrapper) ──
    menuScrim: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
    },
    menuDropdown: {
      position: 'absolute',
      zIndex: 20,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 160,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 8,
    },
    menuItemIcon: {
      fontSize: 14,
    },
    menuItemText: {
      fontSize: 14,
      color: colors.text,
    },
    menuItemDestructive: {
      color: colors.danger,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    // ── Color picker overlay ──
    colorOverlay: {
      flex: 1,
      backgroundColor: colors.modalBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorSheet: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    colorTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 14,
      textAlign: 'center',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
      marginBottom: 16,
    },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorSwatchDefault: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    colorSwatchSelected: {
      borderColor: colors.primary,
      borderWidth: 3,
    },
    colorCancelBtn: {
      paddingVertical: 8,
      alignItems: 'center',
    },
    colorCancelText: {
      fontSize: 14,
      color: colors.subtext,
    },
  });
