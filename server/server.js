import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import * as snarkjs from "snarkjs";
import dotenv from "dotenv";
import buildPoseidon from './circomlibjs/poseidon_opt.js';
dotenv.config();
/* global BigInt */

// > node server.js

// Αντικατάσταση __dirname γιατί δεν υπάρχει στα ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.SERVER_PORT || 5000;

// Διαδρομή για αποθήκευση των vote secrets
const voteFilesDir = path.join(__dirname, "files");
const filePath = path.join(voteFilesDir, "vote-secrets.txt");

const zkeyFilename = "public/zkp/VoteCircuit_final.zkey";
const wasmFilename = "public/zkp/VoteCircuit.wasm";

// Επιτρέπει το frontend να στέλνει δεδομένα
const app = express();
app.use(express.json());
app.use(cors());

// Δημιουργία του Hardhat Provider
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", {
    chainId: 31337,  // Hardhat Local Network
    name: "hardhat"  // Όνομα δικτύου για αποφυγή ENS resolution
});

const types = {
    Vote: [
        { name: "voteCommitment", type: "uint256" },
        { name: "nullifierHash", type: "uint256" }
    ]
};

// Συναρτήσεις για φόρτωση του smart contract
async function loadContract() {

    try {
        // Ανάγνωση του Ballot.json
        const contractPath = path.resolve("src/artifacts/contracts/Ballot.sol/Ballot.json");
        const Ballot = JSON.parse(fs.readFileSync(contractPath, "utf-8"));

        // Σύνδεση στο Web3 (για να βρούμε το networkId)
        const network = await provider.getNetwork();
        const networkId = network.chainId;  // Παίρνουμε το chainId
        const ballotData = Ballot.networks[networkId];

        if (!ballotData) throw new Error(`Το Ballot contract δεν έχει αναπτυχθεί στο δίκτυο ${networkId}`);    

        // Εκτύπωση των δεδομένων για επιβεβαίωση
        console.log("✅ Ballot Contract ABI Loaded!")
        console.log("📌 Contract Address:", ballotData.address);

        return { contract: new ethers.Contract(ballotData.address, Ballot.abi, provider), abi: Ballot.abi, address: ballotData.address };
    }
    catch (error){
        const errorMsg = "❌ Load Contract Error: " + (error?.message || error);
        console.error(errorMsg);
        res.status(500).json({ error: errorMsg });
    }
}

// Δημιουργία του Domain για EIP-712 Typed Data Signing
function getDomain(contractAddress) {
    return {
        name: "AnonymousVoting",
        version: "1",
        chainId: 31337,
        verifyingContract: contractAddress
    }
}

// 🔥 **groth16Verify  API για Ανώνυμη Ψηφοφορία**
async function generateSaltedAddress (req, res) {
    try {    
        // Δημιουργία ενός hashed key χρησιμοποιώντας keccak256
        const { address } = req.body;

        if (!address) throw new Error("Missing parameters");

        console.log("📩 Received address request");
    
        let saltedAddress = ethers.keccak256(
            new ethers.AbiCoder().encode(
                ["address", "bytes32"],
                [address, process.env.SALT_KEY]
            )
        );
    
        // Παίρνουμε τα τελευταία 40 hex χαρακτήρες (20 bytes)
        saltedAddress = "0x" + saltedAddress.slice(-40);
    
        console.log("Salted Address: ", saltedAddress);

        res.json({ saltedAddress });
    }
    catch (error) {
        const errorMsg = "❌ Error generating salted address: " + (error?.message || error);
        console.error(errorMsg);
        res.status(500).json({ error: errorMsg });
    }  
}

