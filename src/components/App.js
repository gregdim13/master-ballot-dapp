// core file - mothership output
import React, {Component} from 'react'
import Navbar from './Navbar.js';
import Footer from './Footer.js';
import Ballot from '../artifacts/contracts/Ballot.sol/Ballot.json'  // ΣΗΜΑΝΤΙΚΟ ΣΤΟ CMD με ADMIN: mklink /D "C:\master-dapp\node_modules\artifacts" "C:\master-dapp\artifacts"
import Groth16Verifier from '../artifacts/contracts/Groth16Verifier.sol/Groth16Verifier.json' 
import FakeTornado from '../artifacts/contracts/FakeTornado.sol/FakeTornado.json' 
import Main from './Main.js';
import ParticleSettings from './ParticleSettings.js';
import {ethers} from "ethers";
import { RotatingLines } from "react-loader-spinner";
// set ELECTION_DURATION=3600 && npx hardhat run scripts/deploy.js --network localhost && node server/server.js
/* global BigInt */


const stringToBigInt = (str) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str); // Μετατροπή σε bytes
    const hex = Array.from(encoded).map(byte => byte.toString(16).padStart(2, '0')).join('');
    return BigInt("0x" + hex); // Μετατροπή σε BigInt
}

const copyToClipordAlert = (message, secret) => {

    const text = window.prompt(message, secret);

    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied to clipboard!");
        }).catch(err => console.error("Failed to copy", err));
    }
}

const getFormattedDate = (timestamp) => {

    const date = new Date(Number(timestamp) * 1000);
    // Μορφοποίηση της ημερομηνίας
    const formattedDate = date.toLocaleString("en-GB", {
        weekday: "long",  // Πλήρης ημέρα (Monday, Tuesday...)
        year: "numeric",  // Έτος (2025)
        month: "long",    // Πλήρης μήνας (February)
        day: "numeric",   // Ημέρα (19)
        hour: "2-digit",  // Ώρα (24ωρη μορφή)
        minute: "2-digit" // Λεπτά
    });

    return formattedDate;
}

class App extends Component {
    // our react goes in here
    async componentDidMount() {
        console.log("Loading Blockchain Data...");
        await this.loadBlockchainData();
        this.setState({savedScrollPosition: window.scrollY})

        // Ανίχνευση αλλαγής λογαριασμού στο metamask
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    window.alert("Please connect to MetaMask.");
                } else {
                    this.setState({ account: accounts[0] });
                    // ✅ Χρησιμοποιούμε `this.loadBlockchainData` μέσα σε arrow function
                    await this.loadBlockchainData();
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

    async loadBlockchainData() {

        let provider, signer, account, network

        if (window.ethereum) {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            console.log("Provider (loadProvider) :", provider);

            signer = await provider.getSigner(); // Παίρνουμε τον signer
            account = await signer.getAddress(); // Παίρνουμε τη διεύθυνση του χρήστη
            network = await provider.getNetwork();

            this.setState({ provider, account })

            // Load all Contracts
            const networkId = network.chainId;
            const ballotData = Ballot.networks[networkId];
            const verifierData = Groth16Verifier.networks[networkId];
            const tornadoData = FakeTornado.networks[networkId];

            if (ballotData) {  // if js ballot finds it
                
                const ballot = new ethers.Contract(ballotData.address, Ballot.abi, signer)

                const startupTime = await ballot.startupTime();  
                const curTimestamp = BigInt(Math.floor(Date.now() / 1000));
                const stgLimit =  await ballot.stageLimit();

                startupTime === BigInt(0) ? 
                    this.setState({startVoting: false}) : 
                    this.setState({startVoting: true})

                const endTime = stgLimit + startupTime

                if (startupTime) console.log("Elections start time on", getFormattedDate(startupTime), "and end time on", getFormattedDate(endTime));

                const issRes = await ballot.issuedResults();
                const votersLength = await ballot.votersCount()

                this.setState({
                        startupTime: startupTime.toString(),
                        curTimestamp: curTimestamp.toString(),
                        endTime: endTime.toString(),
                        ballot,
                        voters: votersLength.toString(),
                        txMsg: '',
                        errorTrig: false,
                        labelId: 0,
                        pressResults: false,
                        issuedResults: issRes
                    },

                    async () => {
                        console.log("Τα states ενημερώθηκαν! Τώρα εκτελούμε fetchCandidates...");
                        await this.fetchCandidates();
                    }
                )
            }
            else {
                window.alert('Error! Ballot contract not deployed - no detected network!')
            }

            if (verifierData) {  // if js verifier finds it
                const verifier =  new ethers.Contract(verifierData.address, Groth16Verifier.abi, signer);
                this.setState({ verifier })  // state updates verifier with new data
            }
            else {
                window.alert('Error! Groth16Verifier contract not deployed - no detected network!')
            }

            if (tornadoData) {  // if js faketornado finds it
                const tornado = new ethers.Contract(tornadoData.address, FakeTornado.abi, signer)
                this.setState({ tornado })  // state updates tornado with new data
            }
            else {
                window.alert('Error! FakeTornado contract not deployed - no detected network!')
            }
        }
        else {
            window.alert("No Ethereum browser detected! Install MetaMask.");
        }

        this.setState({ loading: false });
    }

    startElections = async () => {
        this.setState({ loading: true, savedScrollPosition: window.scrollY }); 

        try {

            let curTimestamp = BigInt(Math.floor(Date.now() / 1000));

            // Εκτέλεση συναλλαγής
            const txResponse = await this.state.ballot.startBallot(curTimestamp)
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή για επιβεβαίωση στο blockchain
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);
            console.log("Transaction :", txResponse);

            const startupTime = await this.state.ballot.startupTime();
            console.log("Elections started at:", startupTime.toString());

            this.setState(
                { 
                    startupTime: startupTime.toString(),
                    curTimestamp: curTimestamp.toString(),
                    startVoting: true,
                    loading: false
                },
                await this.loadBlockchainData()
            );

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

            this.setState({
                labelId: 7,
                txMsg: errorMessage,
            })
        }

        this.setState({ loading: false }); 
    }
    
