// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;

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

    /// @notice Returns the Info struct of a position, given an owner and position boundaries
    /// @param self The mapping containing all user positions
    /// @param owner The address of the position owner
    /// @param tickLower The lower tick boundary of the position
    /// @param tickUpper The upper tick boundary of the position
    /// @return position The position info struct of the given position
    function get(
        mapping(bytes32 => Info) storage self,
        address owner,
        int24 tickLower,
        int24 tickUpper
    ) internal view returns (Position.Info storage position) {
        position = self[keccak256(abi.encodePacked(owner, tickLower, tickUpper))];
    }

    /// @notice Updates a position with the given liquidity delta
    /// @param self The mapping containing all user positions
    /// @param owner The address of the position owner
    /// @param tickLower The lower tick boundary of the position
    /// @param tickUpper The upper tick boundary of the position
    /// @param liquidityDelta The change in liquidity
    function update(
        mapping(bytes32 => Info) storage self,
        address owner,
        int24 tickLower,
        int24 tickUpper,
        int128 liquidityDelta
    ) internal {
        Info storage position = get(self, owner, tickLower, tickUpper);

        if (liquidityDelta > 0) {
            position.liquidity = uint128(uint256(position.liquidity).add(uint256(liquidityDelta)));
        } else {
            position.liquidity = uint128(uint256(position.liquidity).sub(uint256(-liquidityDelta)));
        }
    }
}
