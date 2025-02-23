# Tura DEX Test Records

## Test Environment
- Network: Tura Blockchain
- RPC URL: https://rpc-beta1.turablockchain.com
- Chain ID: 1337
- Test Date: February 23, 2025

## Contract Tests
### Factory Tests (UniswapV3FactoryTest)
Status: ✅ All Passed
- [x] Pool Creation (testCreatePool)
  - Verifies correct pool deployment
  - Validates pool registry updates
  - Checks pool parameters (tokens, fee, tick spacing)
- [x] Fee Configuration (testCreatePoolUnsupportedFee)
  - Validates fee tier restrictions (500, 3000)
- [x] Input Validation
  - Prevents identical tokens (testCreatePoolIdenticalTokens)
  - Prevents zero address tokens (testCreateZeroTokenAddress)
  - Prevents duplicate pools (testCreateAlreadyExists)

### Pool Tests (UniswapV3PoolTest)
Status: ✅ All Passed
- [x] Initialization (testInitialize)
  - Validates initial pool state
- [x] Liquidity Management
  - Mint positions (testMintInRange, testMintRangeAbove, testMintRangeBelow)
  - Burn positions (testBurn, testBurnPartially)
  - Validates position overlaps (testMintOverlappingRanges)
  - Input validation (testMintZeroLiquidity, testMintInvalidTickRangeLower, testMintInvalidTickRangeUpper)
- [x] Token Collection
  - Full collection (testCollect)
  - Partial collection (testCollectPartially)
  - Edge cases (testCollectAfterZeroBurn, testCollectMoreThanAvailable)
- [x] Flash Loans
  - Basic flash loan functionality (testFlash)

## Test Token Addresses
- WTURA (Wrapped Tura)
  - Address: 0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be
  - Used in: Pool creation tests, liquidity tests
- Test Token 1 (TT1)
  - Address: 0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9
  - Used in: Pool creation tests, liquidity tests
- Test Token 2 (TT2)
  - Address: 0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122
  - Used in: Pool creation tests, liquidity tests

## Test Coverage Summary
- Total Test Suites: 2
- Total Tests: 21
- Factory Tests: 5 passed
- Pool Tests: 16 passed
- Failed Tests: 0
- Skipped Tests: 0
