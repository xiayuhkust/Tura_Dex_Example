// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.19;

import "./interfaces/IUniswapV3PoolDeployer.sol";
import "./libraries/PoolDeployer.sol";
import "./libraries/PoolManager.sol";

contract UniswapV3Factory is IUniswapV3PoolDeployer {
    event PoolCreated(
        address indexed token0,
        address indexed token1,
        uint24 indexed fee,
        address pool
    );

    PoolParameters public parameters;

    mapping(uint24 => uint24) public fees;
    mapping(address => mapping(address => mapping(uint24 => address)))
        public pools;

    constructor() {
        fees[500] = 10;
        fees[3000] = 60;
    }

    function createPool(
        address tokenX,
        address tokenY,
        uint24 fee
    ) public returns (address pool) {
        (address token0, address token1) = PoolManager.validatePoolCreation(
            tokenX,
            tokenY,
            fee,
            fees,
            pools
        );

        parameters = PoolParameters({
            factory: address(this),
            token0: token0,
            token1: token1,
            tickSpacing: fees[fee],
            fee: fee
        });

        pool = PoolDeployer.deployPool(address(this), token0, token1, fee);

        delete parameters;

        PoolManager.registerPool(token0, token1, fee, pool, pools);

        emit PoolCreated(tokenX, tokenY, fee, pool);
    }
}
