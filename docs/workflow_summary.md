# Tura DEX Workflow Summary

## 1. Frontend WETH Wrap/Unwrap Flow
### Components
- WrapUnwrap.tsx: Main component for WETH conversion
- Location: `frontend/src/components/WrapUnwrap.tsx`

### Contract Interactions
- TuraWETH Contract: 0x981Ad9e1565bb8325c9C9bBf80758529E7C50994
- Functions: deposit(), withdraw()

### Scripts
- deploy-turaweth.ts: Deploy WETH contract
- test-weth.ts: Test WETH functionality
- verify-weth.ts: Verify contract deployment

## 2. Liquidity Page Pool Creation Flow
### Components
- LiquidityPage.tsx: Main liquidity management page
- AddLiquidityModal.tsx: Pool creation interface
- Location: `frontend/src/pages/LiquidityPage.tsx`

### Contract Interactions
- Factory Contract: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347
- Functions: createPool(), setFeeProtocol()

### Scripts
- check-factory.ts: Factory contract verification
- check-fee-tier.ts: Pool fee tier verification
- get-pool.ts: Pool state inspection

## 3. Position Management and Liquidity Addition Flow
### Components
- PositionManager Contract: 0x7f94440f5CB70c496C054DB50c3f0f5414AD8216
- TT1/TT2 Pool: 0x0344B0e5Db28bbFD066EDC3a9CbEca244Aa7e347

### Implementation Details
1. Position Management:
   - Secure position tracking using keccak256 keys
   - Token approval through PositionManager
   - Enhanced callback handling

2. Pool State:
   - Initial Price: 1:1 (sqrtPriceX96: 79228162514264337593543950336)
   - Current Liquidity: 100500000000000000000
   - Token Balances:
     - TT1: 0.301033173069033485
     - TT2: 0.301033173069033485

### Scripts
1. Core Scripts:
   - add-liquidity.js: Main liquidity addition script
   - verify-pool-state.js: Pool state verification
   - deploy-position-manager.js: PositionManager deployment

2. Utility Scripts:
   - shared/utilities.ts: Common utilities
   - test-token-transfers.ts: Token transfer testing

3. Verification Scripts:
   - verify-liquidity.ts: Liquidity verification
   - check-factory.ts: Factory verification
   - check-fee-tier.ts: Fee tier verification
   - get-pool.ts: Pool state inspection

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
