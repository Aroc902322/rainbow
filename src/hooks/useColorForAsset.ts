import { useMemo } from 'react';
import { lightModeThemeColors } from '../styles/colors';
import { AssetType, ParsedAddressAsset } from '@/entities';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
} from '@/utils';
import { usePersistentDominantColorFromImage } from '.';
import { maybeSignUri } from '@/handlers/imgix';

export default function useColorForAsset(
  asset: Partial<ParsedAddressAsset> = {},
  fallbackColor: string | undefined = undefined,
  forceLightMode = false,
  forceETHColor = false
) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode: isDarkModeTheme, colors } = useTheme();
  const { address, color, mainnet_address, type } = asset;
  const token = getTokenMetadata(mainnet_address || address!);
  const tokenListColor = token?.color;

  const { result: imageColor } = usePersistentDominantColorFromImage(
    maybeSignUri(
      getUrlForTrustIconFallback(
        mainnet_address || address!,
        mainnet_address ? AssetType.token : (type as AssetType)
      ) || '',
      { w: 40 }
    ) || ''
  );

  const isDarkMode = forceLightMode || isDarkModeTheme;

  const colorDerivedFromAddress = useMemo(() => {
    const color =
      isETH(address) || isETH(mainnet_address)
        ? isDarkMode
          ? forceETHColor
            ? colors.appleBlue
            : colors.brighten(lightModeThemeColors.dark)
          : colors.dark
        : pseudoRandomArrayItemFromString(
            mainnet_address || address!,
            colors.avatarBackgrounds
          );
    return color;
  }, [address, colors, forceETHColor, isDarkMode, mainnet_address]);

  return useMemo(() => {
    let color2Return;
    if (color) {
      color2Return = color;
    } else if (tokenListColor) {
      color2Return = tokenListColor;
    } else if (imageColor) {
      color2Return = imageColor;
    } else if (fallbackColor) {
      color2Return = fallbackColor;
    } else {
      color2Return = colorDerivedFromAddress;
    }
    try {
      return isDarkMode && colors.isColorDark(color2Return)
        ? colors.brighten(color2Return)
        : color2Return;
    } catch (e) {
      return color2Return;
    }
  }, [
    color,
    colorDerivedFromAddress,
    colors,
    fallbackColor,
    imageColor,
    isDarkMode,
    tokenListColor,
  ]);
}
