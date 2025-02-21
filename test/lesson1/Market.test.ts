import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Market", function() {
    let market: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;

    beforeEach(async function() {
        [owner, addr1] = await ethers.getSigners();
        const Market: ContractFactory = await ethers.getContractFactory("Market");
        market = await Market.deploy();
        await market.deployed();
    });

    describe("Order Book", function() {
        it("should allow placing orders", async function() {
            const price = 100;
            const amount = 10;
            
            await market.placeOrder(price, amount, true);
            expect(await market.getOrderCount()).to.equal(1);
        });

        it("should emit OrderPlaced event", async function() {
            const price = 100;
            const amount = 10;
            
            await expect(market.placeOrder(price, amount, true))
                .to.emit(market, "OrderPlaced")
                .withArgs(owner.address, price, amount, true);
        });

        it("should reject orders with zero amount", async function() {
            await expect(
                market.placeOrder(100, 0, true)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("should reject orders with zero price", async function() {
            await expect(
                market.placeOrder(0, 10, true)
            ).to.be.revertedWith("Price must be greater than 0");
        });
    });
});