// 🔥 **groth16Verify  API για Ανώνυμη Ψηφοφορία**
async function groth16Verify (req, res) {
    try {
        const { index, secret, nullifier } = req.body;

        if (!index || !secret || !nullifier) {
            return res.status(400).json({ error: "Missing parameters" });
        }
        console.log("📩 Received proof generation request");

        const input = {
            "vote": BigInt(index),
            "vote_secret": BigInt(secret),            //5660603418801853669264615416128
            "nullifier": BigInt(nullifier)
        }
    
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFilename, zkeyFilename);
    
        const proofA = proof.pi_a.slice(0, 2);
        const proofB = [proof.pi_b[0].slice(0, 2).reverse(), proof.pi_b[1].slice(0, 2).reverse()];
        const proofC = proof.pi_c.slice(0, 2);

        console.log("✅ Proof generated successfully");
    
        res.json({ proofA, proofB, proofC, publicSignals });
    }
    catch (error) {
        const errorMsg = "❌ Error generating proof: " + (error?.message || error);
        console.error(errorMsg);
        res.status(500).json({ error: errorMsg });
    }  
}

// 🔥 **Relayer API για Ανώνυμη Ψηφοφορία**
async function relayVote(req, res, ballotContract) {
    try {
        const { proofA, proofB, proofC, publicSignals, signature, newWalletPrivateKey } = req.body;

        if (!proofA || !proofB || !proofC || !publicSignals || !signature || !newWalletPrivateKey || !ballotContract) 
            throw new Error("Missing parameters");

        console.log("📩 Received vote request from frontend");

        // Δημιουργούμε το Wallet από το Private Key
        const newWallet = new ethers.Wallet(newWalletPrivateKey, provider);
        console.log("🔑 Anonymous Wallet Loaded:", newWallet.address);

        const message = {
            voteCommitment: publicSignals[0].toString(),
            nullifierHash: publicSignals[1].toString()
        };

        const domain = getDomain(ballotContract.target);

        const verifiedAddress = ethers.verifyTypedData(domain, types, message, signature);
        console.log("🔎 Signature verified! Voter Address:", verifiedAddress);

        // ✅ **Έλεγχος αν η υπογραφή είναι έγκυρη**
        if (verifiedAddress.toLowerCase() !== newWallet.address.toLowerCase()) 
            throw new Error("Invalid signature! Vote rejected.")

        const gasCost = await ballotContract.submitVote.estimateGas(proofA, proofB, proofC, publicSignals);
        const gasPrice = (await provider.getFeeData()).gasPrice; // Τιμή gas από το δίκτυο
        console.log("Gas Cost: ", gasCost)
        console.log("Gas Price: ", gasPrice)

        // ✅ **Εκτέλεση της ψήφου με το νέο ανώνυμο wallet**
        const tx = await ballotContract.connect(newWallet).submitVote(proofA, proofB, proofC, publicSignals, {gasCost: gasCost, gasPrice: 1000000000n});
        console.log("⏳ Sending vote transaction...");

        const receipt = await tx.wait();
        console.log("✅ Vote transaction confirmed hash: ", receipt.hash);
        console.log("✅ Vote transaction: ", tx);

        res.json({ message: "You have successfully voted!", tx: tx });

    } catch (error) {
        let errorMsg
        if (error.data) {
            console.log("❌ Error: ", error.message); 
            errorMsg = error.reason
            console.log("❌ Error Message: ", error.reason);
        }
        else {
            errorMsg = "❌ Error relaying vote: " + (error?.message || error);
            console.error(errorMsg);
        }
        
        res.status(500).json({ error: errorMsg });
    }
}

// Συναρτήσεις για αποθήκευση & ανάγνωση των vote secrets**
async function saveVoteSecret(req, res) {
    try {
        const { voteSecretBigInt } = req.body;

        if (!voteSecretBigInt) throw new Error("No vote secret provided");

        // Δημιουργία του φακέλου αν δεν υπάρχει
        if (!fs.existsSync(voteFilesDir)) {
            fs.mkdirSync(voteFilesDir, { recursive: true });
        }

        // Γράφει το voteSecretBigInt σε αρχείο (προσθέτει νέα γραμμή κάθε φορά)
        await fs.promises.appendFile(filePath, `${voteSecretBigInt}\n`);
        
        res.json({ message: "Vote secret saved successfully!" });

    } catch (error) {
        const errorMsg = "❌ Error writing to file: " + (error?.message || error);
        console.error(errorMsg);
        res.status(500).json({ error: errorMsg });
    }
}

