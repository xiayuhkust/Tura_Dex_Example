// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './factory/interfaces/IUniswapV3Pool.sol';
import './factory/interfaces/IUniswapV3Factory.sol';
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
    int24 constant MIN_TICK = -887272;
    int24 constant MAX_TICK = 887272;

    address public immutable override factory;
    address public immutable override token0;
    address public immutable override token1;
    uint24 public immutable override fee;
    int24 public immutable tickSpacing;
    address public owner;

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
    int24 private _currentTick;

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
        owner = msg.sender;
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
        address positionOwner,
        int24 tickLower,
        int24 tickUpper
    ) public view override returns (IPosition.Info memory) {
        IPosition.Info storage position = positions.get(positionOwner, tickLower, tickUpper);
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
        IPosition.Info storage position = positions.get(msg.sender, tickLower, tickUpper);
        
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
        address sender;
    }

    function _calculateFees(uint256 amount) private pure returns (uint256 feeAmount, uint256 amountAfterFee) {
        // Calculate output amount first (99.7% = 997/1000)
        amountAfterFee = amount.mul(997).div(1000);
        // Calculate fee amount as remainder
        feeAmount = amount.sub(amountAfterFee);
        // Verify calculations
        require(feeAmount.add(amountAfterFee) == amount, "Invalid fee calculation");
        // Ensure output amount is exactly 99.7%
        require(amountAfterFee == amount.mul(997).div(1000), "Invalid output amount");
    }

    function _handleSwap(
        bool zeroForOne,
        SwapState memory state,
        address recipient
    ) private returns (int256 amount0, int256 amount1) {
        if (zeroForOne) {
            // Calculate amounts - input token is amountSpecified, output token is amountAfterFee
            amount0 = int256(state.amountSpecified);
            amount1 = -int256(state.amountAfterFee);
            
            // Transfer tokens - take full amount from sender, send amount after fees to recipient
            require(IERC20(token0).transferFrom(msg.sender, address(this), uint256(state.amountSpecified)), 'T0');
            if (-amount1 > 0) {
                require(IERC20(token1).transfer(recipient, uint256(state.amountAfterFee)), 'T1');
            }
            
            // Update protocol fees and fee growth
            protocolFees0 = uint128(uint256(protocolFees0).add(state.feeAmount));
            
            // Update protocol fees and fee growth
            if (state.currentLiquidity > 0) {
                uint256 feePerLiquidity = FullMath.mulDiv(state.feeAmount, Q128, state.currentLiquidity);
                feeGrowthGlobal0X128 = feeGrowthGlobal0X128.add(feePerLiquidity);
                
                // Update position fees for liquidity provider (owner)
                bytes32 positionKey = keccak256(abi.encodePacked(owner, MIN_TICK, MAX_TICK));
                IPosition.Info storage position = positions[positionKey];
                if (position.liquidity > 0) {
                    uint256 feeAmount = state.feeAmount.mul(position.liquidity).div(state.currentLiquidity);
                    position.tokensOwed0 = uint128(uint256(position.tokensOwed0).add(feeAmount));
                    position.feeGrowthInside0LastX128 = feeGrowthGlobal0X128;
                }
            }
        } else {
            // Calculate amounts - input token is amountSpecified, output token is amountAfterFee
            amount0 = -int256(state.amountAfterFee);
            amount1 = int256(state.amountSpecified);
            
            // Transfer tokens - take full amount from sender, send amount after fees to recipient
            require(IERC20(token1).transferFrom(msg.sender, address(this), uint256(state.amountSpecified)), 'T1');
            if (-amount0 > 0) {
                require(IERC20(token0).transfer(recipient, uint256(-amount0)), 'T0');
            }
            
            // Update protocol fees and fee growth
            protocolFees1 = uint128(uint256(protocolFees1).add(state.feeAmount));
            
            // Update position fees for liquidity provider (owner)
            if (state.currentLiquidity > 0) {
                uint256 feePerLiquidity = FullMath.mulDiv(state.feeAmount, Q128, state.currentLiquidity);
                feeGrowthGlobal1X128 = feeGrowthGlobal1X128.add(feePerLiquidity);
                
                bytes32 positionKey = keccak256(abi.encodePacked(owner, MIN_TICK, MAX_TICK));
                IPosition.Info storage position = positions[positionKey];
                if (position.liquidity > 0) {
                    uint256 feeAmount = FullMath.mulDiv(state.feeAmount, position.liquidity, state.currentLiquidity);
                    position.tokensOwed1 = uint128(uint256(position.tokensOwed1).add(feeAmount));
                    position.feeGrowthInside1LastX128 = feeGrowthGlobal1X128;
                }
            }
            
            // Update position fees for liquidity provider (owner)
            if (state.currentLiquidity > 0) {
                uint256 feePerLiquidity = FullMath.mulDiv(state.feeAmount, Q128, state.currentLiquidity);
                feeGrowthGlobal1X128 = feeGrowthGlobal1X128.add(feePerLiquidity);
                
                bytes32 positionKey = keccak256(abi.encodePacked(owner, MIN_TICK, MAX_TICK));
                IPosition.Info storage position = positions[positionKey];
                if (position.liquidity > 0) {
                    position.tokensOwed1 = uint128(uint256(position.tokensOwed1).add(state.feeAmount));
                    position.feeGrowthInside1LastX128 = feeGrowthGlobal1X128;
                }
            }
            if (state.currentLiquidity > 0) {
                uint256 feePerLiquidity = FullMath.mulDiv(state.feeAmount, Q128, state.currentLiquidity);
                feeGrowthGlobal1X128 = feeGrowthGlobal1X128.add(feePerLiquidity);

                // Update position fees for liquidity provider (owner)
                bytes32 positionKey = keccak256(abi.encodePacked(owner, MIN_TICK, MAX_TICK));
                IPosition.Info storage position = positions[positionKey];
                if (position.liquidity > 0) {
                    uint256 feeAmount = state.feeAmount.mul(position.liquidity).div(state.currentLiquidity);
                    position.tokensOwed1 = uint128(uint256(position.tokensOwed1).add(feeAmount));
                    position.feeGrowthInside1LastX128 = feeGrowthGlobal1X128;
                }
            }
        }
    }

    function swap(
        bool zeroForOne,
        uint256 amountSpecified,
        address recipient
    ) external override returns (int256 amount0, int256 amount1) {
        require(amountSpecified > 0, 'AS'); // Amount specified must be greater than 0
        require(_slot0.unlocked, 'LOK'); // Locked

        // Lock the pool
        _slot0.unlocked = false;

        // Cache state variables
        uint160 sqrtPriceX96 = _slot0.sqrtPriceX96;
        _currentTick = _slot0.tick;

        // Initialize swap state
        SwapState memory state;
        state.amountSpecified = amountSpecified;
        state.recipient = recipient;
        state.sender = msg.sender;
        state.currentLiquidity = liquidity;
        state.nextPrice = sqrtPriceX96;
        state.nextTick = _currentTick;
        
        // Calculate fees (fee is in millionths, so 3000 = 0.3%)
        (state.feeAmount, state.amountAfterFee) = _calculateFees(amountSpecified);
        state.currentLiquidity = uint128(liquidity); // Store current liquidity for fee calculation
        state.sender = msg.sender; // Store sender for fee tracking

        // Ensure we have enough liquidity
        require(state.currentLiquidity > 0, "IL"); // Insufficient liquidity

        // Calculate price limits
        uint160 sqrtPriceLimitX96 = zeroForOne
            ? TickMath.MIN_SQRT_RATIO + 1
            : TickMath.MAX_SQRT_RATIO - 1;

        // Calculate next price
        state.nextPrice = zeroForOne
            ? SqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUp(
                sqrtPriceX96,
                state.currentLiquidity,
                state.amountAfterFee,
                true
            )
            : SqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDown(
                sqrtPriceX96,
                state.currentLiquidity,
                state.amountAfterFee,
                true
            );

        // Verify price is within limits
        if (zeroForOne) {
            require(state.nextPrice <= sqrtPriceX96 && state.nextPrice >= sqrtPriceLimitX96, 'SPL');
        } else {
            require(state.nextPrice >= sqrtPriceX96 && state.nextPrice <= sqrtPriceLimitX96, 'SPL');
        }

        // Execute swap
        (amount0, amount1) = _handleSwap(zeroForOne, state, recipient);

        // Update pool state
        _slot0.tick = state.nextTick;
        _slot0.sqrtPriceX96 = state.nextPrice;
        _slot0.unlocked = true;

        // Calculate next tick and update liquidity
        state.nextTick = TickMath.getTickAtSqrtRatio(state.nextPrice);
        if (_currentTick != state.nextTick) {
            int128 liquidityNet = ticks.cross(
                state.nextTick,
                feeGrowthGlobal0X128,
                feeGrowthGlobal1X128
            );
            liquidity = zeroForOne
                ? uint128(int128(liquidity) - liquidityNet)
                : uint128(int128(liquidity) + liquidityNet);
        }

        return (amount0, amount1);
    }
}
