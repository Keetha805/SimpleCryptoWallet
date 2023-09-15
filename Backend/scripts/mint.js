const hre = require("hardhat");

async function mint() {
  // await hre.deployments.fixture(["mocks"]);

  const { deployer } = await hre.getNamedAccounts();
  const DaiMock = await hre.ethers.getContract("DAIMock");
  const mintTx = await DaiMock.mint(
    "0xFd00005B181E777EbbB9436ADf720B7c6EFDfC15",
    hre.ethers.utils.parseEther("100")
  );
  await mintTx.wait(1);

  const balanceDeployer = await DaiMock.totalSupply();
  console.log(
    "balanceDeployer: ",
    hre.ethers.utils.formatUnits(balanceDeployer, "ether")
  );
}

mint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
