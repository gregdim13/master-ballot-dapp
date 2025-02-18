pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom"; // Χρήση του Poseidon hash για ασφαλή υπολογισμό

template VoteCircuit() {
    // Μυστικές Είσοδοι (Private Inputs)
    signal input vote;           // Επιλογή του χρήστη (θα προέρχεται από τη λίστα προτάσεων)
    signal input vote_secret;    // Μυστικός κωδικός του ψηφοφόρου
    signal input nullifier;      // Τυχαίος αριθμός για αποτροπή διπλοψηφίας

    // Δημόσιες Έξοδοι (Public Outputs)
    signal output vote_commitment;  // Hash της ψήφου (αποθηκεύεται στο smart contract)
    signal output nullifier_hash;   // Hash για αποτροπή διπλοψηφίας

    // 1️⃣ Χρησιμοποιούμε το Poseidon ως component για σωστή λειτουργία
    component poseidon1 = Poseidon(1);
    component poseidon2 = Poseidon(2);

    // 2️⃣ Δημιουργία του nullifier hash
    poseidon1.inputs[0] <== nullifier;
    nullifier_hash <== poseidon1.out;

    // 3️⃣ Δημιουργία του vote_commitment
    poseidon2.inputs[0] <== vote;
    poseidon2.inputs[1] <== vote_secret;
    vote_commitment <== poseidon2.out;
}

component main = VoteCircuit();