import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Ορισμός του τρέχοντος αρχείου και του φακέλου όπου βρίσκεται
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function deploy() {
  
    // Ορισμός της διάρκειας της εκλογικής διαδικασίας (default: 3600 δευτερόλεπτα)
    const electionDuration = parseInt(process.env.ELECTION_DURATION, 10) || 3600;
    if (isNaN(electionDuration)) {
        throw new Error("ELECTION_DURATION is not set or not a valid number.");
    }
    console.log('Elections Duration (sec): ', electionDuration);

    // Ανάθεση του πρώτου signer (account) από την διαμόρφωση του Hardhat
    let wallet = (await ethers.getSigners())[0];
    console.log("Deploying contracts with the account:", wallet.address);

    // Δημιουργία εργοστασιακών αντικειμένων για κάθε συμβόλαιο (contract factory)
    const Ballot = await ethers.getContractFactory("Ballot", wallet);
    const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier", wallet);
    const FakeTornado = await ethers.getContractFactory("FakeTornado", wallet);

    // Ανάπτυξη του Groth16Verifier smart contract
    const verifier = await Groth16Verifier.deploy();
    await verifier.waitForDeployment();
    const contractVerifierAddress = verifier.target;
    console.log('Verifier deployed to: ', contractVerifierAddress);

    // Ανάπτυξη του Ballot smart contract με παράμετρο τη διάρκεια των εκλογών και τη διεύθυνση του Verifier
    const ballot = await Ballot.deploy(electionDuration, contractVerifierAddress);
    await ballot.waitForDeployment();
    const contractBallotAddress = ballot.target;
    console.log('Ballot deployed to: ', contractBallotAddress);

    // Ανάπτυξη του FakeTornado smart contract
    const tornado = await FakeTornado.deploy();
    await tornado.waitForDeployment();
    const contractTornadoAddress = tornado.target;  
    console.log("FakeTornado deployed to:", contractTornadoAddress);

    // Ανάκτηση πληροφοριών του δικτύου (chain ID)
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.chainId);

    // Καθορισμός των διαδρομών των artifact αρχείων των smart contracts
    const artifactBallotPath = path.join(__dirname, "../src/artifacts/contracts/Ballot.sol/Ballot.json");
    const artifactVerifierPath = path.join(__dirname, "../src/artifacts/contracts/Groth16Verifier.sol/Groth16Verifier.json");
    const artifactTornadoPath = path.join(__dirname, "../src/artifacts/contracts/FakeTornado.sol/FakeTornado.json");

    // Ανάγνωση των artifact JSON αρχείων
    const artifactBallot = JSON.parse(fs.readFileSync(artifactBallotPath, "utf8"));
    const artifactVerifier = JSON.parse(fs.readFileSync(artifactVerifierPath, "utf8"));
    const artifactTornado = JSON.parse(fs.readFileSync(artifactTornadoPath, "utf8"));

    // Προσθήκη πληροφοριών του deployed network στα artifacts
    artifactBallot.networks = artifactBallot.networks || {};
    artifactBallot.networks[network.chainId] = {
      address: contractBallotAddress,
    };

    artifactVerifier.networks = artifactVerifier.networks || {};
    artifactVerifier.networks[network.chainId] = {
      address: contractVerifierAddress,
    };

    artifactTornado.networks = artifactTornado.networks || {};
    artifactTornado.networks[network.chainId] = {
      address: contractTornadoAddress,
    };

    // Ενημέρωση των artifact αρχείων με τις διευθύνσεις των αναπτυγμένων συμβολαίων
    fs.writeFileSync(artifactBallotPath, JSON.stringify(artifactBallot, null, 2));
    fs.writeFileSync(artifactVerifierPath, JSON.stringify(artifactVerifier, null, 2));
    fs.writeFileSync(artifactTornadoPath, JSON.stringify(artifactTornado, null, 2));

    console.log("Artifacts updated with deployed contract addresses!");

    // Διαγραφή του αρχείου vote-secrets.txt από τον server αν υπάρχει
    const filePath = path.join(__dirname, "../server/files/vote-secrets.txt");
    try {
      await fs.promises.unlink(filePath);
      console.log("The file vote-secrets.txt was deleted from the server.");
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("Error deleting file:", err);
      }
    }

    // Επιστροφή των διευθύνσεων των αναπτυγμένων συμβολαίων
    return { contractBallotAddress, contractVerifierAddress };
};

// Κλήση της deploy συνάρτησης και διαχείριση σφαλμάτων
deploy()
  .then(() => console.log("Deployment ολοκληρώθηκε!"))
  .catch((error) => console.error("Error:", error));
