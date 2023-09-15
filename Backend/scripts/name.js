const hre = require("hardhat");

async function read() {
  await hre.deployments.fixture(["mocks"]);

  const { deployer } = await getNamedAccounts();
  const DaiMock = await hre.ethers.getContract("DAIMock");
  console.log("DaiMock: ", DaiMock.address);
  const mintTx = await DaiMock.mint(
    deployer,
    hre.ethers.utils.parseEther("1000")
  );
  // await mintTx.wait(1);

  // const balanceDeployer = await DaiMock.balanceOf(deployer);
  // console.log(
  //   "balanceDeployer: ",
  //   hre.ethers.utils.formatUnits(balanceDeployer, "ether")
  // );
  const name = await DaiMock.name();
  console.log("name: ", name);

  const total = await DaiMock.totalSupply();
  console.log("total: ", total.toString());

  console.log("deployer: ", deployer);
}

read()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
