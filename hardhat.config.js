// SPDX-License-Identifier: Apache-2.0

import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

import { config } from "./test/config.js";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  ...config,
});
