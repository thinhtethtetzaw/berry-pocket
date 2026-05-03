import * as Lucide from 'lucide-react-native';
import { ComponentProps } from 'react';

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, color = '#000', strokeWidth = 1.75 }: Props) {
  // @ts-expect-error - dynamic lucide lookup
  const Comp = Lucide[name] as React.FC<ComponentProps<typeof Lucide.Heart>> | undefined;
  if (!Comp) {
    const Fallback = Lucide.Circle;
    return <Fallback size={size} color={color} strokeWidth={strokeWidth} />;
  }
  return <Comp size={size} color={color} strokeWidth={strokeWidth} />;
}
