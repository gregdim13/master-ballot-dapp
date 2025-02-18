import "@nomicfoundation/hardhat-toolbox";
// import "@nomiclabs/hardhat-waffle";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {
      loggingEnabled: true // Ενεργοποιεί λεπτομερή logs
    },
  },
};

export default config;


// "npm list for project"
// npm list --depth=0
// "npm list globally"
// npm list -g --depth=0

// έχω τα παρακάτω:
// +-- @nomicfoundation/hardhat-toolbox@5.0.0
// +-- ethers@6.13.5
// +-- hardhat@2.22.18
// -- solidity-coverage@0.8.14