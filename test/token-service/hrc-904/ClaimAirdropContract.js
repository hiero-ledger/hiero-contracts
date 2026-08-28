// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = await hre.network.connect();
import Constants from '../../constants';
import hapi from '../hapi';
import utils from '../utils';
import Utils from '../utils';

describe('HIP904Batch3 ClaimAirdropContract Test Suite', function () {
  let airdropContract;
  let claimAirdropContract;
  let tokenCreateContract;
  let erc20Contract;
  let erc721Contract;
  let signers;
  let owner;
  let receiver;
  let contractAddresses;

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    claimAirdropContract = await utils.deployContract(
      Constants.Contract.ClaimAirdrop,
    );

    tokenCreateContract = await utils.deployContract(
      Constants.Contract.TokenCreateContract,
    );
    erc20Contract = await utils.deployContract(
      Constants.Contract.ERC20Contract,
    );
    erc721Contract = await utils.deployContract(
      Constants.Contract.ERC721Contract,
    );
    contractAddresses = [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await claimAirdropContract.getAddress(),
    ];

    owner = ethers.getAddress(
      (await hapi.createAccountWithContractIdKey(contractAddresses)).address,
    );
    receiver = ethers.getAddress(
      (await hapi.createAccountWithContractIdKey(contractAddresses)).address,
    );

    await utils.setupToken(tokenCreateContract, owner, contractAddresses, hapi);

    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi,
    );
    const signer1AccountFacade = new ethers.Contract(
      signers[1].address,
      IHRC904AccountFacade,
      signers[1],
    );
    await (
      await signer1AccountFacade.setUnlimitedAutomaticAssociations(
        true,
        Constants.GAS_LIMIT_2_000_000,
      )
    ).wait();
  });

  after(function () {
    hapi.client.close();
  });

  it('should claim a single pending fungible token airdrop', async function () {
    const ftAmount = BigInt(1);
    const sender = owner;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const initialBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver,
    );

    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      sender,
      receiver,
      ftAmount,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );
    await airdropTx.wait();

    await tokenCreateContract.associateTokenPublic(
      receiver,
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000,
    );
    const claimTx = await claimAirdropContract.claim(
      sender,
      receiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000,
    );
    await claimTx.wait();

    const updatedBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver,
    );
    expect(updatedBalance).to.equal(initialBalance + ftAmount);
  });

  it('should claim a single pending NFT airdrop', async function () {
    const sender = owner;
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const serialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiver,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );
    await airdropTx.wait();

    const claimTx = await claimAirdropContract.claimNFTAirdrop(
      sender,
      receiver,
      nftTokenAddress,
      serialNumber,
      Constants.GAS_LIMIT_2_000_000,
    );
    await claimTx.wait();

    const nftOwner = await erc721Contract.ownerOf(
      nftTokenAddress,
      serialNumber,
    );
    expect(nftOwner).to.equal(receiver);
  });

  it('should claim multiple pending fungible token airdrops', async function () {
    const { senders, receivers, tokens, serials, amounts } =
      await utils.createPendingAirdrops(
        10,
        tokenCreateContract,
        owner,
        airdropContract,
        receiver,
        hapi,
      );

    const initialBalances = await Promise.all(
      tokens.map((token) => erc20Contract.balanceOf(token, receiver)),
    );

    for (const token of tokens) {
      await tokenCreateContract.associateTokenPublic(
        receiver,
        token,
        Constants.GAS_LIMIT_1_000_000,
      );
    }

    const claimTx = await claimAirdropContract.claimMultipleAirdrops(
      senders,
      receivers,
      tokens,
      serials,
      Constants.GAS_LIMIT_10_000_000,
    );
    await claimTx.wait();

    for (let i = 0; i < tokens.length; i++) {
      const updatedBalance = await erc20Contract.balanceOf(tokens[i], receiver);
      expect(updatedBalance).to.equal(initialBalances[i] + amounts[i]);
    }
  });

  it('should fail to claim airdrops when sender has no pending airdrops', async function () {
    const sender = signers[1].address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const tx = await claimAirdropContract.claim(
      sender,
      receiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim airdrops when sender does not have a valid account', async function () {
    const invalidSender = ethers.Wallet.createRandom().address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const tx = await claimAirdropContract.claim(
      invalidSender,
      receiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim airdrops when receiver does not have a valid account', async function () {
    const invalidReceiver = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const tx = await claimAirdropContract.claim(
      owner,
      invalidReceiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('15'); // INVALID_ACCOUNT_ID code
  });

  it('should fail to claim more than 10 pending airdrops at once', async function () {
    const { senders, receivers, tokens, serials } =
      await utils.createPendingAirdrops(
        11,
        tokenCreateContract,
        owner,
        airdropContract,
        receiver,
        hapi,
      );

    for (const token of tokens) {
      await tokenCreateContract.associateTokenPublic(
        receiver,
        token,
        Constants.GAS_LIMIT_1_000_000,
      );
    }

    const tx = await claimAirdropContract.claimMultipleAirdrops(
      senders,
      receivers,
      tokens,
      serials,
      Constants.GAS_LIMIT_10_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('PENDING_AIRDROP_ID_LIST_TOO_LONG');
  });

  it('should fail to claim airdrops when token does not exist', async function () {
    const nonExistentToken = '0x1234567890123456789012345678901234567890';

    const tx = await claimAirdropContract.claim(
      owner,
      receiver,
      nonExistentToken,
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('INVALID_TOKEN_ID');
  });

  it('should fail to claim airdrops when NFT does not exist', async function () {
    const nonExistentNft = '0x1234567890123456789012345678901234567890';

    const tx = await claimAirdropContract.claimNFTAirdrop(
      owner,
      receiver,
      nonExistentNft,
      1,
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('INVALID_TOKEN_ID');
  });

  it('should fail to claim airdrops when NFT serial number does not exist', async function () {
    const sender = owner;
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );
    const nonExistentSerialNumber = 999;

    const serialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiver,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );
    await airdropTx.wait();

    const tx = await claimAirdropContract.claimNFTAirdrop(
      owner,
      receiver,
      nftTokenAddress,
      nonExistentSerialNumber,
      Constants.GAS_LIMIT_2_000_000,
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail with `SENDER_DOES_NOT_OWN_NFT_SERIAL_NO` when contract airdrops multiple duplicated NFT tokens to an account with max auto associations enable', async function () {
    const sender = owner;
    const receiverTemp = signers[1].address;

    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const serialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiverTemp,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );
    await airdropTx.wait();

    const airdropTx2 = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiverTemp,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );

    await expect(airdropTx2.wait()).to.be.rejectedWith(
      'transaction execution reverted',
    );
    expect(await Utils.getHTSResponseCode(airdropTx2.hash)).to.equal('237'); // SENDER_DOES_NOT_OWN_NFT_SERIAL_NO
  });

  it('should fail with `PENDING_NFT_AIRDROP_ALREADY_EXISTS` when contract airdrops multiple duplicated NFT tokens to an account with max auto associations disabled', async function () {
    const sender = owner;
    const receiverTemp = receiver;

    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const serialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress,
    );

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiverTemp,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );
    await airdropTx.wait();

    const airdropTx2 = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiverTemp,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );

    await expect(airdropTx2.wait()).to.be.rejectedWith(
      'transaction execution reverted',
    );
    expect(await Utils.getHTSResponseCode(airdropTx2.hash)).to.equal('364'); // PENDING_NFT_AIRDROP_ALREADY_EXISTS
  });

  it('should fail to airdrop a token to themselves', async function () {
    const ftAmount = BigInt(1);
    const sender = owner;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      sender,
      sender,
      ftAmount,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );

    await expect(airdropTx.wait()).to.be.rejectedWith(
      'transaction execution reverted',
    );
    expect(await Utils.getHTSResponseCode(airdropTx.hash)).to.equal('74'); // ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS
  });

  it('should be possible to delete the contract if it is the receiver of the pending airdrop', async function () {
    const sampleContractFactory = await ethers.getContractFactory(
      Constants.Contract.Sample,
    );
    const sampleContract = await sampleContractFactory.deploy();
    await sampleContract.waitForDeployment();

    const ftAmount = BigInt(5);
    const sender = owner;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      sender,
      sampleContract.target,
      ftAmount,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000,
      },
    );
    await airdropTx.wait();

    const deleteTx = await sampleContract.selfDestructSample();
    await deleteTx.wait();
    const cr = await Utils.getContractResultFromMN(deleteTx.hash);
    expect(cr.error_message).to.be.null;
  });

  it('should fail to airdrop Number.MAX_SAFE_INTEGER + 1 tokens', async function () {
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses,
      hapi,
    );

    await expect(
      airdropContract.tokenAirdrop(
        tokenAddress,
        owner,
        receiver,
        Number.MAX_SAFE_INTEGER + 1,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000,
        },
      ),
    ).to.be.rejectedWith('overflow');
  });
});
