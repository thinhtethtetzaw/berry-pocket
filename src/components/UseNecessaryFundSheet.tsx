import { useEffect, useState } from 'react';
import {
  Modal, View, TextInput, Pressable, StyleSheet, ScrollView,
  Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';
import { radius, space, v7Text, v7Surface, v7Accent } from '../theme';
import { Txt } from './Txt';
import { todayISO, getFmtCurrency, fmt } from '../lib/format';

const SHEET_H = Dimensions.get('window').height - 60;
// Light purple tint for the fund amount input
const FUND_TINT_BG = '#F1E8FF';
const FUND_TINT_BORDER = '#DCC9FF';

interface Props {
  visible: boolean;
  fundBalance: number;
  onClose: () => void;
  onSave: (w: { amount: number; description: string; date: string }) => void;
}

export function UseNecessaryFundSheet({ visible, fundBalance, onClose, onSave }: Props) {
  const [amountStr, setAmountStr] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (visible) {
      setAmountStr('');
      setDesc('');
      setDate(todayISO());
    }
  }, [visible]);

  const amount = parseInt(amountStr, 10) || 0;
  const overdraw = amount > fundBalance;
  const currency = getFmtCurrency();

  function submit() {
    if (amount <= 0) return;
    onSave({ amount, description: desc.trim(), date });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={S.sheet}>
          <Pressable onPress={onClose} style={S.handleArea} hitSlop={8}>
            <View style={S.handleIndicator} />
          </Pressable>

          <View style={S.header}>
            <Txt variant="headingSm" color={v7Text.primary}>Use Necessary Fund</Txt>
            <Pressable onPress={onClose} hitSlop={10} style={S.iconBtn}>
              <X size={14} color={v7Text.primary} strokeWidth={2} />
            </Pressable>
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
              <View style={S.balanceCard}>
                <Txt variant="microBold" color={v7Text.tertiary} style={[S.eyebrow, { marginBottom: 4 }]}>
                  AVAILABLE
                </Txt>
                <Txt variant="headingMd" color={v7Text.primary}>{fmt(fundBalance)}</Txt>
              </View>

              {/* Amount — light purple */}
              <View style={[S.amountRow, { backgroundColor: FUND_TINT_BG, borderColor: FUND_TINT_BORDER }]}>
                <Txt variant="headingMd" color={v7Accent.fund} style={S.amountSymbol}>{currency}</Txt>
                <TextInput
                  value={amountStr}
                  onChangeText={(t) => setAmountStr(t.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={v7Accent.fund + '55'}
                  keyboardType="number-pad"
                  style={[S.amountInput, { color: v7Accent.fund }]}
                />
              </View>

              {overdraw && (
                <View style={S.warnRow}>
                  <AlertTriangle size={13} color={v7Accent.danger} strokeWidth={2} />
                  <Txt variant="caption" color={v7Accent.danger}>
                    Amount exceeds your available fund
                  </Txt>
                </View>
              )}

              <FieldLabel label="Description" />
              <TextInput
                value={desc}
                onChangeText={setDesc}
                placeholder="e.g. Hospital, urgent repair"
                placeholderTextColor={v7Text.tertiary}
                style={S.input}
              />

              <FieldLabel label="Date" />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={v7Text.tertiary}
                style={S.input}
              />

              <View style={S.actions}>
                <Pressable onPress={onClose} style={({ pressed }) => [S.btn, S.btnCancel, { opacity: pressed ? 0.6 : 1 }]}>
                  <Txt variant="buttonMd" color={v7Text.secondary}>Cancel</Txt>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={amount <= 0}
                  style={({ pressed }) => [
                    S.btn, S.btnPrimary,
                    { backgroundColor: amount <= 0 ? '#D8DCE5' : v7Accent.fund, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Txt variant="buttonMd" color="#FFFFFF">Use Fund</Txt>
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
  label: { letterSpacing: 1.2, marginTop: 16, marginBottom: 8 },
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
  balanceCard: {
    borderRadius: 14,
    backgroundColor: v7Surface.plainCard,
    padding: 14,
    marginBottom: 12,
  },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.4 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 28,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  amountSymbol: { fontWeight: '500' as const, opacity: 0.65 },
  amountInput: {
    fontSize: 44,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -1.5,
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: v7Surface.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    backgroundColor: '#FFFFFF',
    color: v7Text.primary,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { borderWidth: 1, borderColor: v7Surface.hairline, backgroundColor: '#FFFFFF' },
  btnPrimary: { flex: 2 },
});
