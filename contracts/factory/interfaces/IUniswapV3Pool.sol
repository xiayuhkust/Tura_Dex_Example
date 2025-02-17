// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import './IPosition.sol';

interface IUniswapV3Pool {
    struct Slot0 {
        uint160 sqrtPriceX96;
        int24 tick;
        uint16 observationIndex;
        uint16 observationCardinality;
        uint16 observationCardinalityNext;
        uint8 feeProtocol;
        bool unlocked;
    }

    // Use IPosition.Info instead of redefining Position struct

    event Initialize(uint160 sqrtPriceX96, int24 tick);
    event Mint(
        address sender,
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        uint256 amount0,
        uint256 amount1
    );
    event Collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount0,
        uint128 amount1
    );
    event Swap(
        address sender,
        address recipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );

    function initialize(uint160 sqrtPriceX96) external;
    function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external returns (uint256 amount0, uint256 amount1);
    function collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper
    ) external returns (uint128 amount0, uint128 amount1);
    function swap(
        bool zeroForOne,
        uint256 amountSpecified,
        address recipient
    ) external returns (int256 amount0, int256 amount1);

    function factory() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function fee() external view returns (uint24);
    function slot0() external view returns (Slot0 memory);
    function liquidity() external view returns (uint128);
    function protocolFees0() external view returns (uint128);
    function protocolFees1() external view returns (uint128);
    function feeGrowthGlobal0X128() external view returns (uint256);
    function feeGrowthGlobal1X128() external view returns (uint256);
    function getPosition(
        address owner,
        int24 tickLower,
        int24 tickUpper
    ) external view returns (IPosition.Info memory);
}
