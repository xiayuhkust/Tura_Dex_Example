// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

interface IPosition {
    struct Info {
        uint128 liquidity;
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
        uint128 tokensOwed0;
        uint128 tokensOwed1;
    }
}
