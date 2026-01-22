import hre from 'hardhat';
import { AccountId, Client,   AccountUpdateTransaction,
  ContractId,
  KeyList,
  PrivateKey, TokenUpdateTransaction, TokenId, TokenGrantKycTransaction
} from '@hashgraph/sdk';
const connection = await hre.network.connect();
import { config } from '../config.js';
const network = config.networks[connection.networkName];
import utils from './utils';
class Hapi {
  client;
  config;
  constructor() {
    this.config = network.sdkClient;
    const hederaNetwork = {};
    hederaNetwork[this.config.networkNodeUrl] = AccountId.fromString(this.config.nodeId);
    this.client = Client.forNetwork(hederaNetwork)
      .setMirrorNetwork(this.config.mirrorNode)
      .setOperator(this.config.operatorId, this.config.operatorKey)
    ;
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
      const accountId = await utils.getAccountId(
        pkSigner.publicKey.toEvmAddress(),
        this.client
      );
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
    this.client.setOperator(this.config.operatorId, this.config.operatorKey);
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
    const signers = await connection.ethers.getSigners();
    const pkSigners = (await utils.getHardhatSignersPrivateKeys()).map((pk) =>
      PrivateKey.fromStringECDSA(pk)
    );
    const accountIdSigner0 = await utils.getAccountId(
      signers[0].address,
      this.client
    );

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
    this.client.setOperator(this.config.operatorId, this.config.operatorKey);
  }
}

export default Hapi;
