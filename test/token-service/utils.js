// SPDX-License-Identifier: Apache-2.0

import hre from 'hardhat';
const { ethers, networkName } = await hre.network.connect();
import {
  AccountId,
  Hbar,
  HbarUnit,
  ScheduleCreateTransaction,
  Timestamp,
  TransferTransaction,
} from '@hashgraph/sdk';
import axios from 'axios';
import { expect } from 'chai';

import { config } from '../config.js';
import Constants from '../constants';

class Utils {
  static createTokenCost = '50000000000000000000';
  static createTokenCustomFeesCost = '60000000000000000000';
  static tinybarToWeibarCoef = 10_000_000_000;
  static tinybarToHbarCoef = 100_000_000;
  static initialSupply = 1000000000000;
  static maxSupply = 2000000000000;
  static nftMaxSupply = 20000;

  static KeyType = {
    ADMIN: 1,
    KYC: 2,
    FREEZE: 4,
    WIPE: 8,
    SUPPLY: 16,
    FEE: 32,
    PAUSE: 64,
  };

  static KeyValueType = {
    INHERIT_ACCOUNT_KEY: 0,
    CONTRACT_ID: 1,
    ED25519: 2,
    SECP256K1: 3,
    DELEGETABLE_CONTRACT_ID: 4,
  };

  static async deployContract(
    contractPath,
    gasLimit = Constants.GAS_LIMIT_5_000_000,
  ) {
    const factory = await ethers.getContractFactory(contractPath);
    const contract = await factory.deploy(gasLimit);

    return await ethers.getContractAt(
      contractPath,
      await contract.getAddress(),
    );
  }

  static getMirrorNodeUrl(network) {
    switch (network) {
      case 'mainnet':
        return 'https://mainnet.mirrornode.hedera.com/api/v1';
      case 'testnet':
        return 'https://testnet.mirrornode.hedera.com/api/v1';
      case 'previewnet':
        return 'https://previewnet.mirrornode.hedera.com/api/v1';
      case 'local':
        return 'http://127.0.0.1:5551/api/v1';
      default:
        throw new Error('Unknown network');
    }
  }

  static async deployTokenCreateContract() {
    return await this.deployContract(Constants.Contract.TokenCreateContract);
  }

  static async deployTokenCreateCustomContract() {
    return await this.deployContract(
      Constants.Contract.TokenCreateCustomContract,
    );
  }

  static async deployTokenManagementContract() {
    return await this.deployContract(
      Constants.Contract.TokenManagementContract,
    );
  }

  static async deployTokenQueryContract() {
    return await this.deployContract(Constants.Contract.TokenQueryContract);
  }

  static async deployTokenTransferContract() {
    return await this.deployContract(Constants.Contract.TokenTransferContract);
  }

  static async deployHRC719Contract() {
    return await this.deployContract(Constants.Contract.HRC719Contract);
  }

  static async deployERC20Contract() {
    return await this.deployContract(Constants.Contract.ERC20Contract);
  }

  static async deployERC721Contract() {
    return await this.deployContract(Constants.Contract.ERC721Contract);
  }

  static async getTokenAddress(tx) {
    const receipt = await tx.wait();
    const { tokenAddress } = receipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.CreatedToken,
    )[0].args;

