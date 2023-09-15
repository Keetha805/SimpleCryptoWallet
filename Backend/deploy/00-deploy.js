// We require the Hardhat Runtime Ehnvironment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { network } = require("hardhat");
const { DEVELOPMENT_NETWORKS } = require("../utils/hardhat-helpers");
const { verify } = require("../utils/verify.js");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  console.log("deploy: ", deploy);
  const { deployer } = await getNamedAccounts();
  console.log("deployer: ", deployer);
  const args = [];

  const DaiMock = await deploy("DAIMock", {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: network.config.blockConfirmations,
  });

  if (
    !DEVELOPMENT_NETWORKS.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(DaiMock.address, args);
  }
};

module.exports.tags = ["all", "mocks"];
