import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import * as snarkjs from "snarkjs";
import dotenv from "dotenv";
import buildPoseidon from './circomlibjs/poseidon_opt.js';  // Φορτώνει το αρχείο  'poseidon_opt.js' απο την βιβλιοθήκη 'circomlibjs'
dotenv.config();            // Φορτώνει τις μεταβλητές περιβάλλοντος από το αρχείο .env

// Διαμορφώνει τις μεταβλητές για το directory του αρχείου
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.SERVER_PORT || 5000;   // Ορίζει την πόρτα από τις μεταβλητές περιβάλλοντος ή χρησιμοποιεί την προκαθορισμένη 5000

// Δημιουργία μιας διαδρομής για την αποθήκευση των μυστικών κωδικών στο αρχείο 'vote-secrets.txt'
const voteFilesDir = path.join(__dirname, "files");
const filePath = path.join(voteFilesDir, "vote-secrets.txt");

// Καθορίζει τις διαδρομές για τα αρχεία zkey και wasm που χρειάζονται για τα zk-SNARKs
const zkeyFilename = "public/zkp/VoteCircuit_final.zkey";
const wasmFilename = "public/zkp/VoteCircuit.wasm";

// Ρύθμιση της εφαρμογής express
const app = express();
app.use(express.json());    // Επιτρέπει στην εφαρμογή να δέχεται JSON στα αιτήματα
app.use(cors());            // Ενεργοποιεί την πολιτική Cross-Origin Resource Sharing

// Δημιουργία ενός provider για την σύνδεση με το δίκτυο Ethereum μέσω Hardhat
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", {
    chainId: 31337,  // Αναγνωριστικό για το τοπικό δίκτυο Hardhat
    name: "hardhat"  // Όνομα δικτύου
});

// Δημιουργία types για την επαλήθευση της υπογραφής
const types = {
    Vote: [
        { name: "voteCommitment", type: "uint256" },
        { name: "nullifierHash", type: "uint256" }
    ]
};

// Φορτώνει το Smart Contract και επιστρέφει τις πληροφορίες του (το αντικείμενο ballot, το ΑΒΙ και τη διεύθυνση του ballot)
async function loadContract() {
    try {
        // Φόρτωση του JSON αρχείου που περιέχει τα ABI και τις διευθύνσεις του smart contract Ballot
        const contractPath = path.resolve("src/artifacts/contracts/Ballot.sol/Ballot.json");
        const Ballot = JSON.parse(fs.readFileSync(contractPath, "utf-8"));

        // Παίρνουμε πληροφορίες από το δίκτυο του provider που είναι συνδεδεμένο
        const network = await provider.getNetwork();
        const networkId = network.chainId; 
        const ballotData = Ballot.networks[networkId];   // Προσπάθεια να βρεθούν τα δεδομένα του smart contract για το συγκεκριμένο δίκτυο

        if (!ballotData) throw new Error(`Το Ballot contract δεν έχει αναπτυχθεί στο δίκτυο ${networkId}`);   // Έλεγχος αν το smart contract έχει αναπτυχθεί στο δίκτυο

        console.log("✅ Ballot Contract ABI Loaded!");
        console.log("📌 Contract Address:", ballotData.address);

        return { contract: new ethers.Contract(ballotData.address, Ballot.abi, provider), abi: Ballot.abi, address: ballotData.address };

    } catch (error) {
        const errorMsg = "❌ Load Contract Error: " + (error?.message || error);
        console.error(errorMsg);        // Εκτύπωση σφάλματος σε περίπτωση αποτυχίας φόρτωσης του contract
    }
}

// Δημιουργεί το Domain για EIP-712 Typed Data Signing
function getDomain(contractAddress) {
    return {
        name: "AnonymousVoting",
        version: "1",
        chainId: 31337,
        verifyingContract: contractAddress
    }
}

