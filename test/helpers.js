// SPDX-License-Identifier: Apache-2.0
import dotenv from 'dotenv';
dotenv.config();

const delay = (ms) => {
  return new Promise((resolve) =>
    setTimeout(resolve, ms || process.env.RETRY_DELAY || 2000),
  );
};

const getBalance = async (erc20Contract, tokenAddress, signersAddress) => {
  const balance = await erc20Contract.balanceOf(tokenAddress, signersAddress);
  return balance;
};

const getSignerBalance = async (provider, signersAddress) => {
  const balance = await provider.getBalance(signersAddress);
  return balance;
};

export const pollForNewBalance = async (
  IERC20,
  contractAddress,
  tokenCreateBalanceBefore,
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const balanceAfter = await IERC20.balanceOf(contractAddress);

    if (balanceAfter !== 0 && balanceAfter !== tokenCreateBalanceBefore) {
      return balanceAfter; // Balance changed and not null
    }

    await delay(); // Delay before the next attempt
  }
  console.log('----');

  throw new Error(
    `Failed to get a different balance value after ${process.env.MAX_RETRY} tries`,
  );
};

export const pollForNewERC20Balance = async (
  erc20Contract,
  tokenAddress,
  signersAddress,
  balanceBefore,
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    try {
      const balanceAfter = await getBalance(
        erc20Contract,
        tokenAddress,
        signersAddress,
      );
      if (balanceAfter !== balanceBefore) {
        return balanceAfter;
      }
    } catch (error) {
      // Handle errors from erc20Contract.balanceOf
      console.error(`Error fetching balance: ${error.message}`);
    }

    await delay();
  }

  throw new Error(
    `Failed to get a different value after ${process.env.MAX_RETRY} tries`,
  );
};

export const pollForNewSignerBalance = async (
  IERC20Contract,
  signersAddress,
  signerBefore,
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const signerAfter = await IERC20Contract.balanceOf(signersAddress);

    if (signerAfter !== signerBefore) {
      return signerAfter; // Balance changed and not null
    }

    await delay(); // Delay before the next attempt
  }

  throw new Error(
    `Failed to get a different balance value after ${process.env.MAX_RETRY} tries`,
  );
};

export const pollForNewSignerBalanceUsingProvider = async (
  provider,
  signersAddress,
  signerBefore,
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    try {
      const signerAfter = await getSignerBalance(provider, signersAddress);
      if (signerAfter !== signerBefore) {
        return signerAfter;
      }
    } catch (error) {
      // Handle errors from provider.getBalance
      console.error(`Error fetching signer balance: ${error.message}`);
    }

    await delay();
  }

  throw new Error(
    `Failed to get a different value after ${process.env.MAX_RETRY} tries`,
  );
};
