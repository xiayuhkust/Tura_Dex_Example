import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-typechain";
import * as dotenv from "dotenv";

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
      accounts: [process.env.PRIVATE_KEYS || ""],
      timeout: 60000,
      gasPrice: "auto",
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000
    },
    hardhat: {
      forking: {
        url: process.env.TURA_RPC_URL || "https://rpc-beta1.turablockchain.com",
        blockNumber: 1000
      },
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000
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
