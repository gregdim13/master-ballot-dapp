# file: /scripts/03_executePOT.sh

#!/bin/bash


CIRCUIT=''          # Μεταβλητή για το όνομα του κυκλώματος
FOLDER_PATH='keys'  # Φάκελος όπου θα αποθηκευτούν τα κλειδιά
BUILD='build'       # Φάκελος όπου αποθηκεύονται τα αποτελέσματα της μεταγλώττισης
PTAU=15             # Αριθμός του ptau αρχείου που θα χρησιμοποιηθεί

# Αν έχει δοθεί όνομα κυκλώματος ως όρισμα, αποθηκεύεται στη μεταβλητή CIRCUIT
if [ "$1" ]; then
    CIRCUIT=$1
fi

# Αν έχει δοθεί αριθμός ptau αρχείου ως όρισμα, αποθηκεύεται στη μεταβλητή PTAU
if [ "$2" ]; then
    PTAU=$2
fi

# Δημιουργία του φακέλου που θα αποθηκευτούν τα κλειδιά, αν δεν υπάρχει ήδη
if [ ! -d "$FOLDER_PATH" ]; then
  mkdir ${FOLDER_PATH}
fi

# Έλεγχος αν υπάρχει το απαραίτητο ptau αρχείο, διαφορετικά το κατεβάζει
if [ -f ./ptau/powersOfTau28_hez_final_${PTAU}.ptau ]; then
    echo "----- powersOfTau28_hez_final_${PTAU}.ptau already exists -----"
else
    echo "----- Downloading powersOfTau28_hez_final_${PTAU}.ptau -----"
    wget -P ./ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PTAU}.ptau
fi

echo "----- Generate .zkey file (Proving key) -----"
# Δημιουργία αρχείου .zkey που περιέχει τα proving και verification keys καθώς και τις συνεισφορές της φάσης 2
snarkjs groth16 setup ${BUILD}/${CIRCUIT}.r1cs ptau/powersOfTau28_hez_final_${PTAU}.ptau ${FOLDER_PATH}/${CIRCUIT}_0000.zkey

echo "----- Contribute to the phase 2 of the ceremony -----"
# Συνεισφορά στη φάση 2 του Trusted Setup Ceremony
snarkjs zkey contribute ${FOLDER_PATH}/${CIRCUIT}_0000.zkey ${FOLDER_PATH}/${CIRCUIT}_final.zkey --name="1st Contributor Name" -v -e="some random text"

echo "----- Export the verification key -----"
# Εξαγωγή του verification key σε JSON μορφή
snarkjs zkey export verificationkey ${FOLDER_PATH}/${CIRCUIT}_final.zkey ${FOLDER_PATH}/verification_key.json

echo "----- Generate zk-proof -----"
# Δημιουργία του zk-proof που σχετίζεται με το κύκλωμα και το witness
# Παράγει τα αρχεία proof.json και public.json
snarkjs groth16 prove ${FOLDER_PATH}/${CIRCUIT}_final.zkey ${BUILD}/${CIRCUIT}_js/witness.wtns ${FOLDER_PATH}/proof.json ${FOLDER_PATH}/public.json

echo "----- Verify the proof -----"
# Επαλήθευση του αποδεικτικού zk-SNARK
snarkjs groth16 verify ${FOLDER_PATH}/verification_key.json ${FOLDER_PATH}/public.json ${FOLDER_PATH}/proof.json

echo "----- Generate Solidity verifier -----"
# Δημιουργία του Solidity verifier που επιτρέπει την επαλήθευση των αποδείξεων στο Ethereum blockchain
snarkjs zkey export solidityverifier ${FOLDER_PATH}/${CIRCUIT}_final.zkey ${CIRCUIT}Verifier.sol

# Ενημέρωση της έκδοσης της Solidity στον παραγόμενο κώδικα του verifier
sed -i 's/0.6.11;/0.8.4;/g' ${CIRCUIT}Verifier.sol

# Ενημέρωση του ονόματος του smart contract στον verifier
sed -i "s/contract Verifier/contract ${CIRCUIT^}Verifier/g" ${CIRCUIT}Verifier.sol

# Διαγραφή του παλιού Solidity verifier στον φάκελο των smart contracts
rm -f ./contracts/Groth16Verifier.sol

# Αντιγραφή του παραγόμενου Solidity verifier στον φάκελο των smart contracts και μετονομασία σε 'Groth16Verifier.sol'
cp ./${CIRCUIT}Verifier.sol ./contracts/Groth16Verifier.sol

echo "----- Generate and print parameters of call -----"
# Δημιουργία και εμφάνιση των παραμέτρων της κλήσης
cd ./${FOLDER_PATH} && snarkjs generatecall | tee parameters.txt && cd ..

# Αντιγραφή του ..._final.zkey αρχείου στο φάκελο server/zkp/
cp ${FOLDER_PATH}/${CIRCUIT}_final.zkey server/zkp/
