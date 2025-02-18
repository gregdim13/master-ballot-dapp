const Ballot = artifacts.require('Ballot');

module.exports =  async function(deployer, network, accounts) {
    // deploy Ballot Contract
    await deployer.deploy(Ballot, 60)
    const ballot = await Ballot.deployed()

    // register voters account 1, 2, 3
    await ballot.registerVoters(accounts[1])
    await ballot.registerVoters(accounts[2])
    await ballot.registerVoters(accounts[3])
};


    // // deploy Ballot Contract
    // await deployer.deploy(Ballot, 60)
    // const ballot = await Ballot.deployed()

    // // deploy RWD Contract
    // await deployer.deploy(RWD)
    // const rwd = await RWD.deployed()

    // // deploy DentralBank Contract
    // await deployer.deploy(DecentralBank, rwd.address, tether.address)
    // const decentralBank = await DecentralBank.deployed()

    // // transfer all RWD tokens to Decentral Bank
    // await rwd.transfer(decentralBank.address, '100000000000000000000')