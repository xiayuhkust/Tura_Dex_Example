// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import './libraries/TransferHelper.sol';
import './libraries/Position.sol';
import './backup/v3/interfaces/callback/IUniswapV3MintCallback.sol';

contract UniswapV3MintCallback is IUniswapV3MintCallback {
    using Position for mapping(bytes32 => Position.Info);
    using Position for Position.Info;

    mapping(bytes32 => Position.Info) public positions;

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

        // Update position
        bytes32 positionKey = keccak256(abi.encodePacked(payer, msg.sender));
        Position.Info storage position = positions[positionKey];
        
        // Calculate total amount in terms of liquidity
        uint128 liquidityAmount = uint128(amount0Owed + amount1Owed);
        
        // Update position with new liquidity
        position.update(
            int128(liquidityAmount),
            0, // No fee growth for initial mint
            0  // No fee growth for initial mint
        );
    }
}
