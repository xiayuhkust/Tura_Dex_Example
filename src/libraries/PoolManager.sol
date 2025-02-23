// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.19;

library PoolManager {
    error TokensMustBeDifferent();
    error ZeroAddressNotAllowed();
    error UnsupportedFee();
    error PoolAlreadyExists();

    function validatePoolCreation(
        address tokenX,
        address tokenY,
        uint24 fee,
        mapping(uint24 => uint24) storage fees,
        mapping(address => mapping(address => mapping(uint24 => address))) storage pools
    ) internal view returns (address token0, address token1) {
        if (tokenX == tokenY) revert TokensMustBeDifferent();
        if (fees[fee] == 0) revert UnsupportedFee();

        (token0, token1) = tokenX < tokenY ? (tokenX, tokenY) : (tokenY, tokenX);

        if (token0 == address(0)) revert ZeroAddressNotAllowed();
        if (pools[token0][token1][fee] != address(0)) revert PoolAlreadyExists();
    }

    function registerPool(
        address token0,
        address token1,
        uint24 fee,
        address pool,
        mapping(address => mapping(address => mapping(uint24 => address))) storage pools
    ) internal {
        pools[token0][token1][fee] = pool;
        pools[token1][token0][fee] = pool;
    }
}
