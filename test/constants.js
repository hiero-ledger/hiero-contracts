// SPDX-License-Identifier: Apache-2.0

const Events = {
  Success: 'success',
  ResponseCode: 'ResponseCode',
  AllowanceValue: 'AllowanceValue',
  ApprovedAddress: 'ApprovedAddress',
  Approved: 'Approved',
  Frozen: 'Frozen',
  KycGranted: 'KycGranted',
  TokenCustomFees: 'TokenCustomFees',
  TokenDefaultFreezeStatus: 'TokenDefaultFreezeStatus',
  TokenDefaultKycStatus: 'TokenDefaultKycStatus',
  TokenExpiryInfo: 'TokenExpiryInfo',
  FungibleTokenInfo: 'FungibleTokenInfo',
  TokenInfo: 'TokenInfo',
  TokenKey: 'TokenKey',
  NonFungibleTokenInfo: 'NonFungibleTokenInfo',
  IsToken: 'IsToken',
  TokenType: 'TokenType',
  Approval: 'Approval',
  ApprovalForAll: 'ApprovalForAll',
  TokenCreated: 'TokenCreated',
  TokenCreatedEvent: 'tokenCreatedEvent',
  TokenInfoEvent: 'TokenInfoEvent',
  FungibleTokenInfoEvent: 'FungibleTokenInfoEvent',
  NftMinted: 'NftMinted',
  PausedToken: 'PausedToken',
  UnpausedToken: 'UnpausedToken',
  CreatedToken: 'CreatedToken',
  TransferToken: 'TransferToken',
  MintedToken: 'MintedToken',
  CallResponseEvent: 'CallResponseEvent',
  GetTokenInfo: 'GetTokenInfo',
  MintedNft: 'MintedNft',
  GetFungibleTokenInfo: 'GetFungibleTokenInfo',
  GetNonFungibleTokenInfo: 'GetNonFungibleTokenInfo',
  TinyBars: 'TinyBars',
  TinyCents: 'TinyCents',
  PseudoRandomSeed: 'PseudoRandomSeed',
  CryptoAllowance: 'CryptoAllowance',
  IsAssociated: 'IsAssociated',
};

const Path = {
  BLOCK_INFO: 'contracts/solidity/block/BlockInfo.sol:BlockInfo',
  CRYPTO_MATH: 'contracts/solidity/cryptomath/CryptoMath.sol:CryptoMath',
  HRC: 'contracts/hrc/HRC.sol:HRC',
  TYPE_OPS: 'contracts/solidity/typeops/TypeOps.sol:TypeOps',
  RECEIVER_PAYS:
    'contracts/solidity/signature-example/ReceiverPays.sol:ReceiverPays',
  RECEIVER: 'contracts/solidity/encoding/Receiver.sol:Receiver',
};

const Contract = {
  ERC20Mock: 'ERC20Mock',
  ERC20Contract: 'ERC20Contract',
  ERC721Mock: 'ERC721Mock',
  ERC721ProxyMock: 'ERC721ProxyMock',
  TokenCreateContract: 'TokenCreateContract',
  ERC1155Mock: 'ERC1155Mock',
  ERC721Contract: 'ERC721Contract',
  TokenCreateCustomContract: 'TokenCreateCustomContract',
  TokenManagementContract: 'TokenManagementContract',
  TokenQueryContract: 'TokenQueryContract',
  TokenTransferContract: 'TokenTransferContract',
  HRC719Contract: 'HRC719Contract',
  ExchangeRateMock: 'ExchangeRateMock',
  PrngSystemContract: 'PrngSystemContract',
  CryptoAllowance: 'CryptoAllowance',
  CryptoOwner: 'CryptoOwner',
  Airdrop: 'Airdrop',
  ClaimAirdrop: 'ClaimAirdrop',
  TokenReject: 'TokenReject',
  AliasAccountUtility: 'AliasAccountUtility',
  CancelAirdrop: 'CancelAirdrop',
  InternalCallee: 'InternalCallee',
};

const CALL_EXCEPTION = 'CALL_EXCEPTION';
const CONTRACT_REVERT_EXECUTED_CODE = 3;
const GAS_LIMIT_1_000_000 = { gasLimit: 1_000_000 };
const GAS_LIMIT_2_000_000 = { gasLimit: 2_000_000 };
const GAS_LIMIT_5_000_000 = { gasLimit: 5_000_000 };
const GAS_LIMIT_10_000_000 = { gasLimit: 10_000_000 };
const GAS_LIMIT_800000 = { gasLimit: 800000 };
const GAS_LIMIT_8000000 = { gasLimit: 8000000 };
const ONE_HBAR = ethers.parseEther('1');
const TOKEN_NAME = 'tokenName';
const TOKEN_SYMBOL = 'tokenSymbol';
const TOKEN_URL = 'tokenUrl';
const TX_SUCCESS_CODE = 22;
const SECOND = (WEI = 1);
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const GWEI = 1e9;
const HTS_SYSTEM_CONTRACT_ID = '0.0.359';
const HAS_SYSTEM_CONTRACT_ID = '0.0.362';
const HEDERA_PROTOBUF_URL = 'https://raw.githubusercontent.com/hashgraph/hedera-protobufs/refs/heads/main/services/basic_types.proto';

module.exports = {
  Events,
  Path,
  Contract,
  CALL_EXCEPTION,
  CONTRACT_REVERT_EXECUTED_CODE,
  GAS_LIMIT_1_000_000,
  GAS_LIMIT_2_000_000,
  GAS_LIMIT_5_000_000,
  GAS_LIMIT_10_000_000,
  GAS_LIMIT_800000,
  GAS_LIMIT_8000000,
  ONE_HBAR,
  TOKEN_URL,
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TX_SUCCESS_CODE,
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  WEI,
  GWEI,
  HTS_SYSTEM_CONTRACT_ID,
  HAS_SYSTEM_CONTRACT_ID,
  HEDERA_PROTOBUF_URL,
};
