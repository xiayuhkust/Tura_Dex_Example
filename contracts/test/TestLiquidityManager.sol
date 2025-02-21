// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import './BaseLiquidityManagement.sol';

contract TestLiquidityManager is BaseLiquidityManagement {
    address public immutable poolAddress;

    constructor(address _poolAddress) {
        require(_poolAddress != address(0), "Invalid pool address");
        poolAddress = _poolAddress;
    }

    function addLiquidityTest(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        address token0,
        address token1
    ) external returns (uint256 amount0, uint256 amount1) {
        require(token0 != address(0), "Invalid token0");
        require(token1 != address(0), "Invalid token1");
        require(amount > 0, "Invalid amount");
        
        return mint(
            poolAddress,
            recipient,
            tickLower,
            tickUpper,
            amount,
            token0,
            token1
        );
    }
}
