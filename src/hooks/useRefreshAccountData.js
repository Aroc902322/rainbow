import { captureException } from '@sentry/react-native';
import delay from 'delay';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import NetworkTypes from '../helpers/networkTypes';
import { fetchOnchainBalances } from '../redux/fallbackExplorer';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import { updatePositions } from '../redux/usersPositions';
import { walletConnectLoadState } from '../redux/walletconnect';
import {
  fetchWalletENSAvatars,
  fetchWalletNames,
  fetchWalletRainbowProfiles,
} from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import useSavingsAccount from './useSavingsAccount';
import { PROFILES, useExperimentalFlag } from '@rainbow-me/config';
import logger from 'logger';
import useAccountProfile from './useAccountProfile';

export default function useRefreshAccountData() {
  const dispatch = useDispatch();
  const { network } = useAccountSettings();
  const { refetchSavings } = useSavingsAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { accountImage } = useAccountProfile();
  console.log(accountImage);

  const fetchAccountData = useCallback(async () => {
    // Refresh unique tokens for Rinkeby
    if (network === NetworkTypes.rinkeby) {
      const getUniqueTokens = dispatch(uniqueTokensRefreshState());
      return Promise.all([delay(1250), getUniqueTokens]);
    }

    // Nothing to refresh for other testnets
    if (network !== NetworkTypes.mainnet) {
      return Promise.all([delay(1250)]);
    }

    try {
      const getWalletNames = dispatch(fetchWalletNames());
      const getWalletRainbowProfiles = dispatch(fetchWalletRainbowProfiles());
      const getWalletENSAvatars = profilesEnabled
        ? dispatch(fetchWalletENSAvatars())
        : null;
      const getUniqueTokens = dispatch(uniqueTokensRefreshState());
      const balances = dispatch(
        fetchOnchainBalances({ keepPolling: false, withPrices: false })
      );
      const wc = dispatch(walletConnectLoadState());
      const uniswapPositions = dispatch(updatePositions());
      return Promise.all([
        delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
        getWalletNames,
        getWalletRainbowProfiles,
        getUniqueTokens,
        getWalletENSAvatars,
        refetchSavings(true),
        balances,
        wc,
        uniswapPositions,
      ]);
    } catch (error) {
      logger.log('Error refreshing data', error);
      captureException(error);
      throw error;
    }
  }, [dispatch, network, profilesEnabled, refetchSavings]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      await fetchAccountData();
    } catch (e) {
      logger.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAccountData, isRefreshing]);

  return {
    isRefreshing,
    refresh,
  };
}
