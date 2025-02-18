# Test Accounts

This document outlines the test accounts used in the Tura DEX development and testing.

## Account Roles

1. **Owner/Liquidity Provider**
   - Address: `0x...` (derived from private key)
   - Private Key: `ad6fb1ceb0b9dc598641ac1cef545a7882b52f5a12d7204d6074762d96a8a474`
   - Role: Deploys contracts, provides initial liquidity

2. **Trader**
   - Address: `0x...` (derived from private key)
   - Private Key: `23b979da42297796b2216cb8c9f1496fba7c1b60e95aaac37935c5e50166d8d4`
   - Role: Executes trades, tests swap functionality

3. **Fee Collector**
   - Address: `0x...` (derived from private key)
   - Private Key: `7da572101629e7e24fd80c8e8918f718f2638365e3ca30866794f06b2147278e`
   - Role: Collects protocol fees

## Usage

These accounts are configured in the `.env` file and used in `hardhat.config.ts`. The environment variables are:

```
OWNER_KEY=...
TRADER_KEY=...
FEE_COLLECTOR_KEY=...
```

## Security Note

These are test accounts only. Do not use these private keys on mainnet or with real funds.
