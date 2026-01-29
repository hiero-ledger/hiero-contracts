// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ERC721Mock is ERC721 {
    constructor() ERC721("ERCERC721Mock", "ERC721M") {}
}