async function getFinalResults(req, res, ballotContract) {
    try {
        const { candidates, voteCommitments, address } = req.body;

        if (!candidates || !voteCommitments || !address || !ballotContract) throw new Error("Missing parameters");

        const chairperson = await ballotContract.chairperson();

        if (address != chairperson) throw new Error("Only chairperson have the right to issue final ballot results.");

        if (candidates == 0 || voteCommitments == []) throw new Error("The parameters are not defined.");
        
        if (!fs.existsSync(filePath)) throw new Error("Vote Secret File does not exist");
        
        let voteResults = {}; // Αντικείμενο για να αποθηκεύουμε τα αποτελέσματα

        for (let i=0; i<candidates; i++) {
            voteResults[i] = 0;
        }

        console.log("Stored Vote Secrets:", voteCommitments)

        // Διαβάζουμε το αρχείο ως UTF-8
        const data = await fs.promises.readFile(filePath, "utf-8");
        const voteSecrets = data.split("\n")  
            .map(line => line.trim())  
            .filter(line => line !== "");  // Αποφεύγουμε κενές γραμμές

        // 🛠️ Μετατροπή των ψήφων σε BigInt στο frontend
        let storedVoteSecrets = voteSecrets.map(secret => BigInt(secret));

        console.log("Stored Vote Secrets (as BigInt):", storedVoteSecrets);

        // Βρόχος για όλους τους ψηφοφόρους που έχουν `vote_secret`
        for (const voteSecret of storedVoteSecrets) {
            for (let index = 0; index < candidates; index++) {
                // Χρήση της buildPoseidon() για hashing
                const poseidon = await buildPoseidon();
                // 1️⃣ Υπολογισμός του πρώτου hash
                const firstHash = poseidon([index, voteSecret]);

                // 2️⃣ Εφαρμογή δεύτερου Poseidon Hash και μετατροπή σε String
                const voteCommitment = poseidon.F.toString(poseidon([firstHash]));
                console.log("firstHash: ", firstHash);
                console.log("voteCommitment: ", voteCommitment);

                // 3️⃣ Έλεγχος αν το voteCommitment υπάρχει στο blockchain
                if (voteCommitments.includes(voteCommitment)) {
                    voteResults[index] += 1;
                }
            }
        }

        console.log("Τελικά Αποτελέσματα:", voteResults);

        // Στέλνουμε το voteSecrets ως array από strings (OXI BigInt)
        res.json({ voteResults });

    } catch (error) {
        let errorMsg
        if (error.data) {
            console.log("❌ Error: ", error.message); 
            errorMsg = error.reason
            console.log("❌ Error Message: ", error.reason);
        } else {
            errorMsg = error?.message || error
            console.error("❌ Error during decoding final results: " + (error?.message || error));
        }
        res.status(500).json({ error: errorMsg });
    }
}

// Συναρτήσεις για τις routes
async function setupRoutes(ballotContract) {
    app.post("/generate-address", (req, res) => generateSaltedAddress (req, res));
    app.post("/generate-proof", (req, res) => groth16Verify (req, res));
    app.post("/relay", (req, res) => relayVote(req, res, ballotContract));
    app.post("/save-vote-secret", (req, res) => saveVoteSecret(req, res));
    app.post("/get-final-results", (req, res) => getFinalResults(req, res, ballotContract));
}

// 🔥 **Συναρτήσεις για εκκίνηση του server**
async function startServer() {
    const contractInfo = await loadContract();
    if (!contractInfo) return;

    await setupRoutes(contractInfo.contract);

    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });
}

// ✅ **Εκκίνηση του server**
startServer();