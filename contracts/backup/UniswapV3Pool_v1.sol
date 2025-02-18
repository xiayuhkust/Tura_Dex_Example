// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '../factory/interfaces/IUniswapV3Pool.sol';
import '../factory/interfaces/IUniswapV3Factory.sol';
import '../factory/libraries/TickMath.sol';
import '../factory/interfaces/IPosition.sol';
import '../factory/libraries/Position.sol';
import '../factory/libraries/SqrtPriceMath.sol';
import '../factory/libraries/Tick.sol';
import '../factory/libraries/FullMath.sol';
import '../factory/libraries/FixedPoint128.sol';

// Content from UniswapV3Pool.sol
