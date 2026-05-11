import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, TextInput, Pressable, StyleSheet,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { X, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radius, space, v7Text, v7Surface, v7Accent } from '../theme';
import { NumberInput } from './NumberInput';
import { Txt } from './Txt';
import { todayISO, getFmtCurrency, fmt } from '../lib/format';

interface Props {
  visible: boolean;
  fundBalance: number;
  onClose: () => void;
  onSave: (w: { amount: number; description: string; date: string }) => void;
}

/**
 * Records a withdrawal from the Necessary Fund. Uses @gorhom/bottom-sheet
 * for the drawer. Toned-down palette — neutral plain card surfaces with
 * purple reserved for the primary action button only.
 */
export function UseNecessaryFundSheet({ visible, fundBalance, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['65%', '92%'], []);
  const [amount, setAmount] = useState(0);
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (visible) {
      setAmount(0);
      setDesc('');
      setDate(todayISO());
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const overdraw = amount > fundBalance;
  const currency = getFmtCurrency();

  function submit() {
    if (amount <= 0) return;
    onSave({ amount, description: desc.trim(), date });
    onClose();
  }

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.35}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      index={1}
      enablePanDownToClose
      keyboardBehavior="interactive"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={S.handleIndicator}
      backgroundStyle={S.sheetBg}
      onDismiss={onClose}
    >
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
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.content}
        >
          {/* Available balance — neutral plain card, single subtle accent dot */}
          <View style={S.balanceCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <View style={[S.accentDot, { backgroundColor: v7Accent.fund }]} />
              <Txt variant="microBold" color={v7Text.tertiary} style={S.eyebrow}>
                AVAILABLE
              </Txt>
            </View>
            <Txt variant="headingMd" color={v7Text.primary}>
              {fmt(fundBalance)}
            </Txt>
          </View>

          {/* Amount input — neutral background */}
          <View style={S.amountRow}>
            <Txt variant="headingMd" color={v7Text.tertiary} style={S.amountSymbol}>
              {currency}
            </Txt>
            <NumberInput
              value={amount}
              onCommit={setAmount}
              min={0}
              selectTextOnFocus
              autoFocus
              placeholder="0"
              style={[S.amountInput, { color: v7Text.primary }]}
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
            style={[S.input, { color: v7Text.primary }]}
          />

          <FieldLabel label="Date" />
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={v7Text.tertiary}
            style={[S.input, { color: v7Text.primary }]}
          />

          <View style={S.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                S.btn, S.btnCancel,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Txt variant="buttonMd" color={v7Text.secondary}>Cancel</Txt>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={amount <= 0}
              style={({ pressed }) => [
                S.btn, S.btnPrimary,
                {
                  backgroundColor: amount <= 0 ? '#D8DCE5' : v7Accent.fund,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Txt variant="buttonMd" color="#FFFFFF">Use Fund</Txt>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Txt variant="microBold" color={v7Text.tertiary} style={FL.label}>
      {label.toUpperCase()}
    </Txt>
  );
}

const FL = StyleSheet.create({
  label: { letterSpacing: 1.2, marginTop: space.lg, marginBottom: space.sm },
});

const S = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: '#D8DCE5',
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 30, height: 30,
    borderRadius: radius.full,
    backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Plain neutral card for available balance
  balanceCard: {
    borderRadius: 14,
    backgroundColor: v7Surface.plainCard,
    padding: 14,
    marginBottom: 12,
  },
  accentDot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.4 },
  // Neutral amount input
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 28,
    borderRadius: 14,
    backgroundColor: v7Surface.plainCard,
    marginBottom: 6,
  },
  amountSymbol: {
    fontWeight: '500' as const,
    opacity: 0.65,
  },
  amountInput: {
    fontSize: 44,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -1.5,
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  warnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: v7Surface.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    backgroundColor: '#FFFFFF',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
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
