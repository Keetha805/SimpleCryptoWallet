const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
  console.log("Verying...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    console.log("Verified!");
  } catch (error) {
    console.log("error: ", error);
  }
};

module.exports = { verify };
