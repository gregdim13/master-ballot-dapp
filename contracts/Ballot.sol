// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

// Interface για τον Groth16Verifier, που χρησιμοποιείται για την επαλήθευση των ZKP proofs
interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata _pA, 
        uint256[2][2] calldata _pB, 
        uint256[2] calldata _pC, 
        uint256[2] calldata _pubSignals
    ) external view returns (bool);
}

contract Ballot {

    // Δομή δεδομένων για έναν υποψήφιο
    struct Candidate {      
        bytes32 name;       // Το όνομα του υποψηφίου (μέγιστο 32 bytes)
        uint voteCount;     // Ο αριθμός των ψήφων που έχει λάβει
    }

    address public chairperson;             // Ο διαχειριστής της ψηφοφορίας
    Candidate[] public candidates;          // Πίνακας με όλους τους υποψήφιους
    uint256 public startupTime;             // Χρόνος έναρξης της ψηφοφορίας
    uint256 public endTime;                 // Χρόνος λήξης της ψηφοφορίας
    uint256 public stageLimit;              // Χρονικό όριο του σταδίου ψηφοφορίας
    uint256 public votersCount;             // Αριθμός εγγεγραμμένων ψηφοφόρων
    uint256 public candidatesCount;         // Αριθμός εγγεγραμμένων υποψηφίων
    bool public issuedResults;              // Καταγράφει αν έχουν εκδοθεί τα αποτελέσματα
    address public groth16VerifierAddress;  // Διεύθυνση του smart contract που κάνει την επαλήθευση των ZKPs

    // Χαρτογραφήσεις (mappings) για διαχείριση της ψηφοφορίας
    mapping(address => bytes32) private voters;         // Χαρτογράφηση των διευθύνσεων των ψηφοφόρων στα μοναδικά τους nullifiers
    mapping(uint256 => bool) public hasVoted;           // Ελέγχει αν ένα nullifierHash έχει ήδη χρησιμοποιηθεί για ψήφο
    mapping(uint256 => bool) public voteCommitments;    // Αποθηκεύει τα vote commitments για αποτροπή διπλοψηφίας
    uint256[] public allVoteCommitments;                // Λίστα με όλα τα vote commitments που έχουν υποβληθεί

    // Κατασκευαστής του συμβολαίου όπου ορίζει τα αρχικά δεδομένα
    constructor(uint256 stg_lmt, address _groth16VerifierAddress) {
        chairperson = msg.sender;                           // Ορίζεται ο διαχειριστής της ψηφοφορίας αυτός που κάνει το deploy
        groth16VerifierAddress = _groth16VerifierAddress;   // Αποθηκεύεται η διεύθυνση του Verifier συμβολαίου
        startupTime = 0;                      
        stageLimit = stg_lmt;                               // Ορίζεται το χρονικό όριο για κάθε στάδιο
        candidatesCount = 0;
        votersCount = 0;
        issuedResults = false;
    }
    
    // Modifier για έλεγχο αν η συνάρτηση εκτελείται μόνο από τον chairperson
    modifier onlyOwner() {
        require(msg.sender == chairperson, "Only chairperson has access to this function!");
        _;
    }

    // Events για καταγραφή σημαντικών ενεργειών
    event ErrorOccurred(string error);
    event ProofResult(bool result);
    event VoteSubmitted(uint256 voteCommitment, uint256 indexed nullifierHash);

    // Συνάρτηση για την έναρξη της ψηφοφορίας
    function startBallot(uint256 curTime) public onlyOwner {
        require(startupTime == 0, "The elections has already been started");
        startupTime = block.timestamp;          // Καταγραφή της ώρας έναρξης

        // Αν υπάρχει διαφορά στο ρολόι του blockchain, το διορθώνει
        if (startupTime > curTime)
            stageLimit = stageLimit - (startupTime - curTime);

        endTime = startupTime + stageLimit;     // Υπολογισμός της ώρας λήξης
    }

    // Συνάρτηση εγγραφής υποψηφίων (μόνο από τον chairperson)
    function registerCandidates(bytes32 _name) public onlyOwner {
        require(startupTime == 0, "The candidates registration process has been completed.");

        candidates.push(Candidate({
            name: _name,
            voteCount: 0
        }));

        candidatesCount += 1;
    }

    // Συνάρτηση εγγραφής ψηφοφόρων (μόνο από τον chairperson)
    function registerVoters(address voter) public onlyOwner {
        require(startupTime == 0, "The voters registration process has been completed.");
        require(voters[voter] == bytes32(0), "The voter has already registered.");

        // Δημιουργία ενός τυχαίου nullifier για τον ψηφοφόρο
        bytes32 nullifier = keccak256(abi.encodePacked(block.timestamp, voter, blockhash(block.number - 1)));

        voters[voter] = nullifier;
        votersCount += 1;
    }

    // Συνάρτηση επιστροφής του nullifier ενός ψηφοφόρου (μόνο για ανάγνωση)
    function verifyVoter(address voter) public view returns(bytes32) {
        require(voters[voter] != bytes32(0), "The voter does not have the right to vote.");
        return voters[voter];       // Επιστρέφει το nullifier
    }

    // Συνάρτηση υποβολής ψήφου με Zero-Knowledge Proof (ZKP)
    function submitVote(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) public {
        require(startupTime != 0, "The voting process hasn't started yet");
        require(block.timestamp <= endTime, "The voting process has been completed.");

        // Επαλήθευση του αποδεικτικού ZKP
        bool result = IGroth16Verifier(groth16VerifierAddress).verifyProof(_pA, _pB, _pC, _pubSignals);
        emit ProofResult(result);
        require(result, "Access denied: Invalid Proof.");

        uint256 voteCommitment = _pubSignals[0];
        uint256 nullifierHash = _pubSignals[1];

        // Έλεγχος αν ο ψηφοφόρος έχει ήδη ψηφίσει
        require(!hasVoted[nullifierHash], "You have already voted!");
        require(!voteCommitments[voteCommitment], "You have already voted!");

        // Καταγραφή της ψήφου στο blockchain
        hasVoted[nullifierHash] = true;
        voteCommitments[voteCommitment] = true;
        allVoteCommitments.push(voteCommitment);
    }

    // Συνάρτηση επαλήθευσης αν ένας χρήστης έχει ψηφίσει, χρησιμοποιώντας ZKP
    function proveYourVote(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) public view returns(bool) {
        require(startupTime != 0, "The voting process hasn't started yet");

        // Επαλήθευση του αποδεικτικού ZKP
        bool result = IGroth16Verifier(groth16VerifierAddress).verifyProof(_pA, _pB, _pC, _pubSignals);
        require(result, "Access denied: Invalid Proof.");
        
        uint256 nullifierHash = _pubSignals[1];

        return hasVoted[nullifierHash];     // Αν υπάρχει το nullifierHash επιστρέφει true
    }

    // Συνάρτηση επιστροφής των υποψηφίων
    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    // Συνάρτηση επιστροφής όλων των vote commitments
    function getAllVotes() public view returns (uint256[] memory) {
        return allVoteCommitments;
    }

    // Συνάρτηση έκδοσης αποτελεσμάτων της ψηφοφορίας (μόνο από τον chairperson)
    function issueBallotResults(uint[] memory votes) public onlyOwner {
        require(startupTime != 0, "The voting process hasn't started yet.");
        require(block.timestamp > endTime, "The voting process hasn't completed yet.");
        require(!issuedResults, "The final ballot results have already been issued!");

        // Καταγραφή των τελικών αποτελεσμάτων
        for (uint8 p = 0; p < candidates.length; p++) {
            candidates[p].voteCount = votes[p];
        }

        issuedResults = true;       // Σημειώνει ότι τα αποτελέσματα εκδόθηκαν
    }
}
