# Tura DEX Workflow Summary

## 1. Frontend WETH Wrap/Unwrap Flow
### Components
- WrapUnwrap.tsx: Main component for WETH conversion
  - Location: `frontend/src/components/WrapUnwrap.tsx`
  - Handles native Tura to WETH conversion
  - Manages user balance display
  - Provides wrap/unwrap interface

### Contract Interactions
- TuraWETH Contract: 0x981Ad9e1565bb8325c9C9bBf80758529E7C50994
- Key Functions:
  - deposit(): Convert native Tura to WETH
  - withdraw(): Convert WETH back to native Tura
  - balanceOf(): Check WETH balance
  - approve(): Approve spending for DEX

### Scripts
- deploy-turaweth.ts: Deploy WETH contract
  - Sets up initial contract state
  - Verifies deployment
  - Updates environment variables

- test-weth.ts: Test WETH functionality
  - Tests deposit/withdraw functions
  - Verifies balance tracking
  - Tests approval mechanism

- verify-weth.ts: Verify contract deployment
  - Checks contract bytecode
  - Verifies contract parameters
  - Confirms owner settings

### Usage Flow
1. Connect Wallet:
   ```javascript
   // In WrapUnwrap.tsx
   const { account } = useWeb3React()
   ```

2. Check Balances:
   ```javascript
   // Get native balance
   const balance = await provider.getBalance(account)
   // Get WETH balance
   const wethBalance = await wethContract.balanceOf(account)
   ```

3. Wrap Tura:
   ```javascript
   await wethContract.deposit({ value: amount })
   ```

4. Unwrap WETH:
   ```javascript
   await wethContract.withdraw(amount)
   ```

### Error Handling
- Insufficient balance checks
- Failed transaction handling
- Network state validation
- User feedback mechanisms

## 2. Liquidity Page Pool Creation Flow
### Components
- LiquidityPage.tsx: Main liquidity management page
  - Location: `frontend/src/pages/LiquidityPage.tsx`
  - Handles pool listing and creation
  - Manages token selection interface
  - Displays pool creation status

- AddLiquidityModal.tsx: Pool creation interface
  - Location: `frontend/src/components/AddLiquidityModal.tsx`
  - Token pair selection
  - Fee tier configuration
  - Initial price setting
  - Position range selection

### Contract Interactions
- Factory Contract: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347
- Key Functions:
  - createPool(): Deploy new pool contract
  - setFeeProtocol(): Configure fee settings
  - getPool(): Get existing pool address
  - fee(): Get current fee tier

### Scripts
- check-factory.ts: Factory contract verification
  - Verifies factory deployment
  - Checks fee tier configuration
  - Tests pool creation

- check-fee-tier.ts: Pool fee tier verification
  - Validates fee settings
  - Checks tier compatibility
  - Tests fee calculations

- get-pool.ts: Pool state inspection
  - Retrieves pool details
  - Checks token addresses
  - Verifies liquidity state

### Usage Flow
1. Initialize Pool Creation:
   ```javascript
   // In AddLiquidityModal.tsx
   const createPool = async () => {
     const factory = new Contract(factoryAddress, factoryABI, signer)
     await factory.createPool(token0, token1, feeTier)
   }
   ```

2. Configure Pool Settings:
   ```javascript
   // Set initial price
   const sqrtPriceX96 = encodePriceSqrt(token0Amount, token1Amount)
   await pool.initialize(sqrtPriceX96)
   ```

3. Verify Pool Creation:
   ```javascript
   const poolAddress = await factory.getPool(token0, token1, feeTier)
   const pool = new Contract(poolAddress, poolABI, signer)
   ```

### Error Handling
- Token order validation
- Fee tier verification
- Price range checks
- Duplicate pool detection
- Failed transaction recovery

## 3. Position Management and Liquidity Addition Flow
### Components
1. PositionManager Contract:
   - Address: 0x7f94440f5CB70c496C054DB50c3f0f5414AD8216
   - Features:
     - Position tracking with unique keys
     - Secure token transfers
     - Liquidity management
     - Callback handling

2. TT1/TT2 Pool:
   - Address: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347
   - Token0 (TT1): 0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9
   - Token1 (TT2): 0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122

### Implementation Details
1. Position Management:
   - Position Key Generation:
     ```javascript
     const positionKey = ethers.utils.keccak256(
       ethers.utils.defaultAbiCoder.encode(
         ['address', 'address', 'int24', 'int24'],
         [owner.address, poolAddress, tickLower, tickUpper]
       )
     )
     ```
   - Token Approval Flow:
     ```javascript
     await token0.approve(positionManager, amount0)
     await token1.approve(positionManager, amount1)
     ```
   - Position Tracking:
     - Unique keys per position
     - Tick range tracking
     - Liquidity amount tracking

2. Liquidity Addition:
   - Initial Setup:
     ```javascript
     const tickSpacing = 60
     const tickLower = -tickSpacing
     const tickUpper = tickSpacing
     const liquidity = amount0.div(2)
     ```
   - Token Transfer:
     - Secure transfer through TransferHelper
     - Proper approval verification
     - Balance checks before/after

3. Pool State:
   - Initial Price: 1:1 (sqrtPriceX96: 79228162514264337593543950336)
   - Current Liquidity: 100500000000000000000
   - Token Balances:
     - TT1: 0.301033173069033485
     - TT2: 0.301033173069033485
   - Current Tick: 0

### Scripts
1. Core Scripts:
   - add-liquidity.js:
     - Main liquidity addition implementation
     - Position management
     - Token approval handling
     - Transaction execution

   - verify-pool-state.js:
     - Pool state verification
     - Token balance checks
     - Position state validation
     - Liquidity verification

   - deploy-position-manager.js:
     - Contract deployment
     - Initial setup
     - Environment configuration

2. Utility Scripts:
   - shared/utilities.ts:
     - Price calculation utilities
     - Position key generation
     - Common helper functions

   - test-token-transfers.ts:
     - Token transfer testing
     - Approval verification
     - Balance tracking

3. Verification Scripts:
   - verify-liquidity.ts:
     - Liquidity verification
     - Position validation
     - Token balance checks

   - check-factory.ts:
     - Factory verification
     - Pool creation checks
     - Fee tier validation

   - check-fee-tier.ts:
     - Fee tier verification
     - Pool configuration checks

   - get-pool.ts:
     - Pool state inspection
     - Token configuration checks
     - Liquidity validation

### Usage Flow
1. Deploy PositionManager:
```bash
npx hardhat run scripts/deploy-position-manager.js --network tura
```

2. Add Liquidity:
```bash
npx hardhat run scripts/add-liquidity.js --network tura
```

3. Verify Pool State:
```bash
npx hardhat run scripts/verify-pool-state.js --network tura
```

### Contract Addresses
- TT1: 0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9
- TT2: 0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122
- Pool: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347
- PositionManager: 0x7f94440f5CB70c496C054DB50c3f0f5414AD8216
