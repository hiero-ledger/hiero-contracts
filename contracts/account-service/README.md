## Hiero Account Service (HAS) System Contract Functions

The Hiero Account Service (HAS) System Contract is accessible at address `0x16a` on the Hiero network. This contract interface introduces a new account proxy contract to interact with other contracts for functionality such as HBAR allowances. It enables querying and granting HBAR approval to a spender account from within smart contracts, allowing developers to grant, retrieve, and manage HBAR allowances directly in their code. HAS also resolves between Hiero account-num aliases and EVM address aliases ([HIP 632](https://hips.hedera.com/hip/hip-632)), and can verify whether a given address (Hiero account or EVM address) is authorized for a message and signature through the `isAuthorized` and `isAuthorizedRaw` methods.

The HAS interface is defined by [`IHederaAccountService.sol`](IHederaAccountService.sol), with HIP-specific extension interfaces [`IHRC632.sol`](IHRC632.sol) (alias resolution and signature verification) and [`IHRC906.sol`](IHRC906.sol) (HBAR allowances). The abstract [`HederaAccountService.sol`](HederaAccountService.sol) contract provides ready-to-use wrappers around each call.

The table below outlines the available Hiero Account Service System Contract functions:

| Function Name              | Function Selector Hash | Consensus Node Release Version                                                       | HIP                                            | Method Interface                                                                                          |
|----------------------------|------------------------|--------------------------------------------------------------------------------------|------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `hbarAllowance`            | `0xfec46666`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.52) | [HIP 906](https://hips.hedera.com/hip/hip-906) | `hbarAllowance(address owner, address spender) external returns (int64 responseCode, int256 amount)`        |
| `hbarApprove`              | `0xa0918464`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.52) | [HIP 906](https://hips.hedera.com/hip/hip-906) | `hbarApprove(address owner, address spender, int256 amount) external returns (int64 responseCode)`          |
| `getEvmAddressAlias`       | `0xdea3d081`           | [0.54](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.54) | [HIP 632](https://hips.hedera.com/hip/hip-632) | `getEvmAddressAlias(address accountNumAlias) external returns (int64 responseCode, address evmAddressAlias)` |
| `getHederaAccountNumAlias` | `0xbbf12d2e`           | [0.54](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.54) | [HIP 632](https://hips.hedera.com/hip/hip-632) | `getHederaAccountNumAlias(address evmAddressAlias) external returns (int64 responseCode, address accountNumAlias)` |
| `isValidAlias`             | `0x308ef301`           | [0.54](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.54) | [HIP 632](https://hips.hedera.com/hip/hip-632) | `isValidAlias(address addr) external returns (int64 responseCode, bool response)`                          |
| `isAuthorizedRaw`          | `0xb2a31da4`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.52) | [HIP 632](https://hips.hedera.com/hip/hip-632) | `isAuthorizedRaw(address account, bytes memory messageHash, bytes memory signature) external returns (bool authorized)` |
| `isAuthorized`             | `0xb2526367`           | [0.56](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.56) | [HIP 632](https://hips.hedera.com/hip/hip-632) | `isAuthorized(address account, bytes memory message, bytes memory signature) external returns (int64 responseCode, bool authorized)` |

The Hiero network also makes facade contract calls available to EOAs for an improved experience.
Facade functions allow EOAs to make calls without requiring a deployed contract — the EOA calls its own account address directly.
The table below outlines the available Hiero Account Service (HAS) System Contract facade functions:

| Function Name                       | Function Selector Hash | Consensus Node Release Version                                                       | HIP                                            | Method Interface                                                                                       | Defining Interface                                       |
|-------------------------------------|------------------------|--------------------------------------------------------------------------------------|------------------------------------------------|--------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| `hbarAllowance`                     | `0xbbee989e`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.52) | [HIP 906](https://hips.hedera.com/hip/hip-906) | `hbarAllowance(address spender) external returns (int64 responseCode, int256 amount)`                  | [`IHRC906AccountFacade.sol`](IHRC906AccountFacade.sol)   |
| `hbarApprove`                       | `0x86aff07c`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.52) | [HIP 906](https://hips.hedera.com/hip/hip-906) | `hbarApprove(address spender, int256 amount) external returns (int64 responseCode)`                    | [`IHRC906AccountFacade.sol`](IHRC906AccountFacade.sol)   |
| `setUnlimitedAutomaticAssociations` | `0xf5677e99`           | [0.56](https://docs.hedera.com/hedera/networks/release-notes/services#release-v0.56) | [HIP 904](https://hips.hedera.com/hip/hip-904) | `setUnlimitedAutomaticAssociations(bool enableAutoAssociations) external returns (int64 responseCode)` | [`IHRC904AccountFacade.sol`](IHRC904AccountFacade.sol)   |

### Function Notes

- **`hbarAllowance`** — Returns the amount of HBAR the `spender` has been authorized to spend on behalf of the `owner`.
- **`hbarApprove`** — Authorizes `spender` to withdraw HBAR from the `owner` account up to `amount`. Calling it again overwrites the current allowance.
- **`getEvmAddressAlias`** — Returns the EVM address alias for a given Hiero account-num alias.
- **`getHederaAccountNumAlias`** — Returns the Hiero account-num alias for a given EVM address alias.
- **`isValidAlias`** — Returns `true` if the address is a Hiero account-num alias or an EVM address alias.
- **`isAuthorizedRaw`** — Verifies a signature for a message *hash* against an account. The signature must be a single ECDSA or ED25519 key, providing logic similar to `ECRECOVER`.
- **`isAuthorized`** — Verifies a signature for a *message* against an account, supporting possibly complex (multi-key) account key structures via a protobuf-encoded signature blob.
- **`setUnlimitedAutomaticAssociations`** — Enables or disables unlimited automatic token associations for the calling account.

All functions return an `int64 responseCode` (`SUCCESS` is `22`) from [`HederaResponseCodes.sol`](../common/HederaResponseCodes.sol).
