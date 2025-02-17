// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NonfungiblePositionManager is ERC721, ReentrancyGuard {
    address public immutable factory;
    address public immutable WETH9;

    constructor(
        address _factory,
        address _WETH9
    ) ERC721("Tura Liquidity", "TURA-LP") {
        factory = _factory;
        WETH9 = _WETH9;
    }

    // Will be implemented in next phase:
    // - createAndInitializePoolIfNecessary
    // - mint
    // - addLiquidity
    // - removeLiquidity
    // - collect
}
