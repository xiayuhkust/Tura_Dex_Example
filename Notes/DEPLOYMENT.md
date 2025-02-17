# Tura DEX Deployment Documentation

## Network Configuration
- Network: Tura Blockchain
- RPC URL: https://rpc-beta1.turablockchain.com
- Chain ID: 1337
- Test Account: 0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e

## Deployed Contracts

### Phase 1: Core Contracts

#### Factory Contract
- Address: 0x4cc45Fd3C9823f6Dc147197b8308A1498062834d
- Deployment Date: February 17, 2025
- Owner: 0x08Bb6eA809A2d6c13D57166Fa3ede48C0ae9a70e
- Configured Fee Tiers:
  - 0.05% (500) - Tick Spacing: 10
  - 0.3% (3000) - Tick Spacing: 60
  - 1% (10000) - Tick Spacing: 200

### Verification Steps
1. Owner set correctly
2. Fee configurations verified
3. Basic pool creation functionality tested

### Next Steps
1. Deploy Router contract
2. Deploy NFT Position Descriptor
3. Deploy NFT Position Manager
