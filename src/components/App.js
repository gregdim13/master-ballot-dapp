// core file - mothership output
import React, { Component } from 'react';
// Εισαγωγή βασικών components της εφαρμογής
import Navbar from './Navbar.js';
import Footer from './Footer.js';
import Main from './Main.js';
import ParticleSettings from './ParticleSettings.js';
// Εισαγωγή των artifacts των smart contracts (Ballot, Groth16Verifier, FakeTornado)
import Ballot from '../artifacts/contracts/Ballot.sol/Ballot.json'; 
import Groth16Verifier from '../artifacts/contracts/Groth16Verifier.sol/Groth16Verifier.json'; 
import FakeTornado from '../artifacts/contracts/FakeTornado.sol/FakeTornado.json'; 
// Βιβλιοθήκες για αλληλεπίδραση με το blockchain
import { ethers } from "ethers";
import { RotatingLines } from "react-loader-spinner"; // Σπίνερ φόρτωσης

/* ΣΗΜΑΝΤΙΚΟ ΣΤΟ CMD με ADMIN: 
   mklink /D "C:\master-dapp\node_modules\artifacts" "C:\master-dapp\artifacts" 
   Χρησιμοποιείται για τη δημιουργία συμβολικού συνδέσμου μεταξύ node_modules και artifacts.
*/

/* Εντολές εκτέλεσης σε ξεχωριστά cmd ή terminal η κάθε μία:
    npx hardhat node
    set ELECTION_DURATION=3600 && npx hardhat run scripts/deploy.js --network localhost && node server/server.js
    npm run start
*/

/* global BigInt */ // Δήλωση της BigInt για χρήση χωρίς προβλήματα

// Συνάρτηση για μετατροπή μιας συμβολοσειράς (string) σε BigInt
const stringToBigInt = (str) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);    // Μετατροπή σε bytes
    const hex = Array.from(encoded).map(byte => byte.toString(16).padStart(2, '0')).join('');
    return BigInt("0x" + hex);              // Μετατροπή σε BigInt
};

// Συνάρτηση που αντιγράφει ένα κείμενο στο clipboard και εμφανίζει alert
const copyToClipordAlert = (message, secret) => {
    const text = window.prompt(message, secret);

    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied to clipboard!");
        }).catch(err => console.error("Failed to copy", err));
    }
};

// Συνάρτηση που μετατρέπει ένα timestamp σε μορφοποιημένη ημερομηνία
const getFormattedDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    // Μορφοποίηση ημερομηνίας σε μορφή 'Monday, 19 February 2025, 14:30'
    const formattedDate = date.toLocaleString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    return formattedDate;
};

class App extends Component {
    // Το κύριο component της εφαρμογής

