// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import { network } from 'hardhat';
const { ethers } = await network.connect();
import Constants from '../../constants';
import {
  pollForNewERC20Balance,
  pollForNewSignerBalanceUsingProvider,
} from '../../helpers';
import hapi from '../hapi';
import utils from '../utils';

describe('TokenTransferContract Test Suite', function () {
  const TX_SUCCESS_CODE = 22;

  let tokenCreateContract;
  let tokenTransferContract;
  let tokenQueryContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;
  let holderSerialNumbers;
  let holderAddress;
  let signers;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    const contractKeys = [
      await tokenCreateContract.getAddress(),
      await tokenQueryContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ];
    const signer1Pk = utils.getHardhatSignerPrivateKeyByIndex(1);
    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey(),
    );
    await hapi.updateTokenKeys(tokenAddress, contractKeys);
    nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey(),
    );
    await hapi.updateTokenKeys(nftTokenAddress, contractKeys);
    mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );
    await hapi.associateWithSigner(signer1Pk, tokenAddress);
    await hapi.associateWithSigner(signer1Pk, nftTokenAddress);
    await tokenCreateContract.grantTokenKycPublic(
      tokenAddress,
      signers[1].address,
      Constants.GAS_LIMIT_1_000_000,
    );
    await tokenCreateContract.grantTokenKycPublic(
      nftTokenAddress,
      signers[1].address,
      Constants.GAS_LIMIT_1_000_000,
    );

    const holder = await hapi.createAccountWithContractIdKey(contractKeys);
    holderAddress = ethers.getAddress(holder.address);
    await (
      await tokenCreateContract.associateTokenPublic(
        holderAddress,
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000,
      )
    ).wait();
    await (
      await tokenCreateContract.associateTokenPublic(
        holderAddress,
        nftTokenAddress,
        Constants.GAS_LIMIT_1_000_000,
      )
    ).wait();
    await (
      await tokenCreateContract.grantTokenKycPublic(
        tokenAddress,
        holderAddress,
        Constants.GAS_LIMIT_1_000_000,
      )
    ).wait();
    await (
      await tokenCreateContract.grantTokenKycPublic(
        nftTokenAddress,
        holderAddress,
        Constants.GAS_LIMIT_1_000_000,
      )
    ).wait();
    holderSerialNumbers = [
      await utils.mintNFT(tokenCreateContract, nftTokenAddress),
      await utils.mintNFT(tokenCreateContract, nftTokenAddress),
    ];
    await hapi.transferFromSigner(0, holder.accountId, {
      tokens: [{ token: tokenAddress, amount: 1000 }],
      nfts: [{ token: nftTokenAddress, serials: holderSerialNumbers }],
    });
  });

  after(function () {
    hapi.client.close();
  });

  it('should NOT be able to use transferFrom on fungible tokens without approval', async function () {
    const amount = 1;
    try {
      const txTransfer = await tokenTransferContract.transferFromPublic(
        tokenAddress,
        signers[0].address,
        signers[1].address,
        amount,
        Constants.GAS_LIMIT_1_000_000,
      );
      await txTransfer.wait();
      expect.fail();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });

  it('should NOT be able to use transferFrom on NFT tokens without approval', async function () {
    try {
      const txTransfer = await tokenTransferContract.transferFromNFTPublic(
        nftTokenAddress,
        signers[0].address,
        signers[1].address,
        mintedTokenSerialNumber,
        Constants.GAS_LIMIT_1_000_000,
      );
      await txTransfer.wait();
      expect.fail();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });

  it('should be able to execute transferTokens', async function () {
    const amount = BigInt(33);
    const signers = await ethers.getSigners();

    const wallet1BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      holderAddress,
    );
    const wallet2BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address,
    );
    const tx = await tokenTransferContract.transferTokensPublic(
      tokenAddress,
      [holderAddress, signers[1].address],
      [-amount, amount],
      Constants.GAS_LIMIT_1_000_000,
    );
    await tx.wait();

    const wallet1BalanceAfter = await pollForNewERC20Balance(
      erc20Contract,
      tokenAddress,
      holderAddress,
      wallet1BalanceBefore,
    );
    const wallet2BalanceAfter = await pollForNewERC20Balance(
      erc20Contract,
      tokenAddress,
      signers[1].address,
      wallet2BalanceBefore,
    );

    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore - amount);
    expect(wallet2BalanceAfter).to.equal(wallet2BalanceBefore + amount);
  });

  it('should be able to execute transferNFTs', async function () {
    const signers = await ethers.getSigners();
    const serialNumber = holderSerialNumbers[0];
    const ownerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      serialNumber,
    );
    const tx = await tokenTransferContract.transferNFTsPublic(
      nftTokenAddress,
      [holderAddress],
      [signers[1].address],
      [serialNumber],
      Constants.GAS_LIMIT_1_000_000,
    );
    await tx.wait();

    const ownerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      serialNumber,
    );

    expect(ownerBefore).to.equal(holderAddress);
    expect(ownerAfter).to.equal(signers[1].address);
  });

  it('should be able to execute transferToken', async function () {
    const amount = BigInt(33);
    const signers = await ethers.getSigners();

    // balanceOf returns a bigint; keep the before values bigint too so the poll
    // helper's `!==` actually compares values and the assertions below match.
    const wallet1BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      holderAddress,
    );
    const wallet2BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address,
    );
    const tx = await tokenTransferContract.transferTokenPublic(
      tokenAddress,
      holderAddress,
      signers[1].address,
      amount,
      Constants.GAS_LIMIT_10_000_000,
    );

    await tx.wait();

    const wallet1BalanceAfter = await pollForNewERC20Balance(
      erc20Contract,
      tokenAddress,
      holderAddress,
      wallet1BalanceBefore,
    );
    const wallet2BalanceAfter = await pollForNewERC20Balance(
      erc20Contract,
      tokenAddress,
      signers[1].address,
      wallet2BalanceBefore,
    );

    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore - amount);
    expect(wallet2BalanceAfter).to.equal(wallet2BalanceBefore + amount);
  });

  it('should be able to execute transferNFT', async function () {
    const signers = await ethers.getSigners();
    const serialNumber = holderSerialNumbers[1];
    const ownerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      serialNumber,
    );
    // Sent by signer1 to keep a non-treasury sender in the picture; the debited
    // account is the contract-keyed holder, which is what authorizes the move.
    const tokenTransferContractOtherSigner = tokenTransferContract.connect(
      signers[1],
    );
    const tx = await tokenTransferContractOtherSigner.transferNFTPublic(
      nftTokenAddress,
      holderAddress,
      signers[1].address,
      serialNumber,
      Constants.GAS_LIMIT_1_000_000,
    );
    await tx.wait();

    const ownerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      serialNumber,
    );

    expect(ownerBefore).to.equal(holderAddress);
    expect(ownerAfter).to.equal(signers[1].address);
  });

  it('should be able to execute getApproved', async function () {
    const approvedTx = await tokenQueryContract.getApprovedPublic(
      nftTokenAddress,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000,
    );
    const receipt = await approvedTx.wait();
    const responseCode = receipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode,
    )[0].args[0];
    const approved = receipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.ApprovedAddress,
    )[0].args[0];

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(approved).to.equal('0x0000000000000000000000000000000000000000');
  });

  it('should be able to execute cryptoTransfer for hbar transfer only', async function () {
    const amount = 10_000;
    const cryptoTransfers = {
      transfers: [
        {
          accountID: signers[0].address,
          amount: -amount,
          isApproval: true,
        },
        {
          accountID: signers[1].address,
          amount: amount,
          isApproval: false,
        },
      ],
    };
    const tokenTransferList = [];

    // allowance for the hbar debit above
    await hapi.approveAllowances(0, await tokenTransferContract.getAddress(), {
      hbar: amount,
    });

    const signers0Before = await signers[0].provider.getBalance(
      signers[0].address,
    );
    const signers1Before = await signers[0].provider.getBalance(
      signers[1].address,
    );
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000,
    );
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    const responseCode = cryptoTransferReceipt.logs.filter(
      (e) => e.fragment && e.fragment.name === Constants.Events.ResponseCode,
    )[0].args[0];

    const signers0After = await pollForNewSignerBalanceUsingProvider(
      signers[0].provider,
      signers[0].address,
      signers0Before,
    );

    const signers1After = await pollForNewSignerBalanceUsingProvider(
      signers[0].provider,
      signers[1].address,
      signers1Before,
    );
    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(signers0Before > signers0After).to.equal(true);
    expect(signers1After > signers1Before).to.equal(true);
  });

  it('should be able to execute cryptoTransfer for nft only', async function () {
    // signer0 is the treasury, so a fresh mint lands on it directly
    const mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );

    const cryptoTransfers = {
      transfers: [],
    };

    const tokenTransferList = [
      {
        token: nftTokenAddress,
        transfers: [],
        nftTransfers: [
          {
            senderAccountID: signers[0].address,
            receiverAccountID: signers[1].address,
            serialNumber: mintedTokenSerialNumber,
            isApproval: true,
          },
        ],
      },
    ];

    // allowance for the NFT debit above
    await hapi.approveAllowances(0, await tokenTransferContract.getAddress(), {
      nfts: [{ token: nftTokenAddress, serials: [mintedTokenSerialNumber] }],
    });

    const ownerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber,
    );
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000,
    );
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    const responseCode = cryptoTransferReceipt.logs.filter(
      (e) => e.fragment && e.fragment.name === Constants.Events.ResponseCode,
    )[0].args[0];

    const ownerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber,
    );

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(ownerBefore).to.equal(signers[0].address);
    expect(ownerAfter).to.equal(signers[1].address);
  });

  it('should be able to execute cryptoTransfer with both 3 txs', async function () {
    const amount = 1;
    const hbarAmount = 10_000;
    // signer0 is the treasury, so it already holds the fungible supply and a
    // fresh mint lands on it directly — no seeding transfer needed here.
    const mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );

    const signers0BeforeHbarBalance = await signers[0].provider.getBalance(
      signers[0].address,
    );
    const signers1BeforeHbarBalance = await signers[0].provider.getBalance(
      signers[1].address,
    );
    const signers0BeforeTokenBalance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address,
    );
    const signers1BeforeTokenBalance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address,
    );
    const nftOwnerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber,
    );

    const cryptoTransfers = {
      transfers: [
        {
          accountID: signers[0].address,
          amount: -hbarAmount,
          isApproval: true,
        },
        {
          accountID: signers[1].address,
          amount: hbarAmount,
          isApproval: false,
        },
      ],
    };

    const tokenTransferList = [
      {
        token: tokenAddress,
        transfers: [
          {
            accountID: signers[1].address,
            amount: amount,
            isApproval: false,
          },
          {
            accountID: signers[0].address,
            amount: -amount,
            isApproval: true,
          },
        ],
        nftTransfers: [],
      },
      {
        token: nftTokenAddress,
        transfers: [],
        nftTransfers: [
          {
            senderAccountID: signers[0].address,
            receiverAccountID: signers[1].address,
            serialNumber: mintedTokenSerialNumber,
            isApproval: true,
          },
        ],
      },
    ];

    // allowances for the hbar + token + NFT debits
    await hapi.approveAllowances(0, await tokenTransferContract.getAddress(), {
      hbar: hbarAmount,
      tokens: [{ token: tokenAddress, amount }],
      nfts: [{ token: nftTokenAddress, serials: [mintedTokenSerialNumber] }],
    });
    //execute, verify balances, check the owner of the nft,
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000,
    );
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    const responseCode = cryptoTransferReceipt.logs.filter(
      (e) => e.fragment && e.fragment.name === Constants.Events.ResponseCode,
    )[0].args[0];
    await new Promise((r) => setTimeout(r, 2000));

    const signers0AfterHbarBalance = await signers[0].provider.getBalance(
      signers[0].address,
    );
    const signers1AfterHbarBalance = await signers[0].provider.getBalance(
      signers[1].address,
    );
    const signers0AfterTokenBalance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address,
    );
    const signers1AfterTokenBalance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address,
    );
    const nftOwnerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber,
    );

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(signers0BeforeHbarBalance > signers0AfterHbarBalance).to.equal(true);
    expect(signers1AfterHbarBalance > signers1BeforeHbarBalance).to.equal(true);
    expect(signers0BeforeTokenBalance - BigInt(amount)).to.equal(
      signers0AfterTokenBalance,
    );
    expect(signers1BeforeTokenBalance + BigInt(amount)).to.equal(
      signers1AfterTokenBalance,
    );
    expect(nftOwnerBefore).to.equal(signers[0].address);
    expect(nftOwnerAfter).to.equal(signers[1].address);
  });
});