    return tokenAddress;
  }

  static async createFungibleToken(contract, treasury) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenPublic(treasury, {
        value: BigInt(this.createTokenCost),
        gasLimit: 1_000_000,
      }),
    );
  }

  static async createFungibleTokenWithPresetKeysPublic(
    contract,
    name,
    symbol,
    memo,
    initialSupply,
    maxSupply,
    decimals,
    freezeDefaultStatus,
    treasury,
  ) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithPresetKeys(
        name,
        symbol,
        memo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        treasury,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        },
      ),
    );
  }

  static async createFungibleTokenPublic(
    tokenName,
    tokenSymbol,
    tokenMemo,
    initialSupply,
    maxSupply,
    decimals,
    freezeDefaultStatus,
    signerAddress,
    keys,
    contract,
  ) {
    const tokenAddress = (
      await (
        await contract.createFungibleTokenPublic(
          tokenName,
          tokenSymbol,
          tokenMemo,
          initialSupply,
          maxSupply,
          decimals,
          freezeDefaultStatus,
          signerAddress,
          keys,
          {
            value: '35000000000000000000',
            gasLimit: 1_000_000,
          },
        )
      ).wait()
    ).logs.filter((e) => e.fragment.name === Constants.Events.CreatedToken)[0]
      .args.tokenAddress;

    return tokenAddress;
  }

  static async createFungibleTokenWithSECP256K1AdminKey(
    contract,
    treasury,
    adminKey,
  ) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithSECP256K1AdminKeyPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        },
      ),
    );
  }

  static async createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
    contract,
    treasury,
    adminKey,
  ) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithSECP256K1AdminKeyWithoutKYCPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        },
      ),
    );
  }

  static async createFungibleTokenWithCustomFees(contract, feeTokenAddress) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithCustomFeesPublic(
        await contract.getAddress(),
        feeTokenAddress,
        {
          value: BigInt(this.createTokenCustomFeesCost),
          gasLimit: 10_000_000,
        },
      ),
    );
  }

  // Helper function to associate and grant KYC
  static async associateAndGrantKyc(contract, token, addresses) {
    for (const address of addresses) {
      const associateTx = await contract.associateTokenPublic(address, token);
      await associateTx.wait(); // Ensure the association is completed before proceeding

      const grantKycTx = await contract.grantTokenKycPublic(token, address);
      await grantKycTx.wait(); // Ensure the KYC grant is completed before proceeding
    }
  }

  static async createFungibleTokenWithCustomFeesAndKeys(
    contract,
    treasury,
    fixedFees,
    fractionalFees,
    keys,
  ) {
    const updateFeesTx = await contract.createFungibleTokenWithCustomFeesPublic(
      treasury,
      'Hedera Token Fees',
      'HTF',
      'Hedera Token With Fees',
      this.initialSupply,
      this.maxSupply,
      0,
      fixedFees,
      fractionalFees,
      keys,
      {
        value: BigInt(this.createTokenCost),
        gasLimit: 1_000_000,
      },
    );
    return await this.getTokenAddress(updateFeesTx);
  }

  static async createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
    contract,
    treasury,
    fixedFees,
    royaltyFees,
    keys,
  ) {
    return await this.getTokenAddress(
      await contract.createNonFungibleTokenWithCustomFeesPublic(
        treasury,
        'Non Fungible Token With Custom Fees',
        'NFTF',
        'Non Fungible Token With Custom Fees',
        this.nftMaxSupply,
        fixedFees,
        royaltyFees,
        keys,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        },
      ),
    );
  }

  static async createNonFungibleToken(contract, treasury) {
    const tokenAddressTx = await contract.createNonFungibleTokenPublic(
      treasury,
      {
        value: BigInt(this.createTokenCost),
        gasLimit: 1_000_000,
      },
    );
    return await this.getTokenAddress(tokenAddressTx);
  }

  static async createNonFungibleTokenWithoutKYC(contract, treasury) {
    const tokenAddressTx =
      await contract.createNonFungibleTokenWithoutKYCPublic(treasury, {
        value: BigInt(this.createTokenCost),
        gasLimit: 1_000_000,
      });
    return await this.getTokenAddress(tokenAddressTx);
  }

  static async createNonFungibleTokenWithSECP256K1AdminKey(
    contract,
    treasury,
    adminKey,
  ) {
    return await this.getTokenAddress(
      await contract.createNonFungibleTokenWithSECP256K1AdminKeyPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        },
      ),
    );
  }

  static async createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
    contract,
    treasury,
    adminKey,
  ) {
    return await this.getTokenAddress(
      await contract.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYCPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        },
      ),
    );
  }

  static hexToASCII(str) {
    const hex = str.toString();
    let ascii = '';
    for (let n = 0; n < hex.length; n += 2) {
      ascii += String.fromCharCode(parseInt(hex.substring(n, n + 2), 16));
    }
    return ascii;
  }

  /**
   * Converts an EVM ErrorMessage to a readable form. For example this :
   * 0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d53657420746f2072657665727400000000000000000000000000000000000000
   * will be converted to "Set to revert"
   * @param message
   */
  static decodeErrorMessage(message) {
    const EMPTY_HEX = '0x';
    if (!message) return '';

    // If the message does not start with 0x, it is not an error message, return it as is
    if (!message.includes(EMPTY_HEX)) return message;

    message = message.replace(/^0x/, ''); // Remove the starting 0x
    const strLen = parseInt(message.slice(8 + 64, 8 + 128), 16); // Get the length of the readable text
    const resultCodeHex = message.slice(8 + 128, 8 + 128 + strLen * 2); // Extract the hex of the text
    return this.hexToASCII(resultCodeHex);
  }

  static async getRevertReasonFromReceipt(hash) {
    const receipt = await ethers.provider.send('eth_getTransactionReceipt', [
      hash,
    ]);

    return receipt.revertReason;
  }

  static async getSerialNumbers(mintNftTx) {
    const tokenAddressReceipt = await mintNftTx.wait();
    const { serialNumbers } = tokenAddressReceipt.logs.filter(
      (e) => e.fragment?.name === Constants.Events.MintedToken,
    )[0].args;

    return parseInt(serialNumbers);
  }

  static async mintNFT(contract, nftTokenAddress, data = ['0x01']) {
    const mintNftTx = await contract.mintTokenPublic(
      nftTokenAddress,
      0,
      data,
      Constants.GAS_LIMIT_1_000_000,
    );

    return await this.getSerialNumbers(mintNftTx);
  }

  static async mintNFTToAddress(contract, nftTokenAddress, data = ['0x01']) {
    const mintNftTx = await contract.mintTokenToAddressPublic(
      nftTokenAddress,
      0,
      data,
      Constants.GAS_LIMIT_1_000_000,
    );

    return await this.getSerialNumbers(mintNftTx);
  }

  // Add Token association via hedera.js sdk
  // Client with signer - my private key example

  static async associateToken(contract, tokenAddress) {
    await contract.associateTokenPublic(
      await contract.getAddress(),
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000,
    );
  }

  // Grants KYC to the calling contract only. KYC can only be granted to an
  // account already associated with the token, and the signers are no longer
  // associated through the contract — that needed their keys to include it.
  // These calls carry no explicit gas limit, so ethers estimates gas first and
  // any revert surfaces immediately instead of being swallowed. Callers that
  // need KYC for other accounts associate and grant those explicitly.
  static async grantTokenKyc(contract, tokenAddress) {
    await contract.grantTokenKycPublic(
      tokenAddress,
      await contract.getAddress(),
    );
  }

  static async expectToFail(transaction, code = null) {
    try {
      const result = await transaction;
      await result.wait();
      expect(true).to.eq(false);
    } catch (e) {
      expect(e).to.exist;
      if (code) {
        expect(e.code).to.eq(code);
      }
    }
  }

  static getSignerCompressedPublicKey(
    index = 0,
    asBuffer = true,
    prune0x = true,
  ) {
    const wallet = new ethers.Wallet(
      config.networks[networkName].accounts[index],
    );
    const cpk = prune0x
      ? wallet.signingKey.compressedPublicKey.replace('0x', '')
      : wallet.signingKey.compressedPublicKey;

    return asBuffer ? Buffer.from(cpk, 'hex') : cpk;
  }

  static async getHardhatSignersPrivateKeys(add0xPrefix = true) {
    return config.networks[networkName].accounts.map((pk) =>
      add0xPrefix ? pk : pk.replace('0x', ''),
    );
  }

  static getHardhatSignerPrivateKeyByIndex(index = 0) {
    return config.networks[networkName].accounts[index];
  }

  static convertAccountIdToLongZeroAddress(accountId, prepend0x = false) {
    const address = AccountId.fromString(accountId).toSolidityAddress();

    return prepend0x ? '0x' + address : address;
  }

  static defaultKeyValues = {
    inheritAccountKey: false,
    contractId: ethers.ZeroAddress,
    ed25519: Buffer.from('', 'hex'),
    ECDSA_secp256k1: Buffer.from('', 'hex'),
    delegatableContractId: ethers.ZeroAddress,
  };

  /**
   * @dev Constructs a key conforming to the IHederaTokenService.TokenKey type
   *
   * @param keyType ADMIN | KYC | FREEZE | WIPE | SUPPLY | FEE | PAUSE
   *                See https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/token-service/IHederaTokenService.sol#L128
   *                for more information
   *
   * @param keyValueType INHERIT_ACCOUNT_KEY | CONTRACT_ID | ED25519 | SECP256K1 | DELEGETABLE_CONTRACT_ID
   *
   * @param value bytes value, public address of an account, or boolean
   *            See https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/token-service/IHederaTokenService.sol#L92
   *                     for more information
   */
  static constructIHederaTokenKey(keyType, keyValueType, value) {
    // sanitize params
    if (
      keyType !== 'ADMIN' &&
      keyType !== 'KYC' &&
      keyType !== 'FREEZE' &&
      keyType !== 'WIPE' &&
      keyType !== 'SUPPLY' &&
      keyType !== 'FEE' &&
      keyType !== 'PAUSE'
    ) {
      return;
    }

    switch (keyValueType) {
      case 'INHERIT_ACCOUNT_KEY':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, inheritAccountKey: value },
        };
      case 'CONTRACT_ID':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, contractId: value },
        };
      case 'ED25519':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, ed25519: value },
        };
      case 'SECP256K1':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, ECDSA_secp256k1: value },
        };
      case 'DELEGETABLE_CONTRACT_ID':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, delegatableContractId: value },
        };
      default:
        return;
    }
  }

  /**
   * This method fetches the transaction actions from the mirror node corresponding to the current network,
   * filters the actions to find the one directed to the Hedera Token Service (HTS) system contract,
   * and extracts the result data from the precompile action. The result data is converted from a BigInt
   * to a string before being returned.
   *
   * @param {string} txHash - The transaction hash to query.
   * @returns {Promise<string>} - The response code as a string.
   */
  /**
   * Reads a system contract's response code out of a transaction's mirror node
   * action tree.
   *
   * Two shapes are both normal, depending on how the precompile was reached:
   *   - through a contract: the tree has a child action addressed to the system
   *     contract, matched here by entity id (`recipient`) or EVM address (`to`).
   *   - directly through a token/account facade (IHRC719, IHRC904, IHRC906): on
   *     consensus v0.77 there is no child action for the system contract at all.
   *     The single depth-0 action — whose recipient is the token itself, or null
   *     for an account facade — carries the response code.
   * So fall through to the innermost action carrying result_data. For the
   * contract case that is the same system-contract action the match found, and
   * the exact codes callers assert on (22 / 178 / 196 / 354 / 367) mean a wrong
   * pick fails the assertion rather than passing silently.
   *
   * @param {string} txHash - The transaction hash to query.
   * @param {string} entityId - System contract entity id, e.g. '0.0.359'.
   * @param {string} evmAddress - The same contract's long-zero EVM address.
   * @returns {Promise<string>} - The response code as a string.
   */
  static async getSystemContractResponseCode(txHash, entityId, evmAddress) {
    const mirrorNodeUrl = Utils.getMirrorNodeUrl(networkName);
    const target = evmAddress.toLowerCase();
    const url = `${mirrorNodeUrl}/contracts/results/${txHash}/actions`;
    let actions = [];
    for (let attempt = 0; attempt < 5 && !actions.length; attempt++) {
      if (attempt) await Utils.sleep(1000);
      const res = await Utils.retriedGetRequest(url);
      actions = res.data?.actions ?? [];
    }

    const precompileAction = actions.find(
      (x) => x.recipient === entityId || (x.to ?? '').toLowerCase() === target,
    );
    if (precompileAction?.result_data != null) {
      return BigInt(precompileAction.result_data).toString();
    }

    const innermost = actions
      .filter((x) => x.result_data != null)
      .sort((a, b) => (b.call_depth ?? 0) - (a.call_depth ?? 0))[0];
    if (!innermost) {
      throw new Error(
        `No action carrying result_data for ${txHash}; actions=${JSON.stringify(actions)}`,
      );
    }
    return BigInt(innermost.result_data).toString();
  }

  static async getHTSResponseCode(txHash) {
    return Utils.getSystemContractResponseCode(
      txHash,
      Constants.HTS_SYSTEM_CONTRACT_ID,
      Constants.HTS_SYSTEM_CONTRACT_ADDRESS,
    );
  }

  /**
   * This method fetches the transaction contract results from the mirror node corresponding to the current network. The
   * response contains extra information that can not be gathered by `eth_getTransactionReceipt` and that might be
   * needed for test assertions (e.g., revert messages).
   *
   * @param txHash - The transaction hash to query.
   * @returns {Promise<any>} - The response from the MN.
   */
  static async getContractResultFromMN(txHash) {
    const res = await axios.get(
      `${Utils.getMirrorNodeUrl(networkName)}/contracts/results/${txHash}`,
    );

    return res.data;
  }

  static async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async retriedGetRequest(
    url,
    maxAttempts = 30,
    intervalMs = 1000,
    attempt = 0,
  ) {
    try {
      return await axios.get(url);
    } catch (e) {
      if (attempt >= maxAttempts) throw e;
      await Utils.sleep(intervalMs);
      return Utils.retriedGetRequest(url, maxAttempts, intervalMs, ++attempt);
    }
  }

  /**
   * This method fetches the transaction actions from the mirror node corresponding to the current network,
   * filters the actions to find the one directed to the Hedera Account Service (HAS) system contract,
   * and extracts the result data from the precompile action. The result data is converted from a BigInt
   * to a string before being returned.
   *
   * @param {string} txHash - The transaction hash to query.
   * @returns {string} - The response code as a string.
   */
  static async getHASResponseCode(txHash) {
    return Utils.getSystemContractResponseCode(
      txHash,
      Constants.HAS_SYSTEM_CONTRACT_ID,
      Constants.HAS_SYSTEM_CONTRACT_ADDRESS,
    );
  }

  static async setupNft(tokenCreateContract, owner, contractAddresses, hapi) {
    const nftTokenAddress =
      await this.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        this.getSignerCompressedPublicKey(),
      );

    await hapi.updateTokenKeys(
      nftTokenAddress,
      contractAddresses,
      true,
      true,
      false,
      true,
      true,
      true,
      false,
    );

    await tokenCreateContract.associateTokenPublic(
      await tokenCreateContract.getAddress(),
      nftTokenAddress,
      Constants.GAS_LIMIT_1_000_000,
    );

    return nftTokenAddress;
  }

  static async setupToken(tokenCreateContract, owner, contractAddresses, hapi) {
    const tokenAddress =
      await this.createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        this.getSignerCompressedPublicKey(),
      );

    await hapi.updateTokenKeys(
      tokenAddress,
      contractAddresses,
      true,
      true,
      false,
      true,
      true,
      true,
      false,
    );

    await tokenCreateContract.associateTokenPublic(
      await tokenCreateContract.getAddress(),
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000,
    );

    return tokenAddress;
  }

  /**
   * Creates multiple pending airdrops for testing purposes
   * @param {Contract} airdropContract - The airdrop contract instance
   * @param {string} owner - The owner's address
   * @param {Contract} tokenCreateContract - The token create contract instance
   * @param {number} count - Number of pending airdrops to create
   * @param {string} receiver - Airdrop receive address
   * @param {Hapi} hapi - Hapi client
   * @returns {Object} Object containing arrays of senders, receivers, tokens, serials, and amounts
   */
  static async createPendingAirdrops(
    count,
    tokenCreateContract,
    owner,
    airdropContract,
    receiver,
    hapi,
  ) {
    const senders = [];
    const receivers = [];
    const tokens = [];
    const serials = [];
    const amounts = [];

    for (let i = 0; i < count; i++) {
      const tokenAddress = await this.setupToken(
        tokenCreateContract,
        owner,
        [await airdropContract.getAddress()],
        hapi,
      );
      const ftAmount = BigInt(i + 1); // Different amount for each airdrop

      const airdropTx = await airdropContract.tokenAirdrop(
        tokenAddress,
        owner,
        receiver,
        ftAmount,
        {
          value: Constants.ONE_HBAR,
          gasLimit: 2_000_000,
        },
      );
      await airdropTx.wait();

      senders.push(owner);
      receivers.push(receiver);
      tokens.push(tokenAddress);
      serials.push(0); // 0 for fungible tokens
      amounts.push(ftAmount);
    }

    return { senders, receivers, tokens, serials, amounts };
  }

  static getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  static createScheduleTransactionForTransfer = async (
    senderInfo,
    receiverInfo,
    client,
    adminPrivateKey = null,
    expiryNs = 0,
  ) => {
    const transferAmountAsTinybars = this.getRandomInt(1, 100_000_000);
    const transferAmountAsWeibar =
      BigInt(transferAmountAsTinybars) * BigInt(Utils.tinybarToWeibarCoef);

    const transferTx = await new TransferTransaction()
      .addHbarTransfer(
        senderInfo.accountId,
        new Hbar(-transferAmountAsTinybars, HbarUnit.Tinybar),
      )
      .addHbarTransfer(
        receiverInfo.accountId,
        new Hbar(transferAmountAsTinybars, HbarUnit.Tinybar),
      );

    const tx = new ScheduleCreateTransaction().setScheduledTransaction(
      transferTx,
    );

    if (expiryNs) {
      const timestamp = Timestamp.generate().plusNanos(expiryNs);
      tx.setExpirationTime(timestamp);
      tx.setWaitForExpiry(true);
    }

    if (adminPrivateKey) {
      tx.setAdminKey(adminPrivateKey.publicKey);
    }

    const { scheduleId } = await (await tx.execute(client)).getReceipt(client);

    return { scheduleId, transferAmountAsWeibar };
  };

  /**
   * Retrieves the maximum number of automatic token associations for an account from the mirror node
   * @param {string} evmAddress - The EVM address of the account to query
   * @returns {Promise<number>} Returns:
   *  - -1 if unlimited automatic associations are enabled
   *  - 0 if automatic associations are disabled
   *  - positive number for the maximum number of automatic associations allowed
   * @throws {Error} If there was an error fetching the data from mirror node
   */
  static async getMaxAutomaticTokenAssociations(evmAddress) {
    const mirrorNodeUrl = Utils.getMirrorNodeUrl(networkName);
    const response = await axios.get(`${mirrorNodeUrl}/accounts/${evmAddress}`);
    return response.data.max_automatic_token_associations;
  }

  static decimalToAscii(decimalStr) {
    const hex = BigInt(decimalStr).toString(16);
    return Buffer.from(hex, 'hex').toString('ascii');
  }
}

export default Utils;