    async componentDidMount() {
        console.log("Loading Blockchain Data...");
        await this.loadBlockchainData();    // Φόρτωση δεδομένων από το blockchain

        // Αποθήκευση της τρέχουσας θέσης κύλισης
        this.setState({ savedScrollPosition: window.scrollY });

        // Ανίχνευση αλλαγής λογαριασμού στο Metamask
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    window.alert("Please connect to MetaMask.");
                } else {
                    this.setState({ account: accounts[0] });
                    await this.loadBlockchainData();    // Φόρτωση εκ νέου των δεδομένων
                }
            });
        }
    }

    componentDidUpdate() {
        // Αν αλλάζει το loading από true σε false, επανέφερε τη θέση κύλισης
        if (!this.state.loading) {
            window.scrollTo(0, this.state.savedScrollPosition);
        }
    }

    // Φορτώνει τα δεδομένα του blockchain και ενημερώνει τα state της εφαρμογής.
    async loadBlockchainData() {
        let provider, signer, account, network;

        if (window.ethereum) {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);             // Ζητά πρόσβαση στους λογαριασμούς
            console.log("Provider (loadProvider) :", provider);

            signer = await provider.getSigner();        // Παίρνει τον signer (ιδιωτικό κλειδί για υπογραφή συναλλαγών)
            account = await signer.getAddress();        // Παίρνει τη διεύθυνση του χρήστη
            network = await provider.getNetwork();      // Παίρνει τα στοιχεία του δικτύου

            this.setState({ provider, account });

            // Φόρτωση των smart contracts από το δίκτυο
            const networkId = network.chainId;
            const ballotData = Ballot.networks[networkId];
            const verifierData = Groth16Verifier.networks[networkId];
            const tornadoData = FakeTornado.networks[networkId];

             // Αν υπάρχει το Ballot contract στο δίκτυο
            if (ballotData) { 
                // Φόρτωση του Ballot Contract
                const ballot = new ethers.Contract(ballotData.address, Ballot.abi, signer);

                // Ανάκτηση στοιχείων του smart contract
                const startupTime = await ballot.startupTime();
                const stgLimit = await ballot.stageLimit();
                const issRes = await ballot.issuedResults();
                const votersLength = await ballot.votersCount();

                // Αποθήκευση της τρέχουσας ώρα
                const curTimestamp = BigInt(Math.floor(Date.now() / 1000));

                // Έλεγχος αν έχει ξεκινήσει η ψηφοφορία
                startupTime === BigInt(0)
                    ? this.setState({ startVoting: false })
                    : this.setState({ startVoting: true });

                // Υπολογισμός του χρόνου λήξης της ψηφοφορίας
                const endTime = stgLimit + startupTime;
                console.log("Elections start time on", getFormattedDate(startupTime), "and end time on", getFormattedDate(endTime));

                // Αποθήκευση των στοιχείων στο state
                this.setState({
                    startupTime: startupTime.toString(),
                    curTimestamp: curTimestamp.toString(),
                    endTime: endTime.toString(),
                    ballot,
                    voters: votersLength.toString(),
                    txMsg: '',
                    errorTrig: false,
                    labelId: 0,
                    issuedResults: issRes
                }, async () => {
                    console.log("Τα states ενημερώθηκαν! Τώρα εκτελούμε fetchCandidates...");
                    await this.fetchCandidates();       // Ενημέρωση της λίστας υποψηφίων
                });
            } else {
                window.alert('Error! Ballot contract not deployed - no detected network!');
            }

            // Αν υπάρχει το Groth16Verifier contract στο δίκτυο
            if (verifierData) { 
                // Φόρτωση του Verifier Contract και ενημέρωση του state με αυτό
                const verifier = new ethers.Contract(verifierData.address, Groth16Verifier.abi, signer);
                this.setState({ verifier });
            } else {
                window.alert('Error! Groth16Verifier contract not deployed - no detected network!');
            }

            // Αν υπάρχει το FakeTornado contract στο δίκτυο
            if (tornadoData) {
                // Φόρτωση του FakeTornado Contract και ενημέρωση του state με αυτό
                const tornado = new ethers.Contract(tornadoData.address, FakeTornado.abi, signer);
                this.setState({ tornado });
            } else {
                window.alert('Error! FakeTornado contract not deployed - no detected network!');
            }
        } else {
            window.alert("No Ethereum browser detected! Install MetaMask.");
        }

        this.setState({ loading: false });    // Ενημερώνει το state για να βγει από loading screen
    }

    // Συνάρτηση για την έναρξη των εκλογών
    startElections = async () => {
        this.setState({ loading: true, savedScrollPosition: window.scrollY });

        try {
            // Αποθήκευση της τρέχουσας ώρα
            let curTimestamp = BigInt(Math.floor(Date.now() / 1000));

            // Εκτέλεση συναλλαγής για την έναρξη της ψηφοφορίας
            const txResponse = await this.state.ballot.startBallot(curTimestamp);
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή επιβεβαίωσης συναλλαγής
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);

            // Ανάκτηση χρόνου έναρξης από smart contract
            const startupTime = await this.state.ballot.startupTime();
            console.log("Elections started at:", startupTime.toString());

            // Αποθήκευση των στοιχείων στο state
            this.setState({
                startupTime: startupTime.toString(),
                curTimestamp: curTimestamp.toString(),
                startVoting: true,
                loading: false
            }, await this.loadBlockchainData());

        } catch (error) {
            let errorMessage
            if (error.data) {
                console.log("Error: ", error.message); 
                errorMessage = error.reason
                console.log("Error Message: ", error.reason); 
            }
            else {
                errorMessage = "Error: " + (error?.reason || error?.message || error);
                console.error(errorMessage);
            }
            window.alert(errorMessage);

            // Αποθήκευση των στοιχείων στο state
            this.setState({
                labelId: 7,             // Ετικέτα όπου εμφανίζεται
                txMsg: errorMessage,    // Μήνυμα σφάλματος
            })
        }

        this.setState({ loading: false });      // Ενημερώνει το state για να βγει από loading screen
    };

    /**
     * Εγγραφή υποψηφίου στη διαδικασία ψηφοφορίας
     * Παράμετρος: {string} candidateName -> Το όνομα του υποψηφίου προς εγγραφή
     */
    registerCandidates = async (candidateName) => {
        this.setState({ loading: true, savedScrollPosition: window.scrollY });

        try {
            // Μετατροπή του ονόματος του υποψηφίου σε bytes32
            const nameBytes32 = ethers.encodeBytes32String(candidateName);

            // Εκτέλεση συναλλαγής εγγραφής υποψηφίου
            const txResponse = await this.state.ballot.registerCandidates(nameBytes32);
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή για επιβεβαίωση της συναλλαγής στο blockchain
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);
            console.log("Transaction :", txResponse);

            // Ενημέρωση της λίστας υποψηφίων
            await this.fetchCandidates();
            const msg = "Candidate registered successfully!";

            // Αποθήκευση μηνύματος στο state
            this.setState({
                txMsg: msg,
                errorTrig: false
            });
        }
        catch (error) {
            let errorMessage;

            if (error.data) {
                console.log("Error: ", error.message);
                errorMessage = error.reason;
                console.log("Error Message: ", error.reason);
            }
            else {
                errorMessage = "Error registering Candidates: " + (error?.reason || error?.message || error);
                console.error(errorMessage);
            }

            // Αποθήκευση μηνύματος σφάλματος στο state
            this.setState({ txMsg: errorMessage, errorTrig: true });
        }

        // Αποθήκευση των στοιχείων στο state
        this.setState({
            loading: false,
            labelId: 1,             // Ενημερώνει το state με τον αριθμό ετικέτας που θα εμφανίζεται το μήνυμα
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        });
    };

    /**
     * Εγγραφή ψηφοφόρου στο σύστημα ψηφοφορίας
     * Παράμετρος: {string} voterAddress -> Η διεύθυνση Ethereum του ψηφοφόρου προς εγγραφή
     */
    registerVoters = async (voterAddress) => {
        this.setState({ loading: true, savedScrollPosition: window.scrollY });

        try {
            // Έλεγχος αν η διεύθυνση είναι έγκυρη
            if (!ethers.isAddress(voterAddress)) {
                throw new Error("Invalid Ethereum Address");
            }
            console.log("Valid Ethereum Address:", voterAddress);

            // Αποστολή αιτήματος στον server για τη δημιουργία ενός salted address
            const response = await fetch("http://127.0.0.1:5000/generate-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: voterAddress })
            });

            if (!response.ok) {
                throw new Error("Failed to generate address");
            }

            const data = await response.json();
            console.log("Salted Address: ", data.saltedAddress);

            // Εκτέλεση συναλλαγής εγγραφής ψηφοφόρου με salted address
            const txResponse = await this.state.ballot.registerVoters(data.saltedAddress);
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή για επιβεβαίωση της συναλλαγής στο blockchain
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);
            console.log("Transaction :", txResponse);

            // Ενημέρωση του αριθμού των εγγεγραμμένων ψηφοφόρων και του μηνύματος επιτυχίας
            let votersLength = await this.state.ballot.votersCount();
            let msg = "Voter registered successfully!";

            this.setState({
                voters: votersLength.toString(),
                txMsg: msg,
                errorTrig: false
            });
        }
        catch (error) {
            let errorMessage;

            if (error.data) {
                console.log("Error: ", error.message);
                errorMessage = error.reason;
                console.log("Error Message: ", error.reason);
            }
            else {
                errorMessage = error.toString();
                if (errorMessage.includes("Error: Assert Failed")) {
                    errorMessage = "Error: Assert Failed due to the constraints.";
                    console.error(errorMessage);
                } else {
                    errorMessage = "Error registering Voters: " + (error?.reason || error?.message || error);
                    console.error(errorMessage);
                }
            }

            window.alert(errorMessage);

            // Αποθήκευση μηνύματος σφάλματος στο state
            this.setState({
                txMsg: errorMessage,
                errorTrig: true,
            });
        }

        // Αποθήκευση των στοιχείων στο state
        this.setState({
            loading: false,     // Ενημερώνει το state για να βγει από loading screen
            labelId: 2,         // Ενημερώνει το state με τον αριθμό ετικέτας που θα εμφανίζεται το μήνυμα
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        });
    };

    /**
     * Κατάθεση κεφαλαίων στο FakeTornado contract για ανώνυμη συναλλαγή
     * Παράμετρος: {number} gasEstimate -> Εκτίμηση του gas για τη συναλλαγή
     * Επιστροφή: {Object} -> Το νέο ανώνυμο πορτοφόλι
     */
    depositToFakeTornado = async (gasEstimate) => {
        
        // Δημιουργία ενός παρόχου για το τοπικό δίκτυο Hardhat
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", {
            chainId: 31337,     // Hardhat Local Network
            name: "hardhat"     // Όνομα δικτύου για αποφυγή ENS resolution
        });

        // Δημιουργία ενός τυχαίου deposit hash
        const depositHash = ethers.keccak256(ethers.randomBytes(32));

        // Ανάκτηση της τιμής του gas από το δίκτυο
        const gasPrice = (await provider.getFeeData()).gasPrice;
        const gasLimit = BigInt(gasEstimate) + BigInt(150000); // Προσθήκη buffer για απρόβλεπτες χρεώσεις
        const totalCost = BigInt(gasLimit) * BigInt(gasPrice);

        // Εκκίνηση συναλλαγής κατάθεσης
        const txResponse = await this.state.tornado.deposit(depositHash, {
            value: totalCost,  // Κατάθεση του ποσού
            gasLimit: gasLimit, // Καθορισμός ορίου gas
            gasPrice: gasPrice  // Τιμή gas
        });

        console.log("Deposit Hash:", depositHash);
        console.log("Transaction Hash:", txResponse.hash);

        // Αναμονή επιβεβαίωσης της συναλλαγής στο blockchain
        const txReceipt = await txResponse.wait();
        console.log("Transaction Deposit Receipt:", txReceipt);

        // Δημιουργία νέου ανώνυμου πορτοφολιού και σύνδεσή του με τον πάροχο του Hardhat
        const newWallet = ethers.Wallet.createRandom().connect(this.state.provider);
        console.log("Wallet connected to provider!");
        console.log("New Anonymous Address:", newWallet.address);
        console.log("New Anonymous Private Key:", newWallet.privateKey);

        // Εκκίνηση συναλλαγής ανάληψης προς το νέο ανώνυμο πορτοφόλι
        const txResponse2 = await this.state.tornado.withdraw(newWallet.address, {
            gasLimit: 500000,
        });

        console.log("Transaction Hash:", txResponse2.hash);

        // Αναμονή επιβεβαίωσης της συναλλαγής στο blockchain
        const txReceipt2 = await txResponse2.wait();
        console.log("Transaction Withdraw Receipt:", txReceipt2);

        // Αναμονή μέχρι το νέο πορτοφόλι να έχει διαθέσιμο balance
        let balance = await this.state.provider.getBalance(newWallet.address);
        while (balance === ethers.parseEther("0")) {
            console.log("Waiting for ETH to arrive...");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Καθυστέρηση 2 δευτερολέπτων
            balance = await this.state.provider.getBalance(newWallet.address);
        }

        console.log("ETH received in new wallet:", ethers.formatEther(balance));

        return newWallet;
    };

    /**
     * Δημιουργία του EIP-712 Typed Message για την υπογραφή της ψήφου
     * Παράμετροι:  {string} contractAddress -> Διεύθυνση του συμβολαίου Ballot
     *              {BigInt} voteCommitment -> Δεσμευμένη ψήφος σε BigInt
     *              {BigInt} nullifierHash -> Nullifier hash για αποτροπή διπλοψηφίας
     * Επιστροφή:   {Object} -> Το αντικείμενο με τα domain, types, message για την υπογραφή
     */
    getTypedData = async (contractAddress, voteCommitment, nullifierHash) => {
        const domain = {
            name: "AnonymousVoting",
            version: "1",
            chainId: 31337, // Hardhat τοπικό δίκτυο
            verifyingContract: contractAddress
        };

        const types = {
            Vote: [
                { name: "voteCommitment", type: "uint256" },
                { name: "nullifierHash", type: "uint256" }                   
            ]
        };

        const message = {
            voteCommitment: voteCommitment,
            nullifierHash: nullifierHash
        };

        return { domain, types, message };
    };

    /**
     * Υποβολή ψήφου μέσω zk-SNARKs και EIP-712 υπογραφής
     * Παράμετροι:  {number} index -> Δείκτης του υποψηφίου στη λίστα
     *              {string} password -> Μυστικός κωδικός του χρήστη (vote secret)
     */
    voteCandidate = async (index, password) => {
        let labId;
        this.setState({ loading: true, savedScrollPosition: window.scrollY });

        try {
            // Έλεγχος αν ο κωδικός είναι ισχυρός (>=16 χαρακτήρες, γράμματα, αριθμοί, σύμβολα)
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()*$^#_\-+=<>]).{16,}$/;
            if (!strongPasswordRegex.test(password)) {
                throw new Error("Secret Code Fail");
            }

            copyToClipordAlert("Copy code secret in a safe place: ", password);     // Ανοίγει το παράθυρο αντιγραφής του κωδικού

            // Αποστολή αιτήματος στον server για τη δημιουργία salted address
            let response = await fetch("http://127.0.0.1:5000/generate-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: this.state.account })
            });

            if (!response.ok) {
                throw new Error("Failed to generate address");
            }

            const data = await response.json();
            const nullifier = await this.state.ballot.verifyVoter(data.saltedAddress);    // Ανακτά το nullifier του ψηφοφόρου από το contract
            console.log("Nullifier: ", nullifier);

            copyToClipordAlert("Copy nullifier in a safe place: ", nullifier);      // Ανοίγει το παράθυρο αντιγραφής του nullifier

            // Μετατροπή του κωδικού σε BigInt για zk-SNARK
            const voteSecretBigInt = stringToBigInt(password);
            console.log("Vote Secret as BigInt:", voteSecretBigInt);

            // Αποστολή αιτήματος στον server για τη δημιουργία Zero-Knowledge Proofs
            response = await fetch("http://127.0.0.1:5000/generate-proof", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    index: index.toString(),                // Η επιλογή του υποψηφίου ανάλογα το index στον πίνακα
                    secret: voteSecretBigInt.toString(),    // Ο μυστικός κωδικός του ψηφοφόρου
                    nullifier: nullifier.toString()         // Το τυχαίο nullifier του ψηφοφόρου
                })
            });

            const dataProofs = await response.json();

            if (!response.ok) {
                throw new Error(dataProofs.error);
            }

            // Εκτίμηση κόστους gas για τη συναλλαγή
            const gasEstimate = await this.state.ballot.submitVote.estimateGas(
                dataProofs.proofA, 
                dataProofs.proofB, 
                dataProofs.proofC, 
                dataProofs.publicSignals
            );
            console.log("Estimated Gas Cost:", gasEstimate.toString());    

            // Κατάθεση στο FakeTornado για ανώνυμη συναλλαγή
            const newWallet = await this.depositToFakeTornado(gasEstimate);

            // Δημιουργία υπογεγραμμένων δεδομένων EIP-712
            const { domain, types, message } = await this.getTypedData(
                this.state.ballot.target, 
                dataProofs.publicSignals[0], 
                dataProofs.publicSignals[1]
            );

            // Η υπογραφή της ψήφου με το νέο ανώνυμο πορτοφόλι
            const signature = await newWallet.signTypedData(domain, types, message);
            console.log("Signed Vote:", signature);

            // Αποστολή της ψήφου στον relayer του server για την υποβολή της ψήφου
            response = await fetch("http://127.0.0.1:5000/relay-vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    proofA: dataProofs.proofA, 
                    proofB: dataProofs.proofB, 
                    proofC: dataProofs.proofC, 
                    publicSignals: dataProofs.publicSignals,        
                    signature,                                      // Η υπογραφή της ψήφου από το νέο ανώνυμο πορτοφόλι
                    newWalletPrivateKey: newWallet.privateKey,      // Το ιδιωτικό πορτοφόλι του ανώνυμου πορτοφολιού
                    voteSecretBigInt: voteSecretBigInt.toString()   // Ο μυστικός κωδικός BigInt με
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error); // Ρίχνει error με το μήνυμα του backend
            }

            console.log("✅ Success:", result.message);
            console.log("✅ Transaction: ", result.tx);

            await new Promise(resolve => setTimeout(resolve, 3000));  // Προσθήκη μιας μικρής αναμονής 3 δευτερολέπτων

            // Ενημέρωση του χρήστη
            const msg = "You have successfully voted.";
            this.setState({
                txMsg: msg,
                errorTrig: false,
            });
            labId = 3;
            window.alert(msg);

        } catch (error) {
            let errorMessage;

            if (error.data) {
                console.log("Error: ", error.message); 
                errorMessage = error.reason;
                console.log("Error Message: ", error.reason);
                window.alert(errorMessage);
                labId = 3;
            }
            else {
                if (error.message.includes("Secret Code Fail")) {
                    errorMessage = "Error: Incorrect secret code syntax!!";
                    window.alert("Your vote secret must be at least 16 characters long and contain: \n - At least one uppercase letter\n - At least one lowercase letter\n - At least one number\n - At least one special character");
                    labId = 4;
                }
                else {
                    errorMessage = "Error during voting procedure: " + (error?.reason || error?.message || error);
                    window.alert(errorMessage);
                    labId = 3;
                }
            }
            console.error(error.message);

            // Αποθήκευση μηνύματος σφάλματος στο state
            this.setState({
                txMsg: errorMessage,
                errorTrig: true
            });
        }

        // Αποθήκευση των στοιχείων στο state
        this.setState({
            loading: false,         // Ενημερώνει το state για να βγει από loading screen 
            labelId: labId,         // Ενημερώνει το state με τον αριθμό ετικέτας που θα εμφανίζεται το μήνυμα
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString(),
            lastTimeOfVote: BigInt(Math.floor(Date.now() / 1000)).toString()      // Ενημέρωση με το τρέχοντα χρόνο που υποβλήθηκε η ψήφος
        });
    };


    // Απόδειξη ότι ένας χρήστης έχει ψηφίσει χρησιμοποιώντας zk-SNARKs
    proveVote = async () => {

        this.setState({ loading: true, savedScrollPosition: window.scrollY });

        try {
            
            let curTimestamp = BigInt(Math.floor(Date.now() / 1000));                       // Αποθήκευση της τρέχουσας ώρας
            let delay = (Number(this.state.lastTimeOfVote) + 12) - Number(curTimestamp);    // Υπολογισμός χρόνου καθυστέρησης

            // Προσθήκη καθυστέρησης (16 sec max) για το συγχρονισμό δεδομένων στο hardhat (αν το delay είναι θετικό)
            // Έτσι αποφεύγονται οι κλήσεις που δίνουν λάθος αποτελέσματα, λόγω της αργής ενημέρωσης το blockchain (hardhat)
            if (delay >= 0) {
                console.log("Delay: ", delay);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }

            // Αποστολή αιτήματος στον server για τη δημιουργία salted address
            let response = await fetch("http://127.0.0.1:5000/generate-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    address: this.state.account, 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error("Failed to generate address");      // Ενεργοποιεί error από backend
            }

            // Ανάκτηση του nullifier του χρήστη από το ballot contract
            const nullifier = await this.state.ballot.verifyVoter(data.saltedAddress);
            console.log("Nullifier: ", nullifier);

            // Δημιουργία ενός τυχαίου vote secret για την εικονική αποστολή του zkp
            const voteSecretBigInt = stringToBigInt("abcd1234");
            console.log("Vote Secret as BigInt:", voteSecretBigInt);

            // Αποστολή αιτήματος στον server για τη δημιουργία ZK-Proofs
            response = await fetch("http://127.0.0.1:5000/generate-proof", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    index: "0",                             // Δείκτης υποψηφίου (δεν έχει σημασία για το prove ψήφου)
                    secret: voteSecretBigInt.toString(),    // Dummy vote secret
                    nullifier: nullifier.toString()         // Ο πραγματικός nullifier του ψηφοφόρου
                })
            });

            const dataProofs = await response.json();

            if (!response.ok) {
                throw new Error(dataProofs.error);      // Ενεργοποιεί error από backend
            }

            // Κλήση της proveYourVote() στο smart contract Ballot με ορίσματα τα proofs και signals απ' το server
            let proof = await this.state.ballot.proveYourVote(
                dataProofs.proofA, 
                dataProofs.proofB, 
                dataProofs.proofC, 
                dataProofs.publicSignals
            );

            // Ενημέρωση του state με αντίστοιχο μήνυμα αποτελέσματος
            let msg;
            if (proof) {
                msg = "You prove that you have successfully voted. ✅";
                this.setState({ txMsg: msg, errorTrig: false });
            } else {
                msg = "You prove that you haven't voted. ❌";
                this.setState({ txMsg: msg, errorTrig: true });
            }

            window.alert(msg);

        } catch (error) {

            let errorMessage;

            if (error.data) {
                console.log("Error: ", error.message);
                errorMessage = error.reason;
                console.log("Error Message: ", error.reason);
                window.alert(errorMessage);
            } else {
                // Ανάλυση του σφάλματος και εμφάνιση κατάλληλου μηνύματος
                errorMessage = "Error during prove procedure: " + (error?.reason || error?.message || error);
                window.alert(errorMessage);
            }
            console.error(error.message);

            // Αποθήκευση μηνύματος σφάλματος στο state
            this.setState({
                txMsg: errorMessage,
                errorTrig: true
            });
        }

        // Ενημέρωση του state μετά την ολοκλήρωση της διαδικασίας
        this.setState({
            loading: false,     // Απενεργοποίηση του loading state
            labelId: 6,         // Καταγραφή του ID του μηνύματος για εμφάνιση
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        });
    };



    // Καταμετράει τις ψήφους στον server και ενημερώνει το smart contract Ballot
    countVotes = async () => {
        this.setState({ loading: true, savedScrollPosition: window.scrollY });

        try {
            
            let curTimestamp = BigInt(Math.floor(Date.now() / 1000));       // Αποθήκευση της τρέχουσας ώρας
            
            // Έλεγχος αν η ψηφοφορία έχει λήξει πριν εκδοθούν τα αποτελέσματα
            if (curTimestamp <= this.state.endTime) 
                throw new Error("Results cannot be issued before the ballot is finished.");

            let delay = (Number(this.state.endTime) + 12) - Number(curTimestamp);       // Υπολογισμός χρόνου καθυστέρησης

            // Προσθήκη καθυστέρησης (16 sec max) για το συγχρονισμό δεδομένων στο hardhat (αν το delay είναι θετικό)
            // Έτσι αποφεύγονται οι κλήσεις που δίνουν λάθος αποτελέσματα, λόγω της αργής ενημέρωσης το blockchain (hardhat)
            if (delay >= 0) {
                console.log("Delay: ", delay);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }

            // Λήψη όλων των voteCommitments από το smart contract
            const voteCommitments = await this.state.ballot.getAllVotes();
            console.log("Blockchain Vote Commitments:", voteCommitments);

            // Μετατροπή των 'BigInt' ψήφων σε string πριν αποσταλούν στο backend
            const formattedCommitments = voteCommitments.map(vote => vote.toString());

            // Αποστολή των ψήφων στον server για αποκρυπτογράφηση και καταμέτρηση
            const response = await fetch("http://127.0.0.1:5000/get-final-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    candidates: this.state.candidateNum,        // Ο αριθμός υποψηφίων
                    voteCommitments: formattedCommitments,      // Ο πίνακας των voteCommitments
                    address: this.state.account                 // Η διεύθυνση του συνδεδεμένου λογαριασμού
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An unknown error occurred.");    // Ενεργοποιεί error από backend
            }

            const voteResultsArray = Object.values(data.voteResults);
            console.log("Vote Results Array:", voteResultsArray);

            // Ενημέρωση του struct Candidate με τα τελικά αποτελέσματα στο smart contract
            const txResponse = await this.state.ballot.issueBallotResults(voteResultsArray);
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή για επιβεβαίωση της συναλλαγής στο blockchain
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);
            console.log("Transaction :", txResponse);

            // Ανανέωση της λίστας των υποψηφίων
            await this.fetchCandidates();

            // Αποθήκευση των στοιχείων στο state (επιτυχές μήνυμα, έκδοσης αποτελεσμάτων)
            this.setState({
                issuedResults: true,
                txMsg: "The final ballot results have been issued!",
                errorTrig: false
            });

        } catch (error) {
            let errorMessage;

            if (error.data) {
                console.log("Error: ", error.message);
                errorMessage = error.reason;
                console.log("Error Message: ", error.reason);
            } else {
                // Ανίχνευση σφάλματος και εμφάνιση κατάλληλου μηνύματος
                errorMessage = "Error: " + (error?.reason || error?.message || error);
                console.error(errorMessage);
            }

            window.alert(errorMessage);

            // Αποθήκευση μηνύματος σφάλματος στο state
            this.setState({
                txMsg: errorMessage, 
                errorTrig: true
            });
        }

        // Ενημέρωση του state μετά την ολοκλήρωση της διαδικασίας
        this.setState({
            loading: false,         // Απενεργοποίηση του loading state
            labelId: 5,             // Καταγραφή του ID του μηνύματος για εμφάνιση
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        });
    };


    // Ανάκτηση των υποψηφίων από το smart contract και ενημέρωση του state.
    fetchCandidates = async () => {
        const candidatesCount = await this.state.ballot.candidatesCount();  // Παίρνει το πλήθος των υποψηφίων
        const candidatesRaw = await this.state.ballot.getCandidates();      // Παίρνει τον πίνακα υποψηφίων
        
        // Μετατροπή των δεδομένων σε ένα αναγνωρίσιμο format
        const Candidates = candidatesRaw.map(candidate => ({
            name: ethers.decodeBytes32String(candidate.name),   // Μετατροπή από bytes32 σε string
            voteCount: candidate.voteCount.toString()           // Βεβαιωνόμαστε ότι είναι string
        }));

        // Ενημέρωση του state με τα στοιχεία
        this.setState({ 
            candidateNum: candidatesCount.toString(),
            candidates: Candidates,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        });
    };

    /**
     * Προβολή των αποτελεσμάτων των ηλεκτρονικών εκλογών.
     * Εμφανίζει τους υποψηφίους ταξινομημένους με βάση τις ψήφους.
     */
    showElectionsResults = async () => {
        this.setState({ savedScrollPosition: window.scrollY });

        // Ανακτά τους υποψηφίους
        await this.fetchCandidates();

        // Εάν έχουν εκδοθεί τα αποτελέσματα
        if (this.state.issuedResults) {
            let Candidates = [...this.state.candidates];    // Δημιουργία αντιγράφου του array

            // Ταξινόμηση των υποψηφίων με φθίνουσα σειρά ψήφων (bubble sort)
            for (let i = 0; i < Candidates.length - 1; i++) {
                for (let j = 0; j < (Candidates.length - i - 1); j++) { 
                    if (Candidates[j].voteCount < Candidates[j + 1].voteCount) {  
                        // Ανταλλαγή στοιχείων για να μπει ο υποψήφιος με τις περισσότερες ψήφους πρώτος
                        let temp = Candidates[j];  
                        Candidates[j] = Candidates[j + 1];  
                        Candidates[j + 1] = temp;  
                    } 
                }
            }

            // Ενημέρωση του state με τα στοιχεία
            this.setState({ 
                finalCandidates: Candidates,
                labelId: 8, 
                txMsg: 'The winner is ' + Candidates[0].name + ' with ' + Candidates[0].voteCount + ' votes.'
            });
        }
        else {
            this.setState({ 
                labelId: 8, 
                txMsg: "Elections results have not issued yet." 
            });
        }

        // Ενημέρωση του state με την τρέχουμα ώρα
        this.setState({ curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString() });
    };

    /**
     * Εναλλάσσει ο χρήστης το chairperson state από false σε true
     * Παράμετρος: {boolean} prev -> Η προηγούμενη κατάσταση του chairperson state.
     */
    setChairperson = async (prev) => this.setState({ chairperson: !prev });

    
    // Constructor της React Component που αρχικοποιεί το state της εφαρμογής.
    constructor(props) {
        super(props);
        this.state = {
            account: '',            // Διεύθυνση του χρήστη
            provider: null,         // Παροχέας blockchain (Metamask)
            ballot: null,           // Αντικείμενο συμβολαίου ψηφοφορίας (Ballot smart contract)
            verifier: null,         // Αντικείμενο συμβολαίου επαλήθευσης ZK (Groth16Verifier smart contract)
            tornado: null,          // Αντικείμενο συμβολαίου ανώνυμης συναλλαγής (FakeTornado)
            startVoting: false,     // Κατάσταση εκκίνησης της ψηφοφορίας
            curTimestamp: '0',      // Τρέχον timestamp
            startupTime: '0',       // Χρόνος εκκίνησης της ψηφοφορίας
            endTime: '0',           // Χρόνος λήξης της ψηφοφορίας
            loading: true,          // Αν η σελίδα βρίσκεται σε κατάσταση φόρτωσης
            candidateNum: '0',      // Συνολικός αριθμός υποψηφίων
            voters: '0',            // Συνολικός αριθμός εγγεγραμμένων ψηφοφόρων
            candidates: [],         // Λίστα των υποψηφίων
            finalCandidates: [],    // Ταξινομημένη λίστα των τελικών υποψηφίων με βάση τις ψήφους
            issuedResults: false,   // Αν έχουν εκδοθεί τα αποτελέσματα
            txMsg: '',              // Μήνυμα συναλλαγής
            errorTrig: false,       // Αν έχει προκύψει σφάλμα
            labelId: 0,             // Αναγνωριστικό για UI ειδοποιήσεις
            chairperson: false,     // Αν ο χρήστης είναι ο διαχειριστής (chairperson)
            savedScrollPosition: 0, // Θέση κύλισης πριν από τη φόρτωση
            lastTimeOfVote: '0'     // Προεπιλεγμένος χρόνος τελευταίας ψήφου
        };
    }

    // Render της React Component (UI)
    render() {
        let content;

        // Εμφάνιση spinner φόρτωσης αν το state 'loading' είναι true
        this.state.loading ? 
        content = <p id='loader' className='text-center' style={{margin:'40px', color:'#041530', fontSize:"24px", fontWeight: "bold"}}>
                    <RotatingLines
                        visible={true}
                        height="42"
                        width="42"
                        strokeColor="#041530"
                        strokeWidth="5"
                        animationDuration="0.75"
                        ariaLabel="rotating-lines-loading"
                        className="text-white stroke-white"
                    />
                    &nbsp;
                    LOADING PLEASE...
                </p> 
        : 
        // Αλλιώς, εμφανίζεται η κύρια διεπαφή της ψηφοφορίας
        content =
            <Main 
                candidateNum = {this.state.candidateNum}            // Αριθμός υποψηφίων
                voters = {this.state.voters}                        // Αριθμός εγγεγραμμένων ψηφοφόρων
                registerCandidates = {this.registerCandidates}      // Συνάρτηση εγγραφής υποψηφίων
                registerVoters = {this.registerVoters}              // Συνάρτηση εγγραφής ψηφοφόρων
                voteCandidate = {this.voteCandidate}                // Συνάρτηση ψήφου
                issuedResults = {this.state.issuedResults}          // Κατάσταση έκδοσης αποτελεσμάτων
                showElectionsResults = {this.showElectionsResults}  // Συνάρτηση εμφάνισης αποτελεσμάτων
                countVotes = {this.countVotes}                      // Συνάρτηση καταμέτρησης ψήφων
                candidates = {this.state.candidates}                // Λίστα υποψηφίων
                finalCandidates = {this.state.finalCandidates}      // Ταξινομημένη λίστα υποψηφίων
                txMsg = {this.state.txMsg}                          // Μήνυμα συναλλαγής
                errorTrig = {this.state.errorTrig}                  // Κατάσταση σφάλματος
                labelId = {this.state.labelId}                      // Αναγνωριστικό UI μηνυμάτων
                chairperson = {this.state.chairperson}              // Αν ο χρήστης είναι chairperson
                proveVote = {this.proveVote}                        // Συνάρτηση απόδειξης ψήφου
            />;
        
        return (
            <div className='App' style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
                {/* Εμφάνιση των particles στο παρασκήνιο */}
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, minHeight:'85vh'}}>
                    <ParticleSettings />
                </div>

                {/* Μπάρα πλοήγησης */}
                <Navbar 
                    account = {this.state.account}                  // Διεύθυνση χρήστη
                    chairperson = {this.state.chairperson}          // Αν είναι διαχειριστής
                    setChairperson = {this.setChairperson}          // Συνάρτηση αλλαγής chairperson
                    curTimestamp = {this.state.curTimestamp}        // Τρέχον timestamp
                    startupTime = {this.state.startupTime}          // Ώρα εκκίνησης ψηφοφορίας
                    endTime = {this.state.endTime}                  // Ώρα λήξης ψηφοφορίας
                    loading = {this.state.loading}                  // Αν η εφαρμογή φορτώνει
                    startVoting = {this.state.startVoting}          // Αν η ψηφοφορία έχει ξεκινήσει
                    startElections = {this.startElections}          // Συνάρτηση εκκίνησης εκλογών
                    labelId = {this.state.labelId}                  // Αναγνωριστικό UI μηνυμάτων
                    txMsg = {this.state.txMsg}                      // Μήνυμα συναλλαγής
                />

                {/* Κεντρικό περιεχόμενο */}
                <div id='content' className='container-fluid mt-5' style={{ flex: 1, paddingTop: 30 }}>
                    <div className='row'>
                        <main role='main' className='col-lg-12 ml-auto mr-auto' style={{maxWidth: '100%'}}>
                            <div>
                                {content}
                            </div>
                        </main>
                    </div>
                </div>

                {/* Υποσέλιδο */}
                <Footer />
            </div>
        );
    }
}

