// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FakeTornado {
    mapping(bytes32 => bool) public commitments;
    mapping(address => uint256) public balances;

    event Deposit(bytes32 indexed commitment);
    event Withdraw(address indexed to);

    function deposit(bytes32 commitment) public payable {
        require(msg.value > 0, "Deposit must be greater than 0");
        commitments[commitment] = true;
        balances[msg.sender] += msg.value;
        emit Deposit(commitment);
    }

    function withdraw(address to) public {
        require(balances[msg.sender] > 0, "No balance to withdraw");
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        payable(to).transfer(amount);
        emit Withdraw(to);
    }
}