// Συνάρτηση η οποία μετατρέπει μια address σε salted
async function generateSaltedAddress (req, res) {
    try {
        // Ανάκτηση της διεύθυνσης από το αίτημα
        const { address } = req.body;

        if (!address) throw new Error("Missing parameters"); // Έλεγχος ότι η διεύθυνση παρέχεται

        console.log("📩 Received address request");

        // Δημιουργία ενός hashed key χρησιμοποιώντας τη συνάρτηση keccak256 και
        // χρήση του AbiCoder για τον καθορισμό των τύπων των δεδομένων πριν την κωδικοποίηση
        let saltedAddress = ethers.keccak256(
            new ethers.AbiCoder().encode(
                ["address", "bytes32"],
                [address, process.env.SALT_KEY]
            )
        );

        // Εξαγωγή των τελευταίων 40 hex χαρακτήρων (20 bytes) για τη διεύθυνση
        saltedAddress = "0x" + saltedAddress.slice(-40);

        console.log("Salted Address: ", saltedAddress);

        // Επιστροφή της αλατισμένης διεύθυνσης στον χρήστη
        res.json({ saltedAddress });
    }
    catch (error) {
        // Εκτύπωση και επιστροφή του σφάλματος σε περίπτωση αποτυχίας
        const errorMsg = "❌ Error generating salted address: " + (error?.message || error);
        console.error(errorMsg);
        res.status(500).json({ error: errorMsg });
    }  
}

// Συνάρτηση ZKP groth16FullProve για Ανώνυμη Ψηφοφορία, όπου παράγει τα proofs και τα signals από το circuit 'VoteCircuit.circom'
async function groth16FullProve (req, res) {
    try {
        // Εξαγωγή των τιμών από το αίτημα του χρήστη
        const { index, secret, nullifier } = req.body;

        // Έλεγχος αν όλες οι απαραίτητες παράμετροι παρέχονται
        if (!index || !secret || !nullifier) {
            return res.status(400).json({ error: "Missing parameters" });
        }

        console.log("📩 Received proof generation request");

        // Δημιουργία των input για το zk-SNARK proof
        const input = {
            "vote": BigInt(index),
            "vote_secret": BigInt(secret), 
            "nullifier": BigInt(nullifier) 
        };

        // Παραγωγή του zk-SNARK proof χρησιμοποιώντας τη βιβλιοθήκη snarkjs
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFilename, zkeyFilename);

        // Επεξεργασία των παραμέτρων του proof για να είναι συμβατές με το δίκτυο Ethereum
        const proofA = proof.pi_a.slice(0, 2);
        const proofB = [proof.pi_b[0].slice(0, 2).reverse(), proof.pi_b[1].slice(0, 2).reverse()];
        const proofC = proof.pi_c.slice(0, 2);

        console.log("✅ Proof generated successfully");

        // Αποστολή των proofs και των public signals στο frontend
        res.json({ proofA, proofB, proofC, publicSignals });
    }
    catch (error) {
        // Εκτύπωση και επιστροφή του σφάλματος σε περίπτωση αποτυχίας
        const errorMsg = "❌ Error generating proof: " + (error?.message || error);
        console.error(errorMsg);
        res.status(500).json({ error: errorMsg });
    }  
}

