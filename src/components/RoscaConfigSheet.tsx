import { useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space } from '../theme';
import type { RoscaConfig } from '../lib/budget';
import { fmt, MONTHS_SHORT } from '../lib/format';
import { NumberInput } from './NumberInput';
import { Txt } from './Txt';

interface Props {
  visible: boolean;
  cfg: RoscaConfig;
  onClose: () => void;
  onSave: (cfg: RoscaConfig) => void;
}

export function RoscaConfigSheet({ visible, cfg, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState<RoscaConfig>(cfg);

  useEffect(() => { if (visible) setDraft(cfg); }, [visible, cfg]);

  const total = draft.monthlyPayment * draft.groupSize;
  const payoutMonthIndex = draft.startMonth + (draft.myPosition - 1);
  const payoutYear = draft.startYear + Math.floor(payoutMonthIndex / 12);
  const payoutMonth = payoutMonthIndex % 12;

  function update<K extends keyof RoscaConfig>(k: K, v: RoscaConfig[K]) {
    setDraft(prev => ({ ...prev, [k]: v }));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={[S.sheet, { borderColor: theme.border }]}>
            <View style={[S.handle, { backgroundColor: theme.border }]} />

            <View style={S.header}>
              <Txt variant="headingSm" color={theme.ink}>Configure ROSCA</Txt>
              <Pressable onPress={onClose} hitSlop={10} style={[S.iconBtn, { backgroundColor: theme.bgSubtle }]}>
                <X size={14} color={theme.ink} strokeWidth={2} />
              </Pressable>
            </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Summary */}
              <View style={[S.summary, { backgroundColor: palette.successText + '10', borderColor: palette.successText + '30' }]}>
                <View style={S.sumRow}>
                  <Txt variant="micro" color={theme.steel}>You'll receive</Txt>
                  <Txt variant="bodyMdBold" color={palette.successText}>{fmt(total)}</Txt>
                </View>
                <View style={S.sumRow}>
                  <Txt variant="micro" color={theme.steel}>Payout month</Txt>
                  <Txt variant="bodySmMed" color={theme.ink}>{MONTHS_SHORT[payoutMonth]} {payoutYear}</Txt>
                </View>
              </View>

              <NumberField label="Monthly Payment (฿)" value={draft.monthlyPayment} onCommit={v => update('monthlyPayment', v)} min={0} theme={theme} />

              <View style={S.row}>
                <View style={{ flex: 1 }}>
                  <NumberField label="Group Size" value={draft.groupSize} onCommit={v => { update('groupSize', v); if (draft.myPosition > v) update('myPosition', v); }} min={1} theme={theme} />
                </View>
                <View style={{ flex: 1 }}>
                  <NumberField label={`Position (1–${draft.groupSize})`} value={draft.myPosition} onCommit={v => update('myPosition', Math.max(1, Math.min(draft.groupSize, v)))} min={1} max={draft.groupSize} theme={theme} />
                </View>
              </View>

              <Txt variant="microBold" color={theme.steel} style={S.sectionLabel}>START DATE</Txt>
              <View style={S.row}>
                <View style={{ flex: 1 }}>
                  <NumberField label="Day" value={draft.startDay} onCommit={v => update('startDay', v)} min={1} max={28} theme={theme} noLabel />
                </View>
                <View style={{ flex: 2 }}>
                  <View style={[S.monthGrid, { borderColor: theme.border }]}>
                    {MONTHS_SHORT.map((m, i) => {
                      const active = draft.startMonth === i;
                      return (
                        <Pressable
                          key={i}
                          onPress={() => update('startMonth', i)}
                          style={[S.monthCell, active && { backgroundColor: theme.ink }]}
                        >
                          <Txt variant="microBold" color={active ? '#FFFFFF' : theme.muted}>
                            {m.slice(0, 1)}
                          </Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View style={{ flex: 1.2 }}>
                  <NumberField label="Year" value={draft.startYear} onCommit={v => update('startYear', v)} min={2000} max={2100} theme={theme} noLabel />
                </View>
              </View>

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

function NumberField({ label, value, onCommit, min, max, theme, noLabel }: {
  label: string; value: number; onCommit: (n: number) => void;
  min?: number; max?: number; theme: any; noLabel?: boolean;
}) {
  return (
    <View style={[S.field, noLabel && { marginTop: 0 }]}>
      {!noLabel && <Txt variant="microBold" color={theme.steel} style={S.fieldLabel}>{label.toUpperCase()}</Txt>}
      <NumberInput
        value={value}
        onCommit={onCommit}
        min={min}
        max={max}
        selectTextOnFocus
        style={[S.input, { color: theme.ink, borderColor: theme.border }]}
      />
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
    gap: 6,
    marginBottom: space.lg,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { letterSpacing: 1.2, marginTop: space.lg, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  field: { marginTop: space.md },
  fieldLabel: { letterSpacing: 1.2, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  monthGrid: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    height: 40,
    marginTop: 0,
  },
  monthCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  btn: { flex: 1, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { borderWidth: 1 },
  btnPrimary: { flex: 2 },
});
