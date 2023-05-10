import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SeparatorColor } from '../../color/palettes';
import { useForegroundColor } from '../../color/useForegroundColor';

export interface SeparatorProps {
  color: SeparatorColor;
  direction?: 'horizontal' | 'vertical';
  thickness?: number;
}

/**
 * @description Renders a separator, either horizontal or vertical.
 */
export function Separator({
  color,
  direction = 'horizontal',
  thickness,
}: SeparatorProps) {
  const foregroundColor = useForegroundColor(color ?? 'separator'); // Fallback for JS consumers
  const style = useMemo(
    () => ({
      backgroundColor: foregroundColor,
      borderRadius: 1,
      ...(direction === 'horizontal'
        ? {
            height: thickness ?? 2,
          }
        : {
            flexGrow: 1,
            width: thickness ?? 2,
          }),
    }),
    [foregroundColor, direction, thickness]
  );

  return <View style={style} />;
}
