import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    tura: {
      url: process.env.TURA_RPC || "https://rpc-beta1.turablockchain.com",
      chainId: Number(process.env.TURA_CHAIN_ID) || 1337,
      accounts: [
        process.env.OWNER_KEY || "ad6fb1ceb0b9dc598641ac1cef545a7882b52f5a12d7204d6074762d96a8a474",
        process.env.TRADER_KEY || "23b979da42297796b2216cb8c9f1496fba7c1b60e95aaac37935c5e50166d8d4",
        process.env.FEE_COLLECTOR_KEY || "7da572101629e7e24fd80c8e8918f718f2638365e3ca30866794f06b2147278e"
      ]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
