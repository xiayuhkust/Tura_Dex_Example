// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './factory/interfaces/IUniswapV3Pool.sol';
import './factory/libraries/TickMath.sol';
import './factory/interfaces/IPosition.sol';
import './factory/libraries/Position.sol';
import './factory/libraries/SqrtPriceMath.sol';
import './factory/libraries/Tick.sol';

contract UniswapV3Pool is IUniswapV3Pool, ReentrancyGuard {
    using Tick for mapping(int24 => Tick.Info);
    using SafeMath for uint256;
    using Position for mapping(bytes32 => IPosition.Info);
    using TickMath for int24;

    uint256 constant Q128 = 2**128;

    address public immutable override factory;
    address public immutable override token0;
    address public immutable override token1;
    uint24 public immutable override fee;
    int24 public immutable tickSpacing;

    Slot0 private _slot0;
    function slot0() external view override returns (Slot0 memory) {
        return _slot0;
    }
    mapping(bytes32 => IPosition.Info) public positions;
    mapping(int24 => Tick.Info) public ticks;
    uint128 public override liquidity;
    uint128 public override protocolFees0;
    uint128 public override protocolFees1;
    uint256 public override feeGrowthGlobal0X128;
    uint256 public override feeGrowthGlobal1X128;

    // Track the current tick
    int24 public currentTick;

    constructor(
        address _factory,
        address _token0,
        address _token1,
        uint24 _fee,
        int24 _tickSpacing
    ) {
        factory = _factory;
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        tickSpacing = _tickSpacing;
    }

    function initialize(uint160 sqrtPriceX96) external override {
        require(_slot0.sqrtPriceX96 == 0, 'AI'); // Already initialized
        
        int24 tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
        
        _slot0 = Slot0({
            sqrtPriceX96: sqrtPriceX96,
            tick: tick,
            observationIndex: 0,
            observationCardinality: 0,
            observationCardinalityNext: 0,
            feeProtocol: 0,
            unlocked: true
        });

        emit Initialize(sqrtPriceX96, tick);
    }

    function getPosition(
        address owner,
        int24 tickLower,
        int24 tickUpper
    ) public view override returns (IPosition.Info memory) {
        IPosition.Info storage position = positions.get(owner, tickLower, tickUpper);
        return IPosition.Info({
            liquidity: position.liquidity,
            feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
            feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
            tokensOwed0: position.tokensOwed0,
            tokensOwed1: position.tokensOwed1
        });
    }

    function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external override returns (uint256 amount0, uint256 amount1) {
        require(amount > 0, 'IL'); // Invalid liquidity
        require(tickLower < tickUpper, 'TLU'); // Tick Lower < Upper
        require(tickLower >= TickMath.MIN_TICK, 'TLM'); // Tick Lower too low
        require(tickUpper <= TickMath.MAX_TICK, 'TUM'); // Tick Upper too high

        // Update ticks and track liquidity changes
        bool flippedLower = ticks.update(
            tickLower,
            _slot0.tick,
            int128(amount),
            feeGrowthGlobal0X128,
            feeGrowthGlobal1X128,
            false
        );
        bool flippedUpper = ticks.update(
            tickUpper,
            _slot0.tick,
            int128(-amount),
            feeGrowthGlobal0X128,
            feeGrowthGlobal1X128,
            true
        );

        // Update position
        IPosition.Info storage position = positions.get(recipient, tickLower, tickUpper);
        position.liquidity = uint128(uint256(position.liquidity).add(uint256(amount)));
        position.feeGrowthInside0LastX128 = feeGrowthGlobal0X128;
        position.feeGrowthInside1LastX128 = feeGrowthGlobal1X128;

        // Update pool liquidity if position is in range
        if (_slot0.tick >= tickLower && _slot0.tick < tickUpper) {
            liquidity = uint128(uint256(liquidity).add(uint256(amount)));
        }

        // Calculate token amounts based on price range
        uint160 sqrtPriceLowerX96 = TickMath.getSqrtRatioAtTick(tickLower);
        uint160 sqrtPriceUpperX96 = TickMath.getSqrtRatioAtTick(tickUpper);
        uint160 sqrtPriceCurrentX96 = _slot0.sqrtPriceX96;

        // Calculate amounts of token0 and token1 needed
        if (sqrtPriceCurrentX96 <= sqrtPriceLowerX96) {
            amount0 = SqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUp(
                sqrtPriceLowerX96,
                amount,
                uint256(amount),
                true
            );
        } else if (sqrtPriceCurrentX96 < sqrtPriceUpperX96) {
            amount0 = SqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUp(
                sqrtPriceCurrentX96,
                amount,
                uint256(amount),
                true
            );
            amount1 = SqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDown(
                sqrtPriceCurrentX96,
                amount,
                uint256(amount),
                true
            );
        } else {
            amount1 = SqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDown(
                sqrtPriceUpperX96,
                amount,
                uint256(amount),
                true
            );
        }

        emit Mint(msg.sender, recipient, tickLower, tickUpper, amount, amount0, amount1);
    }

    function collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper
    ) external override returns (uint128 amount0, uint128 amount1) {
        IPosition.Info storage position = positions.get(recipient, tickLower, tickUpper);
        
        // Calculate fees earned
        uint256 feeGrowthInside0X128;
        uint256 feeGrowthInside1X128;
        
        // Calculate fee growth inside the position's range
        {
            Tick.Info storage lower = ticks[tickLower];
            Tick.Info storage upper = ticks[tickUpper];
            
            uint256 feeGrowthBelow0X128;
            uint256 feeGrowthBelow1X128;
            uint256 feeGrowthAbove0X128;
            uint256 feeGrowthAbove1X128;

            // Calculate fee growth below
            if (tickLower <= _slot0.tick) {
                feeGrowthBelow0X128 = lower.feeGrowthOutside0X128;
                feeGrowthBelow1X128 = lower.feeGrowthOutside1X128;
            } else {
                feeGrowthBelow0X128 = feeGrowthGlobal0X128 - lower.feeGrowthOutside0X128;
                feeGrowthBelow1X128 = feeGrowthGlobal1X128 - lower.feeGrowthOutside1X128;
            }

            // Calculate fee growth above
            if (tickUpper <= _slot0.tick) {
                feeGrowthAbove0X128 = upper.feeGrowthOutside0X128;
                feeGrowthAbove1X128 = upper.feeGrowthOutside1X128;
            } else {
                feeGrowthAbove0X128 = feeGrowthGlobal0X128 - upper.feeGrowthOutside0X128;
                feeGrowthAbove1X128 = feeGrowthGlobal1X128 - upper.feeGrowthOutside1X128;
            }
            
            feeGrowthInside0X128 = feeGrowthGlobal0X128 - feeGrowthBelow0X128 - feeGrowthAbove0X128;
            feeGrowthInside1X128 = feeGrowthGlobal1X128 - feeGrowthBelow1X128 - feeGrowthAbove1X128;
        }
        
        // Calculate fees earned by the position
        uint256 feesEarned0;
        uint256 feesEarned1;
        
        if (position.liquidity > 0) {
            feesEarned0 = FullMath.mulDiv(
                uint256(position.liquidity),
                feeGrowthInside0X128 - position.feeGrowthInside0LastX128,
                Q128
            );
            feesEarned1 = FullMath.mulDiv(
                uint256(position.liquidity),
                feeGrowthInside1X128 - position.feeGrowthInside1LastX128,
                Q128
            );
        }
        
        // Update position's fee tracking
        position.feeGrowthInside0LastX128 = feeGrowthInside0X128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1X128;
        
        // Add earned fees to tokens owed
        position.tokensOwed0 = uint128(uint256(position.tokensOwed0).add(feesEarned0));
        position.tokensOwed1 = uint128(uint256(position.tokensOwed1).add(feesEarned1));
        
        // Collect tokens owed
        amount0 = position.tokensOwed0;
        amount1 = position.tokensOwed1;

        if (amount0 > 0 || amount1 > 0) {
            position.tokensOwed0 = 0;
            position.tokensOwed1 = 0;

            if (amount0 > 0) IERC20(token0).transfer(recipient, amount0);
            if (amount1 > 0) IERC20(token1).transfer(recipient, amount1);
        }

        emit Collect(recipient, tickLower, tickUpper, amount0, amount1);
    }

    struct SwapState {
        uint256 amountSpecified;
        uint256 feeAmount;
        uint256 amountAfterFee;
        uint128 currentLiquidity;
        uint160 nextPrice;
        int24 nextTick;
        address recipient;
    }

    function _handleSwap(
        bool zeroForOne,
        SwapState memory state,
        address recipient
    ) private returns (int256 amount0, int256 amount1) {
        if (zeroForOne) {
            // Calculate amounts
            amount0 = int256(state.amountSpecified);
            amount1 = -int256(state.amountAfterFee);
            
            // Transfer tokens
            require(IERC20(token0).transferFrom(msg.sender, address(this), state.amountSpecified), 'T0');
            if (state.amountAfterFee > 0) {
                require(IERC20(token1).transfer(recipient, state.amountAfterFee), 'T1');
            }

            // Update protocol fees and fee growth
            protocolFees0 = uint128(uint256(protocolFees0).add(state.feeAmount));
            if (state.currentLiquidity > 0) {
                uint256 feePerLiquidity = FullMath.mulDiv(state.feeAmount, Q128, state.currentLiquidity);
                feeGrowthGlobal0X128 = feeGrowthGlobal0X128.add(feePerLiquidity);
                
                // Update position fee growth
                IPosition.Info storage position = positions.get(recipient, TickMath.MIN_TICK, TickMath.MAX_TICK);
                if (position.liquidity > 0) {
                    position.tokensOwed0 = uint128(uint256(position.tokensOwed0).add(state.feeAmount));
                }
            }
        } else {
            // Calculate amounts
            amount0 = -int256(state.amountAfterFee);
            amount1 = int256(state.amountSpecified);
            
            // Transfer tokens
            require(IERC20(token1).transferFrom(msg.sender, address(this), state.amountSpecified), 'T1');
            if (state.amountAfterFee > 0) {
                require(IERC20(token0).transfer(recipient, state.amountAfterFee), 'T0');
            }

            // Update protocol fees and fee growth
            protocolFees1 = uint128(uint256(protocolFees1).add(state.feeAmount));
            if (state.currentLiquidity > 0) {
                uint256 feePerLiquidity = FullMath.mulDiv(state.feeAmount, Q128, state.currentLiquidity);
                feeGrowthGlobal1X128 = feeGrowthGlobal1X128.add(feePerLiquidity);
                
                // Update position fee growth
                IPosition.Info storage position = positions.get(recipient, TickMath.MIN_TICK, TickMath.MAX_TICK);
                if (position.liquidity > 0) {
                    position.tokensOwed1 = uint128(uint256(position.tokensOwed1).add(state.feeAmount));
                }
            }
        }
    }

    function swap(
        bool zeroForOne,
        uint256 amountSpecified,
        address recipient
    ) external override returns (int256 amount0, int256 amount1) {
        require(amountSpecified > 0, 'AS'); // Amount Specified
        require(_slot0.unlocked, 'LOK'); // Locked

        // Lock the pool and cache state
        Slot0 memory state = _slot0;
        state.unlocked = false;
        _slot0 = state;

        // Cache state variables
        uint160 sqrtPriceX96 = state.sqrtPriceX96;
        int24 tick = state.tick;
        uint128 currentLiquidity = liquidity;

        // Calculate fees (fee is in hundredths of a bip, so multiply by 10^-6)
        uint256 feeAmount = (amountSpecified * uint256(fee)) / 1000000;
        uint256 amountAfterFee = amountSpecified - feeAmount;

        // Calculate price limits
        uint160 sqrtPriceLimitX96 = zeroForOne
            ? TickMath.MIN_SQRT_RATIO + 1
            : TickMath.MAX_SQRT_RATIO - 1;

        // Initialize swap state
        SwapState memory swapState;
        swapState.amountSpecified = amountSpecified;
        swapState.feeAmount = (amountSpecified * uint256(fee)) / 1000000;
        swapState.amountAfterFee = amountSpecified - swapState.feeAmount;
        swapState.currentLiquidity = currentLiquidity;
        swapState.recipient = recipient;

        // Calculate next price
        swapState.nextPrice = zeroForOne
            ? SqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUp(
                sqrtPriceX96,
                currentLiquidity,
                swapState.amountAfterFee,
                true
            )
            : SqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDown(
                sqrtPriceX96,
                currentLiquidity,
                swapState.amountAfterFee,
                true
            );

        // Verify price is within limits
        if (zeroForOne) {
            require(swapState.nextPrice >= sqrtPriceLimitX96 && swapState.nextPrice < sqrtPriceX96, 'SPL');
        } else {
            require(swapState.nextPrice <= sqrtPriceLimitX96 && swapState.nextPrice > sqrtPriceX96, 'SPL');
        }

        // Calculate next tick and update liquidity
        swapState.nextTick = TickMath.getTickAtSqrtRatio(swapState.nextPrice);
        if (tick != swapState.nextTick) {
            int128 liquidityNet = ticks.cross(
                swapState.nextTick,
                feeGrowthGlobal0X128,
                feeGrowthGlobal1X128
            );
            if (zeroForOne) liquidityNet = -liquidityNet;
            swapState.currentLiquidity = liquidityNet < 0
                ? uint128(uint256(swapState.currentLiquidity).sub(uint256(-liquidityNet)))
                : uint128(uint256(swapState.currentLiquidity).add(uint256(liquidityNet)));
        }

        // Execute swap
        (amount0, amount1) = _handleSwap(zeroForOne, swapState, recipient);

        // Update pool state
        liquidity = swapState.currentLiquidity;
        state.sqrtPriceX96 = swapState.nextPrice;
        state.tick = swapState.nextTick;
        state.unlocked = true;
        _slot0 = state;

        emit Swap(msg.sender, recipient, amount0, amount1, swapState.nextPrice, swapState.currentLiquidity, swapState.nextTick);
    }
}
