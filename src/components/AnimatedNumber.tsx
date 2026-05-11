import { useEffect, useRef, useState } from 'react';
import { Txt } from './Txt';
import type { TextStyle, StyleProp } from 'react-native';

interface Props {
  value: number;
  /** Optional formatter, default rounds + locale-format. */
  format?: (v: number) => string;
  /** Animation duration in ms. */
  duration?: number;
  /** Text style (color, font, size, etc). */
  style?: StyleProp<TextStyle>;
  variant?: React.ComponentProps<typeof Txt>['variant'];
  color?: string;
}

/**
 * Count-up tween. Cubic ease-out from previous value to `value`, then holds.
 * Re-animates whenever `value` changes (e.g. when the date filter switches).
 */
export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString('en-US'),
  duration = 900,
  variant,
  color,
  style,
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const k = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (k < 1) {
        rafRef.current = requestAnimationFrame(tick) as unknown as number;
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick) as unknown as number;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <Txt variant={variant} color={color} style={style}>
      {format(display)}
    </Txt>
  );
}
