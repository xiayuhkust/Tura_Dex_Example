// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

contract MinimalProxy {
    constructor(bytes memory _code) {
        assembly {
            let size := mload(_code)
            returndatacopy(0, 0, 0)
            codecopy(0, sub(codesize(), size), size)
            return(0, size)
        }
    }

    fallback() external payable {
        assembly {
            let target := sload(0)
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), target, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
