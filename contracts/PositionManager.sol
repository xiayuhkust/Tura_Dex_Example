// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import './libraries/TransferHelper.sol';
import './libraries/TickMath.sol';
import './libraries/LiquidityMath.sol';
import './libraries/Position.sol';
import './interfaces/IUniswapV3Pool.sol';
import './interfaces/callback/IUniswapV3MintCallback.sol';

contract PositionManager is IUniswapV3MintCallback {
    using Position for mapping(bytes32 => Position.Info);
    using Position for Position.Info;

    mapping(bytes32 => Position.Info) public positions;
    
    function addLiquidity(
        address pool,
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes calldata data
    ) external returns (uint256 amount0, uint256 amount1) {
        // Get position info
        bytes32 positionKey = keccak256(abi.encodePacked(recipient, pool, tickLower, tickUpper));
        Position.Info storage position = positions[positionKey];

        // Call pool mint function
        (amount0, amount1) = IUniswapV3Pool(pool).mint(
            recipient,
            tickLower,
            tickUpper,
            amount,
            data
        );

        // Update position with new liquidity
        position.update(int128(amount), 0, 0);

        return (amount0, amount1);
    }

    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external override {
        (address token0, address token1, address payer) = abi.decode(data, (address, address, address));
        
        // Transfer tokens directly from the payer to the pool
        if (amount0Owed > 0) {
            TransferHelper.safeTransferFrom(token0, payer, msg.sender, amount0Owed);
        }
        if (amount1Owed > 0) {
            TransferHelper.safeTransferFrom(token1, payer, msg.sender, amount1Owed);
        }
    }
}
