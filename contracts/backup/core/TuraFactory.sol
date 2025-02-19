// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ITuraFactory.sol';
import './TuraPool.sol';

contract TuraFactory is ITuraFactory, Ownable {
    mapping(uint24 => bool) public override feeAmountEnabled;
    mapping(address => mapping(address => mapping(uint24 => address))) public override getPool;
    
    constructor() {
        feeAmountEnabled[500] = true;  // 0.05%
        feeAmountEnabled[3000] = true; // 0.3%
        feeAmountEnabled[10000] = true; // 1%
    }
    
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external override returns (address pool) {
        require(tokenA != tokenB);
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0));
        require(feeAmountEnabled[fee]);
        require(getPool[token0][token1][fee] == address(0));
        
        pool = address(new TuraPool(address(this), token0, token1, fee));
        getPool[token0][token1][fee] = pool;
        getPool[token1][token0][fee] = pool;
        emit PoolCreated(token0, token1, fee, pool);
    }
    
    function enableFeeAmount(uint24 fee) external override onlyOwner {
        require(fee < 1000000);
        require(!feeAmountEnabled[fee]);
        feeAmountEnabled[fee] = true;
        emit FeeAmountEnabled(fee);
    }
}
