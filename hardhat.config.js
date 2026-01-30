// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { config } from "./test/config.js";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  ...config,
});
