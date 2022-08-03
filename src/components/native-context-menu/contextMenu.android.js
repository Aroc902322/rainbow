import { MenuView } from '@react-native-menu/menu';
import React, { useMemo } from 'react';
import { useLatestCallback } from '@/hooks';

export default function ContextMenuAndroid({
  children,
  menuConfig: { menuItems, menuTitle },
  isAnchoredToRight,
  handlePressMenuItem,
}) {
  const actions = useMemo(() => {
    const items = [];

    if (menuTitle) {
      items.push({
        attributes: {
          disabled: true,
        },
        id: 'title',
        title: menuTitle,
      });
    }

    if (menuItems) {
      items.push(
        ...menuItems?.map(item => ({
          id: item.actionKey,
          image: item.icon?.iconValue,
          title: item.actionTitle,
        }))
      );
    }

    return items;
  }, [menuItems, menuTitle]);

  const onPressAction = useLatestCallback(
    ({ nativeEvent: { event } }) =>
      handlePressMenuItem({ nativeEvent: { actionKey: event } }),
    [handlePressMenuItem]
  );

  return (
    <MenuView
      actions={actions}
      isAnchoredToRight={isAnchoredToRight}
      onPressAction={onPressAction}
    >
      {children}
    </MenuView>
  );
}