// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.19;

import {Position} from "../lib/Position.sol";
import {Tick} from "../lib/Tick.sol";
import {TickBitmap} from "../lib/TickBitmap.sol";
import {TickMath} from "../lib/TickMath.sol";
import {LiquidityMath} from "../lib/LiquidityMath.sol";
import {Math} from "../lib/Math.sol";

library PositionHandler {
    using Position for mapping(bytes32 => Position.Info);
    using Tick for mapping(int24 => Tick.Info);
    
    struct ModifyPositionParams {
        address owner;
        int24 lowerTick;
        int24 upperTick;
        int128 liquidityDelta;
    }

    function modifyPosition(
        ModifyPositionParams memory params,
        mapping(bytes32 => Position.Info) storage positions,
        mapping(int24 => Tick.Info) storage ticks,
        mapping(int16 => uint256) storage tickBitmap,
        uint160 sqrtPriceX96,
        int24 tick,
        uint24 tickSpacing,
        uint128 currentLiquidity,
        uint256 feeGrowthGlobal0X128,
        uint256 feeGrowthGlobal1X128
    ) external returns (
        Position.Info storage position,
        int256 amount0,
        int256 amount1,
        uint128 newLiquidity
    ) {
        position = positions.get(
            params.owner,
            params.lowerTick,
            params.upperTick
        );

        bool flippedLower = ticks.update(
            params.lowerTick,
            tick,
            int128(params.liquidityDelta),
            feeGrowthGlobal0X128,
            feeGrowthGlobal1X128,
            false
        );
        bool flippedUpper = ticks.update(
            params.upperTick,
            tick,
            int128(params.liquidityDelta),
            feeGrowthGlobal0X128,
            feeGrowthGlobal1X128,
            true
        );

        if (flippedLower) {
            tickBitmap.flipTick(params.lowerTick, int24(tickSpacing));
        }

        if (flippedUpper) {
            tickBitmap.flipTick(params.upperTick, int24(tickSpacing));
        }

        (uint256 feeGrowthInside0X128, uint256 feeGrowthInside1X128) = ticks
            .getFeeGrowthInside(
                params.lowerTick,
                params.upperTick,
                tick,
                feeGrowthGlobal0X128,
                feeGrowthGlobal1X128
            );

        position.update(
            params.liquidityDelta,
            feeGrowthInside0X128,
            feeGrowthInside1X128
        );

        if (tick < params.lowerTick) {
            amount0 = Math.calcAmount0Delta(
                TickMath.getSqrtRatioAtTick(params.lowerTick),
                TickMath.getSqrtRatioAtTick(params.upperTick),
                params.liquidityDelta
            );
        } else if (tick < params.upperTick) {
            amount0 = Math.calcAmount0Delta(
                sqrtPriceX96,
                TickMath.getSqrtRatioAtTick(params.upperTick),
                params.liquidityDelta
            );

            amount1 = Math.calcAmount1Delta(
                TickMath.getSqrtRatioAtTick(params.lowerTick),
                sqrtPriceX96,
                params.liquidityDelta
            );

            newLiquidity = LiquidityMath.addLiquidity(
                currentLiquidity,
                params.liquidityDelta
            );
        } else {
            amount1 = Math.calcAmount1Delta(
                TickMath.getSqrtRatioAtTick(params.lowerTick),
                TickMath.getSqrtRatioAtTick(params.upperTick),
                params.liquidityDelta
            );
        }
    }
}
