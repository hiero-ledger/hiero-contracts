// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "./SelfFunding.sol";

contract ExchangeRateMock is SelfFunding {
    event TinyBars(uint256 tinybars);
    event TinyCents(uint256 tinycents);

    function convertTinycentsToTinybars(uint256 tinycents) external returns (uint256 tinybars) {
        tinybars = tinycentsToTinybars(tinycents);
        emit TinyBars(tinybars);
    }

    function convertTinybarsToTinycents(uint256 tinybars) external returns (uint256 tinycents) {
        tinycents = tinybarsToTinycents(tinybars);
        emit TinyCents(tinycents);
    }
}
