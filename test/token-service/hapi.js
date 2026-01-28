const hre = require('hardhat');
const {
  AccountId,
  Client,
  AccountUpdateTransaction,
  ContractId,
  KeyList,
  PrivateKey,
  TokenUpdateTransaction,
  TokenId,
  AccountInfoQuery,
  AccountBalanceQuery,
  TokenAssociateTransaction
} = require('@hashgraph/sdk');
const utils = require('./utils');
const config = hre.config.networks[hre.network.name].sdkClient;

class Hapi {
  _client;

  get client() {
    if (this._client && !this._client.isClientShutDown) return this._client;
    const hederaNetwork = {};
    hederaNetwork[config.networkNodeUrl] = AccountId.fromString(config.nodeId);
    this._client = Client.forNetwork(hederaNetwork)
        .setMirrorNetwork(config.mirrorNode)
        .setOperator(config.operatorId, config.operatorKey)
    ;
    return this._client;
  }

  async updateAccountKeys(
    contractAddresses,
    ecdsaPrivateKeys = []
  ) {
    if (!ecdsaPrivateKeys.length) {
      ecdsaPrivateKeys = await utils.getHardhatSignersPrivateKeys(false);
    }
    for (const privateKey of ecdsaPrivateKeys) {
      const pkSigner = PrivateKey.fromStringECDSA(privateKey.replace('0x', ''));
      const accountId = await this.getAccountId(pkSigner.publicKey.toEvmAddress());
      this.client.setOperator(accountId, pkSigner);

      const keyList = new KeyList(
        [
          pkSigner.publicKey,
          ...contractAddresses.map((address) =>
            ContractId.fromEvmAddress(0, 0, address)
          ),
        ],
        1
      );
      await (
        await new AccountUpdateTransaction()
          .setAccountId(accountId)
          .setKey(keyList)
          .freezeWith(this.client)
          .sign(pkSigner)
      ).execute(this.client);
    }
    this.client.setOperator(config.operatorId, config.operatorKey);
  }

  async updateTokenKeys(
    tokenAddress,
    contractAddresses,
    setAdmin = true,
    setPause = true,
    setKyc = true,
    setFreeze = true,
    setSupply = true,
    setWipe = true,
    setFeeSchedule = true
  ) {
    const signers = await hre.ethers.getSigners();
    const pkSigners = (await utils.getHardhatSignersPrivateKeys()).map((pk) =>
      PrivateKey.fromStringECDSA(pk)
    );
    const accountIdSigner0 = await this.getAccountId(signers[0].address);

    this.client.setOperator(accountIdSigner0, pkSigners[0]);

    const keyList = new KeyList(
      [
        ...pkSigners.map((pk) => pk.publicKey),
        ...contractAddresses.map((address) =>
          ContractId.fromEvmAddress(0, 0, address)
        ),
      ],
      1
    );

    const tx = new TokenUpdateTransaction().setTokenId(
      TokenId.fromSolidityAddress(tokenAddress)
    );
    if (setAdmin) tx.setAdminKey(keyList);
    if (setPause) tx.setPauseKey(keyList);
    if (setKyc) tx.setKycKey(keyList);
    if (setFreeze) tx.setFreezeKey(keyList);
    if (setSupply) tx.setSupplyKey(keyList);
    if (setWipe) tx.setWipeKey(keyList);
    if (setFeeSchedule) tx.setFeeScheduleKey(keyList);

    await (
      await tx.freezeWith(this.client).sign(pkSigners[0])
    ).execute(this.client);
    this.client.setOperator(config.operatorId, config.operatorKey);
  }

  async getAccountBalance(address) {
    const accountId = await this.getAccountId(address);
    return await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(this.client);
  }

  async getAccountId(evmAddress) {
    const query = new AccountInfoQuery().setAccountId(
        AccountId.fromEvmAddress(0, 0, evmAddress)
    );

    const accountInfo = await query.execute(this.client);
    return accountInfo.accountId.toString();
  }

  async getAccountInfo(evmAddress) {
    const query = new AccountInfoQuery().setAccountId(
        AccountId.fromEvmAddress(0, 0, evmAddress)
    );

    return await query.execute(this.client);
  }

  async associateWithSigner(privateKey, tokenAddress) {
    const wallet = new hre.ethers.Wallet(privateKey);
    const accountIdAsString = await this.getAccountId(
        wallet.address
    );
    const signerPk = PrivateKey.fromStringECDSA(wallet.signingKey.privateKey);

    const signerClient = this.client.setOperator(
        accountIdAsString,
        signerPk.toString() // DER encoded
    );

    const transaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountIdAsString))
        .setTokenIds([TokenId.fromSolidityAddress(tokenAddress)])
        .freezeWith(signerClient);

    const signTx = await transaction.sign(signerPk);
    const txResponse = await signTx.execute(signerClient);
    await txResponse.getReceipt(signerClient);

    this.client.setOperator(config.operatorId, config.operatorKey);
  }

  async getHbarBalance(address) {
    const { hbars } = (await this.getAccountBalance(address)).toJSON();
    return parseFloat(hbars);
  }

  async getTokenBalance(accountAddress, tokenAddress) {
    const accountBalanceJson = (
        await this.getAccountBalance(accountAddress)
    ).toJSON();
    const tokenId = await AccountId.fromEvmAddress(
        0,
        0,
        tokenAddress
    ).toString();
    const { balance } = accountBalanceJson.tokens.find(
        (e) => e.tokenId === tokenId
    );

    return parseInt(balance);
  }
}

module.exports = new Hapi();
