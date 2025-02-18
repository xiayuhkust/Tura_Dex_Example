# Cleanup Documentation

## Removed Contracts
- contracts/periphery/* - Replaced by V3 implementation
  * NonfungiblePositionManager.sol
  * SwapRouter.sol
- contracts/backup/* - Old implementation files
  * core/TestToken.sol
  * core/TuraFactory.sol
  * core/TuraPool.sol
  * core/WETH9.sol
  * interfaces/ITuraPool.sol
  * libraries/FullMath.sol
  * libraries/Position.sol
  * libraries/SqrtPriceMath.sol
  * libraries/TickMath.sol
  * periphery/NonfungiblePositionManager.sol
  * periphery/SwapRouter.sol

## Removed Tests
- test/TuraLiquidity.spec.ts - Not needed for V3
- test/TuraPool.spec.ts - Not needed for V3

## Package Updates
- Fixed @openzeppelin/contracts version to 3.4.2
- Fixed @openzeppelin/contracts-upgradeable version to 3.4.2
- Fixed @uniswap/v3-core version to 1.0.1
- Removed unused dependencies:
  * @types/bignumber.js
  * @types/sinon-chai
  * @uniswap/v3-periphery
  * bignumber.js
  * decimal.js
  * mocha-chai-jest-snapshot
