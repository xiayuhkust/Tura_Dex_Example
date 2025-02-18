import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "@typechain/ethers-v5";
import * as dotenv from "dotenv";

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
      url: process.env.TURA_RPC_URL || "https://rpc-beta1.turablockchain.com",
      chainId: Number(process.env.TURA_CHAIN_ID || "1337"),
      accounts: [
        "ad6fb1ceb0b9dc598641ac1cef545a7882b52f5a12d7204d6074762d96a8a474",
        "23b979da42297796b2216cb8c9f1496fba7c1b60e95aaac37935c5e50166d8d4",
        "7da572101629e7e24fd80c8e8918f718f2638365e3ca30866794f06b2147278e"
      ],
      timeout: 60000,
      gasPrice: "auto"
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
