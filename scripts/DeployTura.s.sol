// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.19;

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

        // Deploy Factory first
        UniswapV3Factory factory = new UniswapV3Factory();
        console.log("Factory deployed at:", address(factory));

        vm.stopBroadcast();
        vm.startBroadcast();

        // Deploy Manager
        UniswapV3Manager manager = new UniswapV3Manager(address(factory));
        console.log("Manager deployed at:", address(manager));

        vm.stopBroadcast();
        vm.startBroadcast();

        // Deploy Quoter
        UniswapV3Quoter quoter = new UniswapV3Quoter(address(factory));
        console.log("Quoter deployed at:", address(quoter));

        vm.stopBroadcast();
        vm.startBroadcast();

        // Create pools one by one
        factory.createPool(WTURA, TT1, 3000); // 0.3% fee tier
        console.log("Created WTURA/TT1 pool");

        vm.stopBroadcast();
        vm.startBroadcast();

        factory.createPool(WTURA, TT2, 3000); // 0.3% fee tier
        console.log("Created WTURA/TT2 pool");

        vm.stopBroadcast();
        vm.startBroadcast();

        factory.createPool(TT1, TT2, 500);    // 0.05% fee tier
        console.log("Created TT1/TT2 pool");

        vm.stopBroadcast();
    }
}
