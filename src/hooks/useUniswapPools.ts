import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useEthUSDMonthChart, useEthUSDPrice } from '../utils/ethereumUtils';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { getUniswapV2Pools } from '@rainbow-me/handlers/dispersion';
import { pickShallow, sortByKeyHelper } from '@rainbow-me/helpers/utilities';
import {
  emitAssetRequest,
  emitChartsRequest,
} from '@rainbow-me/redux/explorer';
import { setPoolsDetails } from '@rainbow-me/redux/uniswapLiquidity';
import { WETH_ADDRESS } from '@rainbow-me/references';
import logger from 'logger';
const AMOUNT_OF_PAIRS_TO_DISPLAY = 40;

export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
};

export const REFETCH_INTERVAL = 600000;

function parseData(
  data: any,
  oneDayData: any,
  oneMonthData: any,
  ethPrice: any,
  ethPriceOneMonthAgo: any,
  oneDayBlock: any
) {
  const newData = { ...data };
  // get volume changes
  const oneDayVolumeUSD = getOneDayVolume(
    newData?.volumeUSD,
    oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0
  );

  newData.profit30d = calculateProfit30d(
    data,
    oneMonthData,
    ethPrice,
    ethPriceOneMonthAgo
  );

  // set volume properties
  // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
  newData.oneDayVolumeUSD = parseFloat(oneDayVolumeUSD);

  // set liquidity properties
  newData.trackedReserveUSD = newData.trackedReserveETH * ethPrice;
  newData.liquidityChangeUSD = getPercentChange(
    newData.reserveUSD,
    oneDayData?.reserveUSD
  );

  // format if pair hasnt existed for a day
  if (!oneDayData && data && newData.createdAtBlockNumber > oneDayBlock) {
    newData.oneDayVolumeUSD = parseFloat(newData.volumeUSD);
  }
  if (!oneDayData && data) {
    newData.oneDayVolumeUSD = parseFloat(newData.volumeUSD);
  }

  newData.annualized_fees =
    (newData.oneDayVolumeUSD * 0.003 * 365 * 100) / newData.trackedReserveUSD;

  const { id, name, symbol } = newData.token0;
  const {
    id: idToken1,
    name: nameToken1,
    symbol: symbolToken1,
  } = newData.token1;
  return {
    address: newData?.id,
    annualized_fees: newData.annualized_fees,
    liquidity: Number(Number(newData.reserveUSD).toFixed(2)),
    oneDayVolumeUSD: newData.oneDayVolumeUSD,
    profit30d: newData.profit30d,
    symbol: 'UNI-V2',
    token0: { id, name, symbol },
    token1: { id: idToken1, name: nameToken1, symbol: symbolToken1 },
    tokenNames: `${newData.token0.symbol}-${newData.token1.symbol}`.replace(
      'WETH',
      'ETH'
    ),
    type: 'uniswap-v2',
  };
}

export const getOneDayVolume = (valueNow: any, value24HoursAgo: any) =>
  parseFloat(valueNow) - parseFloat(value24HoursAgo);

export const calculateProfit30d = (
  data: any,
  valueOneMonthAgo: any,
  ethPriceNow: any,
  ethPriceOneMonthAgo: any
) => {
  const now = calculateLPTokenPrice(data, ethPriceNow);
  if (now === 0) {
    logger.log('🦄🦄🦄 lpTokenPrice now is 0', data, ethPriceNow);
  }

  if (valueOneMonthAgo === undefined) {
    return undefined;
  }

  if (ethPriceOneMonthAgo === undefined) {
    logger.log('🦄🦄🦄 ethPriceOneMonthAgo is missing.', ethPriceOneMonthAgo);
    return undefined;
  }
  const oneMonthAgo = calculateLPTokenPrice(
    valueOneMonthAgo,
    ethPriceOneMonthAgo
  );

  const percentageChange = getPercentChange(now, oneMonthAgo);
  return Number(percentageChange.toFixed(2));
};

export const calculateLPTokenPrice = (data: any, ethPrice: any) => {
  const {
    reserve0,
    reserve1,
    totalSupply,
    token0: { derivedETH: token0DerivedEth },
    token1: { derivedETH: token1DerivedEth },
  } = data;

  const tokenPerShare = 100 / totalSupply;

  const reserve0USD =
    Number(reserve0) * (Number(token0DerivedEth) * Number(ethPrice));
  const reserve1USD =
    Number(reserve1) * (Number(token1DerivedEth) * Number(ethPrice));

  const token0LiquidityPrice = (reserve0USD * tokenPerShare) / 100;
  const token1LiquidityPrice = (reserve1USD * tokenPerShare) / 100;
  const lpTokenPrice = token0LiquidityPrice + token1LiquidityPrice;

  return lpTokenPrice;
};

/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow: any, value24HoursAgo: any) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) /
      parseFloat(value24HoursAgo)) *
    100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0;
  }
  return adjustedPercentChange;
};

