// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.7.6;

import "./interfaces/IUniswapV3Factory.sol";
import "../UniswapV3Pool.sol";

contract UniswapV3Factory is IUniswapV3Factory {
    address public override owner;
    mapping(uint24 => int24) public override feeAmountTickSpacing;
    mapping(address => mapping(address => mapping(uint24 => address))) public override getPool;

    constructor() {
        owner = msg.sender;
        emit OwnerChanged(address(0), msg.sender);

        feeAmountTickSpacing[500] = 10;
        emit FeeAmountEnabled(500, 10);
        feeAmountTickSpacing[3000] = 60;
        emit FeeAmountEnabled(3000, 60);
        feeAmountTickSpacing[10000] = 200;
        emit FeeAmountEnabled(10000, 200);
    }

    function createPool(address tokenA, address tokenB, uint24 fee) external override returns (address pool) {
        require(tokenA != tokenB, "Same token");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        int24 tickSpacing = feeAmountTickSpacing[fee];
        require(tickSpacing != 0, "Invalid fee");
        require(getPool[token0][token1][fee] == address(0), "Pool exists");
        
        // Deploy pool
        pool = address(new UniswapV3Pool(
            address(this),
            token0,
            token1,
            fee
        ));
        
        // Initialize pool with 1:1 price
        UniswapV3Pool(pool).initialize(uint160(1 << 96)); // 1.0 in Q96
        
        // Store pool address
        getPool[token0][token1][fee] = pool;
        getPool[token1][token0][fee] = pool; // populate reverse mapping
        
        emit PoolCreated(token0, token1, fee, tickSpacing, pool);
    }

    function setOwner(address _owner) external override {
        require(msg.sender == owner, "Not owner");
        emit OwnerChanged(owner, _owner);
        owner = _owner;
    }

    function enableFeeAmount(uint24 fee, int24 tickSpacing) external override {
        require(msg.sender == owner, "Not owner");
        require(fee < 1000000, "Invalid fee");
        require(tickSpacing > 0 && tickSpacing < 16384, "Invalid tickSpacing");
        require(feeAmountTickSpacing[fee] == 0, "Fee already enabled");

        feeAmountTickSpacing[fee] = tickSpacing;
        emit FeeAmountEnabled(fee, tickSpacing);
    }
}
