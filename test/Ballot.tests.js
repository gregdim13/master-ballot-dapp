// npx hardhat test

const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");

// const assert = require('assert');
const { ethers: hardhatEthers } = require("hardhat");
const { ethers: ethersLib } = require("ethers");


describe("Ballot", function () {

    let ballot, owner, account1, account2

    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.

    before(async () => {

      // Contracts are deployed using the first signer/account by default
      [owner, account1, account2] = await hardhatEthers.getSigners();
  
      const Ballot = await hardhatEthers.getContractFactory("Ballot");
      ballot = await Ballot.deploy(3600);
  
      return { ballot, owner, account1, account2 };

    })

    // All of the code goes here for testing

    describe('Owner Address Deployment', async () => {
        it('matches owner address successfully', async () => {
            const chairperson = await ballot.chairperson()
            expect(chairperson).to.equal(ethersLib.getAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'));
        })
    })


    describe('Register 3 Canditates', async () => {
        it('has voteCount equal to 0', async () => {

            await ballot.registerCandidates(ethersLib.encodeBytes32String("Coffee"))
            await ballot.registerCandidates(ethersLib.encodeBytes32String("Tea"))
            await ballot.registerCandidates(ethersLib.encodeBytes32String("Chocolate"))

            const proposal1 = await ballot.proposals(0);
            expect(proposal1.voteCount).to.equal(0);

            const proposal2 = await ballot.proposals(1);
            expect(proposal2.voteCount).to.equal(0);

            const proposal3 = await ballot.proposals(2);
            expect(proposal3.voteCount).to.equal(0);
        })
    })

    describe('Register Voters with Account 1 & 2', async () => {
        it('has weight equal to 1', async () => {

            await ballot.registerVoters(account1.address)
            const voter1 = await ballot.voters(account1.address);
            expect(voter1.weight).to.equal(1);

            await ballot.registerVoters(account2.address)
            const voter2 = await ballot.voters(account2.address);
            expect(voter2.weight).to.equal(1);
        })
    })    
    
    describe('Voting of Account 1 & 2', async () => {
        it('has voted both accounts', async () => {

            await ballot.connect(account1).vote(0)
            const voter1 = await ballot.voters(account1.address);
            expect(voter1.voted).to.equal(true);

            await ballot.connect(account2).vote(0)
            const voter2 = await ballot.voters(account2.address);
            expect(voter2.voted).to.equal(true);

        })
    })

    describe('Find who is the Winner', async () => {
        it('check the voteCount and name of Winner Proposal', async () => {

            const winner = await ballot.showWinner()
            const nameWinner = ethers.decodeBytes32String(winner.name)
            const maxVotes = winner.voteCount

            expect(nameWinner).to.equal("Coffee");
            expect(maxVotes).to.equal(2);
            // const curTime = await ballot.startupTime
            // expect(curTime).not.equal(3600)

        })
    })

})




    // async function deployBallot() {
  
    //   // Contracts are deployed using the first signer/account by default
    //   const [owner, account1, account2] = await ethers.getSigners();
  
    //   const Ballot = await ethers.getContractFactory("Ballot");
    //   const ballot = await Ballot.deploy(3600);
  
    //   return { ballot, owner, account1, account2 };
    // }






// contract('Ballot', ([owner, customer]) => {
//     let ballot

//     // function tokens(number) {
//     //     return web3.utils.toWei(number, 'ether')
//     // }

//     before(async () => {
//         // Load Contracts
//         ballot = await Ballot.new(3600)

//         // transfer all RWD tokens to Decentral Bank
//         await ballot.registerVoters(await ethers.getSigners()[1])
//         await ballot.registerVoters(await ethers.getSigners()[2])
//         await ballot.registerVoters(await ethers.getSigners()[3])

//     })

// })

    // // All of the code goes here for testing
    // describe('Mock Tether Deployment', async () => {
    //     it('matches name successfully', async () => {
    //         const name = await tether.name()
    //         assert.equal(name, 'Mock Tether Token')
    //     })
    // })

    // // All of the code goes here for testing
    // describe('RWD Token', async () => {
    //     it('matches name successfully', async () => {
    //         const name = await rwd.name()
    //         assert.equal(name, 'Reward Token')
    //     })
    // })

    // // All of the code goes here for testing
    // describe('decentral Bank deployment', async () => {
    //     it('matches name successfully', async () => {
    //         const name = await decentralBank.name()
    //         assert.equal(name, 'Decentral Bank')
    //     })

    //     it('contract has tokens', async () => {
    //         let balance = await rwd.balanceOf(decentralBank.address)
    //         assert.equal(balance, tokens('1000000'))
    //     })
    // })

    // describe('Yield Farming', async () => {
    //     it('reward tokens for staking', async () => {
    //         let result

    //         // check investers balance
    //         result = await tether.balanceOf(customer)
    //         assert.equal(result.toString(), tokens('100'), 'customer mock wallet balance before staking')

    //         // check staking customer of 100 tokens
    //         await tether.approve(decentralBank.address, tokens('100'), {from: customer})
    //         await decentralBank.depositTokens(tokens('100'), {from: customer})

    //         // check updated balance of customer
    //         result = await tether.balanceOf(customer)
    //         assert.equal(result.toString(), tokens('0'), 'customer mock wallet balance after staking 100 tokens')

    //         // check updated balance of decentral bank
    //         result = await tether.balanceOf(decentralBank.address)
    //         assert.equal(result.toString(), tokens('100'), 'decentral bank mock wallet balance after staking 100 tokens')
        
    //         // is staking balance
    //         result = await decentralBank.isStaking(customer)
    //         assert.equal(result.toString(), 'true', 'customer is staking status after staking')
        
    //         // issue tokens
    //         await decentralBank.issueTokens({from: owner});

    //         // ensure only the owner can issue Tokens
    //         await decentralBank.issueTokens({from: customer}).should.be.rejected;

    //         // Unstake Tokens 
    //         await decentralBank.unstakeTokens({from: customer});

    //         // Check Unstaking Balances
    //         // check updated balance of customer
    //         result = await tether.balanceOf(customer)
    //         assert.equal(result.toString(), tokens('100'), 'customer mock wallet balance after unstaking')

    //         // check updated balance of decentral bank
    //         result = await tether.balanceOf(decentralBank.address)
    //         assert.equal(result.toString(), tokens('0'), 'decentral bank mock wallet balance after staking 100 tokens')
        
    //         // is staking update
    //         result = await decentralBank.isStaking(customer)
    //         assert.equal(result.toString(), 'false', 'customer is no longer staking  after unstaking')

    //     })
    // })

