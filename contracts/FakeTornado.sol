// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; 

contract FakeTornado {
    // Αποθηκεύει τα commitments ως μια αντιστοίχιση από hash σε boolean
    mapping(bytes32 => bool) public commitments;
    // Αποθηκεύει τα υπόλοιπα των χρηστών ως αντιστοίχιση από διεύθυνση σε uint256
    mapping(address => uint256) public balances;

    
    event Deposit(bytes32 indexed commitment);      // Συμβάν όταν γίνεται κατάθεση
    event Withdraw(address indexed to);             // Συμβάν όταν γίνεται ανάληψη

    // Συνάρτηση για κατάθεση χρημάτων με τη χρήση ενός commitment hash
    function deposit(bytes32 commitment) public payable {
        require(msg.value > 0, "Deposit must be greater than 0"); 
        commitments[commitment] = true;             // Καταχωρεί το commitment στο mapping
        balances[msg.sender] += msg.value;          // Αυξάνει το υπόλοιπο του αποστολέα
        emit Deposit(commitment);                   
    }

    // Συνάρτηση για ανάληψη χρημάτων σε μια συγκεκριμένη διεύθυνση
    function withdraw(address to) public {
        require(balances[msg.sender] > 0, "No balance to withdraw"); 
        uint256 amount = balances[msg.sender];      // Αποθηκεύει το ποσό προς ανάληψη
        balances[msg.sender] = 0;                   // Μηδενίζει το υπόλοιπο του αποστολέα
        payable(to).transfer(amount);               // Μεταφέρει το ποσό στη διεύθυνση που δόθηκε
        emit Withdraw(to); 
    }
}