export default App;


//  npm list --depth=0
//  το tsparticle πρέπει να έχει την ίδια version με react-tsparticles!!! (v.2)

// my-dapp@0.1.0 C:\master-ballot-dapp
// +-- @emotion/react@11.14.0
// +-- @emotion/styled@11.14.0
// +-- @eslint/js@9.19.0
// +-- @mui/material@6.4.4
// +-- @nomicfoundation/hardhat-toolbox@5.0.0
// +-- assert@2.1.0
// +-- bootstrap@5.3.3
// +-- buffer@6.0.3
// +-- circomlib@2.0.5
// +-- circomlibjs@0.1.7
// +-- cors@2.8.5
// +-- cra-template@1.2.0
// +-- crypto-browserify@3.12.1
// +-- dotenv@16.4.7
// +-- eslint-plugin-react@7.37.4
// +-- eslint@8.57.1
// +-- ethers@6.13.5
// +-- globals@15.14.0
// +-- hardhat@2.22.18
// +-- process@0.11.10
// +-- react-app-rewired@2.2.1
// +-- react-dom@18.3.1
// +-- react-icons@5.4.0
// +-- react-scripts@5.0.1
// +-- react-tsparticles@2.12.2
// +-- react@18.3.1
// +-- snarkjs@0.7.5
// +-- solidity-coverage@0.8.14
// +-- stream-browserify@3.0.0
// +-- timers-browserify@2.0.12
// +-- tsparticles@2.12.0
// +-- web-vitals@4.2.4
// +-- web3@4.16.0
// `-- webpack@5.88.2
