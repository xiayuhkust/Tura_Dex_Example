# Liquidity Testing Focus

## Overview
This document outlines the current testing focus for liquidity addition functionality in the Tura DEX implementation.

## Contract Addresses
- Test Token 1 (TT1): `0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9`
- Test Token 2 (TT2): `0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122`
- Pool: `0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347`

## Implementation Details
- Basic liquidity operations are implemented using direct pool contract functions
- Liquidity management is based on `contracts/periphery/base/LiquidityManagement.sol`
- Token amounts are handled with 18 decimal precision (multiplied by 10^18)

## Testing Focus Areas
1. Direct Pool Contract Interaction
   - Proper token approval and transfer verification
   - Correct tick range calculation and validation
   - Accurate liquidity amount calculation
   - Transaction callback implementation

2. Token Operations
   - Token balance verification before and after operations
   - Proper decimal handling (18 decimals)
   - Token approval workflow

3. Error Handling
   - Invalid tick range validation
   - Insufficient token balance checks
   - Transaction failure recovery
   - Callback validation

4. State Verification
   - Pool liquidity updates
   - Token balance changes
   - Position tracking

## Test Cases
1. Basic Liquidity Addition
   - Add equal amounts of both tokens
   - Verify token transfers
   - Check pool state updates

2. Edge Cases
   - Minimum tick range
   - Maximum tick range
   - Zero liquidity validation
   - Invalid token order handling

3. Error Scenarios
   - Insufficient token balance
   - Invalid tick range
   - Unauthorized callbacks
   - Transaction timeout handling

## Testing Environment
- Local Hardhat environment
- Test tokens with public mint function
- Direct pool contract interaction
- Custom test contracts for callback handling
