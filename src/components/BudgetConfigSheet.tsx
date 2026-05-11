import { useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space, v7Accent } from '../theme';
import { fmt } from '../lib/format';
import { NumberInput } from './NumberInput';
import { Txt } from './Txt';

interface Budget { income: number; savings: number; necessary: number; living: number; }

interface Props {
  visible: boolean;
  budget: Budget;
  fixedTotal: number;
  onClose: () => void;
  onSave: (b: Budget) => void;
}

export function BudgetConfigSheet({ visible, budget, fixedTotal, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState<Budget>(budget);

  useEffect(() => { if (visible) setDraft(budget); }, [visible, budget]);

  const allocated = draft.savings + draft.necessary + draft.living + fixedTotal;
  const remaining = draft.income - allocated;
  const isOver = remaining < 0;

  function update<K extends keyof Budget>(k: K, v: number) {
    setDraft(prev => ({ ...prev, [k]: v }));
  }

  function autoBalance() {
    const living = Math.max(0, draft.income - draft.savings - draft.necessary - fixedTotal);
    setDraft({ ...draft, living });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={[S.sheet, { borderColor: theme.border }]}>
            <View style={[S.handle, { backgroundColor: theme.border }]} />

            <View style={S.header}>
              <Txt variant="headingSm" color={theme.ink}>Monthly Allocation</Txt>
              <Pressable onPress={onClose} hitSlop={10} style={[S.iconBtn, { backgroundColor: theme.bgSubtle }]}>
                <X size={14} color={theme.ink} strokeWidth={2} />
              </Pressable>
            </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Balance summary */}
              <View style={[S.summary, { backgroundColor: isOver ? v7Accent.danger + '10' : theme.bgSubtle, borderColor: isOver ? v7Accent.danger + '40' : theme.border }]}>
                <View style={S.sumRow}>
                  <Txt variant="bodySmMed" color={theme.steel}>Unallocated</Txt>
                  <Txt variant="bodyMdBold" color={isOver ? v7Accent.danger : palette.successText}>
                    {isOver ? '−' : '+'}{fmt(Math.abs(remaining))}
                  </Txt>
                </View>
                {!isOver && remaining !== 0 && (
                  <Pressable onPress={autoBalance} style={[S.autoBtn, { borderColor: theme.border }]}>
                    <Txt variant="micro" color={theme.steel}>Auto-balance to Living →</Txt>
                  </Pressable>
                )}
              </View>

              <Field label="Income" value={draft.income} onChange={v => update('income', v)} theme={theme} />
              <Field label="Savings" value={draft.savings} onChange={v => update('savings', v)} theme={theme} />
              <Field label="Necessary" value={draft.necessary} onChange={v => update('necessary', v)} theme={theme} />
              <Field label="Living" value={draft.living} onChange={v => update('living', v)} theme={theme} />

              <Txt variant="micro" color={theme.muted} style={S.fixedNote}>
                Fixed expenses ({fmt(fixedTotal)}) are managed separately
              </Txt>

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

function Field({ label, value, onChange, theme }: { label: string; value: number; onChange: (v: number) => void; theme: any }) {
  return (
    <View style={S.field}>
      <Txt variant="microBold" color={theme.steel} style={S.fieldLabel}>{label.toUpperCase()}</Txt>
      <View style={[S.inputRow, { borderColor: theme.border }]}>
        <Txt variant="bodyMdBold" color={theme.muted}>฿</Txt>
        <NumberInput
          value={value}
          onCommit={onChange}
          min={0}
          selectTextOnFocus
          style={[S.fieldInput, { color: theme.ink }]}
        />
      </View>
    </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  iconBtn: { width: 30, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  summary: {
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    marginBottom: space.lg,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  autoBtn: {
    marginTop: space.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1,
  },
  field: { marginBottom: space.md },
  fieldLabel: { letterSpacing: 1.2, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.3,
    padding: 0,
  },
  fixedNote: { marginTop: space.sm, marginBottom: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  btn: { flex: 1, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { borderWidth: 1 },
  btnPrimary: { flex: 2 },
});
