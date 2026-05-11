import { useEffect, useState } from 'react';
import {
  Modal, View, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space } from '../theme';
import { NumberInput } from './NumberInput';
import { Txt } from './Txt';

interface Props {
  visible: boolean;
  title: string;
  hint?: string;
  initialValue: number;
  /** Optional accent color for the primary button. Defaults to ink. */
  accent?: string;
  onClose: () => void;
  onSave: (n: number) => void;
}

/**
 * Compact bottom sheet for editing a single number — used by the Total
 * Amount and Necessary Fund "edit" actions on the Statistics tab.
 */
export function EditAmountSheet({
  visible, title, hint, initialValue, accent, onClose, onSave,
}: Props) {
  const { theme } = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const accentColor = accent ?? theme.ink;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={[S.sheet, { borderColor: theme.border }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={S.header}>
              <Txt variant="headingSm" color={theme.ink}>{title}</Txt>
              <Pressable onPress={onClose} hitSlop={10} style={[S.iconBtn, { backgroundColor: theme.bgSubtle }]}>
                <X size={14} color={theme.ink} strokeWidth={2} />
              </Pressable>
            </View>

            {hint ? (
              <Txt variant="caption" color={theme.muted} style={{ marginBottom: space.md }}>
                {hint}
              </Txt>
            ) : null}

            <View style={[S.amountRow, { borderColor: theme.border }]}>
              <Txt variant="headingMd" color={theme.muted}>฿</Txt>
              <NumberInput
                value={value}
                onCommit={setValue}
                min={0}
                selectTextOnFocus
                autoFocus
                style={[S.amountInput, { color: theme.ink }]}
              />
            </View>

            <View style={S.actions}>
              <Pressable onPress={onClose} style={[S.btn, S.btnCancel, { borderColor: theme.border }]}>
                <Txt variant="buttonMd" color={theme.steel}>Cancel</Txt>
              </Pressable>
              <Pressable
                onPress={() => { onSave(value); onClose(); }}
                style={[S.btn, S.btnPrimary, { backgroundColor: accentColor }]}
              >
                <Txt variant="buttonMd" color="#FFFFFF">Save</Txt>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxxl,
    padding: space.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  iconBtn: {
    width: 30, height: 30,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    marginBottom: space.lg,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
    padding: 0,
  },
  actions: { flexDirection: 'row', gap: space.sm },
  btn: {
    flex: 1, height: 46,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancel: { borderWidth: 1 },
  btnPrimary: { flex: 2 },
});
