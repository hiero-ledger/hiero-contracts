// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

contract Sample {
    function selfDestructSample() external {
        selfdestruct(payable(msg.sender));
    }
}
