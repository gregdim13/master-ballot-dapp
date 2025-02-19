pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom"; // Χρήση του Poseidon hash για ασφαλή υπολογισμό

template VoteCircuit() {
    // Μυστικές Είσοδοι (Private Inputs)
    signal input vote;           // Επιλογή του χρήστη (από λίστα υποψηφίων)
    signal input vote_secret;    // Μυστικός κωδικός ψηφοφόρου
    signal input nullifier;      // Τυχαίος αριθμός για αποτροπή διπλοψηφίας

    // Δημόσιες Έξοδοι (Public Outputs)
    signal output vote_commitment;  // Τελικό Hash της ψήφου
    signal output nullifier_hash;   // Τελικό Hash για αποτροπή διπλοψηφίας

    // 1️⃣ Δημιουργία Poseidon components
    component poseidon1 = Poseidon(1);  // Hash του nullifier
    component poseidon2 = Poseidon(2);  // Hash της ψήφου
    component poseidon3 = Poseidon(1);  // 2ο Hash του nullifier
    component poseidon4 = Poseidon(1);  // 2ο Hash της ψήφου

    // 2️⃣ Δημιουργία του nullifier_hash με διπλό hashing
    poseidon1.inputs[0] <== nullifier;
    poseidon3.inputs[0] <== poseidon1.out;  // 2ο Hash
    nullifier_hash <== poseidon3.out;

    // 3️⃣ Δημιουργία του vote_commitment με διπλό hashing
    poseidon2.inputs[0] <== vote;
    poseidon2.inputs[1] <== vote_secret;
    poseidon4.inputs[0] <== poseidon2.out;  // 2ο Hash
    vote_commitment <== poseidon4.out;
}

component main = VoteCircuit();