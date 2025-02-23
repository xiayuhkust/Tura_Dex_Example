// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.19;

import "../UniswapV3Pool.sol";

library PoolDeployer {
    function deployPool(
        address factory,
        address token0,
        address token1,
        uint24 fee
    ) internal returns (address pool) {
        pool = address(new UniswapV3Pool{salt: keccak256(abi.encode(token0, token1, fee))}());
        UniswapV3Pool(pool).initialize(sqrt(token0, token1, fee));
    }

    function computeAddress(
        address factory,
        address token0,
        address token1,
        uint24 fee
    ) internal pure returns (address pool) {
        pool = address(uint160(uint256(keccak256(abi.encodePacked(
            hex'ff',
            factory,
            keccak256(abi.encode(token0, token1, fee)),
            keccak256(type(UniswapV3Pool).creationCode)
        )))));
    }

    function sqrt(
        address token0,
        address token1,
        uint24 fee
    ) internal pure returns (uint160) {
        return uint160(uint256(keccak256(abi.encodePacked(token0, token1, fee))));
    }
}
