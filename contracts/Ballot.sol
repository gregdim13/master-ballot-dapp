// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

// Interface to Groth16Verifier.sol
interface IGroth16Verifier {
    function verifyProof(uint256[2] calldata _pA, uint256[2][2] calldata  _pB, uint256[2] calldata  _pC, uint256[2] calldata _pubSignals) external view returns (bool);
}

contract Ballot {
    // *** Πρέπει να φτιάξω μια σελίδα όπου ο chairperson θα κάνει register τους ψηφοφόρους
    struct Candidate {      
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }

    address public chairperson;
    Candidate[] public candidates;
    uint256 public startupTime;
    uint256 public endTime;
    uint256 public stageLimit;
    uint256 public votersCount;
    uint256 public candidatesCount;
    bool public issuedResults;
    address public groth16VerifierAddress;

    // here goes zkp changes
    mapping(address => bytes32) private voters;         // Αποθηκεύει το nullifier κάθε registered voter
    mapping(uint256 => bool) public hasVoted;           // Αποτροπή διπλοψηφίας με δείκτη το nullifierHash
    mapping(uint256 => bool) public voteCommitments;    // Αποθήκευση των commitments με δείκτη το voteCommitment
    uint256[] public allVoteCommitments;                // Λίστα με όλα τα vote_commitments

    
    // chairperson assign the limit of each stage in seconds and initiate the candidate's array
    constructor(uint256 stg_lmt, address _groth16VerifierAddress) {
        chairperson = msg.sender;
        groth16VerifierAddress = _groth16VerifierAddress;
        startupTime = 0;
        stageLimit = stg_lmt;
        candidatesCount = 0;
        votersCount = 0;
        issuedResults=false;
    }
    
    // Modifier για έλεγχο δικαιωμάτων
    modifier onlyOwner() {
        require(msg.sender == chairperson, "Only chairperson has access to this function!");
        _;
    }

    // Event για καταγραφή σφαλμάτων
    event ErrorOccurred(string error);
    event ProofResult(bool result);
    event VoteSubmitted(uint256 voteCommitment, uint256 indexed nullifierHash);

    function startBallot(uint256 curTime) onlyOwner public {
        require(startupTime == 0, "The elections has already been started");
        startupTime = block.timestamp;
        endTime = startupTime + stageLimit;

        if (startupTime > curTime)
            stageLimit= stageLimit - (startupTime - curTime); // για συγχρονισμό ρολογιού και μόνο
    }

    // only chairperson is able to register candidates to elections
    function registerCandidates(bytes32 _name) onlyOwner public{

        require(startupTime == 0, "The candidates registration process has been completed.");

        candidates.push(Candidate( {
            name: _name,
            voteCount: 0
        }));

        candidatesCount+=1;
    }

    // only chairperson is able to register voters to elections
    function registerVoters(address voter) onlyOwner public {

        //require(chairperson != voter, "Chairperson cannot register to the elections.");
        require(startupTime == 0, "The voters registration process has been completed.");
        require(voters[voter] == bytes32(0), "The voter has already registered.");

        // Δημιουργία ενός τυχαίου nullifier
        bytes32 nullifier = keccak256(abi.encodePacked(block.timestamp, voter, blockhash(block.number - 1)));

        voters[voter] = nullifier;
        votersCount+=1;
    }

    function verifyVoter(address voter) public view returns(bytes32) {
        // ==> Γίνεται call μόνο και όχι send από το frontend dapp για να μην καταγραφεί στο blockchain
        require(voters[voter] != bytes32(0), "The voter do not have the right to vote.");
        return voters[voter];    // returns his nullifier
    }

    function submitVote(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) public {

        require(startupTime !=0, "The voting process hasn't started yet");
        require(block.timestamp <= endTime, "The voting process has been completed.");

        bool result = IGroth16Verifier(groth16VerifierAddress).verifyProof(_pA, _pB, _pC, _pubSignals);
        emit ProofResult(result);           // Το emit και το require πάνε μαζί για να πάρουμε αποτέλεσμα true
        require(result, "Access denied: Invalid Proof.");   // εάν αφαιρέσουμε το require το emit θα μας δίνει πάντα false (δεν γνωρίζω το λόγο...??
        
        uint256 voteCommitment = _pubSignals[0];
        uint256 nullifierHash = _pubSignals[1];

        require(!hasVoted[nullifierHash], "You have already voted!");           // Αποτροπή διπλοψηφίας
        require(!voteCommitments[voteCommitment], "You have already voted!");   // Αποτροπή διπλοψηφίας

        // Καταγραφή της ψήφου στο blockchain
        hasVoted[nullifierHash] = true;
        voteCommitments[voteCommitment] = true;
        allVoteCommitments.push(voteCommitment);
    }

    function proveYourVote(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) public view returns(bool) {

        require(startupTime !=0, "The voting process hasn't started yet");

        bool result = IGroth16Verifier(groth16VerifierAddress).verifyProof(_pA, _pB, _pC, _pubSignals);
        require(result, "Access denied: Invalid Proof.");   // εάν αφαιρέσουμε το require το emit θα μας δίνει πάντα false (δεν γνωρίζω το λόγο...??
        
        //uint256 voteCommitment = _pubSignals[0];
        uint256 nullifierHash = _pubSignals[1];

        if (hasVoted[nullifierHash])
            result = true;
        else 
            result = false;

        return result;
    }

    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getAllVotes() public view returns (uint256[] memory) {
        return allVoteCommitments;
    }

    function issueBallotResults(uint[] memory votes) onlyOwner public {
        // Εδώ θα ελέγχεται εάν έχει λήξη η ψηφοφορία
        require(startupTime !=0, "The voting process hasn't started yet. Results cannot be issued before the ballot is finished.");
        require(block.timestamp > endTime, "The voting process hasn't completed yet. Results cannot be issued before the ballot is finished.");

        for (uint8 p = 0; p < candidates.length; p++) {
            candidates[p].voteCount = votes[p];
        }

        issuedResults = true;
    }
}

    
