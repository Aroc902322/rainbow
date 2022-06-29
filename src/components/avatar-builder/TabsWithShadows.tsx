import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import EmojiTabBarShadow from '../../assets/emojiTabBarShadow.png';
import { Categories } from './Categories';
import TabBar from './TabBar';
import { EmojiCategory } from './types';
import { TransformationImage } from '@rainbow-me/images';
import { position } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';
import { magicMemo } from '@rainbow-me/utils';

const categoryKeys = Object.keys(Categories);

interface Props {
  category: EmojiCategory;
  onTabSelect: (emojiCategory: EmojiCategory) => void;
}

const TabsWithShadows = ({ category, onTabSelect }: Props) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={sx.tabBar}>
      <View style={[sx.tabBarShadowImage, { opacity: isDarkMode ? 0.3 : 0.6 }]}>
        <TransformationImage
          pointerEvents="none"
          // @ts-expect-error
          source={EmojiTabBarShadow}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[{ shadowColor: colors.shadowBlack }, sx.gradientContainer]}>
        <LinearGradient
          colors={[
            colors.white,
            colors.white,
            isDarkMode ? colors.white : '#F0F5FA',
          ]}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={sx.gradient}
        />
      </View>
      <TabBar
        activeCategory={category}
        categoryKeys={categoryKeys}
        onPress={onTabSelect}
      />
    </View>
  );
};

const sx = StyleSheet.create({
  gradient: {
    borderRadius: 19,
    overflow: 'hidden',
    ...position.coverAsObject,
  },
  gradientContainer: {
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 0.5,
    ...position.coverAsObject,
  },
  tabBar: {
    alignSelf: 'center',
    bottom: 24,
    flexDirection: 'row',
    height: 38,
    justifyContent: 'space-between',
    padding: 4,
    position: 'absolute',
    width: 276,
  },
  tabBarShadowImage: {
    height: 138,
    left: -50.5,
    position: 'absolute',
    top: -46,
    width: 377,
  },
});

export default magicMemo(TabsWithShadows, ['category', 'onTabSelect']);