// Συνάρτηση relayVote για την υποβολή της ψήφου από ένα ανώνυμο πορτοφόλι
async function relayVote(req, res, ballotContract) {
    try {
        // Ανάκτηση των δεδομένων από το σώμα του αιτήματος
        const { proofA, proofB, proofC, publicSignals, signature, newWalletPrivateKey } = req.body;

        // Ελέγχουμε αν όλες οι απαραίτητες παράμετροι υπάρχουν
        if (!proofA || !proofB || !proofC || !publicSignals || !signature || !newWalletPrivateKey || !ballotContract) 
            throw new Error("Missing parameters");

        console.log("📩 Received vote request from frontend");

        const newWallet = new ethers.Wallet(newWalletPrivateKey, provider);     // Δημιουργία νέου wallet χρησιμοποιώντας το private key του αιτήματος
        console.log("🔑 Anonymous Wallet Loaded:", newWallet.address);

        // Δημιουργία του μηνύματος που θα επαληθευτεί
        const message = {
            voteCommitment: publicSignals[0].toString(),
            nullifierHash: publicSignals[1].toString()
        };

        const domain = getDomain(ballotContract.target);     // Δημιουργία domain για την επαλήθευση της υπογραφής

        // Επαλήθευση της υπογραφής
        const verifiedAddress = ethers.verifyTypedData(domain, types, message, signature);
        console.log("🔎 Signature verified! Voter Address:", verifiedAddress);

        // Έλεγχος αν η διεύθυνση που επαληθεύτηκε αντιστοιχεί στο wallet που δημιουργήθηκε στο frontend
        if (verifiedAddress.toLowerCase() !== newWallet.address.toLowerCase()) 
            throw new Error("Invalid signature! Vote rejected.");

        // Υπολογισμός κόστους gas για την υποβολή της ψήφου
        const gasCost = await ballotContract.submitVote.estimateGas(proofA, proofB, proofC, publicSignals);
        const gasPrice = (await provider.getFeeData()).gasPrice;        // Λήψη της τιμής του gas από το δίκτυο
        console.log("Gas Cost: ", gasCost);
        console.log("Gas Price: ", gasPrice);

        // Υποβολή της ψήφου στο δίκτυο blockchain με το νέο wallet
        const tx = await ballotContract.connect(newWallet).submitVote(proofA, proofB, proofC, publicSignals, {gasLimit: gasCost, gasPrice: 1000000000n});
        console.log("⏳ Sending vote transaction...");

        // Αναμονή για την επιβεβαίωση της συναλλαγής
        const receipt = await tx.wait();
        console.log("✅ Vote transaction confirmed hash: ", receipt.hash);
        console.log("✅ Vote transaction: ", tx);

        // let voteCommitment = await ballotContract.connect(newWallet).proveYourVote(proofA, proofB, proofC, publicSignals, {gasLimit: gasCost, gasPrice: 1000000000n});
        // console.log("voteCommitment", voteCommitment);
        // while (!voteCommitment) {
        //     console.log("Waiting to prove vote...");
        //     await new Promise(resolve => setTimeout(resolve, 2000)); // Καθυστέρηση 2 δευτερολέπτων
        //     voteCommitment = await ballotContract.connect(newWallet).proveYourVote(proofA, proofB, proofC, publicSignals, {gasLimit: gasCost, gasPrice: 1000000000n});
        // }

        console.log("User vote has successfully been proved!");

        // Επιστροφή επιτυχίας στον χρήστη στο frontend
        res.json({ message: "You have successfully voted!", tx: tx });

    } catch (error) {
        // Διαχείριση και αναφορά σφαλμάτων
        let errorMsg;
        if (error.data) {
            console.log("❌ Error: ", error.message); 
            errorMsg = error.reason;
            console.log("❌ Error Message: ", error.reason);
        }
        else {
            errorMsg = "❌ Error relaying vote: " + (error?.message || error);
            console.error(errorMsg);
        }
        
        res.status(500).json({ error: errorMsg });
    }
}

// Συνάρτηση για την αποθήκευση των vote secrets σε ένα αρχείο
async function saveVoteSecret(req, res) {
    try {
        // Εξαγωγή του voteSecretBigInt από το σώμα του αιτήματος
        const { voteSecretBigInt } = req.body;

        if (!voteSecretBigInt) throw new Error("No vote secret provided");      // Έλεγχος για την ύπαρξη του voteSecretBigInt στο αίτημα

        if (!fs.existsSync(voteFilesDir)) {                             // Έλεγχος αν υπάρχει ο φάκελος για την αποθήκευση των vote secrets, αν όχι, δημιουργείται
            fs.mkdirSync(voteFilesDir, { recursive: true });
        }

        // Προσθήκη του vote secret σε νέα γραμμή στο αρχείο με τα υπόλοιπα
        await fs.promises.appendFile(filePath, `${voteSecretBigInt}\n`);
        
        // Επιστροφή μηνύματος επιτυχίας στον client
        res.json({ message: "Vote secret saved successfully!" });

    } catch (error) {
        // Καταγραφή του σφάλματος και επιστροφή του στον client
        const errorMsg = "❌ Error writing to file: " + (error?.message || error);
        console.error(errorMsg);
        res.status(500).json({ error: errorMsg });
    }
}

