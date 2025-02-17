// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SwapRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable factory;
    address public immutable WETH9;

    constructor(address _factory, address _WETH9) {
        factory = _factory;
        WETH9 = _WETH9;
    }

    // Will be implemented in next phase:
    // - exactInputSingle
    // - exactInput
    // - exactOutputSingle
    // - exactOutput
    
    receive() external payable {
        require(msg.sender == WETH9, 'Not WETH9');
    }
}
