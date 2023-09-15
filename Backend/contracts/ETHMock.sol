// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ETHMock is ERC20 {
    constructor() ERC20("DAI Stablecoin Mock", "DAI") {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
