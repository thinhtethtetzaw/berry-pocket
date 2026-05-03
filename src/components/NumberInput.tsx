import { TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> {
  value: number;
  onCommit: (n: number) => void;
  /** Minimum allowed value (after parse). */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Numeric text input that holds an internal string state — letting the user
 * clear the field, delete digits, etc. without the parent immediately
 * coercing back to 0. Parsing happens on blur or onSubmitEditing.
 */
export function NumberInput({ value, onCommit, min, max, style, ...rest }: Props) {
  const { theme } = useTheme();
  const [str, setStr] = useState<string>(String(value));

  // sync external value if it changes (e.g. when the modal opens)
  useEffect(() => {
    setStr(String(value));
  }, [value]);

  function commit() {
    const n = parseInt(str, 10);
    if (isNaN(n)) {
      setStr(String(value));
      return;
    }
    let v = n;
    if (typeof min === 'number') v = Math.max(min, v);
    if (typeof max === 'number') v = Math.min(max, v);
    setStr(String(v));
    if (v !== value) onCommit(v);
  }

  return (
    <TextInput
      {...rest}
      value={str}
      onChangeText={setStr}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="numeric"
      placeholderTextColor={theme.muted}
      style={style}
    />
  );
}
