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
  uiIncentiveDataProviderAddress: markets.AaveV3Ethereum.UI_INCENTIVE_DATA_PROVIDER,
  provider,
  chainId: ChainId.mainnet,
});

//  function to calculate APY
const calculateWeightedAPY = (userReservesData) => {
  let totalUSD = { supplied: 0, borrowed: 0 };
  let weightedAPY = { supply: 0, borrow: 0 };

  userReservesData.forEach(({ underlyingBalanceUSD, totalBorrowsUSD, reserve }) => {
    if (parseFloat(underlyingBalanceUSD) > 0) {
      totalUSD.supplied += parseFloat(underlyingBalanceUSD);
      weightedAPY.supply += parseFloat(underlyingBalanceUSD) * parseFloat(reserve.supplyAPY);
    }
    if (parseFloat(totalBorrowsUSD) > 0) {
      totalUSD.borrowed += parseFloat(totalBorrowsUSD);
      weightedAPY.borrow += parseFloat(totalBorrowsUSD) * parseFloat(reserve.variableBorrowAPY);
    }
  });

  return {
    averageSupplyAPY: totalUSD.supplied > 0 ? weightedAPY.supply / totalUSD.supplied : 0,
    averageBorrowAPY: totalUSD.borrowed > 0 ? weightedAPY.borrow / totalUSD.borrowed : 0,
  };
};

// Function to get user summary
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
    reserveIncentives,
    userIncentives,
  });

  const { averageSupplyAPY, averageBorrowAPY } = calculateWeightedAPY(summary.userReservesData);

  const netAPY = averageSupplyAPY - averageBorrowAPY;

  return {
    totalSuppliedUSD: summary.totalLiquidityUSD,
    totalBorrowedUSD: summary.totalBorrowsUSD,
    healthFactor: summary.healthFactor,
    netAPY: netAPY * 100,
  };
}