    // register functions
    registerCandidates = async (candidateName) => {
        this.setState({ loading: true,  savedScrollPosition: window.scrollY});   

        try {
            const nameBytes32 = ethers.encodeBytes32String(candidateName);

            // Εκτέλεση συναλλαγής
            const txResponse = await this.state.ballot.registerCandidates(nameBytes32);
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή για επιβεβαίωση στο blockchain
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);
            console.log("Transaction :", txResponse);

            await this.fetchCandidates();
            const msg = "Candidate registered successfully!"

            this.setState({
                txMsg: msg,
                errorTrig: false
            })
        }
        catch (error) {
            let errorMessage

            if (error.data) {
                console.log("Error: ", error.message); 
                errorMessage = error.reason
                console.log("Error Message: ", error.reason); 
            }
            else {
                errorMessage = "Error registering Candidates: " + (error?.reason || error?.message || error);
                console.error(errorMessage);
            }

            //window.alert(errorMessage);
            this.setState({ txMsg: errorMessage, errorTrig: true })
        }

        this.setState({
            loading: false,
            labelId: 1,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        })

    }

    registerVoters = async (voterAddress) => {
        
        this.setState({loading: true, savedScrollPosition: window.scrollY})

        try {
            if (!ethers.isAddress(voterAddress)) {
                throw new Error("Invalid Ethereum Address");
            }
            console.log("Valid Ethereum Address:", voterAddress);

            const response = await fetch("http://127.0.0.1:5000/generate-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    address: voterAddress, 
                })
            });
    
            if (!response.ok) {
                throw new Error("Failed to generate address");
            }
    
            const data = await response.json();
            console.log("Salted Address: ", data.saltedAddress)

            // Εκτέλεση συναλλαγής
            const txResponse = await this.state.ballot.registerVoters(data.saltedAddress);
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή για επιβεβαίωση στο blockchain
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);
            console.log("Transaction :", txResponse);

            let votersLength = await this.state.ballot.votersCount()
            let msg = "Voter registered successfully!"

            this.setState({
                voters: votersLength.toString(),
                txMsg: msg,
                errorTrig: false
            })
            // window.alert(msg);
        }
        catch (error) {
            let errorMessage

            if (error.data) {
                console.log("Error: ", error.message); 
                errorMessage = error.reason
                console.log("Error Message: ", error.reason); 
            }
            else {
                // Μετατροπή του error σε string για να γίνει έλεγχος
                errorMessage = error.toString();
                // Έλεγχος αν περιέχει τη φράση "Error: Assert Failed"
                if (errorMessage.includes("Error: Assert Failed")) {
                    errorMessage = "Error: Assert Failed due to the constraints."
                    console.error(errorMessage);
                } else {
                    errorMessage = "Error registering Voters: " + (error?.reason || error?.message || error);
                    console.error(errorMessage);
                }
            }

            window.alert(errorMessage)

            this.setState({
                txMsg: errorMessage,
                errorTrig: true,
                loading: false
            })
        }

        this.setState({
            loading: false,
            labelId: 2,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        })
    }

    depositToFakeTornado = async (gasEstimate) => {
        
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", {  // χρησιμοποιώ αυτόν τον provider γιατι έπαιρνα ένα σφάλμα στο metamask (eth_maxPriorityFeePerGas)
            chainId: 31337,  // Hardhat Local Network
            name: "hardhat"  // Όνομα δικτύου για αποφυγή ENS resolution
        });

        const depositHash = ethers.keccak256(ethers.randomBytes(32)); // Δημιουργία deposit hash

        const gasPrice = (await provider.getFeeData()).gasPrice; // Τιμή gas από το δίκτυο
        const gasLimit = BigInt(gasEstimate) + BigInt(150000); // Προσθέτουμε μικρό buffer
        const totalCost = BigInt(gasLimit) * BigInt(gasPrice);
        // console.log("Gas Price: ", gasPrice)
        // console.log("Total Gas Price: ", totalCost)

        // Εκκίνηση συναλλαγής κατάθεσης
        const txResponse = await this.state.tornado.deposit(depositHash, {
            value: totalCost,       // ethers.parseEther("1"),  
            gasLimit: gasLimit,     // gasLimit: 500000, 
            gasPrice: gasPrice      // });
        });

        console.log("Deposit Hash:", depositHash);
        console.log("Transaction Hash:", txResponse.hash);
    
        // Αναμονή επιβεβαίωσης της συναλλαγής στο blockchain
        const txReceipt = await txResponse.wait();
        console.log("Transaction Deposit Receipt:", txReceipt);

        // Σύνδεση του newWallet με τον provider
        const newWallet = ethers.Wallet.createRandom().connect(this.state.provider);
        console.log("Wallet connected to provider!");
        console.log("New Anonymous Address:", newWallet.address);
        console.log("New Anonymous Private Key:", newWallet.privateKey);

        // Εκκίνηση συναλλαγής ανάληψης στο νέο πορτοφόλι
        const txResponse2 = await this.state.tornado.withdraw(newWallet.address, {
            gasLimit: 500000, 
        });

        console.log("Transaction Hash:", txResponse2.hash);
    
        // Αναμονή επιβεβαίωσης της συναλλαγής στο blockchain
        const txReceipt2 = await txResponse2.wait();
        console.log("Transaction Withdraw Receipt:", txReceipt2);


        // Αναμονή μέχρι το newWallet να έχει balance
        let balance = await this.state.provider.getBalance(newWallet.address);
        while (balance === ethers.parseEther("0")) {
            console.log("Waiting for ETH to arrive...");
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec delay
            balance = await this.state.provider.getBalance(newWallet.address);
        }

        console.log("ETH received in new wallet:", ethers.formatEther(balance));
    
        return newWallet;
    }

    getTypedData = async (contractAdress, voteCommitment, nullifierHash) => {
        // ✅ **Δημιουργούμε το EIP-712 Typed Message για την υπογραφή**
        const domain = {
            name: "AnonymousVoting",
            version: "1",
            chainId: 31337, // Hardhat τοπικό δίκτυο
            verifyingContract: contractAdress
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

        return { domain, types, message }
    }

    
    voteCandidate = async (index, password) => {
        let labId
        this.setState({loading: true,  savedScrollPosition: window.scrollY})

        try {

            // Έλεγχος αν ο κωδικός έχει τουλάχιστον 16 χαρακτήρες και περιέχει γράμματα, αριθμούς και σύμβολα
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()*$^#_\-+=<>]).{16,}$/;
            if (!strongPasswordRegex.test(password)) {
                throw new Error("Secret Code Fail");
            }

            copyToClipordAlert("Copy code secret in a safe place: ", password)

            let response = await fetch("http://127.0.0.1:5000/generate-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    address: this.state.account, 
                })
            });
    
            if (!response.ok) {
                throw new Error("Failed to generate address");
            }
    
            const data = await response.json();

            const nullifier = await this.state.ballot.verifyVoter(data.saltedAddress)
            console.log("Nullifier: ", nullifier)

            copyToClipordAlert("Copy nullifier in a safe place: ", nullifier)
        
            console.log("Password: ", password)
            //const voteSecret = "G!tH@ck3r2024";
            const voteSecretBigInt = stringToBigInt(password);
            console.log("Vote Secret as BigInt:", voteSecretBigInt);

            response = await fetch("http://127.0.0.1:5000/generate-proof", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    index: index.toString(), 
                    secret: voteSecretBigInt.toString(), 
                    nullifier: nullifier.toString()
                })
            });

            const dataProofs = await response.json();
    
            if (!response.ok) {
                throw new Error(dataProofs.error);
            }
            
            // Δεν εκτελεί τη συναλλαγή. Μόνο υπολογίζει το κόστος (σε gas units). Επίσης ελέγχει εάν έχει τελειώσει η διαδικασία της ψηφοφορίας.
            const gasEstimate = await this.state.ballot.submitVote.estimateGas(dataProofs.proofA, dataProofs.proofB, dataProofs.proofC, dataProofs.publicSignals);
            console.log("Estimated Gas Cost:", gasEstimate.toString());    

            const newWallet = await this.depositToFakeTornado(gasEstimate)

            const { domain, types, message } = await this.getTypedData(this.state.ballot.target, dataProofs.publicSignals[0], dataProofs.publicSignals[1])

            const signature = await newWallet.signTypedData(domain, types, message);
            console.log("Signed Vote:", signature);

            // Στέλνουμε την υπογραφή στον Relayer
            response = await fetch("http://127.0.0.1:5000/relay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    proofA: dataProofs.proofA, 
                    proofB: dataProofs.proofB, 
                    proofC: dataProofs.proofC, 
                    publicSignals: dataProofs.publicSignals, 
                    signature, 
                    newWalletPrivateKey: newWallet.privateKey})
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error); // Ρίχνει error με το μήνυμα του backend
            }
        
            console.log("✅ Success:", result.message);
            console.log("✅ Transaction: ", result.tx);

            // Στέλνουμε το secret στο server
            response = await fetch("http://127.0.0.1:5000/save-vote-secret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    voteSecretBigInt: voteSecretBigInt.toString()}) 
            });

            const result2 = await response.json();
            if (!response.ok) {
                throw new Error(result2.error); // Ρίχνει error με το μήνυμα του backend
            }

            const msg = "You have successfully voted."
            this.setState({
                txMsg: msg,
                errorTrig: false,
            })
            labId = 3
            window.alert(msg);

        } catch (error) {

            let errorMessage

            if (error.data) {
                console.log("Error: ", error.message); 
                errorMessage = error.reason
                console.log("Error Message: ", error.reason);
                window.alert(errorMessage); 
                labId = 3
            }
            else {
                // Έλεγχος αν περιέχει τη φράση "Error: Assert Failed"
                if (error.message.includes("Secret Code Fail")) {
                    errorMessage = "Error: Incorrect secret code syntax!!"
                    window.alert("Your vote secret must be at least 16 characters long and contain: \n - At least one uppercase letter\n - At least one lowercase letter\n - At least one number\n - At least one special character");
                    labId = 4
                }
                else {
                    // Έλεγχος για μήνυμα σφάλματος
                    errorMessage = "Error during voting procedure: " + (error?.reason || error?.message || error);
                    window.alert(errorMessage);
                    labId = 3
                }
            }
            console.error(error.message);

            this.setState({
                txMsg: errorMessage,
                errorTrig: true
            })
        }
        this.setState({
            loading: false,
            labelId: labId,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        })
    }

    proveVote = async () => {

        this.setState({ loading: true,  savedScrollPosition: window.scrollY })
        
        try {
            let response = await fetch("http://127.0.0.1:5000/generate-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    address: this.state.account, 
                })
            });

            const data = await response.json();
    
            if (!response.ok) {
                throw new Error("Failed to generate address");
            }
    
            const nullifier = await this.state.ballot.verifyVoter(data.saltedAddress)  // Αν δεν έχει δικαίωμα να ψηφίσει βγάζει σφάλμα
            console.log("Nullifier: ", nullifier)

            const voteSecretBigInt = stringToBigInt("abcd1234");
            console.log("Vote Secret as BigInt:", voteSecretBigInt);

            response = await fetch("http://127.0.0.1:5000/generate-proof", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    index: "0",
                    secret: voteSecretBigInt.toString(), 
                    nullifier: nullifier.toString()
                })
            });

            const dataProofs = await response.json();
    
            if (!response.ok) {
                throw new Error(dataProofs.error);
            }

            let proof =  await this.state.ballot.proveYourVote(dataProofs.proofA, dataProofs.proofB, dataProofs.proofC, dataProofs.publicSignals), msg;
            if (proof) {
                msg ="You prove that you have successfully voted. ✅"
                this.setState({ txMsg: msg, errorTrig: false })

            } else {
                msg ="You prove that you haven't voted. ❌"
                this.setState({ txMsg: msg, errorTrig: true })
            }  

            window.alert(msg);

        } catch (error) {

            let errorMessage

            if (error.data) {
                console.log("Error: ", error.message); 
                errorMessage = error.reason
                console.log("Error Message: ", error.reason);
                window.alert(errorMessage); 
            }
            else {
                    // Έλεγχος για μήνυμα σφάλματος
                    errorMessage = "Error during prove procedure: " + (error?.reason || error?.message || error);
                    window.alert(errorMessage);
            }
            console.error(error.message);

            this.setState({
                txMsg: errorMessage,
                errorTrig: true
            })
        }

        this.setState({
            loading: false,
            labelId: 6,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        })

    }


    // 3️⃣ Συνάρτηση που καταμετράει τις ψήφους
    countVotes = async () => {
        this.setState({loading: true, savedScrollPosition: window.scrollY})
        try {

            let curTimestamp = BigInt(Math.floor(Date.now() / 1000));
            
            if (curTimestamp <= this.state.endTime) throw new Error("Results cannot be issued before the ballot is finished.")

            // Λήψη όλων των voteCommitments από το smart contract
            const voteCommitments = await this.state.ballot.getAllVotes();
            console.log("Blockchain Vote Commitments:", voteCommitments);

            // 🔹 Convert `BigInt` values to strings before sending them in JSON
            const formattedCommitments = voteCommitments.map(vote => vote.toString());

            // Στέλνουμε τον αριθμό τον candidateNum για να βρούμε τα αποτελέσματα
            const response = await fetch("http://127.0.0.1:5000/get-final-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    candidates: this.state.candidateNum,
                    voteCommitments: formattedCommitments,
                    address: this.state.account
                 })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An unknown error occurred."); 
            }

            const voteResultsArray = Object.values(data.voteResults);
            console.log("Vote Results Array:", voteResultsArray);

            // Ενημέρωση του struct Candidate με τα τελικά αποτελέσματα 
            const txResponse = await this.state.ballot.issueBallotResults(voteResultsArray);
            console.log("Transaction hash:", txResponse.hash);

            // Αναμονή για επιβεβαίωση στο blockchain
            const txReceipt = await txResponse.wait();
            console.log("Transaction confirmed in block:", txReceipt.blockNumber);
            console.log("Transaction :", txResponse);

            await this.fetchCandidates()

            this.setState({
                issuedResults: true,
                txMsg: "The final ballot results have been issued!",
                errorTrig: false
            })

        } catch (error) {

            let errorMessage

            if (error.data) {
                console.log("Error: ", error.message); 
                errorMessage = error.reason
                console.log("Error Message: ", error.reason); 
            }
            else {
                // Έλεγχος για μήνυμα σφάλματος
                errorMessage = "Error: " + (error?.reason || error?.message || error);
                console.error(errorMessage);
            }

            window.alert(errorMessage);

            this.setState({
                txMsg: errorMessage, 
                errorTrig: true, 
            });
        }

        this.setState({
            loading: false,
            labelId: 5,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        })

    }

    fetchCandidates = async () => {

        const candidatesCount = await this.state.ballot.candidatesCount();
        const candidatesRaw = await this.state.ballot.getCandidates(); // Παίρνουμε ΟΛΟΥΣ τους υποψηφίους
        
        // Μετατρέπουμε τα δεδομένα σε ένα array με αναγνωρίσιμα strings
        const Candidates = candidatesRaw.map(candidate => ({
            name: ethers.decodeBytes32String(candidate.name),
            voteCount: candidate.voteCount.toString() // Βεβαιωνόμαστε ότι είναι string
        }));
        
        this.setState({ 
            candidateNum: candidatesCount.toString(),
            candidates: Candidates,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        });
    };


    showElectionsResults = async () => {

        this.setState({savedScrollPosition: window.scrollY})

        await this.fetchCandidates()

        if (this.state.issuedResults) {
            let Candidates = this.state.candidates, temp;

            for (let i=0; i < Candidates.length-1; i++) {
                for (let j=0; j < (Candidates.length-i-1); j++) { 
                    if(Candidates[j].voteCount < Candidates[j+1].voteCount){  
                        //swap elements  
                        temp = Candidates[j];  
                        Candidates[j] = Candidates[j+1];  
                        Candidates[j+1] = temp;  
                    } 
                }
            }

            this.setState({finalCandidates: Candidates})
        }

        this.setState({ 
            pressResults: true ,
            curTimestamp: BigInt(Math.floor(Date.now() / 1000)).toString()
        })
    }

    setChairperson = async (prev) => this.setState({ chairperson: !prev});

    constructor(props) {
        super(props)
        this.state = {
            account: '',   // initialize the state as default
            provider: null,
            ballot: null,
            verifier: null,
            tornado: null,
            startVoting: false,
            curTimestamp: '0',
            startupTime: '0',
            endTime: '0',
            loading: true,
            candidateNum: '0',
            voters: '0',
            candidates: [],
            finalCandidates: [],
            issuedResults: false,
            pressResults: false,
            txMsg: '',
            errorTrig: false,
            labelId: 0,
            chairperson: false,
            savedScrollPosition: 0
        }
    }

    // our react goes in here
    render() {
        let content

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
        content =
            <Main 
                stgLimit = {this.state.stgLimit}
                candidateNum = {this.state.candidateNum}
                voters = {this.state.voters}
                registerCandidates = {this.registerCandidates}
                registerVoters = {this.registerVoters}
                voteCandidate = {this.voteCandidate}
                issuedResults = {this.state.issuedResults}
                pressResults = {this.state.pressResults}
                showElectionsResults = {this.showElectionsResults}
                countVotes = {this.countVotes}
                candidates = {this.state.candidates}
                finalCandidates = {this.state.finalCandidates}
                txMsg = {this.state.txMsg}
                errorTrig = {this.state.errorTrig}
                labelId = {this.state.labelId}
                chairperson = {this.state.chairperson}
                proveVote = {this.proveVote}
            />
        
        return (
            <div className='App' style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, minHeight:'85vh'}}>
                    <ParticleSettings />
                </div>
                <Navbar 
                    account = {this.state.account} 
                    chairperson = {this.state.chairperson}
                    setChairperson = {this.setChairperson}
                    curTimestamp = {this.state.curTimestamp} 
                    startupTime = {this.state.startupTime}
                    endTime = {this.state.endTime} 
                    loading = {this.state.loading} 
                    startVoting = {this.state.startVoting} 
                    startElections = {this.startElections}
                    labelId = {this.state.labelId}
                    txMsg = {this.state.txMsg}
                />

                <div id='content' className='container-fluid mt-5' style={{ flex: 1, paddingTop: 30 }}>
                    <div className='row'>
                        <main role='main' className='col-lg-12 ml-auto mr-auto' style={{maxWidth: '100%'}}>
                            <div>
                                {content}
                            </div>
                        </main>
                    </div>
                </div>
                <Footer />
            </div>
        )
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
