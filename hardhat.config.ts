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
        process.env.OWNER_KEY,
        process.env.WALLET1_KEY,
        process.env.WALLET2_KEY
      ].filter(Boolean),
      timeout: 60000,
      gasPrice: "auto"
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5"
  }
};

export default config;
