// @ts-nocheck
const { ethers } = require("hardhat");
const TURA_RPC_URL = "https://rpc-beta1.turablockchain.com";

async function main() {
    const [owner] = await ethers.getSigners();
    console.log('Using owner account:', owner.address);
    
    // Test token addresses
    const token0Address = '0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9'; // TT1
    const token1Address = '0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122'; // TT2
    
    // Get token contracts
    const token0Contract = await ethers.getContractAt('contracts/backup/v3/interfaces/IERC20Minimal.sol:IERC20Minimal', token0Address);
    const token1Contract = await ethers.getContractAt('contracts/backup/v3/interfaces/IERC20Minimal.sol:IERC20Minimal', token1Address);
    
    // Test amounts
    const amount = ethers.utils.parseUnits('1000', 18);
    
    console.log('Testing token transfers...');
    
    // Get initial balances
    const initialBalance0 = await token0Contract.balanceOf(owner.address);
    const initialBalance1 = await token1Contract.balanceOf(owner.address);
    
    console.log('Initial balances:');
    console.log('TT1:', ethers.utils.formatUnits(initialBalance0, 18));
    console.log('TT2:', ethers.utils.formatUnits(initialBalance1, 18));
    
    try {
        // Test approvals
        console.log('Testing token approvals...');
        await token0Contract.approve(owner.address, amount);
        await token1Contract.approve(owner.address, amount);
        console.log('Token approvals successful');

        // Test allowances
        const allowance0 = await token0Contract.allowance(owner.address, owner.address);
        const allowance1 = await token1Contract.allowance(owner.address, owner.address);
        console.log('Allowances:');
        console.log('TT1:', ethers.utils.formatUnits(allowance0, 18));
        console.log('TT2:', ethers.utils.formatUnits(allowance1, 18));
        
        // Test transfers
        console.log('Testing token transfers...');
        await token0Contract.transfer(owner.address, amount);
        await token1Contract.transfer(owner.address, amount);
        console.log('Token transfers successful');
        
        // Get final balances
        const finalBalance0 = await token0Contract.balanceOf(owner.address);
        const finalBalance1 = await token1Contract.balanceOf(owner.address);
        
        console.log('Final balances:');
        console.log('TT1:', ethers.utils.formatUnits(finalBalance0, 18));
        console.log('TT2:', ethers.utils.formatUnits(finalBalance1, 18));
        
        console.log('All token operations successful');
    } catch (error) {
        console.error('Error in token operations:', error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
