// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '../interfaces/IPosition.sol';

library Position {
    using SafeMath for uint256;

    function get(
        mapping(bytes32 => IPosition.Info) storage self,
        address owner,
        int24 tickLower,
        int24 tickUpper
    ) internal view returns (IPosition.Info storage position) {
        position = self[keccak256(abi.encodePacked(owner, tickLower, tickUpper))];
    }

    function update(
        mapping(bytes32 => IPosition.Info) storage self,
        address owner,
        int24 tickLower,
        int24 tickUpper,
        int128 liquidityDelta,
        uint256 feeGrowthInside0X128,
        uint256 feeGrowthInside1X128
    ) internal {
        IPosition.Info storage position = get(self, owner, tickLower, tickUpper);

        uint128 liquidityNext;
        if (liquidityDelta == 0) {
            require(position.liquidity > 0, 'NP'); // Not positive
            liquidityNext = position.liquidity;
        } else {
            if (liquidityDelta > 0) {
                liquidityNext = uint128(uint256(position.liquidity).add(uint256(liquidityDelta)));
            } else {
                require(uint128(-liquidityDelta) <= position.liquidity, 'NP'); // Not enough position liquidity
                liquidityNext = uint128(uint256(position.liquidity).sub(uint128(-liquidityDelta)));
            }
        }

        // Update position
        if (liquidityDelta != 0) position.liquidity = liquidityNext;

        position.feeGrowthInside0LastX128 = feeGrowthInside0X128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1X128;
    }
}
