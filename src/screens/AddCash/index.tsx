import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { StatusBar } from 'react-native';

import { deviceUtils } from '@/utils';
import { IS_IOS } from '@/env';
import {
  Box,
  Text,
  Separator,
  useForegroundColor,
  BackgroundProvider,
} from '@/design-system';
import { AppState } from '@/redux/store';
import config from '@/model/config';

import { Ratio } from '@/screens/AddCash/providers/Ratio';
import { Ramp } from '@/screens/AddCash/providers/Ramp';
import { Coinbase } from '@/screens/AddCash/providers/Coinbase';
import { Moonpay } from '@/screens/AddCash/providers/Moonpay';
import * as lang from '@/languages';
import { SlackSheet } from '@/components/sheet';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);

export function AddCashSheet() {
  const isRatioEnabled = config.f2c_ratio_enabled;
  const insets = useSafeAreaInsets();
  const { accountAddress } = useSelector(({ settings }: AppState) => ({
    accountAddress: settings.accountAddress,
  }));
  const borderColor = useForegroundColor('separatorTertiary');
  const sheetHeight = IS_IOS
    ? deviceHeight - insets.top
    : deviceHeight - statusBarHeight;

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        // @ts-expect-error JS component
        <SlackSheet
          backgroundColor={backgroundColor}
          additionalTopPadding={!IS_IOS ? StatusBar.currentHeight : false}
          {...(IS_IOS && { height: '100%' })}
          contentHeight={sheetHeight}
          scrollEnabled
        >
          <Box
            width="full"
            paddingTop="44px"
            paddingHorizontal="20px"
            paddingBottom={{ custom: 100 }}
          >
            <Box paddingHorizontal="20px">
              <Text size="26pt" weight="heavy" color="label" align="center">
                Choose a payment option to buy crypto
              </Text>
            </Box>

            <Box paddingVertical="44px" width="full">
              <Separator color="separatorTertiary" />

              {isRatioEnabled && (
                <Box paddingTop="20px">
                  <Ratio accountAddress={accountAddress} />
                </Box>
              )}

              <Box paddingTop="20px">
                <Ramp accountAddress={accountAddress} />
              </Box>

              <Box paddingTop="20px">
                <Coinbase accountAddress={accountAddress} />
              </Box>

              <Box paddingTop="20px">
                <Moonpay accountAddress={accountAddress} />
              </Box>

              <Box paddingTop="20px">
                <Box
                  padding="20px"
                  borderRadius={20}
                  style={{
                    borderWidth: 1,
                    borderColor,
                  }}
                >
                  <Box paddingBottom="12px">
                    <Text size="17pt" weight="bold" color="labelTertiary">
                      􀵲{' '}
                      {lang.t(
                        lang.l.wallet.add_cash_v2.sheet_empty_state.title
                      )}
                    </Text>
                  </Box>

                  <Text size="15pt" weight="semibold" color="labelQuaternary">
                    {lang.t(
                      lang.l.wallet.add_cash_v2.sheet_empty_state.description
                    )}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
}
