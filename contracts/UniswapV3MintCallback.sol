// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import './libraries/TransferHelper.sol';
import './backup/v3/interfaces/callback/IUniswapV3MintCallback.sol';

contract UniswapV3MintCallback is IUniswapV3MintCallback {


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
