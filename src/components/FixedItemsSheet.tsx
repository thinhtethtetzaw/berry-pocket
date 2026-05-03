import { useEffect, useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { NumberInput } from './NumberInput';
import { X, Plus, Trash2, Check } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space } from '../theme';
import { fmt } from '../lib/format';
import type { FixedItem } from '../lib/budget';
import { Icon } from './Icon';
import { Txt } from './Txt';

const ICON_OPTIONS = [
  'Home', 'Sparkles', 'Plug', 'Heart', 'Users',
  'Wifi', 'Car', 'Phone', 'CreditCard', 'GraduationCap',
  'Dumbbell', 'Music', 'Tv', 'Book', 'Briefcase',
];

interface Props {
  visible: boolean;
  items: FixedItem[];
  onClose: () => void;
  onSave: (items: FixedItem[]) => void;
}

export function FixedItemsSheet({ visible, items, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState<FixedItem[]>(items);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { if (visible) { setDraft(items); setEditingId(null); } }, [visible, items]);

  const total = draft.reduce((s, i) => s + i.amount, 0);

  function addItem() {
    const id = 'item_' + Date.now();
    setDraft([...draft, { id, label: 'New Item', icon: 'Home', amount: 0 }]);
    setEditingId(id);
  }

  function update(id: string, patch: Partial<FixedItem>) {
    setDraft(draft.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }

  function remove(id: string) {
    Alert.alert('Delete item?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setDraft(draft.filter(i => i.id !== id)) },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={[S.sheet, { borderColor: theme.border }]}>
            <View style={[S.handle, { backgroundColor: theme.border }]} />

            <View style={S.header}>
              <View>
                <Txt variant="headingSm" color={theme.ink}>Fixed Expenses</Txt>
                <Txt variant="micro" color={theme.muted}>{fmt(total)} / mo</Txt>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={[S.iconBtn, { backgroundColor: theme.bgSubtle }]}>
                <X size={14} color={theme.ink} strokeWidth={2} />
              </Pressable>
            </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {draft.length === 0 ? (
                <Txt variant="bodySmMed" color={theme.muted} style={S.empty}>No fixed expenses yet</Txt>
              ) : (
                <View style={{ gap: 1 }}>
                  {draft.map(item => {
                    const isEditing = editingId === item.id;
                    return (
                      <View key={item.id} style={[S.itemWrap, { borderColor: theme.border }, isEditing && { borderColor: theme.ink }]}>
                        {isEditing ? (
                          /* Edit mode */
                          <View style={S.editBody}>
                            <View style={S.editTopRow}>
                              <View style={[S.iconPreview, { backgroundColor: theme.bgSubtle }]}>
                                <Icon name={item.icon} size={16} color={theme.ink} strokeWidth={2} />
                              </View>
                              <TextInput
                                value={item.label}
                                onChangeText={s => update(item.id, { label: s })}
                                style={[S.nameInput, { color: theme.ink, borderColor: theme.border }]}
                                placeholder="Item name"
                                placeholderTextColor={theme.muted}
                              />
                            </View>

                            <Txt variant="microBold" color={theme.steel} style={S.editLabel}>AMOUNT</Txt>
                            <View style={[S.amtRow, { borderColor: theme.border }]}>
                              <Txt variant="bodyMdBold" color={theme.muted}>฿</Txt>
                              <NumberInput
                                value={item.amount}
                                onCommit={n => update(item.id, { amount: n })}
                                min={0}
                                selectTextOnFocus
                                style={[S.amtInput, { color: theme.ink }]}
                              />
                            </View>

                            <Txt variant="microBold" color={theme.steel} style={S.editLabel}>ICON</Txt>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.iconRow}>
                              {ICON_OPTIONS.map(name => {
                                const active = item.icon === name;
                                return (
                                  <Pressable
                                    key={name}
                                    onPress={() => update(item.id, { icon: name })}
                                    style={[S.iconOpt, { backgroundColor: active ? theme.ink : theme.bgSubtle, borderColor: active ? theme.ink : theme.border }]}
                                  >
                                    <Icon name={name} size={15} color={active ? '#FFFFFF' : theme.steel} strokeWidth={2} />
                                  </Pressable>
                                );
                              })}
                            </ScrollView>

                            <View style={S.editActions}>
                              <Pressable onPress={() => remove(item.id)} style={[S.editBtn, { borderColor: palette.brandCoral + '40', backgroundColor: palette.brandCoral + '08' }]}>
                                <Trash2 size={13} color={palette.brandCoral} strokeWidth={2} />
                                <Txt variant="caption" color={palette.brandCoral}>Delete</Txt>
                              </Pressable>
                              <Pressable onPress={() => setEditingId(null)} style={[S.editBtn, S.editBtnPrimary, { backgroundColor: theme.ink }]}>
                                <Check size={13} color="#FFFFFF" strokeWidth={2.5} />
                                <Txt variant="caption" color="#FFFFFF">Done</Txt>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          /* View mode */
                          <Pressable onPress={() => setEditingId(item.id)} style={S.viewRow}>
                            <View style={[S.iconCircle, { backgroundColor: theme.bgSubtle }]}>
                              <Icon name={item.icon} size={14} color={theme.ink} strokeWidth={2} />
                            </View>
                            <Txt variant="bodySmMed" color={theme.ink} style={{ flex: 1 }}>{item.label}</Txt>
                            <Txt variant="bodySmMed" color={theme.ink}>{fmt(item.amount, { compact: true })}</Txt>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              <Pressable onPress={addItem} style={[S.addBtn, { borderColor: theme.border }]}>
                <Plus size={14} color={theme.steel} strokeWidth={2} />
                <Txt variant="bodySmMed" color={theme.steel}>Add Item</Txt>
              </Pressable>

              <View style={S.actions}>
                <Pressable onPress={onClose} style={[S.btn, S.btnCancel, { borderColor: theme.border }]}>
                  <Txt variant="buttonMd" color={theme.steel}>Cancel</Txt>
                </Pressable>
                <Pressable onPress={() => { onSave(draft); onClose(); }} style={[S.btn, S.btnPrimary, { backgroundColor: theme.ink }]}>
                  <Txt variant="buttonMd" color="#FFFFFF">Save</Txt>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>

      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderTopWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.lg },
  iconBtn: { width: 30, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', paddingVertical: space.xxl },
  itemWrap: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: space.sm,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.sm,
  },
  iconCircle: {
    width: 30, height: 30,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  editBody: { padding: space.md },
  editTopRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  iconPreview: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  editLabel: { letterSpacing: 1.2, marginBottom: 6, marginTop: space.sm },
  amtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    paddingVertical: 8,
  },
  amtInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    padding: 0,
    letterSpacing: -0.3,
  },
  iconRow: { gap: 6, paddingVertical: 2 },
  iconOpt: {
    width: 38, height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  editActions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  editBtnPrimary: { flex: 2, borderWidth: 0 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  actions: { flexDirection: 'row', gap: space.sm },
  btn: { flex: 1, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { borderWidth: 1 },
  btnPrimary: { flex: 2 },
});
