const { ethers } = require("hardhat");

async function main() {
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy PositionManager
    const PositionManager = await ethers.getContractFactory("PositionManager");
    const positionManager = await PositionManager.deploy();
    await positionManager.deployed();
    console.log("PositionManager deployed to:", positionManager.address);

    // Save address to .env file
    const fs = require('fs');
    const envPath = './.env';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or append POSITION_MANAGER_ADDRESS
    if (envContent.includes('POSITION_MANAGER_ADDRESS=')) {
        envContent = envContent.replace(
            /POSITION_MANAGER_ADDRESS=.*/,
            `POSITION_MANAGER_ADDRESS=${positionManager.address}`
        );
    } else {
        envContent += `\nPOSITION_MANAGER_ADDRESS=${positionManager.address}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env with POSITION_MANAGER_ADDRESS");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
