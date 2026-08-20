// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = await hre.network.connect();
import Constants from '../../constants';
import hapi from '../hapi';
import utils from '../utils';

describe('HIP904Batch3 TokenRejectContract Test Suite', function () {
  let tokenRejectContract;
  let tokenCreateContract;
  let airdropContract;
  let signers;
  let owner;
  let receiver;
  let walletIHRC904AccountFacade;
  let contractAddresses;

  before(async function () {
    signers = await ethers.getSigners();
    tokenRejectContract = await utils.deployContract(
      Constants.Contract.TokenReject,
    );
    tokenCreateContract = await utils.deployContract(
      Constants.Contract.TokenCreateContract,
    );
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    owner = signers[0].address;

    const randomWallet = ethers.Wallet.createRandom();
    const receiverPrivateKey = randomWallet.privateKey;
    receiver = randomWallet.connect(ethers.provider);

    await signers[0].sendTransaction({
      to: receiver.address,
      value: ethers.parseEther('100'),
    });

    contractAddresses = [
      await tokenRejectContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await airdropContract.getAddress(),
    ];
    await hapi.updateAccountKeys(contractAddresses);

    await hapi.updateAccountKeys(contractAddresses, [receiverPrivateKey]);

    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi,
    );

    walletIHRC904AccountFacade = new ethers.Contract(
      receiver.address,
      IHRC904AccountFacade,
      receiver,
    );
  });

  after(function () {
    hapi.client.close();
  });

  it('should reject tokens for a single account', async function () {
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const receiver = signers[1];

    const ftAmount = BigInt(1);
    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      ftAmount,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      },
    );
    await airdropTx.wait();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
      gasLimit: 2_000_000,
    });

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [tokenAddress],
      [],
      [],
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22'); // SUCCESS code
  });

  it('should reject NFTs for a single account', async function () {
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const receiver = signers[1];

    const serial = await utils.mintNFT(tokenCreateContract, nftTokenAddress);

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver.address,
      serial,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      },
    );
    await airdropTx.wait();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
      gasLimit: 2_000_000,
    });

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [],
      [nftTokenAddress],
      [serial],
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22'); // SUCCESS code
  });

  it('should reject a specific NFT serial when more than one has been minted', async function () {
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const receiver = signers[1];

    // Mint two NFTs and reject the SECOND serial. A regression to a hardcoded
    // serial (e.g. the previous `nftId.serial = 1`) would fail this case.
    await utils.mintNFT(tokenCreateContract, nftTokenAddress);
    const secondSerial = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );
    expect(secondSerial).to.eq(2);

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver.address,
      secondSerial,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      },
    );
    await airdropTx.wait();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
      gasLimit: 2_000_000,
    });

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [],
      [nftTokenAddress],
      [secondSerial],
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22'); // SUCCESS code
  });

  it('should reject tokens for multiple accounts', async function () {
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const receivers = signers.slice(1, 3);

    for (const receiver of receivers) {
      const airdropTx = await airdropContract.tokenAirdrop(
        tokenAddress,
        owner,
        receiver.address,
        BigInt(1),
        {
          value: Constants.ONE_HBAR,
          gasLimit: 2_000_000,
        },
      );
      await airdropTx.wait();

      const tx = await tokenRejectContract.rejectTokens(
        receiver.address,
        [tokenAddress],
        [],
        [],
        Constants.GAS_LIMIT_2_000_000,
      );
      const responseCode = await utils.getHTSResponseCode(tx.hash);
      expect(responseCode).to.eq('22'); // SUCCESS code
    }
  });

  it('should fail when sender does not have any associated tokens', async function () {
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(false, {
      gasLimit: 2_000_000,
    });

    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      BigInt(1),
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      },
    );
    await airdropTx.wait();

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [tokenAddress],
      [],
      [],
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('184'); // TOKEN_NOT_ASSOCIATED_TO_ACCOUNT code
  });

  it('should fail when sender does not have a pending airdrop', async function () {
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const receiver = signers[1];

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [tokenAddress],
      [],
      [],
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('178'); // INSUFFICIENT_TOKEN_BALANCE code
  });

  it('should fail when provided fungible token is invalid', async function () {
    const invalidToken = ethers.Wallet.createRandom().address;
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    // Fails on the invalid fungible token before the NFT serial is evaluated,
    // so the serial value here is irrelevant (placeholder to match array length).
    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [invalidToken],
      [nftTokenAddress],
      [1],
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('167'); // INVALID_TOKEN_ID code
  });

  it('should fail when provided NFT is invalid', async function () {
    const invalidNft = ethers.Wallet.createRandom().address;

    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const receiver = signers[1];

    const serial = await utils.mintNFT(tokenCreateContract, nftTokenAddress);

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver.address,
      serial,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      },
    );
    await airdropTx.wait();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
      gasLimit: 2_000_000,
    });

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [],
      [invalidNft],
      [serial],
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('226'); // INVALID_NFT_ID code
  });
});
