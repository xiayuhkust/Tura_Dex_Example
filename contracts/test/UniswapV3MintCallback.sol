// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3MintCallback.sol';

contract UniswapV3MintCallback is IUniswapV3MintCallback {
    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external override {
        (address token0, address token1, address payer) = abi.decode(data, (address, address, address));

        if (amount0Owed > 0) {
            IERC20(token0).transferFrom(payer, msg.sender, amount0Owed);
        }
        if (amount1Owed > 0) {
            IERC20(token1).transferFrom(payer, msg.sender, amount1Owed);
        }
    }
}
