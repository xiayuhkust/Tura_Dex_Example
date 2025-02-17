// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import '@openzeppelin/contracts/math/SafeMath.sol';

library Position {
    using SafeMath for uint256;

    struct Info {
        uint128 liquidity;
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
        uint128 tokensOwed0;
        uint128 tokensOwed1;
    }

    function get(
        mapping(bytes32 => Info) storage self,
        address owner,
        int24 tickLower,
        int24 tickUpper
    ) internal view returns (Position.Info storage position) {
        position = self[keccak256(abi.encodePacked(owner, tickLower, tickUpper))];
    }

    function update(
        mapping(bytes32 => Info) storage self,
        address owner,
        int24 tickLower,
        int24 tickUpper,
        int128 liquidityDelta,
        uint256 feeGrowthInside0X128,
        uint256 feeGrowthInside1X128
    ) internal {
        Info storage position = get(self, owner, tickLower, tickUpper);

        uint128 liquidityNext;
        if (liquidityDelta == 0) {
            require(position.liquidity > 0, 'NP'); // Not positive
            liquidityNext = position.liquidity;
        } else {
            if (liquidityDelta > 0) {
                liquidityNext = uint128(uint256(position.liquidity).add(uint256(liquidityDelta)));
            } else {
                liquidityNext = uint128(uint256(position.liquidity).sub(uint256(-liquidityDelta)));
            }
        }

        // Update position
        if (liquidityDelta != 0) position.liquidity = liquidityNext;

        position.feeGrowthInside0LastX128 = feeGrowthInside0X128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1X128;
    }
}
