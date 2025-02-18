// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import '@openzeppelin/contracts/math/SafeMath.sol';
import './FullMath.sol';

library SqrtPriceMath {
    using SafeMath for uint256;

    function getAmount0Delta(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 liquidity,
        bool roundUp
    ) internal pure returns (uint256 amount0) {
        if (sqrtRatioAX96 > sqrtRatioBX96)
            (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);

        // Scale down sqrt price ratios to avoid overflow
        uint160 scaledRatioA = sqrtRatioAX96 / 1e24;
        uint160 scaledRatioB = sqrtRatioBX96 / 1e24;
        
        uint256 numerator1 = uint256(liquidity) << 72; // Use 3/4 of the bits
        uint256 numerator2 = scaledRatioB - scaledRatioA;

        require(scaledRatioA > 0);

        uint256 amount = roundUp
            ? FullMath.mulDivRoundingUp(numerator1, numerator2, scaledRatioB)
            : FullMath.mulDiv(numerator1, numerator2, scaledRatioB);
            
        return amount / 1e24; // Scale back down to maintain precision
    }

    function getAmount1Delta(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 liquidity,
        bool roundUp
    ) internal pure returns (uint256 amount1) {
        if (sqrtRatioAX96 > sqrtRatioBX96)
            (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);

        // Scale down sqrt price ratios to avoid overflow
        uint160 scaledRatioA = sqrtRatioAX96 / 1e24;
        uint160 scaledRatioB = sqrtRatioBX96 / 1e24;

        uint256 amount = roundUp
            ? FullMath.mulDivRoundingUp(
                liquidity,
                scaledRatioB - scaledRatioA,
                2**72 // Use 3/4 of the bits
            )
            : FullMath.mulDiv(liquidity, scaledRatioB - scaledRatioA, 2**72);
            
        return amount / 1e24; // Scale back down to maintain precision
    }

    function getNextSqrtPriceFromAmount0RoundingUp(
        uint160 sqrtPX96,
        uint128 liquidity,
        uint256 amount,
        bool add
    ) internal pure returns (uint160) {
        if (amount == 0) return sqrtPX96;
        uint256 numerator1 = uint256(liquidity) << 96;

        if (add) {
            uint256 product;
            if ((product = amount * sqrtPX96) / amount == sqrtPX96) {
                uint256 denom = numerator1 + product;
                if (denom >= numerator1)
                    return uint160(FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denom));
            }

            uint256 denominator = (numerator1 / sqrtPX96).add(amount);
            return uint160((numerator1 + denominator - 1) / denominator);
        } else {
            uint256 product;
            require((product = amount * sqrtPX96) / amount == sqrtPX96);

            require(numerator1 > product);
            uint256 denominator = numerator1 - product;
            return uint160(FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator));
        }
    }

    function getNextSqrtPriceFromAmount1RoundingDown(
        uint160 sqrtPX96,
        uint128 liquidity,
        uint256 amount,
        bool add
    ) internal pure returns (uint160) {
        if (add) {
            uint256 quotient = (amount << 96) / liquidity;
            return uint160(uint256(sqrtPX96).add(quotient));
        } else {
            uint256 quotient = FullMath.mulDivRoundingUp(amount, uint256(1 << 96), liquidity);
            require(sqrtPX96 > quotient);
            return uint160(uint256(sqrtPX96).sub(quotient));
        }
    }
}
