// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.6.0;

import '../interfaces/IERC20Minimal.sol';

/// @title TransferHelper
/// @notice Contains helper methods for interacting with ERC20 tokens that do not consistently return true/false
library TransferHelper {
    /// @notice Transfers tokens from msg.sender to a recipient
    /// @dev Calls transfer on token contract, errors with TF if transfer fails
    /// @param token The contract address of the token which will be transferred
    /// @param to The recipient of the transfer
    /// @param value The value of the transfer
    function safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }

    /// @notice Transfers tokens from one address to another
    /// @dev Calls transferFrom on token contract, errors with TF if transfer fails
    /// @param token The contract address of the token which will be transferred
    /// @param from The address which will spend the funds
    /// @param to The recipient of the transfer
    /// @param value The value of the transfer
    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }

    /// @notice Approves the stipulated contract to spend the given allowance in the given token
    /// @dev Calls approve on token contract, errors with TF if approve fails
    /// @param token The contract address of the token to be approved
    /// @param to The target of the approval
    /// @param value The amount of the approval
    function safeApprove(
        address token,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20Minimal.approve.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }
}
