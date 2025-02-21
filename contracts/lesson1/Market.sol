// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

/// @title Basic Market Concepts
/// @notice Demonstrates fundamental market concepts from Lesson 1
contract Market {
    /// @notice Represents an order in the order book
    struct Order {
        address trader;
        uint256 price;
        uint256 amount;
        bool isBuyOrder;
    }

    /// @notice Array of all orders in the market
    Order[] public orderBook;

    /// @notice Emitted when a new order is added
    event OrderPlaced(
        address indexed trader,
        uint256 price,
        uint256 amount,
        bool isBuyOrder
    );

    /// @notice Places a new order in the order book
    function placeOrder(
        uint256 price,
        uint256 amount,
        bool isBuyOrder
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(price > 0, "Price must be greater than 0");

        orderBook.push(
            Order({
                trader: msg.sender,
                price: price,
                amount: amount,
                isBuyOrder: isBuyOrder
            })
        );

        emit OrderPlaced(msg.sender, price, amount, isBuyOrder);
    }

    /// @notice Gets the current number of orders in the book
    function getOrderCount() external view returns (uint256) {
        return orderBook.length;
    }
}
