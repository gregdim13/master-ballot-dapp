# file: /scripts/02_compile.sh

#!/bin/bash

# Μεταβλητή για την αποθήκευση του ονόματος του κυκλώματος
CIRCUIT=''

# Ορισμός του φακέλου εξόδου όπου θα αποθηκευτούν τα αποτελέσματα της μεταγλώττισης
FOLDER_PATH='build'

# Αν υπάρχει όρισμα (όνομα κυκλώματος) κατά την εκτέλεση του script, το αποθηκεύει στη μεταβλητή CIRCUIT
if [ "$1" ]; then
    CIRCUIT=$1
fi

# Δημιουργία του φακέλου build αν δεν υπάρχει ήδη
if [ ! -d "$FOLDER_PATH" ]; then
  mkdir ${FOLDER_PATH}
fi

# Μεταγλώττιση του κυκλώματος χρησιμοποιώντας το circom και δημιουργία των απαραίτητων αρχείων
circom ./circuit/${CIRCUIT}.circom --r1cs --wasm --sym --c -o ${FOLDER_PATH}

# Δημιουργία του witness.wtns χρησιμοποιώντας το παραγόμενο WebAssembly αρχείο και τα input δεδομένα
node ${FOLDER_PATH}/${CIRCUIT}_js/generate_witness.js \
     ${FOLDER_PATH}/${CIRCUIT}_js/${CIRCUIT}.wasm \
     ./circuit/input.json \
     ${FOLDER_PATH}/${CIRCUIT}_js/witness.wtns
