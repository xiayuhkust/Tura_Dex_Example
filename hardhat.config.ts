import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.7.6",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    }
  }
};

export default config;
