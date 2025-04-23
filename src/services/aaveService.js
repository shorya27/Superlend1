import { ethers } from 'ethers';
import dayjs from 'dayjs';
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from '@aave/contract-helpers';
import {
  formatUserSummaryAndIncentives,
  formatReserves,
} from '@aave/math-utils';
import * as markets from '@bgd-labs/aave-address-book';

const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL || 'https://eth-mainnet.public.blastapi.io'
);

const poolDataProviderContract = new UiPoolDataProvider({
  uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  provider,
  chainId: ChainId.mainnet,
});

const incentiveDataProviderContract = new UiIncentiveDataProvider({
  uiIncentiveDataProviderAddress:
    markets.AaveV3Ethereum.UI_INCENTIVE_DATA_PROVIDER,
  provider,
  chainId: ChainId.mainnet,
});

// Function to get user summary and net APY
export async function getUserSummary(address) {
  const [
    reserves,
    userReserves,
    reserveIncentives,
    userIncentives,
  ] = await Promise.all([
    poolDataProviderContract.getReservesHumanized({
      lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    }),
    poolDataProviderContract.getUserReservesHumanized({
      lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
      user: address,
    }),
    incentiveDataProviderContract.getReservesIncentivesDataHumanized({
      lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    }),
    incentiveDataProviderContract.getUserReservesIncentivesDataHumanized({
      lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
      user: address,
    }),
  ]);

  const currentTimestamp = dayjs().unix();

  const formattedReserves = formatReserves({
    reserves: reserves.reservesData,
    currentTimestamp,
    marketReferenceCurrencyDecimals:
      reserves.baseCurrencyData.marketReferenceCurrencyDecimals,
    marketReferencePriceInUsd:
      reserves.baseCurrencyData.marketReferenceCurrencyPriceInUsd,
  });

  const summary = formatUserSummaryAndIncentives({
    currentTimestamp,
    marketReferencePriceInUsd:
      reserves.baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    marketReferenceCurrencyDecimals:
      reserves.baseCurrencyData.marketReferenceCurrencyDecimals,
    userReserves: userReserves.userReserves,
    formattedReserves,
    userEmodeCategoryId: userReserves.userEmodeCategoryId,
    reserveIncentives: reserveIncentives,
    userIncentives: userIncentives,
  });

  // Calculate Net APY
  let totalSuppliedUSD = 0;
  let totalBorrowedUSD = 0;
  let weightedSupplyAPY = 0;
  let weightedBorrowAPY = 0;

  for (const reserve of summary.userReservesData) {
    const { underlyingBalanceUSD, totalBorrowsUSD, reserve: resData } = reserve;

    if (parseFloat(underlyingBalanceUSD) > 0) {
      totalSuppliedUSD += parseFloat(underlyingBalanceUSD);
      weightedSupplyAPY += parseFloat(underlyingBalanceUSD) * parseFloat(resData.supplyAPY);
    }

    if (parseFloat(totalBorrowsUSD) > 0) {
      totalBorrowedUSD += parseFloat(totalBorrowsUSD);
      weightedBorrowAPY += parseFloat(totalBorrowsUSD) * parseFloat(resData.variableBorrowAPY);
    }
  }

  const averageSupplyAPY = totalSuppliedUSD > 0 ? weightedSupplyAPY / totalSuppliedUSD : 0;
  const averageBorrowAPY = totalBorrowedUSD > 0 ? weightedBorrowAPY / totalBorrowedUSD : 0;

  const netAPY = averageSupplyAPY - averageBorrowAPY;

  return {
    totalSuppliedUSD: summary.totalLiquidityUSD,
    totalBorrowedUSD: summary.totalBorrowsUSD,
    healthFactor: summary.healthFactor,
    netAPY: netAPY * 100, 
  };
}