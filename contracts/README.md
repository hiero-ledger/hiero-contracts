**A library for hedera secure smart contract development.**

## Overview

### Installation

### Prerequisites

For this script to work, you need to communicate with the Hedera consensus node precompiles.
To access them, you must first start a local Hedera node.

1. Start a Solo Node

    Make sure you have the following prerequisites set up:
    
    * **Node.js** ≥ 20.19.0 with npm ([details](https://docs.npmjs.com))
    * **Docker** and **Docker Compose** installed and running - ([details](https://docs.docker.com))

    Then start a local Hedera Solo node with a single command:
    
    ```bash
    npx @hashgraph/solo one-shot single deploy
    ```
    
    This launches a single-node Hedera network locally for quick testing and development.
    If the `@hashgraph/solo` is not yet installed, `npx` will prompt for confirmation to install it.

    > Note: This command will install additional required tools (such as [Kind](https://kind.sigs.k8s.io/)) inside the Docker container.

2. Configure Hardhat to communicate with your local node

    Install the required dependencies:
    ```bash
    npm install --save-dev hardhat@^2 @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers
    ```
    
    Add a `hardhat.config.js` (or `.ts`) with a `solo` network:
    
    ```js
    require("@nomicfoundation/hardhat-ethers");
    require("@nomicfoundation/hardhat-toolbox");
    
    // This not secret. This account is created by default when starting solo node using default configuration
    const PRIVATE_KEY = '0x105d050185ccb907fba04dd92d8de9e32c18305e097ab41dadda21489a211524'; // NOT SECRET

    module.exports = {
      solidity: "0.8.24",
      networks: {
        solo: {
          url: "http://127.0.0.1:7546", // Solo JSON-RPC
          chainId: 298,                 // Solo chain id
          accounts: [PRIVATE_KEY],      // After starting the Solo node, you’ll be shown pre-created account IDs
        },
      },
    };
    ```

#### Hardhat (npm)

    ```
    $ npm install @hashgraph/contracts
    ```


### Usage

Once installed, you can use the contracts in the library by importing them (`contracts/SampleHTSUsage.sol`):

```solidity
pragma solidity ^0.8.20;

import {IHederaTokenService} from "@hashgraph/contracts/token-service/IHederaTokenService.sol";
import {HederaResponseCodes} from "@hashgraph/contracts/common/HederaResponseCodes.sol";

contract SampleHTSUsage {
    function calLPrecompile(address tokenAddress) external view {
        (int64 responseCode, bool isToken) = IHederaTokenService(address(0x167)).isToken(tokenAddress);
        require(responseCode == HederaResponseCodes.SUCCESS, "Failure");
        return isToken;
    }
}
```

Sample hardhat test for the Smart Contract above (`test/SampleHTSUsage.js`):
```js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestHTS against Hedera (precompile @ 0x167)", function () {
  let deployer, testHTS;

  before(async function () {
    [deployer] = await ethers.getSigners();
    const TestHTS = (await ethers.getContractFactory("SampleHTSUsage")).deploy();
    await testHTS.waitForDeployment();
  });

  it("returns false for a regular EOA (not a token)", async function () {
    const result = await testHTS.callPrecompile.staticCall(deployer.address);
    expect(result).to.equal(false);
  });
});
```

If you're new to hedera smart contract development, head to [Developing Hedera Smart Contracts](https://github.com/hashgraph/hedera-docs/blob/main/core-concepts/smart-contracts/understanding-hederas-evm-differences-and-compatibility/README.md).

## Learn More

The Hedera network utilizes system contracts at a reserved contract address on the EVM to surface HAPI service functionality through EVM processed transactions.
These system contracts are precompiled smart contracts whose function selectors are mapped to defined network logic.
In this way EVM users can utilize exposed HAPI features natively in their smart contracts.

The system contract functions are defined in this library and implemented by the [Hedera Services](https://github.com/hashgraph/hedera-services) repo as part of consensus node functionality.

## Security

Please do not file a public ticket mentioning the vulnerability. To report a vulnerability, please send an email to <security@hashgraph.com>.

## Contribute

Contributions are welcome. Please see the [contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md) to see how you can get involved.

## Code of Conduct

This project is governed by the
[Contributor Covenant Code of Conduct](https://github.com/hashgraph/.github/blob/main/CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code of conduct. Please report unacceptable behavior
to [oss@hedera.com](mailto:oss@hedera.com).

## License

[Apache License 2.0](https://github.com/hashgraph/hedera-smart-contracts/blob/main/LICENSE)
