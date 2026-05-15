import { useState } from 'react';
import { View, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';
import { v7Surface, v7Text, radius, space } from '../theme';
import { Txt } from './Txt';
import { MONTHS_SHORT } from '../lib/format';

interface Props {
  /** Current value as ISO `YYYY-MM-DD`. */
  value: string;
  onChange: (iso: string) => void;
  /** Optional minimum allowed date (ISO `YYYY-MM-DD`). */
  minimumDate?: string;
  /** Optional maximum allowed date. */
  maximumDate?: string;
  /** Placeholder when no value. */
  placeholder?: string;
}

function isoToDate(iso: string): Date {
  // Treat as local midnight so we don't get TZ off-by-one.
  return new Date(iso + 'T00:00:00');
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const d = isoToDate(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dStripped = new Date(d); dStripped.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((dStripped.getTime() - today.getTime()) / 86400000);
  if (dayDiff === 0) return `Today · ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  if (dayDiff === -1) return `Yesterday · ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  if (dayDiff === 1) return `Tomorrow · ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Tap-to-open date picker — native iOS modal / Android dialog.
 * Returns ISO `YYYY-MM-DD` strings via onChange.
 */
export function DatePickerField({ value, onChange, minimumDate, maximumDate, placeholder = 'Select date' }: Props) {
  const [open, setOpen] = useState(false);
  // Temp value while the iOS picker is open — committed on Done.
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
        style={({ pressed }) => [styles.field, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Calendar size={15} color={v7Text.secondary} strokeWidth={2} />
        <Txt
          variant="bodyMd"
          color={value ? v7Text.primary : v7Text.tertiary}
          style={{ flex: 1 }}
        >
          {value ? formatDisplay(value) : placeholder}
        </Txt>
      </Pressable>

      {/* Android — native dialog appears + closes on its own */}
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

      {/* iOS — host the inline picker inside our own modal so we control Done/Cancel */}
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => closeIOS(false)}>
          <Pressable style={styles.backdrop} onPress={() => closeIOS(false)}>
            <Pressable onPress={() => {}} style={styles.iosSheet}>
              <View style={styles.iosHeader}>
                <Pressable onPress={() => closeIOS(false)} hitSlop={8}>
                  <Txt variant="buttonMd" color={v7Text.secondary}>Cancel</Txt>
                </Pressable>
                <Txt variant="headingSm" color={v7Text.primary}>Pick a date</Txt>
                <Pressable onPress={() => closeIOS(true)} hitSlop={8}>
                  <Txt variant="buttonMd" color={v7Text.primary}>Done</Txt>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempValue ?? dateValue}
                mode="date"
                display="inline"
                onChange={handleIOSChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                style={styles.iosPicker}
              />
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 46,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  iosSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxxl,
    paddingTop: space.md,
    paddingBottom: space.md,
    overflow: 'hidden',
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: v7Surface.hairline,
  },
  iosPicker: {
    backgroundColor: '#FFFFFF',
  },
});
