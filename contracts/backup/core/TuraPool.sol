// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/ITuraPool.sol';

contract TuraPool is ITuraPool {
    using SafeMath for uint256;
    
    address public immutable override factory;
    address public immutable override token0;
    address public immutable override token1;
    uint24 public immutable override fee;
    
    uint256 public override reserve0;
    uint256 public override reserve1;
    
    constructor(
        address _factory,
        address _token0,
        address _token1,
        uint24 _fee
    ) {
        factory = _factory;
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
    }
    
    function mint(address recipient) external override returns (uint256 liquidity) {
        (uint256 _reserve0, uint256 _reserve1) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);
        uint256 amount1 = balance1.sub(_reserve1);
        
        liquidity = Math.min(
            amount0.mul(totalSupply) / _reserve0,
            amount1.mul(totalSupply) / _reserve1
        );
        require(liquidity > 0, 'ILM');
        
        _mint(recipient, liquidity);
        
        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }
    
    function getReserves() public view override returns (uint256 _reserve0, uint256 _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }
    
    function _update(uint256 balance0, uint256 balance1) private {
        reserve0 = balance0;
        reserve1 = balance1;
        emit Sync(reserve0, reserve1);
    }
}