export default function useUniswapPools(
  sortField: any,
  sortDirection: any,
  token: any
) {
  const walletReady = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'appState' does not exist on type 'Defaul... Remove this comment to see the full error message
    ({ appState: { walletReady } }) => walletReady
  );

  const dispatch = useDispatch();

  const [pairs, setPairs] = useState();
  const priceOfEther = useEthUSDPrice();
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const ethereumPriceOneMonthAgo = useEthUSDMonthChart()?.[0]?.[1];

  useEffect(() => {
    pairs &&
      dispatch(
        setPoolsDetails(
          // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
          pairs.reduce((acc: any, pair: any) => {
            acc[pair.address] = pair;
            return acc;
          }, {})
        )
      );
  }, [pairs, dispatch]);

  const genericAssets = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
    ({ data: { genericAssets } }) => genericAssets
  );

  // @ts-expect-error ts-migrate(7022) FIXME: 'error' implicitly has type 'any' because it does ... Remove this comment to see the full error message
  const { data: poolData, error } = useQuery(
    ['pools/uniswap/v2', token],
    () => getUniswapV2Pools(token),
    {
      enabled: walletReady,
      // @ts-expect-error ts-migrate(7024) FIXME: Function implicitly has return type 'any' because ... Remove this comment to see the full error message
      onError: () => logger.log('🦄🦄🦄 error getting pairs data', error),
      refetchInterval: REFETCH_INTERVAL,
    }
  );

  const handleGetUniswapV2PoolsResponse = useCallback(() => {
    if (!poolData) return;
    const topPairs = poolData.map(
      ({ pair, oneDayBlock, oneDayHistory, oneMonthHistory }) => {
        return parseData(
          pair,
          oneDayHistory,
          oneMonthHistory,
          priceOfEther,
          ethereumPriceOneMonthAgo,
          oneDayBlock
        );
      }
    );
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ address: any; annualized_fees:... Remove this comment to see the full error message
    setPairs(topPairs);
  }, [poolData, priceOfEther, ethereumPriceOneMonthAgo]);

  useEffect(() => {
    if (poolData && priceOfEther && ethereumPriceOneMonthAgo) {
      handleGetUniswapV2PoolsResponse();
    }
  }, [
    poolData,
    ethereumPriceOneMonthAgo,
    handleGetUniswapV2PoolsResponse,
    priceOfEther,
  ]);

  const currenciesRate = useNativeCurrencyToUSD();

  const top40PairsSorted = useMemo(() => {
    if (!pairs) return null;
    // @ts-expect-error FIXME: Property 'slice' does not exist on type 'never'.
    let sortedPairs = pairs.slice().sort(sortByKeyHelper(sortField));
    if (sortDirection === SORT_DIRECTION.DESC) {
      sortedPairs = sortedPairs.reverse();
    }

    // top 40
    sortedPairs = sortedPairs.slice(0, AMOUNT_OF_PAIRS_TO_DISPLAY - 1);
    const tmpAllTokens = [];
    // Override with tokens from generic assets
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    sortedPairs = sortedPairs.map(pair => {
      const token0 = (pair.token0?.id?.toLowerCase() === WETH_ADDRESS
        ? genericAssets['eth']
        : genericAssets[pair.token0?.id?.toLowerCase()]) || {
        ...pair.token0,

        address: pair.token0?.id,
      };
      const token1 =
        pair.token1?.id?.toLowerCase() === WETH_ADDRESS
          ? genericAssets['eth']
          : genericAssets[pair.token1?.id?.toLowerCase()] || {
              ...pair.token1,

              address: pair.token1?.id,
            };
      pair.tokens = [token0, token1];
      tmpAllTokens.push(pair.tokens[0]?.id?.toLowerCase());
      tmpAllTokens.push(pair.tokens[1]?.id?.toLowerCase());
      const pairAdjustedForCurrency = {
        ...pair,
        liquidity: (pair as any).liquidity * currenciesRate,
        oneDayVolumeUSD: (pair as any).oneDayVolumeUSD * currenciesRate,
      };

      return pickShallow(pairAdjustedForCurrency, [
        'address',
        'annualized_fees',
        'liquidity',
        'oneDayVolumeUSD',
        'profit30d',
        'symbol',
        'tokens',
        'tokenNames',
        'type',
      ]);
    });

    // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
    const allLPTokens = sortedPairs.map(({ address }) => address);
    dispatch(emitAssetRequest(allLPTokens));
    dispatch(emitChartsRequest(allLPTokens));
    return sortedPairs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, pairs, sortDirection, sortField]);

  return {
    error,
    is30DayEnabled: ethereumPriceOneMonthAgo > 0,
    isEmpty: top40PairsSorted && top40PairsSorted.length < 1,
    pairs: top40PairsSorted,
  };
}