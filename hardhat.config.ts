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
      url: "http://43.135.26.222:8000",
      chainId: 1337,
      accounts: ["ad6fb1ceb0b9dc598641ac1cef545a7882b52f5a12d7204d6074762d96a8a474"]
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
