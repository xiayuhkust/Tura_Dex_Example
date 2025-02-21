// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3MintCallback.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

abstract contract BaseLiquidityManagement is IUniswapV3MintCallback {
    struct MintCallbackData {
        address token0;
        address token1;
        address payer;
    }

    /// @inheritdoc IUniswapV3MintCallback
    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external virtual override {
        MintCallbackData memory decoded = abi.decode(data, (MintCallbackData));
        
        if (amount0Owed > 0) {
            IERC20(decoded.token0).transferFrom(decoded.payer, msg.sender, amount0Owed);
        }
        if (amount1Owed > 0) {
            IERC20(decoded.token1).transferFrom(decoded.payer, msg.sender, amount1Owed);
        }
    }

    function mint(
        address pool,
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        address token0,
        address token1
    ) internal returns (uint256 amount0, uint256 amount1) {
        // Encode callback data
        bytes memory data = abi.encode(
            MintCallbackData({
                token0: token0,
                token1: token1,
                payer: msg.sender
            })
        );

        // Call pool mint function
        (amount0, amount1) = IUniswapV3Pool(pool).mint(
            recipient,
            tickLower,
            tickUpper,
            amount,
            data
        );
    }
}
