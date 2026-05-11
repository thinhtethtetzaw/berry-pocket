import { useEffect, useState } from 'react';
import {
  Modal, View, TextInput, Pressable, StyleSheet, ScrollView,
  Platform, KeyboardAvoidingView, Alert, Dimensions,
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { radius, space, v7Text, v7Surface, v7Accent } from '../theme';
import { Icon } from './Icon';
import { Txt } from './Txt';
import { IconPicker, ICON_OPTIONS } from './IconColorPickers';
import type { MainCategoryId, SubCategory } from '../lib/budget';

const SHEET_H = Dimensions.get('window').height - 60;

interface Props {
  visible: boolean;
  parentMain: MainCategoryId | string;
  parentColor?: string;
  editing?: SubCategory | null;
  onClose: () => void;
  onSave: (sub: SubCategory) => void;
  onDelete?: (id: string) => void;
}

export function SubCategoryEditorSheet({
  visible, parentMain, parentColor, editing, onClose, onSave, onDelete,
}: Props) {
  const isEdit = !!editing;
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);

  useEffect(() => {
    if (visible) {
      setLabel(editing?.label ?? '');
      setIcon(editing?.icon ?? ICON_OPTIONS[0]);
    }
  }, [visible, editing]);

  function submit() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = editing?.id ?? `cs_${Date.now()}`;
    onSave({ id, label: trimmed, icon, main: parentMain as MainCategoryId });
    onClose();
  }

  function confirmDelete() {
    if (!editing || !onDelete) return;
    Alert.alert('Delete sub-category?', 'Transactions tagged here will keep their tag but lose the sub-label.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { onDelete(editing.id); onClose(); } },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={S.sheet}>
          <Pressable onPress={onClose} style={S.handleArea} hitSlop={8}>
            <View style={S.handleIndicator} />
          </Pressable>

          <View style={S.header}>
            <Txt variant="headingSm" color={v7Text.primary}>
              {isEdit ? 'Edit sub-category' : 'New sub-category'}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isEdit && onDelete && (
                <Pressable onPress={confirmDelete} hitSlop={10} style={[S.iconBtn, { backgroundColor: v7Accent.dangerSoft }]}>
                  <Trash2 size={14} color={v7Accent.danger} strokeWidth={2} />
                </Pressable>
              )}
              <Pressable onPress={onClose} hitSlop={10} style={S.iconBtn}>
                <X size={14} color={v7Text.primary} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.content}
              keyboardShouldPersistTaps="handled"
            >
              <View style={S.previewWrap}>
                <View style={S.previewCard}>
                  <View style={[S.previewIcon, { backgroundColor: '#F5F6FA' }]}>
                    <Icon name={icon} size={18} color={parentColor ?? v7Text.primary} strokeWidth={2.2} />
                  </View>
                  <Txt variant="bodyMdBold" color={v7Text.primary}>{label || 'Sub-category'}</Txt>
                </View>
              </View>

              <FieldLabel label="Name" />
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Coffee"
                placeholderTextColor={v7Text.tertiary}
                style={S.input}
                maxLength={30}
              />

              <FieldLabel label="Icon" />
              <IconPicker value={icon} onChange={setIcon} accent={parentColor} />

              <View style={S.actions}>
                <Pressable onPress={onClose} style={({ pressed }) => [S.btn, S.btnCancel, { opacity: pressed ? 0.6 : 1 }]}>
                  <Txt variant="buttonMd" color={v7Text.secondary}>Cancel</Txt>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={!label.trim()}
                  style={({ pressed }) => [
                    S.btn, S.btnPrimary,
                    { backgroundColor: !label.trim() ? '#D8DCE5' : v7Text.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Txt variant="buttonMd" color="#FFFFFF">{isEdit ? 'Save' : 'Create'}</Txt>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Txt variant="microBold" color={v7Text.tertiary} style={FL.label}>{label.toUpperCase()}</Txt>;
}

const FL = StyleSheet.create({
  label: { letterSpacing: 1.2, marginTop: 18, marginBottom: 10 },
});

const S = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    height: SHEET_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: space.md,
  },
  handleArea: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  handleIndicator: { backgroundColor: '#9AA1AE', width: 48, height: 5, borderRadius: 3 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: radius.full,
    backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  previewWrap: { alignItems: 'center', paddingVertical: 6 },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    backgroundColor: v7Surface.plainCard, minWidth: 220,
  },
  previewIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1, borderColor: v7Surface.hairline, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'DMSans_400Regular',
    color: v7Text.primary, backgroundColor: '#FFFFFF',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 28 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { borderWidth: 1, borderColor: v7Surface.hairline, backgroundColor: '#FFFFFF' },
  btnPrimary: { flex: 2 },
});
