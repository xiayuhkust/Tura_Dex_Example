// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "forge-std/Script.sol";
import "../src/UniswapV3Factory.sol";
import "../src/UniswapV3Manager.sol";
import "../src/UniswapV3Pool.sol";
import "../src/UniswapV3Quoter.sol";
import "../src/interfaces/IERC20.sol";

contract DeployTura is Script {
    address constant WTURA = 0xF0e8a104Cc6ecC7bBa4Dc89473d1C64593eA69be;
    address constant TT1 = 0x3F26F01Fa9A5506c9109B5Ad15343363909fc0b9;
    address constant TT2 = 0x8FDCE0D41f0A99B5f9FbcFAfd481ffcA61d01122;

    function run() public {
        vm.startBroadcast();

        // Deploy core contracts
        UniswapV3Factory factory = new UniswapV3Factory();
        UniswapV3Manager manager = new UniswapV3Manager(address(factory));
        UniswapV3Quoter quoter = new UniswapV3Quoter(address(factory));

        // Create initial pools
        factory.createPool(WTURA, TT1, 3000); // 0.3% fee tier
        factory.createPool(WTURA, TT2, 3000); // 0.3% fee tier
        factory.createPool(TT1, TT2, 500);    // 0.05% fee tier

        vm.stopBroadcast();

        // Log addresses for documentation
        console.log("Deployed contracts:");
        console.log("Factory:", address(factory));
        console.log("Manager:", address(manager));
        console.log("Quoter:", address(quoter));
    }
}
