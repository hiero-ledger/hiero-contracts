// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import { network } from 'hardhat';
const { ethers } = await network.connect();
import Constants from '../constants';

describe('PrngSystemContract Test Suite', function () {
  let prngSystemContract;

  before(async function () {
    const factory = await ethers.getContractFactory(
      Constants.Contract.PrngSystemContract,
    );

    prngSystemContract = await factory.deploy();
  });

  it('should be able to execute getPseudorandomSeed to generate a pseudo random seed', async function () {
    const tx = await prngSystemContract.getPseudorandomSeed();
    const txReceipt = await tx.wait();

    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.PseudoRandomSeed,
    )[0].args[0];

    expect(result).to.exist;
    expect(result).to.not.equal(ethers.ZeroHash);
  });
});
