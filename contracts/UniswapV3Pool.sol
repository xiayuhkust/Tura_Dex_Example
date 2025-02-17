// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './interfaces/IUniswapV3Pool.sol';
import './libraries/TickMath.sol';
import './libraries/Position.sol';
import './libraries/SqrtPriceMath.sol';

contract UniswapV3Pool is IUniswapV3Pool, ReentrancyGuard {
    using SafeMath for uint256;
    using Position for mapping(bytes32 => Position.Info);
    using TickMath for int24;

    address public immutable override factory;
    address public immutable override token0;
    address public immutable override token1;
    uint24 public immutable override fee;

    Slot0 public override slot0;
    mapping(bytes32 => Position.Info) public positions;
    uint128 public override liquidity;
    uint128 public override protocolFees0;
    uint128 public override protocolFees1;
    uint256 public override feeGrowthGlobal0X128;
    uint256 public override feeGrowthGlobal1X128;

    constructor(
        address _factory,
        address _token0,
        address _token1,
        uint24 _fee
    ) {
        factory = _factory;
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
    }

    function initialize(uint160 sqrtPriceX96) external override {
        require(slot0.sqrtPriceX96 == 0, 'AI'); // Already initialized
        
        int24 tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
        
        slot0 = Slot0({
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
    ) public view override returns (Position memory) {
        Position.Info storage position = positions.get(owner, tickLower, tickUpper);
        return Position({
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

        Position.Info storage position = positions.get(recipient, tickLower, tickUpper);
        position.liquidity = uint128(uint256(position.liquidity).add(uint256(amount)));
        liquidity = uint128(uint256(liquidity).add(uint256(amount)));

        emit Mint(msg.sender, recipient, tickLower, tickUpper, amount, amount0, amount1);
    }

    function collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper
    ) external override returns (uint128 amount0, uint128 amount1) {
        Position.Info storage position = positions.get(recipient, tickLower, tickUpper);
        
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

    function swap(
        bool zeroForOne,
        uint256 amountSpecified,
        address recipient
    ) external override returns (int256 amount0, int256 amount1) {
        require(amountSpecified > 0, 'AS'); // Amount Specified
        require(slot0.unlocked, 'LOK'); // Locked

        slot0.unlocked = false;

        // Calculate fees (fee is in hundredths of a bip, so multiply by 10^-6)
        uint256 feeAmount = (amountSpecified * uint256(fee)) / 1000000;
        uint256 amountAfterFee = amountSpecified - feeAmount;

        if (zeroForOne) {
            amount0 = -int256(amountSpecified);
            amount1 = int256(amountAfterFee);
            
            // Update protocol fees
            protocolFees0 = uint128(uint256(protocolFees0).add(feeAmount));
            
            // Transfer tokens
            require(IERC20(token0).transferFrom(msg.sender, address(this), uint256(-amount0)), 'T0');
            require(IERC20(token1).transfer(recipient, uint256(amount1)), 'T1');
        } else {
            amount0 = int256(amountAfterFee);
            amount1 = -int256(amountSpecified);
            
            // Update protocol fees
            protocolFees1 = uint128(uint256(protocolFees1).add(feeAmount));
            
            // Transfer tokens
            require(IERC20(token1).transferFrom(msg.sender, address(this), uint256(-amount1)), 'T1');
            require(IERC20(token0).transfer(recipient, uint256(amount0)), 'T0');
        }

        slot0.unlocked = true;

        emit Swap(msg.sender, recipient, amount0, amount1, slot0.sqrtPriceX96, liquidity, slot0.tick);
    }
}
