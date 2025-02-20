import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-typechain";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

export default {
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
      accounts: process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(',') : [],
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
