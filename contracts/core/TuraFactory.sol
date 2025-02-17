// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract TuraFactory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    event PoolCreated(
        address indexed token0,
        address indexed token1,
        uint24 indexed fee,
        address pool
    );

    mapping(uint24 => bool) public feeAmountEnabled;
    mapping(address => mapping(address => mapping(uint24 => address))) public getPool;
    EnumerableSet.AddressSet private _pools;

    uint24 public constant MIN_FEE = 100; // 0.01%
    uint24 public constant MAX_FEE = 1000000; // 100%

    constructor() {
        feeAmountEnabled[3000] = true; // 0.3%
        feeAmountEnabled[5000] = true; // 0.5%
        feeAmountEnabled[10000] = true; // 1%
    }

    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool) {
        require(tokenA != tokenB, "TF: IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "TF: ZERO_ADDRESS");
        require(feeAmountEnabled[fee], "TF: FEE_NOT_ENABLED");
        require(getPool[tokenA][tokenB][fee] == address(0), "TF: POOL_EXISTS");

        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);

        // Pool contract deployment will be implemented in next phase
        pool = address(0);
        require(pool != address(0), "TF: POOL_CREATION_FAILED");

        getPool[token0][token1][fee] = pool;
        getPool[token1][token0][fee] = pool;
        _pools.add(pool);

        emit PoolCreated(token0, token1, fee, pool);
    }

    function enableFeeAmount(uint24 fee) external onlyOwner {
        require(fee >= MIN_FEE && fee <= MAX_FEE, "TF: INVALID_FEE");
        require(!feeAmountEnabled[fee], "TF: FEE_ALREADY_ENABLED");
        feeAmountEnabled[fee] = true;
    }

    function getAllPools() external view returns (address[] memory) {
        uint256 length = _pools.length();
        address[] memory pools = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            pools[i] = _pools.at(i);
        }
        return pools;
    }
}
