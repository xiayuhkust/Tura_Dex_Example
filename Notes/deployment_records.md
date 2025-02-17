# Tura DEX Deployment Records

## Network Information
- Chain ID: 1337
- RPC URL: http://43.135.26.222:8000
- Owner Address: 0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e

## Core Contracts

### WETH9
- Address: 0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be
- Description: Wrapped ETH implementation for Tura chain
- Features:
  * ERC20 compliant
  * Deposit/Withdraw native ETH
  * 18 decimals

### Test Tokens
1. Test Token 1 (TT1)
   - Address: 0xf7430841c1917Fee24B04dBbd0b809F36E5Ad716
   - Symbol: TT1
   - Initial Supply: 1,000,000 tokens
   - Decimals: 18

2. Test Token 2 (TT2)
   - Address: 0x3Cbc85319E3D9d6b29DDe06f591017e9f9666652
   - Symbol: TT2
   - Initial Supply: 1,000,000 tokens
   - Decimals: 18

### TuraFactory
- Address: 0x7A7bbc265b2CaD0a22ddCE2Db5539394b9843888
- Features:
  * Pool creation
  * Fee configuration
  * Owner management
- Default Fee Tiers:
  * 0.3% (3000)
  * 0.5% (5000)
  * 1.0% (10000)

## Peripheral Contracts

### SwapRouter
- Address: 0xd4b7fDCDcA7C56d630beF695bB802a719e893B77
- Features:
  * Single hop swaps
  * Multi-hop swaps
  * ETH/WETH handling

### NonfungiblePositionManager
- Address: 0x5Ed64A11b7F03Eb88F50395B846c8F76D7805744
- Features:
  * ERC721 compliant
  * Liquidity position management
  * Fee collection
- Token Name: "Tura Liquidity"
- Token Symbol: "TURA-LP"

## Deployment Date
February 17, 2025
