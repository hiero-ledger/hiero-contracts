// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import hre from 'hardhat';
const { ethers, networkName } = await hre.network.connect();
import Constants from '../../constants';
import Utils from '../../token-service/utils.js';
import axios from 'axios';

import { PrivateKey } from '@hashgraph/sdk';
import hapi from '../../token-service/hapi.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getScheduleInfoFromMN = async (scheduleAddress) => {
  const url = Utils.getMirrorNodeUrl(networkName) + `/schedules/0.0.${Number(scheduleAddress)}`;

  return axios.get(url).then(r => r.data);
};

const FIVE_MINUTES_AS_SECONDS = 300n;

// disable the tests in CI until a new version of the local node with the latest CN is released
describe("HIP1215 Test Suite", function () {
  let internalCalleeContract;
  let HRC1215Contract;
  let signers;
  let SCHEDULE_GAS_LIMIT;

  const executeScheduleCall = async (timestampOffset = 0) => {
    return (await HRC1215Contract.scheduleCallDirect(
      internalCalleeContract.target,
      timestampOffset,
      SCHEDULE_GAS_LIMIT,
      0,
      "0x3a32b549", // selector of externalFunction() in Internal Callee
      Constants.GAS_LIMIT_2_000_000
    )).wait();
  };

  before(async () => {
    signers = await ethers.getSigners();

    internalCalleeContract = await (
      await ethers.getContractFactory(Constants.Contract.InternalCallee)
    ).deploy();
    await internalCalleeContract.waitForDeployment();

    HRC1215Contract = await (
      await ethers.getContractFactory("HRC1215Contract")
    ).deploy({value: ethers.parseEther("5")}); // fund the contract with 5 HBARs
    await HRC1215Contract.waitForDeployment();

    SCHEDULE_GAS_LIMIT = await internalCalleeContract.externalFunction.estimateGas();
  });

  after(function () {
    hapi.client.close();
  });

  it("should be able to execute scheduleCallDirect", async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    await executeScheduleCall();
    await sleep(10_000);

    const afterCount = await internalCalleeContract.calledTimes();

    expect(afterCount).to.equal(beforeCount + 1n);
  });

  it("should be able to execute scheduleCallWithPayerDirect", async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    await (await HRC1215Contract.scheduleCallWithPayerDirect(
      internalCalleeContract.target,
      HRC1215Contract.target,
      0,
      SCHEDULE_GAS_LIMIT,
      0,
      "0x3a32b549", // selector of externalFunction() in Internal Callee
      Constants.GAS_LIMIT_2_000_000
    )).wait();
    await sleep(10_000);

    const afterCount = await internalCalleeContract.calledTimes();
    expect(afterCount).to.equal(beforeCount + 1n);
  });

  it("should be able to execute executeCallOnPayerSignature", async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    const receipt = await (await HRC1215Contract.executeCallOnPayerSignatureDirect(
      internalCalleeContract.target,
      signers[0].address,
      (await HRC1215Contract.getBlockTimestamp()) + FIVE_MINUTES_AS_SECONDS, // add buffer to the expiry
      SCHEDULE_GAS_LIMIT,
      0,
      "0x3a32b549", // selector of externalFunction() in Internal Callee
      Constants.GAS_LIMIT_2_000_000
    )).wait();
    const scheduleAddress = receipt.logs[0].args[0];
    const beforeSignScheduleInfo = await getScheduleInfoFromMN(scheduleAddress);

    const IHRC755Facade = await ethers.getContractAt(
      "IHRC755ScheduleFacade",
      scheduleAddress,
      signers[0]
    );
    await (await IHRC755Facade.signSchedule(Constants.GAS_LIMIT_2_000_000)).wait();

    const afterSignScheduleInfo = await getScheduleInfoFromMN(scheduleAddress);
    const afterCount = await internalCalleeContract.calledTimes();
    expect(afterCount).to.equal(beforeCount + 1n);
    expect(beforeSignScheduleInfo.executed_timestamp).to.be.null;
    expect(afterSignScheduleInfo.executed_timestamp).to.not.be.null;
  });

  it("should be able to execute hasScheduleCapacityProxyExample", async () => {
    const timestamp = (await HRC1215Contract.getBlockTimestamp()) + 20n;

    expect(
      await HRC1215Contract.hasScheduleCapacityProxy(timestamp, 200_000n)
    ).to.be.true;
  });

  it("should be able to execute hasScheduleCapacityProxyExample and get false if it's not after current consensus time", async () => {
    const timestamp = (await HRC1215Contract.getBlockTimestamp()) - 200n;

    expect(
      await HRC1215Contract.hasScheduleCapacityProxy(timestamp, 200_000n)
    ).to.be.false;
  });

  it("should be able to execute hasScheduleCapacityProxyExample and get false if it's too far in the future", async () => {
    const timestamp = (await HRC1215Contract.getBlockTimestamp()) + 100_000_000n;

    expect(
      await HRC1215Contract.hasScheduleCapacityProxy(timestamp, 200_000n)
    ).to.be.false;
  });

  it("should be able to execute deleteScheduleDirect", async () => {
    const timestamp = (await HRC1215Contract.getBlockTimestamp()) + FIVE_MINUTES_AS_SECONDS;
    const scheduleAddress = (await executeScheduleCall(timestamp)).logs[0].args[0];
    expect(scheduleAddress).to.not.be.null;

    const before = await getScheduleInfoFromMN(scheduleAddress);
    expect(before.deleted).to.be.false;

    await (await HRC1215Contract.deleteScheduleDirect(scheduleAddress)).wait();

    const after = await getScheduleInfoFromMN(scheduleAddress);
    expect(after.deleted).to.be.true;
  });

  it("should be able to execute deleteScheduleProxy", async () => {
    const timestamp = (await HRC1215Contract.getBlockTimestamp()) + FIVE_MINUTES_AS_SECONDS;
    const scheduleAddress = (await executeScheduleCall(timestamp)).logs[0].args[0];
    expect(scheduleAddress).to.not.be.null;

    const before = await getScheduleInfoFromMN(scheduleAddress);
    expect(before.deleted).to.be.false;

    await (
      await HRC1215Contract.deleteScheduleProxy(scheduleAddress)
    ).wait();

    const after = await getScheduleInfoFromMN(scheduleAddress);
    expect(after.deleted).to.be.true;
  });
});
