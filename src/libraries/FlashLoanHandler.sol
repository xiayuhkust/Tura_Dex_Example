// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.19;

import "../interfaces/IERC20.sol";
import "../interfaces/IUniswapV3FlashCallback.sol";
import "../lib/Math.sol";

library FlashLoanHandler {
    error FlashLoanNotPaid();

    function handleFlashLoan(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint24 fee,
        address recipient,
        bytes calldata data
    ) external {
        uint256 fee0 = Math.mulDivRoundingUp(amount0, fee, 1e6);
        uint256 fee1 = Math.mulDivRoundingUp(amount1, fee, 1e6);

        uint256 balance0Before = IERC20(token0).balanceOf(address(this));
        uint256 balance1Before = IERC20(token1).balanceOf(address(this));

        if (amount0 > 0) IERC20(token0).transfer(recipient, amount0);
        if (amount1 > 0) IERC20(token1).transfer(recipient, amount1);

        IUniswapV3FlashCallback(recipient).uniswapV3FlashCallback(
            fee0,
            fee1,
            data
        );

        if (IERC20(token0).balanceOf(address(this)) < balance0Before + fee0)
            revert FlashLoanNotPaid();
        if (IERC20(token1).balanceOf(address(this)) < balance1Before + fee1)
            revert FlashLoanNotPaid();
    }
}
