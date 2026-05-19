import { useEffect, useRef, useState } from 'react';
import {
  Modal, View, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radius, space, v7Text, v7Surface } from '../theme';
import { Txt } from './Txt';
import { getFmtCurrency } from '../lib/format';

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
 * Compact bottom-centered sheet for editing a single number.
 * Uses a plain TextInput so the latest typed value is always available
 * when the user taps Save (the previous NumberInput-with-onCommit-on-blur
 * pattern lost the keystrokes when Save was tapped without blurring first).
 */
export function EditAmountSheet({
  visible, title, hint, initialValue, accent, onClose, onSave,
}: Props) {
  const { theme } = useTheme();
  const [str, setStr] = useState(String(initialValue));
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setStr(String(initialValue));
      // Focus shortly after the modal animation so the keyboard appears.
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [visible, initialValue]);

  const accentColor = accent ?? v7Text.primary;
  const currency = getFmtCurrency();

  function handleSave() {
    const n = parseInt(str.replace(/[^0-9]/g, ''), 10);
    onSave(isNaN(n) ? 0 : n);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={S.kavWrap}
        >
          <Pressable onPress={() => {}} style={S.sheet}>
            <View style={S.header}>
              <Txt variant="bodyMdBold" color={v7Text.primary}>{title}</Txt>
              <Pressable onPress={onClose} hitSlop={10} style={S.iconBtn}>
                <X size={14} color={v7Text.primary} strokeWidth={2} />
              </Pressable>
            </View>

            {hint ? (
              <Txt variant="caption" color={v7Text.tertiary} style={{ marginBottom: space.md }}>
                {hint}
              </Txt>
            ) : null}

            <View style={S.amountRow}>
              <Txt variant="headingSm" color={v7Text.tertiary} style={S.symbol}>{currency}</Txt>
              <TextInput
                ref={inputRef}
                value={str}
                onChangeText={(t) => setStr(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={v7Text.tertiary}
                style={[S.amountInput, { color: v7Text.primary }]}
              />
            </View>

            <View style={S.actions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [S.btn, S.btnCancel, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Txt variant="buttonMd" color={v7Text.secondary}>Cancel</Txt>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  S.btn, S.btnPrimary,
                  { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Txt variant="buttonMd" color="#FFFFFF">Save</Txt>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
  kavWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
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
    backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: v7Surface.hairline,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: space.lg,
    backgroundColor: v7Surface.plainCard,
  },
  symbol: { fontWeight: '500' as const, opacity: 0.65 },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
    padding: 0,
  },
  actions: { flexDirection: 'row', gap: space.sm },
  btn: {
    flex: 1, height: 46,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: v7Surface.hairline,
    backgroundColor: '#FFFFFF',
  },
  btnPrimary: { flex: 2 },
});
