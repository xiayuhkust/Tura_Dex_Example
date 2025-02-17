// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;

import '@openzeppelin/contracts/math/SafeMath.sol';
import './FullMath.sol';

library SqrtPriceMath {
    using SafeMath for uint256;

    /// @notice Gets the next sqrt price given a delta of token0
    /// @param sqrtPriceX96 The starting price, i.e., before accounting for the token0 delta
    /// @param liquidity The amount of usable liquidity
    /// @param amount The amount of token0 to add or remove
    /// @param add Whether to add or remove the amount of token0
    /// @return The price after adding or removing amount, i.e., sqrtPriceX96 +- amount/liquidity
    function getNextSqrtPriceFromAmount0(
        uint160 sqrtPriceX96,
        uint128 liquidity,
        uint256 amount,
        bool add
    ) internal pure returns (uint160) {
        // TODO: Implement actual calculation
        // For now, return a placeholder value
        return sqrtPriceX96;
    }

    /// @notice Gets the next sqrt price given a delta of token1
    /// @param sqrtPriceX96 The starting price, i.e., before accounting for the token1 delta
    /// @param liquidity The amount of usable liquidity
    /// @param amount The amount of token1 to add or remove
    /// @param add Whether to add or remove the amount of token1
    /// @return The price after adding or removing amount, i.e., sqrtPriceX96 +- amount/liquidity
    function getNextSqrtPriceFromAmount1(
        uint160 sqrtPriceX96,
        uint128 liquidity,
        uint256 amount,
        bool add
    ) internal pure returns (uint160) {
        // TODO: Implement actual calculation
        // For now, return a placeholder value
        return sqrtPriceX96;
    }
}
