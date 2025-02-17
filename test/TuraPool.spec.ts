import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("TuraPool", function() {
  let pool: Contract;
  let factory: Contract;
  let token0: Contract;
  let token1: Contract;
  let owner: SignerWithAddress;

  beforeEach(async function() {
    [owner] = await ethers.getSigners();
    
    // Deploy test tokens
    const TestToken = await ethers.getContractFactory("TestToken");
    token0 = await TestToken.deploy("Test Token 0", "TT0");
    token1 = await TestToken.deploy("Test Token 1", "TT1");
    
    // Deploy factory
    const TuraFactory = await ethers.getContractFactory("TuraFactory");
    factory = await TuraFactory.deploy();
    
    // Create pool
    await factory.createPool(token0.address, token1.address, 3000);
    const poolAddress = await factory.getPool(token0.address, token1.address, 3000);
    pool = await ethers.getContractAt("TuraPool", poolAddress);
  });

  it("Should initialize pool with correct parameters", async function() {
    const sqrtPriceX96 = "79228162514264337593543950336"; // 1:1 price
    await pool.initialize(sqrtPriceX96);
    
    const slot0 = await pool.slot0();
    expect(slot0.sqrtPriceX96.toString()).to.equal(sqrtPriceX96);
  });
});
