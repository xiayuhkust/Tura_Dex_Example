// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.19;

import "prb-math/Common.sol" as PRBCommon;
import "../interfaces/IUniswapV3SwapCallback.sol";
import "../interfaces/IERC20.sol";
import "./FixedPoint128.sol";
import "./SwapMath.sol";
import "./TickBitmap.sol";
import "./TickMath.sol";
import "./LiquidityMath.sol";

library SwapHandler {
    struct SwapState {
        uint256 amountSpecifiedRemaining;
        uint256 amountCalculated;
        uint160 sqrtPriceX96;
        int24 tick;
        uint256 feeGrowthGlobalX128;
        uint128 liquidity;
    }

    struct StepState {
        uint160 sqrtPriceStartX96;
        int24 nextTick;
        bool initialized;
        uint160 sqrtPriceNextX96;
        uint256 amountIn;
        uint256 amountOut;
        uint256 feeAmount;
    }

    error InvalidPriceLimit();
    error NotEnoughLiquidity();
    error InsufficientInputAmount();

    function handleSwap(
        address token0,
        address token1,
        address recipient,
        bool zeroForOne,
        uint256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        uint160 currentSqrtPriceX96,
        int24 currentTick,
        uint128 currentLiquidity,
        uint24 fee,
        uint24 tickSpacing,
        mapping(int16 => uint256) storage tickBitmap,
        mapping(int24 => Tick.Info) storage ticks,
        uint256 feeGrowthGlobal0X128,
        uint256 feeGrowthGlobal1X128
    ) external returns (
        int256 amount0,
        int256 amount1,
        uint160 newSqrtPriceX96,
        int24 newTick,
        uint128 newLiquidity,
        uint256 newFeeGrowthGlobal0X128,
        uint256 newFeeGrowthGlobal1X128
    ) {
        if (
            zeroForOne
                ? sqrtPriceLimitX96 > currentSqrtPriceX96 ||
                    sqrtPriceLimitX96 < TickMath.MIN_SQRT_RATIO
                : sqrtPriceLimitX96 < currentSqrtPriceX96 ||
                    sqrtPriceLimitX96 > TickMath.MAX_SQRT_RATIO
        ) revert InvalidPriceLimit();

        SwapState memory state = SwapState({
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: 0,
            sqrtPriceX96: currentSqrtPriceX96,
            tick: currentTick,
            feeGrowthGlobalX128: zeroForOne
                ? feeGrowthGlobal0X128
                : feeGrowthGlobal1X128,
            liquidity: currentLiquidity
        });

        while (
            state.amountSpecifiedRemaining > 0 &&
            state.sqrtPriceX96 != sqrtPriceLimitX96
        ) {
            StepState memory step;

            step.sqrtPriceStartX96 = state.sqrtPriceX96;

            (step.nextTick, step.initialized) = tickBitmap.nextInitializedTickWithinOneWord(
                state.tick,
                int24(tickSpacing),
                zeroForOne
            );

            step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.nextTick);

            (
                state.sqrtPriceX96,
                step.amountIn,
                step.amountOut,
                step.feeAmount
            ) = SwapMath.computeSwapStep(
                state.sqrtPriceX96,
                (
                    zeroForOne
                        ? step.sqrtPriceNextX96 < sqrtPriceLimitX96
                        : step.sqrtPriceNextX96 > sqrtPriceLimitX96
                )
                    ? sqrtPriceLimitX96
                    : step.sqrtPriceNextX96,
                state.liquidity,
                state.amountSpecifiedRemaining,
                fee
            );

            state.amountSpecifiedRemaining -= step.amountIn + step.feeAmount;
            state.amountCalculated += step.amountOut;

            if (state.liquidity > 0) {
                state.feeGrowthGlobalX128 += PRBCommon.mulDiv(
                    step.feeAmount,
                    FixedPoint128.Q128,
                    state.liquidity
                );
            }

            if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {
                if (step.initialized) {
                    int128 liquidityDelta = ticks.cross(
                        step.nextTick,
                        (
                            zeroForOne
                                ? state.feeGrowthGlobalX128
                                : feeGrowthGlobal0X128
                        ),
                        (
                            zeroForOne
                                ? feeGrowthGlobal1X128
                                : state.feeGrowthGlobalX128
                        )
                    );

                    if (zeroForOne) liquidityDelta = -liquidityDelta;

                    state.liquidity = LiquidityMath.addLiquidity(
                        state.liquidity,
                        liquidityDelta
                    );

                    if (state.liquidity == 0) revert NotEnoughLiquidity();
                }

                state.tick = zeroForOne ? step.nextTick - 1 : step.nextTick;
            } else if (state.sqrtPriceX96 != step.sqrtPriceStartX96) {
                state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
            }
        }

        (amount0, amount1) = zeroForOne
            ? (
                int256(amountSpecified - state.amountSpecifiedRemaining),
                -int256(state.amountCalculated)
            )
            : (
                -int256(state.amountCalculated),
                int256(amountSpecified - state.amountSpecifiedRemaining)
            );

        if (zeroForOne) {
            IERC20(token1).transfer(recipient, uint256(-amount1));
        } else {
            IERC20(token0).transfer(recipient, uint256(-amount0));
        }

        return (
            amount0,
            amount1,
            state.sqrtPriceX96,
            state.tick,
            state.liquidity,
            zeroForOne ? state.feeGrowthGlobalX128 : feeGrowthGlobal0X128,
            zeroForOne ? feeGrowthGlobal1X128 : state.feeGrowthGlobalX128
        );
    }
}
