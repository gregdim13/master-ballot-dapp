import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default async function deploy() {

    //Assign the first signer, which comes from the first privateKey from our configuration in hardhat.config.js, to a wallet variable.
    let wallet = (await ethers.getSigners())[0];
    console.log("Deploying contracts with the account:", wallet.address);

    //Initialize a contract factory object
    //wallet/signer used for signing the contract calls/transactions with this contract
    const Ballot = await ethers.getContractFactory("Ballot", wallet);
    const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier", wallet);
    const FakeTornado = await ethers.getContractFactory("FakeTornado", wallet);

    //Using already intilized contract facotry object with our contract, we can invoke deploy function to deploy the contract.
    //Accepts constructor parameters from our contract

    const verifier = await Groth16Verifier.deploy();
    //We use wait to recieve the transaction (deployment) receipt, which contains contractAddress
    await verifier.waitForDeployment();
    const contractVerifierAddress = verifier.target;
    console.log('Verifier deployed to: ', contractVerifierAddress);


    const ballot = await Ballot.deploy(60, contractVerifierAddress);  // 25200 7 ώρες
    await ballot.waitForDeployment();
    const contractBallotAddress = ballot.target;
    console.log('Ballot deployed to: ', contractBallotAddress);

    const tornado = await FakeTornado.deploy();
    await tornado.waitForDeployment();
    const contractTornadoAddress = tornado.target;  
    console.log("FakeTornado deployed to:", contractTornadoAddress);

    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.chainId);

    // Path to the artifact JSON file
    const artifactBallotPath = path.join(__dirname, "../src/artifacts/contracts/Ballot.sol/Ballot.json");
    const artifactVerifierPath = path.join(__dirname, "../src/artifacts/contracts/Groth16Verifier.sol/Groth16Verifier.json");
    const artifactTornadoPath = path.join(__dirname, "../src/artifacts/contracts/FakeTornado.sol/FakeTornado.json");


    // Read the artifact file
    const artifactBallot = JSON.parse(fs.readFileSync(artifactBallotPath, "utf8"));
    const artifactVerifier = JSON.parse(fs.readFileSync(artifactVerifierPath, "utf8"));
    const artifactTornado = JSON.parse(fs.readFileSync(artifactTornadoPath, "utf8"));

    // Add the deployed network info
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

    // Write back to the artifact file
    fs.writeFileSync(artifactBallotPath, JSON.stringify(artifactBallot, null, 2));
    fs.writeFileSync(artifactVerifierPath, JSON.stringify(artifactVerifier, null, 2));
    fs.writeFileSync(artifactTornadoPath, JSON.stringify(artifactTornado, null, 2));

    console.log("Artifacts updated with deployed contract address!");

    const filePath = path.join(__dirname, "../server/files/vote-secrets.txt");

    try {
      await fs.promises.unlink(filePath);
      console.log("The file vote-secrets.txt was deleted from the server.");
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("Error deleting file:", err);
      }
    }

    return { contractBallotAddress, contractVerifierAddress };
};

deploy()
  .then(() => console.log("Deployment ολοκληρώθηκε!"))
  .catch((error) => console.error("Error:", error));



// const { ethers } = require("hardhat");

// async function main() {
//     // Πάρε τον πρώτο signer από το τοπικό node
//     const [deployer] = await ethers.getSigners();

//     console.log("Deploying contracts with the account:", deployer.address);

//     // Δημιουργία του contract factory για το Ballot contract
//     const Ballot = await ethers.getContractFactory("Ballot");

//     // Deploy το contract με τον επιθυμητό χρόνο περιορισμού (π.χ. 3600)
//     const ballot = await Ballot.deploy(3600);
//     await ballot.waitForDeployment();
//       // The address the Contract WILL have once mined
//     // See: https://ropsten.etherscan.io/address/0x2bd9aaa2953f988153c8629926d22a6a5f69b14e

//     // console.log(ballot.deployTransaction.hash);

//     // The contract is NOT deployed yet; we must wait until it is mined
//     // await contract.deployed()

//   // Περιμένουμε να ολοκληρωθεί η συναλλαγή και να πάρουμε τη διεύθυνση του contract
// //   await ballot.deployed();

//   console.log("Ballot contract deployed to:", ballot.target);
// }

// // Εκτέλεση της συνάρτησης main
// main()
//   .then(() => process.exit(0))  // Αν η εκτέλεση είναι επιτυχής, τερματίζει το process
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);  // Αν υπάρχει σφάλμα, τερματίζει με σφάλμα
//   });






// const { ethers } = require("hardhat");
// console.log("hello");

// async function main() {

//   //Assign the first signer, which comes from the first privateKey from our configuration in hardhat.config.js, to a wallet variable.
//   console.log("hello2");
//   let wallet = (await ethers.getSigners())[0];

//   //Initialize a contract factory object
//   //name of contract as first parameter
//   //wallet/signer used for signing the contract calls/transactions with this contract
//   const Ballot = await ethers.getContractFactory("Ballot", wallet);
//   //Using already intilized contract facotry object with our contract, we can invoke deploy function to deploy the contract.
//   //Accepts constructor parameters from our contract
//   const ballot = await Ballot.deploy(3600);
//   //We use wait to recieve the transaction (deployment) receipt, which contains contractAddress
//   const contractAddress = (await ballot.deployTransaction.wait()).contractAddress;
//   ballot.deployTransaction.

//   console.log('Greeter deployed to: ', contractAddress);

//   return contractAddress;
// }

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
// });




// async function main() {

//     const [deployer] = await ethers.getSigners();

//     console.log("Deploying contracts with the account:", deployer.address);

//     const Ballot = await ethers.getContractFactory("Ballot");
//     const ballot = await Ballot.deploy(3600);

//     console.log("Contract deployed at:", ballot.address);

//     const saySomething = await ballot.speak();
    
//     console.log("saySomething value:", saySomething);
// }

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
// });


// async function main() {

//     const Ballot = await ethers.getContractFactory("Ballot");
//     const ballot = await Ballot.deploy(3600);
//     // const b = await ballot.deployed()
  
//     await ballot.deployed();
  
//     console.log("Contract deployed to:", ballot.address);
//   }
  
//   main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });


// const Ballot = artifacts.require('Ballot');

// module.exports =  async function(deployer, network, accounts) {
//     // deploy Ballot Contract
//     await deployer.deploy(Ballot, 60)
//     const ballot = await Ballot.deployed()

//     // register voters account 1, 2, 3
//     await ballot.registerVoters(accounts[1])
//     await ballot.registerVoters(accounts[2])
//     await ballot.registerVoters(accounts[3])
// };

