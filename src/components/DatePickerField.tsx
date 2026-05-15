import { useState } from 'react';
import { View, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { v7Surface, v7Text, radius, space } from '../theme';
import { Txt } from './Txt';
import { MONTHS_SHORT } from '../lib/format';

interface Props {
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: string;
  maximumDate?: string;
  placeholder?: string;
}

function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const d = isoToDate(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const stripped = new Date(d); stripped.setHours(0, 0, 0, 0);
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  if (stripped.getTime() === today.getTime())     return `Today  ·  ${base}`;
  if (stripped.getTime() === yesterday.getTime()) return `Yesterday  ·  ${base}`;
  if (stripped.getTime() === tomorrow.getTime())  return `Tomorrow  ·  ${base}`;
  return base;
}

/**
 * Tap-to-open date picker — themed to match the app.
 * - Closed: compact pill row with subtle calendar icon and small text
 * - iOS open: custom modal with inline calendar wheel tinted to ink
 * - Android open: native date dialog
 */
export function DatePickerField({ value, onChange, minimumDate, maximumDate, placeholder = 'Select date' }: Props) {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState<Date | null>(null);

  const dateValue = value ? isoToDate(value) : new Date();

  function handleAndroidChange(event: DateTimePickerEvent, d?: Date) {
    setOpen(false);
    if (event.type === 'set' && d) onChange(dateToISO(d));
  }

  function handleIOSChange(_e: DateTimePickerEvent, d?: Date) {
    if (d) setTempValue(d);
  }

  function closeIOS(commit: boolean) {
    if (commit && tempValue) onChange(dateToISO(tempValue));
    setOpen(false);
    setTempValue(null);
  }

  const minDate = minimumDate ? isoToDate(minimumDate) : undefined;
  const maxDate = maximumDate ? isoToDate(maximumDate) : undefined;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
      >
        <View style={styles.iconChip}>
          <Calendar size={13} color={v7Text.secondary} strokeWidth={2} />
        </View>
        <Txt
          variant="bodySmMed"
          color={value ? v7Text.primary : v7Text.tertiary}
          style={{ flex: 1 }}
        >
          {value ? formatDisplay(value) : placeholder}
        </Txt>
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => closeIOS(false)}>
          <Pressable style={styles.backdrop} onPress={() => closeIOS(false)}>
            <Pressable onPress={() => {}} style={styles.iosSheet}>
              {/* Subtle handle */}
              <View style={styles.iosHandle} />

              <View style={styles.iosHeader}>
                <Pressable onPress={() => closeIOS(false)} hitSlop={10} style={styles.iosHeaderBtn}>
                  <Txt variant="bodySmMed" color={v7Text.secondary}>Cancel</Txt>
                </Pressable>
                <Txt variant="bodyMdBold" color={v7Text.primary}>Pick a date</Txt>
                <Pressable
                  onPress={() => closeIOS(true)}
                  hitSlop={10}
                  style={[styles.iosHeaderBtn, styles.iosDoneBtn]}
                >
                  <Txt variant="bodySmMed" color="#FFFFFF">Done</Txt>
                </Pressable>
              </View>

              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={tempValue ?? dateValue}
                  mode="date"
                  display="inline"
                  onChange={handleIOSChange}
                  minimumDate={minDate}
                  maximumDate={maxDate}
                  accentColor={v7Text.primary}
                  themeVariant="light"
                  style={styles.iosPicker}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: v7Surface.hairline,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  fieldPressed: {
    backgroundColor: v7Surface.plainCard,
  },
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: v7Surface.plainCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  iosSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 28,
  },
  iosHandle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: '#D8DCE5',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: 6,
    paddingBottom: 12,
  },
  iosHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  iosDoneBtn: {
    backgroundColor: v7Text.primary,
    paddingHorizontal: 16,
  },
  pickerWrap: {
    paddingHorizontal: space.md,
  },
  iosPicker: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
});