// Συνάρτηση για την καταμέτρηση των τελικών αποτελεσμάτων της ψηφοφορίας
async function getFinalResults(req, res, ballotContract) {
    try {
        const { candidates, voteCommitments, address } = req.body;
        
        if (!candidates || !voteCommitments || !address || !ballotContract) throw new Error("Missing parameters");  // Έλεγχος αν οι απαραίτητες παράμετροι είναι παρόντες

        // Εξακρίβωση ότι μόνο ο πρόεδρος μπορεί να εκδώσει τα τελικά αποτελέσματα
        const chairperson = await ballotContract.chairperson();
        if (address != chairperson) throw new Error("Only chairperson have the right to issue final ballot results.");
        
        if (candidates == 0 || voteCommitments.length === 0) throw new Error("The parameters are not defined.");    // Έλεγχος εγκυρότητας των παραμέτρων

        if (!fs.existsSync(filePath)) throw new Error("Vote Secret File does not exist");      // Έλεγχος ύπαρξης του αρχείου με τους μυστικούς κωδικούς των ψηφοφόρων
        
        let voteResults = {}; // Δημιουργία αντικειμένου για αποθήκευση των αποτελεσμάτων

        // Αρχικοποίηση αποτελεσμάτων για κάθε υποψήφιο
        for (let i=0; i<candidates; i++) {
            voteResults[i] = 0;
        }

        // Ανάγνωση του αρχείου με τους μυστικούς κωδικούς
        const data = await fs.promises.readFile(filePath, "utf-8");
        const voteSecrets = data.split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");

        let storedVoteSecrets = voteSecrets.map(secret => BigInt(secret));  // Μετατροπή των κωδικών σε BigInt

        // Διαδικασία καταμέτρησης ψήφων με χρήση poseidon hashing
        for (const voteSecret of storedVoteSecrets) {
            for (let index = 0; index < candidates; index++) {
                const poseidon = await buildPoseidon();
                const firstHash = poseidon([index, voteSecret]);
                const voteCommitment = poseidon.F.toString(poseidon([firstHash]));

                // Έλεγχος αν το voteCommitment που παράχθηκε, με index υποψήφιου και μυστικό κωδικό ψηφοφόρου, υπάρχει στις δεσμεύσεις ψήφων του blockchain
                if (voteCommitments.includes(voteCommitment)) {
                    voteResults[index] += 1;
                }
            }
        }

        // Επιστροφή των αποτελεσμάτων της ηλεκτρονικής ψηφοφορίας στον client
        res.json({ voteResults });

    } catch (error) {
        // Καταγραφή του σφάλματος και επιστροφή του στον client
        let errorMsg;
        if (error.data) {
            console.log("❌ Error: ", error.message); 
            errorMsg = error.reason;
        } else {
            errorMsg = error?.message || error;
        }
        console.error("❌ Error during gathering final results: " + errorMsg);
        res.status(500).json({ error: errorMsg });
    }
}

// Συνάρτηση όπου ρυθμίζει τις διαδρομές API του server, διασφαλίζοντας ότι 
// οι σχετικές μέθοδοι καλούνται ανάλογα με τη διεπαφή που αιτείται ο χρήστης.
async function setupRoutes(ballotContract) {
    app.post("/generate-address", (req, res) => generateSaltedAddress(req, res));
    app.post("/generate-proof", (req, res) => groth16FullProve(req, res));
    app.post("/relay", (req, res) => relayVote(req, res, ballotContract));
    app.post("/save-vote-secret", (req, res) => saveVoteSecret(req, res));
    app.post("/get-final-results", (req, res) => getFinalResults(req, res, ballotContract));
}

// Συνάρτηση όπου φορτώνει το smart contract, ρυθμίζει τις διαδρομές και ξεκινά τον server στην καθορισμένη θύρα.
async function startServer() {
    const contractInfo = await loadContract();
    if (!contractInfo) return;      // Επιστροφή εάν δεν φορτώθηκε σωστά το contract

    await setupRoutes(contractInfo.contract);  // Ρύθμιση των routes

    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);  // Εκκίνηση του server και ενημέρωση στο console
    });
}

// Εκκίνηση του server**
startServer();
