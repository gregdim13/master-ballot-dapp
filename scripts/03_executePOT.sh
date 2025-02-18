# file: /scripts/03_executePOT.sh

#!/bin/bash

# Variable to store the name of the circuit
CIRCUIT=''

FOLDER_PATH='keys'

BUILD='build'

# Variable to store the number of the ptau file
PTAU=15

# In case there is a circuit name as an input
if [ "$1" ]; then
    CIRCUIT=$1
fi

# In case there is a ptau file number as an input
if [ "$2" ]; then
    PTAU=$2
fi

# Create a build Folder
if [ ! -d "$FOLDER_PATH" ]; then
  mkdir ${FOLDER_PATH}
fi

# Check if the necessary ptau file already exists. If it does not exist, it will be downloaded from the data center
if [ -f ./ptau/powersOfTau28_hez_final_${PTAU}.ptau ]; then
    echo "----- powersOfTau28_hez_final_${PTAU}.ptau already exists -----"
else
    echo "----- Download powersOfTau28_hez_final_${PTAU}.ptau -----"
    wget -P ./ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PTAU}.ptau
fi

echo "----- Generate .zkey file (Proving key) -----"
# Generate a .zkey file that will contain the proving and verification keys together with all phase 2 contributions
snarkjs groth16 setup ${BUILD}/${CIRCUIT}.r1cs ptau/powersOfTau28_hez_final_${PTAU}.ptau ${FOLDER_PATH}/${CIRCUIT}_0000.zkey

echo "----- Contribute to the phase 2 of the ceremony -----"
# Contribute to the phase 2 of the ceremony
snarkjs zkey contribute ${FOLDER_PATH}/${CIRCUIT}_0000.zkey ${FOLDER_PATH}/${CIRCUIT}_final.zkey --name="1st Contributor Name" -v -e="some random text"

echo "----- Export the verification key -----"
# Export the verification key
snarkjs zkey export verificationkey ${FOLDER_PATH}/${CIRCUIT}_final.zkey ${FOLDER_PATH}/verification_key.json

echo "----- Generate zk-proof -----"
# Generate a zk-proof associated to the circuit and the witness. This generates proof.json and public.json
snarkjs groth16 prove ${FOLDER_PATH}/${CIRCUIT}_final.zkey ${BUILD}/${CIRCUIT}_js/witness.wtns ${FOLDER_PATH}/proof.json ${FOLDER_PATH}/public.json

echo "----- Verify the proof -----"
# Verify the proof
snarkjs groth16 verify ${FOLDER_PATH}/verification_key.json ${FOLDER_PATH}/public.json ${FOLDER_PATH}/proof.json

echo "----- Generate Solidity verifier -----"
# Generate a Solidity verifier that allows verifying proofs on Ethereum blockchain
snarkjs zkey export solidityverifier ${FOLDER_PATH}/${CIRCUIT}_final.zkey ${CIRCUIT}Verifier.sol
# Update the solidity version in the Solidity verifier
sed -i 's/0.6.11;/0.8.4;/g' ${CIRCUIT}Verifier.sol
# Update the contract name in the Solidity verifier
sed -i "s/contract Verifier/contract ${CIRCUIT^}Verifier/g" ${CIRCUIT}Verifier.sol
# Moving the verifier into the contracts folder
mv ./${CIRCUIT}Verifier.sol ../contracts

echo "----- Generate and print parameters of call -----"
# Generate and print parameters of call
cd ./${FOLDER_PATH} && snarkjs generatecall | tee parameters.txt && cd ..