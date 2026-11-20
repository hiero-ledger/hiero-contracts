:warning: :bangbang: ***All examples and contracts in this repository are exploration code and have NOT been audited. Use them at your own risk!*** :bangbang: :warning:

# Hiero Smart Contracts

Reference library for Smart Contracts utilized on the Hiero network with supporting files and examples.

## Overview

The Hiero network utilizes system contracts at reserved contract addresses on the EVM to surface HAPI (Hiero API) service functionality through EVM processed transactions.
These system contracts are precompiled smart contracts whose function selectors are mapped to defined network logic.
In this way EVM users can utilize exposed HAPI features natively in their smart contracts.

The system contract functions are defined in this library and implemented by the [Hiero consensus node](https://github.com/hiero-ledger/hiero-consensus-node) repository as part of consensus node functionality.

## System Contracts

A **system contract** is not deployed bytecode — it is native consensus node logic exposed at a fixed EVM address. When a contract (or an externally owned account) calls one of these addresses, the node intercepts the call, decodes the function selector and arguments, executes the corresponding HAPI operation, and returns the result like any other contract call. This lets Solidity developers create tokens, manage allowances, schedule transactions, read exchange rates, and generate randomness without leaving the EVM.

Every system contract function returns an `int64 responseCode` drawn from [`HederaResponseCodes.sol`](contracts/common/HederaResponseCodes.sol) (`SUCCESS` is `22`). Many services also expose **facade** (proxy / redirect) functions that let an externally owned account (EOA) call the service directly — for example by calling a token or schedule address — without first deploying a contract.

The following system contracts are available on the Hiero network. Each links to a dedicated reference that lists every function, its selector hash, the consensus node release that introduced it, and the governing HIP.

| System Contract | Address | Purpose | Defining HIPs | Reference |
|---|---|---|---|---|
| Hiero Token Service (HTS) | `0x167` | Create, manage, transfer, and query fungible tokens and NFTs; allowances; airdrops; KYC and freeze controls. | [206](https://hips.hedera.com/hip/hip-206), [218](https://hips.hedera.com/hip/hip-218), [358](https://hips.hedera.com/hip/hip-358), [376](https://hips.hedera.com/hip/hip-376), [514](https://hips.hedera.com/hip/hip-514), [719](https://hips.hedera.com/hip/hip-719), [904](https://hips.hedera.com/hip/hip-904) | [HTS System Contract Methods](contracts/token-service/README.md) |
| Hiero Account Service (HAS) | `0x16a` | HBAR allowances, account/EVM address alias resolution, and signature verification (`isAuthorized`/`isAuthorizedRaw`). | [583](https://hips.hedera.com/hip/hip-583), [632](https://hips.hedera.com/hip/hip-632), [904](https://hips.hedera.com/hip/hip-904), [906](https://hips.hedera.com/hip/hip-906) | [HAS System Contract Methods](contracts/account-service/README.md) |
| Hiero Schedule Service (HSS) | `0x16b` | Create, sign, authorize, query, and delete scheduled transactions, including scheduled native contract calls. | [755](https://hips.hedera.com/hip/hip-755), [756](https://hips.hedera.com/hip/hip-756), [1215](https://hips.hedera.com/hip/hip-1215) | [HSS System Contract Methods](contracts/schedule-service/README.md) |
| Exchange Rate | `0x168` | Convert between tinycents (USD) and tinybars (HBAR) at the active network exchange rate. | [475](https://hips.hedera.com/hip/hip-475) | [Exchange Rate System Contract Methods](contracts/exchange-rate/README.md) |
| PRNG | `0x169` | Generate a pseudo-random 32-byte seed from the network. | [351](https://hips.hedera.com/hip/hip-351) | [PRNG System Contract Methods](contracts/prng/README.md) |

## Backward Compatibility

This repository targets the **Hiero** ecosystem. Documentation and project naming use **Hiero** throughout. However, the **Solidity public API** intentionally retains **Hedera-prefixed** identifiers for backward compatibility with existing contracts and tooling.

## System Contract Details

### Hiero Token Service (HTS) System Contract

The Hiero Token Service (HTS) functionality is defined by the [IHederaTokenService.sol](contracts/token-service/IHederaTokenService.sol) interface smart contract as defined in [HIP 206](https://hips.hedera.com/hip/hip-206), [HIP 376](https://hips.hedera.com/hip/hip-376) and [HIP 514](https://hips.hedera.com/hip/hip-514).
The contract is exposed via the `0x167` address.
Reference smart contracts to call these functions can be found under [contracts/token-service](contracts/token-service)

For further details on methods, hashes and availability please refer to [HTS System Contract Methods](contracts/token-service/README.md)

### Hiero Account Service (HAS) System Contract

The Hiero Account Service (HAS) functionality is defined by the [IHederaAccountService.sol](contracts/account-service/IHederaAccountService.sol) interface smart contract as defined in [HIP 632](https://hips.hedera.com/hip/hip-632) and [HIP 906](https://hips.hedera.com/hip/hip-906). The contract is exposed via the `0x16a` address.
Reference smart contracts to call these functions as well as examples can be found under [contracts/account-service](contracts/account-service)

For further details on methods, hashes and availability please refer to [HAS System Contract Methods](contracts/account-service/README.md)

### Hiero Schedule Service (HSS) System Contract

The Hiero Schedule Service (HSS) functionality is defined by the [IHederaScheduleService.sol](contracts/schedule-service/IHederaScheduleService.sol) interface smart contract and its `IHRC755`, `IHRC756`, and `IHRC1215` extensions, as defined in [HIP 755](https://hips.hedera.com/hip/hip-755), [HIP 756](https://hips.hedera.com/hip/hip-756) and [HIP 1215](https://hips.hedera.com/hip/hip-1215). The contract is exposed via the `0x16b` address.
HSS lets contracts and EOAs create scheduled transactions (including scheduled native contract calls), authorize and sign them, query scheduled token-create info, and delete schedules.
Reference smart contracts to call these functions can be found under [contracts/schedule-service](contracts/schedule-service)

For further details on methods, hashes and availability please refer to [HSS System Contract Methods](contracts/schedule-service/README.md)

### Exchange Rate System Contract

The Exchange Rate functionality is defined by the [IExchangeRate.sol](contracts/exchange-rate/IExchangeRate.sol) interface smart contract as defined in [HIP 475](https://hips.hedera.com/hip/hip-475) and exposed via the `0x168` address.
Reference smart contracts to call these functions as well as examples can be found under [contracts/exchange-rate](contracts/exchange-rate)

For further details on methods, hashes and availability please refer to [Exchange Rate System Contract Methods](contracts/exchange-rate/README.md)

### Prng System Contract

The PRNG functionality is defined by the [IPrngSystemContract.sol](contracts/prng/IPrngSystemContract.sol) interface smart contract as defined in [HIP 351](https://hips.hedera.com/hip/hip-351) and exposed via the `0x169` address.
Reference smart contracts to call these functions as well as examples can be found under [contracts/prng](contracts/prng)

For further details on methods, hashes and availability please refer to [PRNG System Contract Methods](contracts/prng/README.md)

## Support

If you have a question on how to use the product, please see our
[support guide](https://github.com/hashgraph/.github/blob/main/SUPPORT.md).

## Contributing

Contributions are welcome. Please see the
[contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md)
to see how you can get involved.

## About Users and Maintainers

Users and Maintainers guidelines are located in **[Hiero-Ledger's CONTRIBUTING.md file](https://github.com/hiero-ledger/.github/blob/main/CONTRIBUTING.md#about-users-and-maintainers)** under the "About-Users-and-Maintainers" section.

## Code of Conduct

Hiero uses the Linux Foundation Decentralised Trust [Code of Conduct](https://www.lfdecentralizedtrust.org/code-of-conduct).

## License

[Apache License 2.0](LICENSE)
